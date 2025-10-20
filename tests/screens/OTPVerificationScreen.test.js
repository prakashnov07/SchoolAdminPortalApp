import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import OTPVerificationScreen from '../../screens/OTPVerificationScreen';

describe('OTPVerificationScreen', () => {
  const reset = jest.fn();

  const navigation = {
    reset
  };

  const route = {
    params: {
      mobileNumber: '1234567890'
    }
  };

  it('renders correctly', () => {
    const { getByText, getByPlaceholderText } = render(
      <OTPVerificationScreen navigation={navigation} route={route} />
    );

    expect(getByText('Enter the 6-digit OTP sent to 1234567890:')).toBeTruthy();
    expect(getByPlaceholderText('000000')).toBeTruthy();
  });

  it('shows error on invalid OTP and navigates on correct OTP', async () => {
    const { getByText, getByPlaceholderText, queryByText } = render(
      <OTPVerificationScreen navigation={navigation} route={route} />
    );

    const input = getByPlaceholderText('000000');
    fireEvent.changeText(input, '123');
    fireEvent.press(getByText('Verify OTP'));

    await waitFor(() => {
      expect(getByText('Please enter a valid 6-digit OTP.')).toBeTruthy();
    });

    fireEvent.changeText(input, '000000');
    fireEvent.press(getByText('Verify OTP'));

    await waitFor(() => {
      expect(queryByText('Please enter a valid 6-digit OTP.')).toBeNull();
      expect(reset).not.toHaveBeenCalled();
    });

    // Correct OTP is '123456' per code
    fireEvent.changeText(input, '123456');
    fireEvent.press(getByText('Verify OTP'));

    await waitFor(() => {
      expect(reset).toHaveBeenCalledWith({
        index: 0,
        routes: [{ name: 'MainTabs' }]
      });
    });
  });
});
