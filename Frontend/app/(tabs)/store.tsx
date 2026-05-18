import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Animated,
  RefreshControl,
} from 'react-native';
import { useScrollToTop } from '@react-navigation/native';
import AppHeader from '../../components/common/AppHeader';
import ProductDetailsModal from '../../components/Store/ProductDetailsModal';
import api from '../../services/api';

const { width } = Dimensions.get('window');

export default function Store() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  const handleProductPress = (product: any) => {
    setSelectedProduct(product);
    setShowProductModal(true);
  };


  const scrollX = useRef(new Animated.Value(0)).current;
  const bannerRef = useRef<ScrollView>(null);
  const mainScrollRef = useRef<ScrollView>(null);

  useScrollToTop(mainScrollRef);

  const bannerImages = [
    'https://i.pinimg.com/564x/1d/82/8c/1d828c922b7f27028f46ad8ced022e41.jpg',
    'https://i.pinimg.com/736x/12/6e/3c/126e3c114d28da508b2adc0dee7c500d.jpg',
    'https://static.vecteezy.com/system/resources/thumbnails/007/800/719/small/old-training-cricket-sport-equipments-on-dark-floor-leather-ball-wickets-helmet-and-wooden-bat-soft-and-selective-focus-traditional-cricket-sport-lovers-around-the-world-concept-photo.jpg',
  ];



  /* 🔁 Auto banner scroll */
  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      if (!bannerRef.current) return;
      index = (index + 1) % bannerImages.length;
      bannerRef.current.scrollTo({ x: index * width, animated: true });
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  /* 🟢 Fetch products */
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    }
    try {
      const res = await api.get('/products');
      const data = Array.isArray(res.data) ? res.data : [];
      setProducts(data);

      // extract categories from admin field
      const uniqueCategories = ['All', ...new Set(data.map(p => p.category))];
      setCategories(uniqueCategories);
    } catch (err) {
      console.log('Store fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    fetchProducts(true);
  };

  /* 🔥 Category filtered products (FEATURED ONLY) */
  const featuredProducts =
    selectedCategory === 'All'
      ? products.slice(0, 6)
      : products.filter(p => p.category === selectedCategory);

  /* 🟠 Horizontal card */
  const renderHorizontalItem = ({ item }: any) => (
    <TouchableOpacity
      style={styles.horizontalCard}
      activeOpacity={0.85}
      onPress={() => handleProductPress(item)}
    >
      <View style={styles.imageWrap}>
        <Image source={{ uri: item.image }} style={styles.horizontalImage} resizeMode="contain" />
        <View style={styles.badge}>
          <Text style={styles.badgeText}>NEW</Text>
        </View>
      </View>

      <Text numberOfLines={1} style={styles.hTitle}>{item.title}</Text>

      <View style={styles.priceRow}>
        <Text style={styles.hPrice}>₹ {item.price}</Text>
        <Text style={styles.fakePrice}>₹ {item.price + 400}</Text>
      </View>
    </TouchableOpacity>
  );

  /* 🟢 Vertical card */
  const renderVerticalItem = ({ item }: any) => (
    <TouchableOpacity
      style={styles.verticalCard}
      activeOpacity={0.85}
      onPress={() => handleProductPress(item)}
    >
      <View style={styles.verticalImageWrap}>
        <Image source={{ uri: item.image }} style={styles.verticalImage} resizeMode="contain" />
      </View>

      <View style={{ flex: 1 }}>
        <Text numberOfLines={2} style={styles.vTitle}>{item.title}</Text>

        <View style={styles.verticalBottom}>
          <View>
            <Text style={styles.vPrice}>₹ {item.price}</Text>
            <Text style={styles.vRating}>⭐ {item.rating?.rate || 0}</Text>
          </View>

          <TouchableOpacity
            style={styles.viewBtn}
            onPress={() => handleProductPress(item)}
          >
            <Text style={styles.viewText}>View</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <AppHeader />
        <ActivityIndicator size="large" color="#e11d48" style={{ marginTop: 50 }} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader />

      <ScrollView
        ref={mainScrollRef}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#e11d48']}
            tintColor="#e11d48"
          />
        }
      >
        {/* 🔴 Banner */}
        <Animated.ScrollView
          ref={bannerRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}

          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: false }
          )}
        >
          {bannerImages.map((img, index) => (
            <View key={index} style={styles.bannerWrapper}>
              <Image source={{ uri: img }} style={styles.banner} />
              <View style={styles.bannerOverlayBg} />

              <View style={styles.bannerOverlay}>
                <Text style={styles.bannerTitle}>
                  Upgrade your <Text style={{ color: '#E50914' }}>performance</Text>
                </Text>
                <Text style={styles.bannerSubtitle}>Premium gear for champions</Text>

                <View style={styles.ctaBtn}>
                  <Text style={styles.ctaText}>Explore now</Text>
                </View>
              </View>
            </View>
          ))}
        </Animated.ScrollView>

        {/* 🔘 Dots */}
        <View style={styles.dotsContainer}>
          {bannerImages.map((_, i) => {
            const scale = scrollX.interpolate({
              inputRange: [(i - 1) * width, i * width, (i + 1) * width],
              outputRange: [1, 1.6, 1],
              extrapolate: 'clamp',
            });
            const opacity = scrollX.interpolate({
              inputRange: [(i - 1) * width, i * width, (i + 1) * width],
              outputRange: [0.4, 1, 0.4],
              extrapolate: 'clamp',
            });

            return (
              <Animated.View
                key={i}
                style={[styles.dot, { transform: [{ scale }], opacity }]}
              />
            );
          })}
        </View>

        {/* 🟠 Featured Gear */}
        <Text style={styles.sectionTitle}>Featured Gear</Text>

        {/* 🟡 Categories */}


        <FlatList
          data={products}
          horizontal
          renderItem={renderHorizontalItem}
          keyExtractor={(item) => item._id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 14 }}
        />

        {/* 🟢 All Products */}
        <Text style={styles.sectionTitle}>All Products</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryContainer}
        >
          {categories.map(cat => (
            <TouchableOpacity
              key={cat}
              onPress={() => setSelectedCategory(cat)}
              style={[
                styles.categoryChip,
                selectedCategory === cat && styles.categoryChipActive,
              ]}
            >
              <Text
                style={[
                  styles.categoryText,
                  selectedCategory === cat && styles.categoryTextActive,
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <FlatList
          data={featuredProducts}
          renderItem={renderVerticalItem}
          keyExtractor={(item) => item._id}
          scrollEnabled={false}
          contentContainerStyle={{ paddingHorizontal: 14, paddingBottom: 40 }}
        />
      </ScrollView>

      {/* Product Details Modal */}
      <ProductDetailsModal
        visible={showProductModal}
        onClose={() => setShowProductModal(false)}
        product={selectedProduct}
      />
    </View>
  );
}

/* 🎨 STYLES */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb', marginBottom: 40 },

  banner: {
    width: width - 20,
    height: 420,
    marginTop: 15,
    marginHorizontal: 10,
    borderRadius: 1,
  },

  bannerWrapper: { width, alignItems: 'center', position: 'relative' },

  bannerOverlayBg: {
    position: 'absolute',
    bottom: 0,
    left: 10,
    right: 10,
    height: 150,
    borderRadius: 5,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },

  bannerOverlay: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 24,
  },

  bannerTitle: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '900',
  },

  bannerSubtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 16,
    marginTop: 6,
  },

  ctaBtn: {
    backgroundColor: '#E31C25',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    marginTop: 16,
    alignSelf: 'flex-start',
  },

  ctaText: { color: '#fff', fontWeight: '700' },

  dotsContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 18 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#E31C25', marginHorizontal: 4 },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginVertical: 16,
    marginLeft: 14,
  },

  /* Categories */
  categoryContainer: { paddingHorizontal: 14, paddingBottom: 10 },

  categoryChip: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
  },

  categoryChipActive: { backgroundColor: '#e11d48' },

  categoryText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    textTransform: 'capitalize',
  },

  categoryTextActive: { color: '#fff' },

  /* Horizontal Card */
  horizontalCard: {
    width: 160,
    backgroundColor: '#fff',
    borderRadius: 5,
    padding: 12,
    marginRight: 16,
    marginBottom: 16,
    elevation: 4,
  },

  imageWrap: { position: 'relative' },

  horizontalImage: { width: '100%', height: 100 },

  badge: {
    position: 'absolute',
    top: 6,
    left: 0,
    backgroundColor: '#e11d48',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },

  badgeText: { color: '#fff', fontSize: 8, fontWeight: '700' },

  hTitle: { fontSize: 13, fontWeight: '600', marginTop: 6 },

  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },

  hPrice: { fontSize: 14, fontWeight: '800', color: '#E31C25' },

  fakePrice: {
    fontSize: 12,
    color: '#94a3b8',
    textDecorationLine: 'line-through',
  },

  /* Vertical Card */
  verticalCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 5,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
  },

  verticalImageWrap: {
    width: 80,
    height: 80,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },

  verticalImage: { width: 80, height: 80 },

  vTitle: { fontSize: 14, fontWeight: '600' },

  verticalBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },

  vPrice: { fontSize: 15, fontWeight: '800', color: '#e11d48' },

  vRating: { fontSize: 12, color: '#64748b' },

  viewBtn: {
    backgroundColor: '#111827',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 14,
  },

  viewText: { color: '#fff', fontSize: 12, fontWeight: '600' },
});
