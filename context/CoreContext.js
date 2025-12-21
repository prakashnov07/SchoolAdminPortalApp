import React, { createContext, useState } from 'react';

const initialStudentPosts = [
  {
    id: '1',
    title: 'School Science Fair 2025',
    description:
      'Amazing projects showcased by our talented students at the Annual Science Fair! Check out these incredible innovations and experiments.',
    photos: [
      'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=800&q=80',
    ],
  },
];

export const CoreContext = createContext();

export function CoreProvider({ children }) {
  const [messages, setMessages] = useState(initialStudentPosts);
  
  return <CoreContext.Provider value={{ messages, setMessages }}>{children}</CoreContext.Provider>;
}