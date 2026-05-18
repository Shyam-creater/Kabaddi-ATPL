import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    RefreshControl,
    Modal,
    Dimensions,
    ActivityIndicator,
    Share,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../services/api';

const { width } = Dimensions.get('window');

interface Blog {
    _id: string;
    title: string;
    excerpt: string;
    content: string;
    image: string;
    author: string;
    category: string;
    tags: string[];
    createdAt: string;
}

export default function BlogScreen() {
    const router = useRouter();
    const [blogs, setBlogs] = useState<Blog[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedBlog, setSelectedBlog] = useState<Blog | null>(null);
    const [selectedCategory, setSelectedCategory] = useState('All');

    // Dynamically generate categories from blogs data, maintaining 'All' as the first option
    const uniqueCategories = Array.from(new Set(blogs.map(blog => blog.category).filter(Boolean)));
    const categories = ['All', ...uniqueCategories];

    const fetchBlogs = async () => {
        try {
            const res = await api.get('/content/blogs');
            setBlogs(Array.isArray(res.data) ? res.data : []);
        } catch (error) {
            console.log('Error fetching blogs:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchBlogs();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchBlogs();
    };

    const filteredBlogs = selectedCategory === 'All'
        ? blogs
        : blogs.filter(blog => blog.category?.toLowerCase() === selectedCategory.toLowerCase());

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    const handleShare = async (blog: Blog) => {
        try {
            await Share.share({
                message: `📰 ${blog.title}\n\n${blog.excerpt || ''}\n\nRead more on Aattum TPL App!`,
                title: blog.title,
            });
        } catch (error) {
            console.log(error);
        }
    };

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Custom Header */}
            <LinearGradient
                colors={['#1a1a2e', '#16213e']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
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
                        <View style={styles.headerCenter}>
                            <Ionicons name="newspaper-outline" size={22} color="#fff" />
                            <Text style={styles.headerTitle}>Blog</Text>
                        </View>
                        <View style={styles.placeholder} />
                    </View>
                </SafeAreaView>
            </LinearGradient>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#E31C25" />
                }
            >
                {/* Hero Text */}
                <View style={styles.heroSection}>
                    <Text style={styles.heroTitle}>Latest Updates</Text>
                    <Text style={styles.heroSubtitle}>News, tips and cricket insights</Text>
                </View>

                {/* Category Chips */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.chipContainer}
                    contentContainerStyle={styles.chipContent}
                >
                    {categories.map((cat, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[styles.chip, selectedCategory === cat && styles.activeChip]}
                            onPress={() => setSelectedCategory(cat)}
                        >
                            <Text style={[styles.chipText, selectedCategory === cat && styles.activeChipText]}>
                                {cat}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Blog Cards */}
                {loading ? (
                    <ActivityIndicator size="large" color="#E31C25" style={{ marginTop: 40 }} />
                ) : filteredBlogs.length > 0 ? (
                    <View style={styles.blogList}>
                        {/* Featured Blog (first one) */}
                        {filteredBlogs.length > 0 && (
                            <TouchableOpacity
                                style={styles.featuredCard}
                                onPress={() => setSelectedBlog(filteredBlogs[0])}
                                activeOpacity={0.9}
                            >
                                <Image
                                    source={{ uri: filteredBlogs[0].image || 'https://via.placeholder.com/400x200/1a1a2e/ffffff?text=Blog' }}
                                    style={styles.featuredImage}
                                />
                                <LinearGradient
                                    colors={['transparent', 'rgba(0,0,0,0.9)']}
                                    style={styles.featuredOverlay}
                                >
                                    <View style={styles.categoryBadge}>
                                        <Text style={styles.categoryBadgeText}>{filteredBlogs[0].category || 'General'}</Text>
                                    </View>
                                    <Text style={styles.featuredTitle} numberOfLines={2}>
                                        {filteredBlogs[0].title}
                                    </Text>
                                    <View style={styles.featuredMeta}>
                                        <Text style={styles.featuredAuthor}>{filteredBlogs[0].author}</Text>
                                        <Text style={styles.featuredDate}>{formatDate(filteredBlogs[0].createdAt)}</Text>
                                    </View>
                                </LinearGradient>
                            </TouchableOpacity>
                        )}

                        {/* Regular Blog Cards */}
                        {filteredBlogs.slice(1).map((blog) => (
                            <TouchableOpacity
                                key={blog._id}
                                style={styles.blogCard}
                                onPress={() => setSelectedBlog(blog)}
                                activeOpacity={0.8}
                            >
                                <Image
                                    source={{ uri: blog.image || 'https://via.placeholder.com/150/1a1a2e/ffffff?text=Blog' }}
                                    style={styles.blogImage}
                                />
                                <View style={styles.blogContent}>
                                    <View style={styles.smallCategoryBadge}>
                                        <Text style={styles.smallCategoryText}>{blog.category || 'General'}</Text>
                                    </View>
                                    <Text style={styles.blogTitle} numberOfLines={2}>{blog.title}</Text>
                                    <Text style={styles.blogExcerpt} numberOfLines={2}>{blog.excerpt}</Text>
                                    <View style={styles.blogMeta}>
                                        <Text style={styles.blogAuthor}>{blog.author}</Text>
                                        <Text style={styles.blogDate}>{formatDate(blog.createdAt)}</Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                ) : (
                    <View style={styles.emptyState}>
                        <View style={styles.emptyIcon}>
                            <Ionicons name="document-text-outline" size={50} color="#ccc" />
                        </View>
                        <Text style={styles.emptyTitle}>No blogs yet</Text>
                        <Text style={styles.emptySubtitle}>Check back later for updates!</Text>
                    </View>
                )}
            </ScrollView>

            {/* Blog Detail Modal */}
            <Modal
                visible={!!selectedBlog}
                animationType="slide"
                onRequestClose={() => setSelectedBlog(null)}
            >
                <View style={styles.modalContainer}>
                    <ScrollView showsVerticalScrollIndicator={false}>
                        {selectedBlog && (
                            <>
                                <Image
                                    source={{ uri: selectedBlog.image || 'https://via.placeholder.com/400x250/1a1a2e/ffffff?text=Blog' }}
                                    style={styles.modalImage}
                                />
                                <TouchableOpacity
                                    style={styles.closeButton}
                                    onPress={() => setSelectedBlog(null)}
                                >
                                    <Ionicons name="close" size={24} color="#fff" />
                                </TouchableOpacity>

                                <View style={styles.modalContent}>
                                    <View style={styles.modalCategoryBadge}>
                                        <Text style={styles.modalCategoryText}>{selectedBlog.category || 'General'}</Text>
                                    </View>
                                    <Text style={styles.modalTitle}>{selectedBlog.title}</Text>

                                    <View style={styles.modalMeta}>
                                        <View style={styles.authorRow}>
                                            <View style={styles.authorAvatar}>
                                                <Text style={styles.authorInitial}>
                                                    {selectedBlog.author?.charAt(0) || 'A'}
                                                </Text>
                                            </View>
                                            <View>
                                                <Text style={styles.modalAuthor}>{selectedBlog.author}</Text>
                                                <Text style={styles.modalDate}>{formatDate(selectedBlog.createdAt)}</Text>
                                            </View>
                                        </View>
                                        <TouchableOpacity
                                            style={styles.shareButton}
                                            onPress={() => handleShare(selectedBlog)}
                                        >
                                            <Ionicons name="share-outline" size={20} color="#E31C25" />
                                        </TouchableOpacity>
                                    </View>

                                    <Text style={styles.modalContentText}>{selectedBlog.content}</Text>

                                    {selectedBlog.tags && selectedBlog.tags.length > 0 && (
                                        <View style={styles.tagsContainer}>
                                            {selectedBlog.tags.map((tag, index) => (
                                                <View key={index} style={styles.tag}>
                                                    <Text style={styles.tagText}>#{tag}</Text>
                                                </View>
                                            ))}
                                        </View>
                                    )}
                                </View>
                            </>
                        )}
                    </ScrollView>
                </View>
            </Modal>
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
    headerCenter: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
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
        paddingHorizontal: 20,
        paddingTop: 24,
        paddingBottom: 8,
    },
    heroTitle: {
        fontSize: 26,
        fontWeight: '900',
        color: '#1a1a1a',
    },
    heroSubtitle: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    chipContainer: {
        marginTop: 16,
    },
    chipContent: {
        paddingHorizontal: 16,
    },
    chip: {
        paddingHorizontal: 18,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: '#fff',
        borderWidth: 1.5,
        borderColor: '#e0e0e0',
        marginRight: 10,
    },
    activeChip: {
        backgroundColor: '#1a1a2e',
        borderColor: '#1a1a2e',
    },
    chipText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#666',
    },
    activeChipText: {
        color: '#fff',
    },
    blogList: {
        padding: 16,
        paddingTop: 20,
    },
    featuredCard: {
        height: 220,
        borderRadius: 20,
        overflow: 'hidden',
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 6,
    },
    featuredImage: {
        width: '100%',
        height: '100%',
        backgroundColor: '#1a1a2e',
    },
    featuredOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 18,
        paddingTop: 60,
    },
    categoryBadge: {
        backgroundColor: '#E31C25',
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 8,
        alignSelf: 'flex-start',
        marginBottom: 10,
    },
    categoryBadgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    featuredTitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '800',
        lineHeight: 26,
    },
    featuredMeta: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 12,
    },
    featuredAuthor: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 12,
        fontWeight: '600',
    },
    featuredDate: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 12,
    },
    blogCard: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 16,
        marginBottom: 14,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 4,
    },
    blogImage: {
        width: 110,
        height: 120,
        backgroundColor: '#1a1a2e',
    },
    blogContent: {
        flex: 1,
        padding: 14,
        justifyContent: 'space-between',
    },
    smallCategoryBadge: {
        backgroundColor: '#FFF0F0',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        alignSelf: 'flex-start',
    },
    smallCategoryText: {
        color: '#E31C25',
        fontSize: 9,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    blogTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1a1a1a',
        marginTop: 6,
        lineHeight: 19,
    },
    blogExcerpt: {
        fontSize: 12,
        color: '#666',
        lineHeight: 16,
        marginTop: 4,
    },
    blogMeta: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    blogAuthor: {
        fontSize: 11,
        color: '#888',
        fontWeight: '600',
    },
    blogDate: {
        fontSize: 11,
        color: '#aaa',
    },
    emptyState: {
        alignItems: 'center',
        paddingTop: 60,
    },
    emptyIcon: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 4,
        marginBottom: 20,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#333',
    },
    emptySubtitle: {
        fontSize: 13,
        color: '#888',
        marginTop: 6,
    },
    modalContainer: {
        flex: 1,
        backgroundColor: '#fff',
    },
    modalImage: {
        width: '100%',
        height: 280,
        backgroundColor: '#1a1a2e',
    },
    closeButton: {
        position: 'absolute',
        top: 50,
        right: 20,
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        padding: 20,
    },
    modalCategoryBadge: {
        backgroundColor: '#E31C25',
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 8,
        alignSelf: 'flex-start',
    },
    modalCategoryText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: '900',
        color: '#1a1a1a',
        marginTop: 16,
        lineHeight: 32,
    },
    modalMeta: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 20,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    authorRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    authorAvatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#1a1a2e',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    authorInitial: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
    modalAuthor: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1a1a1a',
    },
    modalDate: {
        fontSize: 12,
        color: '#888',
        marginTop: 2,
    },
    shareButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#FFF0F0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContentText: {
        fontSize: 16,
        lineHeight: 28,
        color: '#333',
        marginTop: 24,
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 28,
        gap: 10,
    },
    tag: {
        backgroundColor: '#f5f5f5',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
    },
    tagText: {
        fontSize: 12,
        color: '#666',
        fontWeight: '600',
    },
});
