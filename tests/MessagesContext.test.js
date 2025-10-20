import React from 'react';
import { renderHook, act } from '@testing-library/react-hooks';
import { MessagesContextProvider, MessagesContext } from '../context/MessagesContext';

describe('MessagesContext', () => {
  function wrapper({ children }) {
    return <MessagesContextProvider>{children}</MessagesContextProvider>;
  }

  it('should add a message', () => {
    const { result } = renderHook(() => React.useContext(MessagesContext), { wrapper });

    act(() => {
      result.current.addMessage({ content: 'Hello World' });
    });

    expect(result.current.messages.length).toBe(1);
    expect(result.current.messages[0].content).toBe('Hello World');
  });

  it('should not add empty message', () => {
    const { result } = renderHook(() => React.useContext(MessagesContext), { wrapper });

    expect(() =>
      act(() => {
        result.current.addMessage({ content: '', attachments: [] });
      })
    ).toThrow('Cannot add empty message');
  });

  it('should update a message', () => {
    const { result } = renderHook(() => React.useContext(MessagesContext), { wrapper });

    act(() => {
      result.current.addMessage({ content: 'Old Content' });
    });

    const id = result.current.messages[0].id;

    act(() => {
      result.current.updateMessage(id, { content: 'New Content' });
    });

    expect(result.current.messages[0].content).toBe('New Content');
  });

  it('should remove a message', () => {
    const { result } = renderHook(() => React.useContext(MessagesContext), { wrapper });

    act(() => {
      result.current.addMessage({ content: 'To be removed' });
    });

    const id = result.current.messages[0].id;

    act(() => {
      result.current.removeMessage(id);
    });

    expect(result.current.messages.length).toBe(0);
  });
});
