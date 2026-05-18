import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Linking,
    Platform,
    Share,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ContactScreen() {
    const router = useRouter();

    const contactInfo = {
        location: 'No. 20/14, Kalaivanar Street, Sapthagiri Colony, Jafferkhanpet, Chennai- 600 083',
        email: 'AdminAattumTpl@gmail.com',
        phone: '+91 93848 20659',
    };

    const handleCall = () => {
        Linking.openURL(`tel:${contactInfo.phone.replace(/\s/g, '')}`);
    };

    const handleEmail = () => {
        Linking.openURL(`mailto:${contactInfo.email}`);
    };

    const handleLocation = () => {
        const address = encodeURIComponent(contactInfo.location);
        const url = Platform.select({
            ios: `maps:0,0?q=${address}`,
            android: `geo:0,0?q=${address}`,
        });
        Linking.openURL(url || `https://maps.google.com/?q=${address}`);
    };

    const handleShareApp = async () => {
        try {
            await Share.share({
                message: '🏏 Check out Aattum TPL Score App!\n\nTrack cricket tournaments, live scores, and connect with players.\n\nDownload now: https://play.google.com/store/apps/details?id=com.aattumtpl',
                title: 'Aattum TPL Score App',
            });
        } catch (error) {
            console.log('Error sharing:', error);
        }
    };

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Custom Header */}
            <LinearGradient
                colors={['#E31C25', '#900C12']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.header}
            >
                <SafeAreaView edges={['top']}>
                    <View style={styles.headerContent}>
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => router.back()}
                        >
                            <Ionicons name="arrow-back" size={24} color="#fff" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Contact Us</Text>
                        <View style={styles.placeholder} />
                    </View>
                </SafeAreaView>
            </LinearGradient>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Hero Section */}
                <View style={styles.heroSection}>
                    <View style={styles.iconCircle}>
                        <MaterialIcons name="headset-mic" size={50} color="#E31C25" />
                    </View>
                    <Text style={styles.heroTitle}>Get in Touch</Text>
                    <Text style={styles.heroSubtitle}>
                        We're here to help! Reach out to us anytime.
                    </Text>
                </View>

                {/* Contact Cards */}
                <View style={styles.cardsContainer}>
                    {/* Location Card */}
                    <TouchableOpacity style={styles.contactCard} onPress={handleLocation} activeOpacity={0.7}>
                        <LinearGradient
                            colors={['#E8F5E9', '#C8E6C9']}
                            style={styles.iconGradient}
                        >
                            <Ionicons name="location" size={26} color="#4CAF50" />
                        </LinearGradient>
                        <View style={styles.cardContent}>
                            <Text style={styles.cardLabel}>Visit Us</Text>
                            <Text style={styles.cardValue}>{contactInfo.location}</Text>
                            <Text style={styles.cardAction}>Tap to open in maps →</Text>
                        </View>
                    </TouchableOpacity>

                    {/* Email Card */}
                    <TouchableOpacity style={styles.contactCard} onPress={handleEmail} activeOpacity={0.7}>
                        <LinearGradient
                            colors={['#E3F2FD', '#BBDEFB']}
                            style={styles.iconGradient}
                        >
                            <Ionicons name="mail" size={26} color="#2196F3" />
                        </LinearGradient>
                        <View style={styles.cardContent}>
                            <Text style={styles.cardLabel}>Email Us</Text>
                            <Text style={styles.cardValue}>{contactInfo.email}</Text>
                            <Text style={styles.cardAction}>Tap to send email →</Text>
                        </View>
                    </TouchableOpacity>

                    {/* Phone Card */}
                    <TouchableOpacity style={styles.contactCard} onPress={handleCall} activeOpacity={0.7}>
                        <LinearGradient
                            colors={['#FFF3E0', '#FFE0B2']}
                            style={styles.iconGradient}
                        >
                            <Ionicons name="call" size={26} color="#FF9800" />
                        </LinearGradient>
                        <View style={styles.cardContent}>
                            <Text style={styles.cardLabel}>Call Us</Text>
                            <Text style={styles.cardValue}>{contactInfo.phone}</Text>
                            <Text style={styles.cardAction}>Tap to call now →</Text>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Quick Actions */}
                <View style={styles.actionsSection}>
                    <Text style={styles.sectionTitle}>Quick Actions</Text>

                    <View style={styles.actionButtons}>
                        <TouchableOpacity style={styles.actionCard} onPress={handleCall}>
                            <LinearGradient
                                colors={['#4CAF50', '#388E3C']}
                                style={styles.actionGradient}
                            >
                                <Ionicons name="call" size={24} color="#fff" />
                                <Text style={styles.actionText}>Call Now</Text>
                            </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.actionCard} onPress={handleShareApp}>
                            <LinearGradient
                                colors={['#E31C25', '#900C12']}
                                style={styles.actionGradient}
                            >
                                <Ionicons name="share-social" size={24} color="#fff" />
                                <Text style={styles.actionText}>Share App</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Office Hours */}
                <View style={styles.hoursCard}>
                    <View style={styles.hoursHeader}>
                        <Ionicons name="time-outline" size={22} color="#E31C25" />
                        <Text style={styles.hoursTitle}>Office Hours</Text>
                    </View>
                    <View style={styles.hoursList}>
                        <View style={styles.hoursRow}>
                            <Text style={styles.hoursDay}>Monday - Saturday</Text>
                            <Text style={styles.hoursTime}>9:00 AM - 6:00 PM</Text>
                        </View>
                        <View style={styles.hoursRow}>
                            <Text style={styles.hoursDay}>Sunday</Text>
                            <Text style={[styles.hoursTime, { color: '#E31C25' }]}>Closed</Text>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F6FA',
    },
    header: {
        borderBottomLeftRadius: 25,
        borderBottomRightRadius: 25,
        shadowColor: '#E31C25',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 8,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 16,
    },
    backButton: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#fff',
        letterSpacing: 0.5,
    },
    placeholder: {
        width: 42,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    heroSection: {
        alignItems: 'center',
        paddingVertical: 30,
        paddingHorizontal: 20,
    },
    iconCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#E31C25',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 8,
        marginBottom: 20,
    },
    heroTitle: {
        fontSize: 26,
        fontWeight: '900',
        color: '#1a1a1a',
        marginBottom: 8,
    },
    heroSubtitle: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
    },
    cardsContainer: {
        paddingHorizontal: 16,
    },
    contactCard: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        padding: 18,
        borderRadius: 18,
        marginBottom: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
        elevation: 4,
    },
    iconGradient: {
        width: 56,
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    cardContent: {
        flex: 1,
        justifyContent: 'center',
    },
    cardLabel: {
        fontSize: 11,
        color: '#999',
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 4,
    },
    cardValue: {
        fontSize: 14,
        color: '#1a1a1a',
        fontWeight: '600',
        lineHeight: 20,
    },
    cardAction: {
        fontSize: 12,
        color: '#E31C25',
        fontWeight: '600',
        marginTop: 6,
    },
    actionsSection: {
        paddingHorizontal: 16,
        marginTop: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#1a1a1a',
        marginBottom: 14,
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    actionCard: {
        flex: 1,
    },
    actionGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 14,
        gap: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
    },
    actionText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '700',
    },
    hoursCard: {
        backgroundColor: '#fff',
        margin: 16,
        marginTop: 24,
        padding: 20,
        borderRadius: 18,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
        elevation: 4,
    },
    hoursHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 10,
    },
    hoursTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#1a1a1a',
    },
    hoursList: {
        gap: 12,
    },
    hoursRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    hoursDay: {
        fontSize: 14,
        color: '#333',
        fontWeight: '500',
    },
    hoursTime: {
        fontSize: 14,
        color: '#4CAF50',
        fontWeight: '700',
    },
});
