/**
 * Custom hook for handling game-related on-chain transactions
 * Handles payment for entry fees in ranked modes
 */

import { useCallback, useState } from 'react';
import {
  Transaction,
  TransactionInstruction,
  SystemProgram,
  PublicKey,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import { useConnection } from './useConnection';
import { useAuthorization } from './useAuthorization';
import { useWallet } from '../contexts/WalletContext';
import { GameMode } from '../types/game';

const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');

/**
 * Creates a memo instruction for transaction details
 * @param memo - Memo text to include in transaction
 * @param feePayer - Public key of the fee payer
 * @returns Transaction instruction for memo program
 */
function createMemoInstruction(memo: string, feePayer: PublicKey): TransactionInstruction {
  return new TransactionInstruction({
    programId: MEMO_PROGRAM_ID,
    keys: [
      {
        pubkey: feePayer,
        isSigner: true,
        isWritable: false,
      },
    ],
    data: Buffer.from(memo, 'utf8'),
  });
}

/**
 * Formats transaction details for memo
 * @param transactionType - Type of transaction
 * @param mode - Game mode
 * @param amountSol - Amount in SOL
 * @returns Formatted memo string
 */
function formatTransactionMemo(
  transactionType: 'entry_fee',
  mode: GameMode,
  amountSol: number
): string {
  const modeLabels: Record<GameMode, string> = {
    TRAINING: 'Training',
    BOT_BATTLE: 'Bot Battle',
    RANKED_IRON: 'Ranked Iron',
    RANKED_NEON: 'Ranked Neon',
    WHALE_WARS: 'Whale Wars',
  };

  return `Neon X.O - Entry Fee - ${modeLabels[mode]} - ${amountSol} SOL`;
}

function getEntryFee(mode: GameMode): number {
  switch (mode) {
    case 'RANKED_IRON':
      return 0.00099;
    case 'RANKED_NEON':
      return 0.00199;
    case 'WHALE_WARS':
      return 0.00299;
    default:
      return 0;
  }
}

let transact: any;

try {
  const mwa = require('@solana-mobile/mobile-wallet-adapter-protocol-web3js');
  transact = mwa.transact;
} catch (error) {
  console.warn('Failed to load Solana Mobile Wallet Adapter:', error);
}

/**
 * Gets treasury wallet address from environment variables
 * @returns Treasury wallet public key
 * @throws Error if TREASURY_WALLET is not configured or invalid
 */
const getTreasuryWallet = (): PublicKey => {
  const treasuryAddress = process.env.EXPO_PUBLIC_TREASURY_WALLET;
  if (!treasuryAddress) {
    throw new Error('TREASURY_WALLET not configured in environment variables');
  }
  try {
    return new PublicKey(treasuryAddress);
  } catch (error) {
    throw new Error(`Invalid TREASURY_WALLET address: ${treasuryAddress}`);
  }
};

/**
 * Gets dev wallet address from environment variables
 * @returns Dev wallet public key or null if not configured
 */
const getDevWallet = (): PublicKey | null => {
  const devAddress = process.env.EXPO_PUBLIC_DEV_WALLET;
  if (!devAddress) {
    console.warn('[Game Transactions] DEV_WALLET not configured. Dev fees will go to treasury wallet.');
    return null;
  }
  try {
    return new PublicKey(devAddress);
  } catch (error) {
    console.warn(`[Game Transactions] Invalid DEV_WALLET address: ${devAddress}. Dev fees will go to treasury wallet.`);
    return null;
  }
};

/**
 * Gets backend API URL from environment variables
 * @returns Backend URL string
 */
const getBackendUrl = (): string => {
  return process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:3000';
};

export interface TransactionResult {
  success: boolean;
  signature?: string;
  error?: string;
}

export interface UseGameTransactionsReturn {
  payEntryFee: (mode: GameMode) => Promise<TransactionResult>;
  isProcessing: boolean;
}

/**
 * Custom hook for game transactions
 * Provides functions to pay entry fees for ranked modes
 */
export function useGameTransactions(): UseGameTransactionsReturn {
  const { connection } = useConnection();
  const { authorizeSession } = useAuthorization();
  const [isProcessing, setIsProcessing] = useState(false);
  
  let refreshBalance: (() => Promise<void>) | undefined;
  try {
    const wallet = useWallet();
    refreshBalance = wallet.refreshBalance;
  } catch (error: any) {
    console.warn('[Game Transactions] WalletContext not available:', error?.message);
    refreshBalance = undefined;
  }

  /**
   * Creates and sends a transfer transaction for entry fee
   * @param amountLamports - Total amount the user pays in lamports
   * @param mode - Game mode
   * @returns Promise resolving to transaction result
   */
  const sendEntryFeeTransaction = useCallback(
    async (
      amountLamports: number,
      mode: GameMode
    ): Promise<TransactionResult> => {
      if (!transact) {
        setIsProcessing(false);
        const errorMessage = 'Solana Mobile Wallet Adapter is not available. Make sure you are using a development build.';
        console.error(errorMessage);
        return {
          success: false,
          error: errorMessage,
        };
      }

      setIsProcessing(true);

      try {
        const treasuryWallet = getTreasuryWallet();
        const devWallet = getDevWallet();
        let userPublicKey: PublicKey | null = null;
        let signature: string | null = null;

        await transact(async (wallet: any) => {
          const authorizationResult = await authorizeSession(wallet);
          if (!authorizationResult) {
            throw new Error('Failed to authorize wallet session');
          }

          const publicKey = new PublicKey(authorizationResult.publicKey);
          userPublicKey = publicKey;

          const balance = await connection.getBalance(userPublicKey);
          console.log(`Transaction check - User balance: ${balance / LAMPORTS_PER_SOL} SOL, Required: ${amountLamports / LAMPORTS_PER_SOL} SOL`);
          if (balance < amountLamports) {
            throw new Error(`Insufficient balance. Have: ${balance / LAMPORTS_PER_SOL} SOL, Need: ${amountLamports / LAMPORTS_PER_SOL} SOL`);
          }

          const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');

          const transaction = new Transaction({
            feePayer: userPublicKey,
            recentBlockhash: blockhash,
          });

          let potShareLamports = Math.floor(amountLamports * 0.8);
          let devShareLamports = amountLamports - potShareLamports;

          if (!devWallet) {
            potShareLamports = amountLamports;
            devShareLamports = 0;
          }

          if (potShareLamports > 0) {
            transaction.add(
              SystemProgram.transfer({
                fromPubkey: userPublicKey,
                toPubkey: treasuryWallet,
                lamports: potShareLamports,
              })
            );
          }

          if (devWallet && devShareLamports > 0) {
            transaction.add(
              SystemProgram.transfer({
                fromPubkey: userPublicKey,
                toPubkey: devWallet,
                lamports: devShareLamports,
              })
            );
          }

          const amountSol = amountLamports / LAMPORTS_PER_SOL;
          const memoText = formatTransactionMemo('entry_fee', mode, amountSol);
          const memoInstruction = createMemoInstruction(memoText, userPublicKey);
          transaction.add(memoInstruction);

          const signedTransactions = await wallet.signTransactions({
            transactions: [transaction],
          });

          const signedTx = signedTransactions[0];

          if (!signedTx.signature) {
            throw new Error('Transaction was not signed by wallet');
          }

          console.log(`Sending transaction: ${amountSol} SOL from ${userPublicKey.toBase58()} to ${treasuryWallet.toBase58()}`);
          signature = await connection.sendRawTransaction(
            signedTx.serialize({ requireAllSignatures: true }),
            {
              skipPreflight: false,
              maxRetries: 3,
            }
          );
          console.log('Transaction sent, signature:', signature);

          const confirmation = await connection.confirmTransaction(
            {
              signature,
              blockhash,
              lastValidBlockHeight,
            },
            'confirmed'
          );

          if (confirmation.value.err) {
            console.error('Transaction confirmation error:', confirmation.value.err);
            throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
          }

          if (confirmation.value === null) {
            throw new Error('Transaction confirmation returned null');
          }

          console.log('Transaction confirmed successfully:', signature);
          return signature;
        });

        if (!signature) {
          throw new Error('Transaction signature not received');
        }

        if (!userPublicKey) {
          throw new Error('User public key not available');
        }

        const finalPublicKey: PublicKey = userPublicKey;

        try {
          const txStatus = await connection.getSignatureStatus(signature);
          if (txStatus.value?.err) {
            console.error('Transaction status check failed:', txStatus.value.err);
            throw new Error(`Transaction failed on-chain: ${JSON.stringify(txStatus.value.err)}`);
          }
        } catch (statusError) {
          console.warn('Failed to verify transaction status:', statusError);
        }

        try {
          const backendUrl = getBackendUrl();
          const verifyResponse = await fetch(`${backendUrl}/game/verify-payment`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              signature,
              transactionType: 'entry_fee',
              amount: amountLamports,
              publicKey: finalPublicKey.toBase58(),
              mode,
            }),
          });

          if (!verifyResponse.ok) {
            console.warn('Backend verification failed, but transaction was successful on-chain');
          }
        } catch (backendError) {
          console.warn('Backend verification error:', backendError);
        }

        if (refreshBalance) {
          try {
            console.log('[Game Transactions] Refreshing wallet balance...');
            await refreshBalance();
          } catch (balanceError) {
            console.warn('[Game Transactions] Failed to refresh balance:', balanceError);
          }
        }

        setIsProcessing(false);
        return {
          success: true,
          signature,
        };
      } catch (error: any) {
        setIsProcessing(false);

        let errorMessage = 'Transaction failed';
        if (error?.message?.includes('User rejected') || error?.message?.includes('rejected')) {
          errorMessage = 'User rejected the transaction';
        } else if (error?.message?.includes('Insufficient balance') || error?.message?.includes('insufficient funds')) {
          errorMessage = 'Insufficient balance';
        } else if (error?.message) {
          errorMessage = error.message;
        }

        return {
          success: false,
          error: errorMessage,
        };
      }
    },
    [connection, authorizeSession, refreshBalance]
  );

  /**
   * Pays entry fee to start a ranked game
   * @param mode - Game mode
   * @returns Promise resolving to transaction result
   */
  const payEntryFee = useCallback(async (mode: GameMode): Promise<TransactionResult> => {
    const entryFee = getEntryFee(mode);
    if (entryFee === 0) {
      return {
        success: false,
        error: 'This mode does not require an entry fee',
      };
    }
    const amountLamports = entryFee * LAMPORTS_PER_SOL;
    return sendEntryFeeTransaction(amountLamports, mode);
  }, [sendEntryFeeTransaction]);

  return {
    payEntryFee,
    isProcessing,
  };
}

