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
      async (event, session) => {
        if (!mounted) return;
        
        console.log('🔄 Auth state changed:', { event, hasSession: !!session, userId: session?.user?.id });
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          console.log('📋 Fetching profile after auth change for user:', session.user.id);
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', session.user.id)
            .maybeSingle();
          
          if (profileError) {
            console.error('❌ Profile fetch error after auth change:', profileError);
          } else if (profile) {
            console.log('✅ Profile found after auth change:', profile);
          } else {
            console.log('⚠️ No profile found after auth change for user:', session.user.id);
          }
          
          setUserProfile(profile);
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
    return (
      <div className="min-h-screen bg-background">
        {/* Debug Info */}
        <div className="fixed top-4 left-4 z-50 text-xs bg-card p-2 rounded border">
          <div>User: {user ? '✅' : '❌'}</div>
          <div>Session: {session ? '✅' : '❌'}</div>
          <div>Profile: {userProfile ? '✅' : '❌'}</div>
          {userProfile && <div>Name: {userProfile.full_name}</div>}
        </div>
        
        {/* Demo Navigation for testing */}
        <div className="fixed top-4 right-4 z-50 flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={async () => {
              console.log('🧪 Testing real login...');
              // Try to sign in as the existing user for testing
              const { data, error } = await supabase.auth.signInWithOtp({
                phone: '+919970396783',
                options: {
                  channel: 'sms'
                }
              });
              if (error) {
                console.error('Real login error:', error);
              } else {
                console.log('Real login initiated:', data);
              }
            }}
          >
            Test Real Login
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              // Demo customer login
              const demoUser = { id: 'demo-customer', email: 'demo@customer.com' } as User;
              const demoProfile = { 
                full_name: 'Demo Customer', 
                mobile_number: '+91 98765 43210', 
                email: 'demo@customer.com',
                role: 'customer' 
              };
              setUser(demoUser);
              setUserProfile(demoProfile);
              setLoading(false);
            }}
          >
            Demo Customer
          </Button>
        </div>
        <LoginPage />
      </div>
    );
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
