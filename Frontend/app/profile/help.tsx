import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Platform,
    LayoutAnimation,
    UIManager,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

if (Platform.OS === 'android') {
    if (UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
    }
}

export default function HelpSupport() {
    const router = useRouter();
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const toggleExpand = (id: string) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpandedId(expandedId === id ? null : id);
    };

    const faqs = [
        {
            id: '1',
            question: 'How do I join a match?',
            answer: 'You can join a match by navigating to the "Matches" tab, selecting an upcoming match, and clicking the "Register" button.'
        },
        {
            id: '2',
            question: 'How are points calculated?',
            answer: 'Points are awarded based on your performance in matches. Winning a match gives 10 points, while detailed stats contribute bonus points.'
        },
        {
            id: '3',
            question: 'Can I change my team?',
            answer: 'Team changes are allowed only during the transfer window. Please contact your team manager or league admin for assistance.'
        },
        {
            id: '4',
            question: 'What happens if a match is cancelled?',
            answer: 'If a match is cancelled due to weather or other reasons, it will be rescheduled. You will receive a notification with the new date.'
        }
    ];

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Help & Support</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>

                {/* Contact Support Card */}
                <LinearGradient
                    colors={['#E31C25', '#A00F15']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.supportCard}
                >
                    <View style={styles.supportIconContainer}>
                        <Ionicons name="headset" size={32} color="#E31C25" />
                    </View>
                    <Text style={styles.supportTitle}>Need Help?</Text>
                    <Text style={styles.supportText}>
                        Our support team is available 24/7 to assist you with any issues.
                    </Text>
                    <TouchableOpacity style={styles.contactButton}>
                        <Text style={styles.contactButtonText}>Contact Support</Text>
                    </TouchableOpacity>
                </LinearGradient>

                <Text style={styles.sectionHeader}>Frequently Asked Questions</Text>

                <View style={styles.faqContainer}>
                    {faqs.map((faq) => (
                        <View key={faq.id} style={styles.faqItem}>
                            <TouchableOpacity
                                style={styles.questionButton}
                                onPress={() => toggleExpand(faq.id)}
                                activeOpacity={0.7}
                            >
                                <Text style={[
                                    styles.questionText,
                                    expandedId === faq.id && styles.activeQuestionText
                                ]}>
                                    {faq.question}
                                </Text>
                                <Ionicons
                                    name={expandedId === faq.id ? "chevron-up" : "chevron-down"}
                                    size={20}
                                    color={expandedId === faq.id ? "#E31C25" : "#888"}
                                />
                            </TouchableOpacity>
                            {expandedId === faq.id && (
                                <View style={styles.answerContainer}>
                                    <Text style={styles.answerText}>{faq.answer}</Text>
                                </View>
                            )}
                        </View>
                    ))}
                </View>

                {/* Additional Links */}
                <Text style={styles.sectionHeader}>More Resources</Text>
                <View style={styles.linksContainer}>
                    <TouchableOpacity style={styles.linkItem}>
                        <Ionicons name="document-text-outline" size={22} color="#666" />
                        <Text style={styles.linkText}>User Guide</Text>
                        <Ionicons name="open-outline" size={20} color="#CCC" />
                    </TouchableOpacity>
                    <View style={styles.divider} />
                    <TouchableOpacity style={styles.linkItem}>
                        <Ionicons name="bug-outline" size={22} color="#666" />
                        <Text style={styles.linkText}>Report a Bug</Text>
                        <Ionicons name="chevron-forward" size={20} color="#CCC" />
                    </TouchableOpacity>
                </View>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 60 : 50,
        paddingBottom: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    backButton: {
        padding: 8,
        marginLeft: -8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    content: {
        padding: 20,
    },
    supportCard: {
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        marginBottom: 30,
        shadowColor: '#E31C25',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    supportIconContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    supportTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 8,
    },
    supportText: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.9)',
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 20,
    },
    contactButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.4)',
    },
    contactButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
    sectionHeader: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 16,
    },
    faqContainer: {
        backgroundColor: '#fff',
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    faqItem: {
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    questionButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
    },
    questionText: {
        fontSize: 15,
        color: '#333',
        fontWeight: '500',
        flex: 1,
        paddingRight: 10,
    },
    activeQuestionText: {
        color: '#E31C25',
        fontWeight: '600',
    },
    answerContainer: {
        paddingHorizontal: 16,
        paddingBottom: 16,
        backgroundColor: '#FAFAFA',
    },
    answerText: {
        fontSize: 14,
        color: '#666',
        lineHeight: 22,
    },
    linksContainer: {
        backgroundColor: '#fff',
        borderRadius: 16,
        paddingHorizontal: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
        marginBottom: 20,
    },
    linkItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
    },
    linkText: {
        flex: 1,
        fontSize: 16,
        color: '#333',
        marginLeft: 12,
        fontWeight: '500',
    },
    divider: {
        height: 1,
        backgroundColor: '#f0f0f0',
    },
});
