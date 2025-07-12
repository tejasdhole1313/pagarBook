import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  RefreshControl,
  TextInput,
  Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { fetchAttendanceHistory } from '../store/slices/attendanceSlice';
import { UI_CONFIG, DATE_FORMATS } from '../utils/constants';
import Toast from 'react-native-toast-message';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import DateTimePicker from '@react-native-community/datetimepicker';
type AttendanceHistoryScreenNavigationProp = StackNavigationProp<any, 'AttendanceHistory'>;

interface AttendanceRecord {
  _id: string;
  date: string;
  checkIn: string;
  checkOut?: string;
  totalHours?: number;
  status: 'present' | 'absent' | 'late' | 'early-leave';
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  notes?: string;
}

interface FilterOptions {
  startDate: Date | null;
  endDate: Date | null;
  status: string;
  searchQuery: string;
}

const AttendanceHistoryScreen: React.FC = () => {
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState<'start' | 'end'>('start');
  const [filters, setFilters] = useState<FilterOptions>({
    startDate: null,
    endDate: null,
    status: 'all',
    searchQuery: '',
  });

  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<AttendanceHistoryScreenNavigationProp>();
  const { user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    loadAttendanceHistory();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [attendanceHistory, filters]);

  const loadAttendanceHistory = async () => {
    setLoading(true);
    try {
      const response = await dispatch(fetchAttendanceHistory()).unwrap();
      setAttendanceHistory(response.data || []);
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to load attendance history',
      });
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAttendanceHistory();
    setRefreshing(false);
  };

  const applyFilters = () => {
    let filtered = [...attendanceHistory];

    // Apply date filters
    if (filters.startDate) {
      filtered = filtered.filter(record => 
        new Date(record.date) >= filters.startDate!
      );
    }
    if (filters.endDate) {
      filtered = filtered.filter(record => 
        new Date(record.date) <= filters.endDate!
      );
    }

    // Apply status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(record => record.status === filters.status);
    }

    // Apply search filter
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(record => 
        record.date.toLowerCase().includes(query) ||
        record.status.toLowerCase().includes(query) ||
        (record.notes && record.notes.toLowerCase().includes(query))
      );
    }

    setFilteredHistory(filtered);
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      if (datePickerMode === 'start') {
        setFilters(prev => ({ ...prev, startDate: selectedDate }));
      } else {
        setFilters(prev => ({ ...prev, endDate: selectedDate }));
      }
    }
  };

  const clearFilters = () => {
    setFilters({
      startDate: null,
      endDate: null,
      status: 'all',
      searchQuery: '',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return UI_CONFIG.SUCCESS_COLOR;
      case 'late':
        return UI_CONFIG.WARNING_COLOR;
      case 'absent':
        return UI_CONFIG.ERROR_COLOR;
      case 'early-leave':
        return UI_CONFIG.WARNING_COLOR;
      default:
        return UI_CONFIG.TEXT_SECONDARY;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return 'check-circle';
      case 'late':
        return 'schedule';
      case 'absent':
        return 'cancel';
      case 'early-leave':
        return 'exit-to-app';
      default:
        return 'help';
    }
  };

  const formatTime = (time: string) => {
    return new Date(time).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const renderFilterSection = () => (
    <View style={styles.filterContainer}>
      <View style={styles.filterHeader}>
        <Text style={styles.filterTitle}>Filters</Text>
        <TouchableOpacity onPress={() => setShowFilters(!showFilters)}>
          <Icon 
            name={showFilters ? 'expand-less' : 'expand-more'} 
            size={24} 
            color={UI_CONFIG.PRIMARY_COLOR} 
          />
        </TouchableOpacity>
      </View>

      {showFilters && (
        <View style={styles.filterContent}>
          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Date Range</Text>
            <View style={styles.dateButtons}>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => {
                  setDatePickerMode('start');
                  setShowDatePicker(true);
                }}
              >
                <Text style={styles.dateButtonText}>
                  {filters.startDate ? formatDate(filters.startDate.toISOString()) : 'Start Date'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => {
                  setDatePickerMode('end');
                  setShowDatePicker(true);
                }}
              >
                <Text style={styles.dateButtonText}>
                  {filters.endDate ? formatDate(filters.endDate.toISOString()) : 'End Date'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Status</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <TouchableOpacity
                style={[
                  styles.statusChip,
                  filters.status === 'all' && styles.statusChipActive
                ]}
                onPress={() => setFilters(prev => ({ ...prev, status: 'all' }))}
              >
                <Text style={[
                  styles.statusChipText,
                  filters.status === 'all' && styles.statusChipTextActive
                ]}>All</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.statusChip,
                  filters.status === 'present' && styles.statusChipActive
                ]}
                onPress={() => setFilters(prev => ({ ...prev, status: 'present' }))}
              >
                <Text style={[
                  styles.statusChipText,
                  filters.status === 'present' && styles.statusChipTextActive
                ]}>Present</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.statusChip,
                  filters.status === 'late' && styles.statusChipActive
                ]}
                onPress={() => setFilters(prev => ({ ...prev, status: 'late' }))}
              >
                <Text style={[
                  styles.statusChipText,
                  filters.status === 'late' && styles.statusChipTextActive
                ]}>Late</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.statusChip,
                  filters.status === 'absent' && styles.statusChipActive
                ]}
                onPress={() => setFilters(prev => ({ ...prev, status: 'absent' }))}
              >
                <Text style={[
                  styles.statusChipText,
                  filters.status === 'absent' && styles.statusChipTextActive
                ]}>Absent</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>

          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Search</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search by date, status, or notes..."
              value={filters.searchQuery}
              onChangeText={(text) => setFilters(prev => ({ ...prev, searchQuery: text }))}
            />
          </View>

          <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
            <Icon name="clear" size={16} color={UI_CONFIG.ERROR_COLOR} />
            <Text style={styles.clearButtonText}>Clear Filters</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderAttendanceItem = ({ item }: { item: AttendanceRecord }) => (
    <View style={styles.attendanceCard}>
      <View style={styles.attendanceHeader}>
        <View style={styles.dateContainer}>
          <Text style={styles.dateText}>{formatDate(item.date)}</Text>
          <Text style={styles.dayText}>
            {new Date(item.date).toLocaleDateString('en-US', { weekday: 'long' })}
          </Text>
        </View>
        <View style={[
          styles.statusBadge,
          { backgroundColor: getStatusColor(item.status) }
        ]}>
          <Icon name={getStatusIcon(item.status)} size={16} color="white" />
          <Text style={styles.statusText}>
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </Text>
        </View>
      </View>

      <View style={styles.attendanceDetails}>
        <View style={styles.timeRow}>
          <View style={styles.timeItem}>
            <Icon name="login" size={16} color={UI_CONFIG.SUCCESS_COLOR} />
            <Text style={styles.timeLabel}>Check In</Text>
            <Text style={styles.timeValue}>{formatTime(item.checkIn)}</Text>
          </View>
          {item.checkOut && (
            <View style={styles.timeItem}>
              <Icon name="logout" size={16} color={UI_CONFIG.ERROR_COLOR} />
              <Text style={styles.timeLabel}>Check Out</Text>
              <Text style={styles.timeValue}>{formatTime(item.checkOut)}</Text>
            </View>
          )}
          {item.totalHours && (
            <View style={styles.timeItem}>
              <Icon name="schedule" size={16} color={UI_CONFIG.PRIMARY_COLOR} />
              <Text style={styles.timeLabel}>Total Hours</Text>
              <Text style={styles.timeValue}>{item.totalHours}h</Text>
            </View>
          )}
        </View>

        {item.notes && (
          <View style={styles.notesContainer}>
            <Icon name="note" size={16} color={UI_CONFIG.TEXT_SECONDARY} />
            <Text style={styles.notesText}>{item.notes}</Text>
          </View>
        )}

        <View style={styles.locationContainer}>
          <Icon name="location-on" size={16} color={UI_CONFIG.TEXT_SECONDARY} />
          <Text style={styles.locationText}>
            {item.location.address || `${item.location.latitude.toFixed(4)}, ${item.location.longitude.toFixed(4)}`}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Icon name="schedule" size={60} color={UI_CONFIG.TEXT_SECONDARY} />
      <Text style={styles.emptyTitle}>No Attendance Records</Text>
      <Text style={styles.emptySubtitle}>
        {filters.startDate || filters.endDate || filters.status !== 'all' || filters.searchQuery
          ? 'No records match your current filters'
          : 'Your attendance history will appear here'}
      </Text>
      {filters.startDate || filters.endDate || filters.status !== 'all' || filters.searchQuery ? (
        <TouchableOpacity style={styles.clearFiltersButton} onPress={clearFilters}>
          <Text style={styles.clearFiltersButtonText}>Clear Filters</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color={UI_CONFIG.TEXT_PRIMARY} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Attendance History</Text>
        <TouchableOpacity onPress={() => setShowFilters(!showFilters)}>
          <Icon name="filter-list" size={24} color={UI_CONFIG.PRIMARY_COLOR} />
        </TouchableOpacity>
      </View>

      {renderFilterSection()}

      <FlatList
        data={filteredHistory}
        keyExtractor={(item) => item._id}
        renderItem={renderAttendanceItem}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />

      {showDatePicker && (
        <DateTimePicker
          value={datePickerMode === 'start' ? filters.startDate || new Date() : filters.endDate || new Date()}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: UI_CONFIG.BACKGROUND_COLOR,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: UI_CONFIG.CARD_BACKGROUND,
    borderBottomWidth: 1,
    borderBottomColor: UI_CONFIG.BORDER_COLOR,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: UI_CONFIG.TEXT_PRIMARY,
  },
  filterContainer: {
    backgroundColor: UI_CONFIG.CARD_BACKGROUND,
    borderBottomWidth: 1,
    borderBottomColor: UI_CONFIG.BORDER_COLOR,
  },
  filterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: UI_CONFIG.TEXT_PRIMARY,
  },
  filterContent: {
    padding: 15,
    paddingTop: 0,
  },
  filterRow: {
    marginBottom: 15,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: UI_CONFIG.TEXT_PRIMARY,
    marginBottom: 8,
  },
  dateButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateButton: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: UI_CONFIG.BORDER_COLOR,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  dateButtonText: {
    fontSize: 14,
    color: UI_CONFIG.TEXT_PRIMARY,
    textAlign: 'center',
  },
  statusChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: UI_CONFIG.BORDER_COLOR,
    marginRight: 8,
  },
  statusChipActive: {
    backgroundColor: UI_CONFIG.PRIMARY_COLOR,
    borderColor: UI_CONFIG.PRIMARY_COLOR,
  },
  statusChipText: {
    fontSize: 12,
    color: UI_CONFIG.TEXT_SECONDARY,
  },
  statusChipTextActive: {
    color: 'white',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: UI_CONFIG.BORDER_COLOR,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: UI_CONFIG.TEXT_PRIMARY,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  clearButtonText: {
    fontSize: 14,
    color: UI_CONFIG.ERROR_COLOR,
    marginLeft: 5,
  },
  listContainer: {
    padding: 15,
  },
  attendanceCard: {
    backgroundColor: UI_CONFIG.CARD_BACKGROUND,
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  attendanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  dateContainer: {
    flex: 1,
  },
  dateText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: UI_CONFIG.TEXT_PRIMARY,
  },
  dayText: {
    fontSize: 12,
    color: UI_CONFIG.TEXT_SECONDARY,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
    marginLeft: 4,
  },
  attendanceDetails: {
    gap: 10,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeItem: {
    alignItems: 'center',
    flex: 1,
  },
  timeLabel: {
    fontSize: 12,
    color: UI_CONFIG.TEXT_SECONDARY,
    marginTop: 4,
  },
  timeValue: {
    fontSize: 14,
    fontWeight: '600',
    color: UI_CONFIG.TEXT_PRIMARY,
    marginTop: 2,
  },
  notesContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 10,
    backgroundColor: UI_CONFIG.BACKGROUND_COLOR,
    borderRadius: 8,
  },
  notesText: {
    fontSize: 14,
    color: UI_CONFIG.TEXT_PRIMARY,
    marginLeft: 8,
    flex: 1,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 12,
    color: UI_CONFIG.TEXT_SECONDARY,
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: UI_CONFIG.TEXT_PRIMARY,
    marginTop: 20,
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 14,
    color: UI_CONFIG.TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: 20,
  },
  clearFiltersButton: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: UI_CONFIG.PRIMARY_COLOR,
    borderRadius: 8,
  },
  clearFiltersButtonText: {
    fontSize: 14,
    color: 'white',
    fontWeight: '600',
  },
});

export default AttendanceHistoryScreen; 