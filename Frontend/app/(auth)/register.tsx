import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { registerUser } from '../../features/auth/authSlice';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useSession } from '../../app/ctx';
import * as Clipboard from 'expo-clipboard';

export default function RegisterScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector(state => state.auth);
  const { signIn } = useSession();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedSports, setSelectedSports] = useState<string[]>(['Kabaddi']);

  const sports = ['Kabaddi'];

  const toggleSport = (sport: string) => {
    setSelectedSports(['Kabaddi']);
  };

  const handleRegister = async () => {
    const res = await dispatch(registerUser({ name, email, phone, password, sports: ['Kabaddi'] }));

    console.log('REGISTER RESPONSE 👉', res);

    if (res.meta.requestStatus === 'fulfilled') {
      const payload = res.payload as any;
      const token = payload?.token || payload?.data?.token;
      const atplId = payload?.data?.user?.atplId || payload?.user?.atplId;

      const successMessage = atplId 
        ? `Your ATPL ID is: ${atplId}\n\nCopy this ID, you can use it to login on different devices!`
        : 'Account created successfully!';

      const handleOk = () => {
        if (token && typeof token === 'string') {
            signIn(token);
            router.replace('/(tabs)');
        } else {
            router.replace('/(auth)/login');
        }
      };

      if (atplId) {
          Alert.alert('Welcome to ATPL Score!', successMessage, [
            { text: 'Copy ID & Continue', onPress: async () => {
                await Clipboard.setStringAsync(atplId);
                handleOk();
            } },
            { text: 'Continue', onPress: handleOk, style: 'cancel' }
          ]);
      } else {
          Alert.alert('Success', successMessage, [
            { text: 'OK', onPress: handleOk }
          ]);
      }
    } else if (res.meta.requestStatus === 'rejected') {
      const payload = res.payload as string;
      Alert.alert('Registration Failed', payload || 'An error occurred during registration');
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1a1a1a', '#0a0a0a']}
        style={styles.background}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View>
          <Animated.View entering={FadeInUp.delay(200).duration(800)} style={styles.header}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Create Account</Text>
            <Text style={styles.headerSubtitle}>Join the league of champions</Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(400).duration(800)} style={styles.formContainer}>

            {/* Name Input */}
            <View style={styles.inputWrapper}>
              <LinearGradient
                colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)']}
                style={styles.inputGradient}
              >
                <Ionicons name="person-outline" size={20} color="#888" style={styles.inputIcon} />
                <TextInput
                  placeholder="Full Name"
                  placeholderTextColor="#666"
                  value={name}
                  onChangeText={setName}
                  style={styles.input}
                />
              </LinearGradient>
            </View>

            {/* Email Input */}
            <View style={styles.inputWrapper}>
              <LinearGradient
                colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)']}
                style={styles.inputGradient}
              >
                <Ionicons name="mail-outline" size={20} color="#888" style={styles.inputIcon} />
                <TextInput
                  placeholder="Email Address"
                  placeholderTextColor="#666"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={styles.input}
                />
              </LinearGradient>
            </View>

            {/* Phone Input */}
            <View style={styles.inputWrapper}>
              <LinearGradient
                colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)']}
                style={styles.inputGradient}
              >
                <Ionicons name="call-outline" size={20} color="#888" style={styles.inputIcon} />
                <TextInput
                  placeholder="Mobile Number"
                  placeholderTextColor="#666"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  maxLength={10}
                  style={styles.input}
                />
              </LinearGradient>
            </View>

            {/* Password Input */}
            <View style={styles.inputWrapper}>
              <LinearGradient
                colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)']}
                style={styles.inputGradient}
              >
                <Ionicons name="lock-closed-outline" size={20} color="#888" style={styles.inputIcon} />
                <TextInput
                  placeholder="Password"
                  placeholderTextColor="#666"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  style={styles.input}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color="#888"
                  />
                </TouchableOpacity>
              </LinearGradient>
            </View>

            <TouchableOpacity
              onPress={handleRegister}
              disabled={loading}
              style={styles.registerButtonContainer}
            >
              <LinearGradient
                colors={['#E31C25', '#A00F15']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.registerButton}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.registerButtonText}>CREATE ACCOUNT</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                <Text style={styles.linkText}>Login</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
            </View>
          </TouchableWithoutFeedback>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  background: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    marginBottom: 40,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
  },
  formContainer: {
    width: '100%',
  },
  inputWrapper: {
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  inputGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    paddingHorizontal: 15,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
  },
  eyeIcon: {
    padding: 8,
  },
  sportsSection: {
    marginBottom: 25,
  },
  sportsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  sportsContainer: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  sportButton: {
    flex: 1,
    minWidth: '30%',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  sportButtonActive: {
    borderColor: '#E31C25',
  },
  sportButtonGradient: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  sportButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#888',
    textAlign: 'center',
  },
  sportButtonTextActive: {
    color: '#fff',
  },
  errorText: {
    color: '#FF5252',
    marginBottom: 20,
    textAlign: 'center',
    backgroundColor: 'rgba(255, 82, 82, 0.1)',
    padding: 10,
    borderRadius: 8,
  },
  registerButtonContainer: {
    marginTop: 10,
    marginBottom: 30,
    shadowColor: '#E31C25',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  registerButton: {
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    color: '#666',
    fontSize: 14,
  },
  linkText: {
    color: '#E31C25',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
