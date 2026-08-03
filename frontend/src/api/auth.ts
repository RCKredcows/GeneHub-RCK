import { supabase } from '../lib/supabase';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';

export const checkEmailAllowed = async (email: string) => {
  try {
    const { data, error } = await supabase.rpc('check_email_allowed', {
      check_email: email
    });

    if (error) throw error;

    const result = data?.[0] || { allowed: false, full_name: null };
    return {
      allowed: result.allowed,
      fullName: result.full_name,
      error: null
    };
  } catch (error) {
    console.error('Error checking email:', error);
    return { allowed: false, fullName: null, error: error as Error };
  }
};

interface SignUpParams {
  email: string;
  password: string;
  metadata?: Record<string, string>;
}

export const signUp = async ({ email, password, metadata = {} }: SignUpParams) => {
  try {
    // First check if email is allowed
    const { allowed, fullName, error: checkError } = await checkEmailAllowed(email);

    if (checkError) throw checkError;

    if (!allowed) {
      throw new Error('This email is not authorized to create an account. Please contact an administrator.');
    }

    // The invitation lookup no longer returns a name -- it is reachable
    // before login, and disclosing the invitee's name to anyone who guesses
    // an address is more than it needs to answer. Whatever the signup form
    // collected is passed through; if that is empty, the signup trigger falls
    // back to the name recorded on the invitation itself.
    const finalMetadata = {
      ...metadata,
      full_name: fullName || metadata.full_name
    };

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: finalMetadata
      }
    });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error signing up:', error);
    return { data: null, error: error as Error };
  }
};

interface SignInParams {
  email: string;
  password: string;
}

export const signIn = async ({ email, password }: SignInParams) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error signing in:', error);
    return { data: null, error: error as Error };
  }
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const signOut = async (_options?: { scope?: string }) => {
  try {
    // Use local scope to avoid API errors if session is expired
    const { error } = await supabase.auth.signOut({ scope: 'local' });
    if (error) throw error;
    return { success: true, error: null };
  } catch (error) {
    console.error('Error signing out:', error);
    return { success: false, error: error as Error };
  }
};

export const getSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return { session, error: null };
  } catch (error) {
    console.error('Error getting session:', error);
    return { session: null, error: error as Error };
  }
};

export const onAuthStateChange = (callback: (event: AuthChangeEvent, session: Session | null) => void) => {
  return supabase.auth.onAuthStateChange(callback);
};

export const sendPasswordResetEmail = async (email: string) => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    });

    if (error) throw error;
    return { success: true, error: null };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return { success: false, error: error as Error };
  }
};

export const updatePassword = async (newPassword: string) => {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) throw error;
    return { success: true, error: null };
  } catch (error) {
    console.error('Error updating password:', error);
    return { success: false, error: error as Error };
  }
};
