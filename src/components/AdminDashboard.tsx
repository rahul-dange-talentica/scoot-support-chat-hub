import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Settings, 
  Plus, 
  Edit2, 
  Trash2, 
  MessageSquare, 
  Users,
  HelpCircle,
  Save,
  X,
  Send,
  ArrowLeft,
  LogOut,
  User,
  Package
} from "lucide-react";
import { AdminOrderManagement } from "./AdminOrderManagement";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState<'questions' | 'queries' | 'orders' | 'profile' | 'customers'>('profile');
  const [editingQuestion, setEditingQuestion] = useState<string | null>(null);
  const [newQuestion, setNewQuestion] = useState({ question: '', answer: '' });
  const [questions, setQuestions] = useState<any[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [conversationMessages, setConversationMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [adminProfile, setAdminProfile] = useState<any>(null);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showResolvedQueries, setShowResolvedQueries] = useState(false);
  const [selectedCustomerFilter, setSelectedCustomerFilter] = useState<string>('');
  const { toast } = useToast();

  // Fetch data from Supabase
  useEffect(() => {
    fetchQuestions();
    fetchConversations();
    fetchAdminProfile();
    fetchCustomers();
  }, []);

  const fetchAdminProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error('Error fetching admin profile:', error);
        } else {
          setAdminProfile(profile);
        }
      }
    } catch (error) {
      console.error('Error fetching admin profile:', error);
    }
  };

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'customer')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching customers:', error);
        toast({
          title: "Error",
          description: "Failed to fetch customers",
          variant: "destructive"
        });
      } else {
        setCustomers(data || []);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
    }
  };

  const fetchQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from('faq_questions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching questions:', error);
        toast({
          title: "Error",
          description: "Failed to fetch FAQ questions",
          variant: "destructive"
        });
      } else {
        setQuestions(data || []);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchConversations = async () => {
    try {
      // First get conversations (show both resolved and unresolved)
      let query = supabase
        .from('support_conversations')
        .select('*');
      
      if (!showResolvedQueries) {
        query = query.eq('is_resolved', false);
      }
      
      const { data: conversationsData, error: conversationsError } = await query
        .order('created_at', { ascending: false });

      if (conversationsError) {
        console.error('Error fetching conversations:', conversationsError);
        return;
      }

      // Then get profiles and orders for each conversation
      if (conversationsData && conversationsData.length > 0) {
        const userIds = conversationsData.map(conv => conv.user_id);
        const orderIds = conversationsData.map(conv => conv.order_id).filter(Boolean);
        
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, mobile_number, full_name, email')
          .in('user_id', userIds);

        let ordersData = [];
        if (orderIds.length > 0) {
          const { data: orders } = await supabase
            .from('orders')
            .select('id, order_number, status, total_amount')
            .in('id', orderIds);
          ordersData = orders || [];
        }

        if (profilesError) {
          console.error('Error fetching profiles:', profilesError);
        }

        // Combine conversations with profile and order data
        const conversationsWithProfiles = conversationsData.map(conv => ({
          ...conv,
          customer_profile: profilesData?.find(profile => profile.user_id === conv.user_id),
          order_details: conv.order_id ? ordersData.find(order => order.id === conv.order_id) : null
        }));

        setConversations(conversationsWithProfiles);
      } else {
        setConversations([]);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
    }
  };

  const handleAddQuestion = async () => {
    if (!newQuestion.question || !newQuestion.answer) {
      toast({
        title: "Error",
        description: "Please fill in both question and answer",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('faq_questions')
        .insert({
          question: newQuestion.question,
          answer: newQuestion.answer,
          is_active: true
        });

      if (error) {
        throw error;
      }

      setNewQuestion({ question: '', answer: '' });
      await fetchQuestions();
      
      toast({
        title: "Success",
        description: "FAQ question added successfully"
      });
    } catch (error) {
      console.error('Error adding question:', error);
      toast({
        title: "Error",
        description: "Failed to add FAQ question",
        variant: "destructive"
      });
    }
  };

  const handleUpdateQuestion = async (id: string, updatedData: any) => {
    try {
      const { error } = await supabase
        .from('faq_questions')
        .update({
          question: updatedData.question,
          answer: updatedData.answer,
          is_active: updatedData.is_active
        })
        .eq('id', id);

      if (error) {
        throw error;
      }

      await fetchQuestions();
      setEditingQuestion(null);
      
      toast({
        title: "Success",
        description: "FAQ question updated successfully"
      });
    } catch (error) {
      console.error('Error updating question:', error);
      toast({
        title: "Error",
        description: "Failed to update FAQ question",
        variant: "destructive"
      });
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    try {
      const { error } = await supabase
        .from('faq_questions')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      await fetchQuestions();
      
      toast({
        title: "Success",
        description: "FAQ question deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting question:', error);
      toast({
        title: "Error",
        description: "Failed to delete FAQ question",
        variant: "destructive"
      });
    }
  };


  // Fetch conversation messages
  const fetchConversationMessages = async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from('conversation_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
      } else {
        setConversationMessages(data || []);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  // Send admin response
  const handleSendAdminMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      // Add admin message
      await supabase
        .from('conversation_messages')
        .insert({
          conversation_id: selectedConversation.id,
          sender_type: 'admin',
          message: newMessage
        });

      // Update conversation
      await supabase
        .from('support_conversations')
        .update({
          last_message: newMessage,
          last_message_at: new Date().toISOString()
        })
        .eq('id', selectedConversation.id);

      setNewMessage('');
      await fetchConversationMessages(selectedConversation.id);
      
      toast({
        title: "Response sent",
        description: "Your response has been sent to the customer",
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send response",
        variant: "destructive"
      });
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error logging out:', error);
        toast({
          title: "Error",
          description: "Failed to logout",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Logged out",
          description: "You have been successfully logged out"
        });
        // Redirect will be handled by the auth state change in the main app
      }
    } catch (error) {
      console.error('Unexpected error during logout:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card shadow-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold">Admin Dashboard</h1>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="secondary">
                EcoRide Support Admin
              </Badge>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleLogout}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Logout
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
              variant={activeTab === 'profile' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('profile')}
              className="rounded-none"
            >
              <User className="h-4 w-4" />
              Profile
            </Button>
            <Button
              variant={activeTab === 'questions' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('questions')}
              className="rounded-none"
            >
              <HelpCircle className="h-4 w-4" />
              FAQ Management
            </Button>
            <Button
              variant={activeTab === 'queries' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('queries')}
              className="rounded-none"
            >
              <MessageSquare className="h-4 w-4" />
              Customer Queries
            </Button>
            <Button
              variant={activeTab === 'orders' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('orders')}
              className="rounded-none"
            >
              <Package className="h-4 w-4" />
              Order Management
            </Button>
            <Button
              variant={activeTab === 'customers' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('customers')}
              className="rounded-none"
            >
              <Users className="h-4 w-4" />
              Customers
            </Button>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="container mx-auto px-4 py-6 max-w-6xl">
        {activeTab === 'questions' ? (
          <QuestionsManagement 
            questions={questions}
            newQuestion={newQuestion}
            setNewQuestion={setNewQuestion}
            editingQuestion={editingQuestion}
            setEditingQuestion={setEditingQuestion}
            handleAddQuestion={handleAddQuestion}
            handleDeleteQuestion={handleDeleteQuestion}
            handleUpdateQuestion={handleUpdateQuestion}
          />
        ) : activeTab === 'queries' ? (
          <QueriesManagement 
            conversations={conversations} 
            selectedConversation={selectedConversation}
            setSelectedConversation={setSelectedConversation}
            conversationMessages={conversationMessages}
            fetchConversationMessages={fetchConversationMessages}
            newMessage={newMessage}
            setNewMessage={setNewMessage}
            onSendMessage={handleSendAdminMessage}
            showResolvedQueries={showResolvedQueries}
            setShowResolvedQueries={setShowResolvedQueries}
            selectedCustomerFilter={selectedCustomerFilter}
            setSelectedCustomerFilter={setSelectedCustomerFilter}
            onRefreshConversations={fetchConversations}
          />
        ) : activeTab === 'orders' ? (
          <AdminOrderManagement />
        ) : activeTab === 'customers' ? (
          <CustomersManagement 
            customers={customers}
            onRefreshCustomers={fetchCustomers}
          />
        ) : (
          <AdminProfileManagement 
            adminProfile={adminProfile}
            onProfileUpdate={fetchAdminProfile}
          />
        )}
      </main>
    </div>
  );
};

const QuestionsManagement = ({ 
  questions, 
  newQuestion, 
  setNewQuestion, 
  editingQuestion, 
  setEditingQuestion,
  handleAddQuestion,
  handleDeleteQuestion,
  handleUpdateQuestion 
}: any) => (
  <div className="space-y-6">
    {/* Add New Question */}
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Add New FAQ
        </CardTitle>
        <CardDescription>
          Create predefined questions and answers for customer support
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          placeholder="Question"
          value={newQuestion.question}
          onChange={(e) => setNewQuestion({...newQuestion, question: e.target.value})}
        />
        <Textarea
          placeholder="Answer"
          value={newQuestion.answer}
          onChange={(e) => setNewQuestion({...newQuestion, answer: e.target.value})}
          rows={3}
        />
        <Button onClick={handleAddQuestion} variant="electric">
          <Plus className="h-4 w-4" />
          Add Question
        </Button>
      </CardContent>
    </Card>

    {/* Questions List */}
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle>Existing FAQs</CardTitle>
        <CardDescription>
          Manage your knowledge base of predefined questions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {questions.map((q: any) => (
            <div key={q.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={q.is_active ? 'default' : 'secondary'}>
                      {q.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  {editingQuestion === q.id ? (
                    <EditQuestionForm 
                      question={q} 
                      onSave={(updated: any) => {
                        handleUpdateQuestion(q.id, updated);
                      }}
                      onCancel={() => setEditingQuestion(null)}
                    />
                  ) : (
                    <div>
                      <h4 className="font-medium mb-1">{q.question}</h4>
                      <p className="text-sm text-muted-foreground">{q.answer}</p>
                    </div>
                  )}
                </div>
                {editingQuestion !== q.id && (
                  <div className="flex gap-2 ml-4">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setEditingQuestion(q.id)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleDeleteQuestion(q.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  </div>
);

const EditQuestionForm = ({ question, onSave, onCancel }: any) => {
  const [editData, setEditData] = useState(question);

  return (
    <div className="space-y-3">
      <Input
        value={editData.question}
        onChange={(e) => setEditData({...editData, question: e.target.value})}
        placeholder="Question"
      />
      <Textarea
        value={editData.answer}
        onChange={(e) => setEditData({...editData, answer: e.target.value})}
        placeholder="Answer"
        rows={2}
      />
      <div className="flex gap-2">
        <Button variant="electric" size="sm" onClick={() => onSave(editData)}>
          <Save className="h-4 w-4" />
          Save
        </Button>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <X className="h-4 w-4" />
          Cancel
        </Button>
      </div>
    </div>
  );
};

interface QueriesManagementProps {
  conversations: any[];
  selectedConversation: any;
  setSelectedConversation: (conversation: any) => void;
  conversationMessages: any[];
  fetchConversationMessages: (id: string) => void;
  newMessage: string;
  setNewMessage: (message: string) => void;
  onSendMessage: () => void;
  showResolvedQueries: boolean;
  setShowResolvedQueries: (show: boolean) => void;
  selectedCustomerFilter: string;
  setSelectedCustomerFilter: (filter: string) => void;
  onRefreshConversations: () => void;
}

const QueriesManagement = ({ 
  conversations, 
  selectedConversation,
  setSelectedConversation,
  conversationMessages,
  fetchConversationMessages,
  newMessage,
  setNewMessage,
  onSendMessage,
  showResolvedQueries,
  setShowResolvedQueries,
  selectedCustomerFilter,
  setSelectedCustomerFilter,
  onRefreshConversations
}: QueriesManagementProps) => {
  
  const handleViewConversation = (conversation: any) => {
    setSelectedConversation(conversation);
    fetchConversationMessages(conversation.id);
  };

  if (selectedConversation) {
    return (
      <div className="space-y-4">
        {/* Conversation Header */}
        <Card className="shadow-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm" onClick={() => setSelectedConversation(null)}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                  <CardTitle className="text-lg">{selectedConversation.title}</CardTitle>
                  <CardDescription>
                    Customer: {selectedConversation.customer_profile?.full_name || 'Unknown'} ({selectedConversation.customer_profile?.mobile_number}) • 
                    Started {new Date(selectedConversation.created_at).toLocaleDateString()}
                  </CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Messages */}
        <Card className="shadow-card">
          <CardContent className="p-0">
            <div className="max-h-96 overflow-y-auto p-4 space-y-4">
              {conversationMessages.map((message) => (
                <div 
                  key={message.id} 
                  className={`flex ${message.sender_type === 'admin' ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[80%] p-3 rounded-lg ${
                      message.sender_type === 'admin' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted'
                    }`}
                  >
                    <p className="text-sm">{message.message}</p>
                    <p className={`text-xs mt-1 ${
                      message.sender_type === 'admin' 
                        ? 'text-primary-foreground/70' 
                        : 'text-muted-foreground'
                    }`}>
                      {message.sender_type === 'admin' ? 'Admin' : 'Customer'} • {new Date(message.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Admin Response Input */}
        {!selectedConversation.is_resolved && (
          <Card className="shadow-card">
            <CardContent className="p-4">
              <div className="flex gap-2">
                <Textarea
                  placeholder="Type your response to the customer..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  rows={3}
                />
                <Button onClick={onSendMessage} disabled={!newMessage.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Get unique customers for filter
  const uniqueCustomers = Array.from(new Set(
    conversations.map(conv => conv.customer_profile?.full_name).filter(Boolean)
  )).map(name => ({ 
    name, 
    conversation: conversations.find(conv => conv.customer_profile?.full_name === name)
  }));

  // Filter conversations based on selected customer
  const filteredConversations = selectedCustomerFilter 
    ? conversations.filter(conv => conv.customer_profile?.full_name === selectedCustomerFilter)
    : conversations;

  return (
    <div className="space-y-6">
      <Card className="shadow-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Customer Queries
              </CardTitle>
              <CardDescription>
                Review and respond to customer questions that need human attention
              </CardDescription>
            </div>
            <div className="flex gap-2 items-center">
              <label htmlFor="show-resolved" className="text-sm font-medium">
                Show Resolved
              </label>
              <Switch
                id="show-resolved"
                checked={showResolvedQueries}
                onCheckedChange={(checked) => {
                  setShowResolvedQueries(checked);
                  onRefreshConversations();
                }}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Customer Filter */}
            <div className="flex gap-4 items-center">
              <label className="text-sm font-medium">Filter by Customer:</label>
              <select 
                className="px-3 py-2 border rounded-md bg-background"
                value={selectedCustomerFilter}
                onChange={(e) => setSelectedCustomerFilter(e.target.value)}
              >
                <option value="">All Customers</option>
                {uniqueCustomers.map((customer) => (
                  <option key={customer.name} value={customer.name}>
                    {customer.name}
                  </option>
                ))}
              </select>
            </div>
            
            {filteredConversations.length > 0 ? filteredConversations.map((conversation) => (
              <div key={conversation.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="font-medium">
                      Customer: {conversation.customer_profile?.full_name || 'Unknown'} 
                      ({conversation.customer_profile?.mobile_number})
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Email: {conversation.customer_profile?.email || 'N/A'}
                    </p>
                    {conversation.order_details && (
                      <p className="text-sm text-muted-foreground">
                        Order: {conversation.order_details.order_number} - ${conversation.order_details.total_amount} ({conversation.order_details.status})
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      {new Date(conversation.created_at).toLocaleDateString()} at {new Date(conversation.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant={conversation.is_resolved ? "default" : "secondary"}>
                      {conversation.is_resolved ? "Resolved" : conversation.status}
                    </Badge>
                  </div>
                </div>
                
                <div className="bg-muted/50 p-3 rounded-lg">
                  <h4 className="font-medium mb-1">{conversation.title}</h4>
                  {conversation.last_message && (
                    <p className="text-sm">{conversation.last_message}</p>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button 
                    variant="electric" 
                    size="sm"
                    onClick={() => handleViewConversation(conversation)}
                  >
                    View Conversation
                  </Button>
                </div>
              </div>
            )) : (
              <p className="text-center text-muted-foreground py-8">
                No open conversations at the moment.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const AdminProfileManagement = ({ adminProfile, onProfileUpdate }: { adminProfile: any, onProfileUpdate: () => void }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState({
    full_name: '',
    email: '',
    mobile_number: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    if (adminProfile) {
      setEditedProfile({
        full_name: adminProfile.full_name || '',
        email: adminProfile.email || '',
        mobile_number: adminProfile.mobile_number || ''
      });
    }
  }, [adminProfile]);

  const handleSaveProfile = async () => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: editedProfile.full_name,
          email: editedProfile.email,
          mobile_number: editedProfile.mobile_number
        })
        .eq('user_id', adminProfile.user_id);

      if (error) {
        throw error;
      }

      setIsEditing(false);
      await onProfileUpdate();
      
      toast({
        title: "Success",
        description: "Profile updated successfully"
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive"
      });
    }
  };

  if (!adminProfile) {
    return (
      <div className="space-y-6">
        <Card className="shadow-card">
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Loading profile...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Admin Profile
              </CardTitle>
              <CardDescription>
                Manage your admin account information
              </CardDescription>
            </div>
            {!isEditing && (
              <Button 
                variant="outline" 
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2"
              >
                <Edit2 className="h-4 w-4" />
                Edit Profile
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isEditing ? (
            <>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                  <Input
                    value={editedProfile.full_name}
                    onChange={(e) => setEditedProfile({...editedProfile, full_name: e.target.value})}
                    placeholder="Enter your full name"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <Input
                    type="email"
                    value={editedProfile.email}
                    onChange={(e) => setEditedProfile({...editedProfile, email: e.target.value})}
                    placeholder="Enter your email"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Mobile Number</label>
                  <Input
                    value={editedProfile.mobile_number}
                    onChange={(e) => setEditedProfile({...editedProfile, mobile_number: e.target.value})}
                    placeholder="Enter your mobile number"
                  />
                </div>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button onClick={handleSaveProfile} variant="electric">
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => {
                    setIsEditing(false);
                    if (adminProfile) {
                      setEditedProfile({
                        full_name: adminProfile.full_name || '',
                        email: adminProfile.email || '',
                        mobile_number: adminProfile.mobile_number || ''
                      });
                    }
                  }}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                  <p className="text-sm p-2 bg-muted rounded-md">{adminProfile.full_name || 'Not provided'}</p>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <p className="text-sm p-2 bg-muted rounded-md">{adminProfile.email || 'Not provided'}</p>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Mobile Number</label>
                  <p className="text-sm p-2 bg-muted rounded-md">{adminProfile.mobile_number || 'Not provided'}</p>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Role</label>
                  <Badge variant="default" className="w-fit">
                    {adminProfile.role}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Account Created</label>
                  <p className="text-sm p-2 bg-muted rounded-md">
                    {new Date(adminProfile.created_at).toLocaleDateString()}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                  <p className="text-sm p-2 bg-muted rounded-md">
                    {new Date(adminProfile.updated_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const CustomersManagement = ({ customers, onRefreshCustomers }: { customers: any[], onRefreshCustomers: () => void }) => {
  return (
    <div className="space-y-6">
      <Card className="shadow-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Customer Profiles
              </CardTitle>
              <CardDescription>
                View and manage all customer accounts
              </CardDescription>
            </div>
            <Button 
              variant="outline" 
              onClick={onRefreshCustomers}
              className="flex items-center gap-2"
            >
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {customers.length > 0 ? customers.map((customer) => (
              <div key={customer.id} className="border rounded-lg p-4 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                    <p className="text-sm">{customer.full_name || 'Not provided'}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Email</label>
                    <p className="text-sm">{customer.email || 'Not provided'}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Mobile Number</label>
                    <p className="text-sm">{customer.mobile_number || 'Not provided'}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Role</label>
                    <Badge variant="secondary" className="w-fit">
                      {customer.role}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Joined</label>
                    <p className="text-sm">
                      {new Date(customer.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                    <p className="text-sm">
                      {new Date(customer.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            )) : (
              <p className="text-center text-muted-foreground py-8">
                No customers found.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;