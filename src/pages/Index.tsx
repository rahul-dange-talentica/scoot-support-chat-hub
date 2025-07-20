import { useState, useEffect } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import LoginPage from "@/components/LoginPage";
import CustomerDashboard from "@/components/CustomerDashboard";
import AdminDashboard from "@/components/AdminDashboard";
import { Button } from "@/components/ui/button";

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    let mounted = true;
    
    const initAuth = async () => {
      try {
        console.log('🔍 Checking for existing session...');
        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!mounted) return;

        if (error) {
          console.error('❌ Auth error:', error);
        } else if (session?.user) {
          console.log('✅ Found existing session for user:', session.user.id);
          setSession(session);
          setUser(session.user);
          
          // Fetch profile with detailed logging
          console.log('📋 Fetching profile for user ID:', session.user.id);
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', session.user.id)
            .maybeSingle();
          
          if (profileError) {
            console.error('❌ Profile fetch error:', profileError);
          } else if (profile) {
            console.log('✅ Profile found:', profile);
          } else {
            console.log('⚠️ No profile found for user:', session.user.id);
          }
          
          if (mounted) {
            setUserProfile(profile);
          }
        } else {
          console.log('ℹ️ No existing session found');
        }
        
        if (mounted) {
          setLoading(false);
        }
      } catch (error) {
        console.error('💥 Init auth error:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Set up auth listener with detailed logging
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;
        
        console.log('🔄 Auth state changed:', { event, hasSession: !!session, userId: session?.user?.id });
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Use setTimeout to avoid potential deadlock issues with async operations in auth callback
          setTimeout(async () => {
            console.log('📋 Fetching profile after auth change for user:', session.user.id);
            try {
              const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('user_id', session.user.id)
                .maybeSingle();
              
              if (profileError) {
                console.error('❌ Profile fetch error after auth change:', profileError);
              } else if (profile) {
                console.log('✅ Profile found after auth change:', profile);
                setUserProfile(profile);
              } else {
                console.log('⚠️ No profile found after auth change for user:', session.user.id);
                setUserProfile(null);
              }
            } catch (error) {
              console.error('💥 Profile fetch error:', error);
              setUserProfile(null);
            }
          }, 0);
        } else {
          console.log('🧹 Clearing profile (no session)');
          setUserProfile(null);
        }
        
        setLoading(false);
      }
    );

    initAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Force loading to stop after 3 seconds as fallback
  useEffect(() => {
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 3000);

    return () => clearTimeout(timeout);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!user || !session) {
    return <LoginPage />;
  }

  // Determine user role and show appropriate dashboard
  const userRole = userProfile?.role || 'customer';

  return (
    <div className="min-h-screen bg-background">
      {userRole === 'admin' ? (
        <AdminDashboard />
      ) : (
        <CustomerDashboard 
          userProfile={userProfile} 
          onLogout={() => {
            setUser(null);
            setSession(null);
            setUserProfile(null);
            supabase.auth.signOut();
          }}
        />
      )}
    </div>
  );
};

export default Index;
