import React, {useEffect, useRef} from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
  StyleSheet,
  StatusBar,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const {width, height} = Dimensions.get('window');

const CustomModal = ({
  visible,
  type,
  title,
  message,
  onClose,
  primaryButtonText,
  secondaryButtonText,
  onPrimaryPress,
  onSecondaryPress,
  autoClose = false,
  autoCloseDelay = 3000,
}) => {
  const scaleValue = useRef(new Animated.Value(0)).current;
  const opacityValue = useRef(new Animated.Value(0)).current;
  const slideValue = useRef(new Animated.Value(50)).current;
  const pulseValue = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleValue, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(opacityValue, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideValue, {
          toValue: 0,
          tension: 80,
          friction: 6,
          useNativeDriver: true,
        }),
      ]).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseValue, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseValue, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
      ).start();

      if (autoClose) {
        const timer = setTimeout(() => {
          handleClose();
        }, autoCloseDelay);
        return () => clearTimeout(timer);
      }
    } else {
      scaleValue.setValue(0);
      opacityValue.setValue(0);
      slideValue.setValue(50);
      pulseValue.setValue(1);
    }
  }, [visible, autoClose, autoCloseDelay]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(scaleValue, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacityValue, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideValue, {
        toValue: 30,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose && onClose();
    });
  };

  const handlePrimaryPress = () => {
    if (onPrimaryPress) {
      onPrimaryPress();
    } else {
      handleClose();
    }
  };

  const handleSecondaryPress = () => {
    if (onSecondaryPress) {
      onSecondaryPress();
    } else {
      handleClose();
    }
  };

  const getConfig = () => {
    if (type === 'success') {
      return {
        gradientColors: ['#00C9FF', '#92FE9D'],
        iconBgColors: ['#51CF66', '#40E0D0'],
        icon: '✓',
        titleColor: '#2D5016',
        messageColor: '#4A7C28',
        primaryButtonColors: ['#51CF66', '#40C057'],
        shadowColor: '#51CF66',
        overlayColor: 'rgba(76, 175, 80, 0.1)',
      };
    } else {
      return {
        gradientColors: ['#FF6B9D', '#C44569'],
        iconBgColors: ['#FF6B6B', '#FF5252'],
        icon: '✕',
        titleColor: '#8B0000',
        messageColor: '#D32F2F',
        primaryButtonColors: ['#FF6B6B', '#FF5252'],
        shadowColor: '#FF6B6B',
        overlayColor: 'rgba(244, 67, 54, 0.1)',
      };
    }
  };

  const config = getConfig();

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleClose}>
      <StatusBar backgroundColor="rgba(0,0,0,0.5)" barStyle="light-content" />

      <Animated.View
        style={[
          styles.overlay,
          {
            opacity: opacityValue,
            backgroundColor: config.overlayColor,
          },
        ]}>
        <View style={styles.backdrop} />

        <Animated.View
          style={[
            styles.modalContainer,
            {
              transform: [{scale: scaleValue}, {translateY: slideValue}],
              opacity: opacityValue,
            },
          ]}>
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.25)', 'rgba(255, 255, 255, 0.1)']}
            style={styles.glassBackground}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
          />

          <View
            style={[
              styles.decorativeCircle1,
              {backgroundColor: config.overlayColor},
            ]}
          />
          <View
            style={[
              styles.decorativeCircle2,
              {backgroundColor: config.overlayColor},
            ]}
          />

          <Animated.View
            style={[
              styles.iconContainer,
              {
                transform: [{scale: pulseValue}],
              },
            ]}>
            <LinearGradient
              colors={config.iconBgColors}
              style={styles.iconBackground}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}>
              <Text style={styles.icon}>{config.icon}</Text>
            </LinearGradient>

            <View
              style={[styles.ripple, {borderColor: config.iconBgColors[0]}]}
            />
            <View
              style={[styles.ripple2, {borderColor: config.iconBgColors[1]}]}
            />
          </Animated.View>

          <View style={styles.content}>
            <Text style={[styles.title, {color: config.titleColor}]}>
              {title || (type === 'success' ? 'Success!' : 'Error!')}
            </Text>

            {message && (
              <Text style={[styles.message, {color: config.messageColor}]}>
                {message}
              </Text>
            )}
          </View>

          <View style={styles.buttonContainer}>
            {secondaryButtonText && (
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={handleSecondaryPress}
                activeOpacity={0.8}>
                <Text style={styles.secondaryButtonText}>
                  {secondaryButtonText}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.primaryButton,
                secondaryButtonText && styles.primaryButtonFlex,
              ]}
              onPress={handlePrimaryPress}
              activeOpacity={0.8}>
              <LinearGradient
                colors={config.primaryButtonColors}
                style={styles.primaryButtonGradient}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 0}}>
                <Text style={styles.primaryButtonText}>
                  {primaryButtonText}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalContainer: {
    width: width * 0.85,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 25,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 15,
    },
    shadowOpacity: 0.3,
    shadowRadius: 25,
    elevation: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  glassBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 25,
  },
  decorativeCircle1: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 80,
    height: 80,
    borderRadius: 40,
    opacity: 0.3,
  },
  decorativeCircle2: {
    position: 'absolute',
    bottom: -20,
    left: -20,
    width: 60,
    height: 60,
    borderRadius: 30,
    opacity: 0.2,
  },
  iconContainer: {
    marginBottom: 25,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBackground: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 12,
  },
  icon: {
    fontSize: 35,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  ripple: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    opacity: 0.3,
  },
  ripple2: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1,
    opacity: 0.2,
  },
  content: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.9,
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
    gap: 15,
  },
  primaryButton: {
    flex: 1,
    height: 50,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  primaryButtonFlex: {
    flex: 0.6,
  },
  primaryButtonGradient: {
    flex: 1,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  secondaryButton: {
    flex: 0.4,
    height: 50,
    borderRadius: 15,
    backgroundColor: 'rgba(108, 99, 255, 0.1)',
    borderWidth: 1.5,
    borderColor: 'rgba(108, 99, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#6C63FF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});

export default CustomModal;
