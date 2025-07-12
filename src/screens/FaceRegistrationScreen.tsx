import React, { useState, useRef, useEffect } from 'react';
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
import { RootState, AppDispatch } from '../store';
import { registerFace } from '../store/slices/userSlice';
import { UI_CONFIG, SUCCESS_MESSAGES, ERROR_MESSAGES } from '../utils/constants';
import Toast from 'react-native-toast-message';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

type FaceRegistrationScreenNavigationProp = StackNavigationProp<any, 'FaceRegistration'>;

const { width, height } = Dimensions.get('window');

const FaceRegistrationScreen: React.FC = () => {
  const [hasPermission, setHasPermission] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const camera = useRef<Camera>(null);
  const devices = useCameraDevices();
  const device = devices.find((d) => d.position === 'front');

  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<FaceRegistrationScreenNavigationProp>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { loading } = useSelector((state: RootState) => state.user);

  useEffect(() => {
    requestCameraPermission();
  }, []);

  const requestCameraPermission = async () => {
    const permission = await Camera.requestCameraPermission();
    setHasPermission(permission === 'granted');
  };

  const captureImage = async () => {
    if (!camera.current) return;

    setIsCapturing(true);
    try {
      const photo = await camera.current.takePhoto({
        qualityPrioritization: 'quality',
        flash: 'off',
      });

      const imagePath = `file://${photo.path}`;
      setCapturedImages(prev => [...prev, imagePath]);

      if (capturedImages.length < 2) {
        setCurrentStep(currentStep + 1);
        Toast.show({
          type: 'success',
          text1: 'Image Captured',
          text2: `Image ${capturedImages.length + 1} of 3 captured successfully`,
        });
      } else {
        // All images captured, proceed to registration
        await registerFaceData();
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Capture Failed',
        text2: 'Failed to capture image. Please try again.',
      });
    } finally {
      setIsCapturing(false);
    }
  };

  const registerFaceData = async () => {
    if (capturedImages.length < 3) {
      Alert.alert('Error', 'Please capture at least 3 images for face registration');
      return;
    }

    setIsProcessing(true);
    try {
      await dispatch(registerFace(capturedImages)).unwrap();

      Toast.show({
        type: 'success',
        text1: 'Registration Successful',
        text2: SUCCESS_MESSAGES.FACE_REGISTERED,
      });

      // Navigate back to profile or home
      navigation.navigate('Profile' as never);
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Registration Failed',
        text2: error.message || ERROR_MESSAGES.FACE_REGISTRATION_FAILED,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const retakeImages = () => {
    setCapturedImages([]);
    setCurrentStep(0);
  };

  const renderInstructions = () => (
    <View style={styles.instructionsContainer}>
      <Text style={styles.instructionsTitle}>Face Registration</Text>
      <Text style={styles.instructionsText}>
        Please capture 3 clear images of your face from different angles for better recognition accuracy.
      </Text>
      
      <View style={styles.stepContainer}>
        <Text style={styles.stepTitle}>Step {currentStep + 1} of 3</Text>
        <Text style={styles.stepDescription}>
          {currentStep === 0 && 'Look straight at the camera'}
          {currentStep === 1 && 'Turn your head slightly to the left'}
          {currentStep === 2 && 'Turn your head slightly to the right'}
        </Text>
      </View>

      <View style={styles.progressContainer}>
        {[0, 1, 2].map((step) => (
          <View
            key={step}
            style={[
              styles.progressDot,
              step <= currentStep && styles.progressDotActive,
              step < currentStep && styles.progressDotCompleted,
            ]}
          >
            {step < currentStep && (
              <Icon name="check" size={12} color="white" />
            )}
          </View>
        ))}
      </View>
    </View>
  );

  const renderCamera = () => (
    <View style={styles.cameraContainer}>
      {device && hasPermission ? (
        <Camera
          ref={camera}
          style={styles.camera}
          device={device}
          isActive={true}
          photo={true}
        />
      ) : (
        <View style={styles.cameraPlaceholder}>
          <Icon name="camera-alt" size={60} color={UI_CONFIG.TEXT_SECONDARY} />
          <Text style={styles.cameraPlaceholderText}>
            {!hasPermission ? 'Camera permission required' : 'Camera not available'}
          </Text>
        </View>
      )}

      <View style={styles.cameraOverlay}>
        <View style={styles.faceFrame}>
          <View style={styles.faceFrameCorner} />
          <View style={styles.faceFrameCorner} />
          <View style={styles.faceFrameCorner} />
          <View style={styles.faceFrameCorner} />
        </View>
      </View>

      <View style={styles.cameraControls}>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="white" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.captureButton, isCapturing && styles.captureButtonDisabled]}
          onPress={captureImage}
          disabled={isCapturing || isProcessing}
        >
          {isCapturing ? (
            <ActivityIndicator color="white" />
          ) : (
            <Icon name="camera" size={30} color="white" />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.controlButton}
          onPress={retakeImages}
          disabled={capturedImages.length === 0}
        >
          <Icon name="refresh" size={24} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderProcessing = () => (
    <View style={styles.processingContainer}>
      <ActivityIndicator size="large" color={UI_CONFIG.PRIMARY_COLOR} />
      <Text style={styles.processingText}>Processing face data...</Text>
      <Text style={styles.processingSubtext}>Please wait while we register your face</Text>
    </View>
  );

  if (isProcessing) {
    return renderProcessing();
  }

  return (
    <View style={styles.container}>
      {renderInstructions()}
      {renderCamera()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: UI_CONFIG.BACKGROUND_COLOR,
  },
  instructionsContainer: {
    padding: 20,
    backgroundColor: UI_CONFIG.CARD_BACKGROUND,
  },
  instructionsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: UI_CONFIG.TEXT_PRIMARY,
    textAlign: 'center',
    marginBottom: 10,
  },
  instructionsText: {
    fontSize: 14,
    color: UI_CONFIG.TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  stepContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: UI_CONFIG.PRIMARY_COLOR,
    marginBottom: 5,
  },
  stepDescription: {
    fontSize: 14,
    color: UI_CONFIG.TEXT_SECONDARY,
    textAlign: 'center',
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: UI_CONFIG.BORDER_COLOR,
    marginHorizontal: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressDotActive: {
    backgroundColor: UI_CONFIG.PRIMARY_COLOR,
  },
  progressDotCompleted: {
    backgroundColor: UI_CONFIG.SUCCESS_COLOR,
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  cameraPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: UI_CONFIG.BORDER_COLOR,
  },
  cameraPlaceholderText: {
    fontSize: 16,
    color: UI_CONFIG.TEXT_SECONDARY,
    marginTop: 10,
  },
  cameraOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  faceFrame: {
    width: 250,
    height: 300,
    position: 'relative',
  },
  faceFrameCorner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: UI_CONFIG.PRIMARY_COLOR,
    borderWidth: 3,
  },
  cameraControls: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: UI_CONFIG.PRIMARY_COLOR,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  captureButtonDisabled: {
    opacity: 0.6,
  },
  processingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: UI_CONFIG.BACKGROUND_COLOR,
  },
  processingText: {
    fontSize: 18,
    fontWeight: '600',
    color: UI_CONFIG.TEXT_PRIMARY,
    marginTop: 20,
  },
  processingSubtext: {
    fontSize: 14,
    color: UI_CONFIG.TEXT_SECONDARY,
    marginTop: 10,
    textAlign: 'center',
  },
});

export default FaceRegistrationScreen; 