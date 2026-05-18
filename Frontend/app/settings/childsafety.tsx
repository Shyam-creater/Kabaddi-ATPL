import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ChildSafetyPolicyScreen() {
    const router = useRouter();

    const sections = [
        {
            title: 'Our Commitment to Child Safety',
            content: `Aattum TPL is committed to creating a safe environment for users of all ages. We take child safety very seriously and have implemented measures to protect minors who use our application.

Our app is designed to be family-friendly and suitable for cricket and sports enthusiasts of all ages.`
        },
        {
            title: 'Age Requirements',
            content: `• Users under 13 years old must have parental or guardian consent to create an account
• We encourage parents to supervise their children's use of the app
• Certain features may be restricted for users under 18
• Parents can request account deletion for their children at any time`
        },
        {
            title: 'Parental Controls',
            content: `We recommend parents and guardians:

• Supervise their child's use of the app
• Review their child's profile and connections
• Monitor direct messages and communications
• Set appropriate screen time limits
• Report any concerning behavior immediately`
        },
        {
            title: 'Content Moderation',
            content: `We actively monitor and moderate content to ensure child safety:

• User-generated content is subject to community guidelines
• Inappropriate content is removed promptly
• Users can report offensive or harmful content
• We use automated systems to detect policy violations
• Repeat violators are permanently banned`
        },
        {
            title: 'Prohibited Content & Behavior',
            content: `The following are strictly prohibited:

• Sexual or explicit content
• Bullying, harassment, or intimidation of minors
• Grooming or predatory behavior
• Requests for personal information from minors
• Content that exploits or endangers children
• Violence or gore
• Hate speech or discrimination`
        },
        {
            title: 'Data Protection for Children',
            content: `We protect children's data by:

• Collecting minimal information necessary
• Not sharing children's data with third parties for marketing
• Providing parents access to their child's data upon request
• Allowing parents to request deletion of their child's account
• Complying with COPPA and similar regulations worldwide`
        },
        {
            title: 'Reporting Concerns',
            content: `If you observe any concerning behavior or content involving minors:

• Use the in-app "Report" feature immediately
• Email us at: safety@aattumtpl.com
• Call us at: +91 93848 20659

We investigate all reports promptly and take appropriate action.`
        },
        {
            title: 'Education & Awareness',
            content: `We promote digital safety through:

• In-app safety tips and reminders
• Educational content about online safety
• Resources for parents and guardians
• Partnerships with child safety organizations`
        },
        {
            title: 'Zero Tolerance Policy',
            content: `We maintain a zero-tolerance policy for:

• Child exploitation or abuse
• Predatory behavior targeting minors
• Sharing inappropriate content with children

Violations result in immediate account termination and may be reported to law enforcement authorities.`
        },
        {
            title: 'Contact Us',
            content: `For child safety concerns:

Email: safety@aattumtpl.com
General: AdminAattumTpl@gmail.com
Phone: +91 93848 20659

We respond to child safety reports within 24 hours.`
        }
    ];

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />

            <LinearGradient colors={['#E31C25', '#900C12']} style={styles.header}>
                <SafeAreaView edges={['top']}>
                    <View style={styles.headerContent}>
                        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                            <Ionicons name="arrow-back" size={24} color="#fff" />
                        </TouchableOpacity>
                        <View style={styles.headerCenter}>
                            <Ionicons name="shield-checkmark" size={20} color="#fff" />
                            <Text style={styles.headerTitle}>Child Safety Policy</Text>
                        </View>
                        <View style={styles.placeholder} />
                    </View>
                </SafeAreaView>
            </LinearGradient>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.lastUpdated}>
                    <Ionicons name="time-outline" size={14} color="#888" />
                    <Text style={styles.lastUpdatedText}>Last Updated: May 2026</Text>
                </View>

                <View style={styles.intro}>
                    <Ionicons name="heart" size={24} color="#E31C25" />
                    <Text style={styles.introText}>
                        At Aattum TPL, protecting children is our priority. This policy outlines our
                        commitment to creating a safe environment for young users.
                    </Text>
                </View>

                {sections.map((section, index) => (
                    <View key={index} style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <View style={styles.sectionNumber}>
                                <Text style={styles.sectionNumberText}>{index + 1}</Text>
                            </View>
                            <Text style={styles.sectionTitle}>{section.title}</Text>
                        </View>
                        <Text style={styles.sectionContent}>{section.content}</Text>
                    </View>
                ))}

                <View style={styles.emergencyCard}>
                    <Ionicons name="warning" size={24} color="#FF9800" />
                    <Text style={styles.emergencyTitle}>Report Immediately</Text>
                    <Text style={styles.emergencyText}>
                        If you believe a child is in immediate danger, please contact local law enforcement
                        and then report to us at safety@aattumtpl.com
                    </Text>
                </View>

                <View style={styles.footer}>
                    <Ionicons name="shield-checkmark" size={20} color="#fff" />
                    <Text style={styles.footerText}>
                        Together, we keep our community safe for everyone.
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F6FA' },
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
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    headerTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
    placeholder: { width: 42 },
    scrollContent: { padding: 20, paddingBottom: 40 },
    lastUpdated: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 15,
    },
    lastUpdatedText: { fontSize: 12, color: '#888' },
    intro: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFEBEE',
        padding: 16,
        borderRadius: 12,
        marginBottom: 25,
        gap: 12,
    },
    introText: {
        flex: 1,
        fontSize: 14,
        color: '#C62828',
        lineHeight: 22,
        fontWeight: '500',
    },
    section: { marginBottom: 20 },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionNumber: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#E31C25',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    sectionNumberText: { color: '#fff', fontSize: 13, fontWeight: '700' },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1a1a1a', flex: 1 },
    sectionContent: {
        fontSize: 14,
        color: '#555',
        lineHeight: 22,
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
    },
    emergencyCard: {
        backgroundColor: '#FFF3E0',
        padding: 20,
        borderRadius: 12,
        marginTop: 10,
        marginBottom: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#FFB74D',
    },
    emergencyTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#E65100',
        marginTop: 10,
        marginBottom: 8,
    },
    emergencyText: {
        fontSize: 13,
        color: '#E65100',
        textAlign: 'center',
        lineHeight: 20,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        padding: 16,
        backgroundColor: '#E31C25',
        borderRadius: 12,
    },
    footerText: { color: '#fff', fontSize: 13, fontWeight: '600' },
});
