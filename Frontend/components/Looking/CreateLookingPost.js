import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    ScrollView,
    TextInput,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';


import { createLookingPost } from '../../services/looking.api';
import { Alert, ActivityIndicator } from 'react-native';

export default function CreateLookingPostModal({ visible, onClose }) {
    const [lookingFor, setLookingFor] = useState('');
    const [location, setLocation] = useState('');
    const [ground, setGround] = useState('');
    const [type, setType] = useState('');
    const [matchDate, setMatchDate] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!lookingFor || !location || !ground || !type || !matchDate) {
            Alert.alert('Error', 'Please fill all required fields');
            return;
        }

        setLoading(true);
        try {
            await createLookingPost({
                lookingFor,
                location,
                ground,
                type,
                matchDate: new Date(matchDate),
                description
            });
            Alert.alert('Success', 'Post created successfully');
            onClose();
            // Reset form
            setLookingFor('');
            setLocation('');
            setGround('');
            setType('');
            setMatchDate('');
            setDescription('');
        } catch (error) {
            console.log('Error creating post:', error);
            Alert.alert('Error', error.response?.data?.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />

                <View style={styles.modalContent}>
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={{ flex: 1 }}
                        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
                    >
                        <ScrollView
                            contentContainerStyle={styles.scrollContent}
                            showsVerticalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled"
                        >

                            {/* Header */}
                            <LinearGradient colors={['#E31C25', '#900C12']} style={styles.header}>
                                <Text style={styles.headerTitle}>Create Looking Post</Text>
                            </LinearGradient>

                            {/* Form */}
                            <View style={styles.form}>
                                <Input label="Looking For" value={lookingFor} onChange={setLookingFor} placeholder="Team / Player" />
                                <Input label="Location" value={location} onChange={setLocation} placeholder="Vellore" />
                                <Input label="Ground Type" value={ground} onChange={setGround} placeholder="Open / Box" />
                                <Input label="Match Type" value={type} onChange={setType} placeholder="Tournament / Weekends" />
                                <Input
                                    label="Match Date"
                                    value={matchDate}
                                    onChange={setMatchDate}
                                    placeholder="YYYY-MM-DD"
                                />

                                <Text style={styles.label}>Description</Text>
                                <TextInput
                                    style={[styles.input, styles.textArea]}
                                    multiline
                                    placeholder="Write details..."
                                    placeholderTextColor="#999"
                                    value={description}
                                    onChangeText={setDescription}
                                />

                                <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
                                    {loading ? (
                                        <ActivityIndicator color="#fff" />
                                    ) : (
                                        <Text style={styles.submitText}>Post</Text>
                                    )}
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                                <Text style={styles.closeText}>Cancel</Text>
                            </TouchableOpacity>

                        </ScrollView>
                    </KeyboardAvoidingView>
                </View>
            </View>
        </Modal>
    );
}

/* 🔹 Reusable Input */
function Input({ label, value, onChange, placeholder }) {
    return (
        <>
            <Text style={styles.label}>{label}</Text>
            <TextInput
                style={styles.input}
                placeholder={placeholder}
                placeholderTextColor="#999"
                value={value}
                onChangeText={onChange}
            />
        </>
    );
}
const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        height: '85%',
        overflow: 'hidden',
    },
    header: {
        height: 120,
        justifyContent: 'flex-end',
        padding: 20,
    },
    headerTitle: {
        color: '#fff',
        fontSize: 22,
        fontWeight: 'bold',
    },
    scrollContent: {
        paddingBottom: 40,
    },
    form: {
        padding: 20,
    },
    label: {
        fontSize: 14,
        color: '#555',
        marginBottom: 6,
        marginTop: 16,
    },
    input: {
        backgroundColor: '#f4f4f4',
        borderRadius: 12,
        padding: 14,
        fontSize: 15,
        color: '#333',
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    submitBtn: {
        backgroundColor: '#E31C25',
        padding: 16,
        borderRadius: 14,
        alignItems: 'center',
        marginTop: 24,
    },
    submitText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    closeBtn: {
        alignItems: 'center',
        marginTop: 10,
    },
    closeText: {
        color: '#888',
        fontSize: 15,
    },
});
