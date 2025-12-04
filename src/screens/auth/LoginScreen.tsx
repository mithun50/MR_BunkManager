import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Linking } from 'react-native';
import {
  TextInput,
  Button,
  Text,
  useTheme,
  HelperText,
  Divider,
  Portal,
  Modal,
  Surface,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import authService from '../../services/authService';
import { useAuthStore } from '../../store/authStore';
import OnlineButton from '../../components/OnlineButton';
import { useResponsive } from '../../hooks/useResponsive';

const APP_DOWNLOAD_URL = 'https://github.com/mithun50/MR_BunkManager/releases/download/v1.0.0/Mr-BunkManagerv1beta.apk';

export default function LoginScreen() {
  const theme = useTheme();
  const {
    isDesktop,
    isTablet,
    isMobile,
    isWeb,
    containerPadding,
    contentMaxWidth,
    responsive,
  } = useResponsive();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);

  const handleLogin = async () => {
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await authService.signIn({ email, password });
      // Navigation handled by auth state listener
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    router.push('/forgot-password');
  };

  const handleSignUp = () => {
    // On web, show download modal instead of navigating to signup
    if (isWeb) {
      setShowDownloadModal(true);
    } else {
      router.push('/signup');
    }
  };

  const handleDownloadApp = () => {
    Linking.openURL(APP_DOWNLOAD_URL);
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingHorizontal: containerPadding }
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[
          styles.content,
          {
            maxWidth: responsive(500, 500, 450, 480),
            paddingHorizontal: responsive(16, 20, 32, 40),
            paddingVertical: responsive(20, 24, 32, 40),
          }
        ]}>
          {/* Logo/Header */}
          <View style={styles.header}>
            <Text
              variant={isDesktop ? "displayMedium" : "displaySmall"}
              style={[styles.title, { color: theme.colors.primary }]}
            >
              Mr. Bunk Manager
            </Text>
            <Text
              variant={isDesktop ? "titleMedium" : "bodyLarge"}
              style={styles.subtitle}
            >
              Welcome back! Login to continue
            </Text>
          </View>

          {/* Login Form */}
          <View style={styles.form}>
            <TextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              left={<TextInput.Icon icon="email" />}
              style={styles.input}
              error={!!error}
            />

            <TextInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              mode="outlined"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoComplete="password"
              left={<TextInput.Icon icon="lock" />}
              right={
                <TextInput.Icon
                  icon={showPassword ? 'eye-off' : 'eye'}
                  onPress={() => setShowPassword(!showPassword)}
                />
              }
              style={styles.input}
              error={!!error}
            />

            {error ? (
              <HelperText type="error" visible={!!error}>
                {error}
              </HelperText>
            ) : null}

            <Button
              mode="text"
              onPress={handleForgotPassword}
              style={styles.forgotButton}
            >
              Forgot Password?
            </Button>

            <OnlineButton
              mode="contained"
              onPress={handleLogin}
              loading={loading}
              disabled={loading}
              style={styles.loginButton}
              contentStyle={styles.buttonContent}
              requiresOnline={true}
              offlineMessage="You need an internet connection to login"
            >
              Login
            </OnlineButton>

            <Divider style={styles.divider} />

            <Button
              mode="outlined"
              onPress={handleSignUp}
              style={styles.signupButton}
              contentStyle={styles.buttonContent}
              icon="account-plus"
            >
              Create New Account
            </Button>
          </View>
        </View>
      </ScrollView>

      {/* Download App Modal for Web */}
      <Portal>
        <Modal
          visible={showDownloadModal}
          onDismiss={() => setShowDownloadModal(false)}
          contentContainerStyle={[
            styles.modalContent,
            {
              backgroundColor: theme.colors.surface,
              maxWidth: responsive(350, 400, 450, 500),
            }
          ]}
        >
          <View style={styles.modalInner}>
            <MaterialCommunityIcons
              name="cellphone-arrow-down"
              size={responsive(64, 72, 80, 80)}
              color={theme.colors.primary}
              style={styles.modalIcon}
            />

            <Text
              variant={isDesktop ? "headlineMedium" : "titleLarge"}
              style={[styles.modalTitle, { color: theme.colors.onSurface }]}
            >
              Download Our App
            </Text>

            <Text
              variant="bodyMedium"
              style={[styles.modalDescription, { color: theme.colors.onSurfaceVariant }]}
            >
              To create a new account, please download and use our Android app.
              The app provides the best experience for managing your attendance.
            </Text>

            <Surface
              style={[styles.downloadCard, { backgroundColor: theme.colors.primaryContainer }]}
              elevation={0}
            >
              <MaterialCommunityIcons
                name="android"
                size={32}
                color={theme.colors.primary}
              />
              <View style={styles.downloadCardText}>
                <Text variant="titleSmall" style={{ color: theme.colors.onPrimaryContainer }}>
                  Mr. Bunk Manager
                </Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onPrimaryContainer, opacity: 0.7 }}>
                  v1.0.0 Beta • Android APK
                </Text>
              </View>
            </Surface>

            <Button
              mode="contained"
              onPress={handleDownloadApp}
              style={styles.downloadButton}
              contentStyle={styles.buttonContent}
              icon="download"
            >
              Download APK
            </Button>

            <Button
              mode="text"
              onPress={() => setShowDownloadModal(false)}
              style={styles.dismissButton}
            >
              Maybe Later
            </Button>
          </View>
        </Modal>
      </Portal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 40,
  },
  content: {
    flex: 1,
    // paddingHorizontal and maxWidth are set dynamically for responsiveness
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    opacity: 0.7,
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  input: {
    marginBottom: 16,
  },
  forgotButton: {
    alignSelf: 'flex-end',
    marginTop: -8,
    marginBottom: 16,
  },
  loginButton: {
    marginTop: 8,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  divider: {
    marginVertical: 20,
  },
  signupButton: {
    marginTop: 8,
  },
  // Modal styles
  modalContent: {
    margin: 20,
    borderRadius: 16,
    padding: 24,
    alignSelf: 'center',
    width: '90%',
  },
  modalInner: {
    alignItems: 'center',
  },
  modalIcon: {
    marginBottom: 16,
  },
  modalTitle: {
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  modalDescription: {
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  downloadCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    width: '100%',
    marginBottom: 24,
  },
  downloadCardText: {
    marginLeft: 12,
    flex: 1,
  },
  downloadButton: {
    width: '100%',
    marginBottom: 8,
  },
  dismissButton: {
    marginTop: 8,
  },
});
