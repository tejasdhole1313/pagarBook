import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { loginUser } from '../store/slices/authSlice';
import { UI_CONFIG, ERROR_MESSAGES, SUCCESS_MESSAGES } from '../utils/constants';
import Toast from 'react-native-toast-message';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

type LoginScreenNavigationProp = StackNavigationProp<any, 'Login'>;

const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const dispatch = useDispatch();
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const { loading, error } = useSelector((state: RootState) => state.auth as { loading: boolean; error: string | null });

  useEffect(() => {
    if (error) {
      Toast.show({
        type: 'error',
        text1: 'Login Error',
        text2: error,
      });
    }
  }, [error]);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    try {
      // @ts-ignore
      await (dispatch as any)(loginUser({ email, password })).unwrap();
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: SUCCESS_MESSAGES.LOGIN_SUCCESS,
      });
      navigation.navigate('Home' as never);
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Login Failed',
        text2: error.message || ERROR_MESSAGES.INVALID_CREDENTIALS,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    // TODO: Implement biometric authentication
    Alert.alert('Info', 'Biometric login will be implemented');
  };

  const handleForgotPassword = () => {
    Alert.alert('Info', 'Password reset functionality will be implemented');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.logoContainer}>
          <Icon name="face" size={80} color={UI_CONFIG.PRIMARY_COLOR} />
          <Text style={styles.appName}>PagarBook</Text>
          <Text style={styles.tagline}>Face Attendance System</Text>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <Icon name="email" size={20} color={UI_CONFIG.TEXT_SECONDARY} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputContainer}>
            <Icon name="lock" size={20} color={UI_CONFIG.TEXT_SECONDARY} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={styles.passwordToggle}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Icon
                name={showPassword ? 'visibility' : 'visibility-off'}
                size={20}
                color={UI_CONFIG.TEXT_SECONDARY}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            <Text style={styles.loginButtonText}>
              {isLoading ? 'Logging in...' : 'Login'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.biometricButton}
            onPress={handleBiometricLogin}
          >
            <Icon name="fingerprint" size={24} color={UI_CONFIG.PRIMARY_COLOR} />
            <Text style={styles.biometricButtonText}>Login with Biometric</Text>
          </TouchableOpacity>

          <View style={styles.linksContainer}>
            <TouchableOpacity onPress={handleForgotPassword}>
              <Text style={styles.linkText}>Forgot Password?</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Register' as never)}>
              <Text style={styles.linkText}>Don't have an account? Register</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: UI_CONFIG.BACKGROUND_COLOR,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: UI_CONFIG.PRIMARY_COLOR,
    marginTop: 10,
  },
  tagline: {
    fontSize: 16,
    color: UI_CONFIG.TEXT_SECONDARY,
    marginTop: 5,
  },
  formContainer: {
    backgroundColor: UI_CONFIG.CARD_BACKGROUND,
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: UI_CONFIG.BORDER_COLOR,
    borderRadius: 8,
    marginBottom: 15,
    backgroundColor: UI_CONFIG.BACKGROUND_COLOR,
  },
  inputIcon: {
    marginLeft: 15,
  },
  input: {
    flex: 1,
    paddingVertical: 15,
    paddingHorizontal: 10,
    fontSize: 16,
    color: UI_CONFIG.TEXT_PRIMARY,
  },
  passwordToggle: {
    padding: 10,
  },
  loginButton: {
    backgroundColor: UI_CONFIG.PRIMARY_COLOR,
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 15,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: UI_CONFIG.PRIMARY_COLOR,
    borderRadius: 8,
    paddingVertical: 15,
    marginBottom: 20,
  },
  biometricButtonText: {
    color: UI_CONFIG.PRIMARY_COLOR,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  linksContainer: {
    alignItems: 'center',
  },
  linkText: {
    color: UI_CONFIG.PRIMARY_COLOR,
    fontSize: 14,
    marginVertical: 5,
  },
});

export default LoginScreen; 