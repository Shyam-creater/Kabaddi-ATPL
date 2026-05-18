import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Platform,
  StatusBar,
} from 'react-native';

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Ionicons from '@expo/vector-icons/Ionicons';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';

export default function AppHeader() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>

        {/* Left */}
        <View style={styles.left}>
          <TouchableOpacity>
            <MaterialIcons name="menu" size={26} color="#fff" />
          </TouchableOpacity>

          <FontAwesome5
            name="cricket"
            size={22}
            color="#fff"
            style={{ marginLeft: 12 }}
          />
        </View>

        {/* Center */}
        <View style={styles.center}>
          <TouchableOpacity style={styles.proBtn}>
            <Text style={styles.proText}>PRO @ ₹199</Text>
          </TouchableOpacity>
        </View>

        {/* Right */}
        <View style={styles.right}>
          <TouchableOpacity style={styles.icon}>
            <Ionicons name="search" size={22} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.icon}>
            <Ionicons name="chatbubble-outline" size={22} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.icon}>
            <Ionicons name="notifications-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

      </View>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#E31C25',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },

  header: {
    height: 58,
    backgroundColor: '#E31C25',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },

  left: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  center: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },

  proBtn: {
    borderWidth: 1,
    borderColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
  },

  proText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },

  right: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
  },

  icon: {
    marginLeft: 16,
  },
});
