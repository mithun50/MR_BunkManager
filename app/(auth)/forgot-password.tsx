import { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Text, TextInput, Button, useTheme, HelperText } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import authService from '@/src/services/authService';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useResponsive } from '@/src/hooks/useResponsive';

export default function ForgotPasswordScreen() {
  const theme = useTheme();
  const {
    isDesktop,
    containerPadding,
    responsive,
  } = useResponsive();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleResetPassword = async () => {
    setError('');
    setSuccess(false);

    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      await authService.resetPassword(email);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { padding: containerPadding }]}
        >
          <View style={[
            styles.content,
            {
              maxWidth: responsive(500, 500, 450, 480),
              paddingHorizontal: responsive(16, 20, 32, 40),
            }
          ]}>
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons
                name="email-check-outline"
                size={responsive(64, 72, 80, 90)}
                color={theme.colors.primary}
              />
            </View>

            <Text
              variant={isDesktop ? "headlineLarge" : "headlineMedium"}
              style={[styles.title, { color: theme.colors.primary }]}
            >
              Check Your Email
            </Text>

            <Text
              variant={isDesktop ? "titleMedium" : "bodyLarge"}
              style={styles.subtitle}
            >
              We've sent a password reset link to:
            </Text>

            <Text
              variant={isDesktop ? "titleLarge" : "titleMedium"}
              style={[styles.email, { color: theme.colors.primary }]}
            >
              {email}
            </Text>

            <Text
              variant={isDesktop ? "bodyLarge" : "bodyMedium"}
              style={styles.instructions}
            >
              Click the link in the email to reset your password. If you don't see the email, check your spam folder.
            </Text>

            <Button
              mode="contained"
              onPress={() => router.replace('/(auth)/login')}
              style={styles.button}
              contentStyle={styles.buttonContent}
            >
              Back to Login
            </Button>

            <Button
              mode="text"
              onPress={() => {
                setSuccess(false);
                setEmail('');
              }}
              style={styles.textButton}
            >
              Try Different Email
            </Button>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { padding: containerPadding }]}
        >
          <View style={[
            styles.content,
            {
              maxWidth: responsive(500, 500, 450, 480),
              paddingHorizontal: responsive(16, 20, 32, 40),
            }
          ]}>
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons
                name="lock-reset"
                size={responsive(64, 72, 80, 90)}
                color={theme.colors.primary}
              />
            </View>

            <Text
              variant={isDesktop ? "headlineLarge" : "headlineMedium"}
              style={[styles.title, { color: theme.colors.primary }]}
            >
              Forgot Password?
            </Text>

            <Text
              variant={isDesktop ? "bodyLarge" : "bodyMedium"}
              style={styles.subtitle}
            >
              Enter your email address and we'll send you a link to reset your password.
            </Text>

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

            <HelperText type="error" visible={!!error}>
              {error}
            </HelperText>

            <Button
              mode="contained"
              onPress={handleResetPassword}
              loading={loading}
              disabled={loading}
              style={styles.button}
              contentStyle={styles.buttonContent}
            >
              Send Reset Link
            </Button>

            <Button
              mode="text"
              onPress={() => router.back()}
              style={styles.textButton}
            >
              Back to Login
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    // maxWidth and paddingHorizontal are set dynamically for responsiveness
    width: '100%',
    alignSelf: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: 32,
  },
  email: {
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: 'bold',
  },
  instructions: {
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: 32,
    lineHeight: 24,
  },
  input: {
    marginBottom: 8,
  },
  button: {
    marginTop: 16,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  textButton: {
    marginTop: 16,
  },
});
