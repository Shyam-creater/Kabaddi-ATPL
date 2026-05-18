import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  ActivityIndicator,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { getMyLookingPosts } from '../../services/looking.api';

export default function MyPostsModal({ visible, onClose }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (visible) {
      fetchMyPosts();
    }
  }, [visible]);

  const fetchMyPosts = async () => {
    try {
      setLoading(true);
      const res = await getMyLookingPosts();

      // Fix: set posts from res.data directly
      setPosts(Array.isArray(res?.data) ? res.data : []);
    } catch (err) {
      console.log('Error fetching my posts', err);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }) => {
    const user = item.user || {};

    const name = user.name || 'You';
    const role = user.role || 'Player';
    const lookingFor = item.lookingFor;
    const matchType = item.type;
    const ground = item.ground;
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
            {/* 🔥 MAIN TEXT */}
            <Text style={styles.cardMainText}>
              <Text style={styles.bold}>{name}</Text>
              {` is a ${role} and is looking for a ${lookingFor} for ${matchType}`}
            </Text>

            {/* Date | Days Left or Closed */}
            <View style={styles.infoRow}>
              <Text style={styles.dot}>•</Text>
              <Text style={styles.infoText}>
                {formattedDate} | {daysLeftText}
              </Text>
            </View>

            {/* Ground */}
            <View style={styles.infoRow}>
              <Text style={styles.dot}>•</Text>
              <Text style={styles.infoText}>{ground} Ground</Text>
            </View>

            {/* Match Type */}
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
  };




  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

        <View style={styles.modalContent}>
          {/* Header */}
          <LinearGradient colors={['#E31C25', '#900C12']} style={styles.header}>
            <Text style={styles.headerTitle}>My Posts</Text>
          </LinearGradient>

          {/* Content */}
          {loading ? (
            <View style={styles.loader}>
              <ActivityIndicator size="large" color="#E31C25" />
            </View>
          ) : (
            <FlatList
              data={posts}
              keyExtractor={(item) => item._id}
              renderItem={renderItem}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No posts found</Text>
              }
            />
          )}
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
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingVertical: 12,
    paddingBottom: 40,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    color: '#888',
  },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginBottom: 12,
    borderRadius: 10,
    padding: 12,
    elevation: 2,
  },
  cardTopRow: {
    flexDirection: 'row',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
  },
  cardTextContainer: {
    flex: 1,
  },
  cardMainText: {
    fontSize: 14,
    lineHeight: 20,
  },
  bold: {
    fontWeight: 'bold',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  dot: {
    marginRight: 5,
    color: '#999',
  },
  infoText: {
    color: '#555',
    fontSize: 13,
  },
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
},

locationText: {
  marginLeft: 4,
  fontSize: 12,
  color: '#888',
},

timeAgo: {
  fontSize: 12,
  color: '#888',
  textAlign: 'right',
},

});
