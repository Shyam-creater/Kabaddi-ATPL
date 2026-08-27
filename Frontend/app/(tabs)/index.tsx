import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
  RefreshControl,
  ImageBackground,
  Platform,
  Modal,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import AppHeader from '../../components/common/AppHeader';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, {
  FadeInDown,
  FadeInRight,
  FadeIn,
  ZoomIn,
  ZoomOut,
  SlideInLeft,
  SlideInRight,
  FadeInUp,
  SlideInDown,
  SlideInUp,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withRepeat,
  withSequence,
  Easing
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { useScrollToTop } from '@react-navigation/native';
import MatchService, { Match } from '../../services/matchService';
import socketService from '../../services/socketService';
import api, { userService } from '../../services/api';
import LiveMatchCard from '../../components/match/LiveMatchCard';
import DetailedMatchCard from '../../components/match/DetailedMatchCard';
import VideoPlayerModal from '../../components/common/VideoPlayerModal';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { updateFollowStatus, fetchProfile } from '../../features/auth/authSlice';

const { width, height } = Dimensions.get('window');

// --- Premium Quick Actions with MaterialCommunityIcons ---
const QUICK_ACTIONS = [
  { id: '1', name: 'Schedule', icon: 'calendar-month', color: '#4A90E2', route: '/matches' },
  { id: '2', name: 'Teams', icon: 'shield-star', color: '#E31C25', route: '/teams' },
  { id: '3', name: 'Registration', icon: 'trophy-award', color: '#F5A623', route: '/tournament' },
  { id: '4', name: 'Stats', icon: 'chart-timeline-variant', color: '#7ED321', route: '/profile/stats' },
  { id: '5', name: 'Table', icon: 'table', color: '#4CAF50', route: '/points-table' },
  { id: '6', name: 'Auction', icon: 'gavel', color: '#FFD700', route: '/auction' },
  { id: '7', name: 'Gallery', icon: 'image-multiple', color: '#FF4081', route: '/gallery' },
  { id: '8', name: 'More', icon: 'dots-grid', color: '#607D8B', route: '/more' },
];

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

export default function HomeScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user: currentUser } = useAppSelector(state => state.auth);
  const [refreshing, setRefreshing] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  useScrollToTop(scrollRef);

  // Story State
  const [selectedStory, setSelectedStory] = useState<any>(null);
  const [storyProgress, setStoryProgress] = useState(0);
  const videoRef = useRef<Video>(null);

  useEffect(() => {
    let interval: any;
    if (selectedStory && selectedStory.type !== 'video') {
      setStoryProgress(0);
      const DURATION = 5000;
      const UPDATE_FREQ = 100;
      let elapsed = 0;

      interval = setInterval(() => {
        elapsed += UPDATE_FREQ;
        setStoryProgress((elapsed / DURATION) * 100);
        if (elapsed >= DURATION) {
          setSelectedStory(null);
        }
      }, UPDATE_FREQ);
    }
    return () => clearInterval(interval);
  }, [selectedStory]);

  // Real-time Match State
  const [liveMatches, setLiveMatches] = useState<Match[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(true);

  // Dynamic Content State
  const [trendingPlayers, setTrendingPlayers] = useState<any[]>([]);
  const [sponsors, setSponsors] = useState<any[]>([]);
  const [activePoll, setActivePoll] = useState<any>(null);
  const [latestNews, setLatestNews] = useState<any[]>([]);
  const [quotesData, setQuotesData] = useState<any[]>([]);
  const [highlightsData, setHighlightsData] = useState<any[]>([]);
  const [adData, setAdData] = useState<any>(null);
  const [socialData, setSocialData] = useState<any[]>([]);
  const [triviaData, setTriviaData] = useState<any[]>([]);
  const [activeBanner, setActiveBanner] = useState<any>(null);
  const [bannerVisible, setBannerVisible] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [blogsData, setBlogsData] = useState<any[]>([]);

  // Cycling indices for quotes and trivia
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [triviaIndex, setTriviaIndex] = useState(0);

  // Featured video player state
  const [featuredVideoVisible, setFeaturedVideoVisible] = useState(false);
  const [featuredVideo, setFeaturedVideo] = useState<any>(null);

  // Highlight video modal state
  const [highlightVideoVisible, setHighlightVideoVisible] = useState(false);
  const [selectedHighlightVideo, setSelectedHighlightVideo] = useState<any>(null);

  const [storeProducts, setStoreProducts] = useState<any[]>([]);
  const [cricketProfiles, setCricketProfiles] = useState<any[]>([]);
  const [kabaddiProfiles, setKabaddiProfiles] = useState<any[]>([]);
  const [footballProfiles, setFootballProfiles] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('Kabaddi');
  const [topBatsmen, setTopBatsmen] = useState<any[]>([]);
  const [topBowlers, setTopBowlers] = useState<any[]>([]);
  const [topFootballers, setTopFootballers] = useState<any[]>([]);
  const [leaderboardTab, setLeaderboardTab] = useState<'runs' | 'wickets' | 'goals'>('runs');
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(true);
  const [topHighScores, setTopHighScores] = useState<any[]>([]);
  const [topTeams, setTopTeams] = useState<any[]>([]);
  const [hubTab, setHubTab] = useState<'players' | 'teams'>('players');
  const [loadingHub, setLoadingHub] = useState(true);

  const normalizeLeaderboardStat = (p: any, tab: 'runs' | 'wickets' | 'goals') => {
    if (!p) return 0;
    if (tab === 'goals') return p.goals ?? p.value ?? 0;
    const v = tab === 'runs' ? (p.runs ?? p.totalRuns ?? p.totalRun ?? p.value ?? p.statValue) : (p.wickets ?? p.totalWickets ?? p.totalWicket ?? p.value ?? p.statValue);
    const n = typeof v === 'number' ? v : Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  const getRankTeamCode = (p: any) => {
    return p?.team?.code || p?.teamCode || p?.teamName || p?.franchise?.code || p?.franchise?.name || 'Free Agent';
  };

  const getRankAvatarUri = (p: any) => {
    return p?.image || p?.profilePicture || 'https://via.placeholder.com/150';
  };

  const topList = (leaderboardTab === 'runs' ? topBatsmen : leaderboardTab === 'wickets' ? topBowlers : topFootballers);
  const displayedTopPlayers = Array.isArray(topList) ? topList : [];

  useEffect(() => {
    if (!activeBanner) return;
    setBannerVisible(true);
  }, [activeBanner]);

  // Auto-cycle quotes every 10 seconds
  useEffect(() => {
    if (quotesData.length <= 1) return;
    const interval = setInterval(() => {
      setQuoteIndex(prev => (prev + 1) % quotesData.length);
    }, 10000);
    return () => clearInterval(interval);
  }, [quotesData]);

  // Auto-cycle trivia every 15 seconds
  useEffect(() => {
    if (triviaData.length <= 1) return;
    const interval = setInterval(() => {
      setTriviaIndex(prev => (prev + 1) % triviaData.length);
    }, 15000);
    return () => clearInterval(interval);
  }, [triviaData]);

  useEffect(() => {
    const fetchAllSuggested = async () => {
      try {
        const kabaddi = await userService.getSuggestedCricketers('Kabaddi');
        const profilesList = kabaddi?.data?.data || (Array.isArray(kabaddi?.data) ? kabaddi.data : []);
        setKabaddiProfiles(profilesList);
      } catch (error) {
        console.error('Failed to fetch suggested profiles', error);
      }
    };
    fetchAllSuggested();
  }, []);

  // Fetch Data (Team Member's Updated Logic)
  const fetchData = async () => {
    setLoadingMatches(true);

    // 1. Fetch Matches (LIVE + recent COMPLETED, or fall back to UPCOMING)
    try {
      const allMatches = await MatchService.getMatches(undefined, 'HomeScreen');
      const live = allMatches.filter((m: Match) => m.status === 'LIVE');
      const completed = allMatches.filter((m: Match) => m.status === 'COMPLETED').slice(0, 3);
      const upcoming = allMatches.filter((m: Match) => m.status === 'UPCOMING').slice(0, 3);
      
      let merged = [...live, ...completed];
      if (merged.length === 0) {
        merged = upcoming;
      }
      setLiveMatches(merged);
    } catch (e) {
      console.warn('Matches fetch failed:', e);
    }

    // 2. Fetch Content (Individual try-catches to be resilient)
    const fetchItem = async (url: string, setter: (val: any) => void) => {
      try {
        const res = await api.get(url);
        const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        setter(data);
        return data;
      } catch (e) {
        console.warn(`Fetch failed for ${url}:`, e);
        return [];
      }
    };

    fetchItem('/content/trending-players', setTrendingPlayers);
    fetchItem('/content/partners', setSponsors);
    fetchItem('/content/news', setLatestNews);
    fetchItem('/content/quotes', (data) => {
      setQuotesData(data);
      setQuoteIndex(0);
    });
    fetchItem('/content/highlights', (data) => {
      setHighlightsData(data);
      if (data.length > 0) {
        const featured = data.find((h: any) => h.videoUrl) || null;
        setFeaturedVideo(featured);
      }
    });
    fetchItem('/content/ads', (data) => {
      if (data.length > 0) setAdData(data.find((a: any) => a.active) || data[0]);
    });
    fetchItem('/content/social', setSocialData);
    fetchItem('/content/trivia', (data) => {
      setTriviaData(data);
      setTriviaIndex(0);
    });
    fetchItem('/content/banners?active=true', (data) => {
      if (data.length > 0) setActiveBanner(data[0]);
    });
    fetchItem('/content/polls', (data) => {
      const active = data.find((p: any) => p.active) || data[0] || null;
      setActivePoll(active);
    });
    fetchItem('/products', (data) => {
      setStoreProducts(data.slice(0, 8));
    });
    fetchItem('/content/blogs', setBlogsData);

    // Fetch top scorers, wicket takers & footballers for Home Leaderboard
    try {
      setLoadingLeaderboard(true);
      const [batRes, bowlRes, ftRes] = await Promise.all([
        api.get('/players?top=batsman'),
        api.get('/players?top=bowler'),
        api.get('/user/list?sport=Football')
      ]);
      setTopBatsmen(Array.isArray(batRes.data) ? batRes.data.slice(0, 5) : []);
      setTopBowlers(Array.isArray(bowlRes.data) ? bowlRes.data.slice(0, 5) : []);
      
      if (ftRes.data?.success) {
        const ftUsers = Array.isArray(ftRes.data.data) ? ftRes.data.data : [];
        const sortedFt = ftUsers
          .filter((u: any) => u.playerProfile?.football?.careerSummary?.totalGoals !== undefined)
          .sort((a: any, b: any) => {
            const ga = a.playerProfile?.football?.careerSummary?.totalGoals || 0;
            const gb = b.playerProfile?.football?.careerSummary?.totalGoals || 0;
            return gb - ga;
          })
          .map((u: any) => ({
            _id: u._id,
            name: u.name,
            image: u.profilePicture,
            team: u.playerProfile?.football?.currentTeam || 'Free Agent',
            goals: u.playerProfile?.football?.careerSummary?.totalGoals || 0,
            value: u.playerProfile?.football?.careerSummary?.totalGoals || 0
          }));
        setTopFootballers(sortedFt.slice(0, 5));
      }
    } catch (e) {
      console.warn('Leaderboard fetch failed:', e);
    } finally {
      setLoadingLeaderboard(false);
    }

    // Fetch Top High Scores and Top Teams for Hub
    try {
      setLoadingHub(true);
      const [ckUsersRes, teamsRes] = await Promise.all([
        api.get('/user/list?sport=Cricket'),
        api.get('/teams')
      ]);

      if (ckUsersRes.data?.success) {
        const ckUsers = Array.isArray(ckUsersRes.data.data) ? ckUsersRes.data.data : [];
        const sortedByHighScore = ckUsers
          .filter((u: any) => u.playerProfile?.cricket?.careerSummary?.highestScore !== undefined)
          .sort((a: any, b: any) => {
            const ha = a.playerProfile?.cricket?.careerSummary?.highestScore || 0;
            const hb = b.playerProfile?.cricket?.careerSummary?.highestScore || 0;
            return hb - ha;
          })
          .map((u: any) => ({
            _id: u._id,
            name: u.name,
            image: u.profilePicture,
            team: u.playerProfile?.cricket?.currentTeam || 'Free Agent',
            highScore: u.playerProfile?.cricket?.careerSummary?.highestScore || 0
          }));
        setTopHighScores(sortedByHighScore.slice(0, 5));
      }

      const allTeamsList = Array.isArray(teamsRes.data) ? teamsRes.data : [];
      const sortedTeams = allTeamsList
        .sort((a: any, b: any) => (b.points || 0) - (a.points || 0));
      setTopTeams(sortedTeams.slice(0, 5));

    } catch (e) {
      console.warn('Performance Hub fetch failed:', e);
    } finally {
      setLoadingHub(false);
    }

    setLoadingMatches(false);
  };

  useEffect(() => {
    fetchData();

    const handleMatchUpdate = (updatedMatch: Match) => {
      setLiveMatches(prev => {
        const index = prev.findIndex(m => m._id === updatedMatch._id);
        if (index !== -1) {
          const newMatches = [...prev];
          newMatches[index] = updatedMatch;
          return newMatches;
        }
        return prev;
      });
    };

    socketService.onMatchUpdate(handleMatchUpdate);

    return () => {
      socketService.removeListener('match:update', handleMatchUpdate);
    };
  }, []);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchData().then(() => setRefreshing(false));
  }, []);

  useEffect(() => {
    if (currentUser) {
      dispatch(fetchProfile());
    }
  }, []);

  // Poll Logic
  const [voted, setVoted] = useState<string | null>(null);
  const pollWidthA = useSharedValue(0);
  const pollWidthB = useSharedValue(0);

  useEffect(() => {
    if (activePoll) {
      const total = (activePoll.votesA || 0) + (activePoll.votesB || 0);
      if (total > 0) {
        pollWidthA.value = withTiming(((activePoll.votesA || 0) / total) * 100, { duration: 1000 });
        pollWidthB.value = withTiming(((activePoll.votesB || 0) / total) * 100, { duration: 1000 });
      } else {
        pollWidthA.value = 50;
        pollWidthB.value = 50;
      }
    }
  }, [activePoll]);

  const handleVote = async (team: 'A' | 'B') => {
    if (voted || !activePoll) return;
    try {
      await api.post(`/content/polls/${activePoll._id}/vote`, { option: team });
      setVoted(team);
      const newVotesA = team === 'A' ? (activePoll.votesA || 0) + 1 : (activePoll.votesA || 0);
      const newVotesB = team === 'B' ? (activePoll.votesB || 0) + 1 : (activePoll.votesB || 0);
      const total = newVotesA + newVotesB;

      pollWidthA.value = withTiming((newVotesA / total) * 100, { duration: 1000 });
      pollWidthB.value = withTiming((newVotesB / total) * 100, { duration: 1000 });
    } catch (error) {
      alert('Failed to vote');
    }
  };
  const animatedStyleA = useAnimatedStyle(() => ({ width: `${pollWidthA.value}%` }));
  const animatedStyleB = useAnimatedStyle(() => ({ width: `${pollWidthB.value}%` }));

  // Team Member's Improved Follow System Logic
  const [followLoading, setFollowLoading] = useState<string | null>(null);

  const getFollowStatus = (userId: string): 'none' | 'pending' | 'accepted' | 'rejected' => {
    if (!currentUser || !currentUser.following) return 'none';
    const followEntry = currentUser.following.find((f: any) => {
      const id = typeof f === 'string' ? f : (f.user?._id || f.user);
      return id === userId;
    });
    return followEntry ? followEntry.status : 'none';
  };

  const handleFollowAction = async (userId: string) => {
    if (!userId || !currentUser) {
      if (!currentUser) Alert.alert('Info', 'Please login to follow users');
      return;
    }
    if (userId === currentUser?._id) {
      Alert.alert('Info', 'You cannot follow yourself');
      return;
    }

    const currentStatus = getFollowStatus(userId);
    setFollowLoading(userId);

    try {
      if (currentStatus === 'none' || currentStatus === 'rejected') {
        dispatch(updateFollowStatus({ userId, status: 'pending' }));
        await userService.followUser(userId);
        Alert.alert('Success', 'Follow request sent');
      }
      else if (currentStatus === 'pending') {
        dispatch(updateFollowStatus({ userId, status: 'none' }));
        await userService.unfollowUser(userId);
        Alert.alert('Cancelled', 'Follow request cancelled');
      }
      else if (currentStatus === 'accepted') {
        Alert.alert('Unfollow', 'Are you sure you want to unfollow?', [
          { text: 'Cancel', style: 'cancel', onPress: () => setFollowLoading(null) },
          {
            text: 'Unfollow',
            style: 'destructive',
            onPress: async () => {
              try {
                setFollowLoading(userId);
                dispatch(updateFollowStatus({ userId, status: 'none' }));
                await userService.unfollowUser(userId);
              } catch (error) {
                console.error('Unfollow failed', error);
                dispatch(updateFollowStatus({ userId, status: 'accepted' }));
                Alert.alert('Error', 'Failed to unfollow');
              } finally {
                setFollowLoading(null);
              }
            }
          }
        ]);
        return;
      }
    } catch (error: any) {
      console.error('Follow action failed', error);
      dispatch(updateFollowStatus({ userId, status: currentStatus }));
      const errorMsg = error.response?.data?.message || 'Failed to update follow status';
      if (errorMsg === "Already following or requested") {
        dispatch(updateFollowStatus({ userId, status: 'pending' }));
      } else {
        Alert.alert('Error', errorMsg);
      }
    } finally {
      if (currentStatus !== 'accepted') {
        setFollowLoading(null);
      }
    }
  };


  return (
    <View style={styles.container}>

      <AppHeader />

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#E31C25" />}
      >
        {/* --- PROFILE COMPLETION ALERT --- */}
        {currentUser && (
          (!currentUser.profilePicture || !currentUser.city || !currentUser.role || !currentUser.sports || currentUser.sports.length === 0) && (
            <Animated.View
              entering={FadeInDown.delay(200).duration(800)}
              style={styles.profileAlertBanner}
            >
              <LinearGradient
                colors={['#E31C25', '#900C12']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.profileAlertGradient}
              >
                <View style={styles.profileAlertContent}>
                  <View style={styles.profileAlertIconBg}>
                    <MaterialCommunityIcons name="account-check" size={22} color="#f2b706ff" />
                  </View>
                  <View style={styles.profileAlertTextContainer}>
                    <View style={styles.profileProgressRow}>
                      <Text style={styles.profileAlertTitle}>Complete Your Profile</Text>
                    </View>
                    <Text style={styles.profileAlertDesc}>Boost your visibility by 80%</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.profileAlertBtn}
                    onPress={() => router.push('/profile/edit')}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.profileAlertBtnText}>Set Up</Text>
                    <Ionicons name="chevron-forward" size={16} color="#E31C25" />
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </Animated.View>
          )
        )}

        {/* --- 0. PREMIUM PROMOTION BANNER --- */}
        {activeBanner && bannerVisible && (
          <Animated.View entering={FadeInDown.duration(800).springify().damping(14)} style={styles.notificationBannerContainer}>
            <ImageBackground
              source={{ uri: activeBanner?.image }}
              style={styles.bannerImageBg}
              imageStyle={{ borderRadius: 24 }}
              resizeMode="stretch"
            >
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.85)']}
                locations={[0.5, 1]}
                style={styles.bannerGradient}
              >
                <View style={{ flex: 1, padding: 12 }}>
                  <View style={styles.bannerHeader}>
                    <Animated.View entering={FadeInDown.delay(300).springify()}>
                      <LinearGradient
                        colors={['#FFD700', '#FFA000']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.notificationBadge}
                      >
                        <MaterialCommunityIcons name="star-shooting" size={14} color="#1A1A1A" style={{ marginRight: 4 }} />
                        <Text style={styles.notificationBadgeText}>PREMIUM EXCLUSIVE</Text>
                      </LinearGradient>
                    </Animated.View>

                    <TouchableOpacity
                      onPress={() => setBannerVisible(false)}
                      style={styles.bannerCloseBtn}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="close" size={18} color="#fff" />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.bannerContent}>
                    <Animated.View entering={FadeInRight.delay(200).springify()}>
                      <Text style={styles.bannerTitle}>{activeBanner?.title}</Text>
                    </Animated.View>

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                      <Animated.View entering={FadeInRight.delay(300).springify()} style={{ flex: 1 }}>
                        <Text style={styles.bannerSubtitle}>{activeBanner?.text}</Text>
                      </Animated.View>

                      <Animated.View entering={FadeInDown.delay(500).springify()}>
                        <TouchableOpacity
                          style={styles.bannerActionBtn}
                          onPress={() => {
                            setBannerVisible(false);
                            const link = activeBanner?.link || '/tournament';
                            if (link.startsWith('http')) Linking.openURL(link);
                            else router.push(link as any);
                          }}
                          activeOpacity={0.85}
                        >
                          <LinearGradient
                            colors={['#E31C25', '#FF4081']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.bannerActionGradient}
                          >
                            <Text style={styles.bannerActionText}>Join Now</Text>
                            <View style={styles.actionIconWrapper}>
                              <Ionicons name="arrow-forward" size={14} color="#E31C25" />
                            </View>
                          </LinearGradient>
                        </TouchableOpacity>
                      </Animated.View>
                    </View>
                  </View>
                </View>
              </LinearGradient>
            </ImageBackground>
          </Animated.View>
        )}

        {/* ── FULL-SCREEN IMMERSIVE POPUP ── */}
        <Modal
          visible={modalVisible}
          transparent={false}
          animationType="slide"
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.fullscreenContainer}>
            <ImageBackground
              source={{ uri: activeBanner?.image }}
              style={styles.fullscreenBg}
              resizeMode="contain"
              imageStyle={{ backgroundColor: '#000' }}
            >
              <LinearGradient
                colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.85)']}
                locations={[0, 0.5, 1]}
                style={styles.fullscreenGradient}
              >
                <TouchableOpacity
                  onPress={() => setModalVisible(false)}
                  style={styles.fullscreenClose}
                >
                  <Ionicons name="close" size={28} color="#fff" />
                </TouchableOpacity>

                <View style={styles.fullscreenContent}>
                  <View style={styles.exclusiveBadge}>
                    <MaterialCommunityIcons name="crown" size={14} color="#FFD700" />
                    <Text style={styles.exclusiveText}>EXCLUSIVE EVENT</Text>
                  </View>

                  <Text style={styles.fullscreenTitle}>{activeBanner?.title}</Text>

                  {activeBanner?.text && (
                    <Text style={styles.fullscreenDesc}>{activeBanner?.text}</Text>
                  )}

                  <TouchableOpacity
                    style={styles.fullscreenBtn}
                    onPress={() => {
                      setModalVisible(false);
                      const link = activeBanner?.link || '/tournament';
                      if (link.startsWith('http')) Linking.openURL(link);
                      else router.push(link as any);
                    }}
                  >
                    <Text style={styles.fullscreenBtnText}>Register Tournament</Text>
                    <Ionicons name="arrow-forward" size={20} color="#fff" />
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </ImageBackground>
          </View>
        </Modal>

        {/* --- 1. HERO CAROUSEL (Live & Recent Matches) --- */}
        <Animated.View entering={FadeInDown.delay(50).duration(500)} style={styles.horizontalSectionContainer}>
          <TouchableOpacity 
            activeOpacity={0.95}
            style={[styles.titleCard, { marginHorizontal: 16, marginBottom: 10 }]}
            onPress={() => router.push('/matches')}
          >
            <View style={styles.titleCardLeft}>
              <LinearGradient
                colors={['#E31C25', '#FF4081']}
                style={styles.titleIconContainer}
              >
                <Ionicons name="flame" size={16} color="#fff" />
              </LinearGradient>
              <View style={styles.titleCardTextContainer}>
                <Text style={styles.titleCardTitle}>Match Center</Text>
                <Text style={styles.titleCardSubtitle}>Live & Completed Matches</Text>
              </View>
            </View>
            <View style={styles.titleCardRight}>
              <View style={styles.liveIndicatorBadge}>
                <View style={styles.liveIndicatorDot} />
                <Text style={styles.liveIndicatorText}>LIVE</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#888" />
            </View>
          </TouchableOpacity>

          <View style={styles.carouselContainer}>
            <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={styles.carouselScroll}>
              {liveMatches.length > 0 ? (
                liveMatches.map((match) => (
                  <View key={match._id} style={{ width: width - 30, marginRight: 15 }}>
                    <LiveMatchCard
                      match={match}
                      onPress={() => router.push(`/matches/details/${match._id}` as any)}
                    />
                  </View>
                ))
              ) : (
                <View style={[styles.heroSlide, { justifyContent: 'center', alignItems: 'center' }]}>
                  <LinearGradient colors={['#1a1a2e', '#16213e']} style={styles.emptyMatchCard}>
                    <MaterialCommunityIcons name="cricket" size={50} color="rgba(255,255,255,0.3)" />
                    <Text style={styles.emptyMatchText}>No Live Matches</Text>
                    <Text style={styles.emptyMatchSubtext}>Check schedule for upcoming games</Text>
                  </LinearGradient>
                </View>
              )}
            </ScrollView>
          </View>
        </Animated.View>

        {/* --- DETAILED MATCH SCOREBOARD SECTION --- */}
        {liveMatches.length > 0 && (
          <Animated.View entering={FadeInDown.delay(150).duration(600)} style={styles.sectionContainer}>
            <View style={styles.titleCard}>
              <View style={styles.titleCardLeft}>
                <LinearGradient
                  colors={liveMatches[0].status === 'LIVE' ? ['#E31C25', '#FF4081'] : ['#4A90E2', '#357ABD']}
                  style={styles.titleIconContainer}
                >
                  <MaterialCommunityIcons 
                    name={liveMatches[0].status === 'LIVE' ? 'pulse' : 'cricket'} 
                    size={16} 
                    color="#fff" 
                  />
                </LinearGradient>
                <View style={styles.titleCardTextContainer}>
                  <Text style={styles.titleCardTitle}>
                    {liveMatches[0].status === 'LIVE' ? 'Live Match Center' : 'Featured Match'}
                  </Text>
                  <Text style={styles.titleCardSubtitle}>Real-time scoreboard details</Text>
                </View>
              </View>
            </View>
            <DetailedMatchCard
              match={liveMatches[0]}
              onPress={() => router.push(`/matches/details/${liveMatches[0]._id}` as any)}
            />
          </Animated.View>
        )}

        {/* --- 2. QUICK ACTIONS GRID (PREMIUM) --- */}
        <Animated.View entering={FadeInDown.delay(100).duration(500).springify().damping(12)} style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionTitleWrapper}>
              <View style={[styles.premiumHeaderBar, { backgroundColor: '#E31C25' }]} />
              <MaterialCommunityIcons name="compass-outline" size={22} color="#E31C25" style={{ marginRight: 6 }} />
              <Text style={styles.sectionHeaderTitle}>Start Exploring</Text>
            </View>
          </View>
          <View style={styles.gridContainer}>
            {QUICK_ACTIONS.map((action, index) => (
              <Animated.View
                key={action.id}
                entering={FadeInDown.delay(200 + index * 50).springify()}
              >
                <TouchableOpacity
                  style={styles.gridItem}
                  onPress={() => router.push(action.route as any)}
                  activeOpacity={0.7}
                >
                  <View style={styles.gridIconCard}>
                    <LinearGradient
                      colors={[action.color, `${action.color}dd`]}
                      style={styles.gridIconCircle}
                    >
                      <MaterialCommunityIcons name={action.icon as any} size={22} color="#fff" />
                    </LinearGradient>
                  </View>
                  <Text style={styles.gridLabel}>{action.name}</Text>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        </Animated.View>

        {/* --- 3. TRENDING STARS (Premium Stories) --- */}
        <Animated.View entering={FadeInDown.delay(300).duration(500).springify()} style={styles.trendingContainer}>
          <View style={[styles.sectionHeader, { paddingRight: 16 }]}>
            <View style={styles.sectionTitleRow}>
              <View style={[styles.premiumHeaderBar, { backgroundColor: '#FF9800' }]} />
              <Ionicons name="star-outline" size={22} color="#FF9800" style={{ marginRight: 6 }} />
              <Text style={styles.sectionTitle}>Trending Stars</Text>
            </View>
            <TouchableOpacity>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.trendingScroll} contentContainerStyle={{ paddingRight: 20 }}>
            {trendingPlayers.map((player, index) => (
              <Animated.View key={player._id} entering={FadeInRight.delay(index * 100)}>
                <View style={styles.playerCard}>
                  <TouchableOpacity
                    style={styles.playerAvatarContainer}
                    onPress={() => setSelectedStory(player)}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={player.type === 'video' ? ['#E31C25', '#FF4081'] : ['#FF9800', '#FFD700']}
                      style={styles.storyRingGradient}
                    >
                      <View style={styles.storyRingInner}>
                        <Image source={{ uri: player.image }} style={styles.playerAvatar} />
                      </View>
                    </LinearGradient>

                    {player.type === 'video' && (
                      <View style={styles.storyVideoIcon}>
                        <Ionicons name="play" size={10} color="#fff" />
                      </View>
                    )}
                  </TouchableOpacity>
                  <Text style={styles.playerName} numberOfLines={1}>{player.name}</Text>
                  <View style={styles.playerRoleBadge}>
                    <Text style={styles.playerRole}>{player.role}</Text>
                  </View>
                </View>
              </Animated.View>
            ))}
          </ScrollView>
        </Animated.View>

        {/* --- 4. KABADDI PROFILES SECTION (Attack Version Cards) --- */}
        <RenderProfileSection
          title="Kabaddi Professionals"
          profiles={kabaddiProfiles}
          color="#FF9800"
          delay={400}
          onFollow={handleFollowAction}
        />

        {/* --- 4. FAN POLL (Premium Design) --- */}
        {activePoll && (
          <Animated.View entering={FadeInDown.delay(400).duration(500).springify()} style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <View style={[styles.premiumHeaderBar, { backgroundColor: '#E31C25' }]} />
                <MaterialCommunityIcons name="poll" size={22} color="#E31C25" style={{ marginRight: 6 }} />
                <Text style={styles.sectionTitle}>Fan Pulse</Text>
                <View style={styles.liveBadge}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveText}>LIVE</Text>
                </View>
              </View>
            </View>
            <LinearGradient colors={['#fff', '#FAFAFA']} style={styles.pollCard}>
              <Text style={styles.pollQuestion}>{activePoll.question}</Text>

              <TouchableOpacity onPress={() => handleVote('A')} disabled={!!voted} style={styles.pollOptionBtn}>
                <View style={styles.pollBarBg}>
                  {(voted || (activePoll.votesA + activePoll.votesB) > 0) && (
                    <Animated.View style={[styles.pollFill, { backgroundColor: '#FF9933' }, animatedStyleA]} />
                  )}
                  <View style={styles.pollContent}>
                    <Text style={styles.pollText}>{activePoll.optionA}</Text>
                    {(voted || (activePoll.votesA + activePoll.votesB) > 0) && (
                      <Text style={styles.pollPercent}>{Math.round(pollWidthA.value)}%</Text>
                    )}
                  </View>
                </View>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => handleVote('B')} disabled={!!voted} style={styles.pollOptionBtn}>
                <View style={styles.pollBarBg}>
                  {(voted || (activePoll.votesA + activePoll.votesB) > 0) && (
                    <Animated.View style={[styles.pollFill, { backgroundColor: '#006400' }, animatedStyleB]} />
                  )}
                  <View style={styles.pollContent}>
                    <Text style={styles.pollText}>{activePoll.optionB}</Text>
                    {(voted || (activePoll.votesA + activePoll.votesB) > 0) && (
                      <Text style={styles.pollPercent}>{Math.round(pollWidthB.value)}%</Text>
                    )}
                  </View>
                </View>
              </TouchableOpacity>

              {!voted && (
                <View style={styles.pollHintRow}>
                  <MaterialCommunityIcons name="gesture-tap" size={16} color="#999" />
                  <Text style={styles.pollHint}>Tap to vote</Text>
                </View>
              )}
            </LinearGradient>
          </Animated.View>
        )}

        {/* --- 5. LATEST NEWS (Premium Headlines) --- */}
        <Animated.View entering={FadeInDown.delay(500).duration(500).springify()} style={styles.newsSectionContainer}>
          <View style={[styles.sectionHeader, { paddingHorizontal: 16 }]}>
            <View style={styles.sectionTitleRow}>
              <View style={[styles.premiumHeaderBar, { backgroundColor: '#1976D2' }]} />
              <Ionicons name="newspaper-outline" size={22} color="#1976D2" style={{ marginRight: 6 }} />
              <Text style={styles.sectionTitle}>Top Headlines</Text>
            </View>
            <TouchableOpacity>
              <Text style={styles.seeAll}>View All</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.newsScrollContent}>
            {latestNews.map((news, index) => (
              <Animated.View key={news._id} entering={FadeInRight.delay(index * 100)}>
                <TouchableOpacity
                  style={styles.newsCardHorizontal}
                  onPress={() => {
                    if (news.link) Linking.openURL(news.link);
                  }}
                  activeOpacity={0.85}
                >
                  <Image source={{ uri: news.image }} style={styles.newsThumbHorizontal} />
                  <LinearGradient colors={['transparent', 'rgba(0,0,0,0.9)']} style={styles.newsOverlay}>
                    <View style={styles.newsCategoryBadge}>
                      <Text style={styles.newsCategory}>{news.category}</Text>
                    </View>
                    <Text style={styles.newsHeadline} numberOfLines={2}>{news.title}</Text>
                    <View style={styles.newsTimeRow}>
                      <Ionicons name="time-outline" size={12} color="rgba(255,255,255,0.7)" />
                      <Text style={styles.newsTime}>{news.time || new Date(news.createdAt).toLocaleDateString()}</Text>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </ScrollView>
        </Animated.View>

        {/* --- 6. SPONSORS (Premium Partners) --- */}
        {sponsors && sponsors.length > 0 && (
          <Animated.View entering={FadeInDown.delay(600).duration(500)} style={styles.sponsorContainer}>
            <View style={styles.sponsorHeaderRow}>
              <View style={styles.sponsorDivider} />
              <Text style={styles.sponsorTitle}>PARTNERED WITH</Text>
              <View style={styles.sponsorDivider} />
            </View>
            <View style={styles.marqueeContainer}>
              <MarqueeRow sponsors={sponsors} />
            </View>
          </Animated.View>
        )}

        {/* --- 8. MATCH HIGHLIGHTS (Premium) --- */}
        {highlightsData.length > 0 && (
          <Animated.View entering={FadeInDown.delay(800).duration(500).springify()} style={styles.horizontalSectionContainer}>
            <View style={styles.horizontalSectionHeader}>
              <View style={styles.sectionTitleRow}>
                <View style={[styles.premiumHeaderBar, { backgroundColor: '#E31C25' }]} />
                <Ionicons name="videocam-outline" size={22} color="#E31C25" style={{ marginRight: 6 }} />
                <Text style={styles.sectionTitle}>Match Highlights</Text>
              </View>
              <TouchableOpacity>
                <Text style={styles.seeAll}>See All</Text>
              </TouchableOpacity>
            </View>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingLeft: 16, paddingRight: 8 }}
            >
              {highlightsData.map((video, index) => (
                <Animated.View key={video._id} entering={FadeInRight.delay(index * 100)}>
                  <TouchableOpacity
                    style={styles.videoCard}
                    onPress={() => {
                      if (video.videoUrl && (video.videoUrl.includes('youtube.com') || video.videoUrl.includes('youtu.be'))) {
                        Linking.openURL(video.videoUrl);
                      } else {
                        setSelectedHighlightVideo(video);
                        setHighlightVideoVisible(true);
                      }
                    }}
                    activeOpacity={0.8}
                  >
                    <ImageBackground source={{ uri: video.image }} style={styles.videoThumb} imageStyle={{ borderRadius: 16 }}>
                      <LinearGradient colors={['transparent', 'rgba(0,0,0,0.7)']} style={styles.videoOverlay}>
                        <View style={styles.playIconContainer}>
                          <Ionicons name="play" size={28} color="#fff" />
                        </View>
                        <View style={styles.videoDurationBadge}>
                          <Ionicons name="time-outline" size={10} color="#fff" />
                          <Text style={styles.videoDuration}>{video.duration}</Text>
                        </View>
                      </LinearGradient>
                    </ImageBackground>
                    <Text style={styles.videoTitle} numberOfLines={2}>{video.title}</Text>
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </ScrollView>
          </Animated.View>
        )}

        {/* --- 7. QUOTE OF THE DAY --- */}
        {quotesData.length > 0 && (
          <Animated.View entering={FadeInDown.delay(700).duration(500).springify()} style={styles.quoteContainer}>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => setQuoteIndex(prev => (prev + 1) % quotesData.length)}
            >
              <ImageBackground
                source={{ uri: quotesData[quoteIndex % quotesData.length]?.image || 'https://images.unsplash.com/photo-1593341646261-1e961917f699?w=800&q=80' }}
                style={styles.quoteBackground}
                imageStyle={{ borderRadius: 20 }}
              >
                <LinearGradient colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.85)']} style={styles.quoteGradient}>
                  <View style={styles.quoteIconContainer}>
                    <FontAwesome5 name="quote-left" size={28} color="#FFD700" />
                  </View>
                  <Text style={styles.quoteText}>“{quotesData[quoteIndex % quotesData.length]?.text}”</Text>

                  <View style={styles.quoteAuthorRow}>
                    <View style={styles.quoteAuthorLine} />
                    <Text style={styles.quoteAuthor}>{quotesData[quoteIndex % quotesData.length]?.author}</Text>
                  </View>
                  {quotesData.length > 1 && (
                    <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 10, gap: 6 }}>
                      {quotesData.map((_: any, i: number) => (
                        <View key={i} style={{
                          width: i === quoteIndex % quotesData.length ? 18 : 6,
                          height: 6,
                          borderRadius: 3,
                          backgroundColor: i === quoteIndex % quotesData.length ? '#FFD700' : 'rgba(255,255,255,0.4)',
                        }} />
                      ))}
                    </View>
                  )}
                </LinearGradient>
              </ImageBackground>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* --- 9. TPL STORE (Premium) --- */}
        <AnimatedLinearGradient
          entering={FadeInDown.delay(900).duration(500).springify()}
          colors={['#1A1A1A', '#0D0D0D']}
          style={styles.storeContainer}
        >
          <View style={[styles.sectionHeader, { paddingHorizontal: 16 }]}>
            <View style={styles.sectionTitleRow}>
              <View style={[styles.premiumHeaderBar, { backgroundColor: '#FFD700' }]} />
              <Ionicons name="basket-outline" size={22} color="#FFD700" style={{ marginRight: 6 }} />
              <Text style={[styles.sectionTitle, { color: '#fff' }]}>Aattum TPL Store</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/store' as any)}>
              <LinearGradient colors={['#FFD700', '#FFA000']} style={styles.shopNowBtn}>
                <Text style={styles.shopNowText}>Shop Now</Text>
                <MaterialCommunityIcons name="arrow-right" size={14} color="#1A1A1A" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.storeScroll}>
            {storeProducts.map((item, index) => (
              <Animated.View key={item._id || item.id} entering={FadeInRight.delay(index * 100)}>
                <TouchableOpacity style={styles.storeCard} onPress={() => router.push('/store' as any)}>
                  <View style={styles.imageContainer}>
                    <Image
                      source={{ uri: item.image }}
                      style={styles.storeImage}
                      resizeMode="contain"
                    />
                  </View>
                  <View style={styles.storeFooter}>
                    <Text style={styles.storeName} numberOfLines={1}>{item.title}</Text>
                    <Text style={styles.storePrice}>₹{item.price}</Text>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </ScrollView>
        </AnimatedLinearGradient>

        {/* --- 10. DID YOU KNOW? --- */}
        {triviaData.length > 0 && (
          <Animated.View entering={FadeInDown.delay(1000).duration(500).springify()} style={styles.sectionContainer}>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => setTriviaIndex(prev => (prev + 1) % triviaData.length)}
            >
              <LinearGradient colors={['#E3F2FD', '#BBDEFB']} style={styles.triviaCard}>
                <View style={styles.triviaHeader}>
                  <View style={[styles.premiumHeaderBar, { backgroundColor: '#FFD700', marginRight: 12 }]} />
                  <Text style={styles.triviaTitle}>Did You Know?</Text>
                  {triviaData.length > 1 && (
                    <Text style={{ fontSize: 10, color: '#90CAF9', marginLeft: 'auto', fontWeight: '600' }}>
                      {triviaIndex + 1}/{triviaData.length} • Tap for next
                    </Text>
                  )}
                </View>
                <Text style={styles.triviaText}>{triviaData[triviaIndex % triviaData.length]?.fact}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* --- 12. SOCIAL WALL (Premium) --- */}
        <Animated.View entering={FadeInDown.delay(1200).duration(500).springify()} style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <View style={[styles.premiumHeaderBar, { backgroundColor: '#1DA1F2' }]} />
              <Ionicons name="chatbubbles-outline" size={22} color="#1DA1F2" style={{ marginRight: 6 }} />
              <Text style={styles.sectionTitle}>Social Wall</Text>
            </View>
          </View>
          {socialData.map((post, index) => (
            <Animated.View key={post._id} entering={FadeInDown.delay(index * 100)}>
              <View style={styles.socialCard}>
                <View style={styles.socialHeader}>
                  <LinearGradient
                    colors={post.platform === 'instagram' ? ['#C13584', '#E1306C'] : ['#1DA1F2', '#0D8BD9']}
                    style={styles.socialPlatformIcon}
                  >
                    <Ionicons name={post.platform === 'instagram' ? 'logo-instagram' : 'logo-twitter'} size={16} color="#fff" />
                  </LinearGradient>
                  <View style={styles.socialUserInfo}>
                    <Text style={styles.socialUser}>{post.user}</Text>
                    <Text style={styles.socialPlatformText}>{post.platform === 'instagram' ? 'Instagram' : 'Twitter'}</Text>
                  </View>
                </View>
                <Text style={styles.socialContent}>{post.content}</Text>
                {post.image && <Image source={{ uri: post.image }} style={styles.socialImage} />}
                <View style={styles.socialFooter}>
                  <View style={styles.socialLikeBtn}>
                    <Ionicons name="heart" size={18} color="#E31C25" />
                    <Text style={styles.socialLikes}>{post.likes}</Text>
                  </View>
                  <TouchableOpacity style={styles.socialShareBtn}>
                    <Ionicons name="share-outline" size={18} color="#666" />
                  </TouchableOpacity>
                </View>
              </View>
            </Animated.View>
          ))}
        </Animated.View>

        {/* --- 13. BLOGS SECTION --- */}
        {blogsData.length > 0 && (
          <Animated.View entering={FadeInDown.delay(1300).duration(500).springify()} style={[styles.horizontalSectionContainer, { marginBottom: 50 }]}>
            <View style={styles.horizontalSectionHeader}>
              <View style={styles.sectionTitleRow}>
                <View style={[styles.premiumHeaderBar, { backgroundColor: '#7C3AED' }]} />
                <Ionicons name="book-outline" size={22} color="#7C3AED" style={{ marginRight: 6 }} />
                <Text style={styles.sectionTitle}>Kabaddi Blogs</Text>
              </View>
              <TouchableOpacity>
                <Text style={styles.seeAll}>See All</Text>
              </TouchableOpacity>
            </View>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              contentContainerStyle={{ paddingLeft: 16, paddingRight: 8, paddingBottom: 8 }}
            >
              {blogsData.map((blog, index) => (
                <Animated.View key={blog._id} entering={FadeInRight.delay(index * 100)}>
                  <TouchableOpacity
                    style={styles.blogCard}
                    activeOpacity={0.85}
                    onPress={() => router.push({
                      pathname: '/blog/[id]',
                      params: {
                        ...blog,
                        tags: Array.isArray(blog.tags) ? blog.tags.join(',') : (blog.tags || ''),
                      }
                    } as any)}
                  >
                    <ImageBackground
                      source={{ uri: blog.image }}
                      style={styles.blogThumb}
                      imageStyle={{ borderRadius: 16 }}
                    >
                      <LinearGradient colors={['transparent', 'rgba(0,0,0,0.85)']} style={styles.blogOverlay}>
                        <View style={styles.blogCategoryBadge}>
                          <Text style={styles.blogCategory}>{blog.category}</Text>
                        </View>
                        <Text style={styles.blogTitle} numberOfLines={2}>{blog.title}</Text>
                        <View style={styles.blogAuthorRow}>
                          <Ionicons name="person-circle-outline" size={14} color="rgba(255,255,255,0.8)" />
                          <Text style={styles.blogAuthor}>{blog.author}</Text>
                        </View>
                      </LinearGradient>
                    </ImageBackground>
                    {blog.excerpt ? (
                      <Text style={styles.blogExcerpt} numberOfLines={2}>{blog.excerpt}</Text>
                    ) : null}
                    {blog.tags && blog.tags.length > 0 && (
                      <View style={styles.blogTagsRow}>
                        {(Array.isArray(blog.tags) ? blog.tags : blog.tags.split(',')).slice(0, 3).map((tag: string, ti: number) => (
                          <View key={ti} style={styles.blogTag}>
                            <Text style={styles.blogTagText}>#{tag.trim()}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </ScrollView>
          </Animated.View>
        )}

      </ScrollView>

      {/* --- STORY MODAL --- */}
      <Modal visible={!!selectedStory} animationType="fade" transparent={true} onRequestClose={() => setSelectedStory(null)}>
        <View style={styles.storyModalContainer}>
          <View style={styles.storyProgressBarContainer}>
            <View style={[styles.storyProgressBar, { width: `${storyProgress}%` }]} />
          </View>

          <View style={styles.storyHeader}>
            <Image source={{ uri: selectedStory?.image }} style={styles.storyHeaderAvatar} />
            <Text style={styles.storyHeaderName}>{selectedStory?.name}</Text>
            <TouchableOpacity onPress={() => setSelectedStory(null)} style={styles.storyCloseBtn}>
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.storyContent}>
            {selectedStory?.type === 'video' ? (
              <Video
                ref={videoRef}
                source={{ uri: selectedStory.image }}
                rate={1.0}
                volume={1.0}
                isMuted={false}
                resizeMode={ResizeMode.CONTAIN}
                shouldPlay
                style={styles.storyVideo}
                onPlaybackStatusUpdate={(status: any) => {
                  if (status.isLoaded) {
                    setStoryProgress((status.positionMillis / (status.durationMillis || 1)) * 100);
                    if (status.didJustFinish) {
                      setSelectedStory(null);
                    }
                  }
                }}
              />
            ) : (
              <Image source={{ uri: selectedStory?.image }} style={styles.storyImage} resizeMode="contain" />
            )}
          </View>

          <View style={styles.storyFooter}>
            <Text style={styles.storyRole}>{selectedStory?.role}</Text>
            <View style={styles.storyRankBadge}>
              <Text style={styles.storyRankText}>#{selectedStory?.rank}</Text>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// --- MARQUEE COMPONENT ---
const MarqueeRow = ({ sponsors }: { sponsors: any[] }) => {
  const offset = useSharedValue(0);
  const CARD_WIDTH = 170;
  const list = [...sponsors, ...sponsors, ...sponsors, ...sponsors, ...sponsors];

  useEffect(() => {
    if (sponsors.length === 0) return;
    const totalWidth = sponsors.length * CARD_WIDTH;

    offset.value = withRepeat(
      withTiming(-totalWidth, {
        duration: 10000 + (sponsors.length * 1500),
        easing: Easing.linear,
      }),
      -1,
      false
    );
  }, [sponsors, offset]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: offset.value }],
  }));

  if (sponsors.length === 0) return null;

  return (
    <View style={{ overflow: 'hidden', width: '100%', paddingVertical: 10 }}>
      <Animated.View style={[{ flexDirection: 'row', alignItems: 'center' }, animatedStyle]}>
        {list.map((sponsor, index) => (
          <TouchableOpacity
            key={`${sponsor._id}-${index}`}
            style={styles.sponsorGlassCard}
            onPress={() => { if (sponsor.link) Linking.openURL(sponsor.link); }}
            activeOpacity={sponsor.link ? 0.7 : 1}
          >
            <View style={styles.sponsorGradient}>
              <Image
                source={{ uri: sponsor.logo }}
                style={styles.sponsorLogo}
                resizeMode="contain"
              />
              {sponsor.name ? (
                <Text style={{ fontSize: 10, color: '#555', fontWeight: '700', textAlign: 'center', marginTop: 4, paddingHorizontal: 4 }} numberOfLines={1}>
                  {sponsor.name}
                </Text>
              ) : null}
            </View>
          </TouchableOpacity>
        ))}
      </Animated.View>
    </View>
  );
};

// --- REUSABLE COMPONENTS ---
function RenderProfileSection({ title, profiles, color, delay, onFollow }: any) {
  const router = useRouter();
  if (profiles.length === 0) return null;

  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(500).springify()} style={styles.trendingContainer}>
      <View style={[styles.sectionHeader, { paddingRight: 16, marginBottom: 12 }]}>
        <View style={styles.sectionTitleRow}>
          <LinearGradient
            colors={['#FF3B30', '#FF9500']}
            style={[styles.premiumHeaderBar, { width: 5, borderRadius: 3 }]}
          />
          <MaterialCommunityIcons name="lightning-bolt-circle" size={24} color="#FF3B30" style={{ marginRight: 6 }} />
          <Text style={[styles.sectionTitle, { fontSize: 19, fontWeight: '900', color: '#1A1A1A' }]}>{title}</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/players')}>
          <LinearGradient
            colors={['#FF3B30', '#FF9500']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 }}
          >
            <Text style={{ color: '#FFF', fontSize: 11, fontWeight: '900', letterSpacing: 0.5 }}>VIEW ALL</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.trendingScroll}
        contentContainerStyle={{ paddingRight: 20, paddingBottom: 12 }}
      >
        {profiles.map((player: any, index: number) => (
          <ProfileSquareCard key={player._id} player={player} index={index} onFollow={onFollow} />
        ))}
      </ScrollView>
    </Animated.View>
  );
}

function ProfileSquareCard({ player, index, onFollow }: any) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user: currentUser } = useAppSelector(state => state.auth);
  const [followLoading, setFollowLoading] = useState<string | null>(null);

  const getStatus = (userId: string) => {
    if (!currentUser || !currentUser.following) return 'none';
    const entry = currentUser.following.find((f: any) => {
      const id = typeof f === 'string' ? f : (f.user?._id || f.user);
      return id === userId;
    });
    return entry ? entry.status : 'none';
  };

  const handleFollow = async (userId: string) => {
    if (onFollow) {
      await onFollow(userId);
      return;
    }
    if (!currentUser) return;
    const status = getStatus(userId);
    setFollowLoading(userId);
    try {
      if (status === 'none' || status === 'rejected') {
        dispatch(updateFollowStatus({ userId, status: 'pending' }));
        await userService.followUser(userId);
      } else if (status === 'pending') {
        dispatch(updateFollowStatus({ userId, status: 'none' }));
        await userService.unfollowUser(userId);
      }
    } catch (e) {
      console.error('Action failed', e);
      dispatch(updateFollowStatus({ userId, status }));
    } finally {
      setFollowLoading(null);
    }
  };

  const status = getStatus(player._id);
  const isLoading = followLoading === player._id;

  // Real Database Field Resolvers
  const playerName = player.name || player.fullName || player.username || 'Player';
  const playerImage = player.profilePicture || player.image || player.avatar || player.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(playerName)}&background=1C1917&color=FF9500&bold=true`;
  const playerRole = player.role || player.playerProfile?.role || player.playerProfile?.primaryRole || (Array.isArray(player.sports) && player.sports.length > 0 ? player.sports[0] : 'Kabaddi Raider');
  const playerCity = player.city || player.location || player.state || 'IND';

  const roleLower = (playerRole || '').toLowerCase();
  const isRaider = roleLower.includes('raid') || roleLower.includes('attack');
  const isDefender = roleLower.includes('defen') || roleLower.includes('tackle') || roleLower.includes('corner') || roleLower.includes('cover');

  return (
    <Animated.View
      entering={FadeInRight.delay(index * 100)}
      style={styles.attackProfileCard}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => router.push(`/profile/view/${player._id}` as any)}
        style={{ flex: 1 }}
      >
        {/* Top Aggressive Header Bar */}
        <LinearGradient
          colors={['#FF3B30', '#FF9500']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.attackCardTopBar}
        >
          <View style={styles.attackBadgeContainer}>
            <MaterialCommunityIcons 
              name={(isRaider ? "lightning-bolt" : isDefender ? "shield-half-full" : "fire") as any} 
              size={12} 
              color="#FFF" 
            />
            <Text style={styles.attackBadgeText}>
              {isRaider ? "POWER RAIDER" : isDefender ? "IRON DEFENDER" : "PRO ATHLETE"}
            </Text>
          </View>
        </LinearGradient>

        {/* Player Image with Gradient Overlay & Real Location Badge */}
        <View style={styles.attackImageWrapper}>
          <Image
            source={{ uri: playerImage }}
            style={styles.attackProfileImage}
          />
          <LinearGradient
            colors={['transparent', 'rgba(18,18,26,0.95)']}
            style={styles.attackImageOverlay}
          />

          <View style={styles.attackLocationBadge}>
            <Ionicons name="location-sharp" size={10} color="#FF9500" />
            <Text style={styles.attackLocationText}>{playerCity}</Text>
          </View>
        </View>

        {/* Content Details (Real Name & Real Role from DB) */}
        <View style={styles.attackCardContent}>
          <Text style={styles.attackPlayerName} numberOfLines={1}>{playerName}</Text>

          <View style={styles.attackRoleContainer}>
            <LinearGradient
              colors={['rgba(255,149,0,0.15)', 'rgba(255,59,48,0.15)']}
              style={styles.attackRoleBadge}
            >
              <MaterialCommunityIcons name="target" size={12} color="#FF9500" style={{ marginRight: 4 }} />
              <Text style={styles.attackRoleText} numberOfLines={1}>{playerRole}</Text>
            </LinearGradient>
          </View>
        </View>
      </TouchableOpacity>

      {/* Aggressive Action Button */}
      <View style={{ paddingHorizontal: 10, paddingBottom: 10, paddingTop: 4 }}>
        <TouchableOpacity
          onPress={() => handleFollow(player._id)}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          {status === 'accepted' ? (
            <View style={styles.followingAttackBtn}>
              <Ionicons name="checkmark-circle" size={14} color="#888" />
              <Text style={styles.followingAttackBtnText}>Following</Text>
            </View>
          ) : status === 'pending' ? (
            <View style={styles.pendingAttackBtn}>
              <Ionicons name="time" size={14} color="#FF9500" />
              <Text style={styles.pendingAttackBtnText}>Requested</Text>
            </View>
          ) : (
            <LinearGradient
              colors={['#FF3B30', '#E31C25']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.followAttackBtn}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <MaterialCommunityIcons name="lightning-bolt" size={14} color="#FFF" style={{ marginRight: 4 }} />
                  <Text style={styles.followAttackBtnText}>ATTACK / FOLLOW</Text>
                </>
              )}
            </LinearGradient>
          )}
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F6F9',
  },
  scrollContent: {
    paddingBottom: 60,
  },
  featuredVideoContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 4,
  },
  featuredVideoCard: {
    width: '100%',
    height: 200,
    borderRadius: 18,
    shadowColor: '#E31C25',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    backgroundColor: '#000',
  },
  featuredVideoThumb: {
    width: '100%',
    height: '100%',
  },
  featuredVideoGradient: {
    flex: 1,
    borderRadius: 18,
    padding: 16,
    justifyContent: 'space-between',
  },
  featuredVideoTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  promoLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E31C25',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  promoLabelText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  featuredDurationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  featuredDurationText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  featuredPlayCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  featuredPlayCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(227, 28, 37, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
  },
  featuredVideoBottom: {
    marginTop: 'auto',
  },
  featuredVideoTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 6,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  tapToPlayRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tapToPlayText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '600',
  },

  // Carousel
  carouselContainer: {
    marginTop: 0,
    marginBottom: 0,
    height: 220,
  },
  carouselScroll: {
    paddingLeft: 16,
  },
  heroSlide: {
    width: width - 40,
    height: 250,
    marginRight: 15,
    borderRadius: 20,
    overflow: 'hidden',
  },
  emptyMatchCard: {
    flex: 1,
    width: '100%',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  emptyMatchText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 15,
  },
  emptyMatchSubtext: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    marginTop: 5,
  },

  // Section Headers
  sectionContainer: {
    paddingHorizontal: 16,
    marginBottom: 18,
  },
  horizontalSectionContainer: {
    marginBottom: 18,
  },
  horizontalSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  premiumHeaderBar: {
    width: 4,
    height: 20,
    borderRadius: 2,
    marginRight: 8,
  },
  sectionIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1e293b',
    letterSpacing: 0.3,
  },
  sectionHeaderTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1e293b',
    letterSpacing: 0.5,
  },
  seeAll: {
    color: '#E31C25',
    fontSize: 13,
    fontWeight: '700',
  },

  // Quick Actions Grid
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItem: {
    width: (width - 48) / 4,
    alignItems: 'center',
    marginBottom: 20,
  },
  gridIconCard: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  gridIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  gridLabel: {
    fontSize: 11,
    color: '#444',
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.2,
  },

  // Trending Players
  trendingContainer: {
    marginBottom: 18,
    paddingLeft: 16,
  },
  trendingScroll: {
    paddingRight: 16,
  },
  playerCard: {
    marginRight: 18,
    alignItems: 'center',
    width: 85,
  },
  playerAvatarContainer: {
    width: 78,
    height: 78,
    marginBottom: 10,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyRingGradient: {
    width: 76,
    height: 76,
    borderRadius: 38,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  storyRingInner: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#fff',
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  playerAvatar: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#eee',
  },
  storyVideoIcon: {
    position: 'absolute',
    bottom: 0,
    right: 5,
    backgroundColor: '#E31C25',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  rankBadge: {
    position: 'absolute',
    top: -2,
    right: 0,
    backgroundColor: '#1A1A1A',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#fff',
  },
  rankText: {
    color: '#FFD700',
    fontSize: 9,
    fontWeight: 'bold',
  },
  playerName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  playerRoleBadge: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  playerRole: {
    fontSize: 9,
    color: '#666',
    fontWeight: '600',
  },

  // Live Badge
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE5E5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 10,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E31C25',
    marginRight: 4,
  },
  liveText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#E31C25',
    letterSpacing: 0.5,
  },

  // Poll
  pollCard: {
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  pollQuestion: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 24,
  },
  pollOptionBtn: {
    marginBottom: 14,
  },
  pollBarBg: {
    height: 52,
    backgroundColor: '#F5F5F5',
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
  },
  pollFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    opacity: 0.25,
    borderRadius: 14,
  },
  pollContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    zIndex: 1,
  },
  pollText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#333',
  },
  pollPercent: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  pollHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    gap: 6,
  },
  pollHint: {
    color: '#999',
    fontSize: 12,
    fontWeight: '500',
  },

  // News
  newsSectionContainer: {
    marginBottom: 18,
  },
  newsScrollContent: {
    paddingLeft: 16,
    paddingRight: 8,
  },
  newsCardHorizontal: {
    width: 280,
    height: 160,
    borderRadius: 16,
    marginRight: 14,
    overflow: 'hidden',
  },
  newsThumbHorizontal: {
    width: '100%',
    height: '100%',
    backgroundColor: '#eee',
  },
  newsOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 14,
    justifyContent: 'flex-end',
    height: '100%',
  },
  newsCategoryBadge: {
    backgroundColor: '#E31C25',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
  },
  newsCategory: {
    fontSize: 9,
    fontWeight: '800',
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  newsHeadline: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    lineHeight: 20,
    marginBottom: 8,
  },
  newsTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  newsTime: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
  },

  // Sponsors
  sponsorContainer: {
    paddingVertical: 14,
    marginBottom: 18,
    backgroundColor: '#fff',
  },
  sponsorHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    paddingHorizontal: 30,
  },
  sponsorDivider: {
    flex: 1,
    height: 1,
    backgroundColor: '#F0F0F0',
  },
  sponsorTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: 'gray',
    letterSpacing: 4,
    marginHorizontal: 24,
    textTransform: 'uppercase',
  },
  marqueeContainer: {
    overflow: 'hidden',
    height: 100,
    justifyContent: 'center',
  },
  sponsorGlassCard: {
    width: 150,
    height: 80,
    marginRight: 20,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#F5F5F5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  sponsorGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  sponsorLogo: {
    width: '85%',
    height: '85%',
  },

  // Quote
  quoteContainer: {
    marginHorizontal: 16,
    marginBottom: 18,
    height: 200,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  quoteBackground: {
    width: '100%',
    height: '100%',
  },
  quoteGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 28,
  },
  quoteIconContainer: {
    marginBottom: 12,
  },
  quoteText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 16,
  },
  quoteAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quoteAuthorLine: {
    width: 30,
    height: 2,
    backgroundColor: '#FFD700',
    marginRight: 10,
  },
  quoteAuthor: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: '700',
  },

  // Videos
  videoCard: {
    width: 240,
    marginRight: 16,
  },
  videoThumb: {
    width: '100%',
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  videoOverlay: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
  playIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(227,28,37,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#E31C25',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  videoDurationBadge: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  videoDuration: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  videoTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#333',
    lineHeight: 18,
  },

  // TPL Store
  storeContainer: {
    paddingVertical: 14,
    marginBottom: 18,
    borderRadius: 0,
  },
  storeScroll: {
    paddingLeft: 16,
  },
  shopNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  shopNowText: {
    color: '#1A1A1A',
    fontSize: 12,
    fontWeight: '700',
  },
  storeCard: {
    width: 160,
    backgroundColor: '#252525',
    borderRadius: 20,
    marginRight: 15,
    overflow: 'hidden',
    padding: 10,
    borderWidth: 1,
    borderColor: '#333',
  },
  imageContainer: {
    width: '100%',
    height: 120,
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 12,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  storeImage: {
    width: '90%',
    height: '90%',
  },
  storeFooter: {
    paddingHorizontal: 4,
  },
  storeName: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  storePrice: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: '800',
  },

  // Trivia
  triviaCard: {
    borderRadius: 20,
    padding: 24,
    borderLeftWidth: 5,
    borderLeftColor: '#FFD700',
  },
  triviaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  triviaIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  triviaTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1565C0',
  },
  triviaText: {
    fontSize: 14,
    color: '#0D47A1',
    lineHeight: 24,
    fontWeight: '500',
  },

  // Social Wall
  socialCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  socialHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  socialPlatformIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  socialUserInfo: {
    flex: 1,
  },
  socialUser: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  socialPlatformText: {
    fontSize: 11,
    color: '#888',
    fontWeight: '500',
  },
  socialContent: {
    fontSize: 14,
    color: '#333',
    lineHeight: 22,
    marginBottom: 14,
  },
  socialImage: {
    width: '100%',
    height: 200,
    borderRadius: 14,
    marginBottom: 14,
  },
  socialFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
    paddingTop: 12,
  },
  socialLikeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  socialLikes: {
    fontSize: 13,
    fontWeight: '700',
    color: '#555',
  },
  socialShareBtn: {
    padding: 4,
  },

  // Blogs
  blogCard: {
    width: 260,
    marginRight: 16,
  },
  blogThumb: {
    width: '100%',
    height: 150,
    justifyContent: 'flex-end',
    marginBottom: 10,
  },
  blogOverlay: {
    padding: 12,
    borderRadius: 16,
  },
  blogCategoryBadge: {
    backgroundColor: '#7C3AED',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 6,
  },
  blogCategory: {
    fontSize: 9,
    fontWeight: '800',
    color: '#fff',
    textTransform: 'uppercase',
  },
  blogTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#fff',
    lineHeight: 18,
    marginBottom: 6,
  },
  blogAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  blogAuthor: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
  },
  blogExcerpt: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
    marginBottom: 8,
  },
  blogTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  blogTag: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  blogTagText: {
    fontSize: 10,
    color: '#666',
    fontWeight: '600',
  },

  // Banners
  profileAlertBanner: {
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 12,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#E31C25',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 10,
  },
  profileAlertGradient: {
    paddingVertical: 18,
    paddingHorizontal: 20,
  },
  profileAlertContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileAlertIconBg: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  profileAlertTextContainer: {
    flex: 1,
  },
  profileProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  profileAlertTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
  },
  profileAlertDesc: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '500',
  },
  profileAlertBtn: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    gap: 4,
  },
  profileAlertBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#E31C25',
  },

  notificationBannerContainer: {
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 12,
    borderRadius: 24,
    overflow: 'hidden',
    height: 280,
    shadowColor: '#E31C25',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.45,
    shadowRadius: 25,
    elevation: 12,
  },
  bannerImageBg: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  bannerGradient: {
    flex: 1,
    padding: 18,
  },
  bannerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  notificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  notificationBadgeText: {
    color: '#1A1A1A',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  bannerCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerContent: {
    marginTop: 'auto',
  },
  bannerTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 6,
  },
  bannerSubtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  bannerActionBtn: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  bannerActionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 6,
  },
  bannerActionText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },
  actionIconWrapper: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Fullscreen Modal
  fullscreenContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  fullscreenBg: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  fullscreenGradient: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 24,
  },
  fullscreenClose: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginTop: 40,
  },
  fullscreenContent: {
    marginBottom: 40,
  },
  exclusiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,215,0,0.2)',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 16,
    gap: 6,
  },
  exclusiveText: {
    color: '#FFD700',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  fullscreenTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 12,
  },
  fullscreenDesc: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 24,
  },
  fullscreenBtn: {
    backgroundColor: '#E31C25',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 10,
  },
  fullscreenBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },

  titleCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 6,
  },
  titleCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  titleIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  titleCardTextContainer: {
    flex: 1,
  },
  titleCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1e293b',
  },
  titleCardSubtitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  titleCardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  liveIndicatorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(227, 28, 37, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  liveIndicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E31C25',
  },
  liveIndicatorText: {
    color: '#E31C25',
    fontSize: 10,
    fontWeight: 'bold',
  },

  // Attack Version Kabaddi Profile Cards
  attackProfileCard: {
    width: 170,
    backgroundColor: '#12121A',
    borderRadius: 22,
    marginRight: 16,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 149, 0, 0.35)',
    shadowColor: '#FF4500',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  attackCardTopBar: {
    paddingVertical: 5,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attackBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  attackBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  attackImageWrapper: {
    width: '100%',
    height: 145,
    position: 'relative',
    backgroundColor: '#1C1917',
  },
  attackProfileImage: {
    width: '100%',
    height: '100%',
  },
  attackImageOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 60,
  },
  attackLocationBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,149,0,0.4)',
  },
  attackLocationText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#FF9500',
    textTransform: 'uppercase',
  },
  attackCardContent: {
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 6,
  },
  attackPlayerName: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  attackRoleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  attackRoleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 149, 0, 0.4)',
  },
  attackRoleText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FF9500',
    textTransform: 'uppercase',
  },
  followAttackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 12,
    shadowColor: '#E31C25',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  followAttackBtnText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  followingAttackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    gap: 4,
  },
  followingAttackBtnText: {
    color: '#AAA',
    fontSize: 11,
    fontWeight: '700',
  },
  pendingAttackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 149, 0, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 149, 0, 0.3)',
    gap: 4,
  },
  pendingAttackBtnText: {
    color: '#FF9500',
    fontSize: 11,
    fontWeight: '800',
  },

  // Story Modal
  storyModalContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
  },
  storyProgressBarContainer: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    zIndex: 10,
    overflow: 'hidden',
  },
  storyProgressBar: {
    height: '100%',
    backgroundColor: '#E31C25',
  },
  storyHeader: {
    position: 'absolute',
    top: 65,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
  },
  storyHeaderAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  storyHeaderName: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  storyCloseBtn: {
    padding: 4,
  },
  storyContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyVideo: {
    width: width,
    height: height * 0.7,
  },
  storyImage: {
    width: width,
    height: height * 0.7,
  },
  storyFooter: {
    position: 'absolute',
    bottom: 50,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  storyRole: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  storyRankBadge: {
    backgroundColor: 'rgba(255,215,0,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  storyRankText: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: '800',
  },
});
