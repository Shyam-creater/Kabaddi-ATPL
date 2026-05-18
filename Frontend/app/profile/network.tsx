import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator, SafeAreaView, TextInput, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { userService } from '../../services/api';

export default function NetworkPage() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { type, userId, userName } = params; // type: 'followers' | 'following'

    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');

    useEffect(() => {
        fetchNetwork();
    }, [type, userId]);

    const fetchNetwork = async () => {
        setLoading(true);
        try {
            let res;
            if (type === 'followers') {
                res = await userService.getFollowers(userId as string);
            } else {
                res = await userService.getFollowing(userId as string);
            }
            if (res.data.success) {
                setUsers(res.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch network', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveFollower = (targetId: string, name: string) => {
        Alert.alert(
            'Remove Follower',
            `Are you sure you want to remove ${name} from your followers?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const response = await userService.removeFollower(targetId);
                            if (response.data.success) {
                                setUsers(prev => prev.filter(u => u._id !== targetId));
                            }
                        } catch (error) {
                            Alert.alert('Error', 'Failed to remove follower');
                        }
                    }
                }
            ]
        );
    };

    const handleUnfollow = (targetId: string, name: string) => {
        Alert.alert(
            'Unfollow',
            `Are you sure you want to unfollow ${name}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Unfollow',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const response = await userService.unfollowUser(targetId);
                            if (response.data.success) {
                                setUsers(prev => prev.filter(u => u._id !== targetId));
                            }
                        } catch (error) {
                            Alert.alert('Error', 'Failed to unfollow user');
                        }
                    }
                }
            ]
        );
    };

    const filteredUsers = users.filter(u => {
        const matchesSearch = u.name?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'All' || (u.sports && u.sports.includes(selectedCategory));
        return matchesSearch && matchesCategory;
    });

    const renderItem = ({ item }: { item: any }) => (
        <View style={styles.userCard}>
            <TouchableOpacity onPress={() => router.push(`/profile/view/${item._id}` as any)} style={styles.userInfo}>
                <Image source={{ uri: item.image || 'https://via.placeholder.com/50' }} style={styles.avatar} />
                <View style={styles.textContainer}>
                    <Text style={styles.name}>{item.name}</Text>
                    <Text style={styles.role}>{item.role}</Text>
                </View>
            </TouchableOpacity>

            {type === 'followers' ? (
                <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: '#FFEBEE' }]}
                    onPress={() => handleRemoveFollower(item._id, item.name)}
                >
                    <Text style={[styles.actionBtnText, { color: '#D32F2F' }]}>Remove Follower</Text>
                </TouchableOpacity>
            ) : (
                <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: '#EEEEEE' }]}
                    onPress={() => handleUnfollow(item._id, item.name)}
                >
                    <Text style={[styles.actionBtnText, { color: '#616161' }]}>Unfollow</Text>
                </TouchableOpacity>
            )}
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>
                    {userName ? `${userName}'s ` : ''}{type === 'followers' ? 'Followers' : 'Following'}
                </Text>
            </View>

            {/* Category Tabs */}
            <View style={{ flexDirection: 'row', paddingHorizontal: 16, marginTop: 15, marginBottom: 5 }}>
                {['All', 'Cricket', 'Kabaddi', 'Football'].map((cat) => (
                    <TouchableOpacity
                        key={cat}
                        onPress={() => setSelectedCategory(cat)}
                        style={{
                            marginRight: 10,
                            paddingVertical: 6,
                            paddingHorizontal: 16,
                            backgroundColor: selectedCategory === cat ? '#E31C25' : '#333',
                            borderRadius: 20,
                        }}
                    >
                        <Text style={{
                            color: '#fff',
                            fontWeight: '600',
                            fontSize: 12
                        }}>
                            {cat}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#666" style={{ marginRight: 8 }} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search..."
                    placeholderTextColor="#666"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#E31C25" />
                </View>
            ) : (
                <FlatList
                    data={filteredUsers}
                    renderItem={renderItem}
                    keyExtractor={item => item._id}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.center}>
                            <Text style={styles.emptyText}>No users found</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121212',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        paddingTop: 40,
        backgroundColor: '#1E1E1E',
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    backButton: {
        marginRight: 16,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        textTransform: 'capitalize',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#222',
        margin: 16,
        paddingHorizontal: 12,
        borderRadius: 8,
        height: 40,
    },
    searchInput: {
        flex: 1,
        color: '#fff',
        height: '100%',
    },
    listContent: {
        padding: 16,
    },
    userCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#1E1E1E',
        padding: 12,
        borderRadius: 12,
        marginBottom: 12,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 12,
        borderWidth: 1,
        borderColor: '#333',
    },
    textContainer: {
        justifyContent: 'center',
        flex: 1,
    },
    name: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    role: {
        fontSize: 12,
        color: '#aaa',
        marginTop: 2,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 50,
    },
    emptyText: {
        color: '#666',
        fontSize: 16,
    },
    actionBtn: {
        backgroundColor: '#333',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
    },
    actionBtnText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
});
