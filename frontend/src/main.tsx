import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ClerkProvider } from '@clerk/clerk-react';
import { dark } from '@clerk/themes';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import './index.css';

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || '';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <BrowserRouter>
        <ToastProvider>
          {clerkPubKey ? (
            <ClerkProvider
              publishableKey={clerkPubKey}
              appearance={{
                baseTheme: dark,
                variables: {
                  colorPrimary: '#6d5dfc',
                  colorBackground: '#171322',
                  colorInputBackground: '#0f0c18',
                  colorInputText: '#ffffff',
                  colorText: '#ffffff',
                  colorTextSecondary: '#9b8fff'
                }
              }}
            >
              <AuthProvider>
                <App />
              </AuthProvider>
            </ClerkProvider>
          ) : (
            <AuthProvider>
              <App />
            </AuthProvider>
          )}
        </ToastProvider>
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>
);
