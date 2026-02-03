import React, { useState, useContext, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator, StyleSheet, Modal, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import axios from 'axios';
import Toast from 'react-native-toast-message';

import { CoreContext } from '../context/CoreContext';
import { StyleContext } from '../context/StyleContext';

export default function MessageSettingsScreen() {
  const { schoolData, branchid, owner, getSchoolData } = useContext(CoreContext);
  const styleContext = useContext(StyleContext);

  if (!styleContext) {
    throw new Error('MessageSettingsScreen must be used within a StyleProvider');
  }

  const {
    blackColor,
    container,
    button,
    buttonText,
    label,
    pickerWrapper,
    picker,
    pickerButton,
    pickerButtonText
  } = styleContext;

  const months = [
    { id: 1, name: 'April' },
    { id: 2, name: 'May' },
    { id: 3, name: 'June' },
    { id: 4, name: 'July' },
    { id: 5, name: 'August' },
    { id: 6, name: 'September' },
    { id: 7, name: 'October' },
    { id: 8, name: 'November' },
    { id: 9, name: 'December' },
    { id: 10, name: 'January' },
    { id: 11, name: 'February' },
    { id: 12, name: 'March' },
  ];

  const [nom, setNom] = useState(schoolData?.re_msg_month || 0); // Restricted message month
  const [attendanceDate, setAttendanceDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
     if (schoolData?.re_msg_month) {
         setNom(schoolData.re_msg_month);
     }
  }, [schoolData]);

  const onChangeDate = (event, selectedDate) => {
    const currentDate = selectedDate || attendanceDate;
    setShowDatePicker(Platform.OS === 'ios');
    setAttendanceDate(currentDate);
  };

  const onDateMessageDelete = () => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete messages for this date?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setDeleteLoading(true);
            const day = attendanceDate.getDate().toString().padStart(2, '0');
            const month = (attendanceDate.getMonth() + 1).toString().padStart(2, '0');
            const year = attendanceDate.getFullYear();
            const formattedDate = `${day}-${month}-${year}`;

            axios.post('/deletedatemessages', { owner, branchid, attendancedate: formattedDate })
              .then(response => {
                setDeleteLoading(false);
                Toast.show({ type: 'success', text1: 'Messages deleted successfully.' });
              })
              .catch(e => {
                setDeleteLoading(false);
                console.log(e);
                Alert.alert('Error', 'Failed to delete messages.');
              });
          }
        }
      ]
    );
  };

  const onUpdateMonth = () => {
    if (nom == 0) {
      Alert.alert('Validation', 'Please select a valid month.');
      return;
    }
    setLoading(true);
    axios.post('/updatemessagefeemonth', { nom, branchid })
      .then(response => {
        setLoading(false);
        if (response.data.result === 'ok') {
          Toast.show({ type: 'success', text1: 'Month Updated successfully.' });
          getSchoolData(); // Refresh school data to update context
        } else {
          Alert.alert('Error', 'Failed to update month.');
        }
      })
      .catch(e => {
        setLoading(false);
        console.log(e);
        Alert.alert('Error', 'Network error or server issue.');
      });
  };

  const onClearMonth = () => {
     setNom(0);
     setLoading(true);
     axios.post('/updatemessagefeemonth', { nom: 0, branchid })
      .then(response => {
        setLoading(false);
        if (response.data.result === 'ok') {
            Toast.show({ type: 'success', text1: 'Restricted Month Cleared.' });
            getSchoolData();
        } else {
             Alert.alert('Error', 'Failed to clear settings.');
        }
      })
      .catch(e => {
          setLoading(false);
           console.log(e);
      });
  };
  
  const getSelectedMonthName = () => {
      const m = months.find(x => x.id == nom);
      return m ? m.name : 'None';
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f4e0ff' }} edges={['bottom', 'left', 'right']}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        
        {/* Delete Messages Section */}
        <View style={styles.card}>
          <Text style={[label, { fontSize: 18, marginBottom: 15 }]}>Delete Messages by Date</Text>
          
          <View style={{ marginBottom: 20 }}>
            <Text style={label}>Select Date</Text>
             {Platform.OS === 'android' ? (
                <TouchableOpacity style={pickerButton} onPress={() => setShowDatePicker(true)}>
                  <Text style={pickerButtonText}>{attendanceDate.toDateString()}</Text>
                  <Icon name="calendar" size={24} color={blackColor} />
                </TouchableOpacity>
              ) : (
                 <DateTimePicker
                   value={attendanceDate}
                   mode="date"
                   display="default"
                   onChange={onChangeDate}
                   style={{ width: '100%' }}
                 />
              )}
               {showDatePicker && Platform.OS === 'android' && (
                <DateTimePicker
                  value={attendanceDate}
                  mode="date"
                  display="default"
                  onChange={onChangeDate}
                />
              )}
          </View>

          <TouchableOpacity style={[button, { backgroundColor: '#FF6B6B' }]} onPress={onDateMessageDelete} disabled={deleteLoading}>
             {deleteLoading ? <ActivityIndicator color="#fff" /> : <Text style={buttonText}>Delete Messages</Text>}
          </TouchableOpacity>
        </View>

        {/* Restricted Month Settings */}
        <View style={styles.card}>
           <Text style={[label, { fontSize: 18, marginBottom: 10 }]}>Restricted Message Settings</Text>
           <Text style={{ marginBottom: 15, color: '#555' }}>
               {nom == 0 
                 ? 'Restricted Message Month not set.' 
                 : `Fee should be paid till ${getSelectedMonthName()} to view Restricted Messages.`}
           </Text>

           <Text style={label}>Select Month</Text>
           <View style={pickerWrapper}>
                <Picker selectedValue={nom} onValueChange={setNom} style={picker} dropdownIconColor={blackColor}>
                  <Picker.Item label="Select Month" value={0} color={blackColor} />
                  {months.map((m) => (
                    <Picker.Item key={m.id} label={m.name} value={m.id} color={blackColor} />
                  ))}
                </Picker>
           </View>

           <TouchableOpacity style={[button, { marginTop: 20 }]} onPress={onUpdateMonth} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={buttonText}>Save Settings</Text>}
           </TouchableOpacity>

            <TouchableOpacity style={[button, { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#FF6B6B', marginTop: 10, elevation: 0, shadowOpacity: 0 }]} onPress={onClearMonth} disabled={loading}>
              <Text style={[buttonText, { color: '#FF6B6B' }]}>Clear Settings</Text>
           </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  }
});
