# PagarBook - Face Attendance System

A comprehensive face recognition-based attendance system built with React Native and Node.js.

## 🚀 Features

### Mobile App (React Native)
- **Face Recognition Attendance**: Mark attendance using face recognition
- **Biometric Authentication**: Login with fingerprint/face ID
- **Real-time Camera**: Live face detection and verification
- **Attendance History**: View and manage attendance records
- **Profile Management**: Update personal information and settings
- **Push Notifications**: Real-time attendance notifications
- **Offline Support**: Works without internet connection
- **Admin Dashboard**: Comprehensive admin interface for managers

### Backend API (Node.js)
- **RESTful API**: Complete REST API for all operations
- **Face Recognition**: Advanced face detection and verification
- **JWT Authentication**: Secure token-based authentication
- **MongoDB Integration**: Scalable database storage
- **Real-time Notifications**: WebSocket support for live updates
- **Report Generation**: Detailed attendance reports and analytics
- **Admin Management**: User and attendance management tools

## 🛠 Tech Stack

### Frontend (React Native)
- **React Native**: Cross-platform mobile development
- **Redux Toolkit**: State management
- **React Navigation**: Navigation between screens
- **React Native Vision Camera**: Camera access and face detection
- **React Native Paper**: Material Design components
- **React Native Vector Icons**: Icon library
- **AsyncStorage**: Local data storage
- **Axios**: HTTP client for API calls

### Backend (Node.js)
- **Express.js**: Web framework
- **MongoDB**: Database
- **Mongoose**: ODM for MongoDB
- **JWT**: Authentication
- **bcryptjs**: Password hashing
- **face-api.js**: Face recognition
- **Multer**: File upload handling
- **Sharp**: Image processing
- **Nodemailer**: Email sending
- **Twilio**: SMS notifications
- **Firebase Admin**: Push notifications

## 📱 Screenshots

### Mobile App
- Login Screen with biometric authentication
- Home Dashboard with attendance status
- Face Recognition Camera for attendance
- Profile Management
- Attendance History
- Admin Dashboard

### Admin Dashboard
- User Management
- Attendance Reports
- Analytics and Charts
- Department Overview

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- MongoDB
- React Native development environment
- Android Studio / Xcode

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/pagarbook.git
cd pagarbook
```

2. **Install dependencies**
```bash
# Install mobile app dependencies
npm install

# Install server dependencies
cd server
npm install
```

3. **Environment Setup**
```bash
# Create environment file
cp .env.example .env

# Edit environment variables
nano .env
```

4. **Database Setup**
```bash
# Start MongoDB
mongod

# Run database migrations
cd server
npm run migrate
```

5. **Start the server**
```bash
cd server
npm run dev
```

6. **Start the mobile app**
```bash
# For Android
npm run android

# For iOS
npm run ios
```

## 📁 Project Structure

```
pagarbook/
├── android/                 # Android native code
├── ios/                    # iOS native code
├── src/                    # React Native source code
│   ├── assets/            # Images, fonts, etc.
│   ├── components/        # Reusable components
│   ├── screens/           # App screens
│   ├── api/              # API service functions
│   ├── utils/            # Utility functions
│   ├── store/            # Redux store and slices
│   └── services/         # Business logic services
├── server/                # Node.js backend
│   ├── routes/           # API routes
│   ├── controllers/      # Route controllers
│   ├── models/           # Database models
│   ├── middleware/       # Custom middleware
│   ├── utils/            # Utility functions
│   └── faceRecognition/  # Face recognition scripts
├── .env                  # Environment variables
└── README.md            # This file
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Server Configuration
NODE_ENV=development
PORT=3000

# Database
MONGODB_URI=mongodb://localhost:27017/pagarbook

# JWT
JWT_SECRET=your-super-secret-jwt-key

# Email (for password reset)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-email-password

# Face Recognition
FACE_RECOGNITION_THRESHOLD=0.6
FACE_RECOGNITION_MIN_CONFIDENCE=0.8
```

### Face Recognition Models

Download face-api.js models and place them in `server/faceRecognition/models/`:

```bash
cd server/faceRecognition
wget https://github.com/justadudewhohacks/face-api.js/tree/master/weights
```

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/verify` - Verify token
- `POST /api/auth/forgot-password` - Forgot password
- `POST /api/auth/reset-password` - Reset password

### Attendance
- `POST /api/attendance/mark` - Mark attendance
- `GET /api/attendance/history` - Get attendance history
- `GET /api/attendance/today` - Get today's attendance
- `GET /api/attendance/stats` - Get attendance statistics
- `POST /api/attendance/report` - Generate attendance report
- `POST /api/attendance/verify-face` - Verify face

### User Management
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update user profile
- `POST /api/user/register-face` - Register face
- `PUT /api/user/settings` - Update user settings
- `POST /api/user/profile-image` - Upload profile image

### Admin (Admin only)
- `GET /api/admin/users` - Get all users
- `PUT /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Delete user
- `GET /api/admin/attendance` - Get all attendance
- `PUT /api/admin/attendance/:id` - Update attendance
- `DELETE /api/admin/attendance/:id` - Delete attendance

## 🔐 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt for password security
- **Rate Limiting**: Prevent brute force attacks
- **Input Validation**: Comprehensive input validation
- **CORS Protection**: Cross-origin resource sharing protection
- **Helmet Security**: Security headers
- **Face Verification**: Anti-spoofing measures

## 📱 Mobile App Features

### Core Features
- **Face Recognition**: Mark attendance using face detection
- **Biometric Login**: Login with fingerprint or face ID
- **Real-time Camera**: Live face detection with visual feedback
- **Attendance Tracking**: Check-in and check-out functionality
- **History View**: View attendance history with filters
- **Profile Management**: Update personal information
- **Settings**: Configure app preferences

### Admin Features
- **User Management**: Add, edit, and delete users
- **Attendance Reports**: Generate detailed reports
- **Analytics**: View attendance statistics and charts
- **Department Management**: Manage departments and users
- **Real-time Monitoring**: Live attendance monitoring

## 🎯 Usage Guide

### For Employees
1. **Registration**: Register with email and password
2. **Face Registration**: Register your face for attendance
3. **Daily Attendance**: Use face recognition to mark attendance
4. **View History**: Check your attendance history
5. **Update Profile**: Keep your information updated

### For Administrators
1. **User Management**: Manage employee accounts
2. **Attendance Monitoring**: Monitor real-time attendance
3. **Report Generation**: Generate attendance reports
4. **Analytics**: View attendance analytics and trends
5. **Settings**: Configure system settings

## 🚀 Deployment

### Backend Deployment
```bash
# Production build
cd server
npm run build

# Start production server
npm start
```

### Mobile App Deployment
```bash
# Android APK
cd android
./gradlew assembleRelease

# iOS Archive
cd ios
xcodebuild -workspace PagarBook.xcworkspace -scheme PagarBook archive
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, email support@pagarbook.com or create an issue in the repository.

## 🙏 Acknowledgments

- [face-api.js](https://github.com/justadudewhohacks/face-api.js) for face recognition
- [React Native](https://reactnative.dev/) for mobile development
- [Express.js](https://expressjs.com/) for backend framework
- [MongoDB](https://www.mongodb.com/) for database

---

**PagarBook** - Making attendance tracking simple and secure with face recognition technology.
#   p a g a r B o o k  
 