import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, RefreshControl, Modal, Dimensions, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../services/api';
import AppHeader from '../components/common/AppHeader';

const { width } = Dimensions.get('window');

export default function GalleryScreen() {
    const [photos, setPhotos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedPhoto, setSelectedPhoto] = useState<any>(null);

    const fetchGallery = async () => {
        try {
            const res = await api.get('/gallery');
            setPhotos(res.data);
        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGallery();
    }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchGallery();
        setRefreshing(false);
    };

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />
            <AppHeader />

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#E31C25" />}
            >
                <View style={styles.pageTitleContainer}>
                    <Ionicons name="images-outline" size={24} color="#333" />
                    <Text style={styles.pageTitle}>Media Gallery</Text>
                </View>

                {loading ? (
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100 }}>
                        <ActivityIndicator size="large" color="#E31C25" />
                        <Text style={{ marginTop: 15, color: '#666', fontSize: 16, fontWeight: '500' }}>Loading Gallery...</Text>
                    </View>
                ) : (
                    <View style={styles.grid}>
                        {photos.length > 0 ? photos.map((photo) => (
                            <TouchableOpacity key={photo._id} style={styles.photoItem} onPress={() => setSelectedPhoto(photo)} activeOpacity={0.9}>
                                <Image source={{ uri: photo.image }} style={styles.image} resizeMode="cover" />
                                <LinearGradient
                                    colors={['transparent', 'rgba(0,0,0,0.8)']}
                                    style={styles.overlay}
                                >
                                    <Text style={styles.photoCategory}>{photo.category}</Text>
                                    <Text style={styles.photoTitle} numberOfLines={1}>{photo.title}</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        )) : (
                            <View style={{ width: '100%', alignItems: 'center', marginTop: 50 }}>
                                <Ionicons name="images" size={50} color="#ddd" />
                                <Text style={{ color: '#aaa', marginTop: 10 }}>No photos yet</Text>
                            </View>
                        )}
                    </View>
                )}
            </ScrollView>

            {/* Lightbox Modal */}
            <Modal visible={!!selectedPhoto} transparent={true} animationType="fade" onRequestClose={() => setSelectedPhoto(null)}>
                <View style={styles.modalContainer}>
                    <TouchableOpacity style={styles.closeButton} onPress={() => setSelectedPhoto(null)}>
                        <Ionicons name="close" size={24} color="#fff" />
                    </TouchableOpacity>
                    {selectedPhoto && (
                        <>
                            <Image source={{ uri: selectedPhoto.image }} style={styles.fullImage} resizeMode="contain" />
                            <View style={styles.modalTextContainer}>
                                <Text style={styles.modalTitle}>{selectedPhoto.title}</Text>
                                <Text style={styles.modalCategory}>{selectedPhoto.category}</Text>
                            </View>
                        </>
                    )}
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA', // Light background
    },
    scroll: {
        // padding: 2, // handled by contentContainer
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 16,
        gap: 12,
        justifyContent: 'space-between', // Try to space evenly
    },
    photoItem: {
        width: (width - 44) / 2, // 2 columns with padding
        height: (width - 44) / 2,
        marginBottom: 12,
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: '#fff',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    overlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 12,
        paddingTop: 30, // for gradient fade
        justifyContent: 'flex-end',
    },
    photoTitle: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
        textShadowColor: 'rgba(0, 0, 0, 0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    photoCategory: {
        color: 'rgba(255, 255, 255, 0.8)',
        fontSize: 10,
        fontWeight: '600',
        textTransform: 'uppercase',
        marginTop: 2,
    },
    scrollContent: { paddingBottom: 100 },
    pageTitleContainer: { flexDirection: 'row', alignItems: 'center', padding: 20, gap: 12, marginTop: 10 },
    pageTitle: { fontSize: 24, fontWeight: '900', color: '#1a1a1a', letterSpacing: -0.5 },
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.95)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeButton: {
        position: 'absolute',
        top: 50,
        right: 30,
        zIndex: 10,
        backgroundColor: 'rgba(255,255,255,0.2)',
        padding: 8,
        borderRadius: 20,
    },
    fullImage: {
        width: width,
        height: 500,
    },
    modalTextContainer: {
        position: 'absolute',
        bottom: 60,
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    modalTitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    modalCategory: {
        color: '#ccc',
        fontSize: 14,
        marginTop: 4,
    },
});
