import React, { useState, useRef, useContext, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  Modal,
  FlatList as RNFlatList,
  Alert,
} from 'react-native';
import { StyleContext } from '../context/StyleContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CoreContext } from '../context/CoreContext';





export default function MobileNumberVerificationScreen({ navigation }) {

  const coreContext = useContext(CoreContext);

  const [mobile, setMobile] = useState('');
  const [branch, setBranch] = useState('');
  const [branches, setBranches] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [showBranchList, setShowBranchList] = useState(false);
  const [selectedBranchName, setSelectedBranchName] = useState('');
  const inputRef = useRef(null);

  const styleContext = useContext(StyleContext);

  if (!styleContext) {
    throw new Error('MobileNumberVerificationScreen must be used within a StyleProvider');
  }


  const { blackColor, mainButtonColor, mainTextColorDark, mainTextColor, mainBackgroundGradient } = styleContext;

  const branchPickerStyles = {
    pickerButton: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: blackColor,
      backgroundColor: '#f7f0ff',
    },
    pickerButtonText: {
      fontSize: 16,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.3)',
      justifyContent: 'center',
      paddingHorizontal: 40,
    },
    modalContent: {
      backgroundColor: '#fff',
      borderRadius: 16,
      maxHeight: 250,
    },
    modalItem: {
      paddingVertical: 14,
      paddingHorizontal: 20,
      borderBottomColor: '#ddd',
      borderBottomWidth: 1,
    },
    modalItemText: {
      fontSize: 16,
      color: blackColor,
    },
  };

  const loginStyles = {
    background: {
      flex: 1,
      width: '100%',
      height: '100%',
    },
    container: {
      flexGrow: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 30,
    },
    verificationCard: {
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderRadius: 20,
      padding: 30,
      width: '100%',
      maxWidth: 420,
      ...Platform.select({
        ios: {
          shadowColor: '#4a00e0',
          shadowOffset: { width: 0, height: 15 },
          shadowOpacity: 0.3,
          shadowRadius: 20,
        },
        android: {
          elevation: 10,
        },
      }),
    },
    headerTitle: {
      fontSize: 30,
      fontWeight: '900',
      textAlign: 'center',
      marginBottom: 8,
      color: mainButtonColor,
    },
    subTitle: {
      textAlign: 'center',
      fontSize: 18,
      marginBottom: 30,
      color: mainButtonColor,
    },
    mobileInputContainer: {
      marginBottom: 20,
    },
    label: {
      fontWeight: '700',
      marginBottom: 8,
      fontSize: 16,
      color: mainButtonColor,
    },
    input: {
      borderWidth: 1,
      borderRadius: 14,
      paddingHorizontal: 18,
      paddingVertical: 14,
      fontSize: 18,
      backgroundColor: '#f7f0ff',
      color: mainTextColorDark,
      borderColor: mainButtonColor,
    },
    branchPickerContainer: {
      marginBottom: 28,
    },
    pickerWrapper: {
      borderRadius: 14,
      overflow: 'hidden',
    },
    picker: {},
    sendOTPButton: {
      paddingVertical: 16,
      borderRadius: 18,
      alignItems: 'center',
      marginBottom: 20,
      backgroundColor: mainButtonColor,
      ...Platform.select({
        ios: {
          shadowColor: '#6a00ff',
          shadowOffset: { width: 0, height: 5 },
          shadowOpacity: 0.6,
          shadowRadius: 10,
        },
        android: {
          elevation: 6,
        },
      }),
    },
    sendOTPButtonText: {
      fontSize: 20,
      fontWeight: 'bold',
      color: mainTextColor,
    },
    infoBox: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      borderRadius: 12,
      marginBottom: 20,
      backgroundColor: 'rgba(106, 0, 255, 0.15)',
    },
    infoText: {
      marginLeft: 10,
      fontSize: 14,
      color: mainButtonColor,
    },
    footerText: {
      textAlign: 'center',
      fontWeight: '600',
      fontSize: 14,
      color: mainButtonColor,
    },
  };

  useEffect(() => {
    async function initializeAuth() {
      try {
        await setAuthHeader();
      } catch (error) {
        console.error('setAuthHeader failed:', error);
      }

      try {
        coreContext.checkIfVerified(navigation);
      } catch (error) {
        console.error('checkIfVerified failed:', error);
      }

      try {
        coreContext.getGroupBranches();
      } catch (error) {
        console.error('getGroupBranches failed:', error);
      }

      getAllBranches();
    }
    initializeAuth();
  }, []);

  const setAuthHeader = async () => {
    try {
      const branchAppId = await AsyncStorage.getItem('branchAppId');
      if (branchAppId) {
        axios.defaults.headers.common.Authorization = JSON.parse(branchAppId);
      }
    } catch (error) {
      console.error('AsyncStorage error:', error);
    }
  };

  const getAllBranches = async () => {
    try {
      console.log('Fetching branches...');
      const response = await axios.get('/getallbranches', {
        params: { fcm_project: 'noticeboard-1' }
      });
      // console.log('Branches response:', response.data.allbranches[0]?.branchname);
      if (response.data && response.data.allbranches) {
        setBranches(response.data.allbranches);
      }
    } catch (error) {
      console.error('Error fetching branches:', error.message);
      Alert.alert('Error', 'Failed to load branches. Please check your connection.');
    }
  };


  function BranchPicker({ selectedValue, onValueChange, blackColor, branchPickerStyles, branches }) {
    const [modalVisible, setModalVisible] = useState(false);
    const [localSearchText, setLocalSearchText] = useState('');

    const handleSelect = async (branchItem) => {
      onValueChange(branchItem.branchid);
      axios.defaults.headers.common.Authorization = branchItem.appid;
      await AsyncStorage.setItem('branchAppId', JSON.stringify(branchItem.appid));

      setLocalSearchText('');
      setModalVisible(false);

      Toast.show({
        type: 'success',
        text1: 'Branch Selected',
        text2: `You have selected ${branchItem.branchname}`,
      });
    };

    const handleModalClose = () => {
      setModalVisible(false);
      setLocalSearchText('');
    };

    const getFilteredBranches = () => {
      if (!localSearchText) {
        return [];
      }

      if (branch) {
        return branches?.filter(branch => branch.branchid === branch);
      }

      return branches?.filter(branch =>
        branch.branchname.toLowerCase().includes(localSearchText.toLowerCase())
      );
    };

    const selectedLabel = branches.find((b) => b.branchid === selectedValue)?.branchname || 'Select a Branch...';

    return (
      <View>
        <TouchableOpacity
          style={branchPickerStyles?.pickerButton}
          onPress={() => { setModalVisible(true); setBranch(''); setSearchText(''); }}
          activeOpacity={0.7}
        >
          <Text
            style={[
              branchPickerStyles?.pickerButtonText,
              selectedValue ? { color: blackColor } : { color: '#999' }
            ]}
          >
            {selectedLabel}
          </Text>
          <Icon name="menu-down" size={24} color={blackColor} />
        </TouchableOpacity>
        <Modal
          visible={modalVisible}
          transparent
          animationType="fade"
          onRequestClose={handleModalClose}
        >
          <TouchableWithoutFeedback onPress={handleModalClose}>
            <View style={branchPickerStyles?.modalOverlay}>
              <TouchableWithoutFeedback>
                <View style={branchPickerStyles?.modalContent}>
                  <View style={{
                    backgroundColor: '#f0f0f0',
                    paddingHorizontal: 10,
                    paddingVertical: 8,
                    borderBottomWidth: 1,
                    borderBottomColor: '#ddd'
                  }}>
                    <TextInput
                      placeholder="Type to search your branch ..."
                      onChangeText={setLocalSearchText}
                      value={localSearchText}
                      style={{
                        fontSize: 16,
                        paddingVertical: 8,
                        paddingHorizontal: 10,
                        backgroundColor: '#fff',
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: '#ccc'
                      }}
                      placeholderTextColor="#999"
                    />
                  </View>
                  <RNFlatList
                    keyboardShouldPersistTaps='always'
                    data={getFilteredBranches()}
                    keyExtractor={(item) => item.branchid}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={branchPickerStyles?.modalItem}
                        onPress={() => handleSelect(item)}
                      >
                        <Text style={branchPickerStyles?.modalItemText}>{item.branchname}</Text>
                      </TouchableOpacity>
                    )}
                  />
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </View>
    );
  }


  const sendOTP = () => {
    Keyboard.dismiss();
    if (!mobile.match(/^[0-9]{10}$/)) {
      Alert.alert('Invalid Mobile Number', 'Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!branch) {
      Alert.alert('Select Branch', 'Please select your branch.');
      return;
    }
    Toast.show({
          type: 'info',
          text1: 'verifying mobile number',
          text2: 'Please wait, we are sending an OTP on your registered mobile number ..',
        });

    axios.get('/send-staff-otp', { params: { phone: mobile, branchid : branch, stutype : 'existing'} })
      .then((response) => {
        const status = response.data.result;
        const otp = response.data.hasOtp;
        const branchid = response.data.userbranchid;
        console.log(status); console.log(otp);
        if (status === 'ok') {
          coreContext.setOtp(otp);
          coreContext.setBranchid(branchid);
          coreContext.setVerified('ok');
           Toast.show({
          type: 'success',
          text1: 'OTP sent',
          text2: 'Check OTP on your WHATSAPP / SMS',
        });
         navigation.replace('OTPVerification', { mobile, branch });
        } else {
          coreContext.setVerified('fail');
          Toast.show({
            type: 'error',
            text1: 'Error',
            text2: 'Mobile number not found in the school records. Please contact school admin.',
          });

          Alert.alert('Error', 'Mobile number not found in the school records. Please contact school admin.');

        }
      })
      .catch(error => {
        console.log(error.message);
      });
  };

  return (
    <LinearGradient
      colors={mainBackgroundGradient}
      style={loginStyles.background}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <ScrollView
              contentContainerStyle={loginStyles.container}
              keyboardShouldPersistTaps="handled"
            >
              <View style={loginStyles.verificationCard}>
                <Text style={loginStyles.headerTitle}>🎓 School Portal</Text>
                <Text style={loginStyles.subTitle}>Welcome to Your Digital Campus</Text>

                <View style={loginStyles.mobileInputContainer}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                    <Icon name="cellphone" size={18} color={mainButtonColor} />
                    <Text style={[loginStyles.label, { marginBottom: 0, marginLeft: 5 }]}>
                      Enter your Registered Mobile Number
                    </Text>
                  </View>
                  <TextInput
                    ref={inputRef}
                    style={loginStyles.input}
                    placeholder="Mobile Number"
                    keyboardType="phone-pad"
                    maxLength={10}
                    placeholderTextColor="#aaa"
                    value={mobile}
                    onChangeText={setMobile}
                    returnKeyType="done"
                    onSubmitEditing={Keyboard.dismiss}
                  />
                </View>

                <View style={loginStyles.branchPickerContainer}>
                  <Text style={loginStyles.label}>Select Your Branch</Text>
                  {
                    blackColor && branchPickerStyles ? (
                      <BranchPicker
                        selectedValue={branch}
                        onValueChange={setBranch}
                        blackColor={blackColor}
                        branchPickerStyles={branchPickerStyles}
                        branches={branches}
                      />
                    ) : (
                      <Text>Loading...</Text>
                    )
                  }
                </View>

                <TouchableOpacity style={loginStyles.sendOTPButton} onPress={sendOTP}>
                  <Text style={loginStyles.sendOTPButtonText}>Send OTP</Text>
                </TouchableOpacity>

                <View style={loginStyles.infoBox}>
                  <Icon name="lock" size={16} color={mainButtonColor} />
                  <Text style={loginStyles.infoText}>Your information is secure and encrypted</Text>
                </View>

                <Text style={loginStyles.footerText}>Powered by Siddhanta Technology Services</Text>
              </View>
            </ScrollView>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </SafeAreaView>
      <Toast />
    </LinearGradient>
  );
}