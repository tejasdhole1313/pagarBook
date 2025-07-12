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
import { registerUser } from '../store/slices/authSlice';
import { UI_CONFIG, ERROR_MESSAGES, SUCCESS_MESSAGES, VALIDATION_RULES } from '../utils/constants';
import Toast from 'react-native-toast-message';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

type RegisterScreenNavigationProp = StackNavigationProp<any, 'Register'>;

const RegisterScreen: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'employee',
    department: '',
    employeeId: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const dispatch = useDispatch();
  const navigation = useNavigation<RegisterScreenNavigationProp>();
  const { loading, error } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (error) {
      Toast.show({
        type: 'error',
        text1: 'Registration Error',
        text2: error,
      });
    }
  }, [error]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = () => {
    if (!formData.name || formData.name.length < VALIDATION_RULES.NAME_MIN_LENGTH) {
      Alert.alert('Error', 'Name must be at least 2 characters long');
      return false;
    }

    if (!VALIDATION_RULES.EMAIL_REGEX.test(formData.email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }

    if (formData.password.length < VALIDATION_RULES.PASSWORD_MIN_LENGTH) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return false;
    }

    if (formData.role === 'employee' && !formData.department) {
      Alert.alert('Error', 'Please select a department');
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // Only include allowed properties for registerUser
      await dispatch(registerUser({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      }) as any).unwrap();

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: SUCCESS_MESSAGES.REGISTRATION_SUCCESS,
      });

      // Navigate to face registration if role is employee
      if (formData.role === 'employee') {
        navigation.navigate('FaceRegistration' as never);
      } else {
        navigation.navigate('Home' as never);
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Registration Failed',
        text2: error.message || ERROR_MESSAGES.SERVER_ERROR,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const departments = [
    'Engineering',
    'Sales',
    'Marketing',
    'HR',
    'Finance',
    'Operations',
    'IT',
    'Customer Support',
  ];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Icon name="person-add" size={60} color={UI_CONFIG.PRIMARY_COLOR} />
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join PagarBook for seamless attendance tracking</Text>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <Icon name="person" size={20} color={UI_CONFIG.TEXT_SECONDARY} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              value={formData.name}
              onChangeText={(value) => handleInputChange('name', value)}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputContainer}>
            <Icon name="email" size={20} color={UI_CONFIG.TEXT_SECONDARY} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={formData.email}
              onChangeText={(value) => handleInputChange('email', value)}
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
              value={formData.password}
              onChangeText={(value) => handleInputChange('password', value)}
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

          <View style={styles.inputContainer}>
            <Icon name="lock" size={20} color={UI_CONFIG.TEXT_SECONDARY} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChangeText={(value) => handleInputChange('confirmPassword', value)}
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={styles.passwordToggle}
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              <Icon
                name={showConfirmPassword ? 'visibility' : 'visibility-off'}
                size={20}
                color={UI_CONFIG.TEXT_SECONDARY}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.roleContainer}>
            <Text style={styles.label}>Role</Text>
            <View style={styles.roleButtons}>
              <TouchableOpacity
                style={[
                  styles.roleButton,
                  formData.role === 'employee' && styles.roleButtonActive
                ]}
                onPress={() => handleInputChange('role', 'employee')}
              >
                <Icon 
                  name="work" 
                  size={20} 
                  color={formData.role === 'employee' ? 'white' : UI_CONFIG.PRIMARY_COLOR} 
                />
                <Text style={[
                  styles.roleButtonText,
                  formData.role === 'employee' && styles.roleButtonTextActive
                ]}>
                  Employee
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.roleButton,
                  formData.role === 'admin' && styles.roleButtonActive
                ]}
                onPress={() => handleInputChange('role', 'admin')}
              >
                <Icon 
                  name="admin-panel-settings" 
                  size={20} 
                  color={formData.role === 'admin' ? 'white' : UI_CONFIG.PRIMARY_COLOR} 
                />
                <Text style={[
                  styles.roleButtonText,
                  formData.role === 'admin' && styles.roleButtonTextActive
                ]}>
                  Admin
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {formData.role === 'employee' && (
            <>
              <View style={styles.inputContainer}>
                <Icon name="business" size={20} color={UI_CONFIG.TEXT_SECONDARY} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Employee ID (Optional)"
                  value={formData.employeeId}
                  onChangeText={(value) => handleInputChange('employeeId', value)}
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.pickerContainer}>
                <Text style={styles.label}>Department</Text>
                <View style={styles.picker}>
                  {departments.map((dept) => (
                    <TouchableOpacity
                      key={dept}
                      style={[
                        styles.pickerOption,
                        formData.department === dept && styles.pickerOptionActive
                      ]}
                      onPress={() => handleInputChange('department', dept)}
                    >
                      <Text style={[
                        styles.pickerOptionText,
                        formData.department === dept && styles.pickerOptionTextActive
                      ]}>
                        {dept}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </>
          )}

          <TouchableOpacity
            style={[styles.registerButton, isLoading && styles.registerButtonDisabled]}
            onPress={handleRegister}
            disabled={isLoading}
          >
            <Text style={styles.registerButtonText}>
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </Text>
          </TouchableOpacity>

          <View style={styles.loginLink}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login' as never)}>
              <Text style={styles.loginLinkText}>Login</Text>
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
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: UI_CONFIG.PRIMARY_COLOR,
    marginTop: 15,
  },
  subtitle: {
    fontSize: 16,
    color: UI_CONFIG.TEXT_SECONDARY,
    textAlign: 'center',
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
  roleContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: UI_CONFIG.TEXT_PRIMARY,
    marginBottom: 10,
  },
  roleButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  roleButton: {
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
  roleButtonActive: {
    backgroundColor: UI_CONFIG.PRIMARY_COLOR,
  },
  roleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: UI_CONFIG.PRIMARY_COLOR,
    marginLeft: 5,
  },
  roleButtonTextActive: {
    color: 'white',
  },
  pickerContainer: {
    marginBottom: 20,
  },
  picker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  pickerOption: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: UI_CONFIG.BORDER_COLOR,
    borderRadius: 20,
    backgroundColor: UI_CONFIG.BACKGROUND_COLOR,
  },
  pickerOptionActive: {
    backgroundColor: UI_CONFIG.PRIMARY_COLOR,
    borderColor: UI_CONFIG.PRIMARY_COLOR,
  },
  pickerOptionText: {
    fontSize: 14,
    color: UI_CONFIG.TEXT_PRIMARY,
  },
  pickerOptionTextActive: {
    color: 'white',
  },
  registerButton: {
    backgroundColor: UI_CONFIG.PRIMARY_COLOR,
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 20,
  },
  registerButtonDisabled: {
    opacity: 0.6,
  },
  registerButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loginLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    fontSize: 14,
    color: UI_CONFIG.TEXT_SECONDARY,
  },
  loginLinkText: {
    fontSize: 14,
    color: UI_CONFIG.PRIMARY_COLOR,
    fontWeight: '600',
  },
});

export default RegisterScreen; 