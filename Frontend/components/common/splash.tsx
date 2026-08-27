// app/splash.tsx

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const SplashScreen = () => {
  const playerScale = useRef(new Animated.Value(0.75)).current;
  const playerOpacity = useRef(new Animated.Value(0)).current;
  const playerX = useRef(new Animated.Value(-45)).current;

  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoY = useRef(new Animated.Value(18)).current;

  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleY = useRef(new Animated.Value(15)).current;

  const lineWidth = useRef(new Animated.Value(0)).current;

  const glowScale = useRef(new Animated.Value(0.7)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      // Player entrance
      Animated.parallel([
        Animated.timing(playerOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),

        Animated.spring(playerScale, {
          toValue: 1,
          friction: 5,
          tension: 65,
          useNativeDriver: true,
        }),

        Animated.timing(playerX, {
          toValue: 0,
          duration: 600,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),

      // Impact glow
      Animated.parallel([
        Animated.timing(glowOpacity, {
          toValue: 0.35,
          duration: 150,
          useNativeDriver: true,
        }),

        Animated.timing(glowScale, {
          toValue: 1.35,
          duration: 500,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]),

      // Logo
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),

        Animated.timing(logoY, {
          toValue: 0,
          duration: 350,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),

      // Title + line
      Animated.parallel([
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),

        Animated.timing(titleY, {
          toValue: 0,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),

        Animated.timing(lineWidth, {
          toValue: 1,
          duration: 500,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
      ]),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>

      {/* Subtle background design */}
      <View style={styles.backgroundTop} />
      <View style={styles.backgroundBottom} />

      {/* Expanding impact */}
      <Animated.View
        style={[
          styles.impact,
          {
            opacity: glowOpacity,
            transform: [{ scale: glowScale }],
          },
        ]}
      />

      {/* Main content */}
      <View style={styles.content}>

        {/* Kabaddi Raider */}
        <Animated.View
          style={[
            styles.playerWrapper,
            {
              opacity: playerOpacity,
              transform: [
                { translateX: playerX },
                { scale: playerScale },
              ],
            },
          ]}
        >
          <FontAwesome5
            name="user-ninja"
            size={125}
            color="#FFFFFF"
          />

          {/* Motion accent */}
          <View style={styles.speedLineOne} />
          <View style={styles.speedLineTwo} />
          <View style={styles.speedLineThree} />
        </Animated.View>

        {/* Logo / Brand */}
        <Animated.View
          style={{
            opacity: logoOpacity,
            transform: [{ translateY: logoY }],
          }}
        >
          <Text style={styles.brand}>
            AATTUM <Text style={styles.brandBold}>TPL</Text>
          </Text>
        </Animated.View>

        {/* Divider */}
        <Animated.View
          style={[
            styles.divider,
            {
              width: lineWidth.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 105],
              }),
            },
          ]}
        />

        {/* Scoring */}
        <Animated.View
          style={{
            opacity: titleOpacity,
            transform: [{ translateY: titleY }],
          }}
        >
          <Text style={styles.scoring}>
            SCORING APP
          </Text>

          <Text style={styles.tagline}>
            KABADDI • LIVE • SCORE
          </Text>
        </Animated.View>

      </View>

      {/* Bottom */}
      <Animated.Text
        style={[
          styles.bottomText,
          {
            opacity: titleOpacity,
          },
        ]}
      >
        POWERED BY ATPL
      </Animated.Text>

    </View>
  );
};

export default SplashScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E31C25',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },

  /* Background */

  backgroundTop: {
    position: 'absolute',
    width: width * 1.5,
    height: width * 1.5,
    borderRadius: width,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    top: -width * 0.85,
    left: -width * 0.25,
  },

  backgroundBottom: {
    position: 'absolute',
    width: width * 1.3,
    height: width * 1.3,
    borderRadius: width,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    bottom: -width * 0.8,
    right: -width * 0.3,
  },

  /* Impact */

  impact: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },

  /* Content */

  content: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },

  /* Player */

  playerWrapper: {
    width: 170,
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 25,
    position: 'relative',
  },

  speedLineOne: {
    position: 'absolute',
    width: 55,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.65)',
    left: 3,
    top: 52,
    transform: [{ rotate: '-12deg' }],
  },

  speedLineTwo: {
    position: 'absolute',
    width: 38,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.45)',
    left: 12,
    top: 68,
    transform: [{ rotate: '-12deg' }],
  },

  speedLineThree: {
    position: 'absolute',
    width: 25,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
    left: 20,
    top: 82,
    transform: [{ rotate: '-12deg' }],
  },

  /* Brand */

  brand: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '600',
    letterSpacing: 2.5,
  },

  brandBold: {
    fontWeight: '900',
  },

  /* Divider */

  divider: {
    height: 2,
    backgroundColor: '#FFFFFF',
    marginTop: 10,
    marginBottom: 10,
    borderRadius: 2,
  },

  /* Scoring */

  scoring: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 4,
    textAlign: 'center',
  },

  tagline: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 2,
    textAlign: 'center',
    marginTop: 18,
  },

  /* Bottom */

  bottomText: {
    position: 'absolute',
    bottom: 32,
    color: 'rgba(255,255,255,0.4)',
    fontSize: 8,
    fontWeight: '600',
    letterSpacing: 2,
  },
});