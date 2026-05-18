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

export default function TermsOfServiceScreen() {
    const router = useRouter();

    const sections = [
        {
            title: 'Acceptance of Terms',
            content: `By downloading, installing, or using the Aattum TPL mobile application ("App"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, please do not use the App.`
        },
        {
            title: 'Eligibility',
            content: `You must be at least 13 years old to use this App. If you are under 18, you must have parental or guardian consent to use the App. By using the App, you represent that you meet these requirements.`
        },
        {
            title: 'Account Registration',
            content: `To access certain features, you must create an account. You agree to:

• Provide accurate, current, and complete information
• Maintain and update your information
• Keep your login credentials confidential
• Accept responsibility for all activities under your account
• Notify us immediately of any unauthorized use`
        },
        {
            title: 'User Conduct',
            content: `When using the App, you agree NOT to:

• Post false, misleading, or defamatory content
• Harass, bully, or intimidate other users
• Impersonate any person or entity
• Upload viruses or malicious code
• Attempt to gain unauthorized access to systems
• Use the App for illegal purposes
• Violate any applicable laws or regulations
• Spam or send unsolicited messages`
        },
        {
            title: 'Content Guidelines',
            content: `You are responsible for all content you post. Content must not:

• Be offensive, obscene, or inappropriate
• Infringe on intellectual property rights
• Contain personal information of others without consent
• Promote violence, discrimination, or illegal activities
• Be harmful to minors

We reserve the right to remove any content that violates these guidelines.`
        },
        {
            title: 'Intellectual Property',
            content: `The App, including its design, features, and content (excluding user-generated content), is owned by Aattum TPL and protected by copyright, trademark, and other intellectual property laws.

You may not copy, modify, distribute, or create derivative works without our written permission.`
        },
        {
            title: 'User-Generated Content',
            content: `By posting content on the App, you grant us a non-exclusive, worldwide, royalty-free license to use, display, and distribute your content in connection with the App.

You retain ownership of your content and can delete it at any time.`
        },
        {
            title: 'Third-Party Services',
            content: `The App may contain links to third-party websites or services. We are not responsible for the content, privacy policies, or practices of third-party services.`
        },
        {
            title: 'Disclaimer of Warranties',
            content: `The App is provided "as is" without warranties of any kind. We do not guarantee that:

• The App will be uninterrupted or error-free
• Defects will be corrected
• The App is free of viruses or harmful components`
        },
        {
            title: 'Limitation of Liability',
            content: `To the maximum extent permitted by law, Aattum TPL shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the App.`
        },
        {
            title: 'Termination',
            content: `We may suspend or terminate your account at any time for violation of these Terms or for any other reason. Upon termination, your right to use the App will cease immediately.`
        },
        {
            title: 'Changes to Terms',
            content: `We may modify these Terms at any time. Continued use of the App after changes constitutes acceptance of the modified Terms.`
        },
        {
            title: 'Registration and Fees',
            content: `All tournament registrations are valid for a period of one year to use the Score App. The registration fee is strictly non-refundable and must be paid in full during the registration process.`
        },
        {
            title: 'Contact Information',
            content: `For questions about these Terms, please contact us at:

Email: AdminAattumTpl@gmail.com
Phone: +91 93848 20659`
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
                        <Text style={styles.headerTitle}>Terms of Service</Text>
                        <View style={styles.placeholder} />
                    </View>
                </SafeAreaView>
            </LinearGradient>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.lastUpdated}>
                    <Ionicons name="time-outline" size={14} color="#888" />
                    <Text style={styles.lastUpdatedText}>Last Updated: May 2026</Text>
                </View>

                <Text style={styles.intro}>
                    Welcome to Aattum TPL! These Terms of Service govern your use of our mobile application
                    and services. Please read them carefully.
                </Text>

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

                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        By using Aattum TPL, you agree to these Terms of Service.
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
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
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
        fontSize: 14,
        color: '#555',
        lineHeight: 22,
        marginBottom: 25,
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#E31C25',
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
    footer: {
        marginTop: 20,
        padding: 16,
        backgroundColor: '#E31C25',
        borderRadius: 12,
    },
    footerText: { color: '#fff', fontSize: 13, textAlign: 'center', fontWeight: '600' },
});
