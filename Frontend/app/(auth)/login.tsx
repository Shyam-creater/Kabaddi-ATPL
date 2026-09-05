import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    StyleSheet,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Dimensions,
    Alert,
    Keyboard,
    TouchableWithoutFeedback,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSession } from '../../app/ctx';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { loginUser } from '../../features/auth/authSlice';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const { loading, error } = useAppSelector(state => state.auth);

    const [loginMethod, setLoginMethod] = useState<'email' | 'atplId'>('email');
    const [email, setEmail] = useState('');
    const [atplId, setAtplId] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const { signIn } = useSession();

    const handleLogin = async () => {
        if (loginMethod === 'email') {
            if (!email || !password) {
                Alert.alert('Required', 'Please enter Mobile Number / Email and password');
                return;
            }
            const res = await dispatch(loginUser({ email, password }));

            if (res.meta.requestStatus === 'fulfilled') {
                const payload = res.payload as any;
                const token = payload?.token || payload?.data?.token;

                console.log('Login Payload:', payload);

                if (token && typeof token === 'string') {
                    signIn(token);
                } else {
                    console.error('Login Error: Missing string token', payload);
                    Alert.alert('Login Failed', 'Server response invalid');
                }
            } else if (res.meta.requestStatus === 'rejected') {
                const payload = res.payload as string;
                Alert.alert('Login Failed', payload || 'An error occurred during login');
            }
        } /* else {
            if (!atplId) {
                Alert.alert('Required', 'Please enter your ATPL ID');
                return;
            }
            // Backend auth controller allows atplId without password
            const res = await dispatch(loginUser({ atplId } as any));

            if (res.meta.requestStatus === 'fulfilled') {
                const payload = res.payload as any;
                const token = payload?.token || payload?.data?.token;

                console.log('Login Payload:', payload);

                if (token && typeof token === 'string') {
                    signIn(token);
                } else {
                    console.error('Login Error: Missing string token', payload);
                    Alert.alert('Login Failed', 'Server response invalid');
                }
            } else if (res.meta.requestStatus === 'rejected') {
                const payload = res.payload as string;
                Alert.alert('Login Failed', payload || 'An error occurred during login');
            }
        } */
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
                        <View style={styles.brandingContainer}>
                            <View style={styles.logoCircle}>
                                <Image
                                    source={require('../../assets/images/ATPL LOGO.jpeg')}
                                    style={styles.logoImage}
                                    resizeMode="contain"
                                />
                            </View>
                            <Text style={styles.brandTitle}>KABADDI SCORE</Text>
                        </View>
                        <Text style={styles.subtitle}>Play • Score • Connect</Text>
                    </Animated.View>

                    <Animated.View entering={FadeInDown.delay(400).duration(800)} style={styles.formContainer}>
                        <Text style={styles.welcomeText}>Welcome Back!</Text>
                        <Text style={styles.instructionText}>Please sign in to continue</Text>

                        {/* Tab Selector */}
                        {/*
                        <View style={styles.toggleContainer}>
                            <TouchableOpacity
                                onPress={() => setLoginMethod('email')}
                                style={[styles.toggleButton, loginMethod === 'email' && styles.toggleButtonActive]}
                            >
                                <Text style={[styles.toggleButtonText, loginMethod === 'email' && styles.toggleButtonTextActive]}>
                                    Mobile / Email
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => setLoginMethod('atplId')}
                                style={[styles.toggleButton, loginMethod === 'atplId' && styles.toggleButtonActive]}
                            >
                                <Text style={[styles.toggleButtonText, loginMethod === 'atplId' && styles.toggleButtonTextActive]}>
                                    ATPL ID
                                </Text>
                            </TouchableOpacity>
                        </View>
                        */}

                        {/* Mobile Number or Email Input */}
                        {loginMethod === 'email' && (
                            <View style={styles.inputWrapper}>
                                <LinearGradient
                                    colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)']}
                                    style={styles.inputGradient}
                                >
                                    <Ionicons name="call-outline" size={20} color="#888" style={styles.inputIcon} />
                                    <TextInput
                                        placeholder="Mobile Number or Email"
                                        placeholderTextColor="#666"
                                        value={email}
                                        onChangeText={setEmail}
                                        autoCapitalize="none"
                                        style={styles.input}
                                    />
                                </LinearGradient>
                            </View>
                        )}

                        {/* ATPL ID Input */}
                        {/*
                        {loginMethod === 'atplId' && (
                            <View style={styles.inputWrapper}>
                                <LinearGradient
                                    colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)']}
                                    style={styles.inputGradient}
                                >
                                    <Ionicons name="card-outline" size={20} color="#888" style={styles.inputIcon} />
                                    <TextInput
                                        placeholder="ATPL ID"
                                        placeholderTextColor="#666"
                                        value={atplId}
                                        onChangeText={setAtplId}
                                        autoCapitalize="none"
                                        style={styles.input}
                                    />
                                </LinearGradient>
                            </View>
                        )}
                        */}

                        {/* Password Input (Only for Email) */}
                        {loginMethod === 'email' && (
                            <>
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

                                <TouchableOpacity style={styles.forgotPassword}>
                                    <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                                </TouchableOpacity>
                            </>
                        )}



                        <TouchableOpacity
                            onPress={handleLogin}
                            disabled={loading}
                            style={styles.loginButtonContainer}
                        >
                            <LinearGradient
                                colors={['#E31C25', '#A00F15']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.loginButton}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.loginButtonText}>LOGIN</Text>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>

                        <View style={styles.footer}>
                            <Text style={styles.footerText}>Don’t have an account? </Text>
                            <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
                                <Text style={styles.linkText}>Register</Text>
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
        alignItems: 'center',
        marginBottom: 40,
    },
    brandingContainer: {
        alignItems: 'center',
        marginBottom: 30,
    },
    logoCircle: {
        width: 110,
        height: 110,
        borderRadius: 55,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#E31C25',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 15,
        elevation: 10,
        borderWidth: 3,
        borderColor: 'rgba(255,255,255,0.2)',
        padding: 10,
        marginBottom: 15,
    },
    logoImage: {
        width: '100%',
        height: '100%',
        borderRadius: 45,
    },
    brandTitle: {
        fontSize: 28,
        fontWeight: '900',
        color: '#fff',
        letterSpacing: 2,
        textShadowColor: 'rgba(227, 28, 37, 0.5)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 10,
    },
    subtitle: {
        fontSize: 14,
        color: '#888',
        letterSpacing: 3,
        textTransform: 'uppercase',
    },
    formContainer: {
        width: '100%',
    },
    welcomeText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 8,
    },
    instructionText: {
        fontSize: 14,
        color: '#666',
        marginBottom: 20,
    },
    toggleContainer: {
        flexDirection: 'row',
        marginBottom: 20,
        gap: 10,
    },
    toggleButton: {
        flex: 1,
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 8,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
    },
    toggleButtonActive: {
        backgroundColor: 'rgba(227, 28, 37, 0.2)',
        borderColor: '#E31C25',
    },
    toggleButtonText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#666',
    },
    toggleButtonTextActive: {
        color: '#E31C25',
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
    forgotPassword: {
        alignSelf: 'flex-end',
        marginBottom: 30,
    },
    forgotPasswordText: {
        color: '#E31C25',
        fontSize: 14,
    },
    errorText: {
        color: '#FF5252',
        marginBottom: 20,
        textAlign: 'center',
        backgroundColor: 'rgba(255, 82, 82, 0.1)',
        padding: 10,
        borderRadius: 8,
    },
    loginButtonContainer: {
        marginBottom: 30,
        shadowColor: '#E31C25',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    loginButton: {
        height: 56,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loginButtonText: {
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
