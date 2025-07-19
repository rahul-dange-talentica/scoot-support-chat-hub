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
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Fetch user profile
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('user_id', session.user.id)
              .maybeSingle();
            setUserProfile(profile);
          } catch (error) {
            console.error('Error fetching profile:', error);
            setUserProfile(null);
          }
        } else {
          setUserProfile(null);
        }
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        // Fetch user profile for existing session
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', session.user.id)
            .maybeSingle();
          setUserProfile(profile);
        } catch (error) {
          console.error('Error fetching profile:', error);
          setUserProfile(null);
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
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
