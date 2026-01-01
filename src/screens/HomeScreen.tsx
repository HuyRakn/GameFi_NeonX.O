/**
 * Home Screen
 * Compact design - everything fits in one screen, no scroll
 * Uses modals and slides for selection
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Pressable,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { NeonButton } from '../components/NeonButton';
import { ModeSelectorModal } from '../components/ModeSelectorModal';
import { InputModal } from '../components/InputModal';
import { StatusIndicator } from '../components/StatusIndicator';
import { NeonModal } from '../components/NeonModal';
import { AlertModal } from '../components/AlertModal';
import { Toast } from '../components/Toast';
import { GameScreen } from './GameScreen';
import { MultiplayerGameScreen } from './MultiplayerGameScreen';
import { GameMode } from '../types/game';
import { useSocket } from '../hooks/useSocket';
import { useWallet } from '../contexts/WalletContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export function HomeScreen() {
  const { connected } = useSocket();
  const { publicKey, connected: walletConnected, connect: connectWallet, disconnect: disconnectWallet, balance, loading: walletLoading } = useWallet();
  const [currentScreen, setCurrentScreen] = useState<'home' | 'game' | 'multiplayer'>('home');
  const [selectedMode, setSelectedMode] = useState<GameMode | null>(null);
  const [roomId, setRoomId] = useState<string>('');
  
  // Modal states
  const [showPracticeModal, setShowPracticeModal] = useState(false);
  const [showCompetitiveModal, setShowCompetitiveModal] = useState(false);
  const [showJoinRoomModal, setShowJoinRoomModal] = useState(false);
  const [showConnectWalletModal, setShowConnectWalletModal] = useState(false);
  const [showWalletInfoModal, setShowWalletInfoModal] = useState(false);
  const [alertModal, setAlertModal] = useState<{
    visible: boolean;
    title: string;
    message: string;
    variant: 'primary' | 'secondary' | 'danger' | 'success';
  }>({
    visible: false,
    title: '',
    message: '',
    variant: 'primary',
  });
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
  }>({
    visible: false,
    message: '',
    type: 'info',
  });

  const logoScale = useSharedValue(1);

  React.useEffect(() => {
    logoScale.value = withSpring(1, { damping: 15, stiffness: 200 });
  }, []);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
  }));

  /**
   * Get player ID from wallet address
   */
  const playerId = publicKey?.toBase58() || '';

  /**
   * Handle game mode selection
   */
  const handleSelectMode = (mode: GameMode) => {
    if (mode === 'TRAINING' || mode === 'BOT_BATTLE') {
      setSelectedMode(mode);
      setCurrentScreen('game');
    } else {
      if (!walletConnected || !publicKey) {
        setShowConnectWalletModal(true);
        return;
      }
      setSelectedMode(mode);
      setCurrentScreen('multiplayer');
    }
  };

  /**
   * Handle join room
   */
  const handleJoinRoom = () => {
    if (!roomId.trim()) {
      return;
    }
    if (!walletConnected || !publicKey) {
      setShowConnectWalletModal(true);
      return;
    }
    setSelectedMode('TRAINING');
    setCurrentScreen('multiplayer');
  };

  /**
   * Handle connect wallet
   */
  const handleConnectWallet = async () => {
    try {
      await connectWallet();
      setShowConnectWalletModal(false);
    } catch (error: any) {
      console.error('Failed to connect wallet:', error);
    }
  };

  /**
   * Handle disconnect wallet
   */
  const handleDisconnectWallet = async () => {
    try {
      await disconnectWallet();
    } catch (error: any) {
      console.error('Failed to disconnect wallet:', error);
    }
  };

  /**
   * Handle back to home
   */
  const handleBack = () => {
    setCurrentScreen('home');
    setSelectedMode(null);
  };

  if (currentScreen === 'game' && selectedMode) {
    return <GameScreen mode={selectedMode} onBack={handleBack} />;
  }

  if (currentScreen === 'multiplayer' && selectedMode) {
    return (
      <MultiplayerGameScreen
        mode={selectedMode}
        roomId={roomId || undefined}
        onBack={handleBack}
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* Compact Hero Section */}
      <Animated.View style={[styles.hero, logoAnimatedStyle]}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoNeon}>NEON</Text>
          <Text style={styles.logoXO}>X.O</Text>
        </View>
        <View style={styles.statusRow}>
          <StatusIndicator
            status={connected ? 'connected' : 'disconnected'}
            label={connected ? 'Online' : 'Offline'}
          />
        </View>
      </Animated.View>

      {/* Main Action Buttons - Fit in screen */}
      <View style={styles.actionsContainer}>
        {/* Wallet Connection Button */}
        <Pressable
          style={styles.actionButton}
          onPress={() => {
            if (walletConnected) {
              setShowWalletInfoModal(true);
            } else {
              setShowConnectWalletModal(true);
            }
          }}
        >
          <View style={[
            styles.actionButtonContent, 
            walletConnected ? styles.walletButton : styles.walletButtonDisconnected
          ]}>
            <Ionicons 
              name={walletConnected ? "wallet" : "wallet-outline"} 
              size={24} 
              color={walletConnected ? "#00f3ff" : "#71717a"} 
            />
            <View style={styles.actionButtonTextContainer}>
              <Text style={styles.actionButtonTitle}>
                {walletConnected ? "Wallet Connected" : "Connect Wallet"}
              </Text>
              <Text style={styles.actionButtonSubtitle} numberOfLines={1}>
                {walletConnected && publicKey 
                  ? `${publicKey.toBase58().slice(0, 8)}...${publicKey.toBase58().slice(-6)} • ${balance.toFixed(4)} SOL`
                  : walletLoading 
                  ? 'Connecting...'
                  : 'Required for Competitive modes'}
              </Text>
            </View>
            {!walletConnected && (
              <Ionicons name="chevron-forward" size={20} color="#71717a" />
            )}
          </View>
        </Pressable>

        {/* Practice Button */}
        <Pressable
          style={styles.actionButton}
          onPress={() => setShowPracticeModal(true)}
        >
          <View style={[styles.actionButtonContent, styles.practiceButton]}>
            <Ionicons name="fitness" size={28} color="#00f3ff" />
            <View style={styles.actionButtonTextContainer}>
              <Text style={styles.actionButtonTitle}>Practice</Text>
              <Text style={styles.actionButtonSubtitle}>Offline Training</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#71717a" />
          </View>
        </Pressable>

        {/* Competitive Button */}
        <Pressable
          style={styles.actionButton}
          onPress={() => {
            if (!walletConnected || !publicKey) {
              setShowConnectWalletModal(true);
            } else {
              setShowCompetitiveModal(true);
            }
          }}
        >
          <View style={[styles.actionButtonContent, styles.competitiveButton]}>
            <Ionicons name="trophy" size={28} color="#ff00ff" />
            <View style={styles.actionButtonTextContainer}>
              <Text style={styles.actionButtonTitle}>Competitive</Text>
              <Text style={styles.actionButtonSubtitle}>PVP Ranked</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#71717a" />
          </View>
        </Pressable>

        {/* Quick Join Button */}
        <Pressable
          style={styles.actionButton}
          onPress={() => {
            if (!walletConnected || !publicKey) {
              setShowConnectWalletModal(true);
            } else {
              setShowJoinRoomModal(true);
            }
          }}
        >
          <View style={[styles.actionButtonContent, styles.joinButton]}>
            <Ionicons name="people" size={24} color="#ff8a00" />
            <View style={styles.actionButtonTextContainer}>
              <Text style={styles.actionButtonTitle}>Quick Join</Text>
              <Text style={styles.actionButtonSubtitle}>Join Room by ID</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#71717a" />
          </View>
        </Pressable>
      </View>

      {/* Modals */}
      <ModeSelectorModal
        visible={showPracticeModal}
        onClose={() => setShowPracticeModal(false)}
        onSelectMode={handleSelectMode}
        title="Practice Modes"
        modes={[
          {
            mode: 'TRAINING',
            title: 'Training',
            subtitle: '3x3 Infinite • Free • Practice Mode',
            icon: 'fitness',
            variant: 'primary',
            isOffline: true,
          },
          {
            mode: 'BOT_BATTLE',
            title: 'Bot Battle',
            subtitle: '6x6 Arena • Free • Challenge AI',
            icon: 'game-controller',
            variant: 'secondary',
            isOffline: true,
          },
        ]}
      />

      <ModeSelectorModal
        visible={showCompetitiveModal}
        onClose={() => setShowCompetitiveModal(false)}
        onSelectMode={handleSelectMode}
        title="Competitive Modes"
        modes={[
          {
            mode: 'RANKED_IRON',
            title: 'Ranked Iron',
            subtitle: '3x3 Infinite • Fast Paced',
            icon: 'trophy',
            variant: 'primary',
            entryFee: '0.001 SOL',
            reward: '0.0018 SOL',
          },
          {
            mode: 'RANKED_NEON',
            title: 'Ranked Neon',
            subtitle: '6x6 Arena • Skill Based',
            icon: 'star',
            variant: 'secondary',
            entryFee: '0.002 SOL',
            reward: '0.0036 SOL',
          },
          {
            mode: 'WHALE_WARS',
            title: 'Whale Wars',
            subtitle: '8x8 Gomoku • High Stakes',
            icon: 'flame',
            variant: 'danger',
            entryFee: '0.003 SOL',
            reward: '0.0054 SOL',
          },
        ]}
      />

      {/* Connect Wallet Modal */}
      {showConnectWalletModal && (
        <NeonModal
          visible={showConnectWalletModal}
          onClose={() => setShowConnectWalletModal(false)}
          title="Connect Wallet"
          variant="primary"
        >
          <View style={styles.walletModalContent}>
            <Text style={styles.walletModalText}>
              Connect your Solana wallet to play Competitive modes and earn rewards.
            </Text>
            <NeonButton
              title={walletLoading ? "Connecting..." : "Connect Wallet"}
              onPress={handleConnectWallet}
              variant="primary"
              fullWidth
              disabled={walletLoading}
            />
          </View>
        </NeonModal>
      )}

      {/* Wallet Info Modal */}
      {showWalletInfoModal && walletConnected && publicKey && (
        <NeonModal
          visible={showWalletInfoModal}
          onClose={() => setShowWalletInfoModal(false)}
          title="Wallet Info"
          variant="primary"
        >
          <View style={styles.walletInfoContent}>
            <View style={styles.walletInfoSection}>
              <Text style={styles.walletInfoLabel}>Wallet Address</Text>
              <View style={styles.walletAddressContainer}>
                <Text style={styles.walletAddressText}>
                  {`${publicKey.toBase58().slice(0, 8)}...${publicKey.toBase58().slice(-8)}`}
                </Text>
                <Pressable
                  onPress={async () => {
                    try {
                      // Try expo-clipboard first
                      const Clipboard = (await import('expo-clipboard')).default;
                      await Clipboard.setStringAsync(publicKey.toBase58());
                      setToast({
                        visible: true,
                        message: 'Wallet address copied to clipboard',
                        type: 'success',
                      });
                    } catch (error: any) {
                      console.error('Failed to copy:', error);
                      // Fallback: show address in modal for manual copy
                      setAlertModal({
                        visible: true,
                        title: 'Wallet Address',
                        message: `Tap and hold to copy:\n\n${publicKey.toBase58()}`,
                        variant: 'primary',
                      });
                    }
                  }}
                  style={styles.copyButton}
                >
                  <Ionicons name="copy-outline" size={20} color="#00f3ff" />
                </Pressable>
              </View>
            </View>

            <View style={styles.walletInfoSection}>
              <Text style={styles.walletInfoLabel}>Balance</Text>
              <Text style={styles.walletBalanceText}>
                {balance.toFixed(4)} SOL
              </Text>
            </View>

            <View style={styles.walletInfoSection}>
              <Text style={styles.walletInfoLabel}>Network</Text>
              <Text style={styles.walletNetworkText}>Devnet</Text>
            </View>

            <View style={styles.walletInfoButtons}>
              <NeonButton
                title="Disconnect"
                onPress={async () => {
                  await handleDisconnectWallet();
                  setShowWalletInfoModal(false);
                }}
                variant="danger"
                fullWidth
              />
            </View>
          </View>
        </NeonModal>
      )}

      <InputModal
        visible={showJoinRoomModal}
        onClose={() => setShowJoinRoomModal(false)}
        title="Join Room"
        label="Room ID"
        placeholder="Enter Room ID"
        value={roomId}
        onChangeText={setRoomId}
        onSubmit={handleJoinRoom}
        submitText="Join"
        variant="secondary"
      />

      {/* Alert Modal */}
      <AlertModal
        visible={alertModal.visible}
        onClose={() => setAlertModal({ ...alertModal, visible: false })}
        title={alertModal.title}
        message={alertModal.message}
        variant={alertModal.variant}
      />

      {/* Toast Notification */}
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast({ ...toast, visible: false })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090b',
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 20,
  },
  hero: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  logoNeon: {
    fontSize: 96, // Doubled from 48
    fontWeight: '900',
    color: '#00f3ff',
    fontFamily: 'monospace',
    textShadowColor: '#00f3ff',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 32, // Doubled shadow radius
    letterSpacing: 8, // Doubled letter spacing
  },
  logoXO: {
    fontSize: 72, // Doubled from 36
    fontWeight: '900',
    color: '#ff00ff',
    fontFamily: 'monospace',
    textShadowColor: '#ff00ff',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 32, // Doubled shadow radius
    letterSpacing: 6, // Doubled letter spacing
    marginTop: -12, // Doubled margin
  },
  statusRow: {
    marginTop: 8,
  },
  actionsContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: 16,
  },
  actionButton: {
    marginBottom: 4,
  },
  actionButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1.5,
    backgroundColor: '#18181b',
    gap: 16,
  },
  walletButton: {
    borderColor: '#00f3ff',
  },
  walletButtonDisconnected: {
    borderColor: '#27272a',
  },
  disconnectButton: {
    padding: 8,
    borderRadius: 8,
  },
  walletModalContent: {
    gap: 16,
  },
  walletModalText: {
    color: '#a1a1aa',
    fontSize: 14,
    fontFamily: 'monospace',
    textAlign: 'center',
    lineHeight: 20,
  },
  walletInfoContent: {
    gap: 24,
  },
  walletInfoSection: {
    gap: 8,
  },
  walletInfoLabel: {
    fontSize: 12,
    color: '#71717a',
    fontFamily: 'monospace',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  walletAddressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    gap: 12,
  },
  walletAddressText: {
    flex: 1,
    fontSize: 14,
    color: '#ffffff',
    fontFamily: 'monospace',
    letterSpacing: 0.5,
  },
  copyButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#27272a',
  },
  walletBalanceText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#00f3ff',
    fontFamily: 'monospace',
    letterSpacing: 1,
  },
  walletNetworkText: {
    fontSize: 16,
    color: '#a1a1aa',
    fontFamily: 'monospace',
  },
  walletInfoButtons: {
    marginTop: 8,
  },
  practiceButton: {
    borderColor: '#00f3ff',
  },
  competitiveButton: {
    borderColor: '#ff00ff',
  },
  joinButton: {
    borderColor: '#ff8a00',
  },
  actionButtonTextContainer: {
    flex: 1,
  },
  actionButtonTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    fontFamily: 'monospace',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  actionButtonSubtitle: {
    fontSize: 13,
    color: '#71717a',
    fontFamily: 'monospace',
  },
});
