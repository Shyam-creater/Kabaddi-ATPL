// app/splash.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

const SplashScreen = () => {
  // No navigation logic here. Parent _layout handles it.

  return (
    <View style={styles.container}>
      <FontAwesome5 name="star" size={100} color="#fff" />
      <Text style={styles.text}>Aattum TPL Scoreing App</Text>
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
  },
  text: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    marginTop: 16,
  },
});
