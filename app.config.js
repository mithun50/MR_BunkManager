module.exports = ({ config }) => {
  // Load environment variables (no fallbacks for security)
  const firebaseConfig = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  };

  // Validate all required Firebase config variables are present
  const missingVars = Object.entries(firebaseConfig)
    .filter(([_, value]) => !value)
    .map(([key]) => `EXPO_PUBLIC_FIREBASE_${key.replace(/([A-Z])/g, '_$1').toUpperCase()}`);

  if (missingVars.length > 0) {
    console.error('❌ Missing Firebase environment variables:', missingVars.join(', '));
    console.error('Please check your .env file or EAS secrets');
  }

  return {
    expo: {
      name: "Bunk Manager",
      slug: "MR_BunkManager",
      version: "1.0.0",
      orientation: "portrait",
      icon: "./assets/images/logo.png",
      scheme: "mrbunkmanager",
      userInterfaceStyle: "automatic",
      newArchEnabled: true,
      notification: {
        icon: "./assets/images/logo.png",
        color: "#3B82F6",
        androidMode: "default",
        androidCollapsedTitle: "MR BunkManager Updates"
      },
    web: {
      bundler: "metro",
      output: "single",
      favicon: "./assets/images/logo.png"
    },
    android: {
      package: "com.idtl.mrbunkmanager",
      versionCode: 4,
      buildType: "app-bundle",
      googleServicesFile: "./google-services.json",
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      useNextNotificationsApi: true,
      softwareKeyboardLayoutMode: "pan",
      icon: "./assets/images/logo.png",
      adaptiveIcon: {
        foregroundImage: "./assets/images/logo.png",
        backgroundColor: "#ffffff"
      },
      permissions: [
        "android.permission.CAMERA",
        "android.permission.READ_EXTERNAL_STORAGE",
        "android.permission.WRITE_EXTERNAL_STORAGE",
        "android.permission.READ_MEDIA_IMAGES",
        "android.permission.POST_NOTIFICATIONS",
        "android.permission.RECORD_AUDIO",
        "android.permission.MODIFY_AUDIO_SETTINGS",
        "android.permission.BLUETOOTH",
        "android.permission.BLUETOOTH_CONNECT"
      ]
    },
    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/logo.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffff",
          dark: {
            backgroundColor: "#000000"
          }
        }
      ],
      [
        "expo-notifications",
        {
          icon: "./assets/images/logo.png",
          color: "#3B82F6",
          defaultChannel: "default"
        }
      ],
      [
        "expo-speech-recognition",
        {
          microphonePermission: "Allow Bunk Manager to use the microphone for voice input."
        }
      ],
      [
        "@config-plugins/react-native-webrtc",
        {
          cameraPermission: "Allow Bunk Manager to access camera for video calls.",
          microphonePermission: "Allow Bunk Manager to access microphone for voice calls."
        }
      ]
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true
    },
      extra: {
        router: {},
        eas: {
          projectId: "88ab37d3-3eb1-45f6-ba36-dd155dd6a8f1"
        },
        // Embed Firebase config for runtime access
        firebaseApiKey: firebaseConfig.apiKey,
        firebaseAuthDomain: firebaseConfig.authDomain,
        firebaseProjectId: firebaseConfig.projectId,
        firebaseStorageBucket: firebaseConfig.storageBucket,
        firebaseMessagingSenderId: firebaseConfig.messagingSenderId,
        firebaseAppId: firebaseConfig.appId,
      },
      owner: "mithun7411"
    }
  };
};
