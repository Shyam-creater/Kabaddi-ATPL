import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    Modal,
    TouchableOpacity,
    ScrollView,
    Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface ProductDetailsModalProps {
    visible: boolean;
    onClose: () => void;
    product: any;
}

export default function ProductDetailsModal({
    visible,
    onClose,
    product,
}: ProductDetailsModalProps) {
    if (!product) return null;

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

                <View style={styles.modalContent}>
                    {/* Header with close button */}
                    <LinearGradient colors={['#E31C25', '#900C12']} style={styles.header}>
                        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                            <Ionicons name="close" size={24} color="#fff" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Product Details</Text>
                    </LinearGradient>

                    {/* Scrollable Content */}
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.scrollContent}
                    >
                        {/* Product Image */}
                        <View style={styles.imageContainer}>
                            <Image
                                source={{ uri: product.image }}
                                style={styles.productImage}
                                resizeMode="contain"
                            />
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>NEW</Text>
                            </View>
                        </View>

                        {/* Product Info */}
                        <View style={styles.infoSection}>
                            <Text style={styles.productTitle}>{product.title}</Text>

                            {/* Price Section */}
                            <View style={styles.priceRow}>
                                <Text style={styles.currentPrice}>₹ {product.price}</Text>
                                <Text style={styles.originalPrice}>₹ {product.price + 400}</Text>
                                <View style={styles.discountBadge}>
                                    <Text style={styles.discountText}>Save ₹400</Text>
                                </View>
                            </View>

                            {/* Rating */}
                            <View style={styles.ratingRow}>
                                <Ionicons name="star" size={18} color="#FFD700" />
                                <Text style={styles.ratingText}>
                                    {product.rating?.rate || 4.5} ({product.rating?.count || 120} reviews)
                                </Text>
                            </View>

                            {/* Divider */}
                            <View style={styles.divider} />

                            {/* Category */}
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Category</Text>
                                <View style={styles.categoryChip}>
                                    <Text style={styles.categoryText}>{product.category || 'General'}</Text>
                                </View>
                            </View>

                            {/* Description */}
                            <Text style={styles.sectionTitle}>Description</Text>
                            <Text style={styles.description}>
                                {product.description ||
                                    'Premium quality cricket gear designed for professional players. Built with high-quality materials for durability and performance. Perfect for training sessions and competitive matches.'}
                            </Text>

                            {/* Features */}
                            <Text style={styles.sectionTitle}>Features</Text>
                            <View style={styles.featureList}>
                                <View style={styles.featureItem}>
                                    <Ionicons name="checkmark-circle" size={20} color="#0a8f83" />
                                    <Text style={styles.featureText}>Premium Quality Material</Text>
                                </View>
                                <View style={styles.featureItem}>
                                    <Ionicons name="checkmark-circle" size={20} color="#0a8f83" />
                                    <Text style={styles.featureText}>Official Tournament Approved</Text>
                                </View>
                                <View style={styles.featureItem}>
                                    <Ionicons name="checkmark-circle" size={20} color="#0a8f83" />
                                    <Text style={styles.featureText}>1 Year Warranty</Text>
                                </View>
                                <View style={styles.featureItem}>
                                    <Ionicons name="checkmark-circle" size={20} color="#0a8f83" />
                                    <Text style={styles.featureText}>Free Shipping</Text>
                                </View>
                            </View>

                            {/* Stock Status */}
                            <View style={styles.stockRow}>
                                <Ionicons name="cube-outline" size={18} color="#0a8f83" />
                                <Text style={styles.stockText}>In Stock - Ready to Ship</Text>
                            </View>
                        </View>
                    </ScrollView>

                    {/* Bottom Action Buttons */}
                    <View style={styles.bottomActions}>
                        <TouchableOpacity style={styles.cartBtn}>
                            <Ionicons name="cart-outline" size={20} color="#E31C25" />
                            <Text style={styles.cartBtnText}>Add to Cart</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.buyBtn}>
                            <Text style={styles.buyBtnText}>Buy Now</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
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
        height: '90%',
        overflow: 'hidden',
    },
    header: {
        height: 80,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 10,
    },
    closeBtn: {
        position: 'absolute',
        top: 28,
        right: 16,
        zIndex: 10,
        padding: 4,
    },
    headerTitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
    },
    scrollContent: {
        paddingBottom: 120,
    },
    imageContainer: {
        backgroundColor: '#f8f9fa',
        padding: 20,
        alignItems: 'center',
        position: 'relative',
    },
    productImage: {
        width: width - 80,
        height: 250,
    },
    badge: {
        position: 'absolute',
        top: 20,
        left: 20,
        backgroundColor: '#E31C25',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 4,
    },
    badgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '700',
    },
    infoSection: {
        padding: 20,
    },
    productTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#111',
        marginBottom: 12,
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 12,
    },
    currentPrice: {
        fontSize: 26,
        fontWeight: '800',
        color: '#E31C25',
    },
    originalPrice: {
        fontSize: 16,
        color: '#94a3b8',
        textDecorationLine: 'line-through',
    },
    discountBadge: {
        backgroundColor: '#dcfce7',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    discountText: {
        color: '#16a34a',
        fontSize: 12,
        fontWeight: '600',
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 16,
    },
    ratingText: {
        fontSize: 14,
        color: '#666',
    },
    divider: {
        height: 1,
        backgroundColor: '#f0f0f0',
        marginVertical: 16,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    detailLabel: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    categoryChip: {
        backgroundColor: '#f1f5f9',
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 16,
    },
    categoryText: {
        fontSize: 13,
        color: '#475569',
        fontWeight: '600',
        textTransform: 'capitalize',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111',
        marginBottom: 10,
        marginTop: 8,
    },
    description: {
        fontSize: 14,
        color: '#555',
        lineHeight: 22,
        marginBottom: 16,
    },
    featureList: {
        gap: 10,
        marginBottom: 16,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    featureText: {
        fontSize: 14,
        color: '#444',
    },
    stockRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#f0fdf4',
        padding: 12,
        borderRadius: 10,
    },
    stockText: {
        fontSize: 14,
        color: '#0a8f83',
        fontWeight: '600',
    },
    bottomActions: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        padding: 16,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        gap: 12,
    },
    cartBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        borderWidth: 2,
        borderColor: '#E31C25',
        borderRadius: 12,
        backgroundColor: '#fff',
    },
    cartBtnText: {
        color: '#E31C25',
        fontSize: 15,
        fontWeight: '700',
    },
    buyBtn: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        backgroundColor: '#E31C25',
        borderRadius: 12,
    },
    buyBtnText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '700',
    },
});
