import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Share,
    Image,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ShareAppScreen() {
    const router = useRouter();

    const handleShare = async () => {
        try {
            await Share.share({
                message: '🏏 Check out Aattum TPL Score App!\n\nTrack cricket tournaments, live scores, player stats, and connect with the cricket community.\n\n📲 Download now: https://play.google.com/store/apps/details?id=com.aattumtpl',
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
                        <Text style={styles.headerTitle}>Share App</Text>
                        <View style={styles.placeholder} />
                    </View>
                </SafeAreaView>
            </LinearGradient>

            <View style={styles.content}>
                {/* App Icon */}
                <View style={styles.appIconContainer}>
                    <Image
                        source={require('../assets/images/ATPL LOGO.jpeg')}
                        style={styles.appIcon}
                        resizeMode="contain"
                    />
                </View>

                <Text style={styles.title}>Share Aattum TPL</Text>
                <Text style={styles.subtitle}>
                    Help us grow! Share this app with your cricket-loving friends and family.
                </Text>

                {/* Features */}
                <View style={styles.featuresCard}>
                    <View style={styles.featureRow}>
                        <View style={styles.featureIcon}>
                            <Ionicons name="trophy" size={20} color="#4CAF50" />
                        </View>
                        <Text style={styles.featureText}>Track Tournaments & Live Scores</Text>
                    </View>
                    <View style={styles.featureRow}>
                        <View style={styles.featureIcon}>
                            <Ionicons name="people" size={20} color="#2196F3" />
                        </View>
                        <Text style={styles.featureText}>Connect with Players & Teams</Text>
                    </View>
                    <View style={styles.featureRow}>
                        <View style={styles.featureIcon}>
                            <Ionicons name="stats-chart" size={20} color="#FF9800" />
                        </View>
                        <Text style={styles.featureText}>Player Statistics & Leaderboards</Text>
                    </View>
                    <View style={styles.featureRow}>
                        <View style={styles.featureIcon}>
                            <Ionicons name="videocam" size={20} color="#E31C25" />
                        </View>
                        <Text style={styles.featureText}>Live Streaming & Highlights</Text>
                    </View>
                </View>

                {/* Share Button */}
                <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
                    <LinearGradient
                        colors={['#E31C25', '#900C12']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.shareGradient}
                    >
                        <Ionicons name="share-social" size={22} color="#fff" />
                        <Text style={styles.shareButtonText}>Share with Friends</Text>
                    </LinearGradient>
                </TouchableOpacity>

                <Text style={styles.thankYou}>Thank you for spreading the word! 🙏</Text>
            </View>
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
    content: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 40,
    },
    appIconContainer: {
        width: 120,
        height: 120,
        borderRadius: 30,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#E31C25',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
        elevation: 10,
        marginBottom: 24,
        overflow: 'hidden',
    },
    appIcon: {
        width: 100,
        height: 100,
        borderRadius: 20,
    },
    title: {
        fontSize: 26,
        fontWeight: '900',
        color: '#1a1a1a',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 30,
    },
    featuresCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        width: '100%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 5,
        marginBottom: 30,
    },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f5f5f5',
    },
    featureIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#f8f9fa',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    featureText: {
        fontSize: 14,
        color: '#333',
        fontWeight: '600',
    },
    shareButton: {
        width: '100%',
    },
    shareGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
        borderRadius: 16,
        gap: 12,
        shadowColor: '#E31C25',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 6,
    },
    shareButtonText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '700',
    },
    thankYou: {
        fontSize: 13,
        color: '#888',
        marginTop: 20,
    },
});
