import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import MobileNumberVerificationScreen from '../../screens/MobileNumberVerificationScreen';

describe('MobileNumberVerificationScreen', () => {
  const navigate = jest.fn();

  const navigation = {
    navigate
  };

  it('renders correctly', () => {
    const { getByText, getByPlaceholderText } = render(
      <MobileNumberVerificationScreen navigation={navigation} />
    );

    expect(getByText('Enter your mobile number:')).toBeTruthy();
    expect(getByPlaceholderText('e.g. 1234567890')).toBeTruthy();
  });

  it('shows error on invalid input', async () => {
    const { getByText, getByPlaceholderText, queryByText } = render(
      <MobileNumberVerificationScreen navigation={navigation} />
    );

    const input = getByPlaceholderText('e.g. 1234567890');
    fireEvent.changeText(input, 'abc123');

    fireEvent.press(getByText('Send OTP'));

    await waitFor(() => {
      expect(getByText('Please enter a valid mobile number (6 to 15 digits).')).toBeTruthy();
    });

    // Fix input
    fireEvent.changeText(input, '1234567890');
    fireEvent.press(getByText('Send OTP'));

    await waitFor(() => {
      expect(queryByText('Please enter a valid mobile number (6 to 15 digits).')).toBeNull();
      expect(navigate).toHaveBeenCalledWith('OTPVerification', { mobileNumber: '1234567890' });
    });
  });
});
