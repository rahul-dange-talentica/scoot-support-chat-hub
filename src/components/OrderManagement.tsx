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
import { ShoppingCart, Package, MessageCircle, Plus, Minus } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface Scooter {
  id: string;
  name: string;
  model: string;
  price: number;
  description: string;
  image_url: string;
}

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

interface OrderItem {
  scooterId: string;
  name: string;
  model: string;
  price: number;
  quantity: number;
}

export const OrderManagement = () => {
  const [scooters, setScooters] = useState<Scooter[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchScooters();
    fetchOrders();
  }, []);

  const fetchScooters = async () => {
    try {
      const { data, error } = await supabase
        .from('scooters')
        .select('*')
        .eq('is_available', true);
      
      if (error) throw error;
      setScooters(data || []);
    } catch (error) {
      console.error('Error fetching scooters:', error);
      toast({
        title: "Error",
        description: "Failed to load scooters",
        variant: "destructive",
      });
    }
  };

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

  const addToCart = (scooter: Scooter) => {
    setCart(prev => {
      const existing = prev.find(item => item.scooterId === scooter.id);
      if (existing) {
        return prev.map(item =>
          item.scooterId === scooter.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, {
        scooterId: scooter.id,
        name: scooter.name,
        model: scooter.model,
        price: scooter.price,
        quantity: 1
      }];
    });
  };

  const updateCartQuantity = (scooterId: string, quantity: number) => {
    if (quantity === 0) {
      setCart(prev => prev.filter(item => item.scooterId !== scooterId));
    } else {
      setCart(prev => prev.map(item =>
        item.scooterId === scooterId ? { ...item, quantity } : item
      ));
    }
  };

  const getTotalAmount = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const generateOrderNumber = () => {
    return `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  const createOrder = async () => {
    if (cart.length === 0) {
      toast({
        title: "Error",
        description: "Please add items to cart",
        variant: "destructive",
      });
      return;
    }

    if (!deliveryAddress.trim()) {
      toast({
        title: "Error",
        description: "Please enter delivery address",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const orderData = {
        user_id: user.id,
        order_number: generateOrderNumber(),
        status: 'pending',
        total_amount: getTotalAmount(),
        items: JSON.stringify(cart),
        delivery_address: deliveryAddress
      };

      const { error } = await supabase
        .from('orders')
        .insert([orderData]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Order created successfully!",
      });

      setCart([]);
      setDeliveryAddress('');
      setIsNewOrderOpen(false);
      fetchOrders();
    } catch (error) {
      console.error('Error creating order:', error);
      toast({
        title: "Error",
        description: "Failed to create order",
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
      {/* New Order Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Place New Order
          </CardTitle>
          <CardDescription>
            Browse our scooter collection and place your order
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Dialog open={isNewOrderOpen} onOpenChange={setIsNewOrderOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Order
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Order</DialogTitle>
                <DialogDescription>
                  Select scooters and complete your order
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid md:grid-cols-2 gap-6">
                {/* Scooters Grid */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Available Scooters</h3>
                  <div className="grid gap-4">
                    {scooters.map((scooter) => (
                      <Card key={scooter.id} className="p-4">
                        <div className="flex items-center gap-4">
                          <img 
                            src={scooter.image_url} 
                            alt={scooter.name}
                            className="w-16 h-16 object-cover rounded"
                          />
                          <div className="flex-1">
                            <h4 className="font-medium">{scooter.name}</h4>
                            <p className="text-sm text-muted-foreground">{scooter.model}</p>
                            <p className="text-sm">{scooter.description}</p>
                            <p className="font-semibold">${scooter.price}</p>
                          </div>
                          <Button 
                            size="sm"
                            onClick={() => addToCart(scooter)}
                          >
                            Add to Cart
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Cart */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Your Cart</h3>
                  {cart.length === 0 ? (
                    <p className="text-muted-foreground">Cart is empty</p>
                  ) : (
                    <div className="space-y-3">
                      {cart.map((item) => (
                        <Card key={item.scooterId} className="p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">{item.name}</h4>
                              <p className="text-sm text-muted-foreground">{item.model}</p>
                              <p className="text-sm">${item.price} each</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateCartQuantity(item.scooterId, item.quantity - 1)}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="px-2">{item.quantity}</span>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateCartQuantity(item.scooterId, item.quantity + 1)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                      
                      <div className="space-y-3 pt-4 border-t">
                        <div className="flex justify-between font-semibold">
                          <span>Total: ${getTotalAmount().toFixed(2)}</span>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="delivery-address">Delivery Address</Label>
                          <Textarea
                            id="delivery-address"
                            placeholder="Enter your complete delivery address"
                            value={deliveryAddress}
                            onChange={(e) => setDeliveryAddress(e.target.value)}
                          />
                        </div>
                        
                        <Button 
                          onClick={createOrder} 
                          disabled={loading}
                          className="w-full"
                        >
                          {loading ? 'Creating Order...' : 'Place Order'}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
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