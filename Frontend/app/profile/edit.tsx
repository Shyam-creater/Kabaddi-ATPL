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
    Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { updateUserProfile } from '../../features/auth/authSlice';
import { useAppDispatch, useAppSelector } from '../../store/hooks';

import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';

const STEPS = ['Personal Info', 'Sports Details'];

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

    // Step 2: Sports Details (Kabaddi Only)
    const [activeSports, setActiveSports] = useState<string[]>(['Kabaddi']);
    const [selectedSport, setSelectedSport] = useState<string>('Kabaddi');

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

    const defaultFootball = {
        age: '', height: '', weight: '', state: '', country: '', position: 'Forward', currentTeam: '', jerseyNumber: '', preferredFoot: 'Right', experienceYears: '',
        careerSummary: { matchesPlayed: '', totalGoals: '', totalAssists: '', cleanSheets: '', shotsOnTarget: '', passingAccuracy: '' },
        seasonStats: []
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

    const initFootball = (userData: any) => ({
        ...defaultFootball,
        ...(userData || {}),
        careerSummary: { ...defaultFootball.careerSummary, ...(userData?.careerSummary || {}) },
        seasonStats: userData?.seasonStats || []
    });

    const [cricketDetails, setCricketDetails] = useState(initCricket(user?.playerProfile?.cricket));
    const [kabaddiDetails, setKabaddiDetails] = useState(initKabaddi(user?.playerProfile?.kabaddi));
    const [footballDetails, setFootballDetails] = useState(initFootball(user?.playerProfile?.football));

    useEffect(() => {
        if (user) {
            setPhone(user.phone || '');
            setCity(user.city || '');
            setAddress(user.address || '');
            setGender(user.gender || 'Male');
            if (user.sports && user.sports.length > 0) {
                setActiveSports(user.sports);
                if (!user.sports.includes(selectedSport)) {
                    setSelectedSport(user.sports[0]);
                }
            }
            if (user.dob) setDob(new Date(user.dob));
            if (user.profilePicture) setProfileImage(user.profilePicture);
            if (user.playerProfile?.cricket) setCricketDetails(initCricket(user.playerProfile.cricket));
            if (user.playerProfile?.kabaddi) setKabaddiDetails(initKabaddi(user.playerProfile.kabaddi));
            if (user.playerProfile?.football) setFootballDetails(initFootball(user.playerProfile.football));
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
        if (currentStep === 0) {
            setCurrentStep(1);
        } else {
            handleSave();
        }
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
            sports: activeSports,
            playerProfile: cleanNumbers({
                cricket: cricketDetails,
                kabaddi: kabaddiDetails,
                football: footballDetails
            })
        };

        const result = await dispatch(updateUserProfile(updateData));
        if (updateUserProfile.fulfilled.match(result)) {
            Alert.alert('Success', 'Profile updated successfully!', [{ text: 'OK', onPress: () => router.back() }]);
        } else {
            Alert.alert('Error', typeof result.payload === 'string' ? result.payload : 'Update failed');
        }
    };

    const renderInput = (label: string, value: string | number, setter: (val: string) => void, placeholder: string, keyboard: any = 'default', isSmall = false) => (
        <View style={isSmall ? styles.statInput : styles.inputGroup}>
            <Text style={isSmall ? styles.statLabel : styles.label}>{label}</Text>
            <TextInput style={isSmall ? styles.inputSmall : styles.input} value={String(value ?? '')} onChangeText={setter} placeholder={placeholder} placeholderTextColor="#aaa" keyboardType={keyboard} />
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
            {renderInput('Location (City/State) *', city, setCity, 'Enter District & State')}

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

    const renderCricketForm = () => (
        <View>
            <Text style={styles.sectionHeader}>Cricket Profile & Info</Text>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Primary Role</Text>
                <View style={styles.row}>
                    {['Batsman', 'Bowler', 'All-rounder', 'Wicket Keeper'].map(r => (
                        <TouchableOpacity 
                            key={r} 
                            style={[styles.chip, cricketDetails.role === r && styles.activeChip]} 
                            onPress={() => setCricketDetails({ ...cricketDetails, role: r })}
                        >
                            <Text style={[styles.chipText, cricketDetails.role === r && styles.activeChipText]}>{r}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Batting Style</Text>
                <View style={styles.row}>
                    {['Right-hand bat', 'Left-hand bat'].map(bs => (
                        <TouchableOpacity 
                            key={bs} 
                            style={[styles.chip, cricketDetails.battingStyle === bs && styles.activeChip]} 
                            onPress={() => setCricketDetails({ ...cricketDetails, battingStyle: bs })}
                        >
                            <Text style={[styles.chipText, cricketDetails.battingStyle === bs && styles.activeChipText]}>{bs}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Bowling Style</Text>
                <View style={styles.row}>
                    {['Right-arm fast', 'Right-arm medium', 'Right-arm spin', 'Left-arm fast', 'Left-arm spin'].map(bw => (
                        <TouchableOpacity 
                            key={bw} 
                            style={[styles.chip, cricketDetails.bowlingStyle === bw && styles.activeChip]} 
                            onPress={() => setCricketDetails({ ...cricketDetails, bowlingStyle: bw })}
                        >
                            <Text style={[styles.chipText, cricketDetails.bowlingStyle === bw && styles.activeChipText]}>{bw}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {renderInput('Jersey Number', cricketDetails.jerseyNumber, (v) => setCricketDetails({ ...cricketDetails, jerseyNumber: v }), 'e.g. 18 or 7', 'number-pad')}
            {renderInput('Current Team / Club', cricketDetails.currentTeam, (v) => setCricketDetails({ ...cricketDetails, currentTeam: v }), 'e.g. Mumbai Warriors')}
            {renderInput('Nickname', cricketDetails.nickname, (v) => setCricketDetails({ ...cricketDetails, nickname: v }), 'e.g. Chiku')}

            <Text style={styles.sectionHeader}>Career Statistics Summary</Text>
            <View style={styles.statsRow}>
                {renderInput('TOTAL MATCHES', cricketDetails.careerSummary?.totalMatches, (v) => setCricketDetails({ ...cricketDetails, careerSummary: { ...cricketDetails.careerSummary, totalMatches: v } }), '0', 'number-pad', true)}
                {renderInput('TOTAL RUNS', cricketDetails.careerSummary?.totalRuns, (v) => setCricketDetails({ ...cricketDetails, careerSummary: { ...cricketDetails.careerSummary, totalRuns: v } }), '0', 'number-pad', true)}
                {renderInput('TOTAL WKTS', cricketDetails.careerSummary?.totalWickets, (v) => setCricketDetails({ ...cricketDetails, careerSummary: { ...cricketDetails.careerSummary, totalWickets: v } }), '0', 'number-pad', true)}
            </View>
            <View style={styles.statsRow}>
                {renderInput('HIGHEST SCORE', cricketDetails.careerSummary?.highestScore, (v) => setCricketDetails({ ...cricketDetails, careerSummary: { ...cricketDetails.careerSummary, highestScore: v } }), '0', 'number-pad', true)}
                {renderInput('BATTING AVG', cricketDetails.careerSummary?.battingAverage, (v) => setCricketDetails({ ...cricketDetails, careerSummary: { ...cricketDetails.careerSummary, battingAverage: v } }), '0.0', 'decimal-pad', true)}
                {renderInput('STRIKE RATE', cricketDetails.careerSummary?.strikeRate, (v) => setCricketDetails({ ...cricketDetails, careerSummary: { ...cricketDetails.careerSummary, strikeRate: v } }), '0.0', 'decimal-pad', true)}
            </View>
            <View style={styles.statsRow}>
                {renderInput('CENTURIES (100s)', cricketDetails.careerSummary?.centuries, (v) => setCricketDetails({ ...cricketDetails, careerSummary: { ...cricketDetails.careerSummary, centuries: v } }), '0', 'number-pad', true)}
                {renderInput('HALF CENTURIES (50s)', cricketDetails.careerSummary?.halfCenturies, (v) => setCricketDetails({ ...cricketDetails, careerSummary: { ...cricketDetails.careerSummary, halfCenturies: v } }), '0', 'number-pad', true)}
            </View>
        </View>
    );

    const renderKabaddiForm = () => (
        <View>
            <Text style={styles.sectionHeader}>Kabaddi Profile & Info</Text>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Role</Text>
                <View style={styles.row}>
                    {['Raider', 'Defender', 'All-Rounder'].map(r => (
                        <TouchableOpacity 
                            key={r} 
                            style={[styles.chip, kabaddiDetails.role === r && styles.activeChip]} 
                            onPress={() => setKabaddiDetails({ ...kabaddiDetails, role: r })}
                        >
                            <Text style={[styles.chipText, kabaddiDetails.role === r && styles.activeChipText]}>{r}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Playing Position</Text>
                <View style={styles.row}>
                    {['Left Corner', 'Right Corner', 'Left Cover', 'Right Cover', 'Left Raider', 'Right Raider'].map(pos => (
                        <TouchableOpacity 
                            key={pos} 
                            style={[styles.chip, kabaddiDetails.playingPosition === pos && styles.activeChip]} 
                            onPress={() => setKabaddiDetails({ ...kabaddiDetails, playingPosition: pos })}
                        >
                            <Text style={[styles.chipText, kabaddiDetails.playingPosition === pos && styles.activeChipText]}>{pos}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {renderInput('Jersey Number', kabaddiDetails.jerseyNumber, (v) => setKabaddiDetails({ ...kabaddiDetails, jerseyNumber: v }), 'e.g. 1', 'number-pad')}
            {renderInput('Current Team / Franchise', kabaddiDetails.currentTeam, (v) => setKabaddiDetails({ ...kabaddiDetails, currentTeam: v }), 'e.g. U Mumba')}

            <Text style={styles.sectionHeader}>Career Statistics</Text>
            <View style={styles.statsRow}>
                {renderInput('MATCHES PLAYED', kabaddiDetails.careerSummary?.matchesPlayed, (v) => setKabaddiDetails({ ...kabaddiDetails, careerSummary: { ...kabaddiDetails.careerSummary, matchesPlayed: v } }), '0', 'number-pad', true)}
                {renderInput('TOTAL POINTS', kabaddiDetails.careerSummary?.totalPoints, (v) => setKabaddiDetails({ ...kabaddiDetails, careerSummary: { ...kabaddiDetails.careerSummary, totalPoints: v } }), '0', 'number-pad', true)}
            </View>
            <View style={styles.statsRow}>
                {renderInput('RAID POINTS', kabaddiDetails.raidingStats?.totalRaidPoints, (v) => setKabaddiDetails({ ...kabaddiDetails, raidingStats: { ...kabaddiDetails.raidingStats, totalRaidPoints: v } }), '0', 'number-pad', true)}
                {renderInput('TACKLE POINTS', kabaddiDetails.defenseStats?.totalTacklePoints, (v) => setKabaddiDetails({ ...kabaddiDetails, defenseStats: { ...kabaddiDetails.defenseStats, totalTacklePoints: v } }), '0', 'number-pad', true)}
            </View>
            <View style={styles.statsRow}>
                {renderInput('SUPER 10s', kabaddiDetails.raidingStats?.super10s, (v) => setKabaddiDetails({ ...kabaddiDetails, raidingStats: { ...kabaddiDetails.raidingStats, super10s: v } }), '0', 'number-pad', true)}
                {renderInput('HIGH 5s', kabaddiDetails.defenseStats?.high5s, (v) => setKabaddiDetails({ ...kabaddiDetails, defenseStats: { ...kabaddiDetails.defenseStats, high5s: v } }), '0', 'number-pad', true)}
            </View>
        </View>
    );

    const renderFootballForm = () => (
        <View>
            <Text style={styles.sectionHeader}>Football Profile & Info</Text>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Position</Text>
                <View style={styles.row}>
                    {['Forward', 'Midfielder', 'Defender', 'Goalkeeper'].map(pos => (
                        <TouchableOpacity 
                            key={pos} 
                            style={[styles.chip, footballDetails.position === pos && styles.activeChip]} 
                            onPress={() => setFootballDetails({ ...footballDetails, position: pos })}
                        >
                            <Text style={[styles.chipText, footballDetails.position === pos && styles.activeChipText]}>{pos}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Preferred Foot</Text>
                <View style={styles.row}>
                    {['Right', 'Left', 'Both'].map(foot => (
                        <TouchableOpacity 
                            key={foot} 
                            style={[styles.chip, footballDetails.preferredFoot === foot && styles.activeChip]} 
                            onPress={() => setFootballDetails({ ...footballDetails, preferredFoot: foot })}
                        >
                            <Text style={[styles.chipText, footballDetails.preferredFoot === foot && styles.activeChipText]}>{foot}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {renderInput('Jersey Number', footballDetails.jerseyNumber, (v) => setFootballDetails({ ...footballDetails, jerseyNumber: v }), 'e.g. 10', 'number-pad')}
            {renderInput('Current Team / Club', footballDetails.currentTeam, (v) => setFootballDetails({ ...footballDetails, currentTeam: v }), 'e.g. Blue Tigers FC')}

            <Text style={styles.sectionHeader}>Career Statistics</Text>
            <View style={styles.statsRow}>
                {renderInput('MATCHES PLAYED', footballDetails.careerSummary?.matchesPlayed, (v) => setFootballDetails({ ...footballDetails, careerSummary: { ...footballDetails.careerSummary, matchesPlayed: v } }), '0', 'number-pad', true)}
                {renderInput('TOTAL GOALS', footballDetails.careerSummary?.totalGoals, (v) => setFootballDetails({ ...footballDetails, careerSummary: { ...footballDetails.careerSummary, totalGoals: v } }), '0', 'number-pad', true)}
            </View>
            <View style={styles.statsRow}>
                {renderInput('TOTAL ASSISTS', footballDetails.careerSummary?.totalAssists, (v) => setFootballDetails({ ...footballDetails, careerSummary: { ...footballDetails.careerSummary, totalAssists: v } }), '0', 'number-pad', true)}
                {renderInput('CLEAN SHEETS', footballDetails.careerSummary?.cleanSheets, (v) => setFootballDetails({ ...footballDetails, careerSummary: { ...footballDetails.careerSummary, cleanSheets: v } }), '0', 'number-pad', true)}
            </View>
        </View>
    );

    const renderStep2 = () => (
        <View style={styles.form}>
            {renderKabaddiForm()}
        </View>
    );

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
            <LinearGradient colors={['#fff', '#f8f9fa']} style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{user?.playerProfile ? 'Edit Profile' : 'Create Profile'}</Text>
                    <View style={{ width: 40 }} />
                </View>

                {/* Step Indicator */}
                <View style={styles.stepBarContainer}>
                    <View style={styles.stepHeader}>
                        <Text style={styles.stepTitleText}>
                            Step {currentStep + 1} of {STEPS.length}: {STEPS[currentStep]}
                        </Text>
                    </View>
                    <View style={styles.progressBarBackground}>
                        <View style={[styles.progressBarFill, { width: currentStep === 0 ? '50%' : '100%' }]} />
                    </View>
                </View>

                <ScrollView 
                    contentContainerStyle={styles.content}
                    keyboardDismissMode="on-drag"
                    keyboardShouldPersistTaps="handled"
                >
                    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                        <View>
                            {currentStep === 0 ? renderStep1() : renderStep2()}
                        </View>
                    </TouchableWithoutFeedback>
                </ScrollView>
                <View style={styles.footer}>
                    <TouchableOpacity onPress={handleNext} disabled={loading} style={styles.nextButtonWrapper}>
                        <LinearGradient colors={['#E31C25', '#A00F15']} style={styles.nextButton}>
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <View style={styles.nextButtonContent}>
                                    <Text style={styles.nextButtonText}>
                                        {currentStep === 0 ? 'Next: Sports Details' : 'Save Profile'}
                                    </Text>
                                    <Ionicons 
                                        name={currentStep === 0 ? "arrow-forward" : "checkmark-circle"} 
                                        size={20} 
                                        color="#fff" 
                                        style={{ marginLeft: 8 }}
                                    />
                                </View>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </LinearGradient>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
    backButton: { padding: 8, marginLeft: -8 },
    headerTitle: { fontSize: 18, fontWeight: 'bold' },
    
    stepBarContainer: { backgroundColor: '#fff', paddingHorizontal: 20, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
    stepHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    stepTitleText: { fontSize: 13, fontWeight: '700', color: '#E31C25', letterSpacing: 0.5 },
    progressBarBackground: { height: 6, backgroundColor: '#eee', borderRadius: 3, overflow: 'hidden' },
    progressBarFill: { height: '100%', backgroundColor: '#E31C25', borderRadius: 3 },

    content: { padding: 20, paddingBottom: 100 },
    form: { backgroundColor: '#fff', padding: 20, borderRadius: 16, elevation: 1 },
    inputGroup: { marginBottom: 15 },
    label: { marginBottom: 5, color: '#666', fontWeight: '500' },
    input: { borderWidth: 1, borderColor: '#ddd', padding: 12, borderRadius: 10, backgroundColor: '#fafafa', color: '#333' },
    statInput: { flex: 1 },
    inputSmall: { borderWidth: 1, borderColor: '#ddd', padding: 12, borderRadius: 10, textAlign: 'center', backgroundColor: '#fafafa', color: '#333' },
    statLabel: { fontSize: 11, textAlign: 'center', marginBottom: 4, color: '#888', fontWeight: '600' },
    statsRow: { flexDirection: 'row', gap: 10, marginBottom: 15 },
    sectionHeader: { fontSize: 16, fontWeight: 'bold', marginTop: 15, marginBottom: 15, color: '#E31C25', letterSpacing: 0.5 },
    footer: { padding: 20, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f0f0f0' },
    nextButtonWrapper: { borderRadius: 12, overflow: 'hidden', elevation: 2 },
    nextButton: { padding: 16, alignItems: 'center', justifyContent: 'center' },
    nextButtonContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
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
    chip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, backgroundColor: '#f0f0f0', marginRight: 6, marginBottom: 6, borderWidth: 1, borderColor: 'transparent', flexDirection: 'row', alignItems: 'center' },
    activeChip: { backgroundColor: '#FFF5F5', borderColor: '#E31C25' },
    chipText: { color: '#666', fontSize: 13 },
    activeChipText: { color: '#E31C25', fontWeight: 'bold' },

    sportTabContainer: { flexDirection: 'row', marginBottom: 20, backgroundColor: '#f5f5f5', borderRadius: 12, padding: 4, gap: 4 },
    sportTab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 10, gap: 6 },
    activeSportTab: { backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
    sportTabText: { fontSize: 13, fontWeight: '600', color: '#666' },
    activeSportTabText: { color: '#E31C25', fontWeight: 'bold' },

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
