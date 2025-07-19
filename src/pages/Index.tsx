import { useState } from "react";
import LoginPage from "@/components/LoginPage";
import CustomerDashboard from "@/components/CustomerDashboard";
import AdminDashboard from "@/components/AdminDashboard";
import { Button } from "@/components/ui/button";

const Index = () => {
  const [userType, setUserType] = useState<'login' | 'customer' | 'admin'>('login');

  // Demo navigation - in real app, this would be handled by authentication state
  const renderCurrentView = () => {
    switch (userType) {
      case 'customer':
        return <CustomerDashboard />;
      case 'admin':
        return <AdminDashboard />;
      default:
        return <LoginPage />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Demo Navigation - Remove in production */}
      {userType === 'login' && (
        <div className="fixed top-4 right-4 z-50 flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setUserType('customer')}
          >
            Demo Customer
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setUserType('admin')}
          >
            Demo Admin
          </Button>
        </div>
      )}
      
      {/* Back to Login for Demo */}
      {userType !== 'login' && (
        <div className="fixed top-4 right-4 z-50">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setUserType('login')}
          >
            Back to Login
          </Button>
        </div>
      )}

      {renderCurrentView()}
    </div>
  );
};

export default Index;
