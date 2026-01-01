/**
 * Custom hook for Solana Mobile Wallet Adapter authorization
 * Provides authorizeSession function to reuse existing sessions
 */

import { useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import { PublicKey } from '@solana/web3.js';

function base64ToUint8Array(base64: string): Uint8Array {
  const base64Clean = base64.replace(/[^A-Za-z0-9+/]/g, '');
  
  if (typeof atob !== 'undefined') {
    const binaryString = atob(base64Clean);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  } else {
    const Buffer = require('buffer').Buffer;
    return new Uint8Array(Buffer.from(base64Clean, 'base64'));
  }
}

let Web3MobileWalletType: any;

try {
  const mwa = require('@solana-mobile/mobile-wallet-adapter-protocol-web3js');
  Web3MobileWalletType = mwa.Web3MobileWallet;
} catch (error) {
  console.warn('Failed to load Solana Mobile Wallet Adapter:', error);
}

type Web3MobileWallet = any;

const AUTH_TOKEN_KEY = 'solana_auth_token';
const WALLET_ADDRESS_KEY = 'solana_wallet_address';

export interface AuthorizationResult {
  publicKey: string;
  authToken: string;
  address: string;
}

/**
 * Hook to manage wallet authorization and session reuse
 */
export function useAuthorization() {
  /**
   * Authorize session - reuses existing session if available
   * @param wallet - Web3MobileWallet instance
   * @returns Authorization result with publicKey, authToken, and address
   */
  const authorizeSession = useCallback(
    async (wallet: any): Promise<AuthorizationResult> => {
      if (!wallet || typeof wallet.authorize !== 'function') {
        throw new Error('Wallet is not available or does not support authorization');
      }

      const storedToken = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
      const storedAddress = await SecureStore.getItemAsync(WALLET_ADDRESS_KEY);

      if (storedToken && storedAddress) {
        try {
          console.log('[Authorization] Attempting to reuse existing session...');
          const authResult = await wallet.authorize({
            cluster: 'devnet',
            identity: {
              name: 'Neon X.O',
              uri: 'https://neonxo.solana.seeker',
              icon: 'icon.png',
            },
          });
          
          console.log('[Authorization] Session reuse successful');

          const account = authResult.accounts[0];
          if (!account) {
            throw new Error('No account found in authorization result');
          }

          let publicKey: string;
          if (typeof account === 'string') {
            publicKey = account;
          } else if (account.display_address) {
            publicKey = typeof account.display_address === 'string' 
              ? account.display_address 
              : account.display_address.toString();
          } else if (account.address) {
            const addr = typeof account.address === 'string' ? account.address : account.address.toString();
            if (addr.includes('+') || addr.includes('/') || addr.includes('=')) {
              try {
                const base64Decoded = base64ToUint8Array(addr);
                const pubKeyObj = new PublicKey(base64Decoded);
                publicKey = pubKeyObj.toBase58();
              } catch (error: any) {
                throw new Error(`Failed to decode base64 address: ${error.message}`);
              }
            } else {
              publicKey = addr;
            }
          } else if (account.publicKey) {
            const pk = typeof account.publicKey === 'string' ? account.publicKey : account.publicKey.toString();
            if (pk.includes('+') || pk.includes('/') || pk.includes('=')) {
              try {
                const base64Decoded = base64ToUint8Array(pk);
                const pubKeyObj = new PublicKey(base64Decoded);
                publicKey = pubKeyObj.toBase58();
              } catch (error: any) {
                throw new Error(`Failed to decode base64 publicKey: ${error.message}`);
              }
            } else {
              publicKey = pk;
            }
          } else {
            publicKey = String(account);
          }

          try {
            const pubKeyObj = new PublicKey(publicKey);
            publicKey = pubKeyObj.toBase58();
          } catch (error: any) {
            throw new Error(`Invalid public key format: ${error.message}`);
          }

          if (authResult && authResult.auth_token) {
            await SecureStore.setItemAsync(AUTH_TOKEN_KEY, authResult.auth_token);
            await SecureStore.setItemAsync(WALLET_ADDRESS_KEY, publicKey);
          }

          return {
            publicKey,
            authToken: authResult.auth_token,
            address: publicKey,
          };
        } catch (error: any) {
          console.log('[Authorization] Reusing session failed:', error?.message || error);
          await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
          await SecureStore.deleteItemAsync(WALLET_ADDRESS_KEY);
          
          if (error?.code === -1 || error?.message?.includes('declined') || error?.message?.includes('rejected')) {
            throw new Error('Authorization request was declined. Please try again.');
          }
        }
      }

      console.log('[Authorization] Requesting new authorization...');
      let authResult;
      try {
        authResult = await wallet.authorize({
          cluster: 'devnet',
          identity: {
            name: 'Neon X.O',
            uri: 'https://neonxo.solana.seeker',
            icon: 'icon.png',
          },
        });
        console.log('[Authorization] New authorization successful');
      } catch (error: any) {
        if (error?.code === -1 || error?.message?.includes('declined') || error?.message?.includes('rejected')) {
          throw new Error('Authorization request was declined. Please approve the request in your wallet app.');
        } else if (error?.message?.includes('no installed wallet')) {
          throw new Error('No wallet app found. Please install Mock Wallet or Seeker Vault.');
        } else {
          throw new Error(`Authorization failed: ${error?.message || 'Unknown error'}`);
        }
      }

      const account = authResult.accounts[0];
      if (!account) {
        throw new Error('No account found in authorization result');
      }

      let publicKey: string;
      if (typeof account === 'string') {
        publicKey = account;
      } else if (account.display_address) {
        publicKey = typeof account.display_address === 'string' 
          ? account.display_address 
          : account.display_address.toString();
      } else if (account.address) {
        const addr = typeof account.address === 'string' ? account.address : account.address.toString();
        if (addr.includes('+') || addr.includes('/') || addr.includes('=')) {
          try {
            const base64Decoded = base64ToUint8Array(addr);
            const pubKeyObj = new PublicKey(base64Decoded);
            publicKey = pubKeyObj.toBase58();
          } catch (error: any) {
            throw new Error(`Failed to decode base64 address: ${error.message}`);
          }
        } else {
          publicKey = addr;
        }
      } else if (account.publicKey) {
        const pk = typeof account.publicKey === 'string' ? account.publicKey : account.publicKey.toString();
        if (pk.includes('+') || pk.includes('/') || pk.includes('=')) {
          try {
            const base64Decoded = base64ToUint8Array(pk);
            const pubKeyObj = new PublicKey(base64Decoded);
            publicKey = pubKeyObj.toBase58();
          } catch (error: any) {
            throw new Error(`Failed to decode base64 publicKey: ${error.message}`);
          }
        } else {
          publicKey = pk;
        }
      } else {
        publicKey = String(account);
      }

      try {
        const pubKeyObj = new PublicKey(publicKey);
        publicKey = pubKeyObj.toBase58();
      } catch (error: any) {
        throw new Error(`Invalid public key format: ${error.message}`);
      }

      if (authResult && authResult.auth_token) {
        await SecureStore.setItemAsync(AUTH_TOKEN_KEY, authResult.auth_token);
        await SecureStore.setItemAsync(WALLET_ADDRESS_KEY, publicKey);
      }

      return {
        publicKey,
        authToken: authResult.auth_token,
        address: publicKey,
      };
    },
    []
  );

  /**
   * Clear authorization (logout)
   */
  const clearAuthorization = useCallback(async () => {
    await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
    await SecureStore.deleteItemAsync(WALLET_ADDRESS_KEY);
  }, []);

  return {
    authorizeSession,
    clearAuthorization,
  };
}

