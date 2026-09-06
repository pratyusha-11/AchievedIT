import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useUser, useClerk, useSignUp, useSignIn } from '@clerk/clerk-react';
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
  const isClerkConfigured = !!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

  if (isClerkConfigured) {
    return <ClerkAuthProvider>{children}</ClerkAuthProvider>;
  }

  return <FallbackAuthProvider>{children}</FallbackAuthProvider>;
}

function ClerkAuthProvider({ children }: { children: ReactNode }) {
  const { user: clerkUser, isLoaded: isUserLoaded, isSignedIn } = useUser();
  const { signOut: clerkSignOut } = useClerk();
  const { isLoaded: isSignUpLoaded, signUp: clerkSignUp, setActive: setSignUpActive } = useSignUp();
  const { isLoaded: isSignInLoaded, signIn: clerkSignIn, setActive: setSignInActive } = useSignIn();

  const [mongoUser, setMongoUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionExpiredNotice, setSessionExpiredNotice] = useState(false);

  const fetchMongoUser = async () => {
    if (!isSignedIn) {
      const token = localStorage.getItem('achievedit_token');
      if (!token) {
        setMongoUser(null);
        setLoading(false);
        return;
      }
    }
    try {
      const res = await api.get('/auth/me');
      setMongoUser(res.data.user);
    } catch {
      if (clerkUser) {
        setMongoUser({
          id: clerkUser.id,
          fullName: clerkUser.fullName || clerkUser.firstName || 'User',
          username: clerkUser.username || clerkUser.primaryEmailAddress?.emailAddress.split('@')[0] || 'user',
          email: clerkUser.primaryEmailAddress?.emailAddress || '',
          isEmailVerified: true,
          createdAt: clerkUser.createdAt ? new Date(clerkUser.createdAt).toISOString() : new Date().toISOString()
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isUserLoaded) {
      fetchMongoUser();
    }
  }, [isUserLoaded, isSignedIn, clerkUser]);

  const signUp = async (data: SignUpData) => {
    // 1. If Clerk is loaded, use Clerk to deliver the OTP email
    if (clerkSignUp && isSignUpLoaded) {
      try {
        await clerkSignUp.create({
          emailAddress: data.email.trim().toLowerCase(),
          password: data.password,
          unsafeMetadata: {
            fullName: data.fullName.trim(),
            username: data.username.trim().toLowerCase()
          }
        });

        // Instruct Clerk to send the 6-digit OTP code to the entered email
        await clerkSignUp.prepareEmailAddressVerification({
          strategy: 'email_code'
        });

        // Also save pending registration on backend MongoDB
        try {
          await api.post('/auth/register', data);
        } catch {
          // Backend might warn on email dispatch, which is fine since Clerk already sent it
        }

        return {
          error: null,
          requireVerification: true,
          email: data.email.trim().toLowerCase()
        };
      } catch (clerkErr: any) {
        const msg = clerkErr.errors?.[0]?.longMessage || clerkErr.errors?.[0]?.message || clerkErr.message;
        return { error: msg || 'Signup failed. Please check your details.' };
      }
    }

    // 2. Fallback to backend API
    try {
      const res = await api.post('/auth/register', data);
      return { error: null, requireVerification: res.data.requireVerification, email: res.data.email };
    } catch (err) {
      return { error: getErrorMessage(err, 'Signup failed. Please check your details.') };
    }
  };

  const verifyEmailOtp = async (email: string, otp: string) => {
    // 1. Verify with Clerk if in-progress signup exists
    if (clerkSignUp && isSignUpLoaded) {
      try {
        const completeSignUp = await clerkSignUp.attemptEmailAddressVerification({
          code: otp.trim()
        });

        if (completeSignUp.status === 'complete') {
          if (setSignUpActive) {
            await setSignUpActive({ session: completeSignUp.createdSessionId });
          }

          // Finalize on backend to create MongoDB user and get JWT
          try {
            const res = await api.post('/auth/verify-otp', {
              email: email.trim().toLowerCase(),
              otp: otp.trim(),
              clerkId: completeSignUp.createdUserId
            });
            if (res.data.token) {
              localStorage.setItem('achievedit_token', res.data.token);
            }
            setMongoUser(res.data.user);
            return { error: null, user: res.data.user };
          } catch {
            const meRes = await api.get('/auth/me');
            setMongoUser(meRes.data.user);
            return { error: null, user: meRes.data.user };
          }
        }
      } catch (clerkErr: any) {
        const msg = clerkErr.errors?.[0]?.longMessage || clerkErr.errors?.[0]?.message || clerkErr.message;
        return { error: msg || 'Invalid verification code.' };
      }
    }

    // 2. Fallback to backend API verification
    try {
      const res = await api.post('/auth/verify-otp', { email: email.trim().toLowerCase(), otp: otp.trim() });
      if (res.data.token) {
        localStorage.setItem('achievedit_token', res.data.token);
      }
      setMongoUser(res.data.user);
      return { error: null, user: res.data.user };
    } catch (err) {
      return { error: getErrorMessage(err, 'Verification failed. Please check your code.') };
    }
  };

  const resendVerificationOtp = async (email: string) => {
    if (clerkSignUp && isSignUpLoaded) {
      try {
        await clerkSignUp.prepareEmailAddressVerification({
          strategy: 'email_code'
        });
        return { error: null, message: 'New 6-digit verification code sent to your email!' };
      } catch (clerkErr: any) {
        const msg = clerkErr.errors?.[0]?.longMessage || clerkErr.errors?.[0]?.message || clerkErr.message;
        return { error: msg || 'Failed to resend code.' };
      }
    }

    try {
      const res = await api.post('/auth/resend-otp', { email });
      return { error: null, message: res.data.message };
    } catch (err) {
      return { error: getErrorMessage(err, 'Failed to resend verification code.') };
    }
  };

  const signIn = async (identifier: string, password: string) => {
    // 1. Try Clerk signIn
    if (clerkSignIn && isSignInLoaded) {
      try {
        const result = await clerkSignIn.create({
          identifier: identifier.trim(),
          password
        });
        if (result.status === 'complete') {
          if (setSignInActive) {
            await setSignInActive({ session: result.createdSessionId });
          }
          try {
            const meRes = await api.get('/auth/me');
            setMongoUser(meRes.data.user);
          } catch {
            // ignore
          }
          return { error: null };
        }
      } catch (clerkErr: any) {
        // Fall through to backend login
      }
    }

    // 2. Backend /auth/login fallback
    try {
      const res = await api.post('/auth/login', { email: identifier.trim(), password });
      if (res.data.token) {
        localStorage.setItem('achievedit_token', res.data.token);
      }
      setMongoUser(res.data.user);
      return { error: null };
    } catch (err: any) {
      const requireVerification = err.response?.data?.requireVerification;
      const email = err.response?.data?.email;
      return {
        error: getErrorMessage(err, 'Login failed. Please check your credentials.'),
        requireVerification,
        email
      };
    }
  };

  const forgotPassword = async (email: string) => {
    if (clerkSignIn && isSignInLoaded) {
      try {
        await clerkSignIn.create({
          strategy: 'reset_password_email_code',
          identifier: email.trim().toLowerCase()
        });
        return { error: null, message: 'Password reset code sent to your email.', email: email.trim().toLowerCase() };
      } catch {
        // fallback
      }
    }
    try {
      const res = await api.post('/auth/forgot-password', { email });
      return { error: null, message: res.data.message, email: res.data.email };
    } catch (err) {
      return { error: getErrorMessage(err, 'Failed to request password reset.') };
    }
  };

  const verifyResetOtp = async (_email: string, _otp: string) => {
    return { error: null, message: 'Code accepted.' };
  };

  const resetPassword = async (data: ResetPasswordData) => {
    if (clerkSignIn && isSignInLoaded) {
      try {
        const result = await clerkSignIn.attemptFirstFactor({
          strategy: 'reset_password_email_code',
          code: data.otp.trim(),
          password: data.newPassword
        });
        if (result.status === 'complete') {
          if (setSignInActive) {
            await setSignInActive({ session: result.createdSessionId });
          }
          try {
            await api.post('/auth/reset-password', data);
          } catch {
            // ignore
          }
          return { error: null, message: 'Password reset successful!' };
        }
      } catch (clerkErr: any) {
        const msg = clerkErr.errors?.[0]?.longMessage || clerkErr.errors?.[0]?.message || clerkErr.message;
        return { error: msg || 'Failed to reset password.' };
      }
    }
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
      if (clerkSignOut) await clerkSignOut();
      await api.post('/auth/logout');
    } catch {
      // ignore
    } finally {
      localStorage.removeItem('achievedit_token');
      setMongoUser(null);
    }
  };

  const user: User | null = mongoUser || (clerkUser ? {
    id: clerkUser.id,
    fullName: clerkUser.fullName || clerkUser.firstName || 'User',
    username: clerkUser.username || clerkUser.primaryEmailAddress?.emailAddress.split('@')[0] || 'user',
    email: clerkUser.primaryEmailAddress?.emailAddress || '',
    isEmailVerified: true,
    createdAt: clerkUser.createdAt ? new Date(clerkUser.createdAt).toISOString() : new Date().toISOString()
  } : null);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading: !isUserLoaded || loading,
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
        refreshUser: fetchMongoUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

function FallbackAuthProvider({ children }: { children: ReactNode }) {
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

  const signUp = async (data: SignUpData) => {
    try {
      const res = await api.post('/auth/register', data);
      return { error: null, requireVerification: res.data.requireVerification, email: res.data.email };
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
      // ignore
    } finally {
      localStorage.removeItem('achievedit_token');
      setUser(null);
    }
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
        refreshUser: fetchCurrentUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
