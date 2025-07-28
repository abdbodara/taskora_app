import React, {useState, useRef, useEffect} from 'react';
import {
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  View,
  Animated,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {LoginApi} from '../Apis/authApi';
import CustomModal from '../components/CustomModal';
import {useNavigation} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import useModal from '../hooks/useModal';
import {Colors} from '../utils/colors';
import ScreenWrapper from '../components/ScreenWrapper';

const LoginScreen = () => {
  const [email, setEmail] = useState('test@email.com');
  const [password, setPassword] = useState('test@123');
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState(null);
  const [passwordError, setPasswordError] = useState(null);
  const [emailValid, setEmailValid] = useState(false);
  const [passwordValid, setPasswordValid] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    modalVisible,
    modalType,
    modalTitle,
    modalMessage,
    showSuccessModal,
    showErrorModal,
    hideModal,
    getCurrentActions,
  } = useModal();

  const navigation = useNavigation();
  const animatedValue = useRef(new Animated.Value(0)).current;

  const validateEmail = email => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = password => {
    return password.length >= 6;
  };

  const handleEmailChange = text => {
    setEmail(text);
    if (text.length > 0) {
      if (validateEmail(text)) {
        setEmailValid(true);
        setEmailError(null);
      } else {
        setEmailValid(false);
        setEmailError('Please enter a valid email');
      }
    } else {
      setEmailValid(false);
      setEmailError(null);
    }
  };

  const handlePasswordChange = text => {
    setPassword(text);
    if (text.length > 0) {
      if (validatePassword(text)) {
        setPasswordValid(true);
        setPasswordError(null);
      } else {
        setPasswordValid(false);
        setPasswordError('Password must be at least 6 characters');
      }
    } else {
      setPasswordValid(false);
      setPasswordError(null);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  const translateY = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [50, 0],
  });

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const getInputStyle = (focused, error, valid) => {
    if (error) return [styles.input, styles.inputError];
    if (valid) return [styles.input, styles.inputValid];
    if (focused) return [styles.input, styles.inputFocused];
    return styles.input;
  };

  const handleLogin = async () => {
    if (!email) {
      setEmailError('Email is required');
      return;
    }

    if (!password) {
      setPasswordError('Password is required');
      return;
    }

    setIsLoading(true);
    try {
      const data = {
        email: email,
        password: password,
      };
      const response = await LoginApi(data);

      if (response?.success === true || response?.data) {
        const {token, technician} = response.data;
        await AsyncStorage.setItem('userToken', token);
        await AsyncStorage.setItem('userData', JSON.stringify(technician));

        showSuccessModal(
          'Login Successful!',
          'Welcome back! You have been successfully logged in.',
          () => {
            hideModal();
            navigation.navigate('HomeScreen');
          },
          null,
          'Continue',
        );
      }
    } catch (error) {
      showErrorModal(
        'Login Failed',
        error?.error || 'Something went wrong. Please try again.',
        null,
        hideModal,
        'OK',
        'Try Again',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScreenWrapper>
      <LinearGradient
        colors={[Colors.primary, Colors.secondary, Colors.accent]}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={{flex: 1}}>
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.circle1} />
          <View style={styles.circle2} />
          <View style={styles.circle3} />

          <Animated.View
            style={[
              styles.loginCard,
              {
                opacity,
                transform: [{translateY}],
              },
            ]}>
            <View style={styles.logoContainer}>
              <View style={styles.logo}>
                <Text style={styles.logoText}>✨</Text>
              </View>
            </View>

            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to continue</Text>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={getInputStyle(emailFocused, emailError, emailValid)}
                placeholder="Enter your email"
                placeholderTextColor={Colors.placeholder}
                value={email}
                onChangeText={handleEmailChange}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!isLoading}
              />
              {emailError && <Text style={styles.errorText}>{emailError}</Text>}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={getInputStyle(
                    passwordFocused,
                    passwordError,
                    passwordValid,
                  )}
                  placeholder="Enter your password"
                  placeholderTextColor={Colors.placeholder}
                  value={password}
                  onChangeText={handlePasswordChange}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  secureTextEntry={!showPassword}
                  editable={!isLoading}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={togglePasswordVisibility}
                  activeOpacity={0.7}
                  disabled={isLoading}>
                  <Text style={styles.eyeIconText}>
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </Text>
                </TouchableOpacity>
              </View>
              {passwordError && (
                <Text style={styles.errorText}>{passwordError}</Text>
              )}
            </View>

            <TouchableOpacity
              style={[
                styles.loginButton,
                isLoading && styles.loginButtonDisabled,
              ]}
              activeOpacity={isLoading ? 1 : 0.8}
              onPress={handleLogin}
              disabled={isLoading}>
              <LinearGradient
                colors={
                  isLoading
                    ? [Colors.disabled || '#ccc', Colors.disabled || '#aaa']
                    : [Colors.primary, Colors.secondary]
                }
                style={styles.buttonGradient}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 0}}>
                {isLoading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator
                      size="small"
                      color={Colors.white || '#fff'}
                      style={styles.loadingSpinner}
                    />
                    <Text style={styles.buttonText}>Signing In...</Text>
                  </View>
                ) : (
                  <Text style={styles.buttonText}>Sign In</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </LinearGradient>

      <CustomModal
        visible={modalVisible}
        type={modalType}
        title={modalTitle}
        message={modalMessage}
        onClose={hideModal}
        primaryButtonText={getCurrentActions().primaryText}
        secondaryButtonText={getCurrentActions().secondaryText}
        onPrimaryPress={getCurrentActions().onPrimaryPress}
        onSecondaryPress={getCurrentActions().onSecondaryPress}
      />
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    minHeight: '100%',
  },
  circle1: {
    position: 'absolute',
    top: -50,
    left: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: Colors.transparentWhite10,
  },
  circle2: {
    position: 'absolute',
    top: 100,
    right: -80,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: Colors.transparentWhite08,
  },
  circle3: {
    position: 'absolute',
    bottom: -30,
    left: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.transparentWhite06,
  },
  loginCard: {
    width: '90%',
    backgroundColor: Colors.transparentWhite095,
    borderRadius: 25,
    padding: 30,
    alignItems: 'center',
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
    backdropFilter: 'blur(10px)',
  },
  logoContainer: {
    marginBottom: 20,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  logoText: {
    fontSize: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: 5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 30,
    textAlign: 'center',
  },
  inputContainer: {
    width: '100%',
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 8,
    marginLeft: 5,
  },
  input: {
    width: '100%',
    height: 55,
    backgroundColor: Colors.inputBackground,
    borderRadius: 15,
    paddingHorizontal: 20,
    fontSize: 16,
    color: Colors.textPrimary,
    borderWidth: 2,
    borderColor: Colors.inputBorder,
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  inputFocused: {
    borderColor: Colors.primary,
    backgroundColor: Colors.white,
    shadowColor: Colors.primary,
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  inputError: {
    borderColor: Colors.error,
    backgroundColor: Colors.inputErrorBackground,
    shadowColor: Colors.error,
  },
  inputValid: {
    borderColor: Colors.success,
    backgroundColor: Colors.inputSuccessBackground,
    shadowColor: Colors.success,
  },
  passwordContainer: {
    position: 'relative',
    width: '100%',
  },
  eyeIcon: {
    position: 'absolute',
    right: 15,
    top: 5,
    padding: 5,
    zIndex: 1,
  },
  eyeIconText: {
    fontSize: 20,
  },
  errorText: {
    color: Colors.error,
    fontSize: 12,
    marginTop: 5,
    marginLeft: 5,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 25,
  },
  forgotPasswordText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  loginButton: {
    width: '100%',
    height: 55,
    borderRadius: 15,
    marginVertical: 25,
    shadowColor: Colors.primary,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  buttonGradient: {
    flex: 1,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingSpinner: {
    marginRight: 8,
  },
});

export default LoginScreen;
