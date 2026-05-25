import React, { useState, useRef, useEffect } from 'react';
import { useScrollToTop } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  ImageBackground,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AppHeader from '../../components/common/AppHeader';
import MatchService from '../../services/matchService';
import socketService from '../../services/socketService';
import VideoPlayerModal from '../../components/common/VideoPlayerModal';

const { width } = Dimensions.get('window');

// --- Types ---
interface MatchCardData {
  id: string;
  league: string;
  sport: string;
  team1: { name: string; short: string; score: string | number; overs?: string };
  team2: { name: string; short: string; score: string | number; overs?: string };
  status: string;
  venue: string;
  viewers: string;
  image: string;
  time?: string;
  dateStr?: string;
  videoUrl?: string; // liveStreamUrl for LIVE matches
}

const SPORTS_TABS = [
  { id: 'all', name: 'All Sports', icon: 'trophy' },
  { id: 'cricket', name: 'Cricket', icon: 'cricket' },
  { id: 'kabaddi', name: 'Kabaddi', icon: 'human-handsup' },
  { id: 'football', name: 'Football', icon: 'soccer' },
];

export default function MyScoreScreen() {
  const [activeTab, setActiveTab] = useState('all');
  const [activeFilter, setActiveFilter] = useState('All Matches');
  const [venueFilters, setVenueFilters] = useState<string[]>(['All Matches', 'Live Now']);
  const [videoVisible, setVideoVisible] = useState(false);
  const [videoMatch, setVideoMatch] = useState<MatchCardData | null>(null);

  const scrollRef = useRef(null);

  // Real-time Data
  const [allMatches, setAllMatches] = useState<MatchCardData[]>([]);
  const [filteredLiveMatches, setFilteredLiveMatches] = useState<MatchCardData[]>([]);
  const [filteredUpcomingMatches, setFilteredUpcomingMatches] = useState<MatchCardData[]>([]);

  useScrollToTop(scrollRef);

  useEffect(() => {
    loadData();

    // Socket Listener (Intelligently merge socket updates)
    const handleMatchUpdate = (updatedMatch: any) => {
      setAllMatches(prev => {
        const index = prev.findIndex(m => m.id === updatedMatch._id);
        const mapped = mapMatchToCard(updatedMatch);
        if (index !== -1) {
          const newMatches = [...prev];
          newMatches[index] = mapped;
          return newMatches;
        } else {
          return [mapped, ...prev];
        }
      });
    };

    socketService.onMatchUpdate(handleMatchUpdate);

    return () => {
      socketService.removeListener('match:update', handleMatchUpdate);
    };
  }, []);

  // Filter Logic
  useEffect(() => {
    let result = allMatches;

    // 1. Filter by Sport Tab
    if (activeTab !== 'all') {
      result = result.filter(m => m.sport === activeTab);
    }

    // 2. Filter by "Filter Bar" (Location/City)
    if (activeFilter !== 'All Matches' && activeFilter !== 'Live Now') {
      // It is a city/venue filter
      result = result.filter(m => m.venue && m.venue.includes(activeFilter));
    }

    // Update Live vs Upcoming Lists
    const live = result.filter(m => m.status === 'LIVE');
    const upcoming = result.filter(m => m.status === 'UPCOMING');

    if (activeFilter === 'Live Now') {
      // Special case: Only show live items if "Live Now" is selected? 
      // Or maybe "Live Now" just means don't show completed? 
      // Let's assume standard behavior: Show Live in carousel, Upcoming in list.
    }

    setFilteredLiveMatches(live);
    setFilteredUpcomingMatches(upcoming);

  }, [allMatches, activeTab, activeFilter]);

  const loadData = async () => {
    try {
      const data = await MatchService.getMatches(undefined, 'MyScoreScreen');
      const mapped = data.map(mapMatchToCard);
      setAllMatches(mapped);

      // Extract unique venues for filters
      const venues = Array.from(new Set(data.map((m: any) => m.venue).filter(Boolean)));
      setVenueFilters(['All Matches', 'Live Now', ...venues as string[]]);

    } catch (e) {
      console.error(e);
    }
  };

  // Helper to map API Response -> UI Card format
  const mapMatchToCard = (m: any): MatchCardData => {
    const sport = m.sport || 'cricket';

    // Score Formatting
    let s1 = '0', s2 = '0', o1 = '', o2 = '';

    if (sport === 'cricket') {
      s1 = m.scoreA ? `${m.scoreA.runs}/${m.scoreA.wickets}` : '0/0';
      s2 = m.scoreB ? `${m.scoreB.runs}/${m.scoreB.wickets}` : '0/0';
      o1 = m.scoreA?.overs ? `(${m.scoreA.overs})` : '';
      o2 = m.scoreB?.overs ? `(${m.scoreB.overs})` : '';
    } else {
      // Kabaddi / Football: simple score numbers
      s1 = String(m.scoreA || 0);
      s2 = String(m.scoreB || 0);
      // Context (Halves/Time) could be mapped to 'overs' field for display reuse or separate
      if (sport === 'football') o1 = m.time || '00:00';
      if (sport === 'kabaddi') o1 = m.period || 'First Half';
    }

    return {
      id: m._id,
      league: m.series || (sport === 'cricket' ? 'TPL' : sport === 'kabaddi' ? 'PKL' : 'CFC'),
      sport,
      team1: { name: m.teamA.name, short: m.teamA.code, score: s1, overs: o1 },
      team2: { name: m.teamB.name, short: m.teamB.code, score: s2, overs: o2 },
      status: m.status,
      venue: m.venue || 'TPL Stadium',
      viewers: '1.2k', // Mock
      image: sport === 'football'
        ? 'https://images.unsplash.com/photo-1522778119026-d647f0565c6a?q=80&w=2000'
        : sport === 'kabaddi'
          ? 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?q=80&w=2000'
          : 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=2000',
      dateStr: new Date(m.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      videoUrl: m.liveStreamUrl || undefined,  // Only for LIVE cards
    };
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <AppHeader />

      {/* ── Video Player Modal ── */}
      {videoMatch && (
        <VideoPlayerModal
          visible={videoVisible}
          url={videoMatch.videoUrl || ''}
          title={`${videoMatch.team1.short} vs ${videoMatch.team2.short}`}
          subtitle={`${videoMatch.league} · ${videoMatch.venue}`}
          type="live"
          onClose={() => { setVideoVisible(false); setVideoMatch(null); }}
        />
      )}

      <View style={styles.mainContent}>
        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Sports Tabs (e.g. Cricket, Kabaddi) */}
          <SportTab activeTab={activeTab} onSelect={setActiveTab} />

          {/* Filter Bar (e.g. Location/Venue) */}
          <FilterBar
            filters={venueFilters}
            activeFilter={activeFilter}
            onSelect={setActiveFilter}
          />

          {filteredLiveMatches.length > 0 && (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Live Streaming</Text>
                <View style={styles.liveIndicator}>
                  <View style={styles.liveDotRed} />
                </View>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                snapToInterval={width * 0.9 + 15}
                decelerationRate="fast"
                contentContainerStyle={styles.carouselContent}
              >
                {filteredLiveMatches.map((match) => (
                  <FeatureMatchCard
                    key={match.id}
                    match={match}
                    onWatch={(m) => { setVideoMatch(m); setVideoVisible(true); }}
                  />
                ))}

              </ScrollView>
            </>
          )}

          <View style={styles.matchesHeader}>
            <Text style={styles.sectionTitle}>Upcoming Matches</Text>
            <TouchableOpacity><Text style={styles.seeAllText}>View All</Text></TouchableOpacity>
          </View>

          {filteredUpcomingMatches.length > 0 ? (
            filteredUpcomingMatches.map((match) => (
              <UpcomingCard key={match.id} match={match} />
            ))
          ) : (
            <Text style={{ textAlign: 'center', color: '#999', padding: 20 }}>No upcoming matches found</Text>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>
      </View>
    </View>
  );
}

// --- Sub Components ---

const SportTab = ({ activeTab, onSelect }: any) => (
  <View style={{ marginTop: 15, marginBottom: 20 }}>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
      {SPORTS_TABS.map((tab) => (
        <TouchableOpacity
          key={tab.id}
          onPress={() => onSelect(tab.id)}
          style={[styles.tabItem, activeTab === tab.id && styles.activeTabItem]}
        >
          <MaterialCommunityIcons
            name={tab.icon as any}
            size={20}
            color={activeTab === tab.id ? '#000' : '#999'}
            style={{ marginRight: 6 }}
          />
          <Text style={[styles.tabText, activeTab === tab.id && styles.activeTabText]}>
            {tab.name}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  </View>
);

const FilterBar = ({ filters, activeFilter, onSelect }: any) => (
  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer} contentContainerStyle={styles.filterContent}>
    {filters.map((filter: string, index: number) => (
      <TouchableOpacity
        key={index}
        onPress={() => onSelect(filter)}
        style={[styles.filterChip, activeFilter === filter && styles.activeFilterChip]}
      >
        <Text style={[styles.filterText, activeFilter === filter && styles.activeFilterText]}>
          {filter}
        </Text>
      </TouchableOpacity>
    ))}
  </ScrollView>
);

const FeatureMatchCard = ({ match, onWatch }: { match: MatchCardData; onWatch: (m: MatchCardData) => void }) => (
  <View style={styles.featuredSlide}>
    <View style={styles.featuredCard}>
      <ImageBackground
        source={{ uri: match.image }}
        style={styles.cardInfoContainer}
        imageStyle={{ borderRadius: 16 }}
      >
        <LinearGradient
          colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.8)']}
          style={styles.gradientOverlay}
        />

        <View style={styles.liveBadge}>
          <View style={styles.pulsingDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>

        <View style={styles.sportBadge}>
          <Text style={styles.sportText}>{match.sport}</Text>
        </View>

        <View style={styles.playButtonContainer}>
          <View style={styles.playButtonCircle}>
            <Ionicons name="play" size={32} color="#fff" style={{ marginLeft: 4 }} />
          </View>
        </View>

        <View style={styles.glassPanel}>
          <View style={styles.matchTeamsRow}>
            <Text style={styles.leagueNameSmall}>{match.league} • {match.venue}</Text>
          </View>

          <View style={styles.scoreRow}>
            <View style={styles.teamInfo}>
              <Text style={styles.teamAbbr}>{match.team1.short}</Text>
              <View style={styles.teamScoreBox}>
                <Text style={styles.scoreBig}>{match.team1.score}</Text>
                <Text style={styles.oversSmall}>{match.team1.overs}</Text>
              </View>
            </View>

            <Text style={styles.vsText}>VS</Text>

            <View style={styles.teamInfo}>
              <View style={styles.teamScoreBox}>
                <Text style={styles.scoreBig}>{match.team2.score}</Text>
                <Text style={styles.oversSmall}>{match.team2.overs}</Text>
              </View>
              <Text style={styles.teamAbbr}>{match.team2.short}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.watchButton}
            onPress={() => { if (match.videoUrl) onWatch(match); }}
          >
            <LinearGradient
              colors={match.videoUrl ? ['#E31C25', '#b01017'] : ['#555', '#333']}
              style={styles.watchButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Ionicons name="play-circle" size={14} color="#fff" style={{ marginRight: 4 }} />
              <Text style={styles.watchButtonText}>
                {match.videoUrl ? 'Watch Live' : 'Stream Pending'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

      </ImageBackground>
    </View>
  </View>
);

const UpcomingCard = ({ match }: { match: MatchCardData }) => (
  <View style={styles.upcomingCard}>
    <View style={styles.upcomingHeader}>
      <View style={styles.leagueBadge}>
        <Text style={styles.upcomingLeague}>{match.league} {match.sport !== 'cricket' && `• ${match.sport}`}</Text>
      </View>
      <View style={styles.timeBadge}>
        <Ionicons name="time-outline" size={12} color="#E31C25" />
        <Text style={styles.upcomingTime}>{match.dateStr}</Text>
      </View>
    </View>

    <View style={styles.upcomingTeams}>
      <View style={styles.upcomingTeam}>
        <View style={styles.smallLogo}><Text style={styles.smallLogoText}>{match.team1.short[0]}</Text></View>
        <Text style={styles.upcomingTeamName}>{match.team1.name}</Text>
      </View>
      <View style={styles.vsDivider}>
        <Text style={styles.upcomingVs}>VS</Text>
      </View>
      <View style={styles.upcomingTeam}>
        <Text style={[styles.upcomingTeamName, { textAlign: 'right' }]}>{match.team2.name}</Text>
        <View style={[styles.smallLogo, { backgroundColor: '#3a3a3a' }]}><Text style={styles.smallLogoText}>{match.team2.short[0]}</Text></View>
      </View>
    </View>

    <View style={styles.upcomingFooter}>
      <View style={styles.venueRow}>
        <Ionicons name="location-sharp" size={12} color="#666" />
        <Text style={styles.upcomingVenue}>{match.venue}</Text>
      </View>
      <TouchableOpacity style={styles.remindButton}>
        <Text style={styles.remindText}>Notify Me</Text>
        <Ionicons name="notifications-outline" size={14} color="#E31C25" />
      </TouchableOpacity>
    </View>
  </View>
);

// --- Styles ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  mainContent: { flex: 1, marginTop: 0 },
  tabContainer: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 20, marginTop: 15 },
  tabItem: { flexDirection: 'row', alignItems: 'center', marginRight: 20, paddingBottom: 8 },
  activeTabItem: { borderBottomWidth: 3, borderBottomColor: '#E31C25' },
  tabText: { color: '#999', fontSize: 16, fontWeight: '600', letterSpacing: 0.5 },
  activeTabText: { color: '#000', fontWeight: '800' },

  filterContainer: { marginBottom: 25 },
  filterContent: { paddingHorizontal: 20 },
  filterChip: { paddingHorizontal: 18, paddingVertical: 10, backgroundColor: '#F0F2F5', borderRadius: 30, marginRight: 10, borderWidth: 1, borderColor: '#E1E4E8' },
  activeFilterChip: { backgroundColor: '#E31C25', borderColor: '#E31C25', shadowColor: '#E31C25', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 6 },
  filterText: { color: '#666', fontSize: 13, fontWeight: '600' },
  activeFilterText: { color: '#fff', fontWeight: '700' },

  scrollContent: { paddingBottom: 80 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginLeft: 20, marginBottom: 15 },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: '#333', letterSpacing: 0.5 },
  liveIndicator: { marginLeft: 8, justifyContent: 'center', alignItems: 'center' },
  liveDotRed: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#E31C25' },
  carouselContent: { paddingHorizontal: 20, paddingBottom: 25 },

  featuredSlide: { width: width * 0.9, marginRight: 15 },
  featuredCard: { borderRadius: 20, elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.5, shadowRadius: 10, backgroundColor: '#1a1a1a', overflow: 'hidden', height: 240, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  cardInfoContainer: { flex: 1, justifyContent: 'space-between' },
  gradientOverlay: { ...StyleSheet.absoluteFillObject },

  liveBadge: { position: 'absolute', top: 15, left: 15, flexDirection: 'row', alignItems: 'center', backgroundColor: '#E31C25', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  pulsingDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff', marginRight: 6 },
  liveText: { color: '#fff', fontSize: 10, fontWeight: '900', letterSpacing: 1 },

  sportBadge: { position: 'absolute', top: 15, right: 15, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  sportText: { color: '#fff', fontSize: 10, fontWeight: '600', textTransform: 'capitalize' },

  playButtonContainer: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, justifyContent: 'center', alignItems: 'center' },
  playButtonCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(227, 28, 37, 0.9)', justifyContent: 'center', alignItems: 'center', shadowColor: '#E31C25', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 20, elevation: 10, borderWidth: 2, borderColor: '#fff' },

  glassPanel: { marginTop: 'auto', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.15)', backgroundColor: 'rgba(0,0,0,0.75)', padding: 15 },
  matchTeamsRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 8 },
  leagueNameSmall: { color: '#ccc', fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
  scoreRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  teamInfo: { flexDirection: 'row', alignItems: 'center' },
  teamAbbr: { color: '#fff', fontSize: 16, fontWeight: '800', marginHorizontal: 8 },
  teamScoreBox: { alignItems: 'center' },
  scoreBig: { color: '#fff', fontSize: 18, fontWeight: '900' },
  oversSmall: { color: '#aaa', fontSize: 10, fontWeight: '600' },
  vsText: { color: '#666', fontSize: 12, fontWeight: '900', fontStyle: 'italic' },

  watchButton: { borderRadius: 20, overflow: 'hidden', marginTop: 5, alignSelf: 'stretch' },
  watchButtonGradient: { flexDirection: 'row', paddingVertical: 10, alignItems: 'center', justifyContent: 'center' },
  watchButtonText: { color: '#fff', fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },

  matchesHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingRight: 20, marginBottom: 15, paddingLeft: 20 },
  seeAllText: { color: '#E31C25', fontSize: 14, fontWeight: '600' },

  upcomingCard: {
    marginHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4
  },
  upcomingHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 18 },
  leagueBadge: { backgroundColor: 'rgba(0,0,0,0.04)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  upcomingLeague: { color: '#555', fontSize: 11, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' },
  timeBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(227, 28, 37, 0.08)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  upcomingTime: { color: '#E31C25', fontSize: 12, fontWeight: '700', marginLeft: 5 },

  upcomingTeams: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  upcomingTeam: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  smallLogo: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#eee', marginHorizontal: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  smallLogoText: { color: '#333', fontSize: 16, fontWeight: '800' },
  upcomingTeamName: { color: '#222', fontSize: 16, fontWeight: '700', flex: 1, letterSpacing: 0.3 },
  vsDivider: { width: 30, alignItems: 'center' },
  upcomingVs: { color: '#E31C25', fontSize: 14, fontWeight: '900', fontStyle: 'italic' },

  upcomingFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 16, borderTopWidth: 1, borderTopColor: '#f5f5f5' },
  venueRow: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  upcomingVenue: { color: '#666', fontSize: 12, marginLeft: 6, fontWeight: '600' },
  remindButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#eee' },
  remindText: { color: '#E31C25', fontSize: 12, fontWeight: '700', marginRight: 6 },
});
