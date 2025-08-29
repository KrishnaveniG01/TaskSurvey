// src/app/providers.tsx
'use client';

import { store } from '@/app/events/slices/store';
import { Provider } from 'react-redux';


export function Providers({ children }: { children: React.ReactNode }) {
  return <Provider store={store}>{children}</Provider>;
}
