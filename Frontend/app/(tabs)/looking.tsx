import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  TextInput,
  UIManager,
  RefreshControl,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppHeader from '../../components/common/AppHeader';
import CreateLookingPostModal from '../../components/Looking/CreateLookingPost';
import MyPostsModal from '../../components/Looking/MyPostsScreen';
import { getAllLookingPosts } from '../../services/looking.api';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function LookingScreen() {
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showMyPosts, setShowMyPosts] = useState(false);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    fetchAllPosts();
  }, []);

  const fetchAllPosts = async () => {
    try {
      setLoading(true);
      const res = await getAllLookingPosts();
      setPosts(Array.isArray(res?.data) ? res.data : []);
    } catch (error) {
      console.log('Error fetching all posts:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchAllPosts();
  };

  const categories = ['All', 'Team', 'Player'];

  const filteredPosts = useMemo(() => {
    let result = posts;

    // 1. Filter by Category
    if (selectedCategory !== 'All') {
      result = result.filter((item) => {
        // 'lookingFor' usually holds these values
        const cat = item.lookingFor || '';
        return cat.toLowerCase() === selectedCategory.toLowerCase();
      });
    }

    // 2. Filter by Search Query (Location, Name, Ground)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((item) => {
        const user = item.user || {};
        const location = (item.location || '').toLowerCase();
        const ground = (item.ground || '').toLowerCase();
        const name = (user.name || '').toLowerCase();

        return (
          location.includes(query) ||
          ground.includes(query) ||
          name.includes(query)
        );
      });
    }

    return result;
  }, [posts, selectedCategory, searchQuery]);

  const handleCategoryPress = (cat: string) => {
    // LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelectedCategory(cat);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <AppHeader />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0a8f83" />}
      >
        <View style={styles.headerSection}>
          <View style={styles.titleRow}>
            <Text style={styles.titleText}>
              Looking for <Text style={styles.highlight}>Tournaments?</Text>
            </Text>

            <View style={styles.titleButtons}>
              <TouchableOpacity
                style={styles.postBtn}
                onPress={() => setShowCreatePost(true)}
              >
                <Ionicons name="add" size={18} color="#fff" />
                <Text style={styles.btnText}>Post</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.postBtn}
                onPress={() => setShowMyPosts(true)}
              >
                <Text style={styles.btnText}>My Post</Text>
              </TouchableOpacity>

            </View>
          </View>

          {/* 🔍 Search / Location Filter Input */}
          <View style={styles.searchContainer}>
            <Ionicons name="search-outline" size={20} color="#888" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by location, ground, or name..."
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color="#999" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
          {categories.map((item, index) => {
            const isActive = selectedCategory === item;
            return (
              <TouchableOpacity
                key={index}
                style={[styles.chip, isActive && styles.activeChip]}
                onPress={() => handleCategoryPress(item)}
              >
                <Text style={[styles.chipText, isActive && styles.activeChipText]}>
                  {item}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* 🔥 Dynamic Posts */}
        {loading ? (
          <ActivityIndicator size="large" color="#FF6B81" style={{ marginTop: 20 }} />
        ) : filteredPosts.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="search" size={40} color="#ccc" />
            <Text style={styles.emptyText}>No posts found matching your criteria</Text>
          </View>
        ) : (
          filteredPosts.map((item) => <LookingCard key={item._id} item={item} />)
        )}

        <View style={{ height: 20 }} />
      </ScrollView>

      <CreateLookingPostModal visible={showCreatePost} onClose={() => setShowCreatePost(false)} />
      <MyPostsModal visible={showMyPosts} onClose={() => setShowMyPosts(false)} />
    </KeyboardAvoidingView>
  );
}

function LookingCard({ item }: { item: any }) {
  const user = item.user || {};
  const name = user.name || 'Unknown';
  const role = user.role || 'Player';
  const lookingFor = item.lookingFor || 'someone';
  const matchType = item.type || 'Match';
  const ground = item.ground || 'N/A';
  const location = item.location || 'Unknown location';

  const avatar = user.profilePicture
    ? { uri: user.profilePicture }
    : { uri: 'https://i.pravatar.cc/100' };

  // 📅 Match Date + Days Left
  const matchDate = new Date(item.matchDate || item.createdAt);
  const today = new Date();
  const diffDays = Math.ceil(
    (matchDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
  const daysLeftText = diffDays > 0 ? `${diffDays} days left` : 'Closed';

  // ⏱ Time Ago
  const created = new Date(item.createdAt);
  const diffMins = Math.floor((Date.now() - created.getTime()) / 60000);
  const timeAgo =
    diffMins < 60 ? `${diffMins} mins ago` : diffMins < 1440 ? `${Math.floor(diffMins / 60)} hrs ago` : `${Math.floor(diffMins / 1440)} days ago`;

  // 🗓 Formatted Date
  const formattedDate = matchDate.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <View style={styles.card}>
      <View style={styles.cardTopRow}>
        <Image source={avatar} style={styles.avatar} />

        <View style={styles.cardTextContainer}>
          <Text style={styles.cardMainText}>
            <Text style={styles.bold}>{name}</Text>
            {` is a ${role} and is looking for a ${lookingFor} for ${matchType}`}
          </Text>

          <View style={styles.infoRow}>
            <Text style={styles.dot}>•</Text>
            <Text style={styles.infoText}>
              {formattedDate} | {daysLeftText}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.dot}>•</Text>
            <Text style={styles.infoText}>{ground} Ground</Text>
          </View>
           <View style={styles.infoRow}>
              <Text style={styles.dot}>•</Text>
              <Text style={styles.infoText}>{matchType}</Text>
            </View>
        </View>
      </View>

      <View style={styles.cardBottomRow}>
        {/* LEFT — Location */}
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={14} color="#0a8f83" />
          <Text style={styles.locationText}>{location}</Text>
        </View>

        {/* RIGHT — Time Ago */}
        <Text style={styles.timeAgo}>{timeAgo}</Text>
      </View>

    
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f6f8' },

  headerSection: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 1,
    borderBottomRightRadius: 1,
    paddingBottom: 15,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },

  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  titleText: { fontSize: 16, fontWeight: '700', color: '#333' },
  highlight: { color: '#0a8f83' },

  titleButtons: { flexDirection: 'row', gap: 8 },
  postBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0a8f83',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    elevation: 1,
  },
  btnText: { color: '#fff', marginLeft: 4, fontWeight: '600', fontSize: 13 },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f2f5',
    marginHorizontal: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    height: 40,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, color: '#333', fontSize: 14 },

  chipRow: { paddingLeft: 10, marginBottom: 15 },
  chip: {
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
  },
  activeChip: {
    backgroundColor: '#0a8f83',
    borderColor: '#0a8f83',
  },
  chipText: { color: '#666', fontWeight: '500' },
  activeChipText: { color: '#fff', fontWeight: '700' },

  card: {
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginBottom: 12,
    borderRadius: 12,
    padding: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  cardTopRow: { flexDirection: 'row' },
  avatar: { width: 48, height: 48, borderRadius: 24, marginRight: 12 },
  cardTextContainer: { flex: 1 },
  cardMainText: { fontSize: 15, lineHeight: 22, color: '#333' },
  bold: { fontWeight: '700', color: '#000' },

  infoRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  dot: { marginRight: 6, color: '#aaa', fontSize: 10 },
  infoText: { color: '#666', fontSize: 13 },

  cardBottomRow: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },

  timeAgo: {
    fontSize: 12,
    color: '#999',
  },
  emptyState: { alignItems: 'center', padding: 40 },
  emptyText: { color: '#999', marginTop: 10, fontSize: 14 },

  contactBtn: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#0a8f83',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 15,
    alignSelf: 'flex-start'
  },
  contactText: { color: '#0a8f83', marginLeft: 4, fontSize: 12, fontWeight: '600' },
});
