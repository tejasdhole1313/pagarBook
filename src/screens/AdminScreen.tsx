import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  RefreshControl,
  FlatList,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { fetchAdminStats, fetchAllUsers, fetchAttendanceReports } from '../store/slices/userSlice';
import { UI_CONFIG, SUCCESS_MESSAGES } from '../utils/constants';
import Toast from 'react-native-toast-message';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

type AdminScreenNavigationProp = StackNavigationProp<any, 'Admin'>;

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalAttendance: number;
  todayAttendance: number;
  pendingApprovals: number;
}

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  isActive: boolean;
  lastLogin: string;
}

const AdminScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalAttendance: 0,
    todayAttendance: 0,
    pendingApprovals: 0,
  });
  const [users, setUsers] = useState<User[]>([]);

  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<AdminScreenNavigationProp>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { loading } = useSelector((state: RootState) => state.user);

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      await dispatch(fetchAdminStats());
      await dispatch(fetchAllUsers());
      await dispatch(fetchAttendanceReports());
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load admin data',
      });
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAdminData();
    setRefreshing(false);
  };

  const handleUserAction = (userId: string, action: string) => {
    Alert.alert(
      'Confirm Action',
      `Are you sure you want to ${action} this user?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: action === 'delete' ? 'destructive' : 'default',
          onPress: () => {
            // Implement user action logic
            Toast.show({
              type: 'success',
              text1: 'Success',
              text2: `User ${action}ed successfully`,
            });
          },
        },
      ]
    );
  };

  const handleExportData = () => {
    Alert.alert('Export Data', 'Export functionality will be implemented');
  };

  const handleSystemSettings = () => {
    Alert.alert('System Settings', 'Settings functionality will be implemented');
  };

  const renderOverviewTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Icon name="people" size={30} color={UI_CONFIG.PRIMARY_COLOR} />
          <Text style={styles.statNumber}>{stats.totalUsers}</Text>
          <Text style={styles.statLabel}>Total Users</Text>
        </View>
        <View style={styles.statCard}>
          <Icon name="check-circle" size={30} color={UI_CONFIG.SUCCESS_COLOR} />
          <Text style={styles.statNumber}>{stats.activeUsers}</Text>
          <Text style={styles.statLabel}>Active Users</Text>
        </View>
        <View style={styles.statCard}>
          <Icon name="schedule" size={30} color={UI_CONFIG.WARNING_COLOR} />
          <Text style={styles.statNumber}>{stats.totalAttendance}</Text>
          <Text style={styles.statLabel}>Total Attendance</Text>
        </View>
        <View style={styles.statCard}>
          <Icon name="today" size={30} color={UI_CONFIG.INFO_COLOR} />
          <Text style={styles.statNumber}>{stats.todayAttendance}</Text>
          <Text style={styles.statLabel}>Today's Attendance</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionGrid}>
          <TouchableOpacity style={styles.actionCard} onPress={() => setActiveTab('users')}>
            <Icon name="people" size={24} color={UI_CONFIG.PRIMARY_COLOR} />
            <Text style={styles.actionText}>Manage Users</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={() => setActiveTab('reports')}>
            <Icon name="assessment" size={24} color={UI_CONFIG.PRIMARY_COLOR} />
            <Text style={styles.actionText}>View Reports</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={handleExportData}>
            <Icon name="file-download" size={24} color={UI_CONFIG.PRIMARY_COLOR} />
            <Text style={styles.actionText}>Export Data</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={handleSystemSettings}>
            <Icon name="settings" size={24} color={UI_CONFIG.PRIMARY_COLOR} />
            <Text style={styles.actionText}>Settings</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <View style={styles.activityCard}>
          <View style={styles.activityItem}>
            <Icon name="login" size={20} color={UI_CONFIG.SUCCESS_COLOR} />
            <Text style={styles.activityText}>John Doe logged in</Text>
            <Text style={styles.activityTime}>2 min ago</Text>
          </View>
          <View style={styles.activityItem}>
            <Icon name="schedule" size={20} color={UI_CONFIG.PRIMARY_COLOR} />
            <Text style={styles.activityText}>Jane Smith marked attendance</Text>
            <Text style={styles.activityTime}>5 min ago</Text>
          </View>
          <View style={styles.activityItem}>
            <Icon name="person-add" size={20} color={UI_CONFIG.INFO_COLOR} />
            <Text style={styles.activityText}>New user registered</Text>
            <Text style={styles.activityTime}>10 min ago</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  const renderUsersTab = () => (
    <View style={styles.tabContent}>
      <FlatList
        data={users}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <View style={styles.userCard}>
            <View style={styles.userInfo}>
              <View style={styles.userAvatar}>
                <Icon name="person" size={24} color={UI_CONFIG.TEXT_SECONDARY} />
              </View>
              <View style={styles.userDetails}>
                <Text style={styles.userName}>{item.name}</Text>
                <Text style={styles.userEmail}>{item.email}</Text>
                <Text style={styles.userRole}>{item.role} • {item.department}</Text>
              </View>
              <View style={[
                styles.userStatus,
                { backgroundColor: item.isActive ? UI_CONFIG.SUCCESS_COLOR : UI_CONFIG.ERROR_COLOR }
              ]}>
                <Text style={styles.userStatusText}>
                  {item.isActive ? 'Active' : 'Inactive'}
                </Text>
              </View>
            </View>
            <View style={styles.userActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleUserAction(item._id, 'edit')}
              >
                <Icon name="edit" size={16} color={UI_CONFIG.PRIMARY_COLOR} />
                <Text style={styles.actionButtonText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.actionButtonDanger]}
                onPress={() => handleUserAction(item._id, 'delete')}
              >
                <Icon name="delete" size={16} color={UI_CONFIG.ERROR_COLOR} />
                <Text style={[styles.actionButtonText, { color: UI_CONFIG.ERROR_COLOR }]}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </View>
  );

  const renderReportsTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Attendance Reports</Text>
        <View style={styles.reportCard}>
          <View style={styles.reportHeader}>
            <Text style={styles.reportTitle}>Monthly Attendance Report</Text>
            <TouchableOpacity style={styles.exportButton}>
              <Icon name="file-download" size={20} color={UI_CONFIG.PRIMARY_COLOR} />
            </TouchableOpacity>
          </View>
          <View style={styles.reportStats}>
            <View style={styles.reportStat}>
              <Text style={styles.reportStatNumber}>95%</Text>
              <Text style={styles.reportStatLabel}>Attendance Rate</Text>
            </View>
            <View style={styles.reportStat}>
              <Text style={styles.reportStatNumber}>22</Text>
              <Text style={styles.reportStatLabel}>Working Days</Text>
            </View>
            <View style={styles.reportStat}>
              <Text style={styles.reportStatNumber}>3</Text>
              <Text style={styles.reportStatLabel}>Late Days</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Department Statistics</Text>
        <View style={styles.departmentCard}>
          <View style={styles.departmentItem}>
            <Text style={styles.departmentName}>Engineering</Text>
            <Text style={styles.departmentCount}>15 employees</Text>
            <Text style={styles.departmentAttendance}>98% attendance</Text>
          </View>
          <View style={styles.departmentItem}>
            <Text style={styles.departmentName}>Sales</Text>
            <Text style={styles.departmentCount}>8 employees</Text>
            <Text style={styles.departmentAttendance}>92% attendance</Text>
          </View>
          <View style={styles.departmentItem}>
            <Text style={styles.departmentName}>Marketing</Text>
            <Text style={styles.departmentCount}>6 employees</Text>
            <Text style={styles.departmentAttendance}>95% attendance</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Admin Dashboard</Text>
        <Text style={styles.headerSubtitle}>Welcome back, {user?.name}</Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'overview' && styles.activeTab]}
          onPress={() => setActiveTab('overview')}
        >
          <Icon name="dashboard" size={20} color={activeTab === 'overview' ? 'white' : UI_CONFIG.PRIMARY_COLOR} />
          <Text style={[styles.tabText, activeTab === 'overview' && styles.activeTabText]}>
            Overview
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'users' && styles.activeTab]}
          onPress={() => setActiveTab('users')}
        >
          <Icon name="people" size={20} color={activeTab === 'users' ? 'white' : UI_CONFIG.PRIMARY_COLOR} />
          <Text style={[styles.tabText, activeTab === 'users' && styles.activeTabText]}>
            Users
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'reports' && styles.activeTab]}
          onPress={() => setActiveTab('reports')}
        >
          <Icon name="assessment" size={20} color={activeTab === 'reports' ? 'white' : UI_CONFIG.PRIMARY_COLOR} />
          <Text style={[styles.tabText, activeTab === 'reports' && styles.activeTabText]}>
            Reports
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'overview' && renderOverviewTab()}
      {activeTab === 'users' && renderUsersTab()}
      {activeTab === 'reports' && renderReportsTab()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: UI_CONFIG.BACKGROUND_COLOR,
  },
  header: {
    padding: 20,
    backgroundColor: UI_CONFIG.CARD_BACKGROUND,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: UI_CONFIG.TEXT_PRIMARY,
  },
  headerSubtitle: {
    fontSize: 16,
    color: UI_CONFIG.TEXT_SECONDARY,
    marginTop: 5,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: UI_CONFIG.CARD_BACKGROUND,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  activeTab: {
    backgroundColor: UI_CONFIG.PRIMARY_COLOR,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: UI_CONFIG.PRIMARY_COLOR,
    marginLeft: 5,
  },
  activeTabText: {
    color: 'white',
  },
  tabContent: {
    flex: 1,
    padding: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    width: '48%',
    backgroundColor: UI_CONFIG.CARD_BACKGROUND,
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
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
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: UI_CONFIG.TEXT_PRIMARY,
    marginTop: 5,
  },
  statLabel: {
    fontSize: 12,
    color: UI_CONFIG.TEXT_SECONDARY,
    marginTop: 5,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: UI_CONFIG.TEXT_PRIMARY,
    marginBottom: 10,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: '48%',
    backgroundColor: UI_CONFIG.CARD_BACKGROUND,
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
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
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: UI_CONFIG.TEXT_PRIMARY,
    marginTop: 8,
    textAlign: 'center',
  },
  activityCard: {
    backgroundColor: UI_CONFIG.CARD_BACKGROUND,
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: UI_CONFIG.BORDER_COLOR,
  },
  activityText: {
    flex: 1,
    fontSize: 14,
    color: UI_CONFIG.TEXT_PRIMARY,
    marginLeft: 10,
  },
  activityTime: {
    fontSize: 12,
    color: UI_CONFIG.TEXT_SECONDARY,
  },
  userCard: {
    backgroundColor: UI_CONFIG.CARD_BACKGROUND,
    borderRadius: 10,
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
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: UI_CONFIG.BORDER_COLOR,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userDetails: {
    flex: 1,
    marginLeft: 10,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: UI_CONFIG.TEXT_PRIMARY,
  },
  userEmail: {
    fontSize: 14,
    color: UI_CONFIG.TEXT_SECONDARY,
  },
  userRole: {
    fontSize: 12,
    color: UI_CONFIG.PRIMARY_COLOR,
    textTransform: 'capitalize',
  },
  userStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  userStatusText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
  },
  userActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 10,
    borderWidth: 1,
    borderColor: UI_CONFIG.PRIMARY_COLOR,
  },
  actionButtonDanger: {
    borderColor: UI_CONFIG.ERROR_COLOR,
  },
  actionButtonText: {
    fontSize: 12,
    color: UI_CONFIG.PRIMARY_COLOR,
    marginLeft: 4,
  },
  reportCard: {
    backgroundColor: UI_CONFIG.CARD_BACKGROUND,
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: UI_CONFIG.TEXT_PRIMARY,
  },
  exportButton: {
    padding: 5,
  },
  reportStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  reportStat: {
    alignItems: 'center',
  },
  reportStatNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: UI_CONFIG.PRIMARY_COLOR,
  },
  reportStatLabel: {
    fontSize: 12,
    color: UI_CONFIG.TEXT_SECONDARY,
    marginTop: 2,
  },
  departmentCard: {
    backgroundColor: UI_CONFIG.CARD_BACKGROUND,
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  departmentItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: UI_CONFIG.BORDER_COLOR,
  },
  departmentName: {
    fontSize: 16,
    fontWeight: '600',
    color: UI_CONFIG.TEXT_PRIMARY,
  },
  departmentCount: {
    fontSize: 14,
    color: UI_CONFIG.TEXT_SECONDARY,
  },
  departmentAttendance: {
    fontSize: 12,
    color: UI_CONFIG.SUCCESS_COLOR,
    fontWeight: '600',
  },
});

export default AdminScreen; 