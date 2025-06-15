
import { useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export interface AuthUser {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  company?: string;
  role?: string;
}

export interface DemoUser extends AuthUser {
  isDemo: true;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | DemoUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    console.log('useAuth: Initializing authentication...');
    
    // Check for demo mode first
    const demoMode = localStorage.getItem('demo_mode');
    if (demoMode === 'true') {
      console.log('useAuth: Demo mode detected');
      const demoUser: DemoUser = {
        id: 'demo-user',
        email: 'demo@example.com',
        first_name: 'Demo',
        last_name: 'User',
        isDemo: true
      };
      setUser(demoUser);
      setIsDemo(true);
      setLoading(false);
      return;
    }

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('useAuth: Auth state changed:', event, session?.user?.id);
        setSession(session);
        
        if (session?.user) {
          // Defer profile fetching to avoid deadlock
          setTimeout(() => {
            fetchUserProfile(session.user);
          }, 0);
        } else {
          setUser(null);
          setIsDemo(false);
          setLoading(false);
        }
      }
    );

    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('useAuth: Error getting session:', error);
        setLoading(false);
        return;
      }
      
      console.log('useAuth: Initial session:', session?.user?.id);
      setSession(session);
      
      if (session?.user) {
        fetchUserProfile(session.user);
      } else {
        setLoading(false);
      }
    });

    return () => {
      console.log('useAuth: Cleaning up subscription');
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (authUser: User) => {
    try {
      console.log('useAuth: Fetching profile for user:', authUser.id);
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (error) {
        console.error('useAuth: Error fetching profile:', error);
        // Create basic user object if profile doesn't exist
        setUser({
          id: authUser.id,
          email: authUser.email || '',
        });
      } else {
        console.log('useAuth: Profile fetched successfully:', profile);
        setUser({
          id: profile.id,
          email: profile.email,
          first_name: profile.first_name,
          last_name: profile.last_name,
          company: profile.company,
          role: profile.role,
        });
      }
    } catch (error) {
      console.error('useAuth: Error in fetchUserProfile:', error);
      setUser({
        id: authUser.id,
        email: authUser.email || '',
      });
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      if (isDemo) {
        console.log('useAuth: Exiting demo mode');
        localStorage.removeItem('demo_mode');
        setUser(null);
        setIsDemo(false);
        setSession(null);
        setLoading(false);
        return;
      }
      
      console.log('useAuth: Signing out...');
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('useAuth: Sign out error:', error);
      } else {
        // Force clear state immediately
        setUser(null);
        setSession(null);
        setIsDemo(false);
        setLoading(false);
      }
    } catch (error) {
      console.error('useAuth: Error during sign out:', error);
    }
  };

  const enterDemoMode = () => {
    console.log('useAuth: Entering demo mode');
    localStorage.setItem('demo_mode', 'true');
    const demoUser: DemoUser = {
      id: 'demo-user',
      email: 'demo@example.com',
      first_name: 'Demo',
      last_name: 'User',
      isDemo: true
    };
    setUser(demoUser);
    setIsDemo(true);
    setSession(null);
    setLoading(false);
  };

  return {
    user,
    session,
    loading,
    signOut,
    isDemo,
    enterDemoMode,
  };
}
