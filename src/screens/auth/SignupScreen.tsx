import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import {
  TextInput,
  Button,
  Text,
  useTheme,
  HelperText,
  Divider,
} from 'react-native-paper';
import { router } from 'expo-router';
import authService from '../../services/authService';
import OnlineButton from '../../components/OnlineButton';
import { useResponsive } from '../../hooks/useResponsive';

export default function SignupScreen() {
  const theme = useTheme();
  const {
    isDesktop,
    isTablet,
    isMobile,
    containerPadding,
    contentMaxWidth,
    responsive,
  } = useResponsive();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validateInputs = (): boolean => {
    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return false;
    }

    if (name.length < 2) {
      setError('Name must be at least 2 characters');
      return false;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    return true;
  };

  const handleSignup = async () => {
    setError('');
    setSuccess('');

    if (!validateInputs()) {
      return;
    }

    setLoading(true);
    try {
      await authService.signUp({ email, password, name });
      setSuccess('Account created! Please check your email to verify your account.');
      // Show verification screen
      setTimeout(() => {
        router.push('/email-verification');
      }, 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    router.back();
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
          {/* Header */}
          <View style={styles.header}>
            <Text
              variant={isDesktop ? "displayMedium" : "displaySmall"}
              style={[styles.title, { color: theme.colors.primary }]}
            >
              Create Account
            </Text>
            <Text
              variant={isDesktop ? "titleMedium" : "bodyLarge"}
              style={styles.subtitle}
            >
              Join Mr. Bunk Manager today
            </Text>
          </View>

          {/* Signup Form */}
          <View style={styles.form}>
            <TextInput
              label="Full Name"
              value={name}
              onChangeText={setName}
              mode="outlined"
              autoCapitalize="words"
              autoComplete="name"
              left={<TextInput.Icon icon="account" />}
              style={styles.input}
              error={!!error && !name}
            />

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
              error={!!error && !email}
            />

            <TextInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              mode="outlined"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoComplete="password-new"
              left={<TextInput.Icon icon="lock" />}
              right={
                <TextInput.Icon
                  icon={showPassword ? 'eye-off' : 'eye'}
                  onPress={() => setShowPassword(!showPassword)}
                />
              }
              style={styles.input}
              error={!!error && !password}
            />

            <TextInput
              label="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              mode="outlined"
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
              autoComplete="password-new"
              left={<TextInput.Icon icon="lock-check" />}
              right={
                <TextInput.Icon
                  icon={showConfirmPassword ? 'eye-off' : 'eye'}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                />
              }
              style={styles.input}
              error={!!error && password !== confirmPassword}
            />

            {error ? (
              <HelperText type="error" visible={!!error}>
                {error}
              </HelperText>
            ) : null}

            {success ? (
              <HelperText type="info" visible={!!success} style={{ color: theme.colors.secondary }}>
                {success}
              </HelperText>
            ) : null}

            <OnlineButton
              mode="contained"
              onPress={handleSignup}
              loading={loading}
              disabled={loading}
              style={styles.signupButton}
              contentStyle={styles.buttonContent}
              requiresOnline={true}
              offlineMessage="You need an internet connection to create an account"
            >
              Sign Up
            </OnlineButton>

            <Divider style={styles.divider} />

            <View style={styles.loginContainer}>
              <Text variant="bodyMedium">Already have an account? </Text>
              <Button
                mode="text"
                onPress={handleLogin}
                compact
                style={styles.loginButton}
              >
                Login
              </Button>
            </View>
          </View>
        </View>
      </ScrollView>
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
  signupButton: {
    marginTop: 16,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  divider: {
    marginVertical: 20,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  loginButton: {
    marginLeft: -8,
  },
});
