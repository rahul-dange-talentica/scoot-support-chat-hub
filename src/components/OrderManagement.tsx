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
import { Package, MessageCircle, Plus, HelpCircle } from 'lucide-react';
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

interface OrderManagementProps {
  onStartConversation?: (conversationId: string, orderNumber: string) => void;
}

export const OrderManagement = ({ onStartConversation }: OrderManagementProps) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderNumber, setOrderNumber] = useState('');
  const [orderDate, setOrderDate] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [isAddOrderOpen, setIsAddOrderOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [faqQuestions, setFaqQuestions] = useState<any[]>([]);
  const [showSupportDialog, setShowSupportDialog] = useState(false);
  const [selectedOrderForSupport, setSelectedOrderForSupport] = useState<string>('');
  const [supportType, setSupportType] = useState<'faq' | 'new' | ''>('');
  const [selectedFaqId, setSelectedFaqId] = useState('');
  const [customQuestion, setCustomQuestion] = useState('');
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
    fetchFaqQuestions();
  }, []);

  const fetchFaqQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from('faq_questions')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFaqQuestions(data || []);
    } catch (error) {
      console.error('Error fetching FAQ questions:', error);
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

  const addOrderDetails = async () => {
    if (!orderNumber.trim() || !orderDate || !selectedModel || !deliveryAddress.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
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
        order_number: orderNumber,
        status: 'pending',
        total_amount: 0, // Will be updated by admin
        items: JSON.stringify([{ model: selectedModel, order_date: orderDate }]),
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

      setOrderNumber('');
      setOrderDate('');
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

  const handleStartSupport = (orderId: string) => {
    setSelectedOrderForSupport(orderId);
    setShowSupportDialog(true);
  };

  const startSupportConversation = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let conversationTitle = '';
      let faqQuestionId = null;

      if (supportType === 'faq' && selectedFaqId) {
        const selectedFaq = faqQuestions.find(faq => faq.id === selectedFaqId);
        conversationTitle = selectedFaq?.question || 'FAQ Question';
        faqQuestionId = selectedFaqId;
      } else if (supportType === 'new' && customQuestion) {
        conversationTitle = customQuestion;
      } else {
        toast({
          title: "Error",
          description: "Please select a question type and provide details",
          variant: "destructive"
        });
        return;
      }

      const { data: conversation, error } = await supabase
        .from('support_conversations')
        .insert([{
          user_id: user.id,
          title: conversationTitle,
          status: 'open',
          priority: 'medium',
          order_id: selectedOrderForSupport,
          faq_question_id: faqQuestionId
        }])
        .select()
        .single();

      if (error) throw error;

      // Add initial message if it's a custom question
      if (supportType === 'new' && customQuestion) {
        await supabase
          .from('conversation_messages')
          .insert([{
            conversation_id: conversation.id,
            sender_type: 'customer',
            message: customQuestion
          }]);
      }

      toast({
        title: "Success",
        description: "Support conversation started",
      });

      // Reset form and close dialog
      setShowSupportDialog(false);
      setSupportType('');
      setSelectedFaqId('');
      setCustomQuestion('');

      // Call the callback to open the conversation view
      if (onStartConversation && conversation) {
        const order = orders.find(o => o.id === selectedOrderForSupport);
        onStartConversation(conversation.id, order?.order_number || '');
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
      toast({
        title: "Error",
        description: "Failed to start support conversation",
        variant: "destructive"
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
                  <Label htmlFor="order-number">Order Number</Label>
                  <Input
                    id="order-number"
                    placeholder="Enter your order number"
                    value={orderNumber}
                    onChange={(e) => setOrderNumber(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="order-date">Order Date</Label>
                  <Input
                    id="order-date"
                    type="date"
                    value={orderDate}
                    onChange={(e) => setOrderDate(e.target.value)}
                  />
                </div>
                
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
                      onClick={() => handleStartSupport(order.id)}
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

      {/* Support Dialog */}
      <Dialog open={showSupportDialog} onOpenChange={setShowSupportDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Start Support Conversation</DialogTitle>
            <DialogDescription>
              Choose how you'd like to get help with your order
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="faq"
                  name="support-type"
                  value="faq"
                  checked={supportType === 'faq'}
                  onChange={(e) => setSupportType(e.target.value as 'faq')}
                  className="h-4 w-4"
                />
                <label htmlFor="faq" className="text-sm font-medium flex items-center gap-2">
                  <HelpCircle className="h-4 w-4" />
                  Select from FAQ
                </label>
              </div>
              
              {supportType === 'faq' && (
                <Select value={selectedFaqId} onValueChange={setSelectedFaqId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a frequently asked question" />
                  </SelectTrigger>
                  <SelectContent>
                    {faqQuestions.map((faq) => (
                      <SelectItem key={faq.id} value={faq.id}>
                        {faq.question}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="new"
                  name="support-type"
                  value="new"
                  checked={supportType === 'new'}
                  onChange={(e) => setSupportType(e.target.value as 'new')}
                  className="h-4 w-4"
                />
                <label htmlFor="new" className="text-sm font-medium flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" />
                  Ask a new question
                </label>
              </div>
              
              {supportType === 'new' && (
                <Textarea
                  placeholder="Describe your question or issue..."
                  value={customQuestion}
                  onChange={(e) => setCustomQuestion(e.target.value)}
                  rows={3}
                />
              )}
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              onClick={startSupportConversation}
              disabled={
                !supportType || 
                (supportType === 'faq' && !selectedFaqId) || 
                (supportType === 'new' && !customQuestion.trim())
              }
            >
              Start Conversation
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowSupportDialog(false);
                setSupportType('');
                setSelectedFaqId('');
                setCustomQuestion('');
              }}
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};