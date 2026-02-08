import React, { createContext } from 'react';
import { Platform } from 'react-native';

export const StyleContext = createContext();

export function StyleProvider({ children }) {

    const blackColor = '#000';
    const mainButtonColor = '#5a45d4'; // Updated to Admin primary
    const mainTextColorDark = '#4a00e0';
    const mainTextColor = '#fff';
    const mainBackgroundGradient = ['#5a45d4', '#8562ff']; // Admin Gradient

    const colors = {
        primary: '#5a45d4',
        secondary: '#8562ff',
        success: '#388e3c',
        error: '#d32f2f',
        warning: '#fbc02d',
        info: '#1976d2',
        purple: '#9c27b0',
        pink: '#e91e63',
        white: '#fff',
        grey: '#ddd',
        darkGrey: '#555',
    };

    const background = {
        flex: 1,
        width: '100%',
        height: '100%',
        backgroundColor: '#f4e0ff',
    };

    // Header Style container
    const headerContainer = {
        paddingTop: Platform.OS === 'android' ? 40 : 24,
        paddingBottom: 24,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    };

    const container = {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 30,
        backgroundColor: '#f4e0ff',
    };

    // Updated Card to match featureBox
    const card = {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        marginVertical: 10,
        ...Platform.select({
            ios: {
                shadowColor: '#a1887f',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.15,
                shadowRadius: 3,
            },
            android: {
                elevation: 3,
            },
        }),
        borderWidth: 1,
        borderColor: blackColor, // Consistent black border
    };

    const headerTitle = {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 4,
    };

    const subTitle = {
        textAlign: 'center',
        fontSize: 18,
        marginBottom: 30,
        color: blackColor,
    };
    const mobileInputContainer = {
        marginBottom: 20,
    };
    const label = {
        fontWeight: '700',
        marginBottom: 8,
        fontSize: 16,
        color: blackColor,
    };

    // Updated Input to match SendMessages theme
    const input = {
        width: '100%',
        borderWidth: 1,
        borderRadius: 16,
        paddingHorizontal: 18,
        paddingVertical: 14,
        fontSize: 16,
        backgroundColor: '#f4e0ff',
        color: blackColor,
        borderColor: blackColor,
    };

    const button = {
        paddingVertical: 16,
        borderRadius: 24,
        alignItems: 'center',
        marginBottom: 20,
        backgroundColor: mainButtonColor,
        elevation: 8,
        overflow: 'hidden', 
    };
    const buttonText = {
      fontSize: 20,
      fontWeight: 'bold',
      color: mainTextColor,
    };
    const infoBox = {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      borderRadius: 12,
      marginBottom: 20,
        backgroundColor: 'rgba(90, 69, 212, 0.1)', // #5a45d4 with opacity
    };
    const infoText = {
      marginLeft: 10,
      fontSize: 14,
      color: mainButtonColor,
    };
    const footerText = {
      textAlign: 'center',
      fontWeight: '600',
      fontSize: 14,
      color: mainButtonColor,
    };
    const branchPickerContainer = {
        marginBottom: 28,
    };

    // Updated Picker styles
    const pickerWrapper = {
        width: '100%',
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: blackColor,
        backgroundColor: '#d6bee7',
    };
    const picker = {
        height: 50,
        color: blackColor
    };
    // Migrated SendMessagesScreen Styles
    const pageTitle = {
        fontSize: 28,
        fontWeight: '900',
        marginBottom: 24,
        textAlign: 'center',
        color: blackColor,
    };
    const attachmentContainer = { flexDirection: 'row', marginTop: 18, marginBottom: 10, justifyContent: 'space-between' };
    const attachmentOption = {
        flex: 1,
        marginHorizontal: 6,
        paddingVertical: 14,
        borderRadius: 16,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        borderColor: blackColor,
    };
    const attachmentOptionSelected = {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    };
    const attachmentOptionText = { marginTop: 6, fontWeight: '600', fontSize: 16, color: blackColor };
    const attachmentInfo = { marginTop: 8, fontStyle: 'italic', fontSize: 14, textAlign: 'center', color: blackColor };

    const pickerButton = {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 12,
        borderColor: blackColor,
        backgroundColor: '#d6bee7',
    };
    const pickerButtonText = { fontSize: 16, color: blackColor };

    // Picker Modal Styles
    const pickerModalOverlay = {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        paddingHorizontal: 40,
    };
    const pickerModalContent = { backgroundColor: '#fff', borderRadius: 16, padding: 20 };
    const pickerModalTitle = { fontSize: 18, fontWeight: 'bold', marginBottom: 12, textAlign: 'center' };
    const pickerModalItem = { paddingVertical: 12, paddingHorizontal: 10, borderBottomColor: '#ddd', borderBottomWidth: 1 };
    const pickerModalItemSelected = { backgroundColor: '#d1bee7' };
    const pickerModalItemText = { fontSize: 16, color: '#000' };
    const pickerModalItemTextSelected = { fontWeight: 'bold', color: mainTextColor };
    const pickerModalButtons = { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 };
    const pickerModalButton = { flex: 1, alignItems: 'center', paddingVertical: 10 };
    const pickerModalButtonText = { fontSize: 16, fontWeight: 'bold', color: mainTextColor };

    const titleColor = '#4a00e0'; // Global Title Color (Deep Indigo)

    // Global Glassmorphism Filter Container (Extracted from ManageAttendanceScreen)
    const glassFilterContainer = {
        backgroundColor: 'rgba(255,255,255,0.7)',
        padding: 15,
        margin: 15,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.5)',
        ...Platform.select({
            ios: {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 2,
            },
            android: {
                elevation: 2,
            },
        }),
    };

    // White Button/Input style for inside Glass Container
    const whitePickerButton = {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#ddd',
        backgroundColor: '#fff',
        marginBottom: 10,
    };

    // Search Button Style
    const searchButton = {
        backgroundColor: '#6a00ff',
        borderRadius: 10,
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 2,
    };

    return (
        <StyleContext.Provider value={{
            mainButtonColor,
            mainTextColor,
            mainTextColorDark,
            blackColor,
            mainBackgroundGradient,
            colors,
            headerContainer,
            background,
            container,
            card,
            headerTitle,
            subTitle,
            pageTitle, // Added
            titleColor,
            mobileInputContainer,
            label,
            input,
            button,
            buttonText,
            branchPickerContainer,
            pickerWrapper,
            picker,
            pickerButton, // Added
            pickerButtonText, // Added
            attachmentContainer, // Added
            attachmentOption, // Added
            attachmentOptionSelected, // Added
            attachmentOptionText, // Added
            attachmentInfo, // Added
            pickerModalOverlay, // Added
            pickerModalContent, // Added
            pickerModalTitle, // Added
            pickerModalItem, // Added
            pickerModalItemSelected, // Added
            pickerModalItemText, // Added
            pickerModalItemTextSelected, // Added
            pickerModalButtons, // Added
            pickerModalButton, // Added
            pickerModalButtonText, // Added
            glassFilterContainer, // Added Global
            whitePickerButton, // Ensure this matches ManageAttendanceScreen style
            standardPickerButton: { // Explicitly named for clarity
                backgroundColor: '#fff',
                borderRadius: 10,
                paddingVertical: 12,
                paddingHorizontal: 15,
                borderWidth: 1,
                borderColor: '#ddd',
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
            },
            searchButton, // Added Global
        }}>
            {children}
        </StyleContext.Provider>
    );
};