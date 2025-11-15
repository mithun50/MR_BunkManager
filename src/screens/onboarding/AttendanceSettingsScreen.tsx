import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, useTheme, RadioButton, Card } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface AttendanceSettingsScreenProps {
  onComplete: (minimumAttendance: number) => void;
}

const ATTENDANCE_OPTIONS = [
  { value: 75, label: '75%', description: 'Standard requirement' },
  { value: 80, label: '80%', description: 'Moderate requirement' },
  { value: 85, label: '85%', description: 'High requirement' },
  { value: 90, label: '90%', description: 'Very high requirement' },
  { value: 100, label: 'Custom', description: 'Set your own percentage' },
];

export default function AttendanceSettingsScreen({ onComplete }: AttendanceSettingsScreenProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [selectedPercentage, setSelectedPercentage] = useState(75);

  const handleComplete = () => {
    onComplete(selectedPercentage);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <MaterialCommunityIcons name="percent" size={64} color={theme.colors.primary} />
        <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.primary }]}>
          Minimum Attendance
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Set your required attendance percentage
        </Text>
      </View>

      {/* Options */}
      <View style={styles.options}>
        {ATTENDANCE_OPTIONS.map((option) => (
          <Card
            key={option.value}
            style={[
              styles.optionCard,
              selectedPercentage === option.value && {
                backgroundColor: theme.colors.primaryContainer,
                borderColor: theme.colors.primary,
                borderWidth: 2,
              },
            ]}
            onPress={() => setSelectedPercentage(option.value)}
          >
            <Card.Content style={styles.optionContent}>
              <View style={styles.optionLeft}>
                <RadioButton
                  value={option.value.toString()}
                  status={selectedPercentage === option.value ? 'checked' : 'unchecked'}
                  onPress={() => setSelectedPercentage(option.value)}
                />
                <View style={styles.optionText}>
                  <Text variant="titleLarge" style={styles.optionLabel}>
                    {option.label}
                  </Text>
                  <Text variant="bodySmall" style={styles.optionDescription}>
                    {option.description}
                  </Text>
                </View>
              </View>
              {selectedPercentage === option.value && (
                <MaterialCommunityIcons name="check-circle" size={24} color={theme.colors.primary} />
              )}
            </Card.Content>
          </Card>
        ))}
      </View>

      {/* Info Card */}
      <Card style={[styles.infoCard, { backgroundColor: theme.colors.secondaryContainer }]}>
        <Card.Content>
          <View style={styles.infoHeader}>
            <MaterialCommunityIcons name="information" size={24} color={theme.colors.secondary} />
            <Text variant="titleMedium" style={{ color: theme.colors.secondary, marginLeft: 8 }}>
              How this works
            </Text>
          </View>
          <Text variant="bodyMedium" style={styles.infoText}>
            We'll use this percentage to calculate:
          </Text>
          <View style={styles.infoList}>
            <Text variant="bodyMedium">• How many classes you can safely bunk</Text>
            <Text variant="bodyMedium">• How many classes you need to attend</Text>
            <Text variant="bodyMedium">• When your attendance is in danger zone</Text>
          </View>
        </Card.Content>
      </Card>

      {/* Continue Button */}
      <Button
        mode="contained"
        onPress={handleComplete}
        style={styles.button}
        contentStyle={styles.buttonContent}
        icon="check"
      >
        Complete Setup
      </Button>
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
  options: {
    gap: 12,
    marginBottom: 24,
  },
  optionCard: {
    elevation: 2,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionText: {
    marginLeft: 8,
    flex: 1,
  },
  optionLabel: {
    fontWeight: 'bold',
  },
  optionDescription: {
    marginTop: 2,
    opacity: 0.7,
  },
  infoCard: {
    marginBottom: 24,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    marginBottom: 8,
  },
  infoList: {
    marginLeft: 8,
    gap: 4,
  },
  button: {
    marginTop: 8,
  },
  buttonContent: {
    paddingVertical: 8,
  },
});
