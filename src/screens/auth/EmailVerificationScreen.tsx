import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, useTheme, Surface } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import authService from '../../services/authService';
import { useAuthStore } from '../../store/authStore';
import { useResponsive } from '../../hooks/useResponsive';

export default function EmailVerificationScreen() {
  const theme = useTheme();
  const {
    isDesktop,
    isTablet,
    containerPadding,
    responsive,
  } = useResponsive();
  const { user, refreshUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    // If already verified, let the root navigation handle routing
    // It will check onboardingCompleted and route to either onboarding or tabs
    if (user?.emailVerified) {
      // Don't redirect here - root _layout.tsx will handle it
    }
  }, [user]);

  const handleResendEmail = async () => {
    setLoading(true);
    setMessage('');
    try {
      await authService.sendVerificationEmail();
      setMessage('Verification email sent! Please check your inbox.');
    } catch (error: any) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckVerification = async () => {
    setChecking(true);
    setMessage('');
    try {
      await authService.reloadUser();
      // Refresh the user state in the store to ensure it's in sync
      refreshUser();

      if (authService.isEmailVerified()) {
        setMessage('Email verified! Setting up your account...');

        // Navigate to onboarding directly for new users
        // The root navigation will handle existing users with completed onboarding
        setTimeout(() => {
          router.replace('/(onboarding)');
        }, 1000); // Brief delay to show the success message
      } else {
        setMessage('Email not verified yet. Please check your inbox and click the verification link.');
      }
    } catch (error: any) {
      setMessage(error.message);
    } finally {
      setChecking(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authService.signOut();
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={[
        styles.scrollContent,
        { padding: containerPadding }
      ]}
    >
      <Surface style={[
        styles.content,
        {
          maxWidth: responsive(500, 500, 450, 480),
          padding: responsive(24, 28, 32, 40),
        }
      ]}>
        <MaterialCommunityIcons
          name="email-check"
          size={responsive(64, 72, 80, 90)}
          color={theme.colors.primary}
          style={styles.icon}
        />

        <Text
          variant={isDesktop ? "headlineLarge" : "headlineMedium"}
          style={styles.title}
        >
          Verify Your Email
        </Text>

        <Text
          variant={isDesktop ? "bodyLarge" : "bodyMedium"}
          style={styles.description}
        >
          We've sent a verification email to:
        </Text>

        <Text
          variant={isDesktop ? "titleLarge" : "titleMedium"}
          style={[styles.email, { color: theme.colors.primary }]}
        >
          {user?.email}
        </Text>

        <Text
          variant={isDesktop ? "bodyLarge" : "bodyMedium"}
          style={styles.instructions}
        >
          Please check your inbox and click the verification link to continue.
        </Text>

        {message ? (
          <Surface
            style={[
              styles.messageBox,
              {
                backgroundColor: message.includes('verified')
                  ? theme.colors.secondaryContainer
                  : message.includes('sent')
                  ? theme.colors.tertiaryContainer
                  : theme.colors.errorContainer,
              },
            ]}
          >
            <Text
              variant="bodyMedium"
              style={{
                color: message.includes('verified')
                  ? theme.colors.secondary
                  : message.includes('sent')
                  ? theme.colors.tertiary
                  : theme.colors.error,
              }}
            >
              {message}
            </Text>
          </Surface>
        ) : null}

        <Button
          mode="contained"
          onPress={handleCheckVerification}
          loading={checking}
          disabled={checking || loading}
          style={styles.button}
          contentStyle={styles.buttonContent}
        >
          I've Verified My Email
        </Button>

        <Button
          mode="outlined"
          onPress={handleResendEmail}
          loading={loading}
          disabled={loading || checking}
          style={styles.button}
        >
          Resend Verification Email
        </Button>

        <Button mode="text" onPress={handleLogout} style={styles.logoutButton}>
          Logout
        </Button>
      </Surface>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    // padding and maxWidth are set dynamically for responsiveness
    borderRadius: 16,
    elevation: 2,
    alignItems: 'center',
    width: '100%',
  },
  icon: {
    marginBottom: 24,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: 8,
  },
  email: {
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  instructions: {
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: 24,
  },
  messageBox: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    width: '100%',
  },
  button: {
    width: '100%',
    marginBottom: 12,
  },
  buttonContent: {
    paddingVertical: 6,
  },
  logoutButton: {
    marginTop: 16,
  },
});
