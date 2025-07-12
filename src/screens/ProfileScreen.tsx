import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch,
  Image,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { logoutUser } from '../store/slices/authSlice';
import { fetchUserProfile, updateUserProfile, updateSettings } from '../store/slices/userSlice';
import { UI_CONFIG, SUCCESS_MESSAGES } from '../utils/constants';
import Toast from 'react-native-toast-message';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

type ProfileScreenNavigationProp = StackNavigationProp<any, 'Profile'>;

const ProfileScreen: React.FC = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const dispatch = useDispatch();
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { profile, loading } = useSelector((state: RootState) => state.user);

  useEffect(() => {
    dispatch(fetchUserProfile() as any);
  }, [dispatch]);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(logoutUser() as any).unwrap();
              navigation.navigate('Login' as never);
            } catch (error: any) {
              Toast.show({
                type: 'error',
                text1: 'Logout Failed',
                text2: 'An error occurred during logout',
              });
            }
          },
        },
      ]
    );
  };

  const handleFaceRegistration = () => {
    navigation.navigate('FaceRegistration' as never);
  };

  const handleAttendanceHistory = () => {
    navigation.navigate('AttendanceHistory' as never);
  };

  const handleSettingToggle = async (setting: string, value: boolean) => {
    try {
      await dispatch(updateSettings({ [setting]: value }) as any).unwrap();
      Toast.show({
        type: 'success',
        text1: 'Settings Updated',
        text2: 'Your settings have been updated successfully',
      });
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Update Failed',
        text2: error.message || 'Failed to update settings',
      });
    }
  };

  const handleChangePassword = () => {
    Alert.alert('Info', 'Password change functionality will be implemented');
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. Are you sure you want to delete your account?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Info', 'Account deletion functionality will be implemented');
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Icon name="refresh" size={40} color={UI_CONFIG.PRIMARY_COLOR} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.profileImageContainer}>
          {profile?.profileImageUrl ? (
            <Image source={{ uri: profile.profileImageUrl }} style={styles.profileImage} />
          ) : (
            <View style={styles.profileImagePlaceholder}>
              <Icon name="person" size={40} color={UI_CONFIG.TEXT_SECONDARY} />
            </View>
          )}
          <TouchableOpacity style={styles.editImageButton}>
            <Icon name="camera-alt" size={20} color="white" />
          </TouchableOpacity>
        </View>
        <Text style={styles.userName}>{profile?.name || user?.name}</Text>
        <Text style={styles.userEmail}>{profile?.email || user?.email}</Text>
        {/* Removed profile?.role as it does not exist on UserProfile */}
        <Text style={styles.userRole}>{user?.role}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Personal Information</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Icon name="person" size={20} color={UI_CONFIG.TEXT_SECONDARY} />
            <Text style={styles.infoLabel}>Name</Text>
            <Text style={styles.infoValue}>{profile?.name || user?.name}</Text>
          </View>
          <View style={styles.infoRow}>
            <Icon name="email" size={20} color={UI_CONFIG.TEXT_SECONDARY} />
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{profile?.email || user?.email}</Text>
          </View>
          {profile?.department && (
            <View style={styles.infoRow}>
              <Icon name="business" size={20} color={UI_CONFIG.TEXT_SECONDARY} />
              <Text style={styles.infoLabel}>Department</Text>
              <Text style={styles.infoValue}>{profile.department}</Text>
            </View>
          )}
          {profile?.employeeId && (
            <View style={styles.infoRow}>
              <Icon name="badge" size={20} color={UI_CONFIG.TEXT_SECONDARY} />
              <Text style={styles.infoLabel}>Employee ID</Text>
              <Text style={styles.infoValue}>{profile.employeeId}</Text>
            </View>
          )}
          {profile?.phone && (
            <View style={styles.infoRow}>
              <Icon name="phone" size={20} color={UI_CONFIG.TEXT_SECONDARY} />
              <Text style={styles.infoLabel}>Phone</Text>
              <Text style={styles.infoValue}>{profile.phone}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Face Recognition</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Icon 
              name={profile?.faceRegistered ? "face" : "face-off"} 
              size={20} 
              color={profile?.faceRegistered ? UI_CONFIG.SUCCESS_COLOR : UI_CONFIG.ERROR_COLOR} 
            />
            <Text style={styles.infoLabel}>Face Registered</Text>
            <Text style={[
              styles.infoValue,
              { color: profile?.faceRegistered ? UI_CONFIG.SUCCESS_COLOR : UI_CONFIG.ERROR_COLOR }
            ]}>
              {profile?.faceRegistered ? 'Yes' : 'No'}
            </Text>
          </View>
          {!profile?.faceRegistered && (
            <TouchableOpacity style={styles.actionButton} onPress={handleFaceRegistration}>
              <Icon name="face" size={20} color="white" />
              <Text style={styles.actionButtonText}>Register Face</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Settings</Text>
        <View style={styles.infoCard}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Icon name="notifications" size={20} color={UI_CONFIG.TEXT_SECONDARY} />
              <Text style={styles.settingLabel}>Push Notifications</Text>
            </View>
            <Switch
              value={profile?.settings?.notifications ?? true}
              onValueChange={(value) => handleSettingToggle('notifications', value)}
              trackColor={{ false: UI_CONFIG.BORDER_COLOR, true: UI_CONFIG.PRIMARY_COLOR }}
              thumbColor="white"
            />
          </View>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Icon name="fingerprint" size={20} color={UI_CONFIG.TEXT_SECONDARY} />
              <Text style={styles.settingLabel}>Biometric Authentication</Text>
            </View>
            <Switch
              value={profile?.settings?.biometricAuth ?? false}
              onValueChange={(value) => handleSettingToggle('biometricAuth', value)}
              trackColor={{ false: UI_CONFIG.BORDER_COLOR, true: UI_CONFIG.PRIMARY_COLOR }}
              thumbColor="white"
            />
          </View>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Icon name="location-on" size={20} color={UI_CONFIG.TEXT_SECONDARY} />
              <Text style={styles.settingLabel}>Auto Location</Text>
            </View>
            <Switch
              value={profile?.settings?.autoLocation ?? true}
              onValueChange={(value) => handleSettingToggle('autoLocation', value)}
              trackColor={{ false: UI_CONFIG.BORDER_COLOR, true: UI_CONFIG.PRIMARY_COLOR }}
              thumbColor="white"
            />
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actions</Text>
        <View style={styles.infoCard}>
          <TouchableOpacity style={styles.actionRow} onPress={handleAttendanceHistory}>
            <Icon name="history" size={20} color={UI_CONFIG.PRIMARY_COLOR} />
            <Text style={styles.actionLabel}>Attendance History</Text>
            <Icon name="chevron-right" size={20} color={UI_CONFIG.TEXT_SECONDARY} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionRow} onPress={handleChangePassword}>
            <Icon name="lock" size={20} color={UI_CONFIG.PRIMARY_COLOR} />
            <Text style={styles.actionLabel}>Change Password</Text>
            <Icon name="chevron-right" size={20} color={UI_CONFIG.TEXT_SECONDARY} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionRow} onPress={() => setIsEditing(!isEditing)}>
            <Icon name="edit" size={20} color={UI_CONFIG.PRIMARY_COLOR} />
            <Text style={styles.actionLabel}>Edit Profile</Text>
            <Icon name="chevron-right" size={20} color={UI_CONFIG.TEXT_SECONDARY} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.infoCard}>
          <TouchableOpacity style={styles.actionRow} onPress={handleLogout}>
            <Icon name="logout" size={20} color={UI_CONFIG.ERROR_COLOR} />
            <Text style={[styles.actionLabel, { color: UI_CONFIG.ERROR_COLOR }]}>Logout</Text>
            <Icon name="chevron-right" size={20} color={UI_CONFIG.TEXT_SECONDARY} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionRow} onPress={handleDeleteAccount}>
            <Icon name="delete" size={20} color={UI_CONFIG.ERROR_COLOR} />
            <Text style={[styles.actionLabel, { color: UI_CONFIG.ERROR_COLOR }]}>Delete Account</Text>
            <Icon name="chevron-right" size={20} color={UI_CONFIG.TEXT_SECONDARY} />
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: UI_CONFIG.BACKGROUND_COLOR,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: UI_CONFIG.TEXT_SECONDARY,
    marginTop: 10,
  },
  header: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: UI_CONFIG.CARD_BACKGROUND,
    marginBottom: 20,
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  profileImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: UI_CONFIG.BORDER_COLOR,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editImageButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: UI_CONFIG.PRIMARY_COLOR,
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: UI_CONFIG.TEXT_PRIMARY,
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 16,
    color: UI_CONFIG.TEXT_SECONDARY,
    marginBottom: 5,
  },
  userRole: {
    fontSize: 14,
    color: UI_CONFIG.PRIMARY_COLOR,
    textTransform: 'capitalize',
  },
  section: {
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: UI_CONFIG.TEXT_PRIMARY,
    marginBottom: 10,
  },
  infoCard: {
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
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: UI_CONFIG.BORDER_COLOR,
  },
  infoLabel: {
    flex: 1,
    fontSize: 16,
    color: UI_CONFIG.TEXT_PRIMARY,
    marginLeft: 10,
  },
  infoValue: {
    fontSize: 16,
    color: UI_CONFIG.TEXT_SECONDARY,
    fontWeight: '500',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: UI_CONFIG.BORDER_COLOR,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    color: UI_CONFIG.TEXT_PRIMARY,
    marginLeft: 10,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: UI_CONFIG.BORDER_COLOR,
  },
  actionLabel: {
    flex: 1,
    fontSize: 16,
    color: UI_CONFIG.TEXT_PRIMARY,
    marginLeft: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: UI_CONFIG.PRIMARY_COLOR,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default ProfileScreen; 