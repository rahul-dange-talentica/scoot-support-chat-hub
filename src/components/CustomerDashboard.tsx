import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  MessageCircle, 
  Package, 
  User, 
  LogOut, 
  Clock, 
  CheckCircle,
  Truck,
  HelpCircle,
  Phone,
  Mail
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CustomerDashboardProps {
  userProfile: any;
  onLogout: () => void;
}

const CustomerDashboard = ({ userProfile, onLogout }: CustomerDashboardProps) => {
  const [activeView, setActiveView] = useState<'profile' | 'support' | 'orders'>('support');
  const [supportConversations, setSupportConversations] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Helper function to format time ago
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (minutes > 0) {
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  };

  const handleLogout = async () => {
    onLogout();
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
  };

  // Fetch support conversations and orders from Supabase
  useEffect(() => {
    const fetchData = async () => {
      if (!userProfile?.user_id) return;

      try {
        setLoading(true);

        // Fetch support conversations
        const { data: conversations, error: conversationsError } = await supabase
          .from('support_conversations')
          .select('*')
          .eq('user_id', userProfile.user_id)
          .order('created_at', { ascending: false })
          .limit(10);

        if (conversationsError) {
          console.error('Error fetching conversations:', conversationsError);
        } else {
          setSupportConversations(conversations || []);
        }

        // Fetch orders
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select('*')
          .eq('user_id', userProfile.user_id)
          .order('created_at', { ascending: false });

        if (ordersError) {
          console.error('Error fetching orders:', ordersError);
        } else {
          setOrders(ordersData || []);
        }
      } catch (error) {
        console.error('Unexpected error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userProfile?.user_id]);

  // Format conversations for display
  const recentChats = supportConversations.map(conv => ({
    id: conv.id,
    question: conv.title,
    status: conv.status,
    time: formatTimeAgo(conv.last_message_at || conv.created_at)
  }));

  // Format orders for display
  const formattedOrders = orders.map(order => ({
    id: order.order_number,
    model: order.items[0]?.name || 'Order Items',
    status: order.status,
    date: new Date(order.created_at).toLocaleDateString(),
    trackingId: `TR${order.order_number.slice(-6)}`,
    totalAmount: order.total_amount
  }));

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card shadow-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">ER</span>
              </div>
              <h1 className="text-xl font-bold">EcoRide Support</h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Hello {userProfile?.full_name || 'User'}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="border-b bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="flex">
            <Button
              variant={activeView === 'profile' ? 'default' : 'ghost'}
              onClick={() => setActiveView('profile')}
              className="rounded-none border-b-2 border-transparent data-[active=true]:border-primary"
              data-active={activeView === 'profile'}
            >
              <User className="h-4 w-4" />
              Profile
            </Button>
            <Button
              variant={activeView === 'support' ? 'default' : 'ghost'}
              onClick={() => setActiveView('support')}
              className="rounded-none border-b-2 border-transparent data-[active=true]:border-primary"
              data-active={activeView === 'support'}
            >
              <MessageCircle className="h-4 w-4" />
              Support
            </Button>
            <Button
              variant={activeView === 'orders' ? 'default' : 'ghost'}
              onClick={() => setActiveView('orders')}
              className="rounded-none border-b-2 border-transparent data-[active=true]:border-primary"
              data-active={activeView === 'orders'}
            >
              <Package className="h-4 w-4" />
              My Orders
            </Button>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="container mx-auto px-4 py-6 max-w-4xl">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2 text-muted-foreground">Loading...</span>
          </div>
        ) : activeView === 'profile' ? (
          <ProfileView userProfile={userProfile} />
        ) : activeView === 'support' ? (
          <SupportView recentChats={recentChats} />
        ) : (
          <OrdersView orders={formattedOrders} />
        )}
      </main>
    </div>
  );
};

const ProfileView = ({ userProfile }: { userProfile: any }) => (
  <div className="space-y-6">
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Profile Information
        </CardTitle>
        <CardDescription>
          View and manage your account details
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input 
              id="fullName" 
              value={userProfile?.full_name || ''} 
              readOnly 
              className="bg-muted/50"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <Input 
                id="email" 
                value={userProfile?.email || 'Not provided'} 
                readOnly 
                className="bg-muted/50"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="mobile">Mobile Number</Label>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <Input 
                id="mobile" 
                value={userProfile?.mobile_number || ''} 
                readOnly 
                className="bg-muted/50"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="role">Account Type</Label>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="capitalize">
                {userProfile?.role || 'Customer'}
              </Badge>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            Profile information is managed during signup. Contact support if you need to update your details.
          </p>
        </div>
      </CardContent>
    </Card>
  </div>
);

const SupportView = ({ recentChats }: { recentChats: any[] }) => (
  <div className="space-y-6">
    {/* Quick Actions */}
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle>How can we help you today?</CardTitle>
        <CardDescription>
          Choose from common questions or start a new conversation
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button variant="support" className="h-auto p-4 justify-start">
            <div className="text-left">
              <div className="font-medium">Ask a Question</div>
              <div className="text-sm opacity-80">Get help with your scooter</div>
            </div>
          </Button>
          <Button variant="support" className="h-auto p-4 justify-start">
            <div className="text-left">
              <div className="font-medium">Upload Issue Photo</div>
              <div className="text-sm opacity-80">Show us the problem</div>
            </div>
          </Button>
        </div>
      </CardContent>
    </Card>

    {/* Recent Conversations */}
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Recent Conversations
        </CardTitle>
      </CardHeader>
      <CardContent>
        {recentChats.length > 0 ? (
          <div className="space-y-3">
            {recentChats.map((chat) => (
              <div key={chat.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-smooth cursor-pointer">
                <div className="flex items-center gap-3">
                  <HelpCircle className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{chat.question}</p>
                    <p className="text-sm text-muted-foreground">{chat.time}</p>
                  </div>
                </div>
                <Badge variant={chat.status === 'resolved' ? 'default' : 'secondary'}>
                  {chat.status}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">
            No recent conversations. Start by asking a question!
          </p>
        )}
      </CardContent>
    </Card>
  </div>
);

const OrdersView = ({ orders }: { orders: any[] }) => (
  <div className="space-y-6">
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Your Orders
        </CardTitle>
        <CardDescription>
          Track your electric scooter orders and deliveries
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">{order.model}</h3>
                  <p className="text-sm text-muted-foreground">Order #{order.id}</p>
                </div>
                <StatusBadge status={order.status} />
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Order Date:</span>
                  <p className="font-medium">{order.date}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Tracking ID:</span>
                  <p className="font-medium">{order.trackingId}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Truck className="h-4 w-4" />
                  Track Order
                </Button>
                <Button variant="ghost" size="sm">
                  <MessageCircle className="h-4 w-4" />
                  Ask About Order
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  </div>
);

const StatusBadge = ({ status }: { status: string }) => {
  const statusConfig = {
    delivered: { variant: 'default' as const, icon: CheckCircle, text: 'Delivered' },
    shipped: { variant: 'secondary' as const, icon: Truck, text: 'Shipped' },
    processing: { variant: 'secondary' as const, icon: Clock, text: 'Processing' },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.processing;
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className="flex items-center gap-1">
      <Icon className="h-3 w-3" />
      {config.text}
    </Badge>
  );
};

export default CustomerDashboard;