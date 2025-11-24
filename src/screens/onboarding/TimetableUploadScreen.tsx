import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, useTheme, Card } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface TimetableUploadScreenProps {
  onManual: () => void;
  onSkip: () => void;
}

export default function TimetableUploadScreen({ onManual, onSkip }: TimetableUploadScreenProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <MaterialCommunityIcons name="timetable" size={64} color={theme.colors.primary} />
        <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.primary }]}>
          Add Your Timetable
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Add your class schedule manually for best accuracy
        </Text>
      </View>

      {/* Manual Entry Card */}
      <Card style={styles.mainCard}>
        <Card.Content style={styles.cardContent}>
          <MaterialCommunityIcons name="pencil" size={64} color={theme.colors.primary} />
          <Text variant="titleLarge" style={[styles.cardTitle, { color: theme.colors.primary }]}>
            Manual Entry
          </Text>
          <Text variant="bodyMedium" style={styles.cardDescription}>
            Add your classes one by one with complete control over all details
          </Text>

          <View style={styles.benefitsList}>
            <View style={styles.benefitItem}>
              <MaterialCommunityIcons name="check-circle" size={20} color={theme.colors.primary} />
              <Text variant="bodyMedium" style={styles.benefitText}>
                100% accurate schedule
              </Text>
            </View>
            <View style={styles.benefitItem}>
              <MaterialCommunityIcons name="check-circle" size={20} color={theme.colors.primary} />
              <Text variant="bodyMedium" style={styles.benefitText}>
                Add faculty names and room numbers
              </Text>
            </View>
            <View style={styles.benefitItem}>
              <MaterialCommunityIcons name="check-circle" size={20} color={theme.colors.primary} />
              <Text variant="bodyMedium" style={styles.benefitText}>
                Edit anytime from Profile settings
              </Text>
            </View>
            <View style={styles.benefitItem}>
              <MaterialCommunityIcons name="check-circle" size={20} color={theme.colors.primary} />
              <Text variant="bodyMedium" style={styles.benefitText}>
                No errors from image quality
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Action Buttons */}
      <Button
        mode="contained"
        onPress={onManual}
        style={styles.manualButton}
        contentStyle={styles.buttonContent}
        icon="calendar-plus"
      >
        Add Classes Manually
      </Button>

      <Button mode="outlined" onPress={onSkip} style={styles.skipButton}>
        Skip for now (Add later from Profile)
      </Button>

      {/* Info Card */}
      <Card style={styles.infoCard} mode="outlined">
        <Card.Content>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="information" size={20} color={theme.colors.primary} />
            <Text variant="bodySmall" style={styles.infoText}>
              You can always add or edit your timetable later from Profile → Manage Timetable
            </Text>
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 24,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    opacity: 0.7,
    textAlign: 'center',
  },
  mainCard: {
    elevation: 3,
    marginBottom: 24,
  },
  cardContent: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  cardTitle: {
    marginTop: 16,
    marginBottom: 8,
    fontWeight: 'bold',
  },
  cardDescription: {
    textAlign: 'center',
    opacity: 0.8,
    marginBottom: 24,
  },
  benefitsList: {
    width: '100%',
    gap: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  benefitText: {
    flex: 1,
    opacity: 0.8,
  },
  manualButton: {
    marginBottom: 12,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  skipButton: {
    marginBottom: 24,
  },
  infoCard: {
    borderStyle: 'dashed',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoText: {
    flex: 1,
    opacity: 0.7,
  },
});
