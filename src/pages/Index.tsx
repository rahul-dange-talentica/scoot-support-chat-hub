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
        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!mounted) return;

        if (error) {
          console.error('Auth error:', error);
        } else if (session?.user) {
          setSession(session);
          setUser(session.user);
          
          // Fetch profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', session.user.id)
            .maybeSingle();
          
          if (mounted) {
            setUserProfile(profile);
          }
        }
        
        if (mounted) {
          setLoading(false);
        }
      } catch (error) {
        console.error('Init auth error:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Set up auth listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', session.user.id)
            .maybeSingle();
          setUserProfile(profile);
        } else {
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
        {/* Demo Navigation for testing */}
        <div className="fixed top-4 right-4 z-50 flex gap-2">
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
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              // Demo admin login
              const demoUser = { id: 'demo-admin', email: 'admin@demo.com' } as User;
              const demoProfile = { 
                full_name: 'Demo Admin', 
                mobile_number: '+91 98765 43210', 
                email: 'admin@demo.com',
                role: 'admin' 
              };
              setUser(demoUser);
              setUserProfile(demoProfile);
              setLoading(false);
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
