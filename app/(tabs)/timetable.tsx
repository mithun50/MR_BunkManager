import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Surface, useTheme, Appbar } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TimetableScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header
        elevated
        style={{ backgroundColor: theme.colors.surface }}
      >
        <Appbar.Content title="Timetable" />
      </Appbar.Header>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 16 }]}
        showsVerticalScrollIndicator={false}
      >
        <Surface style={styles.surface}>
          <Text variant="headlineMedium">Class Schedule</Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            View your class timetable
          </Text>
        </Surface>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  surface: {
    padding: 20,
    borderRadius: 12,
    elevation: 2,
  },
  subtitle: {
    marginTop: 8,
    opacity: 0.7,
  },
});
