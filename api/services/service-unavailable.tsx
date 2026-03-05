import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { BorderRadius, Spacing } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';

const { width: W, height: H } = Dimensions.get('window');

export default function ServiceUnavailableScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const surface = useThemeColor({}, 'surface');
  const textColor = useThemeColor({}, 'text');

  // Animations
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(50)).current;
  const orbitSpin = useRef(new Animated.Value(0)).current;
  const floatY = useRef(new Animated.Value(0)).current;
  const pizzaFloat = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance
    Animated.parallel([
      Animated.timing(fadeIn, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.spring(slideUp, { toValue: 0, tension: 70, friction: 12, useNativeDriver: true }),
    ]).start();

    // Infinite orbit rotation
    Animated.loop(
      Animated.timing(orbitSpin, {
        toValue: 1,
        duration: 10000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Planet float up/down
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatY, { toValue: -12, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(floatY, { toValue: 0, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();

    // Pizza float
    Animated.loop(
      Animated.sequence([
        Animated.timing(pizzaFloat, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(pizzaFloat, { toValue: 0, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const orbitRotate = orbitSpin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const pizzaTranslate = pizzaFloat.interpolate({ inputRange: [0, 1], outputRange: [0, -14] });

  return (
    <View style={styles.root}>

      {/* ── Deep space background ── */}
      <View style={styles.space}>
        {/* Stars */}
        {STARS.map((s, i) => (
          <View key={i} style={[styles.star, { top: s.y, left: s.x, width: s.size, height: s.size, opacity: s.opacity }]} />
        ))}

        {/* Floating pizza slice — bottom left */}
        <Animated.Text style={[styles.floatEmoji, { bottom: H * 0.25, left: 20, transform: [{ translateY: pizzaTranslate }] }]}>
          🍕
        </Animated.Text>

        {/* Floating donut — top right */}
        <Animated.Text style={[styles.floatEmoji, styles.donutEmoji, { transform: [{ translateY: floatY }] }]}>
          🍩
        </Animated.Text>

        {/* ── Planet with ring ── */}
        <Animated.View style={[styles.planetWrap, { transform: [{ translateY: floatY }] }]}>
          {/* Orbit ring */}
          <Animated.View style={[styles.orbitRing, { transform: [{ rotate: orbitRotate }] }]}>
            <View style={styles.orbitDot} />
          </Animated.View>

          {/* Planet body */}
          <View style={styles.planet}>
            <View style={styles.planetShine} />
          </View>

          {/* Saturn ring overlay */}
          <View style={styles.saturnRing} />
        </Animated.View>
      </View>

      {/* ── White card slides up ── */}
      <Animated.View
        style={[
          styles.card,
          { backgroundColor: surface, opacity: fadeIn, transform: [{ translateY: slideUp }] },
        ]}
      >
        <ThemedText style={styles.title}>
          We'll be there soon — hang tight!
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          Looks like online ordering isn't available at your location yet.
        </ThemedText>

        <TouchableOpacity style={styles.exploreBtn}>
          <ThemedText style={styles.exploreTxt}>EXPLORE OTHER OPTIONS</ThemedText>
        </TouchableOpacity>

        {/* Train card */}
        <TouchableOpacity style={styles.trainCard} activeOpacity={0.8}>
          <View style={styles.trainInfo}>
            <ThemedText style={styles.trainTitle}>Food on train</ThemedText>
            <ThemedText style={styles.trainSub}>
              Guaranteed delivery at your{'\n'}train seat
            </ThemedText>
          </View>
          <ThemedText style={styles.trainEmoji}>🚆</ThemedText>
        </TouchableOpacity>
      </Animated.View>

      {/* ── Bottom tab bar ── */}
      <View style={[styles.tabBar, { paddingBottom: insets.bottom + 4, backgroundColor: surface }]}>
        <TouchableOpacity style={styles.tabItem} onPress={() => router.replace('/(tabs)')}>
          <MaterialIcons name="delivery-dining" size={26} color="#E8445A" />
          <ThemedText style={[styles.tabLabel, { color: '#E8445A' }]}>Delivery</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem}>
          <MaterialIcons name="history" size={26} color="rgba(0,0,0,0.3)" />
          <ThemedText style={[styles.tabLabel, { color: 'rgba(0,0,0,0.35)' }]}>History</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity style={styles.districtChip}>
          <ThemedText style={styles.districtTxt}>district ↗</ThemedText>
        </TouchableOpacity>
      </View>

    </View>
  );
}

// Pre-computed stars so they're stable across renders
const STARS = Array.from({ length: 28 }, (_, i) => ({
  x: (i * 137.5) % W,
  y: (i * 79.3) % (H * 0.52),
  size: i % 3 === 0 ? 3 : i % 3 === 1 ? 2 : 1.5,
  opacity: 0.25 + (i % 5) * 0.1,
}));

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0d1b3e' },

  // Space section
  space: { height: H * 0.46, overflow: 'hidden' },
  star: { position: 'absolute', borderRadius: 10, backgroundColor: '#fff' },
  floatEmoji: { position: 'absolute', fontSize: 32 },
  donutEmoji: { top: 60, right: 28, fontSize: 40 },

  // Planet
  planetWrap: {
    position: 'absolute',
    top: H * 0.06,
    alignSelf: 'center',
    width: 160,
    height: 160,
    left: W / 2 - 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orbitRing: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  orbitDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#fbbf24',
    marginTop: -5,
  },
  planet: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: '#e85d26',
    overflow: 'hidden',
    shadowColor: '#e85d26',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 25,
    elevation: 12,
  },
  planetShine: {
    position: 'absolute',
    top: 12,
    left: 18,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  saturnRing: {
    position: 'absolute',
    width: 190,
    height: 36,
    borderRadius: 95,
    borderWidth: 3,
    borderColor: 'rgba(232,93,38,0.35)',
    transform: [{ rotateX: '60deg' }],
  },

  // Card
  card: {
    flex: 1,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    marginTop: -28,
    gap: Spacing.md,
  },
  title: { fontSize: 20, fontWeight: '800', textAlign: 'center', lineHeight: 28 },
  subtitle: { fontSize: 14, opacity: 0.5, textAlign: 'center', lineHeight: 20 },
  exploreBtn: { alignSelf: 'center' },
  exploreTxt: { fontSize: 12, fontWeight: '800', color: '#E8445A', letterSpacing: 0.8 },

  // Train card
  trainCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.07)',
    backgroundColor: 'rgba(0,0,0,0.02)',
    marginTop: Spacing.xs,
  },
  trainInfo: { flex: 1 },
  trainTitle: { fontSize: 17, fontWeight: '800', marginBottom: 4 },
  trainSub: { fontSize: 13, opacity: 0.5, lineHeight: 18 },
  trainEmoji: { fontSize: 44, marginLeft: Spacing.md },

  // Tab bar
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.1)',
    gap: Spacing.xl,
  },
  tabItem: { alignItems: 'center', gap: 2, flex: 1 },
  tabLabel: { fontSize: 11, fontWeight: '600' },
  districtChip: {
    backgroundColor: '#6366f1',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.xl,
  },
  districtTxt: { color: '#fff', fontWeight: '700', fontSize: 13 },
});
