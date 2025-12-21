import React, { createContext } from 'react';
import { Platform } from 'react-native';

export const StyleContext = createContext();

export function StyleProvider({ children }) {

    const blackColor = '#000';
    const mainButtonColor = '#6a00ff';
    const mainTextColorDark = '#4a00e0';
    const mainTextColor = '#fff';
    const mainBackgroundGradient = ['#8e2de2', '#4a00e0'];
    const background = {
        flex: 1,
        width: '100%',
        height: '100%',
    };
    const container = {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 30,
    };
    const card = {
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
    };
    const headerTitle = {
        fontSize: 30,
        fontWeight: '900',
        textAlign: 'center',
        marginBottom: 8,
        color: mainButtonColor,
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
      backgroundColor: 'rgba(106, 0, 255, 0.15)',
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
    const picker = {};
    return (
        <StyleContext.Provider value={{
            mainButtonColor,
            mainTextColor,
            mainTextColorDark,
            blackColor,
            mainBackgroundGradient,
            background,
            container,
            card,
            headerTitle,
            subTitle,
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