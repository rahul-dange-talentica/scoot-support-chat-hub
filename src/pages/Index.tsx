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
    console.log('Index: Setting up auth state listener');
    
    // Safety timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      console.log('Index: Safety timeout reached, forcing loading to false');
      setLoading(false);
    }, 5000);
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Index: Auth state changed', { event, hasSession: !!session, userId: session?.user?.id });
        clearTimeout(timeout); // Clear timeout since we got a response
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          console.log('Index: Fetching profile for user', session.user.id);
          // Fetch user profile
          try {
            const { data: profile, error } = await supabase
              .from('profiles')
              .select('*')
              .eq('user_id', session.user.id)
              .maybeSingle();
            
            if (error) {
              console.error('Index: Error fetching profile:', error);
            } else {
              console.log('Index: Profile fetched:', profile);
            }
            setUserProfile(profile);
          } catch (error) {
            console.error('Index: Exception fetching profile:', error);
            setUserProfile(null);
          }
        } else {
          console.log('Index: No session, clearing profile');
          setUserProfile(null);
        }
        console.log('Index: Setting loading to false (auth state change)');
        setLoading(false);
      }
    );

    // Check for existing session
    console.log('Index: Checking for existing session');
    supabase.auth.getSession().then(async ({ data: { session }, error }) => {
      console.log('Index: Existing session check', { hasSession: !!session, error, userId: session?.user?.id });
      clearTimeout(timeout); // Clear timeout since we got a response
      
      if (error) {
        console.error('Index: Error getting session:', error);
        setLoading(false);
        return;
      }
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        console.log('Index: Fetching profile for existing session user', session.user.id);
        // Fetch user profile for existing session
        try {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', session.user.id)
            .maybeSingle();
          
          if (profileError) {
            console.error('Index: Error fetching profile for existing session:', profileError);
          } else {
            console.log('Index: Profile fetched for existing session:', profile);
          }
          setUserProfile(profile);
        } catch (error) {
          console.error('Index: Exception fetching profile for existing session:', error);
          setUserProfile(null);
        }
      } else {
        console.log('Index: No existing session, clearing profile');
        setUserProfile(null);
      }
      console.log('Index: Setting loading to false (existing session check)');
      setLoading(false);
    }).catch((error) => {
      console.error('Index: Exception in getSession:', error);
      clearTimeout(timeout);
      setLoading(false);
    });

    return () => {
      console.log('Index: Cleaning up auth subscription');
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
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
        {/* Demo Navigation for testing */}
        <div className="fixed top-4 right-4 z-50 flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              // Demo customer login
              setUser({ id: 'demo-user' } as User);
              setUserProfile({ full_name: 'Demo Customer', mobile_number: '+91 98765 43210', role: 'customer' });
            }}
          >
            Demo Customer
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              // Demo admin login
              setUser({ id: 'demo-admin' } as User);
              setUserProfile({ full_name: 'Demo Admin', mobile_number: '+91 98765 43210', role: 'admin' });
            }}
          >
            Demo Admin
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
        <CustomerDashboard userProfile={userProfile} />
      )}
    </div>
  );
};

export default Index;
