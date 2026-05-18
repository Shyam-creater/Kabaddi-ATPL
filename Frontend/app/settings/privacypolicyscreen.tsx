
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PrivacyPolicyScreen() {
  const router = useRouter();

  const sections = [
    {
      title: 'Information We Collect',
      content: `We collect information to provide better services to our users. The types of information we collect include:

• Personal Information: Name, email address, phone number, profile picture, date of birth, and location (City/State provided by you).
• Sports Profile: Sports preferences, playing statistics, team affiliations, match history, and achievements.
• Device Information: Device model, operating system version, unique device identifiers, and mobile network information.
• Usage Data: Information about how you use the app, such as features accessed and time spent.`
    },
    {
      title: 'Permissions & Sensitive Data',
      content: `To provide certain features, our app requires access to the following sensitive information and device features:

• Camera: Used for scanning QR codes and taking profile pictures.
• Photo Library: Used to allow you to upload profile pictures and sports-related media.
• Microphone: Used for voice-enabled features and search within the app.
• Storage: Used to save app-related data and cache images for better performance.

We only access these features with your explicit permission, and you can revoke access at any time through your device settings.`
    },
    {
      title: 'How We Use Your Information',
      content: `We use the information we collect to:

• Provide, maintain, and improve our sports scoring and community services.
• Create and manage your player profile and match history.
• Facilitate connections between players, teams, and tournament organizers.
• Send important notifications regarding matches, events, and account updates.
• Analyze app usage to enhance user experience and detect fraudulent activities.`
    },
    {
      title: 'Information Sharing & Disclosure',
      content: `We value your privacy and do not sell your personal information to third parties. Information may be shared in the following cases:

• Public Profile: Certain information (name, sports stats) is visible to other users as part of the community features.
• Tournament Organizers: Data is shared with organizers when you register for specific events.
• Service Providers: We work with trusted third-party providers (e.g., hosting, analytics) who assist us in operating our app.
• Legal Requirements: We may disclose information if required by law or to protect the safety and rights of our users.`
    },
    {
      title: 'Data Security',
      content: `We implement industry-standard security measures to protect your data:

• SSL/TLS encryption for data transmission.
• Secure server infrastructure with restricted access.
• Regular security monitoring and vulnerability assessments.
• Multi-factor authentication for sensitive account actions.`
    },
    {
      title: 'Data Retention and Deletion',
      content: `We retain your personal data only for as long as necessary to fulfill the purposes outlined in this policy.

• Account Deletion: You can request the deletion of your account and all associated personal data at any time through the app settings or by contacting us.
• Request via Email: To request data deletion, please email us at AdminAattumTpl@gmail.com.
• Processing Time: Upon receiving a request, we will delete your data from our active systems within 7-30 business days.
• Legal Retention: Some data may be retained if required for legal, audit, or regulatory compliance.`
    },
    {
      title: 'Your Rights & Choices',
      content: `You have full control over your data:

• Access & Update: You can review and edit your profile information at any time within the app.
• Data Portability: You may request a copy of the personal data we hold about you.
• Consent Withdrawal: You can opt-out of notifications or revoke device permissions at any time.

To exercise any of these rights, please contact our data protection team at AdminAattumTpl@gmail.com.`
    },
    {
      title: 'Children\'s Privacy',
      content: `Aattum TPL is committed to protecting the privacy of children:

• Users under 13 require verifiable parental consent to use the app.
• We do not knowingly collect personal data from children under 13 without such consent.
• Parents have the right to review, edit, or request deletion of their child's information.
• We comply with the Children's Online Privacy Protection Act (COPPA).`
    },
    {
      title: 'Changes to This Policy',
      content: `We may update our Privacy Policy periodically. Any changes will be posted on this page with an updated "Last Updated" date. We recommend reviewing this policy regularly to stay informed about how we protect your data.`
    },
    {
      title: 'Contact Us',
      content: `If you have questions or concerns about this Privacy Policy or our data practices, please contact us:

Email: AdminAattumTpl@gmail.com
Phone: +91 93848 20659
Address: No. 20/14, Kalaivanar Street, Sapthagiri Colony, Jafferkhanpet, Chennai- 600 083`
    }
  ];

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <LinearGradient
        colors={['#E31C25', '#900C12']}
        style={styles.header}
      >
        <SafeAreaView edges={['top']}>
          <View style={styles.headerContent}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Privacy Policy</Text>
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
          Aattum TPL ("we", "our", or "us") is committed to protecting your privacy.
          This Privacy Policy explains how we collect, use, and share information about you
          when you use our mobile application.
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
            By using Aattum TPL, you agree to this Privacy Policy.
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
    shadowColor: '#1a1a2e',
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
