import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Keyboard,
    TouchableWithoutFeedback,
    Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { updateUserProfile } from '../../features/auth/authSlice';
import { useAppDispatch, useAppSelector } from '../../store/hooks';

import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'react-native';

const STEPS = ['Personal Info'];

export default function CreateProfile() {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const { user, loading } = useAppSelector(state => state.auth);

    const [currentStep, setCurrentStep] = useState(0);

    // Step 1: Basic Info
    const [name, setName] = useState(user?.name || '');
    const [phone, setPhone] = useState(user?.phone || '');
    const [city, setCity] = useState(user?.city || '');
    const [address, setAddress] = useState(user?.address || '');
    const [gender, setGender] = useState(user?.gender || 'Male');
    const [dob, setDob] = useState(user?.dob ? new Date(user.dob) : new Date());
    const [profileImage, setProfileImage] = useState(user?.profilePicture || null);
    const [showDatePicker, setShowDatePicker] = useState(false);

    // Step 2: Sports Selection
    const [selectedSport, setSelectedSport] = useState<string>(user?.sports?.[0] || '');

    // Default Structures for Robust Initialization
    const defaultCricket = {
        nickname: '', role: 'Batsman', battingStyle: 'Right-hand bat', bowlingStyle: 'Right-arm medium', jerseyNumber: '',
        country: '', state: '', currentTeam: '',
        careerSummary: { totalMatches: '', totalRuns: '', totalWickets: '', highestScore: '', battingAverage: '', strikeRate: '', economyRate: '', centuries: '', halfCenturies: '' },
        formatStats: [],
        leagueHistory: [],
        achievements: []
    };

    const defaultKabaddi = {
        age: '', height: '', weight: '', state: '', country: '', role: 'Raider', playingPosition: 'Left Corner', currentTeam: '', jerseyNumber: '', experienceYears: '',
        careerSummary: { matchesPlayed: '', totalPoints: '', averagePointsPerMatch: '', bestMatchPoints: '', totalWins: '', totalLosses: '' },
        raidingStats: { totalRaidAttempts: '', totalSuccessfulRaids: '', raidSuccessRate: '', totalRaidPoints: '', averageRaidPointsPerMatch: '', emptyRaids: '', bonusPoints: '', superRaids: '', super10s: '', doOrDieRaidPoints: '' },
        defenseStats: { totalTackleAttempts: '', totalSuccessfulTackles: '', tackleSuccessRate: '', totalTacklePoints: '', averageTacklePointsPerMatch: '', superTackles: '', high5s: '', ankleHolds: '', thighHolds: '', blocks: '', dashes: '' },
        records: { mostRaidPointsInMatch: '', mostTacklePointsInMatch: '', longestRaidStreak: '', bestSeasonRaidPoints: '', bestSeasonTacklePoints: '' },
        discipline: { greenCards: '', yellowCards: '', redCards: '', suspensions: '' },
        achievementStats: { mvpAwards: '', bestRaiderAwards: '', bestDefenderAwards: '', allRounderAwards: '', teamTitlesWon: '' },
        fitness: { injuries: '', fitnessStatus: 'Fit', lastMatchPlayedDate: '' }
    };

    const initCricket = (userData: any) => ({
        ...defaultCricket,
        ...(userData || {}),
        careerSummary: { ...defaultCricket.careerSummary, ...(userData?.careerSummary || {}) },
        formatStats: userData?.formatStats || [],
        leagueHistory: userData?.leagueHistory || [],
        achievements: userData?.achievements || []
    });

    const initKabaddi = (userData: any) => ({
        ...defaultKabaddi,
        ...(userData || {}),
        careerSummary: { ...defaultKabaddi.careerSummary, ...(userData?.careerSummary || {}) },
        raidingStats: { ...defaultKabaddi.raidingStats, ...(userData?.raidingStats || {}) },
        defenseStats: { ...defaultKabaddi.defenseStats, ...(userData?.defenseStats || {}) },
        records: { ...defaultKabaddi.records, ...(userData?.records || {}) },
        discipline: { ...defaultKabaddi.discipline, ...(userData?.discipline || {}) },
        achievementStats: { ...defaultKabaddi.achievementStats, ...(userData?.achievementStats || {}) },
        fitness: { ...defaultKabaddi.fitness, ...(userData?.fitness || {}) }
    });

    const [cricketDetails, setCricketDetails] = useState(initCricket(user?.playerProfile?.cricket));
    const [kabaddiDetails, setKabaddiDetails] = useState(initKabaddi(user?.playerProfile?.kabaddi));

    useEffect(() => {
        if (user) {
            setPhone(user.phone || '');
            setCity(user.city || '');
            setAddress(user.address || ''); // Sync Address
            setGender(user.gender || 'Male');
            if (user.dob) setDob(new Date(user.dob));
            if (user.profilePicture) setProfileImage(user.profilePicture);
        }
    }, [user]);

    const handleDateChange = (event: any, selectedDate?: Date) => {
        const currentDate = selectedDate || dob;
        setShowDatePicker(Platform.OS === 'ios');
        setDob(currentDate);
        if (Platform.OS === 'android') setShowDatePicker(false);
    };

    const pickImage = async () => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (permissionResult.granted === false) return Alert.alert("Permission Required", "Access to photos is needed!");

        const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.2, base64: true });
        if (!result.canceled && result.assets && result.assets.length > 0) {
            setProfileImage(`data:${result.assets[0].type};base64,${result.assets[0].base64}`);
        }
    };

    const handleNext = () => {
        handleSave();
    };

    const handleBack = () => currentStep > 0 ? setCurrentStep(currentStep - 1) : router.back();

    const cleanNumbers = (obj: any): any => {
        if (Array.isArray(obj)) return obj.map(cleanNumbers);
        const cleaned: any = {};
        for (const key in obj) {
            if (typeof obj[key] === 'object' && obj[key] !== null) cleaned[key] = cleanNumbers(obj[key]);
            else cleaned[key] = obj[key] === '' ? undefined : (isNaN(Number(obj[key])) ? obj[key] : Number(obj[key]));
        }
        return cleaned;
    };

    const handleSave = async () => {
        const updateData: any = {
            phone, city, address, gender,
            dob: dob instanceof Date ? dob.toISOString().split('T')[0] : dob,
            profilePicture: profileImage,
        };

        const result = await dispatch(updateUserProfile(updateData));
        if (updateUserProfile.fulfilled.match(result)) {
            Alert.alert('Success', 'Profile updated!', [{ text: 'OK', onPress: () => router.back() }]);
        } else {
            Alert.alert('Error', typeof result.payload === 'string' ? result.payload : 'Update failed');
        }
    };

    const renderInput = (label: string, value: string, setter: (val: string) => void, placeholder: string, keyboard: any = 'default', isSmall = false) => (
        <View style={isSmall ? styles.statInput : styles.inputGroup}>
            <Text style={isSmall ? styles.statLabel : styles.label}>{label}</Text>
            <TextInput style={isSmall ? styles.inputSmall : styles.input} value={String(value || '')} onChangeText={setter} placeholder={placeholder} keyboardType={keyboard} />
        </View>
    );

    const renderArraySection = (title: string, data: any[], setData: any, fields: any[]) => (
        <View>
            <View style={styles.arrayHeader}>
                <Text style={styles.sectionHeader}>{title}</Text>
                <TouchableOpacity onPress={() => setData([...data, {}])} style={styles.addButton}>
                    <Ionicons name="add" size={20} color="#fff" />
                </TouchableOpacity>
            </View>
            {data.map((item, index) => (
                <View key={index} style={styles.arrayItem}>
                    <Text style={styles.itemIndex}>#{index + 1}</Text>
                    {fields.map(f => (
                        <View key={f.key} style={styles.inputGroup}>
                            <Text style={styles.label}>{f.label}</Text>
                            <TextInput
                                style={styles.input}
                                value={String(item[f.key] || '')}
                                onChangeText={(t) => {
                                    const newData = [...data];
                                    newData[index] = { ...item, [f.key]: t };
                                    setData(newData);
                                }}
                                placeholder={f.placeholder}
                                keyboardType={f.keyboard || 'default'}
                            />
                        </View>
                    ))}
                    <TouchableOpacity onPress={() => {
                        const newData = data.filter((_, i) => i !== index);
                        setData(newData);
                    }} style={styles.removeButton}>
                        <Text style={styles.removeText}>Remove</Text>
                    </TouchableOpacity>
                </View>
            ))}
        </View>
    );

    const renderStep1 = () => (
        <View style={styles.form}>
            <View style={styles.avatarSection}>
                <View style={styles.avatarContainer}>
                    {profileImage ? <Image source={{ uri: profileImage }} style={styles.avatarImage} /> : (
                        <LinearGradient colors={['#E31C25', '#A00F15']} style={styles.avatarPlaceholder}>
                            <Text style={styles.avatarText}>{name ? name.charAt(0).toUpperCase() : 'U'}</Text>
                        </LinearGradient>
                    )}
                    <TouchableOpacity style={styles.cameraButton} onPress={pickImage}><Ionicons name="camera" size={20} color="#fff" /></TouchableOpacity>
                </View>
                <Text style={styles.changePhotoText}>Upload Picture</Text>
            </View>
            {renderInput('Phone Number', phone, setPhone, 'Enter Phone', 'phone-pad')}
            {renderInput('Address', address, setAddress, 'Enter Full Address')}
            {renderInput('Location *', city, setCity, 'Enter District & State')}
          

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Date of Birth *</Text>
                <TouchableOpacity 
                    style={styles.dateInput} 
                    onPress={() => setShowDatePicker(true)}
                    activeOpacity={0.7}
                >
                    <Text style={styles.dateText}>{dob.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</Text>
                    <Ionicons name="calendar" size={20} color="#E31C25" />
                </TouchableOpacity>

                {/* Android Date Picker */}
                {showDatePicker && Platform.OS === 'android' && (
                    <DateTimePicker 
                        value={dob} 
                        mode="date" 
                        display="default" 
                        onChange={handleDateChange} 
                        maximumDate={new Date()} 
                    />
                )}

                {/* iOS Date Picker Modal */}
                {Platform.OS === 'ios' && (
                    <Modal
                        visible={showDatePicker}
                        transparent={true}
                        animationType="slide"
                    >
                        <View style={styles.modalOverlay}>
                            <View style={styles.iosPickerContainer}>
                                <View style={styles.pickerHeader}>
                                    <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                                        <Text style={styles.pickerDoneBtn}>Done</Text>
                                    </TouchableOpacity>
                                </View>
                                <DateTimePicker 
                                    value={dob} 
                                    mode="date" 
                                    display="spinner" 
                                    onChange={handleDateChange} 
                                    maximumDate={new Date()}
                                    textColor="#000"
                                />
                            </View>
                        </View>
                    </Modal>
                )}
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Gender</Text>
                <View style={styles.row}>
                    {['Male', 'Female', 'Other'].map(g => (
                        <TouchableOpacity key={g} style={[styles.chip, gender === g && styles.activeChip]} onPress={() => setGender(g)}>
                            <Text style={[styles.chipText, gender === g && styles.activeChipText]}>{g}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        </View>
    );

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
            <LinearGradient colors={['#fff', '#f8f9fa']} style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={handleBack} style={styles.backButton}><Ionicons name="arrow-back" size={24} color="#333" /></TouchableOpacity>
                    <Text style={styles.headerTitle}>{user?.playerProfile ? 'Edit Profile' : 'Create Profile'}</Text>
                    <View style={{ width: 40 }} />
                </View>
                <ScrollView 
                    contentContainerStyle={styles.content}
                    keyboardDismissMode="on-drag"
                    keyboardShouldPersistTaps="handled"
                >
                    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                        <View>
                    {renderStep1()}
                        </View>
                    </TouchableWithoutFeedback>
                </ScrollView>
                <View style={styles.footer}>
                    <TouchableOpacity onPress={handleNext} disabled={loading} style={styles.nextButtonWrapper}>
                        <LinearGradient colors={['#E31C25', '#A00F15']} style={styles.nextButton}>
                            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.nextButtonText}>Save Profile</Text>}
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </LinearGradient>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
    backButton: { padding: 8, marginLeft: -8 },
    headerTitle: { fontSize: 18, fontWeight: 'bold' },
    content: { padding: 20, paddingBottom: 100 },
    form: { backgroundColor: '#fff', padding: 20, borderRadius: 16, elevation: 1 },
    inputGroup: { marginBottom: 15 },
    label: { marginBottom: 5, color: '#666', fontWeight: '500' },
    input: { borderWidth: 1, borderColor: '#ddd', padding: 12, borderRadius: 10, backgroundColor: '#fafafa', color: '#333' },
    statInput: { flex: 1 },
    inputSmall: { borderWidth: 1, borderColor: '#ddd', padding: 12, borderRadius: 10, textAlign: 'center', backgroundColor: '#fafafa' },
    statLabel: { fontSize: 11, textAlign: 'center', marginBottom: 4, color: '#888' },
    statsRow: { flexDirection: 'row', gap: 10, marginBottom: 15 },
    sectionHeader: { fontSize: 16, fontWeight: 'bold', marginTop: 25, marginBottom: 15, color: '#E31C25', letterSpacing: 0.5 },
    arrayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 15 },
    addButton: { backgroundColor: '#E31C25', borderRadius: 15, padding: 5 },
    arrayItem: { padding: 15, backgroundColor: '#f9f9f9', borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#eee' },
    itemIndex: { fontWeight: 'bold', marginBottom: 5, color: '#999' },
    removeButton: { marginTop: 5, alignSelf: 'flex-end' },
    removeText: { color: 'red', fontSize: 12, fontWeight: '600' },
    footer: { padding: 20, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f0f0f0' },
    nextButtonWrapper: { borderRadius: 12, overflow: 'hidden', elevation: 2 },
    nextButton: { padding: 16, alignItems: 'center', justifyContent: 'center' },
    nextButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    avatarSection: { alignItems: 'center', marginBottom: 20 },
    avatarContainer: { width: 100, height: 100, borderRadius: 50, borderColor: '#fff', borderWidth: 4, shadowColor: '#000', elevation: 5, backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center' },
    avatarImage: { width: 92, height: 92, borderRadius: 46 },
    avatarPlaceholder: { width: 92, height: 92, borderRadius: 46, backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center' },
    avatarText: { fontSize: 40, color: '#fff', fontWeight: 'bold' },
    cameraButton: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#333', padding: 8, borderRadius: 20, borderWidth: 2, borderColor: '#fff' },
    changePhotoText: { marginTop: 10, color: '#E31C25', fontWeight: '600' },
    dateInput: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#ddd', padding: 12, borderRadius: 10, backgroundColor: '#fafafa' },
    dateText: { fontSize: 16, color: '#333' },
    row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    rowScroll: { flexDirection: 'row', marginBottom: 15 },
    chip: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, backgroundColor: '#f0f0f0', marginRight: 10, borderWidth: 1, borderColor: 'transparent' },
    activeChip: { backgroundColor: '#FFF5F5', borderColor: '#E31C25' },
    chipText: { color: '#666' },
    activeChipText: { color: '#E31C25', fontWeight: 'bold' },
    stepTitle: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 25, color: '#333' },
    sportsGrid: { gap: 15 },
    sportCard: { padding: 16, borderWidth: 1, borderColor: '#eee', borderRadius: 12, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff' },
    activeSportCard: { borderColor: '#E31C25', backgroundColor: '#FFF5F5' },
    sportCardText: { fontSize: 16, marginLeft: 10, color: '#333', fontWeight: '500' },
    activeSportCardText: { fontSize: 16, marginLeft: 10, color: '#E31C25', fontWeight: 'bold' },
    radioCircle: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#ccc', justifyContent: 'center', alignItems: 'center' },
    activeRadioCircle: { borderColor: '#E31C25' },
    radioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#E31C25' },
    infoText: { textAlign: 'center', color: '#888', fontStyle: 'italic', marginTop: 20 },

    // Date Picker Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    iosPickerContainer: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingBottom: 40,
    },
    pickerHeader: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    pickerDoneBtn: {
        color: '#E31C25',
        fontSize: 17,
        fontWeight: 'bold',
    }
});
