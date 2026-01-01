/**
 * Mode Selector Modal
 * Slide-based mode selection with smooth animations
 */

import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  Pressable,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
  SharedValue,
  useAnimatedScrollHandler,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { NeonModal } from './NeonModal';
import { GameMode } from '../types/game';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MODAL_WIDTH = SCREEN_WIDTH * 0.9;
const MODAL_CONTENT_PADDING = 24; // From NeonModal content padding
const NAV_BUTTON_WIDTH = 44;
const NAV_BUTTON_MARGIN = 8;
const MODE_CARD_WIDTH = SCREEN_WIDTH * 0.64; // Reduced to prevent clipping
const MODE_CARD_SPACING = 20;
const CARD_TOTAL_WIDTH = MODE_CARD_WIDTH + MODE_CARD_SPACING;

// Calculate available width for scroll view
// Modal content area = MODAL_WIDTH - (MODAL_CONTENT_PADDING * 2)
// But scrollView has marginHorizontal: -24 to offset, so effective width = MODAL_WIDTH
// Then subtract nav buttons space
const AVAILABLE_WIDTH = MODAL_WIDTH - (NAV_BUTTON_WIDTH + NAV_BUTTON_MARGIN) * 2;
// Padding to center card: (available width - card width) / 2
const CENTER_PADDING = Math.max(0, (AVAILABLE_WIDTH - MODE_CARD_WIDTH) / 2);

interface ModeOption {
  mode: GameMode;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  variant: 'primary' | 'secondary' | 'danger';
  isOffline?: boolean;
  entryFee?: string;
  reward?: string;
}

interface ModeSelectorModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectMode: (mode: GameMode) => void;
  title: string;
  modes: ModeOption[];
}

export function ModeSelectorModal({
  visible,
  onClose,
  onSelectMode,
  title,
  modes,
}: ModeSelectorModalProps) {
  const scrollX = useSharedValue(0);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollViewWidth, setScrollViewWidth] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  // Reset scroll position when modal opens
  React.useEffect(() => {
    if (visible) {
      // Reset to first item
      setSelectedIndex(0);
      scrollX.value = 0;
      // Scroll to start after a short delay to ensure layout is ready
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({
          index: 0,
          animated: false,
        });
      }, 100);
    }
  }, [visible]);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    // Account for initial padding when calculating index
    const adjustedOffset = offsetX - (scrollViewWidth > 0 ? dynamicCenterPadding : CENTER_PADDING);
    const index = Math.round(adjustedOffset / CARD_TOTAL_WIDTH);
    const clampedIndex = Math.max(0, Math.min(index, modes.length - 1));
    if (clampedIndex !== selectedIndex) {
      setSelectedIndex(clampedIndex);
    }
  };

  const handleSelect = () => {
    if (modes[selectedIndex]) {
      onSelectMode(modes[selectedIndex].mode);
      onClose();
    }
  };

  const handlePrev = () => {
    if (selectedIndex > 0) {
      const newIndex = selectedIndex - 1;
      flatListRef.current?.scrollToIndex({
        index: newIndex,
        animated: true,
      });
      setSelectedIndex(newIndex);
    }
  };

  const handleNext = () => {
    if (selectedIndex < modes.length - 1) {
      const newIndex = selectedIndex + 1;
      flatListRef.current?.scrollToIndex({
        index: newIndex,
        animated: true,
      });
      setSelectedIndex(newIndex);
    }
  };

  const renderItem = ({ item, index }: { item: ModeOption; index: number }) => (
    <ModeCard mode={item} index={index} scrollX={scrollX} />
  );

  const getItemLayout = (_: any, index: number) => ({
    length: CARD_TOTAL_WIDTH,
    offset: CARD_TOTAL_WIDTH * index,
    index,
  });

  const canGoPrev = selectedIndex > 0;
  const canGoNext = selectedIndex < modes.length - 1;

  // Calculate dynamic padding based on actual scroll view width
  // Ensure padding centers the card perfectly
  const dynamicCenterPadding = scrollViewWidth > 0 
    ? Math.max(0, Math.floor((scrollViewWidth - MODE_CARD_WIDTH) / 2))
    : CENTER_PADDING;

  const handleScrollViewLayout = (event: any) => {
    const { width } = event.nativeEvent.layout;
    if (width > 0 && width !== scrollViewWidth) {
      setScrollViewWidth(width);
    }
  };

  // Use consistent snap interval
  const snapInterval = CARD_TOTAL_WIDTH;

  return (
    <NeonModal visible={visible} onClose={onClose} title={title} variant="primary">
      <View style={styles.container}>
        {/* Navigation Buttons & Scroll Container */}
        <View style={styles.scrollContainer}>
          {/* Prev Button */}
          <Pressable
            style={[
              styles.navButton,
              styles.navButtonLeft,
              !canGoPrev && styles.navButtonDisabled,
            ]}
            onPress={handlePrev}
            disabled={!canGoPrev}
          >
            <Ionicons
              name="chevron-back"
              size={28}
              color={canGoPrev ? '#00f3ff' : '#27272a'}
            />
          </Pressable>

          {/* Mode Cards Scroll */}
          <Animated.FlatList
            ref={flatListRef}
            data={modes}
            renderItem={renderItem}
            keyExtractor={(item) => item.mode}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={snapInterval}
            snapToAlignment="center"
            decelerationRate="fast"
            onScroll={scrollHandler}
            scrollEventThrottle={16}
            onMomentumScrollEnd={handleScroll}
            onLayout={handleScrollViewLayout}
            contentContainerStyle={[
              styles.scrollContent,
              {
                paddingLeft: dynamicCenterPadding,
                paddingRight: dynamicCenterPadding,
              },
            ]}
            style={styles.scrollView}
            getItemLayout={getItemLayout}
            pagingEnabled={false}
            nestedScrollEnabled={true}
            bounces={true}
            scrollEnabled={true}
            onScrollToIndexFailed={(info) => {
              // Fallback scroll
              setTimeout(() => {
                flatListRef.current?.scrollToOffset({
                  offset: info.averageItemLength * info.index,
                  animated: true,
                });
              }, 100);
            }}
          />

          {/* Next Button */}
          <Pressable
            style={[
              styles.navButton,
              styles.navButtonRight,
              !canGoNext && styles.navButtonDisabled,
            ]}
            onPress={handleNext}
            disabled={!canGoNext}
          >
            <Ionicons
              name="chevron-forward"
              size={28}
              color={canGoNext ? '#00f3ff' : '#27272a'}
            />
          </Pressable>
        </View>

        {/* Pagination Dots */}
        <View style={styles.pagination}>
          {modes.map((_, index) => (
            <PaginationDot
              key={index}
              index={index}
              selectedIndex={selectedIndex}
            />
          ))}
        </View>

        {/* Select Button */}
        <Pressable
          style={[
            styles.selectButton,
            {
              backgroundColor: modes[selectedIndex]?.variant === 'primary'
                ? '#00f3ff'
                : modes[selectedIndex]?.variant === 'secondary'
                ? '#ff00ff'
                : '#ff8a00',
            },
          ]}
          onPress={handleSelect}
        >
          <Text style={styles.selectButtonText}>
            Select {modes[selectedIndex]?.title}
          </Text>
        </Pressable>
      </View>
    </NeonModal>
  );
}

interface ModeCardProps {
  mode: ModeOption;
  index: number;
  scrollX: SharedValue<number>;
}

function ModeCard({ mode, index, scrollX }: ModeCardProps) {
  const inputRange = [
    (index - 1) * CARD_TOTAL_WIDTH,
    index * CARD_TOTAL_WIDTH,
    (index + 1) * CARD_TOTAL_WIDTH,
  ];

  const animatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      scrollX.value,
      inputRange,
      [0.85, 1, 0.85],
      'clamp'
    );
    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0.6, 1, 0.6],
      'clamp'
    );
    return {
      transform: [{ scale }],
      opacity,
    };
  });

  const borderColor =
    mode.variant === 'primary'
      ? '#00f3ff'
      : mode.variant === 'secondary'
      ? '#ff00ff'
      : '#ff8a00';

  return (
    <Animated.View style={[styles.modeCard, animatedStyle]}>
      <View
        style={[
          styles.modeCardContent,
          {
            borderColor,
            shadowColor: borderColor,
          },
        ]}
      >
        <View style={[styles.iconContainer, { borderColor }]}>
          <Ionicons name={mode.icon} size={40} color={borderColor} />
        </View>
        <Text style={[styles.modeTitle, { color: borderColor }]}>
          {mode.title}
        </Text>
        <Text style={styles.modeSubtitle}>{mode.subtitle}</Text>
        {mode.isOffline && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>OFFLINE</Text>
          </View>
        )}
        {mode.entryFee && (
          <View style={styles.feeRow}>
            <View style={styles.feeItem}>
              <Text style={styles.feeLabel}>Entry</Text>
              <Text style={[styles.feeValue, { color: borderColor }]}>
                {mode.entryFee}
              </Text>
            </View>
            {mode.reward && (
              <View style={styles.feeItem}>
                <Text style={styles.feeLabel}>Reward</Text>
                <Text style={[styles.feeValue, { color: borderColor }]}>
                  {mode.reward}
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
    </Animated.View>
  );
}

function PaginationDot({
  index,
  selectedIndex,
}: {
  index: number;
  selectedIndex: number;
}) {
  const scale = useSharedValue(selectedIndex === index ? 1.2 : 1);
  const opacity = useSharedValue(selectedIndex === index ? 1 : 0.4);

  React.useEffect(() => {
    scale.value = withSpring(selectedIndex === index ? 1.2 : 1);
    opacity.value = withTiming(selectedIndex === index ? 1 : 0.4);
  }, [selectedIndex]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.dot, animatedStyle]} />
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 20,
  },
  scrollContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    width: '100%',
  },
  scrollView: {
    flex: 1,
    marginHorizontal: -24, // Offset parent padding from NeonModal
    minWidth: 0, // Allow flex to work properly
  },
  navButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#18181b',
    borderWidth: 2,
    borderColor: '#00f3ff',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    shadowColor: '#00f3ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 5,
  },
  navButtonLeft: {
    marginRight: 8,
  },
  navButtonRight: {
    marginLeft: 8,
  },
  navButtonDisabled: {
    borderColor: '#27272a',
    opacity: 0.3,
  },
  scrollContent: {
    paddingVertical: 20,
  },
  modeCard: {
    width: MODE_CARD_WIDTH,
    marginRight: MODE_CARD_SPACING,
  },
  modeCardContent: {
    backgroundColor: '#18181b',
    borderRadius: 20,
    borderWidth: 2,
    padding: 32,
    alignItems: 'center',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: 'rgba(39, 39, 42, 0.5)',
  },
  modeTitle: {
    fontSize: 24,
    fontWeight: '800',
    fontFamily: 'monospace',
    marginBottom: 8,
    letterSpacing: 1,
  },
  modeSubtitle: {
    fontSize: 14,
    color: '#a1a1aa',
    fontFamily: 'monospace',
    textAlign: 'center',
    marginBottom: 16,
  },
  badge: {
    backgroundColor: '#27272a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 20,
  },
  badgeText: {
    fontSize: 10,
    color: '#a1a1aa',
    fontFamily: 'monospace',
    fontWeight: '700',
    letterSpacing: 1,
  },
  feeRow: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 8,
  },
  feeItem: {
    alignItems: 'center',
  },
  feeLabel: {
    fontSize: 11,
    color: '#71717a',
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  feeValue: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginVertical: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00f3ff',
  },
  selectButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  selectButtonText: {
    color: '#09090b',
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'monospace',
    letterSpacing: 1,
  },
});

