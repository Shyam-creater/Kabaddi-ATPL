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

const STEPS = ['Personal Info', 'Select Sport', 'Sport Details'];

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
            setName(user.name || '');
            setPhone(user.phone || '');
            setCity(user.city || '');
            setAddress(user.address || ''); // Sync Address
            setGender(user.gender || 'Male');
            if (user.dob) setDob(new Date(user.dob));
            if (user.profilePicture) setProfileImage(user.profilePicture);
            if (user.sports && user.sports.length > 0) setSelectedSport(user.sports[0]);

            if (user.playerProfile?.cricket) setCricketDetails(initCricket(user.playerProfile.cricket));
            if (user.playerProfile?.kabaddi) setKabaddiDetails(initKabaddi(user.playerProfile.kabaddi));
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
        if (currentStep === 0 && (!name || !city || !dob)) return Alert.alert('Missing Info', 'Please fill Name, Location and DOB');
        if (currentStep === 1 && !selectedSport) return Alert.alert('Select Sport', 'Please select at least one sport');
        if (currentStep < STEPS.length - 1) setCurrentStep(currentStep + 1);
        else handleSave();
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
            name, phone, city, address, gender,
            sports: [selectedSport],
            dob: dob instanceof Date ? dob.toISOString().split('T')[0] : dob,
            profilePicture: profileImage,
            playerProfile: {
                cricket: selectedSport === 'Cricket' ? cleanNumbers(cricketDetails) : undefined,
                kabaddi: selectedSport === 'Kabaddi' ? cleanNumbers(kabaddiDetails) : undefined
            }
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
            {renderInput('Full Name *', name, setName, 'Enter Name')}
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

    const renderStep2 = () => (
        <View style={styles.form}>
            <Text style={styles.stepTitle}>Select Sport</Text>
            <View style={styles.sportsGrid}>
                {['Cricket', 'Kabaddi', 'Football', 'Volleyball', 'Badminton'].map(sport => (
                    <TouchableOpacity key={sport} style={[styles.sportCard, selectedSport === sport && styles.activeSportCard]} onPress={() => setSelectedSport(sport)}>
                        <View style={[styles.radioCircle, selectedSport === sport && styles.activeRadioCircle]}>
                            {selectedSport === sport && <View style={styles.radioInner} />}
                        </View>
                        <Text style={[styles.sportCardText, selectedSport === sport && styles.activeSportCardText]}>{sport}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );

    const renderKabaddiForm = () => (
        <View style={styles.form}>
            <Text style={styles.stepTitle}>Kabaddi Profile</Text>

            <Text style={styles.sectionHeader}>1. Basic Information</Text>
            <View style={styles.statsRow}>
                {renderInput('Age', kabaddiDetails.age, t => setKabaddiDetails({ ...kabaddiDetails, age: t }), '25', 'numeric', true)}
                {renderInput('Height', kabaddiDetails.height, t => setKabaddiDetails({ ...kabaddiDetails, height: t }), '180cm', 'default', true)}
                {renderInput('Weight', kabaddiDetails.weight, t => setKabaddiDetails({ ...kabaddiDetails, weight: t }), '75kg', 'default', true)}
            </View>
            {renderInput('State', kabaddiDetails.state, t => setKabaddiDetails({ ...kabaddiDetails, state: t }), 'State')}
            {renderInput('Country', kabaddiDetails.country, t => setKabaddiDetails({ ...kabaddiDetails, country: t }), 'Country')}
            {renderInput('Team', kabaddiDetails.currentTeam, t => setKabaddiDetails({ ...kabaddiDetails, currentTeam: t }), 'Current Team')}
            <View style={styles.statsRow}>
                {renderInput('Jersey No.', kabaddiDetails.jerseyNumber, t => setKabaddiDetails({ ...kabaddiDetails, jerseyNumber: t }), '10', 'numeric', true)}
                {renderInput('Exp (Yrs)', kabaddiDetails.experienceYears, t => setKabaddiDetails({ ...kabaddiDetails, experienceYears: t }), '5', 'numeric', true)}
            </View>
            <Text style={styles.label}>Position</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.rowScroll}>
                {['Raider', 'Left Corner', 'Right Corner', 'Left Cover', 'Right Cover', 'All-rounder'].map(pos => (
                    <TouchableOpacity key={pos} style={[styles.chip, kabaddiDetails.playingPosition === pos && styles.activeChip]} onPress={() => setKabaddiDetails({ ...kabaddiDetails, playingPosition: pos })}>
                        <Text style={[styles.chipText, kabaddiDetails.playingPosition === pos && styles.activeChipText]}>{pos}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            <Text style={styles.sectionHeader}>2. Career Overview</Text>
            <View style={styles.statsRow}>
                {renderInput('Matches', kabaddiDetails.careerSummary?.matchesPlayed, t => setKabaddiDetails({ ...kabaddiDetails, careerSummary: { ...kabaddiDetails.careerSummary, matchesPlayed: t } }), '0', 'numeric', true)}
                {renderInput('Total Pts', kabaddiDetails.careerSummary?.totalPoints, t => setKabaddiDetails({ ...kabaddiDetails, careerSummary: { ...kabaddiDetails.careerSummary, totalPoints: t } }), '0', 'numeric', true)}
            </View>
            <View style={styles.statsRow}>
                {renderInput('Avg Pts', kabaddiDetails.careerSummary?.averagePointsPerMatch, t => setKabaddiDetails({ ...kabaddiDetails, careerSummary: { ...kabaddiDetails.careerSummary, averagePointsPerMatch: t } }), '0', 'numeric', true)}
                {renderInput('Best Match', kabaddiDetails.careerSummary?.bestMatchPoints, t => setKabaddiDetails({ ...kabaddiDetails, careerSummary: { ...kabaddiDetails.careerSummary, bestMatchPoints: t } }), '0', 'numeric', true)}
            </View>
            <View style={styles.statsRow}>
                {renderInput('Wins', kabaddiDetails.careerSummary?.totalWins, t => setKabaddiDetails({ ...kabaddiDetails, careerSummary: { ...kabaddiDetails.careerSummary, totalWins: t } }), '0', 'numeric', true)}
                {renderInput('Losses', kabaddiDetails.careerSummary?.totalLosses, t => setKabaddiDetails({ ...kabaddiDetails, careerSummary: { ...kabaddiDetails.careerSummary, totalLosses: t } }), '0', 'numeric', true)}
            </View>

            <Text style={styles.sectionHeader}>3. Raiding Stats</Text>
            <View style={styles.statsRow}>
                {renderInput('Attempts', kabaddiDetails.raidingStats?.totalRaidAttempts, t => setKabaddiDetails({ ...kabaddiDetails, raidingStats: { ...kabaddiDetails.raidingStats, totalRaidAttempts: t } }), '0', 'numeric', true)}
                {renderInput('Successful', kabaddiDetails.raidingStats?.totalSuccessfulRaids, t => setKabaddiDetails({ ...kabaddiDetails, raidingStats: { ...kabaddiDetails.raidingStats, totalSuccessfulRaids: t } }), '0', 'numeric', true)}
                {renderInput('Success %', kabaddiDetails.raidingStats?.raidSuccessRate, t => setKabaddiDetails({ ...kabaddiDetails, raidingStats: { ...kabaddiDetails.raidingStats, raidSuccessRate: t } }), '0', 'numeric', true)}
            </View>
            <View style={styles.statsRow}>
                {renderInput('Raid Pts', kabaddiDetails.raidingStats?.totalRaidPoints, t => setKabaddiDetails({ ...kabaddiDetails, raidingStats: { ...kabaddiDetails.raidingStats, totalRaidPoints: t } }), '0', 'numeric', true)}
                {renderInput('Avg Raid Pts', kabaddiDetails.raidingStats?.averageRaidPointsPerMatch, t => setKabaddiDetails({ ...kabaddiDetails, raidingStats: { ...kabaddiDetails.raidingStats, averageRaidPointsPerMatch: t } }), '0', 'numeric', true)}
            </View>
            <View style={styles.statsRow}>
                {renderInput('Empty Raids', kabaddiDetails.raidingStats?.emptyRaids, t => setKabaddiDetails({ ...kabaddiDetails, raidingStats: { ...kabaddiDetails.raidingStats, emptyRaids: t } }), '0', 'numeric', true)}
                {renderInput('Bonus Pts', kabaddiDetails.raidingStats?.bonusPoints, t => setKabaddiDetails({ ...kabaddiDetails, raidingStats: { ...kabaddiDetails.raidingStats, bonusPoints: t } }), '0', 'numeric', true)}
            </View>
            <View style={styles.statsRow}>
                {renderInput('Super Raids', kabaddiDetails.raidingStats?.superRaids, t => setKabaddiDetails({ ...kabaddiDetails, raidingStats: { ...kabaddiDetails.raidingStats, superRaids: t } }), '0', 'numeric', true)}
                {renderInput('Super 10s', kabaddiDetails.raidingStats?.super10s, t => setKabaddiDetails({ ...kabaddiDetails, raidingStats: { ...kabaddiDetails.raidingStats, super10s: t } }), '0', 'numeric', true)}
                {renderInput('DoOrDie Pts', kabaddiDetails.raidingStats?.doOrDieRaidPoints, t => setKabaddiDetails({ ...kabaddiDetails, raidingStats: { ...kabaddiDetails.raidingStats, doOrDieRaidPoints: t } }), '0', 'numeric', true)}
            </View>

            <Text style={styles.sectionHeader}>4. Defensive Stats</Text>
            <View style={styles.statsRow}>
                {renderInput('Attempts', kabaddiDetails.defenseStats?.totalTackleAttempts, t => setKabaddiDetails({ ...kabaddiDetails, defenseStats: { ...kabaddiDetails.defenseStats, totalTackleAttempts: t } }), '0', 'numeric', true)}
                {renderInput('Successful', kabaddiDetails.defenseStats?.totalSuccessfulTackles, t => setKabaddiDetails({ ...kabaddiDetails, defenseStats: { ...kabaddiDetails.defenseStats, totalSuccessfulTackles: t } }), '0', 'numeric', true)}
                {renderInput('Success %', kabaddiDetails.defenseStats?.tackleSuccessRate, t => setKabaddiDetails({ ...kabaddiDetails, defenseStats: { ...kabaddiDetails.defenseStats, tackleSuccessRate: t } }), '0', 'numeric', true)}
            </View>
            <View style={styles.statsRow}>
                {renderInput('Tackle Pts', kabaddiDetails.defenseStats?.totalTacklePoints, t => setKabaddiDetails({ ...kabaddiDetails, defenseStats: { ...kabaddiDetails.defenseStats, totalTacklePoints: t } }), '0', 'numeric', true)}
                {renderInput('Avg Pts', kabaddiDetails.defenseStats?.averageTacklePointsPerMatch, t => setKabaddiDetails({ ...kabaddiDetails, defenseStats: { ...kabaddiDetails.defenseStats, averageTacklePointsPerMatch: t } }), '0', 'numeric', true)}
            </View>
            <View style={styles.statsRow}>
                {renderInput('Super Tackles', kabaddiDetails.defenseStats?.superTackles, t => setKabaddiDetails({ ...kabaddiDetails, defenseStats: { ...kabaddiDetails.defenseStats, superTackles: t } }), '0', 'numeric', true)}
                {renderInput('High 5s', kabaddiDetails.defenseStats?.high5s, t => setKabaddiDetails({ ...kabaddiDetails, defenseStats: { ...kabaddiDetails.defenseStats, high5s: t } }), '0', 'numeric', true)}
            </View>
            <View style={styles.statsRow}>
                {renderInput('Ankle Holds', kabaddiDetails.defenseStats?.ankleHolds, t => setKabaddiDetails({ ...kabaddiDetails, defenseStats: { ...kabaddiDetails.defenseStats, ankleHolds: t } }), '0', 'numeric', true)}
                {renderInput('Thigh Holds', kabaddiDetails.defenseStats?.thighHolds, t => setKabaddiDetails({ ...kabaddiDetails, defenseStats: { ...kabaddiDetails.defenseStats, thighHolds: t } }), '0', 'numeric', true)}
            </View>
            <View style={styles.statsRow}>
                {renderInput('Blocks', kabaddiDetails.defenseStats?.blocks, t => setKabaddiDetails({ ...kabaddiDetails, defenseStats: { ...kabaddiDetails.defenseStats, blocks: t } }), '0', 'numeric', true)}
                {renderInput('Dashes', kabaddiDetails.defenseStats?.dashes, t => setKabaddiDetails({ ...kabaddiDetails, defenseStats: { ...kabaddiDetails.defenseStats, dashes: t } }), '0', 'numeric', true)}
            </View>

            <Text style={styles.sectionHeader}>5. Performance Records</Text>
            {renderInput('Most Raid Pts (Match)', kabaddiDetails.records?.mostRaidPointsInMatch, t => setKabaddiDetails({ ...kabaddiDetails, records: { ...kabaddiDetails.records, mostRaidPointsInMatch: t } }), '0', 'numeric')}
            {renderInput('Most Tackle Pts (Match)', kabaddiDetails.records?.mostTacklePointsInMatch, t => setKabaddiDetails({ ...kabaddiDetails, records: { ...kabaddiDetails.records, mostTacklePointsInMatch: t } }), '0', 'numeric')}
            {renderInput('Longest Raid Streak', kabaddiDetails.records?.longestRaidStreak, t => setKabaddiDetails({ ...kabaddiDetails, records: { ...kabaddiDetails.records, longestRaidStreak: t } }), '0', 'numeric')}
            {renderInput('Best Season Raid Pts', kabaddiDetails.records?.bestSeasonRaidPoints, t => setKabaddiDetails({ ...kabaddiDetails, records: { ...kabaddiDetails.records, bestSeasonRaidPoints: t } }), '0', 'numeric')}
            {renderInput('Best Season Tackle Pts', kabaddiDetails.records?.bestSeasonTacklePoints, t => setKabaddiDetails({ ...kabaddiDetails, records: { ...kabaddiDetails.records, bestSeasonTacklePoints: t } }), '0', 'numeric')}

            <Text style={styles.sectionHeader}>6. Discipline</Text>
            <View style={styles.statsRow}>
                {renderInput('Green Cards', kabaddiDetails.discipline?.greenCards, t => setKabaddiDetails({ ...kabaddiDetails, discipline: { ...kabaddiDetails.discipline, greenCards: t } }), '0', 'numeric', true)}
                {renderInput('Yellow Cards', kabaddiDetails.discipline?.yellowCards, t => setKabaddiDetails({ ...kabaddiDetails, discipline: { ...kabaddiDetails.discipline, yellowCards: t } }), '0', 'numeric', true)}
                {renderInput('Red Cards', kabaddiDetails.discipline?.redCards, t => setKabaddiDetails({ ...kabaddiDetails, discipline: { ...kabaddiDetails.discipline, redCards: t } }), '0', 'numeric', true)}
                {renderInput('Suspensions', kabaddiDetails.discipline?.suspensions, t => setKabaddiDetails({ ...kabaddiDetails, discipline: { ...kabaddiDetails.discipline, suspensions: t } }), '0', 'numeric', true)}
            </View>

            <Text style={styles.sectionHeader}>7. Achievements</Text>
            <View style={styles.statsRow}>
                {renderInput('MVP Awards', kabaddiDetails.achievementStats?.mvpAwards, t => setKabaddiDetails({ ...kabaddiDetails, achievementStats: { ...kabaddiDetails.achievementStats, mvpAwards: t } }), '0', 'numeric', true)}
                {renderInput('Best Raider', kabaddiDetails.achievementStats?.bestRaiderAwards, t => setKabaddiDetails({ ...kabaddiDetails, achievementStats: { ...kabaddiDetails.achievementStats, bestRaiderAwards: t } }), '0', 'numeric', true)}
            </View>
            <View style={styles.statsRow}>
                {renderInput('Best Defender', kabaddiDetails.achievementStats?.bestDefenderAwards, t => setKabaddiDetails({ ...kabaddiDetails, achievementStats: { ...kabaddiDetails.achievementStats, bestDefenderAwards: t } }), '0', 'numeric', true)}
                {renderInput('All Rounder', kabaddiDetails.achievementStats?.allRounderAwards, t => setKabaddiDetails({ ...kabaddiDetails, achievementStats: { ...kabaddiDetails.achievementStats, allRounderAwards: t } }), '0', 'numeric', true)}
            </View>
            {renderInput('Team Titles', kabaddiDetails.achievementStats?.teamTitlesWon, t => setKabaddiDetails({ ...kabaddiDetails, achievementStats: { ...kabaddiDetails.achievementStats, teamTitlesWon: t } }), '0', 'numeric')}

            <Text style={styles.sectionHeader}>8. Fitness & Status</Text>
            {renderInput('Injuries', kabaddiDetails.fitness?.injuries, t => setKabaddiDetails({ ...kabaddiDetails, fitness: { ...kabaddiDetails.fitness, injuries: t } }), 'None')}
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Fitness Status</Text>
                <View style={styles.row}>
                    {['Fit', 'Recovering', 'Injured'].map(s => (
                        <TouchableOpacity key={s} style={[styles.chip, kabaddiDetails.fitness?.fitnessStatus === s && styles.activeChip]} onPress={() => setKabaddiDetails({ ...kabaddiDetails, fitness: { ...kabaddiDetails.fitness, fitnessStatus: s } })}>
                            <Text style={[styles.chipText, kabaddiDetails.fitness?.fitnessStatus === s && styles.activeChipText]}>{s}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
            {renderInput('Last Match Date', kabaddiDetails.fitness?.lastMatchPlayedDate, t => setKabaddiDetails({ ...kabaddiDetails, fitness: { ...kabaddiDetails.fitness, lastMatchPlayedDate: t } }), 'YYYY-MM-DD')}

        </View>
    );

    const renderCricketForm = () => (
        <View style={styles.form}>
            <Text style={styles.stepTitle}>Cricket Profile</Text>
            <Text style={styles.sectionHeader}>Basic Info</Text>
            {renderInput('State', cricketDetails.state, t => setCricketDetails({ ...cricketDetails, state: t }), 'State')}
            {renderInput('Current Team', cricketDetails.currentTeam, t => setCricketDetails({ ...cricketDetails, currentTeam: t }), 'Team Name')}
            <View style={styles.statsRow}>
                {renderInput('Jersey No', cricketDetails.jerseyNumber, t => setCricketDetails({ ...cricketDetails, jerseyNumber: t }), '18', 'numeric', true)}
                {renderInput('Role', cricketDetails.role, t => setCricketDetails({ ...cricketDetails, role: t }), 'Batsman', 'default', true)}
            </View>
            <Text style={styles.sectionHeader}>Styles</Text>
            {renderInput('Batting Style', cricketDetails.battingStyle, t => setCricketDetails({ ...cricketDetails, battingStyle: t }), 'Right-hand bat')}
            {renderInput('Bowling Style', cricketDetails.bowlingStyle, t => setCricketDetails({ ...cricketDetails, bowlingStyle: t }), 'Right-arm fast')}
            <Text style={styles.sectionHeader}>Career Summary</Text>
            <View style={styles.statsRow}>
                {renderInput('Matches', cricketDetails.careerSummary?.totalMatches, t => setCricketDetails({ ...cricketDetails, careerSummary: { ...cricketDetails.careerSummary, totalMatches: t } }), '0', 'numeric', true)}
                {renderInput('Runs', cricketDetails.careerSummary?.totalRuns, t => setCricketDetails({ ...cricketDetails, careerSummary: { ...cricketDetails.careerSummary, totalRuns: t } }), '0', 'numeric', true)}
                {renderInput('Wickets', cricketDetails.careerSummary?.totalWickets, t => setCricketDetails({ ...cricketDetails, careerSummary: { ...cricketDetails.careerSummary, totalWickets: t } }), '0', 'numeric', true)}
            </View>
            <View style={styles.statsRow}>
                {renderInput('Highest Score', cricketDetails.careerSummary?.highestScore, t => setCricketDetails({ ...cricketDetails, careerSummary: { ...cricketDetails.careerSummary, highestScore: t } }), '0', 'numeric', true)}
                {renderInput('Average', cricketDetails.careerSummary?.battingAverage, t => setCricketDetails({ ...cricketDetails, careerSummary: { ...cricketDetails.careerSummary, battingAverage: t } }), '0.00', 'numeric', true)}
            </View>

            {/* Arrays with Average added */}
            {renderArraySection('Format Stats', cricketDetails.formatStats, (d: any) => setCricketDetails({ ...cricketDetails, formatStats: d }), [
                { key: 'format', label: 'Format', placeholder: 'T20' },
                { key: 'matches', label: 'Mat', placeholder: '0', keyboard: 'numeric' },
                { key: 'runs', label: 'Run', placeholder: '0', keyboard: 'numeric' },
                { key: 'wickets', label: 'Wkt', placeholder: '0', keyboard: 'numeric' },
                { key: 'average', label: 'Avg', placeholder: '0.0', keyboard: 'numeric' } // Added Average
            ])}
            {renderArraySection('League History', cricketDetails.leagueHistory, (d: any) => setCricketDetails({ ...cricketDetails, leagueHistory: d }), [
                { key: 'leagueName', label: 'League', placeholder: 'IPL' },
                { key: 'teamName', label: 'Team', placeholder: 'CSK' },
                { key: 'season', label: 'Year', placeholder: '2023', keyboard: 'numeric' },
                { key: 'matches', label: 'Mat', placeholder: '0', keyboard: 'numeric' },
                { key: 'runs', label: 'Run', placeholder: '0', keyboard: 'numeric' },
                { key: 'wickets', label: 'Wkt', placeholder: '0', keyboard: 'numeric' }
            ])}
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
                    {currentStep === 0 && renderStep1()}
                    {currentStep === 1 && renderStep2()}
                    {currentStep === 2 && (selectedSport === 'Cricket' ? renderCricketForm() : selectedSport === 'Kabaddi' ? renderKabaddiForm() : <Text style={styles.infoText}>Select Sport First</Text>)}
                        </View>
                    </TouchableWithoutFeedback>
                </ScrollView>
                <View style={styles.footer}>
                    <TouchableOpacity onPress={handleNext} disabled={loading} style={styles.nextButtonWrapper}>
                        <LinearGradient colors={['#E31C25', '#A00F15']} style={styles.nextButton}>
                            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.nextButtonText}>{currentStep === STEPS.length - 1 ? 'Save Profile' : 'Next Step'}</Text>}
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
