/**
 * Wallet Context - Share wallet state across all components
 * Uses real Solana Mobile Wallet Adapter
 */

import React, { createContext, useContext, ReactNode } from 'react';
import { Transaction } from '@solana/web3.js';
import { useMobileWallet } from '../hooks/useMobileWallet';

export interface WalletState {
  publicKey: import('@solana/web3.js').PublicKey | null;
  connected: boolean;
  balance: number;
  loading: boolean;
}

interface WalletContextType extends WalletState {
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  sendTransaction: (transaction: Transaction) => Promise<string | null>;
  refreshBalance: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

/**
 * Wallet Provider component
 * @param children - React children
 */
export function WalletProvider({ children }: { children: ReactNode }) {
  const wallet = useMobileWallet();

  return (
    <WalletContext.Provider
      value={{
        publicKey: wallet.publicKey,
        connected: wallet.connected,
        balance: wallet.balance,
        loading: wallet.loading,
        connect: wallet.connect,
        disconnect: wallet.disconnect,
        sendTransaction: wallet.sendTransaction,
        refreshBalance: wallet.refreshBalance,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

/**
 * Hook to use wallet context
 * @returns Wallet context value
 * @throws Error if used outside WalletProvider
 */
export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}

