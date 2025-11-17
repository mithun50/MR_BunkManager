import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, Chip, useTheme, Appbar, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useAuthStore } from '@/src/store/authStore';
import firestoreService from '@/src/services/firestoreService';
import { TimetableEntry } from '@/src/types/user';
import { ThemeSwitcher } from '@/src/components/ThemeSwitcher';
import VideoLoadingScreen from '@/src/components/VideoLoadingScreen';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function TimetableScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadTimetable = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const timetableData = await firestoreService.getTimetable(user.uid);

      // Filter out invalid timetable entries
      const validTimetable = timetableData.filter(entry => {
        const subject = entry.subject?.toLowerCase()?.trim() || '';

        // Must have valid subject name
        if (!subject || subject.length < 2) {
          console.log('Filtering out invalid timetable entry:', entry);
          return false;
        }

        // Exclude breaks, lunch, etc.
        const invalidKeywords = [
          'break', 'lunch', 'recess', 'free', 'vacant', 'empty',
          'no class', 'holiday', 'off', '-', 'nil', 'na', 'n/a'
        ];

        if (invalidKeywords.some(keyword => subject.includes(keyword))) {
          console.log('Filtering out invalid subject from timetable:', subject);
          return false;
        }

        return true;
      });

      console.log(`Loaded ${timetableData.length} timetable entries, filtered to ${validTimetable.length} valid entries`);
      setTimetable(validTimetable);
    } catch (error) {
      console.error('Error loading timetable:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadTimetable();
    }, [loadTimetable])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadTimetable();
    setRefreshing(false);
  };

  const getClassesForDay = (day: string) => {
    return timetable
      .filter(entry => entry.day === day)
      .sort((a, b) => {
        // Sort by start time
        const timeA = convertTo24Hour(a.startTime);
        const timeB = convertTo24Hour(b.startTime);
        return timeA.localeCompare(timeB);
      });
  };

  const convertTo24Hour = (time: string) => {
    const [timePart, period] = time.split(' ');
    let [hours, minutes] = timePart.split(':');
    let hour = parseInt(hours);

    if (period === 'PM' && hour !== 12) hour += 12;
    if (period === 'AM' && hour === 12) hour = 0;

    return `${hour.toString().padStart(2, '0')}:${minutes}`;
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'lecture': return theme.colors.primary;
      case 'lab': return theme.colors.secondary;
      case 'tutorial': return theme.colors.tertiary;
      case 'practical': return theme.colors.error;
      case 'seminar': return '#9C27B0';
      default: return theme.colors.primary;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'lecture': return 'book-open-variant';
      case 'lab': return 'flask';
      case 'tutorial': return 'help-circle';
      case 'practical': return 'tools';
      case 'seminar': return 'presentation';
      default: return 'book';
    }
  };

  if (loading) {
    return <VideoLoadingScreen onFinish={() => setLoading(false)} />;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header elevated style={{ backgroundColor: theme.colors.surface }}>
        <MaterialCommunityIcons name="calendar-clock" size={24} color={theme.colors.primary} style={{ marginLeft: 16 }} />
        <Appbar.Content title="My Timetable" titleStyle={{ fontWeight: 'bold' }} />
        <View style={{ marginRight: 16 }}>
          <ThemeSwitcher />
        </View>
      </Appbar.Header>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 16 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {timetable.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content style={styles.emptyContent}>
              <MaterialCommunityIcons name="calendar-blank" size={64} color={theme.colors.outline} />
              <Text variant="titleMedium" style={styles.emptyTitle}>
                No Timetable Found
              </Text>
              <Text variant="bodyMedium" style={styles.emptyText}>
                Your class schedule will appear here once added
              </Text>
            </Card.Content>
          </Card>
        ) : (
          DAYS.map(day => {
            const dayClasses = getClassesForDay(day);
            if (dayClasses.length === 0) return null;

            return (
              <View key={day} style={styles.dayContainer}>
                <Text variant="titleLarge" style={styles.dayTitle}>
                  {day}
                </Text>
                <Divider style={styles.divider} />
                {dayClasses.map((classEntry, index) => (
                  <Card key={`${classEntry.id}-${index}`} style={styles.classCard}>
                    <Card.Content>
                      <View style={styles.classHeader}>
                        <View style={styles.timeContainer}>
                          <MaterialCommunityIcons name="clock-outline" size={16} color={theme.colors.primary} />
                          <Text variant="titleSmall" style={styles.timeText}>
                            {classEntry.startTime} - {classEntry.endTime}
                          </Text>
                        </View>
                        <Chip
                          mode="flat"
                          compact
                          icon={getTypeIcon(classEntry.type)}
                          style={[styles.typeChip, { backgroundColor: getTypeColor(classEntry.type) + '20' }]}
                          textStyle={{ color: getTypeColor(classEntry.type) }}
                        >
                          {classEntry.type}
                        </Chip>
                      </View>

                      <Text variant="titleMedium" style={styles.subjectName}>
                        {classEntry.subject}
                      </Text>

                      {classEntry.subjectCode && (
                        <Text variant="bodySmall" style={styles.subjectCode}>
                          {classEntry.subjectCode}
                        </Text>
                      )}

                      <View style={styles.detailsContainer}>
                        {classEntry.faculty && (
                          <View style={styles.detailRow}>
                            <MaterialCommunityIcons name="account-tie" size={16} color={theme.colors.onSurface} style={{ opacity: 0.7 }} />
                            <Text variant="bodySmall" style={styles.detailText}>
                              {classEntry.faculty}
                            </Text>
                          </View>
                        )}
                        {classEntry.room && (
                          <View style={styles.detailRow}>
                            <MaterialCommunityIcons name="map-marker" size={16} color={theme.colors.onSurface} style={{ opacity: 0.7 }} />
                            <Text variant="bodySmall" style={styles.detailText}>
                              {classEntry.room}
                            </Text>
                          </View>
                        )}
                      </View>
                    </Card.Content>
                  </Card>
                ))}
              </View>
            );
          })
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyCard: {
    marginTop: 40,
  },
  emptyContent: {
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
  dayContainer: {
    marginBottom: 24,
  },
  dayTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  divider: {
    marginBottom: 12,
  },
  classCard: {
    marginBottom: 12,
    elevation: 2,
  },
  classHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeText: {
    fontWeight: '600',
  },
  typeChip: {
    height: 28,
  },
  subjectName: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subjectCode: {
    opacity: 0.7,
    marginBottom: 8,
  },
  detailsContainer: {
    gap: 6,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    opacity: 0.7,
  },
});
