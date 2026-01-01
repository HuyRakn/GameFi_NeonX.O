/**
 * Custom hook for Solana Mobile Wallet Adapter integration
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { PublicKey, Transaction } from '@solana/web3.js';
import * as SecureStore from 'expo-secure-store';
import { AppState, AppStateStatus } from 'react-native';
import { useAuthorization } from './useAuthorization';
import { useConnection } from './useConnection';

let transact: any;
let Web3MobileWalletType: any;

try {
  const mwa = require('@solana-mobile/mobile-wallet-adapter-protocol-web3js');
  transact = mwa.transact;
  Web3MobileWalletType = mwa.Web3MobileWallet;
} catch (error) {
  console.warn('Failed to load Solana Mobile Wallet Adapter:', error);
}

type Web3MobileWallet = any;

const AUTH_TOKEN_KEY = 'solana_auth_token';
const WALLET_ADDRESS_KEY = 'solana_wallet_address';

export interface WalletState {
  publicKey: PublicKey | null;
  connected: boolean;
  balance: number;
  loading: boolean;
}

/**
 * Custom hook for mobile wallet management
 * @returns Wallet state and methods
 */
export function useMobileWallet() {
  const { authorizeSession } = useAuthorization();
  const { connection } = useConnection();
  const [walletState, setWalletState] = useState<WalletState>({
    publicKey: null,
    connected: false,
    balance: 0,
    loading: false,
  });

  /**
   * Connect to wallet
   */
  const connect = useCallback(async () => {
    if (!transact) {
      const errorMessage = 'Solana Mobile Wallet Adapter is not available. Make sure you are using a development build.';
      console.error(errorMessage);
      setWalletState(prev => ({ ...prev, loading: false }));
      throw new Error(errorMessage);
    }

    try {
      setWalletState(prev => ({ ...prev, loading: true }));

      console.log('[Wallet Connect] Starting authorization...');
      const authorizationResult = await transact(async (wallet: Web3MobileWallet) => {
        console.log('[Wallet Connect] Calling authorizeSession...');
        try {
          const result = await authorizeSession(wallet);
          console.log('[Wallet Connect] Authorization successful');
          return result;
        } catch (authError: any) {
          console.error('[Wallet Connect] Authorization error in transact:', authError);
          throw authError;
        }
      });

      if (authorizationResult && authorizationResult.publicKey) {
        try {
          const publicKey = new PublicKey(authorizationResult.publicKey);
          
          setWalletState({
            publicKey,
            connected: true,
            balance: 0,
            loading: false,
          });

          connection.getBalance(publicKey)
            .then(balance => {
              const solBalance = balance / 1e9;
              setWalletState(prev => ({
                ...prev,
                balance: solBalance,
              }));
            })
            .catch(error => {
              console.warn('[Wallet] Failed to fetch balance on connect:', error);
            });
        } catch (parseError: any) {
          console.error('Invalid public key from authorization:', {
            publicKey: authorizationResult.publicKey,
            error: parseError.message,
          });
          setWalletState(prev => ({ ...prev, loading: false }));
          throw new Error(`Invalid wallet address received from authorization: ${parseError.message}`);
        }
      } else {
        console.error('No authorization result or publicKey:', authorizationResult);
        setWalletState(prev => ({ ...prev, loading: false }));
        throw new Error('No authorization result received');
      }
    } catch (error: any) {
      console.error('[Wallet Connect] Connection error:', error);
      
      setWalletState(prev => ({ ...prev, loading: false }));
      
      let errorMessage = 'Failed to connect wallet';
      
      if (error?.code === -1 || error?.message?.includes('declined') || error?.message?.includes('rejected')) {
        errorMessage = 'Authorization was declined. Please try again and approve the request.';
      } else if (error?.message?.includes('no installed wallet')) {
        errorMessage = 'No wallet app found. Please install Mock Wallet or Seeker Vault.';
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      throw new Error(errorMessage);
    }
  }, [authorizeSession, connection]);

  /**
   * Disconnect wallet and clear stored session
   */
  const disconnect = useCallback(async () => {
    try {
      console.log('[Wallet] Disconnecting wallet...');
      await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
      await SecureStore.deleteItemAsync(WALLET_ADDRESS_KEY);
      
      setWalletState({
        publicKey: null,
        connected: false,
        balance: 0,
        loading: false,
      });
      
      console.log('[Wallet] Wallet disconnected successfully');
    } catch (error) {
      console.error('[Wallet] Disconnect error:', error);
      setWalletState({
        publicKey: null,
        connected: false,
        balance: 0,
        loading: false,
      });
    }
  }, []);

  /**
   * Auto-connect on mount if token exists
   */
  useEffect(() => {
    const autoConnect = async () => {
      try {
        const authToken = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
        const walletAddress = await SecureStore.getItemAsync(WALLET_ADDRESS_KEY);

        if (authToken && walletAddress && walletAddress.trim().length > 0) {
          try {
            const publicKey = new PublicKey(walletAddress);

            setWalletState({
              publicKey,
              connected: true,
              balance: 0,
              loading: false,
            });
            
            console.log('[Wallet] Auto-connected to:', publicKey.toBase58().slice(0, 8) + '...');
            
            connection.getBalance(publicKey)
              .then(balance => {
                const solBalance = balance / 1e9;
                setWalletState(prev => ({
                  ...prev,
                  balance: solBalance,
                }));
              })
              .catch(error => {
                console.warn('[Wallet] Failed to fetch balance on auto-connect:', error);
              });
          } catch (parseError: any) {
            console.warn('[Wallet] Invalid stored wallet address, clearing:', parseError);
            await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
            await SecureStore.deleteItemAsync(WALLET_ADDRESS_KEY);
            setWalletState(prev => ({ ...prev, loading: false }));
          }
        } else {
          setWalletState(prev => ({ ...prev, loading: false }));
        }
      } catch (error) {
        console.error('[Wallet] Auto-connect error:', error);
        try {
          await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
          await SecureStore.deleteItemAsync(WALLET_ADDRESS_KEY);
        } catch (clearError) {
          // Ignore clear errors
        }
        setWalletState(prev => ({ ...prev, loading: false }));
      }
    };

    autoConnect();
  }, [connection]);

  /**
   * Refresh balance
   */
  const refreshBalance = useCallback(async () => {
    if (!walletState.publicKey) {
      return;
    }

    try {
      const balance = await connection.getBalance(walletState.publicKey);
      const solBalance = balance / 1e9;
      
      setWalletState(prev => ({
        ...prev,
        balance: solBalance,
      }));
      
      console.log('[Wallet] Balance refreshed:', solBalance.toFixed(4), 'SOL');
    } catch (error: any) {
      // Only log error once, don't spam console
      const errorMsg = error?.message || String(error);
      if (!errorMsg.includes('crypto.getRandomValues')) {
        console.error('[Wallet] Error refreshing balance:', error);
      }
      // Silently fail - balance will remain at previous value
    }
  }, [walletState.publicKey, connection]);

  /**
   * Send transaction
   * @param transaction - Transaction to send
   * @returns Transaction signature
   */
  const sendTransaction = useCallback(
    async (transaction: Transaction): Promise<string | null> => {
      if (!walletState.publicKey) {
        throw new Error('Wallet not connected');
      }

      if (!transact) {
        const errorMessage = 'Solana Mobile Wallet Adapter is not available. Make sure you are using a development build.';
        console.error(errorMessage);
        throw new Error(errorMessage);
      }

      try {
        const signature = await transact(async (wallet: any) => {
          const authorizationResult = await authorizeSession(wallet);
          
          transaction.feePayer = new PublicKey(authorizationResult.publicKey);
          transaction.recentBlockhash = (
            await connection.getLatestBlockhash()
          ).blockhash;

          const signedTransactions = await wallet.signTransactions({
            transactions: [transaction],
          });

          return signedTransactions[0];
        });

        if (signature) {
          const txid = await connection.sendRawTransaction(
            signature.serialize(),
            { skipPreflight: false }
          );
          await connection.confirmTransaction(txid, 'confirmed');
          
          console.log('[Wallet] Transaction confirmed, refreshing balance...');
          await refreshBalance();
          
          return txid;
        }

        return null;
      } catch (error) {
        console.error('Transaction error:', error);
        throw error;
      }
    },
    [walletState.publicKey, connection, authorizeSession, refreshBalance]
  );

  /**
   * Poll balance periodically when connected
   */
  useEffect(() => {
    if (!walletState.connected || !walletState.publicKey) {
      return;
    }

    refreshBalance();

    const interval = setInterval(() => {
      refreshBalance();
    }, 5000);

    return () => {
      clearInterval(interval);
    };
  }, [walletState.connected, walletState.publicKey, refreshBalance]);

  /**
   * Refresh balance when app comes to foreground
   */
  useEffect(() => {
    if (!walletState.connected || !walletState.publicKey) {
      return;
    }

    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        console.log('[Wallet] App came to foreground, refreshing balance...');
        refreshBalance();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [walletState.connected, walletState.publicKey, refreshBalance]);

  return {
    ...walletState,
    connect,
    disconnect,
    sendTransaction,
    refreshBalance,
  };
}

