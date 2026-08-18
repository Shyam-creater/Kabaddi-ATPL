import * as Device from 'expo-device';
import { Platform, Alert } from 'react-native';
import api from './api';
import Constants from 'expo-constants';

let Notifications: any = null;
const isExpoGo = Constants.appOwnership === 'expo';

if (!isExpoGo) {
  try {
    Notifications = require('expo-notifications');
  } catch (err) {
    console.warn('[NotificationService] Failed to load expo-notifications:', err);
  }
} else {
  console.log('[NotificationService] Running in Expo Go: skipped loading expo-notifications to prevent native crashes.');
}

// Notification handler configuration
if (Notifications) {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  } catch (err) {
    console.error('[NotificationService] Failed to set notification handler:', err);
  }
}

class NotificationService {
  /**
   * Request permissions and register for push notifications.
   * returns the push token or null if failed.
   */
  async registerForPushNotificationsAsync() {
    if (!Notifications) {
      console.log('[NotificationService] Push notifications are not supported in this environment (e.g., Expo Go).');
      return null;
    }

    let token;

    if (Platform.OS === 'android') {
      try {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      } catch (err) {
        console.error('[NotificationService] Failed to set notification channel:', err);
      }
    }

    if (Device.isDevice) {
      try {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }

        if (finalStatus !== 'granted') {
          console.log('Failed to get push token for push notification!');
          return null;
        }

        const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
        if (!projectId) {
            console.error('Project ID not found in Expo Constants. Ensure EAS is configured.');
        }

        token = (await Notifications.getExpoPushTokenAsync({
            projectId
        })).data;
        
        console.log('Expo Push Token Registered:', token);

        // Send token to backend if logged in
        if (token) {
          await api.post('/notifications/register-push', { token });
        }
      } catch (err) {
        console.error('Error fetching push token:', err);
      }
    } else {
      console.log('Must use physical device for Push Notifications');
    }

    return token;
  }

  /**
   * Set up notification listeners
   */
  addNotificationListeners(onReceived?: (notification: any) => void) {
    if (!Notifications) {
      console.log('[NotificationService] Push notification listeners not attached (unsupported environment).');
      return () => {};
    }

    try {
      // This listener is fired whenever a notification is received while the app is foregrounded
      const notificationListener = Notifications.addNotificationReceivedListener((notification: any) => {
        console.log('Notification received in foreground:', notification);
        if (onReceived) onReceived(notification);
      });

      // This listener is fired whenever a user taps on or interacts with a notification (works when app is foregrounded, backgrounded, or killed)
      const responseListener = Notifications.addNotificationResponseReceivedListener((response: any) => {
        console.log('Notification response received:', response);
        // Handle navigation or other actions based on response.notification.request.content.data
      });

      return () => {
        notificationListener.remove();
        responseListener.remove();
      };
    } catch (err) {
      console.error('[NotificationService] Failed to set up notification listeners:', err);
      return () => {};
    }
  }
}

export default new NotificationService();
