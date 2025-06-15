
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

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchUserProfile(session.user);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          await fetchUserProfile(session.user);
        } else {
          setUser(null);
          setLoading(false);
        }
      }
    );

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
    await supabase.auth.signOut();
  };

  return {
    user,
    loading,
    signOut,
  };
}
