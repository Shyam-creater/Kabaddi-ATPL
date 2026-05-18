import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { useRef } from 'react';
import { useScrollToTop } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import AppHeader from '../../components/common/AppHeader';

const NUM_COLUMNS = 3;

const DATA = [
  { id: 'scorers', title: 'Scorers', icon: 'clipboard-outline' },
  { id: 'umpires', title: 'Umpires', icon: 'person-outline' },
  { id: 'commentators', title: 'Commentators', icon: 'mic-outline' },
  { id: 'streamers', title: 'Streamers', icon: 'play-circle-outline' },
  { id: 'organisers', title: 'Organisers', icon: 'people-outline' },
  { id: 'academies', title: 'Academies', icon: 'school-outline' },
  { id: 'grounds', title: 'Grounds', icon: 'football-outline' },
  { id: 'shops', title: 'Shops', icon: 'storefront-outline' },
  {
    id: 'physio',
    title: 'Physio and Fitness Trainer',
    icon: 'fitness-outline',
  },
  {
    id: 'coaching',
    title: 'Personal Coaching',
    icon: 'person-circle-outline',
  },
  {
    id: 'box-cricket',
    title: 'Box Cricket & Nets',
    icon: 'grid-outline',
  },
];

const ROUTE_MAP: Record<string, string> = {
  scorers: '/community/scorers',
  umpires: '/community/umpires',
  commentators: '/community/commentators',
  streamers: '/community/streamers',
  organisers: '/community/organisers',
  academies: '/community/academies',
  grounds: '/community/grounds',
  shops: '/community/shops',
  physio: '/community/physio',
  coaching: '/community/coaching',
  'box-cricket': '/community/box-cricket',
};

/* 🔥 Helper to center last row */
const formatData = (data: any[], numColumns: number) => {
  const result = [...data];
  const rows = Math.floor(result.length / numColumns);
  let lastRowCount = result.length - rows * numColumns;

  while (lastRowCount !== 0 && lastRowCount < numColumns) {
    result.push({ id: `empty-${lastRowCount}`, empty: true });
    lastRowCount++;
  }

  return result;
};

export default function CommunityScreen() {
  const scrollRef = useRef<FlatList>(null);
  useScrollToTop(scrollRef);

  const handlePress = (item: any) => {
    if (item.empty) return;

    const route = ROUTE_MAP[item.id];
    if (route) router.push(route as any);
  };

  const renderItem = ({ item }: any) => {
    if (item.empty) {
      return <View style={[styles.card, styles.invisible]} />;
    }

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.85}
        onPress={() => handlePress(item)}
      >
        <Ionicons name={item.icon} size={32} color="#E31C25" />
        <Text style={styles.cardText}>{item.title}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <AppHeader />

      {/* Title */}
      <View style={styles.titleRow}>
        <Text style={styles.title}>
          Cricket community in{' '}
          <Text style={styles.location}>Vellore</Text>
        </Text>
      </View>

      {/* Grid */}
      <FlatList
        ref={scrollRef}
        data={formatData(DATA, NUM_COLUMNS)}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={NUM_COLUMNS}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },

  titleRow: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 4,
  },

  title: {
    fontSize: 16,
    color: '#1A1A1A',
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  location: {
    color: '#E31C25',
    fontWeight: '800',
  },

  list: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },

  row: {
    justifyContent: 'space-between',
  },

  card: {
    width: '31%',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 24,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',

    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },

  invisible: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    elevation: 0,
    shadowOpacity: 0,
  },

  cardText: {
    marginTop: 12,
    fontSize: 12,
    textAlign: 'center',
    color: '#1A1A1A',
    fontWeight: '600',
    lineHeight: 16,
    paddingHorizontal: 4,
    letterSpacing: 0.3,
  },
});
