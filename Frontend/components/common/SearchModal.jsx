
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Animated,
  Platform,
  SafeAreaView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Dimensions,
  StatusBar,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import api from '../../services/api';

const { height } = Dimensions.get('window');

export default function SearchModal({ visible, onClose }) {
  const router = useRouter();
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [allPlayers, setAllPlayers] = useState([]);
  const slideAnim = useRef(new Animated.Value(height)).current;

  // Camera State
  const [isScanning, setIsScanning] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  // Fetch all players when modal opens (exclude admins)
  const fetchPlayers = async () => {
    try {
      const response = await api.get('/user/list');
      if (response.data.success) {
        // Filter out admin users
        const nonAdminPlayers = response.data.data.filter(user =>
          user.role?.toLowerCase() !== 'admin'
        );
        setAllPlayers(nonAdminPlayers);
      }
    } catch (error) {
      console.log('Error fetching players:', error);
    }
  };

  useEffect(() => {
    if (visible) {
      slideAnim.setValue(1000);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 280,
        useNativeDriver: true,
      }).start();
      fetchPlayers();
    }
  }, [visible]);

  const goBack = () => {
    setSearchText('');
    setResults([]);
    Animated.timing(slideAnim, {
      toValue: 1000,
      duration: 250,
      useNativeDriver: true,
    }).start(() => onClose());
  };

  // Search logic
  useEffect(() => {
    if (searchText.length > 0) {
      setLoading(true);
      const timer = setTimeout(() => {
        const query = searchText.toLowerCase();
        const filtered = allPlayers.filter(player => {
          const name = (player.name || '').toLowerCase();
          const role = (player.role || '').toLowerCase();
          const city = (player.city || player.address || '').toLowerCase();
          return name.includes(query) || role.includes(query) || city.includes(query);
        });
        setResults(filtered);
        setLoading(false);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setResults([]);
      setLoading(false);
    }
  }, [searchText, allPlayers]);

  // Navigate to player profile
  const handlePlayerPress = (player) => {
    goBack();
    setTimeout(() => {
      router.push(`/profile/view/${player._id}`);
    }, 300);
  };

  // QR Scan handlers
  const handleQRScan = async () => {
    if (!permission) return;
    if (!permission.granted) {
      const { granted } = await requestPermission();
      if (!granted) {
        Alert.alert('Permission needed', 'Camera permission is required to scan QR codes.');
        return;
      }
    }
    setIsScanning(true);
  };

  const handleBarcodeScanned = ({ data }) => {
    setSearchText(data);
    setIsScanning(false);
  };

  const renderPlayerItem = ({ item }) => (
    <TouchableOpacity style={styles.resultItem} onPress={() => handlePlayerPress(item)} activeOpacity={0.8}>
      <View style={styles.avatarContainer}>
        {item.profilePicture ? (
          <Image source={{ uri: item.profilePicture }} style={styles.avatar} />
        ) : (
          <LinearGradient colors={['#E31C25', '#A00F15']} style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>{item.name ? item.name.charAt(0).toUpperCase() : 'P'}</Text>
          </LinearGradient>
        )}
      </View>
      <View style={styles.playerInfo}>
        <Text style={styles.resultName}>{item.name}</Text>
        <Text style={styles.resultRole}>{item.role || 'Player'}</Text>
        {(item.city || item.address) && (
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={11} color="#888" />
            <Text style={styles.locationText}>{item.city || item.address}</Text>
          </View>
        )}
      </View>
      <View style={styles.viewBtn}>
        <Ionicons name="chevron-forward" size={18} color="#E31C25" />
      </View>
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} transparent animationType="none">
      <Animated.View style={[styles.container, { transform: [{ translateY: slideAnim }] }]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <View style={{ flex: 1 }}>

            {/* Gradient Header */}
            <LinearGradient
              colors={['#E31C25', '#900C12']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.headerGradient}
            >
              <SafeAreaView>
                <View style={styles.headerContent}>
                  <View style={styles.searchContainer}>
                    <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Search players by name, role, city..."
                      placeholderTextColor="#999"
                      value={searchText}
                      onChangeText={setSearchText}
                      autoFocus={visible}
                    />
                    <View style={styles.searchActions}>
                      {searchText.length > 0 ? (
                        <TouchableOpacity onPress={() => setSearchText('')} style={styles.actionIcon}>
                          <Ionicons name="close-circle" size={18} color="#999" />
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity onPress={handleQRScan} style={styles.actionIcon}>
                          <Ionicons name="qr-code-outline" size={20} color="#666" />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>

                  <TouchableOpacity onPress={goBack} style={styles.cancelButton}>
                    <Text style={styles.cancelText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </SafeAreaView>
            </LinearGradient>

            {/* Results Area */}
            <View style={styles.content}>
              {loading ? (
                <ActivityIndicator size="large" color="#E31C25" style={{ marginTop: 40 }} />
              ) : (
                <FlatList
                  data={results}
                  keyExtractor={item => item._id}
                  renderItem={renderPlayerItem}
                  ListEmptyComponent={() => (
                    searchText.length > 0 && !loading ? (
                      <View style={styles.emptyState}>
                        <Ionicons name="person-outline" size={50} color="#ddd" />
                        <Text style={styles.emptyText}>No players found for "{searchText}"</Text>
                        <Text style={styles.emptyHint}>Try a different name or role</Text>
                      </View>
                    ) : (
                      <View style={styles.emptyState}>
                        <Ionicons name="search-outline" size={60} color="#ddd" />
                        <Text style={styles.placeholderTitle}>Search Players</Text>
                        <Text style={styles.placeholderText}>Find players by name, role, or city</Text>
                      </View>
                    )
                  )}
                  contentContainerStyle={styles.listContent}
                  showsVerticalScrollIndicator={false}
                />
              )}
            </View>

            {/* QR Scanner Overlay */}
            {isScanning && (
              <View style={styles.cameraOverlay}>
                <CameraView
                  style={StyleSheet.absoluteFill}
                  onBarcodeScanned={handleBarcodeScanned}
                  barcodeScannerSettings={{ barcodeTypes: ['qr', 'ean13'] }}
                />
                <View style={styles.cameraHeader}>
                  <TouchableOpacity onPress={() => setIsScanning(false)} style={styles.closeCameraButton}>
                    <Ionicons name="close" size={28} color="#fff" />
                  </TouchableOpacity>
                  <Text style={styles.cameraTitle}>Scan QR Code</Text>
                </View>
                <View style={styles.cameraFrameContainer}>
                  <View style={styles.cameraFrame} />
                  <Text style={styles.cameraHint}>Align QR code within the frame</Text>
                </View>
              </View>
            )}

          </View>
        </KeyboardAvoidingView>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  headerGradient: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    paddingBottom: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 8,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: Platform.OS === 'ios' ? 0 : 10,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 25,
    paddingHorizontal: 16,
    height: 48,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#1A1A1A',
    height: '100%',
    fontWeight: '500',
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  cancelText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  content: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  avatarContainer: {
    marginRight: 14,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#eee',
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 20,
  },
  playerInfo: {
    flex: 1,
  },
  resultName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  resultRole: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  locationText: {
    fontSize: 11,
    color: '#888',
  },
  viewBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 60,
    paddingHorizontal: 30,
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  emptyHint: {
    color: '#999',
    fontSize: 13,
    marginTop: 6,
  },
  placeholderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginTop: 16,
  },
  placeholderText: {
    color: '#999',
    marginTop: 6,
    fontSize: 14,
    textAlign: 'center',
  },
  searchActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIcon: {
    padding: 6,
    marginLeft: 4,
  },
  cameraOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
    zIndex: 100,
  },
  cameraHeader: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 50,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 101,
  },
  closeCameraButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 20,
  },
  cameraFrameContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraFrame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#E31C25',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
  },
  cameraHint: {
    color: '#fff',
    marginTop: 20,
    fontSize: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
});
