import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Surface, Card, useTheme, ProgressBar, Appbar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/src/store/authStore';
import firestoreService from '@/src/services/firestoreService';
import { useState, useEffect, useCallback } from 'react';
import { Subject, UserProfile } from '@/src/types/user';
import { useFocusEffect } from '@react-navigation/native';
import { ThemeSwitcher } from '@/src/components/ThemeSwitcher';
import VideoLoadingScreen from '@/src/components/VideoLoadingScreen';
import DonutChart from '@/src/components/DonutChart';

export default function DashboardScreen() {
  const theme = useTheme();
  const { user } = useAuthStore();
  const insets = useSafeAreaInsets();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const [subjectsList, userProfile] = await Promise.all([
        firestoreService.getSubjects(user.uid),
        firestoreService.getUserProfile(user.uid),
      ]);

      // Filter out invalid/blank subjects
      const validSubjects = subjectsList.filter(subject => {
        const name = subject.name?.toLowerCase()?.trim() || '';

        // Exclude empty names
        if (!name || name.length < 2) {
          console.log('Filtering out subject with invalid name:', subject);
          return false;
        }

        // Exclude breaks, lunch, etc.
        const invalidKeywords = [
          'break', 'lunch', 'recess', 'free', 'vacant', 'empty',
          'no class', 'holiday', 'off', '-', 'nil', 'na', 'n/a'
        ];

        if (invalidKeywords.some(keyword => name.includes(keyword))) {
          console.log('Filtering out invalid subject:', name);
          return false;
        }

        return true;
      });

      console.log(`Loaded ${subjectsList.length} subjects, filtered to ${validSubjects.length} valid subjects`);
      setSubjects(validSubjects);
      setProfile(userProfile);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Reload data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  // Pull to refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  // Calculate overall statistics
  const totalClasses = subjects.reduce((sum, s) => sum + (s.totalClasses || 0), 0);
  const attendedClasses = subjects.reduce((sum, s) => sum + (s.attendedClasses || 0), 0);
  const overallPercentage = totalClasses > 0 ? (attendedClasses / totalClasses) * 100 : 0;

  // Calculate how many classes can be bunked
  const minimumAttendance = profile?.minimumAttendance || 75;
  const canBunk = totalClasses > 0
    ? Math.floor((attendedClasses - (minimumAttendance / 100) * totalClasses) / (minimumAttendance / 100))
    : 0;

  // Calculate how many classes must be attended to reach minimum (when below minimum)
  const mustAttend = totalClasses > 0 && canBunk < 0
    ? Math.ceil(((minimumAttendance / 100) * totalClasses - attendedClasses) / (1 - minimumAttendance / 100))
    : 0;

  const getAttendanceColor = (percentage: number) => {
    if (percentage >= 85) return theme.colors.tertiary;
    if (percentage >= 75) return theme.colors.secondary;
    return theme.colors.error;
  };

  if (loading) {
    return <VideoLoadingScreen onFinish={() => setLoading(false)} />;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* App Bar */}
      <Appbar.Header
        elevated
        style={{ backgroundColor: theme.colors.surface }}
      >
        <MaterialCommunityIcons name="view-dashboard" size={24} color={theme.colors.primary} style={{ marginLeft: 16 }} />
        <Appbar.Content title="Bunk Manager" titleStyle={{ fontWeight: 'bold' }} />
        <View style={{ marginRight: 16 }}>
          <ThemeSwitcher />
        </View>
      </Appbar.Header>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 16 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      >
      {/* Header */}
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.greeting}>
          Welcome back, {user?.displayName?.split(' ')[0] || 'Student'}!
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Here's your attendance overview
        </Text>
      </View>

      {/* Overall Attendance Card */}
      {subjects.length > 0 ? (
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons
                name="chart-donut"
                size={32}
                color={theme.colors.primary}
              />
              <Text variant="titleLarge" style={styles.cardTitle}>
                Overall Attendance
              </Text>
            </View>
            <View style={styles.percentageContainer}>
              <Text variant="displayMedium" style={{ color: getAttendanceColor(overallPercentage) }}>
                {overallPercentage.toFixed(1)}%
              </Text>
            </View>
            <ProgressBar
              progress={overallPercentage / 100}
              color={getAttendanceColor(overallPercentage)}
              style={styles.progressBar}
            />
            <Text variant="bodySmall" style={styles.attendanceText}>
              {attendedClasses} classes attended out of {totalClasses}
            </Text>

            {/* Professional Donut Chart */}
            {totalClasses > 0 && (
              <View style={styles.chartContainer}>
                <Text variant="titleSmall" style={styles.chartTitle}>
                  Attendance Breakdown
                </Text>
                <DonutChart
                  attended={attendedClasses}
                  absent={totalClasses - attendedClasses}
                  percentage={overallPercentage}
                  size={200}
                  strokeWidth={35}
                />
              </View>
            )}
          </Card.Content>
        </Card>
      ) : (
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="book-off-outline" size={64} color={theme.colors.outline} />
              <Text variant="titleMedium" style={styles.emptyTitle}>
                No Subjects Added
              </Text>
              <Text variant="bodyMedium" style={styles.emptyText}>
                Add subjects in the Attendance tab to start tracking
              </Text>
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Quick Stats */}
      {subjects.length > 0 && (
        <View style={styles.statsContainer}>
          <Surface style={[styles.statCard, { backgroundColor: theme.colors.secondaryContainer }]}>
            <MaterialCommunityIcons
              name={canBunk >= 0 ? "check-circle" : "alert-circle"}
              size={32}
              color={canBunk >= 0 ? theme.colors.secondary : theme.colors.error}
            />
            <Text variant="headlineSmall" style={styles.statNumber}>
              {canBunk >= 0 ? canBunk : mustAttend}
            </Text>
            <Text variant="bodySmall" style={styles.statLabel}>
              {canBunk >= 0 ? 'Can Bunk' : 'Must Attend'}
            </Text>
          </Surface>

          <Surface style={[styles.statCard, { backgroundColor: theme.colors.tertiaryContainer }]}>
            <MaterialCommunityIcons name="book-multiple" size={32} color={theme.colors.tertiary} />
            <Text variant="headlineSmall" style={styles.statNumber}>
              {subjects.length}
            </Text>
            <Text variant="bodySmall" style={styles.statLabel}>
              Total Subjects
            </Text>
          </Surface>
        </View>
      )}

      {/* Subject-wise Charts */}
      {subjects.length > 0 && (
        <>
          <Text variant="titleLarge" style={styles.sectionTitle}>
            Subject-wise Attendance
          </Text>
          {subjects.map((subject) => (
            <Card key={subject.id} style={styles.card}>
              <Card.Content>
                <View style={styles.subjectHeader}>
                  <View style={styles.subjectInfo}>
                    <Text variant="titleMedium" style={styles.subjectName}>
                      {subject.name}
                    </Text>
                    {subject.code && (
                      <Text variant="bodySmall" style={styles.subjectCode}>
                        {subject.code}
                      </Text>
                    )}
                  </View>
                  <MaterialCommunityIcons
                    name={subject.attendancePercentage >= 85 ? 'check-circle' : subject.attendancePercentage >= 75 ? 'alert-circle' : 'close-circle'}
                    size={28}
                    color={getAttendanceColor(subject.attendancePercentage)}
                  />
                </View>

                {/* Subject Chart */}
                <DonutChart
                  attended={subject.attendedClasses}
                  absent={subject.totalClasses - subject.attendedClasses}
                  percentage={subject.attendancePercentage}
                  size={170}
                  strokeWidth={28}
                />
              </Card.Content>
            </Card>
          ))}
        </>
      )}
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
  header: {
    marginBottom: 24,
  },
  greeting: {
    fontWeight: 'bold',
  },
  subtitle: {
    marginTop: 4,
    opacity: 0.7,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    marginLeft: 12,
    fontWeight: 'bold',
  },
  percentageContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginVertical: 12,
  },
  attendanceText: {
    textAlign: 'center',
    opacity: 0.7,
  },
  chartContainer: {
    marginTop: 8,
  },
  chartTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
    opacity: 0.8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    padding: 16,
    marginHorizontal: 4,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
  },
  statNumber: {
    fontWeight: 'bold',
    marginTop: 8,
  },
  statLabel: {
    opacity: 0.7,
    marginTop: 4,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 16,
    marginTop: 8,
  },
  subjectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  subjectName: {
    fontWeight: 'bold',
  },
  subjectCode: {
    opacity: 0.6,
    marginTop: 2,
  },
  classItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  classTime: {
    width: 80,
    paddingTop: 2,
  },
  classDetails: {
    flex: 1,
  },
  classInfo: {
    marginTop: 4,
    opacity: 0.7,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    opacity: 0.7,
    textAlign: 'center',
  },
  subjectItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  subjectInfo: {
    flex: 1,
  },
  subjectStats: {
    marginTop: 4,
    opacity: 0.7,
  },
});
