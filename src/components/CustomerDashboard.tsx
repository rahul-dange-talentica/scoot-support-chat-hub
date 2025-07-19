import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  MessageCircle, 
  Package, 
  User, 
  LogOut, 
  Clock, 
  CheckCircle,
  Truck,
  HelpCircle
} from "lucide-react";

const CustomerDashboard = () => {
  const [activeView, setActiveView] = useState<'support' | 'orders'>('support');

  // Mock data - will be replaced with real data from Supabase
  const recentChats = [
    { id: 1, question: "Scooter not charging properly", status: "resolved", time: "2 hours ago" },
    { id: 2, question: "How to reset my scooter?", status: "pending", time: "1 day ago" },
  ];

  const orders = [
    { 
      id: "ORD-001", 
      model: "EcoRide Pro X1", 
      status: "delivered", 
      date: "2024-01-15",
      trackingId: "TR123456"
    },
    { 
      id: "ORD-002", 
      model: "EcoRide Urban", 
      status: "shipped", 
      date: "2024-01-18",
      trackingId: "TR789012"
    },
  ];

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
                <span className="text-sm">+1 (555) 123-4567</span>
              </div>
              <Button variant="ghost" size="sm">
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
        {activeView === 'support' ? (
          <SupportView recentChats={recentChats} />
        ) : (
          <OrdersView orders={orders} />
        )}
      </main>
    </div>
  );
};

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