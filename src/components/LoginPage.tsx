
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Smartphone, Zap, Shield, Headphones } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { validateIndianPhoneNumber, formatIndianPhoneNumber, normalizeIndianPhoneNumber } from "@/utils/phoneValidation";
import heroImage from "@/assets/hero-electric-scooters.jpg";

const LoginPage = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [canResend, setCanResend] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const { toast } = useToast();

  const startResendTimer = () => {
    setCanResend(false);
    setResendTimer(30);
    
    const interval = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handlePhoneNumberChange = (value: string) => {
    // Auto-format as user types
    const formatted = formatIndianPhoneNumber(value);
    setPhoneNumber(formatted);
  };

  const handleSendOTP = async () => {
    if (!phoneNumber) return;
    
    // Validate Indian phone number
    if (!validateIndianPhoneNumber(phoneNumber)) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid Indian mobile number (10 digits)",
        variant: "destructive",
      });
      return;
    }
    
    if (isSignUp && (!fullName || !email)) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const normalizedPhone = normalizeIndianPhoneNumber(phoneNumber);
      
      const { error } = await supabase.auth.signInWithOtp({
        phone: normalizedPhone,
        options: isSignUp ? {
          data: {
            full_name: fullName,
            email: email,
          }
        } : undefined
      });
      
      if (error) {
        console.error('Error sending OTP:', error.message);
        
        if (error.message.includes('phone_provider_disabled') || error.message.includes('Unsupported phone provider')) {
          toast({
            title: "SMS Service Not Configured",
            description: "SMS service is not set up yet. Please contact support or try again later.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive",
          });
        }
        return;
      }
      
      setOtpSent(true);
      startResendTimer();
      toast({
        title: "OTP Sent",
        description: `Verification code sent to ${phoneNumber}`,
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to send OTP. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!phoneNumber || !otp) return;
    
    if (otp.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter the complete 6-digit OTP",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const normalizedPhone = normalizeIndianPhoneNumber(phoneNumber);
      
      const { error } = await supabase.auth.verifyOtp({
        phone: normalizedPhone,
        token: otp,
        type: 'sms'
      });
      
      if (error) {
        console.error('Error verifying OTP:', error.message);
        
        if (error.message.includes('invalid') || error.message.includes('expired')) {
          toast({
            title: "Invalid OTP",
            description: "The OTP is invalid or has expired. Please try again.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive",
          });
        }
        return;
      }
      
      toast({
        title: "Success",
        description: isSignUp ? "Account created successfully!" : "Login successful!",
      });
      
      // Redirect to dashboard after successful login/signup
      window.location.href = '/dashboard';
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to verify OTP. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setPhoneNumber("");
    setFullName("");
    setEmail("");
    setOtpSent(false);
    setOtp("");
    setCanResend(false);
    setResendTimer(0);
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
                : 'Enter your Indian mobile number to access customer support'
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
                    placeholder="+91 98765 43210"
                    value={phoneNumber}
                    onChange={(e) => handlePhoneNumberChange(e.target.value)}
                    className="transition-smooth"
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter your 10-digit Indian mobile number
                  </p>
                </div>
                <Button 
                  onClick={handleSendOTP}
                  variant="electric"
                  className="w-full"
                  disabled={!phoneNumber || (isSignUp && (!fullName || !email)) || isLoading}
                >
                  {isLoading ? "Sending..." : "Send OTP"}
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
                  <div className="flex justify-center">
                    <InputOTP
                      value={otp}
                      onChange={(value) => setOtp(value)}
                      maxLength={6}
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                  <p className="text-sm text-muted-foreground text-center">
                    OTP sent to {phoneNumber}
                  </p>
                </div>
                <Button 
                  onClick={handleVerifyOTP}
                  variant="electric"
                  className="w-full"
                  disabled={otp.length !== 6 || isLoading}
                >
                  {isLoading ? "Verifying..." : "Verify & Login"}
                </Button>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => setOtpSent(false)}
                    variant="ghost"
                    className="flex-1"
                  >
                    Change Number
                  </Button>
                  <Button 
                    onClick={handleSendOTP}
                    variant="ghost"
                    className="flex-1"
                    disabled={!canResend || isLoading}
                  >
                    {canResend ? "Resend OTP" : `Resend (${resendTimer}s)`}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* SMS Provider Configuration Notice */}
        <Card className="mt-6 border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-orange-800">SMS Provider Required</h3>
                <p className="text-sm text-orange-700 mt-1">
                  To enable real OTP functionality, please configure an SMS provider in your Supabase dashboard. 
                  We recommend Twilio Verify for reliable SMS delivery to Indian mobile numbers.
                </p>
              </div>
            </div>
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
              title="Secure OTP Login"
              description="Indian mobile number verification for safety"
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
