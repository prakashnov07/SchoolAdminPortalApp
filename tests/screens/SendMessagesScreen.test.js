import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import SendMessagesScreen from '../../screens/SendMessagesScreen';
import { MessagesContext } from '../../context/MessagesContext';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';

jest.mock('expo-image-picker');
jest.mock('expo-document-picker');

describe('SendMessagesScreen', () => {
  const addMessage = jest.fn();
  const goBack = jest.fn();

  const navigation = {
    goBack
  };

  beforeEach(() => {
    addMessage.mockClear();
    goBack.mockClear();
    ImagePicker.requestMediaLibraryPermissionsAsync.mockResolvedValue({ granted: true });
    ImagePicker.launchImageLibraryAsync.mockResolvedValue({ canceled: false, assets: [{ uri: 'image-uri' }] });
    DocumentPicker.getDocumentAsync.mockResolvedValue({ type: 'success', uri: 'doc-uri', name: 'doc.pdf' });
  });

  it('renders input and buttons', () => {
    const { getByPlaceholderText, getByText } = render(
      <MessagesContext.Provider value={{ addMessage }}>
        <SendMessagesScreen navigation={navigation} />
      </MessagesContext.Provider>
    );

    expect(getByPlaceholderText('Type your message here...')).toBeTruthy();
    expect(getByText('Pick Image')).toBeTruthy();
    expect(getByText('Pick Document')).toBeTruthy();
    expect(getByText('Send Message')).toBeTruthy();
  });

  it('sends message with content', () => {
    const { getByPlaceholderText, getByText } = render(
      <MessagesContext.Provider value={{ addMessage }}>
        <SendMessagesScreen navigation={navigation} />
      </MessagesContext.Provider>
    );

    fireEvent.changeText(getByPlaceholderText('Type your message here...'), 'Hello');
    fireEvent.press(getByText('Send Message'));

    expect(addMessage).toHaveBeenCalledWith({ content: 'Hello', attachments: [] });
    expect(goBack).toHaveBeenCalled();
  });

  it('prevents sending empty message', () => {
    const { getByText } = render(
      <MessagesContext.Provider value={{ addMessage }}>
        <SendMessagesScreen navigation={navigation} />
      </MessagesContext.Provider>
    );

    fireEvent.press(getByText('Send Message'));
    expect(addMessage).not.toHaveBeenCalled();
    expect(goBack).not.toHaveBeenCalled();
  });

  it('picks image and adds attachment', async () => {
    const { getByText, findByText } = render(
      <MessagesContext.Provider value={{ addMessage }}>
        <SendMessagesScreen navigation={navigation} />
      </MessagesContext.Provider>
    );

    await act(async () => {
      fireEvent.press(getByText('Pick Image'));
    });

    expect(await findByText('image-uri')).toBeTruthy();
  });

  it('picks document and adds attachment', async () => {
    const { getByText, findByText } = render(
      <MessagesContext.Provider value={{ addMessage }}>
        <SendMessagesScreen navigation={navigation} />
      </MessagesContext.Provider>
    );

    await act(async () => {
      fireEvent.press(getByText('Pick Document'));
    });

    expect(await findByText('doc.pdf')).toBeTruthy();
  });
});
