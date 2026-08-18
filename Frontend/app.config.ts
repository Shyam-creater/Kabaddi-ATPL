import { ExpoConfig } from '@expo/config-types';

const config: ExpoConfig = {
    name: "ATPL Score",
    slug: "AattumTPL-App",
    owner: "k_shyam",
    version: "2.0.1",
    orientation: "portrait",
    icon: "./assets/images/iconn.png", // 👈 APP ICON (iOS + Android)
    scheme: "AattumTPL-App",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,

    sdkVersion: "54.0.0",

    splash: {
        image: "./assets/images/iconn.png",
        resizeMode: "contain",
        backgroundColor: "#ffffff"
    },

    ios: {
        supportsTablet: true,
        buildNumber: "4",
        infoPlist: {
            NSCameraUsageDescription: "Allow $(PRODUCT_NAME) to access your camera to scan QR codes.",
            NSMicrophoneUsageDescription: "Allow $(PRODUCT_NAME) to access your microphone for voice search.",
            NSSpeechRecognitionUsageDescription: "Allow $(PRODUCT_NAME) to access speech recognition for voice search."
        }
    },

    android: {
        package: "com.aattum.tplscore",
        versionCode: 4,
        adaptiveIcon: {
            foregroundImage: "./assets/images/iconn.png",
            backgroundImage: "./assets/images/iconn.png",
            backgroundColor: "#FFFFFF",
            monochromeImage: "./assets/images/iconn.png"
        },
        edgeToEdgeEnabled: true,
        predictiveBackGestureEnabled: false,
        permissions: [
            "android.permission.CAMERA",
            "android.permission.RECORD_AUDIO",
            "android.permission.INTERNET"
        ]
    },

    web: {
        output: "static",
        favicon: "./assets/images/iconn.png"
    },

    plugins: [
        "expo-router",
        "@react-native-community/datetimepicker",
        [
            "expo-camera",
            {
                cameraPermission: "Allow $(PRODUCT_NAME) to access your camera to scan QR codes.",
                microphonePermission: "Allow $(PRODUCT_NAME) to access your microphone for voice search."
            }
        ]
    ],

    experiments: {
        typedRoutes: true,
        reactCompiler: true
    },

    extra: {
        eas: {
            projectId: "dce1c763-6a11-485f-9805-e7620b0965ab",
        },
    },
};

export default config;