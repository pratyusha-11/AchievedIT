import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api } from '../lib/api';
import { getErrorMessage } from '../lib/errorMessage';
import { User } from '../types';

interface SignUpData {
  fullName: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface ResetPasswordData {
  email: string;
  otp: string;
  newPassword: string;
  confirmPassword: string;
}

interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  sessionExpiredNotice: boolean;
  clearSessionExpiredNotice: () => void;
  signUp: (data: SignUpData) => Promise<{ error: string | null; requireVerification?: boolean; email?: string }>;
  verifyEmailOtp: (email: string, otp: string) => Promise<{ error: string | null; user?: User }>;
  resendVerificationOtp: (email: string) => Promise<{ error: string | null; message?: string }>;
  signIn: (identifier: string, password: string) => Promise<{ error: string | null; requireVerification?: boolean; email?: string }>;
  forgotPassword: (email: string) => Promise<{ error: string | null; message?: string; email?: string }>;
  verifyResetOtp: (email: string, otp: string) => Promise<{ error: string | null; message?: string }>;
  resetPassword: (data: ResetPasswordData) => Promise<{ error: string | null; message?: string }>;
  changePassword: (data: ChangePasswordData) => Promise<{ error: string | null; message?: string }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionExpiredNotice, setSessionExpiredNotice] = useState(false);

  const fetchCurrentUser = async () => {
    try {
      const res = await api.get('/auth/me');
      setUser(res.data.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    const handleExpired = () => {
      setUser(null);
      localStorage.removeItem('achievedit_token');
      setSessionExpiredNotice(true);
    };
    window.addEventListener('achievedit:session-expired', handleExpired);
    return () => window.removeEventListener('achievedit:session-expired', handleExpired);
  }, []);

  const signUp = async (data: SignUpData) => {
    try {
      const res = await api.post('/auth/register', data);
      return {
        error: null,
        requireVerification: res.data.requireVerification,
        email: res.data.email
      };
    } catch (err) {
      return { error: getErrorMessage(err, 'Signup failed. Please check your details.') };
    }
  };

  const verifyEmailOtp = async (email: string, otp: string) => {
    try {
      const res = await api.post('/auth/verify-otp', { email, otp });
      if (res.data.token) {
        localStorage.setItem('achievedit_token', res.data.token);
      }
      setUser(res.data.user);
      return { error: null, user: res.data.user };
    } catch (err) {
      return { error: getErrorMessage(err, 'Verification failed. Please check your code.') };
    }
  };

  const resendVerificationOtp = async (email: string) => {
    try {
      const res = await api.post('/auth/resend-otp', { email });
      return { error: null, message: res.data.message };
    } catch (err) {
      return { error: getErrorMessage(err, 'Failed to resend verification code.') };
    }
  };

  const signIn = async (identifier: string, password: string) => {
    try {
      const res = await api.post('/auth/login', { email: identifier, password });
      if (res.data.token) {
        localStorage.setItem('achievedit_token', res.data.token);
      }
      setUser(res.data.user);
      return { error: null };
    } catch (err: any) {
      const requireVerification = err.response?.data?.requireVerification;
      const email = err.response?.data?.email;
      return {
        error: getErrorMessage(err, 'Login failed. Please try again.'),
        requireVerification,
        email
      };
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      const res = await api.post('/auth/forgot-password', { email });
      return { error: null, message: res.data.message, email: res.data.email };
    } catch (err) {
      return { error: getErrorMessage(err, 'Failed to request password reset.') };
    }
  };

  const verifyResetOtp = async (email: string, otp: string) => {
    try {
      const res = await api.post('/auth/verify-reset-otp', { email, otp });
      return { error: null, message: res.data.message };
    } catch (err) {
      return { error: getErrorMessage(err, 'Invalid or expired code.') };
    }
  };

  const resetPassword = async (data: ResetPasswordData) => {
    try {
      const res = await api.post('/auth/reset-password', data);
      return { error: null, message: res.data.message };
    } catch (err) {
      return { error: getErrorMessage(err, 'Failed to reset password.') };
    }
  };

  const changePassword = async (data: ChangePasswordData) => {
    try {
      const res = await api.post('/auth/change-password', data);
      return { error: null, message: res.data.message };
    } catch (err) {
      return { error: getErrorMessage(err, 'Failed to change password.') };
    }
  };

  const signOut = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // ignore network error on logout
    } finally {
      localStorage.removeItem('achievedit_token');
      setUser(null);
    }
  };

  const refreshUser = async () => {
    await fetchCurrentUser();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        sessionExpiredNotice,
        clearSessionExpiredNotice: () => setSessionExpiredNotice(false),
        signUp,
        verifyEmailOtp,
        resendVerificationOtp,
        signIn,
        forgotPassword,
        verifyResetOtp,
        resetPassword,
        changePassword,
        signOut,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
