// API Configuration
export const API_BASE_URL = __DEV__ 
  ? 'http://localhost:3000/api' 
  : 'https://your-production-api.com/api';

// App Configuration
export const APP_CONFIG = {
  APP_NAME: 'PagarBook',
  VERSION: '1.0.0',
  BUILD_NUMBER: '1',
};

// Face Recognition Configuration
export const FACE_RECOGNITION_CONFIG = {
  MIN_CONFIDENCE: 0.8,
  MAX_FACE_DISTANCE: 0.6,
  FACE_DETECTION_TIMEOUT: 10000, // 10 seconds
  FACE_REGISTRATION_IMAGES: 5, // Number of images to capture for registration
};

// Attendance Configuration
export const ATTENDANCE_CONFIG = {
  WORK_START_TIME: '09:00',
  WORK_END_TIME: '17:00',
  LATE_THRESHOLD_MINUTES: 15,
  EARLY_LEAVE_THRESHOLD_MINUTES: 60,
  LOCATION_RADIUS_METERS: 100, // Maximum distance from office
};

// UI Configuration
export const UI_CONFIG = {
  PRIMARY_COLOR: '#2196F3',
  SECONDARY_COLOR: '#FF9800',
  SUCCESS_COLOR: '#4CAF50',
  ERROR_COLOR: '#F44336',
  WARNING_COLOR: '#FF9800',
  INFO_COLOR: '#2196F3',
  BACKGROUND_COLOR: '#F5F5F5',
  CARD_BACKGROUND: '#FFFFFF',
  TEXT_PRIMARY: '#212121',
  TEXT_SECONDARY: '#757575',
  BORDER_COLOR: '#E0E0E0',
};

// Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'authToken',
  USER_DATA: 'userData',
  FACE_DATA: 'faceData',
  SETTINGS: 'settings',
  ATTENDANCE_HISTORY: 'attendanceHistory',
};

// Navigation Routes
export const ROUTES = {
  LOGIN: 'Login',
  REGISTER: 'Register',
  HOME: 'Home',
  ATTENDANCE: 'Attendance',
  PROFILE: 'Profile',
  ADMIN: 'Admin',
  FACE_REGISTRATION: 'FaceRegistration',
  ATTENDANCE_HISTORY: 'AttendanceHistory',
  SETTINGS: 'Settings',
  NOTIFICATIONS: 'Notifications',
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  INVALID_CREDENTIALS: 'Invalid email or password.',
  FACE_NOT_FOUND: 'No face detected. Please position your face in the camera.',
  FACE_VERIFICATION_FAILED: 'Face verification failed. Please try again.',
  ATTENDANCE_ALREADY_MARKED: 'Attendance already marked for today.',
  LOCATION_NOT_ALLOWED: 'Location access is required for attendance.',
  CAMERA_PERMISSION_DENIED: 'Camera permission is required for face recognition.',
  FACE_REGISTRATION_FAILED: 'Face registration failed. Please try again.',
  SERVER_ERROR: 'Server error. Please try again later.',
};

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Login successful!',
  REGISTRATION_SUCCESS: 'Registration successful!',
  ATTENDANCE_MARKED: 'Attendance marked successfully!',
  FACE_REGISTERED: 'Face registered successfully!',
  PROFILE_UPDATED: 'Profile updated successfully!',
  PASSWORD_CHANGED: 'Password changed successfully!',
  LOGOUT_SUCCESS: 'Logged out successfully!',
};

// Validation Rules
export const VALIDATION_RULES = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD_MIN_LENGTH: 6,
  NAME_MIN_LENGTH: 2,
  PHONE_REGEX: /^\+?[\d\s\-\(\)]+$/,
};

// Date Formats
export const DATE_FORMATS = {
  DISPLAY: 'MMM dd, yyyy',
  TIME: 'HH:mm',
  DATETIME: 'MMM dd, yyyy HH:mm',
  API: 'yyyy-MM-dd',
  API_DATETIME: 'yyyy-MM-dd HH:mm:ss',
};

// File Upload Configuration
export const FILE_UPLOAD_CONFIG = {
  MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/jpg'],
  IMAGE_QUALITY: 0.8,
  MAX_FACE_IMAGE_SIZE: 2 * 1024 * 1024, // 2MB
};

// Push Notification Configuration
export const PUSH_NOTIFICATION_CONFIG = {
  CHANNEL_ID: 'attendance_channel',
  CHANNEL_NAME: 'Attendance Notifications',
  CHANNEL_DESCRIPTION: 'Notifications for attendance and app updates',
};

// Biometric Configuration
export const BIOMETRIC_CONFIG = {
  TITLE: 'Biometric Authentication',
  SUBTITLE: 'Use your fingerprint or face to login',
  CANCEL_BUTTON: 'Cancel',
  FALLBACK_BUTTON: 'Use Password',
}; 