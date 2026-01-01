import { Platform } from 'react-native';

/**
 * Get backend URL from environment variables
 * For Android emulator, use 10.0.2.2 instead of localhost
 * @returns Backend URL string
 */
export function getBackendUrl(): string {
  const envUrl = process.env.EXPO_PUBLIC_BACKEND_URL;
  if (envUrl) {
    return envUrl;
  }

  // Android emulator uses 10.0.2.2 to access host machine's localhost
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3000';
  }

  // iOS simulator and web can use localhost
  return 'http://localhost:3000';
}

/**
 * Get Socket.io URL from environment variables
 * For Android emulator, use 10.0.2.2 instead of localhost
 * @returns Socket.io URL string
 */
export function getSocketUrl(): string {
  const envUrl = process.env.EXPO_PUBLIC_SOCKET_URL;
  if (envUrl) {
    // Replace localhost with 10.0.2.2 for Android
    if (Platform.OS === 'android' && envUrl.includes('localhost')) {
      return envUrl.replace('localhost', '10.0.2.2');
    }
    return envUrl;
  }

  // Android emulator uses 10.0.2.2 to access host machine's localhost
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3000';
  }

  // iOS simulator and web can use localhost
  return 'http://localhost:3000';
}

