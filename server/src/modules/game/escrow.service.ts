/**
 * Escrow Service
 * Handles payment escrow, refunds, and payouts for ranked games
 */

import { Injectable, Logger } from '@nestjs/common';
import { Connection, PublicKey, Keypair, Transaction, SystemProgram, LAMPORTS_PER_SOL, sendAndConfirmTransaction } from '@solana/web3.js';
import * as bs58 from 'bs58';
import { Player } from '../../types/game';

interface EscrowEntry {
  roomId: string;
  playerX: string;
  playerO: string;
  amountLamports: number;
  playerXPaid: boolean;
  playerOPaid: boolean;
  playerXSignature?: string;
  playerOSignature?: string;
  status: 'pending' | 'active' | 'completed' | 'refunded';
  createdAt: number;
}

@Injectable()
export class EscrowService {
  private readonly logger = new Logger(EscrowService.name);
  private escrows: Map<string, EscrowEntry> = new Map();
  private connection: Connection;
  private treasuryKeypair: Keypair | null = null;
  private treasuryWallet: PublicKey | null = null;
  private devWallet: PublicKey | null = null;

  constructor() {
    const RPC_URL = process.env.SOLANA_RPC_URL || process.env.EXPO_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com';
    this.connection = new Connection(RPC_URL, 'confirmed');

    const TREASURY_WALLET = process.env.TREASURY_WALLET || process.env.EXPO_PUBLIC_TREASURY_WALLET || '';
    const TREASURY_PRIVATE_KEY = process.env.TREASURY_PRIVATE_KEY || '';
    const DEV_WALLET = process.env.DEV_WALLET || process.env.EXPO_PUBLIC_DEV_WALLET || '';

    if (TREASURY_WALLET) {
      try {
        this.treasuryWallet = new PublicKey(TREASURY_WALLET);
      } catch (error) {
        this.logger.error('Invalid TREASURY_WALLET address');
      }
    }

    if (DEV_WALLET) {
      try {
        this.devWallet = new PublicKey(DEV_WALLET);
      } catch (error) {
        this.logger.warn('Invalid DEV_WALLET address');
      }
    }

    if (TREASURY_PRIVATE_KEY) {
      try {
        let privateKeyBytes: Uint8Array;
        try {
          privateKeyBytes = bs58.decode(TREASURY_PRIVATE_KEY);
        } catch {
          if (TREASURY_PRIVATE_KEY.startsWith('[')) {
            privateKeyBytes = new Uint8Array(JSON.parse(TREASURY_PRIVATE_KEY));
          } else {
            privateKeyBytes = Buffer.from(TREASURY_PRIVATE_KEY, 'hex');
          }
        }
        this.treasuryKeypair = Keypair.fromSecretKey(privateKeyBytes);
        this.logger.log('✅ Treasury keypair loaded for refunds and payouts');
      } catch (error: any) {
        this.logger.warn('⚠️  Failed to load treasury keypair:', error.message);
      }
    }

    this.logger.log('EscrowService initialized');
  }

  getEntryFee(mode: string): number {
    switch (mode) {
      case 'RANKED_IRON':
        return 0.00099 * LAMPORTS_PER_SOL;
      case 'RANKED_NEON':
        return 0.00199 * LAMPORTS_PER_SOL;
      case 'WHALE_WARS':
        return 0.00299 * LAMPORTS_PER_SOL;
      default:
        return 0;
    }
  }

  /**
   * Verify payment transaction
   * @param signature - Transaction signature
   * @param playerId - Player wallet address
   * @param mode - Game mode
   * @returns Verification result
   */
  async verifyPayment(signature: string, playerId: string, mode: string): Promise<{
    valid: boolean;
    amount?: number;
    error?: string;
  }> {
    try {
      const tx = await this.connection.getTransaction(signature, {
        commitment: 'confirmed',
      });

      if (!tx) {
        return { valid: false, error: 'Transaction not found' };
      }

      if (tx.meta?.err) {
        return { valid: false, error: 'Transaction failed' };
      }

      const expectedAmount = this.getEntryFee(mode);
      const treasuryPubkey = this.treasuryWallet;

      if (!treasuryPubkey) {
        return { valid: false, error: 'Treasury wallet not configured' };
      }

      const accountKeys = tx.transaction.message.getAccountKeys ? 
        tx.transaction.message.getAccountKeys().staticAccountKeys : 
        (tx.transaction.message as any).accountKeys;

      if (!accountKeys) {
        return { valid: false, error: 'Cannot parse transaction accounts' };
      }

      const treasuryIndex = accountKeys.findIndex(
        (key: PublicKey) => key.equals(treasuryPubkey)
      );

      if (treasuryIndex === -1) {
        return { valid: false, error: 'Treasury wallet not found in transaction' };
      }

      const preBalance = tx.meta.preBalances[treasuryIndex];
      const postBalance = tx.meta.postBalances[treasuryIndex];
      const receivedAmount = postBalance - preBalance;

      const expectedPotShare = Math.floor(expectedAmount * 0.8);
      const tolerance = 1000;
      
      if (Math.abs(receivedAmount - expectedPotShare) > tolerance) {
        return { valid: false, error: `Payment amount mismatch. Expected ~${expectedPotShare / LAMPORTS_PER_SOL} SOL (80% of ${expectedAmount / LAMPORTS_PER_SOL} SOL), received ${receivedAmount / LAMPORTS_PER_SOL} SOL` };
      }

      return { valid: true, amount: receivedAmount };
    } catch (error: any) {
      this.logger.error('Payment verification error:', error);
      return { valid: false, error: error.message };
    }
  }

  /**
   * Create escrow entry when match is found
   * @param roomId - Room ID
   * @param playerX - Player X wallet address
   * @param playerO - Player O wallet address
   * @param mode - Game mode
   */
  createEscrow(roomId: string, playerX: string, playerO: string, mode: string): void {
    const amountLamports = this.getEntryFee(mode);
    
    this.escrows.set(roomId, {
      roomId,
      playerX,
      playerO,
      amountLamports,
      playerXPaid: false,
      playerOPaid: false,
      status: 'pending',
      createdAt: Date.now(),
    });

    this.logger.log(`Escrow created for room ${roomId}: ${amountLamports / LAMPORTS_PER_SOL} SOL`);
  }

  /**
   * Record payment from player
   * @param roomId - Room ID
   * @param playerId - Player wallet address
   * @param signature - Payment transaction signature
   * @returns Success status
   */
  async recordPayment(roomId: string, playerId: string, signature: string): Promise<{
    success: boolean;
    error?: string;
    allPaid?: boolean;
  }> {
    const escrow = this.escrows.get(roomId);
    if (!escrow) {
      return { success: false, error: 'Escrow not found' };
    }

    if (escrow.status !== 'pending') {
      return { success: false, error: 'Escrow already processed' };
    }

    if (playerId === escrow.playerX) {
      if (escrow.playerXPaid) {
        return { success: false, error: 'Player X already paid' };
      }
      escrow.playerXPaid = true;
      escrow.playerXSignature = signature;
    } else if (playerId === escrow.playerO) {
      if (escrow.playerOPaid) {
        return { success: false, error: 'Player O already paid' };
      }
      escrow.playerOPaid = true;
      escrow.playerOSignature = signature;
    } else {
      return { success: false, error: 'Player not in escrow' };
    }

    const allPaid = escrow.playerXPaid && escrow.playerOPaid;
    if (allPaid) {
      escrow.status = 'active';
      this.logger.log(`All payments received for room ${roomId}`);
    }

    return { success: true, allPaid };
  }

  /**
   * Refund player if opponent disconnects before game starts
   * @param roomId - Room ID
   * @param disconnectedPlayerId - Player who disconnected
   * @returns Refund transaction signature or null
   */
  async refundOnDisconnect(roomId: string, disconnectedPlayerId: string): Promise<string | null> {
    const escrow = this.escrows.get(roomId);
    if (!escrow) {
      this.logger.warn(`Escrow not found for room ${roomId}`);
      return null;
    }

    if (escrow.status !== 'pending' && escrow.status !== 'active') {
      this.logger.warn(`Escrow already processed for room ${roomId}`);
      return null;
    }

    if (!this.treasuryKeypair || !this.treasuryWallet) {
      this.logger.error('Treasury keypair not available for refund');
      return null;
    }

    const refundPlayer = disconnectedPlayerId === escrow.playerX ? escrow.playerO : escrow.playerX;
    const refundAmount = disconnectedPlayerId === escrow.playerX && escrow.playerXPaid
      ? (escrow.playerXSignature ? escrow.amountLamports : 0)
      : disconnectedPlayerId === escrow.playerO && escrow.playerOPaid
      ? (escrow.playerOSignature ? escrow.amountLamports : 0)
      : 0;

    if (refundAmount === 0) {
      this.logger.log(`No refund needed for room ${roomId}`);
      escrow.status = 'refunded';
      return null;
    }

    try {
      const treasuryBalance = await this.connection.getBalance(this.treasuryWallet);
      if (treasuryBalance < refundAmount) {
        this.logger.error(`Insufficient treasury balance for refund: ${treasuryBalance} < ${refundAmount}`);
        return null;
      }

      const recipientPubkey = new PublicKey(refundPlayer);
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: this.treasuryWallet,
          toPubkey: recipientPubkey,
          lamports: refundAmount,
        })
      );

      const signature = await sendAndConfirmTransaction(
        this.connection,
        transaction,
        [this.treasuryKeypair],
        { commitment: 'confirmed' }
      );

      escrow.status = 'refunded';
      this.logger.log(`Refunded ${refundAmount / LAMPORTS_PER_SOL} SOL to ${refundPlayer.slice(0, 8)}...`);
      this.logger.log(`Refund signature: ${signature}`);

      return signature;
    } catch (error: any) {
      this.logger.error(`Refund error for room ${roomId}:`, error);
      return null;
    }
  }

  /**
   * Payout winner when game ends
   * @param roomId - Room ID
   * @param winner - Winner player ('X' or 'O') or null for draw
   * @returns Payout transaction signature or null
   */
  async payoutWinner(roomId: string, winner: Player | null): Promise<string | null> {
    const escrow = this.escrows.get(roomId);
    if (!escrow) {
      this.logger.warn(`Escrow not found for room ${roomId}`);
      return null;
    }

    if (escrow.status !== 'active') {
      this.logger.warn(`Escrow not active for room ${roomId}`);
      return null;
    }

    if (!this.treasuryKeypair || !this.treasuryWallet) {
      this.logger.error('Treasury keypair not available for payout');
      return null;
    }

    const totalPot = escrow.amountLamports * 2;
    const platformFee = Math.floor(totalPot * 0.1);
    const winnerAmount = totalPot - platformFee;
    
    if (winner === null) {
      const refundAmount = escrow.amountLamports;
      const refundX = escrow.playerXPaid && escrow.playerXSignature;
      const refundO = escrow.playerOPaid && escrow.playerOSignature;

      const signatures: string[] = [];
      
      if (refundX) {
        try {
          const recipientPubkey = new PublicKey(escrow.playerX);
          const transaction = new Transaction().add(
            SystemProgram.transfer({
              fromPubkey: this.treasuryWallet,
              toPubkey: recipientPubkey,
              lamports: refundAmount,
            })
          );
          const sig = await sendAndConfirmTransaction(
            this.connection,
            transaction,
            [this.treasuryKeypair],
            { commitment: 'confirmed' }
          );
          signatures.push(sig);
        } catch (error: any) {
          this.logger.error(`Refund error for player X:`, error);
        }
      }

      if (refundO) {
        try {
          const recipientPubkey = new PublicKey(escrow.playerO);
          const transaction = new Transaction().add(
            SystemProgram.transfer({
              fromPubkey: this.treasuryWallet,
              toPubkey: recipientPubkey,
              lamports: refundAmount,
            })
          );
          const sig = await sendAndConfirmTransaction(
            this.connection,
            transaction,
            [this.treasuryKeypair],
            { commitment: 'confirmed' }
          );
          signatures.push(sig);
        } catch (error: any) {
          this.logger.error(`Refund error for player O:`, error);
        }
      }

      escrow.status = 'completed';
      return signatures[0] || null;
    }

    const winnerAddress = winner === 'X' ? escrow.playerX : escrow.playerO;

    try {
      const treasuryBalance = await this.connection.getBalance(this.treasuryWallet);
      if (treasuryBalance < winnerAmount) {
        this.logger.error(`Insufficient treasury balance for payout: ${treasuryBalance} < ${winnerAmount}`);
        return null;
      }

      const recipientPubkey = new PublicKey(winnerAddress);
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: this.treasuryWallet,
          toPubkey: recipientPubkey,
          lamports: Math.floor(winnerAmount),
        })
      );

      const signature = await sendAndConfirmTransaction(
        this.connection,
        transaction,
        [this.treasuryKeypair],
        { commitment: 'confirmed' }
      );

      escrow.status = 'completed';
      this.logger.log(`Paid ${winnerAmount / LAMPORTS_PER_SOL} SOL to winner ${winnerAddress.slice(0, 8)}...`);
      this.logger.log(`Payout signature: ${signature}`);

      return signature;
    } catch (error: any) {
      this.logger.error(`Payout error for room ${roomId}:`, error);
      return null;
    }
  }

  /**
   * Get escrow status
   * @param roomId - Room ID
   * @returns Escrow entry or null
   */
  getEscrow(roomId: string): EscrowEntry | null {
    return this.escrows.get(roomId) || null;
  }

  /**
   * Clean up old escrows (older than 1 hour)
   */
  cleanupOldEscrows(): void {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    for (const [roomId, escrow] of this.escrows.entries()) {
      if (escrow.createdAt < oneHourAgo && escrow.status !== 'active') {
        this.escrows.delete(roomId);
        this.logger.log(`Cleaned up old escrow for room ${roomId}`);
      }
    }
  }
}

