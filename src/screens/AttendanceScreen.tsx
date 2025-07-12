import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Camera, useCameraDevices } from 'react-native-vision-camera';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { markAttendance } from '../store/slices/attendanceSlice';
import { UI_CONFIG, ERROR_MESSAGES, SUCCESS_MESSAGES } from '../utils/constants';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Toast from 'react-native-toast-message';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

type AttendanceScreenNavigationProp = StackNavigationProp<any, 'Attendance'>;

const { width, height } = Dimensions.get('window');

const AttendanceScreen: React.FC = () => {
  const [hasPermission, setHasPermission] = useState(false);
  const [isMarkingAttendance, setIsMarkingAttendance] = useState(false);
  const [attendanceType, setAttendanceType] = useState<'check-in' | 'check-out'>('check-in');
  const [faceDetected, setFaceDetected] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const camera = useRef<Camera>(null);
  const devices = useCameraDevices();
  const device = devices.find((d) => d.position === 'front');

  const dispatch = useDispatch();
  const navigation = useNavigation<AttendanceScreenNavigationProp>();
  const user = useSelector((state: RootState) => (state as any).auth.user);
  const { markingAttendance } = useSelector((state: RootState) => state.attendance);

  useEffect(() => {
    checkPermission();
  }, []);

  const checkPermission = async () => {
    const cameraPermission = await Camera.requestCameraPermission();
    setHasPermission(cameraPermission === 'granted');
  };

  const handleMarkAttendance = async () => {
    if (!faceDetected) {
      Toast.show({
        type: 'error',
        text1: 'Face Detection Required',
        text2: ERROR_MESSAGES.FACE_NOT_FOUND,
      });
      return;
    }

    setIsMarkingAttendance(true);
    try {
      // Simulate face data capture
      const faceData = 'simulated_face_data_' + Date.now();

      await (dispatch as any)(markAttendance({
        type: attendanceType,
        faceData,
        location: {
          latitude: 37.7749, // Default coordinates
          longitude: -122.4194,
        },
      })).unwrap();

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: SUCCESS_MESSAGES.ATTENDANCE_MARKED,
      });

      navigation.goBack();
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Attendance Failed',
        text2: error.message || 'Failed to mark attendance',
      });
    } finally {
      setIsMarkingAttendance(false);
    }
  };

  const handleFaceDetection = (faces: any[]) => {
    setFaceDetected(faces.length > 0);
  };

  const toggleAttendanceType = () => {
    setAttendanceType(attendanceType === 'check-in' ? 'check-out' : 'check-in');
  };

  if (!hasPermission) {
    return (
      <View style={styles.permissionContainer}>
        <Icon name="camera-alt" size={80} color={UI_CONFIG.TEXT_SECONDARY} />
        <Text style={styles.permissionTitle}>Camera Permission Required</Text>
        <Text style={styles.permissionText}>
          Camera access is required for face recognition attendance
        </Text>
        <TouchableOpacity style={styles.permissionButton} onPress={checkPermission}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={UI_CONFIG.PRIMARY_COLOR} />
        <Text style={styles.loadingText}>Loading camera...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.cameraContainer}>
        <Camera
          ref={camera}
          style={styles.camera}
          device={device}
          isActive={true}
          photo={true}
        />
        
        <View style={styles.faceDetectionOverlay}>
          <View style={[styles.faceFrame, faceDetected && styles.faceFrameDetected]}>
            <Icon 
              name="face" 
              size={60} 
              color={faceDetected ? UI_CONFIG.SUCCESS_COLOR : UI_CONFIG.TEXT_SECONDARY} 
            />
          </View>
        </View>

        <View style={styles.faceStatusContainer}>
          <View style={[styles.statusIndicator, faceDetected && styles.statusIndicatorDetected]} />
          <Text style={[styles.faceStatusText, faceDetected && styles.faceStatusTextDetected]}>
            {faceDetected ? 'Face Detected' : 'Position your face in the frame'}
          </Text>
        </View>
      </View>

      <View style={styles.controlsContainer}>
        <View style={styles.attendanceTypeContainer}>
          <TouchableOpacity
            style={[
              styles.typeButton,
              attendanceType === 'check-in' && styles.typeButtonActive
            ]}
            onPress={() => setAttendanceType('check-in')}
          >
            <Icon name="login" size={20} color={attendanceType === 'check-in' ? 'white' : UI_CONFIG.PRIMARY_COLOR} />
            <Text style={[styles.typeButtonText, attendanceType === 'check-in' && styles.typeButtonTextActive]}>
              Check In
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.typeButton,
              attendanceType === 'check-out' && styles.typeButtonActive
            ]}
            onPress={() => setAttendanceType('check-out')}
          >
            <Icon name="logout" size={20} color={attendanceType === 'check-out' ? 'white' : UI_CONFIG.PRIMARY_COLOR} />
            <Text style={[styles.typeButtonText, attendanceType === 'check-out' && styles.typeButtonTextActive]}>
              Check Out
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[
            styles.markAttendanceButton,
            (!faceDetected || isMarkingAttendance) && styles.markAttendanceButtonDisabled
          ]}
          onPress={handleMarkAttendance}
          disabled={!faceDetected || isMarkingAttendance}
        >
          {isMarkingAttendance ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <Icon name="check-circle" size={24} color="white" />
              <Text style={styles.markAttendanceButtonText}>
                Mark {attendanceType === 'check-in' ? 'Check In' : 'Check Out'}
              </Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>
            • Ensure good lighting for better face detection
          </Text>
          <Text style={styles.infoText}>
            • Keep your face centered in the frame
          </Text>
          <Text style={styles.infoText}>
            • Stay still while marking attendance
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: UI_CONFIG.BACKGROUND_COLOR,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: UI_CONFIG.TEXT_PRIMARY,
    marginTop: 20,
    marginBottom: 10,
  },
  permissionText: {
    fontSize: 16,
    color: UI_CONFIG.TEXT_SECONDARY,
    textAlign: 'center',
    marginBottom: 30,
  },
  permissionButton: {
    backgroundColor: UI_CONFIG.PRIMARY_COLOR,
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
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
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  faceDetectionOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  faceFrame: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 3,
    borderColor: UI_CONFIG.BORDER_COLOR,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  faceFrameDetected: {
    borderColor: UI_CONFIG.SUCCESS_COLOR,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  faceStatusContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 15,
    borderRadius: 8,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: UI_CONFIG.ERROR_COLOR,
    marginRight: 10,
  },
  statusIndicatorDetected: {
    backgroundColor: UI_CONFIG.SUCCESS_COLOR,
  },
  faceStatusText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  faceStatusTextDetected: {
    color: UI_CONFIG.SUCCESS_COLOR,
  },
  controlsContainer: {
    backgroundColor: UI_CONFIG.CARD_BACKGROUND,
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  attendanceTypeContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: UI_CONFIG.PRIMARY_COLOR,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  typeButtonActive: {
    backgroundColor: UI_CONFIG.PRIMARY_COLOR,
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: UI_CONFIG.PRIMARY_COLOR,
    marginLeft: 5,
  },
  typeButtonTextActive: {
    color: 'white',
  },
  markAttendanceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: UI_CONFIG.SUCCESS_COLOR,
    paddingVertical: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  markAttendanceButtonDisabled: {
    backgroundColor: UI_CONFIG.TEXT_SECONDARY,
  },
  markAttendanceButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  infoContainer: {
    backgroundColor: UI_CONFIG.BACKGROUND_COLOR,
    padding: 15,
    borderRadius: 8,
  },
  infoText: {
    fontSize: 12,
    color: UI_CONFIG.TEXT_SECONDARY,
    marginBottom: 5,
  },
});

export default AttendanceScreen; 