import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import {
  Text,
  Card,
  Chip,
  useTheme,
  Appbar,
  Divider,
  Portal,
  Modal,
  SegmentedButtons,
  TextInput,
  Button,
  IconButton,
} from 'react-native-paper';
import Calendar from 'react-native-calendars/src/calendar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useAuthStore } from '@/src/store/authStore';
import firestoreService from '@/src/services/firestoreService';
import { TimetableEntry, Subject } from '@/src/types/user';
import { ThemeSwitcher } from '@/src/components/ThemeSwitcher';
import VideoLoadingScreen from '@/src/components/VideoLoadingScreen';
import OnlineButton from '@/src/components/OnlineButton';
import { useResponsive } from '@/src/hooks/useResponsive';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function TimetableScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const {
    isWeb,
    isMobile,
    isTablet,
    isDesktop,
    isLargeDesktop,
    containerPadding,
    contentMaxWidth,
    modalWidth,
  } = useResponsive();
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Mark attendance modal state
  const [showMarkModal, setShowMarkModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState<TimetableEntry | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [attendanceStatus, setAttendanceStatus] = useState<'present' | 'absent' | 'leave'>('present');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [markedDates, setMarkedDates] = useState<any>({});

  const loadData = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const [timetableData, subjectsList] = await Promise.all([
        firestoreService.getTimetable(user.uid),
        firestoreService.getSubjects(user.uid),
      ]);

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
      setSubjects(subjectsList);
    } catch (error) {
      console.error('Error loading timetable:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
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

  const handleMarkAttendanceClick = async (classEntry: TimetableEntry) => {
    // Find the matching subject
    const matchingSubject = subjects.find(s =>
      s.name.toLowerCase().trim() === classEntry.subject.toLowerCase().trim()
    );

    if (!matchingSubject) {
      alert('Subject not found. Please add this subject to your attendance tracking first.');
      return;
    }

    setSelectedClass(classEntry);
    setSelectedSubject(matchingSubject);
    setShowMarkModal(true);
    await loadAttendanceDates(matchingSubject.id);
  };

  const loadAttendanceDates = async (subjectId: string) => {
    if (!user) return;

    try {
      // Get all attendance records for this subject
      const records = await firestoreService.getAttendanceRecords(user.uid);
      const subjectRecords = records.filter(r => r.subjectId === subjectId);

      // Create marked dates object
      const marked: any = {};

      subjectRecords.forEach(record => {
        const dateStr = record.date.toISOString().split('T')[0];
        marked[dateStr] = {
          marked: true,
          dotColor:
            record.status === 'present' ? theme.colors.tertiary :
            record.status === 'absent' ? theme.colors.error :
            theme.colors.secondary,
        };
      });

      // Mark all Sundays in red
      const today = new Date();
      const startDate = new Date(today.getFullYear(), today.getMonth() - 2, 1);
      const endDate = new Date(today.getFullYear(), today.getMonth() + 2, 0);

      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        if (d.getDay() === 0) { // Sunday
          const dateStr = d.toISOString().split('T')[0];
          marked[dateStr] = {
            ...marked[dateStr],
            textColor: '#EF5350',
            disabled: true,
            disableTouchEvent: true,
            customStyles: {
              text: {
                color: '#EF5350',
                fontWeight: 'bold',
              },
            },
          };
        }
      }

      // Add selected date highlighting
      if (selectedDate) {
        marked[selectedDate] = {
          ...marked[selectedDate],
          selected: true,
          selectedColor: theme.colors.primary,
        };
      }

      setMarkedDates(marked);
    } catch (error) {
      console.error('Error loading attendance dates:', error);
    }
  };

  const handleMarkAttendance = async () => {
    if (!user || !selectedSubject) return;

    try {
      // Check if attendance already marked for this subject on this date
      const exists = await firestoreService.checkAttendanceExists(
        user.uid,
        selectedSubject.id,
        new Date(selectedDate)
      );

      if (exists) {
        alert('Attendance already marked for this subject on this date!');
        return;
      }

      const attended = attendanceStatus === 'present';
      const isLeave = attendanceStatus === 'leave';

      // Update subject attendance (leave days don't count)
      await firestoreService.updateSubjectAttendance(user.uid, selectedSubject.id, attended, isLeave);

      // Add attendance record
      const record: any = {
        id: `attendance_${Date.now()}`,
        subjectId: selectedSubject.id,
        date: new Date(selectedDate),
        status: attendanceStatus,
      };

      // Only add notes if they exist
      if (notes.trim()) {
        record.notes = notes.trim();
      }

      await firestoreService.addAttendanceRecord(user.uid, record);

      // Reload data
      await loadData();
      if (selectedSubject) {
        await loadAttendanceDates(selectedSubject.id);
      }

      // Reset form
      setAttendanceStatus('present');
      setNotes('');
      setSelectedDate(new Date().toISOString().split('T')[0]);
      setShowMarkModal(false);
      setSelectedClass(null);
      setSelectedSubject(null);
    } catch (error) {
      console.error('Error marking attendance:', error);
      alert('Failed to mark attendance. Please try again.');
    }
  };

  if (loading) {
    return <VideoLoadingScreen onFinish={() => setLoading(false)} />;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header elevated style={{ backgroundColor: theme.colors.surface }}>
        <MaterialCommunityIcons name="calendar-clock" size={24} color={theme.colors.primary} style={{ marginLeft: 16 }} />
        <Appbar.Content title="Timetable & Attendance" titleStyle={{ fontWeight: 'bold' }} />
        <View style={{ marginRight: 16 }}>
          <ThemeSwitcher />
        </View>
      </Appbar.Header>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={[
          styles.content,
          {
            paddingBottom: insets.bottom + 16,
            paddingHorizontal: containerPadding,
            maxWidth: contentMaxWidth,
            alignSelf: 'center',
            width: '100%',
          }
        ]}
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
          <View style={[
            styles.daysGrid,
            (isTablet || isDesktop) && styles.daysGridWide,
            isLargeDesktop && styles.daysGridVeryWide,
          ]}>
          {DAYS.map(day => {
            const dayClasses = getClassesForDay(day);
            if (dayClasses.length === 0) return null;

            return (
              <View key={day} style={[
                styles.dayContainer,
                (isTablet || isDesktop) && styles.dayContainerWide,
                isLargeDesktop && styles.dayContainerVeryWide,
              ]}>
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

                      {/* Mark Attendance Button */}
                      <Button
                        mode="contained"
                        icon="calendar-check"
                        onPress={() => handleMarkAttendanceClick(classEntry)}
                        style={styles.markButton}
                        compact
                      >
                        Mark Attendance
                      </Button>
                    </Card.Content>
                  </Card>
                ))}
              </View>
            );
          })}
          </View>
        )}
      </ScrollView>

      {/* Mark Attendance Modal */}
      <Portal>
        <Modal
          visible={showMarkModal}
          onDismiss={() => {
            setShowMarkModal(false);
            setSelectedClass(null);
            setSelectedSubject(null);
          }}
          contentContainerStyle={[
            styles.modal,
            {
              backgroundColor: theme.colors.surface,
              width: modalWidth,
              maxWidth: isDesktop ? 600 : 500,
            }
          ]}
          style={isWeb ? styles.webModalOverlay : undefined}
        >
          <Text variant="headlineSmall" style={styles.modalTitle}>
            Mark Attendance
          </Text>

          {selectedClass && selectedSubject && (
            <>
              <Text variant="titleMedium" style={styles.selectedSubject}>
                {selectedClass.subject}
              </Text>
              <Text variant="bodySmall" style={styles.classDetails}>
                {selectedClass.startTime} - {selectedClass.endTime} • {selectedClass.type}
              </Text>

              {/* Calendar */}
              <Calendar
                current={selectedDate}
                onDayPress={(day) => {
                  // Check if it's a Sunday
                  const selectedDateObj = new Date(day.dateString);
                  const isSunday = selectedDateObj.getDay() === 0;

                  // Don't allow selecting Sundays
                  if (isSunday) {
                    return;
                  }

                  // Only allow selecting today or past dates
                  const today = new Date();
                  today.setHours(23, 59, 59, 999);

                  if (selectedDateObj <= today) {
                    setSelectedDate(day.dateString);

                    // Update marked dates
                    const updatedMarkedDates: any = {};

                    Object.keys(markedDates).forEach(date => {
                      const dateProps: any = {};

                      if (markedDates[date].marked) {
                        dateProps.marked = true;
                        dateProps.dotColor = markedDates[date].dotColor;
                      }

                      if (markedDates[date].textColor) {
                        dateProps.textColor = markedDates[date].textColor;
                      }

                      if (markedDates[date].customStyles) {
                        dateProps.customStyles = markedDates[date].customStyles;
                      }

                      if (markedDates[date].disabled) {
                        dateProps.disabled = true;
                        dateProps.disableTouchEvent = true;
                      }

                      updatedMarkedDates[date] = dateProps;
                    });

                    // Add new selection
                    updatedMarkedDates[day.dateString] = {
                      ...updatedMarkedDates[day.dateString],
                      selected: true,
                      selectedColor: theme.colors.primary,
                    };

                    setMarkedDates(updatedMarkedDates);
                  }
                }}
                maxDate={new Date().toISOString().split('T')[0]}
                markedDates={markedDates}
                theme={{
                  backgroundColor: theme.dark ? '#1E1E1E' : '#ffffff',
                  calendarBackground: theme.dark ? '#1E1E1E' : '#ffffff',
                  textSectionTitleColor: theme.dark ? '#BEBEBE' : '#2d4150',
                  selectedDayBackgroundColor: theme.colors.primary,
                  selectedDayTextColor: theme.dark ? '#000000' : '#ffffff',
                  todayTextColor: theme.colors.primary,
                  dayTextColor: theme.dark ? '#E1E1E1' : '#2d4150',
                  textDisabledColor: theme.dark ? '#424242' : '#d9d9d9',
                  dotColor: theme.colors.primary,
                  selectedDotColor: theme.dark ? '#000000' : '#ffffff',
                  arrowColor: theme.colors.primary,
                  monthTextColor: theme.dark ? '#E1E1E1' : '#2d4150',
                  indicatorColor: theme.colors.primary,
                  textDayFontWeight: '400',
                  textMonthFontWeight: 'bold',
                  textDayHeaderFontWeight: '600',
                  textDayFontSize: 14,
                  textMonthFontSize: 16,
                  textDayHeaderFontSize: 12,
                }}
                style={styles.calendar}
              />

              <Divider style={styles.modalDivider} />

              {/* Status Selection */}
              <Text variant="titleSmall" style={styles.label}>
                Attendance Status
              </Text>
              <SegmentedButtons
                value={attendanceStatus}
                onValueChange={(value) => setAttendanceStatus(value as any)}
                buttons={[
                  {
                    value: 'present',
                    label: 'Present',
                    icon: 'check-circle',
                  },
                  {
                    value: 'absent',
                    label: 'Absent',
                    icon: 'close-circle',
                  },
                  {
                    value: 'leave',
                    label: 'Leave',
                    icon: 'medical-bag',
                  },
                ]}
                style={styles.segmentedButtons}
              />

              {/* Notes */}
              <TextInput
                label="Notes (Optional)"
                value={notes}
                onChangeText={setNotes}
                mode="outlined"
                multiline
                numberOfLines={2}
                style={styles.input}
                placeholder="Add any notes..."
              />

              <View style={styles.modalButtons}>
                <Button
                  mode="outlined"
                  onPress={() => {
                    setShowMarkModal(false);
                    setSelectedClass(null);
                    setSelectedSubject(null);
                  }}
                  style={styles.modalButton}
                >
                  Cancel
                </Button>
                <OnlineButton
                  mode="contained"
                  onPress={handleMarkAttendance}
                  style={styles.modalButton}
                  requiresOnline={true}
                  offlineMessage="You need internet connection to save attendance"
                >
                  Save
                </OnlineButton>
              </View>
            </>
          )}
        </Modal>
      </Portal>
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
  daysGrid: {
    flexDirection: 'column',
  },
  daysGridWide: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
    justifyContent: 'flex-start',
  },
  daysGridVeryWide: {
    gap: 24,
  },
  dayContainer: {
    marginBottom: 24,
  },
  dayContainerWide: {
    width: '48%',
    minWidth: 320,
  },
  dayContainerVeryWide: {
    width: '31%',
    minWidth: 300,
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
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    opacity: 0.7,
  },
  markButton: {
    marginTop: 8,
  },
  modal: {
    margin: 20,
    padding: 20,
    borderRadius: 12,
    maxHeight: '90%',
  },
  modalTitle: {
    fontWeight: 'bold',
    marginBottom: 16,
  },
  selectedSubject: {
    marginBottom: 4,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  classDetails: {
    marginBottom: 16,
    textAlign: 'center',
    opacity: 0.7,
  },
  calendar: {
    marginBottom: 16,
    borderRadius: 8,
  },
  modalDivider: {
    marginVertical: 16,
  },
  label: {
    marginBottom: 8,
  },
  segmentedButtons: {
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 16,
  },
  modalButton: {
    flex: 1,
  },
  webModalOverlay: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
});
