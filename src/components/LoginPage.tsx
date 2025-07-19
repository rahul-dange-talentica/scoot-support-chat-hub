import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Smartphone, Zap, Shield, Headphones } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import heroImage from "@/assets/hero-electric-scooters.jpg";

const LoginPage = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");

  const handleSendOTP = async () => {
    if (!phoneNumber) return;
    if (isSignUp && (!fullName || !email)) return;
    
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: phoneNumber,
        options: isSignUp ? {
          data: {
            full_name: fullName,
            email: email,
          }
        } : undefined
      });
      
      if (error) {
        console.error('Error sending OTP:', error.message);
        // You can add toast notification here
        return;
      }
      
      setOtpSent(true);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleVerifyOTP = async () => {
    if (!phoneNumber || !otp) return;
    
    try {
      const { error } = await supabase.auth.verifyOtp({
        phone: phoneNumber,
        token: otp,
        type: 'sms'
      });
      
      if (error) {
        console.error('Error verifying OTP:', error.message);
        // You can add toast notification here
        return;
      }
      
      // Redirect to dashboard after successful login/signup
      window.location.href = '/dashboard';
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const resetForm = () => {
    setPhoneNumber("");
    setFullName("");
    setEmail("");
    setOtpSent(false);
    setOtp("");
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    resetForm();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div 
        className="relative h-64 bg-cover bg-center flex items-center justify-center"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="relative z-10 text-center text-white">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Zap className="h-8 w-8 text-primary-glow" />
            <h1 className="text-3xl font-bold">EcoRide Support</h1>
          </div>
          <p className="text-lg opacity-90">Get instant help with your electric scooter</p>
        </div>
      </div>

      {/* Login Form */}
      <div className="container mx-auto px-4 py-8 max-w-md">
        <Card className="shadow-card">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Smartphone className="h-5 w-5 text-primary" />
              {isSignUp ? 'Sign Up' : 'Login'}
            </CardTitle>
            <CardDescription>
              {isSignUp 
                ? 'Create your account to access customer support'
                : 'Enter your mobile number to access customer support'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!otpSent ? (
              <>
                {isSignUp && (
                  <>
                    <div className="space-y-2">
                      <label htmlFor="fullName" className="text-sm font-medium">
                        Full Name
                      </label>
                      <Input
                        id="fullName"
                        type="text"
                        placeholder="John Doe"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="transition-smooth"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="email" className="text-sm font-medium">
                        Email
                      </label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="john@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="transition-smooth"
                      />
                    </div>
                  </>
                )}
                <div className="space-y-2">
                  <label htmlFor="phone" className="text-sm font-medium">
                    Mobile Number
                  </label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="transition-smooth"
                  />
                </div>
                <Button 
                  onClick={handleSendOTP}
                  variant="electric"
                  className="w-full"
                  disabled={!phoneNumber || (isSignUp && (!fullName || !email))}
                >
                  Send OTP
                </Button>
                <div className="text-center">
                  <Button 
                    onClick={toggleMode}
                    variant="ghost"
                    className="text-sm"
                  >
                    {isSignUp 
                      ? 'Already have an account? Login' 
                      : "Don't have an account? Sign Up"
                    }
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <label htmlFor="otp" className="text-sm font-medium">
                    Enter OTP
                  </label>
                  <Input
                    id="otp"
                    type="text"
                    placeholder="123456"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="transition-smooth text-center text-lg tracking-widest"
                    maxLength={6}
                  />
                  <p className="text-sm text-muted-foreground text-center">
                    OTP sent to {phoneNumber}
                  </p>
                </div>
                <Button 
                  onClick={handleVerifyOTP}
                  variant="electric"
                  className="w-full"
                  disabled={otp.length !== 6}
                >
                  Verify & Login
                </Button>
                <Button 
                  onClick={() => setOtpSent(false)}
                  variant="ghost"
                  className="w-full"
                >
                  Change Number
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Features */}
        <div className="mt-8 space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <FeatureCard 
              icon={<Headphones className="h-5 w-5 text-primary" />}
              title="24/7 Support"
              description="Get help anytime with your electric scooter"
            />
            <FeatureCard 
              icon={<Shield className="h-5 w-5 text-secondary" />}
              title="Secure Login"
              description="OTP-based authentication for your safety"
            />
            <FeatureCard 
              icon={<Zap className="h-5 w-5 text-primary-glow" />}
              title="Instant Responses"
              description="Quick answers to common questions"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }: { 
  icon: React.ReactNode;
  title: string;
  description: string;
}) => (
  <Card className="shadow-card hover:shadow-soft transition-smooth">
    <CardContent className="flex items-center gap-3 p-4">
      <div className="p-2 bg-accent rounded-lg">
        {icon}
      </div>
      <div>
        <h3 className="font-medium">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </CardContent>
  </Card>
);

export default LoginPage;