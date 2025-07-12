import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { fetchTodayAttendance } from '../store/slices/attendanceSlice';
import { fetchUserProfile } from '../store/slices/userSlice';
import { UI_CONFIG, ATTENDANCE_CONFIG } from '../utils/constants';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Toast from 'react-native-toast-message';

// Import other screens
import AttendanceScreen from './AttendanceScreen';
import ProfileScreen from './ProfileScreen';
import AdminScreen from './AdminScreen';

const Tab = createBottomTabNavigator();

const DashboardScreen: React.FC = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const { todayRecord } = useSelector((state: RootState) => state.attendance);
  const { profile } = useSelector((state: RootState) => state.user);

  useEffect(() => {
    dispatch(fetchTodayAttendance() as any);
    dispatch(fetchUserProfile() as any);
  }, [dispatch]);

  const handleQuickAttendance = (type: 'check-in' | 'check-out') => {
    Alert.alert(
      'Mark Attendance',
      `Are you sure you want to ${type === 'check-in' ? 'check in' : 'check out'}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Confirm',
          onPress: () => {
            // Navigate to attendance screen with pre-selected type
            // This will be handled by the attendance screen
          },
        },
      ]
    );
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getAttendanceStatus = () => {
    if (!todayRecord) {
      return { status: 'Not Marked', color: UI_CONFIG.WARNING_COLOR };
    }
    
    const now = new Date();
    const checkInTime = new Date(todayRecord.timestamp);
    const workStartTime = new Date();
    workStartTime.setHours(9, 0, 0, 0); // 9:00 AM
    
    if (checkInTime > workStartTime) {
      return { status: 'Late', color: UI_CONFIG.ERROR_COLOR };
    }
    
    return { status: 'On Time', color: UI_CONFIG.SUCCESS_COLOR };
  };

  const attendanceStatus = getAttendanceStatus();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>{getGreeting()}, {user?.name || 'User'}!</Text>
        <Text style={styles.date}>
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </Text>
      </View>

      <View style={styles.attendanceCard}>
        <Text style={styles.cardTitle}>Today's Attendance</Text>
        <View style={styles.attendanceInfo}>
          <View style={styles.statusContainer}>
            <View style={[styles.statusDot, { backgroundColor: attendanceStatus.color }]} />
            <Text style={[styles.statusText, { color: attendanceStatus.color }]}>
              {attendanceStatus.status}
            </Text>
          </View>
          {todayRecord && (
            <Text style={styles.timeText}>
              {new Date(todayRecord.timestamp).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.checkInButton]}
            onPress={() => handleQuickAttendance('check-in')}
          >
            <Icon name="login" size={24} color="white" />
            <Text style={styles.actionButtonText}>Check In</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.checkOutButton]}
            onPress={() => handleQuickAttendance('check-out')}
          >
            <Icon name="logout" size={24} color="white" />
            <Text style={styles.actionButtonText}>Check Out</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.statsCard}>
        <Text style={styles.sectionTitle}>This Week</Text>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>5</Text>
            <Text style={styles.statLabel}>Days Present</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>40</Text>
            <Text style={styles.statLabel}>Hours Worked</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Late Days</Text>
          </View>
        </View>
      </View>

      {!profile?.faceRegistered && (
        <View style={styles.faceRegistrationCard}>
          <Icon name="face" size={40} color={UI_CONFIG.WARNING_COLOR} />
          <Text style={styles.faceRegistrationTitle}>Face Registration Required</Text>
          <Text style={styles.faceRegistrationText}>
            Register your face to use face recognition for attendance
          </Text>
          <TouchableOpacity style={styles.faceRegistrationButton}>
            <Text style={styles.faceRegistrationButtonText}>Register Face</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};

const HomeScreen: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          if (route.name === 'Dashboard') {
            iconName = 'home';
          } else if (route.name === 'Attendance') {
            iconName = 'schedule';
          } else if (route.name === 'Profile') {
            iconName = 'person';
          } else if (route.name === 'Admin') {
            iconName = 'admin-panel-settings';
          } else {
            iconName = 'help-outline';
          }

          return <Icon name={iconName as any} size={size} color={color} />;
        },
        tabBarActiveTintColor: UI_CONFIG.PRIMARY_COLOR,
        tabBarInactiveTintColor: UI_CONFIG.TEXT_SECONDARY,
        tabBarStyle: {
          backgroundColor: UI_CONFIG.CARD_BACKGROUND,
          borderTopColor: UI_CONFIG.BORDER_COLOR,
          borderTopWidth: 1,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Attendance" component={AttendanceScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
      {user?.role === 'admin' && (
        <Tab.Screen name="Admin" component={AdminScreen} />
      )}
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: UI_CONFIG.BACKGROUND_COLOR,
  },
  header: {
    padding: 20,
    backgroundColor: UI_CONFIG.PRIMARY_COLOR,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  date: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  attendanceCard: {
    backgroundColor: UI_CONFIG.CARD_BACKGROUND,
    margin: 20,
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: UI_CONFIG.TEXT_PRIMARY,
    marginBottom: 15,
  },
  attendanceInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
  },
  timeText: {
    fontSize: 16,
    color: UI_CONFIG.TEXT_SECONDARY,
  },
  quickActions: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: UI_CONFIG.TEXT_PRIMARY,
    marginBottom: 15,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  checkInButton: {
    backgroundColor: UI_CONFIG.SUCCESS_COLOR,
  },
  checkOutButton: {
    backgroundColor: UI_CONFIG.ERROR_COLOR,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  statsCard: {
    backgroundColor: UI_CONFIG.CARD_BACKGROUND,
    margin: 20,
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: UI_CONFIG.PRIMARY_COLOR,
  },
  statLabel: {
    fontSize: 12,
    color: UI_CONFIG.TEXT_SECONDARY,
    marginTop: 5,
  },
  faceRegistrationCard: {
    backgroundColor: UI_CONFIG.CARD_BACKGROUND,
    margin: 20,
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  faceRegistrationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: UI_CONFIG.TEXT_PRIMARY,
    marginTop: 10,
    marginBottom: 5,
  },
  faceRegistrationText: {
    fontSize: 14,
    color: UI_CONFIG.TEXT_SECONDARY,
    textAlign: 'center',
    marginBottom: 15,
  },
  faceRegistrationButton: {
    backgroundColor: UI_CONFIG.WARNING_COLOR,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  faceRegistrationButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default HomeScreen; 