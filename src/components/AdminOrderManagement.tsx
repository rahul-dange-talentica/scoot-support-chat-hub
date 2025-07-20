import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Package, MessageCircle, Edit } from 'lucide-react';
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
  user_id: string;
  profiles?: {
    full_name: string;
    mobile_number: string;
    email: string;
  };
}

export const AdminOrderManagement = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      // First fetch orders
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (ordersError) throw ordersError;

      // Then fetch profiles for each order
      const ordersWithProfiles = await Promise.all(
        (ordersData || []).map(async (order) => {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name, mobile_number, email')
            .eq('user_id', order.user_id)
            .single();
          
          return {
            ...order,
            profiles: profileData
          };
        })
      );
      
      setOrders(ordersWithProfiles as any);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: "Error",
        description: "Failed to load orders",
        variant: "destructive",
      });
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Order status updated successfully",
      });

      fetchOrders();
      setSelectedOrder(null);
      setNewStatus('');
    } catch (error) {
      console.error('Error updating order:', error);
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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

  const [orderConversations, setOrderConversations] = useState<any[]>([]);
  const [showConversationsDialog, setShowConversationsDialog] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');

  const viewConversations = async (orderId: string) => {
    try {
      const { data, error } = await supabase
        .from('support_conversations')
        .select(`
          *,
          profiles:user_id (full_name, mobile_number, email)
        `)
        .eq('order_id', orderId);

      if (error) throw error;

      setOrderConversations(data || []);
      setSelectedOrderId(orderId);
      setShowConversationsDialog(true);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast({
        title: "Error",
        description: "Failed to fetch conversations",
        variant: "destructive",
      });
    }
  };

  const parseOrderItems = (items: any) => {
    try {
      return typeof items === 'string' ? JSON.parse(items) : items || [];
    } catch {
      return [];
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Order Management
          </CardTitle>
          <CardDescription>
            Manage all customer orders and update their status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <p className="text-muted-foreground">No orders found</p>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const orderItems = parseOrderItems(order.items);
                return (
                  <Card key={order.id} className="p-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{order.order_number}</h4>
                            <Badge className={getStatusColor(order.status)}>
                              {order.status.toUpperCase()}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Customer: {order.profiles?.full_name || 'Unknown'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Phone: {order.profiles?.mobile_number || 'N/A'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Email: {order.profiles?.email || 'N/A'}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => viewConversations(order.id)}
                          >
                            <MessageCircle className="h-4 w-4 mr-2" />
                            View Conversations
                          </Button>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedOrder(order);
                                  setNewStatus(order.status);
                                }}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Update Status
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Update Order Status</DialogTitle>
                                <DialogDescription>
                                  Change the status of order {order.order_number}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <label className="text-sm font-medium">Status</label>
                                  <Select value={newStatus} onValueChange={setNewStatus}>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="pending">Pending</SelectItem>
                                      <SelectItem value="confirmed">Confirmed</SelectItem>
                                      <SelectItem value="processing">Processing</SelectItem>
                                      <SelectItem value="shipped">Shipped</SelectItem>
                                      <SelectItem value="delivered">Delivered</SelectItem>
                                      <SelectItem value="cancelled">Cancelled</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <Button
                                  onClick={() => updateOrderStatus(order.id, newStatus)}
                                  disabled={loading || newStatus === order.status}
                                  className="w-full"
                                >
                                  {loading ? 'Updating...' : 'Update Status'}
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-4 pt-4 border-t">
                        <div className="space-y-2">
                          <h5 className="font-medium">Order Details</h5>
                          <p className="text-sm text-muted-foreground">
                            Total: ${order.total_amount}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Items: {orderItems.length} scooter(s)
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
                        
                        <div className="space-y-2">
                          <h5 className="font-medium">Items Ordered</h5>
                          {orderItems.map((item: any, index: number) => (
                            <div key={index} className="text-sm text-muted-foreground">
                              {item.name} ({item.model}) - Qty: {item.quantity} - ${item.price} each
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Conversations Dialog */}
      <Dialog open={showConversationsDialog} onOpenChange={setShowConversationsDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order Conversations</DialogTitle>
            <DialogDescription>
              All support conversations for this order (both pending and resolved)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {orderConversations.length > 0 ? (
              orderConversations.map((conversation) => (
                <Card key={conversation.id} className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{conversation.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          By: {conversation.profiles?.full_name || 'Unknown'} 
                          ({conversation.profiles?.mobile_number || 'N/A'})
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(conversation.created_at).toLocaleDateString()} at {' '}
                          {new Date(conversation.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant={conversation.is_resolved ? "default" : "secondary"}>
                          {conversation.is_resolved ? "Resolved" : conversation.status}
                        </Badge>
                        <Badge variant="outline">{conversation.priority}</Badge>
                      </div>
                    </div>
                    {conversation.last_message && (
                      <div className="bg-muted/50 p-3 rounded-lg">
                        <p className="text-sm">{conversation.last_message}</p>
                        {conversation.last_message_at && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Last updated: {new Date(conversation.last_message_at).toLocaleString()}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </Card>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No conversations found for this order.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};