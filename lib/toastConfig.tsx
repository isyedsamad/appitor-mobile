import React from 'react';
import {
  BaseToast,
  BaseToastProps,
  ErrorToast,
  ToastConfig,
} from 'react-native-toast-message';

export const toastConfig: ToastConfig = {
  success: (props: BaseToastProps) => (
    <BaseToast
      {...props}
      style={{ borderLeftColor: '#31B057', backgroundColor: '#31B057' }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{ color: 'white', fontSize: 15, fontWeight: '600' }}
      text2Style={{ color: 'white', fontSize: 13 }}
    />
  ),
  error: (props: BaseToastProps) => (
    <ErrorToast
      {...props}
      style={{ borderLeftColor: '#E74C3C', backgroundColor: '#E74C3C' }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{ color: 'white', fontSize: 15, fontWeight: '600' }}
      text2Style={{ color: 'white', fontSize: 13 }}
    />
  ),
  info: (props: BaseToastProps) => (
    <BaseToast
      {...props}
      style={{ borderLeftColor: '#3498DB', backgroundColor: '#3498DB' }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{ color: 'white', fontSize: 15, fontWeight: '600' }}
      text2Style={{ color: 'white', fontSize: 13 }}
    />
  ),
  warning: (props: BaseToastProps) => (
    <BaseToast
      {...props}
      style={{ borderLeftColor: '#F1C40F', backgroundColor: '#F1C40F' }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{ color: '#1b1b1b', fontSize: 15, fontWeight: '600' }}
      text2Style={{ color: '#1b1b1b', fontSize: 13 }}
    />
  ),
};
