/**
 * Custom hook to manage Solana Connection
 * Provides a singleton Connection instance to Devnet
 */

import { useMemo } from 'react';
import { Connection } from '@solana/web3.js';

const DEVNET_RPC = process.env.EXPO_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com';

/**
 * Hook to get Solana Connection instance
 * Uses memoization to prevent recreating connection on every render
 * @returns Connection instance
 */
export function useConnection(): { connection: Connection } {
  const connection = useMemo(() => {
    return new Connection(DEVNET_RPC, 'confirmed');
  }, []);

  return { connection };
}

