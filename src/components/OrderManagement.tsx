import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Package, MessageCircle, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface Order {
  id: string;
  order_number: string;
  status: string;
  total_amount: number;
  items: any;
  delivery_address: string;
  created_at: string;
  updated_at: string;
}

export const OrderManagement = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [isAddOrderOpen, setIsAddOrderOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const scooterModels = [
    'Thunder X1 Pro',
    'Lightning Storm 2024',
    'Urban Rider Elite',
    'EcoFlash 600W',
    'Speedster Max',
    'City Cruiser Pro'
  ];

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: "Error",
        description: "Failed to load orders",
        variant: "destructive",
      });
    }
  };

  const addOrderDetails = async () => {
    if (!selectedModel || !deliveryAddress.trim()) {
      toast({
        title: "Error",
        description: "Please select a model and enter delivery address",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Generate order number
      const orderNumber = `SCT-${Date.now()}`;

      const orderData = {
        user_id: user.id,
        order_number: orderNumber,
        status: 'pending',
        total_amount: 0, // Will be updated by admin
        items: JSON.stringify([{ model: selectedModel }]),
        delivery_address: deliveryAddress
      };

      const { error } = await supabase
        .from('orders')
        .insert([orderData]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Order details added successfully!",
      });

      setSelectedModel('');
      setDeliveryAddress('');
      setIsAddOrderOpen(false);
      fetchOrders();
    } catch (error) {
      console.error('Error adding order:', error);
      toast({
        title: "Error",
        description: "Failed to add order details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const startConversation = async (orderId: string, orderNumber: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('support_conversations')
        .insert([{
          user_id: user.id,
          title: `Order Support - ${orderNumber}`,
          status: 'open',
          priority: 'medium',
          order_id: orderId
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Support conversation started",
      });
    } catch (error) {
      console.error('Error starting conversation:', error);
      toast({
        title: "Error",
        description: "Failed to start conversation",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'confirmed': return 'bg-blue-500';
      case 'processing': return 'bg-purple-500';
      case 'shipped': return 'bg-orange-500';
      case 'delivered': return 'bg-green-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Add Order Details Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add Order Details
          </CardTitle>
          <CardDescription>
            Add details for orders placed from other portals
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Dialog open={isAddOrderOpen} onOpenChange={setIsAddOrderOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Order Details
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add Order Details</DialogTitle>
                <DialogDescription>
                  Enter the details of your scooter order
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="model-select">Scooter Model</Label>
                  <Select value={selectedModel} onValueChange={setSelectedModel}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a scooter model" />
                    </SelectTrigger>
                    <SelectContent>
                      {scooterModels.map((model) => (
                        <SelectItem key={model} value={model}>
                          {model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="delivery-address">Delivery Address</Label>
                  <Textarea
                    id="delivery-address"
                    placeholder="Enter your delivery address"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                  />
                </div>
                
                <Button 
                  onClick={addOrderDetails} 
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? 'Adding Order...' : 'Add Order Details'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      {/* Orders List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Your Orders
          </CardTitle>
          <CardDescription>
            Track your scooter orders and manage support
          </CardDescription>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <p className="text-muted-foreground">No orders found</p>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <Card key={order.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{order.order_number}</h4>
                        <Badge className={getStatusColor(order.status)}>
                          {order.status.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Total: ${order.total_amount}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Items: {typeof order.items === 'string' ? JSON.parse(order.items).length : order.items?.length || 0} scooter(s)
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Ordered: {new Date(order.created_at).toLocaleDateString()}
                      </p>
                      {order.delivery_address && (
                        <p className="text-sm text-muted-foreground">
                          Delivery: {order.delivery_address}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => startConversation(order.id, order.order_number)}
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Support
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};