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
        backgroundColor: '#fff',
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
        borderColor: '#eee', // Subtle border
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
        color: mainButtonColor,
    };
    const mobileInputContainer = {
        marginBottom: 20,
    };
    const label = {
        fontWeight: '700',
        marginBottom: 8,
        fontSize: 16,
        color: mainButtonColor,
    };
    const input = {
        borderWidth: 1,
        borderRadius: 14,
        paddingHorizontal: 18,
        paddingVertical: 14,
        fontSize: 18,
        backgroundColor: '#f7f0ff',
        color: mainTextColorDark,
        borderColor: mainButtonColor,
    };
    const button = {
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
    const pickerWrapper = {
        borderRadius: 14,
        overflow: 'hidden',
    };
    const picker = {}; // Re-added deleted definition
    const titleColor = '#4a00e0'; // Global Title Color (Deep Indigo)

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
            titleColor, // Exported Global Title Color
            mobileInputContainer,
            label,
            input,
            branchPickerContainer,
            pickerWrapper,
            picker,
        }}>
            {children}
        </StyleContext.Provider>
    );
};