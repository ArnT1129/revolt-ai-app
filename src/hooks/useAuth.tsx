
import { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
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
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    // Check for demo mode first
    const demoMode = localStorage.getItem('demo_mode');
    if (demoMode === 'true') {
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
        console.log('Auth state changed:', event, session?.user?.id);
        if (session?.user) {
          await fetchUserProfile(session.user);
        } else {
          setUser(null);
          setIsDemo(false);
          setLoading(false);
        }
      }
    );

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchUserProfile(session.user);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (authUser: User) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        setUser({
          id: authUser.id,
          email: authUser.email || '',
        });
      } else {
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
      console.error('Error fetching user profile:', error);
      setUser({
        id: authUser.id,
        email: authUser.email || '',
      });
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    if (isDemo) {
      localStorage.removeItem('demo_mode');
      setUser(null);
      setIsDemo(false);
      return;
    }
    await supabase.auth.signOut();
  };

  const enterDemoMode = () => {
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
  };

  return {
    user,
    loading,
    signOut,
    isDemo,
    enterDemoMode,
  };
}
