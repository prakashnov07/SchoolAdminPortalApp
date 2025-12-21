
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Alert,
  SafeAreaView,
} from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

const mainButtonColor = '#6a00ff';
const mainTextColor = '#fff';
const mainTextColorDark = '#4a00e0';

const styles = {
  otpCard: {
    backgroundColor: 'rgba(255,255,255, 0.95)',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    minHeight: 400,
    justifyContent: 'center',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 5 },
      android: { elevation: 6 },
    }),
  },
  otpIconCircle: { borderRadius: 50, padding: 15, marginBottom: 15, backgroundColor: mainButtonColor },
  secureLoginTitle: { fontSize: 26, fontWeight: 'bold', color: mainButtonColor },
  secureLoginSubtitle: { fontSize: 16, marginBottom: 20, color: mainButtonColor },
  otpInstruction: { textAlign: 'center', fontSize: 16, marginBottom: 25, color: mainTextColorDark },
  otpInputContainer: { flexDirection: 'row', justifyContent: 'space-between', width: '90%', marginBottom: 25 },
  otpInputBox: { borderRadius: 12, fontSize: 22, flex: 1, marginHorizontal: 4, height: 50, borderWidth: 1, paddingHorizontal: 0, backgroundColor: '#f3e5f5', color: mainButtonColor, borderColor: mainButtonColor },
  submitOtpButton: { paddingVertical: 15, paddingHorizontal: 80, borderRadius: 14, marginBottom: 15, backgroundColor: mainButtonColor },
  submitOtpButtonText: { fontWeight: 'bold', fontSize: 20, color: mainTextColor },
  resendOtpText: { textDecorationLine: 'underline', marginBottom: 20, fontSize: 16, color: mainButtonColor },
  securityFooterText: { fontSize: 12, color: mainTextColorDark },
};

export default function OTPVerificationScreen({ route, navigation }) {
  const { mobile, branch } = route.params;
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const inputsRef = useRef([]);

  useEffect(() => {
    // Focus first input after component is fully mounted
    const focusFirstInput = () => {
      if (inputsRef.current[0]) {
        inputsRef.current[0].focus();
      }
    };
    
    // Use a more reliable way to focus after render
    const timer = requestAnimationFrame(() => {
      requestAnimationFrame(focusFirstInput);
    });
    
    return () => cancelAnimationFrame(timer);
  }, []);

  const handleOtpChange = (text, index) => {
    if (/^\d*$/.test(text)) {
      const newOtp = [...otp];
      newOtp[index] = text;
      setOtp(newOtp);
      if (text && index < inputsRef.current.length - 1) {
        inputsRef.current[index + 1].focus();
      } else if (!text && index > 0) {
        inputsRef.current[index - 1].focus();
      }
    }
  };

  const submitOtp = () => {
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      Alert.alert('Invalid OTP', 'Please enter the 6-digit OTP.');
      return;
    }
    Keyboard.dismiss();
    Alert.alert('Success', `Logged in with mobile: ${mobile} on branch: ${branch}`);
    navigation.replace('MainTabs');
  };

  const resendOtp = () => {
    Alert.alert('OTP Resent', `OTP resent to ${mobile}`);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#8e2de2' }}>
      <KeyboardAvoidingView
        style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 20 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View style={styles.otpCard}>
          <View style={styles.otpIconCircle}>
            <Icon name="shield-lock" size={48} color={mainTextColor} />
          </View>
          <Text style={styles.secureLoginTitle}>Secure Login</Text>
          <Text style={styles.secureLoginSubtitle}>Goldentots School Portal</Text>
          <Text style={styles.otpInstruction}>
            Mobile Number Verification{'\n'}We've sent a verification code to your registered mobile number
          </Text>
          <View style={styles.otpInputContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={`otp-${index}`}
                style={styles.otpInputBox}
                keyboardType="numeric"
                maxLength={1}
                value={digit}
                onChangeText={(text) => handleOtpChange(text, index)}
                ref={(ref) => {
                  if (ref) {
                    inputsRef.current[index] = ref;
                  }
                }}
                returnKeyType={index === 5 ? 'done' : 'next'}
                textAlign="center"
                autoCorrect={false}
                autoComplete="off"
              />
            ))}
          </View>
          <TouchableOpacity style={styles.submitOtpButton} onPress={submitOtp}>
            <Text style={styles.submitOtpButtonText}>Submit</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={resendOtp}>
            <Text style={styles.resendOtpText}>Didn’t receive the code? Resend OTP</Text>
          </TouchableOpacity>
          <Text style={styles.securityFooterText}>Protected by advanced security protocols</Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}