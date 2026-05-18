import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    Alert,
    ActivityIndicator,
    SafeAreaView,
    StatusBar,
    Modal
} from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as ExpoClipboard from 'expo-clipboard';
import api from '../../services/api';

const { width, height } = Dimensions.get('window');

export default function RegistrationScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const id = params.id as string;
    const sport = params.sport as string;

    // ── State ──
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [tournament, setTournament] = useState<any>(null);
    const [user, setUser] = useState<any>(null);
    const [alreadyRegistered, setAlreadyRegistered] = useState(false);
    const [registrationData, setRegistrationData] = useState<any>(null);
    const [qrModalVisible, setQrModalVisible] = useState(false);

    // Form State
    const [proofImage, setProofImage] = useState<string | null>(null);
    const [agreedToTerms, setAgreedToTerms] = useState(false);

    const fee = tournament?.registrationFee || 500;

    useEffect(() => { loadData(); }, [id, sport]);

    const loadData = async () => {
        if (!id) {
            console.warn('RegistrationScreen: No tournament ID provided');
            return;
        }
        try {
            setLoading(true);
            const sportStr = (sport || 'cricket').toLowerCase();
            console.log(`Fetching registration data for: ${sportStr}/${id}`);
            
            const [tournamentRes, userRes, checkRes] = await Promise.all([
                api.get(`/tournaments/${sportStr}/${id}`),
                api.get('/user/profile'),
                api.get(`/registrations/check/${id}`),
            ]);
            
            console.log('Tournament data fetched:', tournamentRes.data?.name);
            setTournament(tournamentRes.data);
            setUser(userRes.data.data);
            setAlreadyRegistered(checkRes.data.registered);
            setRegistrationData(checkRes.data.registration);
        } catch (error) {
            console.error('Failed to load registration data:', error);
        } finally { setLoading(false); }
    };

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'We need camera roll permissions to upload payment proof.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.7,
            base64: true,
        });

        if (!result.canceled) {
            setProofImage(`data:image/jpeg;base64,${result.assets[0].base64}`);
        }
    };

    const copyUpiId = async () => {
        if (tournament?.upiId) {
            await ExpoClipboard.setStringAsync(tournament.upiId);
            Alert.alert('Copied', 'UPI ID copied to clipboard');
        }
    };

    const handleSubmit = async () => {
        if (!proofImage) {
            Alert.alert('Missing Proof', 'Please upload your payment screenshot to proceed.');
            return;
        }
        if (!agreedToTerms) {
            Alert.alert('Agreement Required', 'You must agree to the tournament terms and conditions.');
            return;
        }

        try {
            setSubmitting(true);
            const payload = {
                tournamentId: id,
                sport: sport,
                paymentScreenshot: proofImage,
                agreedToTerms: true,
                paymentAmount: fee
            };

            const response = await api.post('/registrations', payload);
            if (response.data.success) {
                Alert.alert(
                    'Success!',
                    'Your registration has been submitted for verification.',
                    [{ text: 'OK', onPress: () => router.replace('/(tabs)/tournament') }]
                );
            }
        } catch (error: any) {
            console.error('Registration error:', error);
            const msg = error.response?.data?.message || 'Failed to submit registration. Please try again.';
            Alert.alert('Registration Failed', msg);
        } finally { setSubmitting(false); }
    };

    // ── Loading/Error State ──
    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <Stack.Screen options={{ headerShown: false }} />
                <ActivityIndicator size="large" color="#E31C25" />
                <Text style={styles.loadingText}>Loading tournament details...</Text>
            </View>
        );
    }

    if (!tournament && !loading) {
        return (
            <View style={styles.loadingContainer}>
                <Stack.Screen options={{ headerShown: false }} />
                <Ionicons name="alert-circle-outline" size={48} color="#E31C25" />
                <Text style={styles.loadingText}>Tournament not found</Text>
                <TouchableOpacity style={styles.goBackBtn} onPress={loadData}>
                    <Text style={styles.goBackBtnText}>Retry</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // ── Already Registered / Status State ──
    if (alreadyRegistered) {
        const status = registrationData?.status || 'PENDING';
        
        const statusConfig: any = {
            PENDING: {
                icon: 'time',
                color: '#F59E0B',
                title: 'Registration Pending',
                subtitle: 'Your registration has been submitted. Our team is currently verifying your payment screenshot. Please check back later.',
                bg: '#FEF3C7'
            },
            APPROVED: {
                icon: 'checkmark-circle',
                color: '#10B981',
                title: 'Registration Approved',
                subtitle: 'Congratulations! Your registration has been verified and approved. You are now officially enrolled in the tournament.',
                bg: '#D1FAE5'
            },
            REJECTED: {
                icon: 'close-circle',
                color: '#EF4444',
                title: 'Registration Rejected',
                subtitle: 'Unfortunately, your registration was not approved. This could be due to an invalid payment proof or incomplete details.',
                bg: '#FEE2E2'
            }
        };

        const config = statusConfig[status] || statusConfig.PENDING;

        return (
            <View style={styles.container}>
                <Stack.Screen options={{ headerShown: false }} />
                {/* Keep consistent header background */}
                <LinearGradient colors={['#E31C25', '#900C12']} style={[styles.header, { height: 120 }]}>
                    <View style={styles.headerTop}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                            <Ionicons name="chevron-back" size={24} color="#fff" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Status</Text>
                        <View style={{ width: 40 }} />
                    </View>
                </LinearGradient>

                <View style={styles.alreadyRegistered}>
                    <View style={[styles.successIconCircle, { backgroundColor: config.bg }]}>
                        <Ionicons name={config.icon} size={80} color={config.color} />
                    </View>
                    <Text style={[styles.alreadyTitle, { color: config.color }]}>{config.title}</Text>
                    <Text style={styles.alreadySubtitle}>
                        {config.subtitle}
                    </Text>

                    {status === 'REJECTED' && (
                        <View style={styles.rejectionNotice}>
                            <Text style={styles.rejectionText}>Please contact support if you believe this is an error.</Text>
                        </View>
                    )}

                    <TouchableOpacity style={styles.goBackBtn} onPress={() => router.back()}>
                        <Text style={styles.goBackBtnText}>Go Back to Tournaments</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
            <Stack.Screen options={{ headerShown: false }} />
            
            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
            >
                {/* ── Redesigned Header ── */}
                <LinearGradient colors={['#E31C25', '#900C12']} style={styles.header}>
                    <View style={styles.headerTop}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                            <Ionicons name="chevron-back" size={24} color="#fff" />
                        </TouchableOpacity>
                        
                        <Text style={styles.headerTitle}>Registration</Text>

                        {tournament?.logo ? (
                            <View style={styles.headerLogoContainer}>
                                <Image source={{ uri: tournament.logo }} style={styles.headerLogo} resizeMode="contain" />
                            </View>
                        ) : <View style={{ width: 38 }} />}
                    </View>
                    
                    <View style={styles.leagueInfoRow}>
                        <Text style={styles.tournamentName} numberOfLines={1}>{tournament?.name}</Text>
                        <View style={styles.sportBadge}>
                            <Text style={styles.sportBadgeText}>{String(sport).toUpperCase()}</Text>
                        </View>
                    </View>
                </LinearGradient>

                <ScrollView 
                    contentContainerStyle={styles.scrollContent} 
                    showsVerticalScrollIndicator={false}
                >
                    {/* Full Screen QR Modal */}
                    <Modal
                        animationType="fade"
                        transparent={true}
                        visible={qrModalVisible}
                        onRequestClose={() => setQrModalVisible(false)}
                    >
                        <View style={styles.modalBackground}>
                            <TouchableOpacity 
                                style={styles.modalCloseArea} 
                                activeOpacity={1} 
                                onPress={() => setQrModalVisible(false)}
                            />
                            <View style={styles.modalContent}>
                                <TouchableOpacity 
                                    style={styles.modalCloseBtn} 
                                    onPress={() => setQrModalVisible(false)}
                                >
                                    <Ionicons name="close" size={28} color="#fff" />
                                </TouchableOpacity>
                                <View style={styles.modalQrWrapper}>
                                    <Image 
                                        source={{ uri: tournament?.qrCodeImage }} 
                                        style={styles.modalQrImage} 
                                        resizeMode="contain" 
                                    />
                                </View>
                                <Text style={styles.modalHint}>Pinch to zoom or take a screenshot</Text>
                            </View>
                        </View>
                    </Modal>

                    <View style={{ height: 10 }} />

                    {/* ── Summary Info ── */}
                    <View style={styles.summaryGrid}>
                        <View style={styles.summaryItem}>
                            <View style={styles.summaryIconBox}>
                                <Ionicons name="location" size={18} color="#E31C25" />
                            </View>
                            <View>
                                <Text style={styles.summaryLabel}>Venue</Text>
                                <Text style={styles.summaryValue} numberOfLines={1}>{tournament?.venue || 'TBA'}</Text>
                            </View>
                        </View>
                        <View style={styles.summaryItem}>
                            <View style={styles.summaryIconBox}>
                                <Ionicons name="calendar" size={18} color="#E31C25" />
                            </View>
                            <View>
                                <Text style={styles.summaryLabel}>Start Date</Text>
                                <Text style={styles.summaryValue}>
                                    {tournament?.startDate ? new Date(tournament.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—'}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* ── Player Details (Auto-filled) ── */}
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Player Information</Text>
                        <View style={styles.autoBadge}><Text style={styles.autoBadgeText}>VERIFIED</Text></View>
                    </View>
                    
                    <View style={styles.playerCard}>
                        <View style={styles.playerRow}>
                            <Ionicons name="person-circle-outline" size={20} color="#6B7280" />
                            <View style={styles.playerInfoCol}>
                                <Text style={styles.playerLabel}>Full Name</Text>
                                <Text style={styles.playerValue}>{user?.name || '—'}</Text>
                            </View>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.playerRow}>
                            <Ionicons name="call-outline" size={20} color="#6B7280" />
                            <View style={styles.playerInfoCol}>
                                <Text style={styles.playerLabel}>Mobile Number</Text>
                                <Text style={styles.playerValue}>{user?.phone || '—'}</Text>
                            </View>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.playerRow}>
                            <Ionicons name="mail-outline" size={20} color="#6B7280" />
                            <View style={styles.playerInfoCol}>
                                <Text style={styles.playerLabel}>Email Address</Text>
                                <Text style={styles.playerValue}>{user?.email || '—'}</Text>
                            </View>
                        </View>
                    </View>

                    {/* ── Payment Section ── */}
                    <Text style={styles.sectionTitle}>Payment & Proof</Text>
                    
                    <View style={styles.paymentCard}>
                        {/* QR & UPI Section */}
                        <View style={styles.qrRow}>
                            {tournament?.qrCodeImage ? (
                                <TouchableOpacity 
                                    style={styles.qrContainer} 
                                    onPress={() => setQrModalVisible(true)}
                                    activeOpacity={0.9}
                                >
                                    <Image source={{ uri: tournament.qrCodeImage }} style={styles.qrImage} resizeMode="contain" />
                                    <View style={styles.qrLabelBox}>
                                        <Ionicons name="expand-outline" size={10} color="#fff" style={{marginRight: 4}} />
                                        <Text style={styles.qrLabelText}>TAP TO ENLARGE</Text>
                                    </View>
                                </TouchableOpacity>
                            ) : (
                                <View style={[styles.qrContainer, { backgroundColor: '#F3F4F6' }]}>
                                    <Ionicons name="qr-code" size={40} color="#D1D5DB" />
                                </View>
                            )}
                            
                            <View style={styles.upiDetails}>
                                <Text style={styles.instructionTitle}>How to pay:</Text>
                                <Text style={styles.instructionStep}>1. Scan QR or copy UPI ID</Text>
                                <Text style={styles.instructionStep}>2. Pay exactly ₹{fee}</Text>
                                <Text style={styles.instructionStep}>3. Upload screenshot below</Text>
                                
                                {tournament?.upiId && (
                                    <TouchableOpacity style={styles.copyContainer} onPress={copyUpiId} activeOpacity={0.7}>
                                        <Text style={styles.upiIdText} numberOfLines={1}>{tournament.upiId}</Text>
                                        <Ionicons name="copy" size={14} color="#E31C25" />
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>

                        <View style={styles.amountBanner}>
                            <Text style={styles.amountText}>Payable Amount: ₹{fee}</Text>
                        </View>

                        {/* Upload Proof Area */}
                        <TouchableOpacity 
                            style={[styles.uploadArea, proofImage ? styles.uploadAreaActive : null]} 
                            onPress={pickImage}
                            activeOpacity={0.8}
                        >
                            {proofImage ? (
                                <View style={styles.previewBox}>
                                    <Image source={{ uri: proofImage }} style={styles.previewImage} />
                                    <View style={styles.previewOverlay}>
                                        <Ionicons name="camera" size={20} color="#fff" />
                                        <Text style={styles.previewOverlayText}>Change Screenshot</Text>
                                    </View>
                                </View>
                            ) : (
                                <View style={styles.uploadPlaceholder}>
                                    <View style={styles.uploadIconCircle}>
                                        <Ionicons name="cloud-upload" size={32} color="#E31C25" />
                                    </View>
                                    <Text style={styles.uploadMainText}>Upload Payment Proof</Text>
                                    <Text style={styles.uploadSubText}>PNG, JPG or JPEG (Max 5MB)</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* ── Terms & Agreement ── */}
                    <View style={styles.termsCard}>
                        <View style={styles.termsHeader}>
                            <Ionicons name="shield-checkmark" size={18} color="#10B981" />
                            <Text style={styles.termsTitle}>Tournament Agreement</Text>
                        </View>
                        <View style={styles.termsContent}>
                            <Text style={styles.termPoint}>• I confirm all details provided are accurate.</Text>
                            <Text style={styles.termPoint}>• I will follow all tournament rules and guidelines.</Text>
                            <Text style={styles.termPoint}>• Registration fee is non-refundable.</Text>
                        </View>
                        
                        <TouchableOpacity 
                            style={styles.checkboxWrapper} 
                            onPress={() => setAgreedToTerms(!agreedToTerms)}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.checkbox, agreedToTerms && styles.checkboxChecked]}>
                                {agreedToTerms && <Ionicons name="checkmark" size={16} color="#fff" />}
                            </View>
                            <Text style={styles.checkboxLabel}>I agree to all Terms & Conditions</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={{ height: 100 }} />
                </ScrollView>

                {/* ── Sticky Footer Button ── */}
                <View style={styles.footer}>
                    <TouchableOpacity 
                        style={[styles.submitBtn, (!proofImage || !agreedToTerms || submitting) && styles.submitBtnDisabled]} 
                        onPress={handleSubmit}
                        disabled={!proofImage || !agreedToTerms || submitting}
                    >
                        <LinearGradient 
                            colors={proofImage && agreedToTerms ? ['#E31C25', '#B91C1C'] : ['#D1D5DB', '#9CA3AF']} 
                            style={styles.submitGradient}
                        >
                            {submitting ? (
                                <ActivityIndicator color="#fff" size="small" />
                            ) : (
                                <>
                                    <Text style={styles.submitText}>Submit Registration</Text>
                                    <Ionicons name="arrow-forward" size={20} color="#fff" />
                                </>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' },
    loadingText: { marginTop: 12, color: '#6B7280', fontSize: 14, fontWeight: '600' },
    
    // Header
    header: { 
        paddingTop: Platform.OS === 'ios' ? 44 : (StatusBar.currentHeight || 0) + 10,
        paddingBottom: 15, 
        paddingHorizontal: 16,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    headerTop: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        height: 40,
    },
    backBtn: { 
        width: 38, 
        height: 38, 
        borderRadius: 10, 
        backgroundColor: 'rgba(255,255,255,0.2)', 
        justifyContent: 'center', 
        alignItems: 'center',
    },
    headerTitle: { 
        fontSize: 17, 
        fontWeight: '800', 
        color: '#ffffffff', 
        textAlign: 'center',
    },
    headerLogoContainer: {
        width: 40,
        height: 40,
        backgroundColor: '#fff',
        borderRadius: 20, // Perfect circle
        padding: 5,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
    },
    headerLogo: {
        width: '100%',
        height: '100%',
        borderRadius: 18,
    },
    leagueInfoRow: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'center', 
        marginTop: 10,
        gap: 10
    },
    tournamentName: { 
        fontSize: 18, 
        fontWeight: '700', 
        color: '#fcfcfcff', 
        maxWidth: width * 0.6 
    },
    sportBadge: { 
        backgroundColor: 'rgba(255,255,255,0.25)', 
        paddingHorizontal: 8, 
        paddingVertical: 2, 
        borderRadius: 12 
    },
    sportBadgeText: { 
        color: '#fff', 
        fontSize: 9, 
        fontWeight: '800' 
    },

    scrollContent: { paddingHorizontal: 20, paddingTop: 20 },

    // Summary Grid
    summaryGrid: { flexDirection: 'row', gap: 12, marginBottom: 25 },
    summaryItem: { flex: 1, backgroundColor: '#fff', padding: 15, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 10, elevation: 4, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
    summaryIconBox: { width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(227,28,37,0.05)', justifyContent: 'center', alignItems: 'center' },
    summaryLabel: { fontSize: 10, color: '#9CA3AF', fontWeight: '700', textTransform: 'uppercase' },
    summaryValue: { fontSize: 13, color: '#111827', fontWeight: '800' },

    // Sections
    sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
    sectionTitle: { fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 12 },
    autoBadge: { backgroundColor: '#10B981', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    autoBadgeText: { color: '#fff', fontSize: 9, fontWeight: '900' },

    // Player Card
    playerCard: { backgroundColor: '#fff', borderRadius: 24, padding: 20, marginBottom: 25, elevation: 2, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
    playerRow: { flexDirection: 'row', alignItems: 'center', gap: 15, paddingVertical: 5 },
    playerInfoCol: { flex: 1 },
    playerLabel: { fontSize: 11, color: '#9CA3AF', fontWeight: '600' },
    playerValue: { fontSize: 15, color: '#111827', fontWeight: '700', marginTop: 2 },
    divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 12 },

    // Payment Card
    paymentCard: { backgroundColor: '#fff', borderRadius: 24, padding: 20, marginBottom: 25, elevation: 3, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
    qrRow: { flexDirection: 'row', gap: 20, marginBottom: 20, alignItems: 'center' },
    qrContainer: { width: 140, height: 140, borderRadius: 20, backgroundColor: '#fff', padding: 10, elevation: 6, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, justifyContent: 'center', alignItems: 'center' },
    qrImage: { width: '100%', height: '100%' },
    qrLabelBox: { position: 'absolute', bottom: -12, backgroundColor: '#111827', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, flexDirection: 'row', alignItems: 'center' },
    qrLabelText: { color: '#fff', fontSize: 9, fontWeight: '900' },
    upiDetails: { flex: 1, justifyContent: 'center' },
    instructionTitle: { fontSize: 13, fontWeight: '800', color: '#111827', marginBottom: 6 },
    instructionStep: { fontSize: 12, color: '#6B7280', marginBottom: 4, fontWeight: '500' },
    copyContainer: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F9FAFB', borderStyle: 'dashed', borderWidth: 1, borderColor: '#D1D5DB', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, marginTop: 8 },
    upiIdText: { flex: 1, fontSize: 12, fontWeight: '700', color: '#E31C25' },

    amountBanner: { backgroundColor: '#F3F4F6', paddingVertical: 12, borderRadius: 15, alignItems: 'center', marginBottom: 20 },
    amountText: { fontSize: 15, fontWeight: '900', color: '#111827' },

    // Upload Area
    uploadArea: { height: 180, borderRadius: 20, borderStyle: 'dashed', borderWidth: 2, borderColor: '#D1D5DB', overflow: 'hidden' },
    uploadAreaActive: { borderColor: '#E31C25', borderStyle: 'solid' },
    uploadPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAFAFA' },
    uploadIconCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, marginBottom: 12 },
    uploadMainText: { fontSize: 15, fontWeight: '800', color: '#111827' },
    uploadSubText: { fontSize: 12, color: '#9CA3AF', marginTop: 4 },
    previewBox: { flex: 1 },
    previewImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    previewOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.6)', paddingVertical: 10, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
    previewOverlayText: { color: '#fff', fontSize: 13, fontWeight: '700' },

    // Terms Card
    termsCard: { backgroundColor: '#fff', borderRadius: 24, padding: 20, marginBottom: 30 },
    termsHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 15 },
    termsTitle: { fontSize: 15, fontWeight: '800', color: '#111827' },
    termsContent: { backgroundColor: '#F9FAFB', padding: 15, borderRadius: 15, marginBottom: 15 },
    termPoint: { fontSize: 12, color: '#6B7280', marginBottom: 6, lineHeight: 18, fontWeight: '500' },
    checkboxWrapper: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: '#D1D5DB', justifyContent: 'center', alignItems: 'center' },
    checkboxChecked: { backgroundColor: '#10B981', borderColor: '#10B981' },
    checkboxLabel: { fontSize: 14, fontWeight: '700', color: '#111827' },

    // Footer
    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, backgroundColor: 'rgba(255,255,255,0.95)', borderTopWidth: 1, borderTopColor: '#F3F4F6' },
    submitBtn: { height: 60, borderRadius: 20, overflow: 'hidden', elevation: 8, shadowColor: '#E31C25', shadowOpacity: 0.3, shadowRadius: 15, shadowOffset: { width: 0, height: 8 } },
    submitBtnDisabled: { shadowColor: '#000', shadowOpacity: 0, elevation: 0 },
    submitGradient: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12 },
    submitText: { color: '#fff', fontSize: 18, fontWeight: '800' },

    // Already registered / Success states
    alreadyRegistered: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 30, backgroundColor: '#fff' },
    successIconCircle: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#ECFDF5', justifyContent: 'center', alignItems: 'center', marginBottom: 25 },
    alreadyTitle: { fontSize: 26, fontWeight: '900', color: '#111827', marginBottom: 15 },
    alreadySubtitle: { fontSize: 15, color: '#6B7280', textAlign: 'center', lineHeight: 24, fontWeight: '500' },
    goBackBtn: { marginTop: 40, backgroundColor: '#F3F4F6', paddingHorizontal: 30, paddingVertical: 16, borderRadius: 20 },
    goBackBtnText: { fontSize: 15, fontWeight: '800', color: '#111827' },

    rejectionNotice: { 
        backgroundColor: '#FEE2E2', 
        padding: 15, 
        borderRadius: 15, 
        marginTop: 10,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#FECACA'
    },
    rejectionText: { 
        color: '#B91C1C', 
        fontSize: 13, 
        fontWeight: '600', 
        textAlign: 'center' 
    },

    // Modal Styles
    modalBackground: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
    modalCloseArea: { position: 'absolute', width: '100%', height: '100%' },
    modalContent: { width: width * 0.9, alignItems: 'center' },
    modalCloseBtn: { position: 'absolute', top: -60, right: 0, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
    modalQrWrapper: { width: width * 0.85, height: width * 0.85, backgroundColor: '#fff', borderRadius: 30, padding: 25, elevation: 20 },
    modalQrImage: { width: '100%', height: '100%' },
    modalHint: { color: '#9CA3AF', fontSize: 14, fontWeight: '600', marginTop: 30 },
});
