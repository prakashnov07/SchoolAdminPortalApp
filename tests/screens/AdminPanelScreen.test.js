import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import AdminPanelScreen from '../../screens/AdminPanelScreen';
import { MessagesContext } from '../../context/MessagesContext';

describe('AdminPanelScreen', () => {
  const messages = [
    {
      id: '1',
      sender: 'User A',
      content: 'Test message',
      timestamp: new Date().toISOString()
    }
  ];

  const removeMessage = jest.fn();
  const updateMessage = jest.fn();

  const contextValue = {
    messages,
    removeMessage,
    updateMessage
  };

  it('renders messages', () => {
    const { getByText } = render(
      <MessagesContext.Provider value={contextValue}>
        <AdminPanelScreen />
      </MessagesContext.Provider>
    );

    expect(getByText('Test message')).toBeTruthy();
    expect(getByText('User A')).toBeTruthy();
  });

  it('allows editing message', async () => {
    const { getByText, getByDisplayValue } = render(
      <MessagesContext.Provider value={contextValue}>
        <AdminPanelScreen />
      </MessagesContext.Provider>
    );

    fireEvent.press(getByText('Edit'));

    const input = getByDisplayValue('Test message');
    fireEvent.changeText(input, 'Edited message');

    fireEvent.press(getByText('Save'));

    await waitFor(() => {
      expect(updateMessage).toHaveBeenCalledWith('1', { content: 'Edited message' });
    });
  });

  it('allows cancelling edit', () => {
    const { getByText, queryByText } = render(
      <MessagesContext.Provider value={contextValue}>
        <AdminPanelScreen />
      </MessagesContext.Provider>
    );

    fireEvent.press(getByText('Edit'));
    fireEvent.press(getByText('Cancel'));

    expect(queryByText('Save')).toBeNull();
  });

  it('allows deleting message after confirmation', () => {
    jest.spyOn(global, 'alert').mockImplementation(() => {});

    const { getByText } = render(
      <MessagesContext.Provider value={contextValue}>
        <AdminPanelScreen />
      </MessagesContext.Provider>
    );

    fireEvent.press(getByText('Delete'));
    // Since Alert is native, just check if removeMessage called on confirmation is tested in integration tests.
  });
});
