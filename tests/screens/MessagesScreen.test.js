import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import MessagesScreen from '../../screens/MessagesScreen';
import { MessagesContext } from '../../context/MessagesContext';

describe('MessagesScreen', () => {
  const messages = [
    {
      id: '1',
      sender: 'Test User',
      content: 'Hello there!',
      timestamp: new Date().toISOString(),
      attachments: []
    }
  ];

  const refreshMessages = jest.fn();
  const navigate = jest.fn();

  const contextValue = {
    messages,
    refreshMessages
  };

  const navigation = {
    navigate
  };

  it('renders list of messages', () => {
    const { getByText } = render(
      <MessagesContext.Provider value={contextValue}>
        <MessagesScreen navigation={navigation} />
      </MessagesContext.Provider>
    );

    expect(getByText('Hello there!')).toBeTruthy();
    expect(getByText('Test User')).toBeTruthy();
  });

  it('navigates to SendMessagesScreen on button press', () => {
    const { getByText } = render(
      <MessagesContext.Provider value={contextValue}>
        <MessagesScreen navigation={navigation} />
      </MessagesContext.Provider>
    );

    fireEvent.press(getByText('Compose Message'));
    expect(navigate).toHaveBeenCalledWith('SendMessagesScreen');
  });
});
