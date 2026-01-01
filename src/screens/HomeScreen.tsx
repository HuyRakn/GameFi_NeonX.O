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
import { GameScreen } from './GameScreen';
import { MultiplayerGameScreen } from './MultiplayerGameScreen';
import { GameMode } from '../types/game';
import { useSocket } from '../hooks/useSocket';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export function HomeScreen() {
  const { connected } = useSocket();
  const [currentScreen, setCurrentScreen] = useState<'home' | 'game' | 'multiplayer'>('home');
  const [selectedMode, setSelectedMode] = useState<GameMode | null>(null);
  const [playerId, setPlayerId] = useState<string>('');
  const [roomId, setRoomId] = useState<string>('');
  
  // Modal states
  const [showPracticeModal, setShowPracticeModal] = useState(false);
  const [showCompetitiveModal, setShowCompetitiveModal] = useState(false);
  const [showPlayerIdModal, setShowPlayerIdModal] = useState(false);
  const [showJoinRoomModal, setShowJoinRoomModal] = useState(false);

  const logoScale = useSharedValue(1);

  React.useEffect(() => {
    logoScale.value = withSpring(1, { damping: 15, stiffness: 200 });
  }, []);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
  }));

  /**
   * Handle game mode selection
   */
  const handleSelectMode = (mode: GameMode) => {
    if (mode === 'TRAINING' || mode === 'BOT_BATTLE') {
      setSelectedMode(mode);
      setCurrentScreen('game');
    } else {
      if (!playerId.trim()) {
        setShowPlayerIdModal(true);
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
    if (!roomId.trim() || !playerId.trim()) {
      if (!playerId.trim()) {
        setShowPlayerIdModal(true);
      }
      return;
    }
    setSelectedMode('TRAINING');
    setCurrentScreen('multiplayer');
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
        playerId={playerId || 'player-' + Date.now()}
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
        {/* Player ID Button */}
        <Pressable
          style={styles.actionButton}
          onPress={() => setShowPlayerIdModal(true)}
        >
          <View style={[styles.actionButtonContent, styles.playerIdButton]}>
            <Ionicons name="person" size={24} color="#00f3ff" />
            <View style={styles.actionButtonTextContainer}>
              <Text style={styles.actionButtonTitle}>Player ID</Text>
              <Text style={styles.actionButtonSubtitle}>
                {playerId || 'Tap to set'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#71717a" />
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
            if (!playerId.trim()) {
              setShowPlayerIdModal(true);
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
            if (!playerId.trim()) {
              setShowPlayerIdModal(true);
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
            entryFee: '0.05 SOL',
            reward: '0.09 SOL',
          },
          {
            mode: 'RANKED_NEON',
            title: 'Ranked Neon',
            subtitle: '6x6 Arena • Skill Based',
            icon: 'star',
            variant: 'secondary',
            entryFee: '0.5 SOL',
            reward: '0.95 SOL',
          },
          {
            mode: 'WHALE_WARS',
            title: 'Whale Wars',
            subtitle: '8x8 Gomoku • High Stakes',
            icon: 'flame',
            variant: 'danger',
            entryFee: '5.0 SOL',
            reward: '9.8 SOL',
          },
        ]}
      />

      <InputModal
        visible={showPlayerIdModal}
        onClose={() => setShowPlayerIdModal(false)}
        title="Player Identity"
        label="Wallet Address / Player ID"
        placeholder="Enter your identifier"
        value={playerId}
        onChangeText={setPlayerId}
        onSubmit={() => setShowPlayerIdModal(false)}
        submitText="Save"
        variant="primary"
      />

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
  playerIdButton: {
    borderColor: '#00f3ff',
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
