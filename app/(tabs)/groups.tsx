import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Surface, useTheme, Appbar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemeSwitcher } from '@/src/components/ThemeSwitcher';

export default function GroupsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header
        elevated
        style={{ backgroundColor: theme.colors.surface }}
      >
        <MaterialCommunityIcons name="account-group" size={24} color={theme.colors.primary} style={{ marginLeft: 16 }} />
        <Appbar.Content title="Class Groups" titleStyle={{ fontWeight: 'bold' }} />
        <View style={{ marginRight: 16 }}>
          <ThemeSwitcher />
        </View>
      </Appbar.Header>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 16 }]}
        showsVerticalScrollIndicator={false}
      >
        <Surface style={styles.surface}>
          <Text variant="headlineMedium">Class Groups</Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Collaborate with your classmates
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
