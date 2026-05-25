import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

export default function BlogDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Blog data passed via navigation params
  const blog = {
    _id: params._id as string,
    title: params.title as string,
    excerpt: params.excerpt as string,
    content: params.content as string,
    image: params.image as string,
    author: params.author as string,
    category: params.category as string,
    tags: params.tags
      ? typeof params.tags === 'string'
        ? params.tags.split(',')
        : params.tags
      : [],
    createdAt: params.createdAt as string,
  };

  const formattedDate = blog.createdAt
    ? new Date(blog.createdAt).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '';

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero Image */}
        <View style={styles.heroContainer}>
          <Image source={{ uri: blog.image }} style={styles.heroImage} />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.9)']}
            style={styles.heroGradient}
          />
          {/* Back Button */}
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>

          {/* Category Badge */}
          <Animated.View entering={FadeInDown.delay(100)} style={styles.heroBadgeWrapper}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{blog.category?.toUpperCase()}</Text>
            </View>
          </Animated.View>
        </View>

        {/* Content Card */}
        <Animated.View entering={FadeInUp.delay(200).springify()} style={styles.contentCard}>
          {/* Title */}
          <Text style={styles.title}>{blog.title}</Text>

          {/* Author & Date Row */}
          <View style={styles.metaRow}>
            <View style={styles.authorPill}>
              <Ionicons name="person-circle-outline" size={18} color="#7C3AED" />
              <Text style={styles.authorText}>{blog.author}</Text>
            </View>
            {formattedDate ? (
              <View style={styles.datePill}>
                <Ionicons name="calendar-outline" size={14} color="#999" />
                <Text style={styles.dateText}>{formattedDate}</Text>
              </View>
            ) : null}
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Excerpt */}
          {blog.excerpt ? (
            <Text style={styles.excerpt}>{blog.excerpt}</Text>
          ) : null}

          {/* Full Content */}
          {blog.content ? (
            <Text style={styles.content}>{blog.content}</Text>
          ) : null}

          {/* Tags */}
          {blog.tags && blog.tags.length > 0 && (
            <View style={styles.tagsSection}>
              <Text style={styles.tagsLabel}>Tags</Text>
              <View style={styles.tagsRow}>
                {(Array.isArray(blog.tags) ? blog.tags : (blog.tags as string).split(','))
                  .map((tag: string, i: number) => (
                    <View key={i} style={styles.tagChip}>
                      <Text style={styles.tagText}>#{tag.trim()}</Text>
                    </View>
                  ))}
              </View>
            </View>
          )}

          <View style={{ height: 40 }} />
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F6F9',
  },
  scrollContent: {
    paddingBottom: 30,
  },
  heroContainer: {
    width: '100%',
    height: 300,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  heroGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 180,
  },
  backBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 54 : 20,
    left: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBadgeWrapper: {
    position: 'absolute',
    bottom: 18,
    left: 20,
  },
  categoryBadge: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 10,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 1,
  },
  contentCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1A1A1A',
    lineHeight: 30,
    marginBottom: 16,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  authorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F3F0FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  authorText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#7C3AED',
  },
  datePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dateText: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginBottom: 20,
  },
  excerpt: {
    fontSize: 16,
    fontWeight: '600',
    color: '#444',
    lineHeight: 24,
    marginBottom: 20,
    fontStyle: 'italic',
    borderLeftWidth: 4,
    borderLeftColor: '#7C3AED',
    paddingLeft: 14,
  },
  content: {
    fontSize: 15,
    color: '#333',
    lineHeight: 26,
    fontWeight: '400',
    marginBottom: 28,
  },
  tagsSection: {
    marginTop: 4,
  },
  tagsLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#999',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagChip: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  tagText: {
    fontSize: 13,
    color: '#7C3AED',
    fontWeight: '700',
  },
});
