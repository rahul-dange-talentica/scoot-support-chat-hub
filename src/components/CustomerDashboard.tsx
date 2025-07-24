import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
  Mail,
  Send,
  ArrowLeft,
  FileImage,
  Video,
  Download
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { OrderManagement } from "./OrderManagement";
import { FileUpload } from "./FileUpload";

interface CustomerDashboardProps {
  userProfile: any;
  onLogout: () => void;
}

const CustomerDashboard = ({ userProfile, onLogout }: CustomerDashboardProps) => {
  const [activeView, setActiveView] = useState<'profile' | 'support' | 'orders'>('support');
  const [supportConversations, setSupportConversations] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [faqQuestions, setFaqQuestions] = useState<any[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [conversationMessages, setConversationMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [showResolvedConversations, setShowResolvedConversations] = useState(false);
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

  // Fetch data from Supabase
  useEffect(() => {
    const fetchData = async () => {
      if (!userProfile?.user_id) return;

      try {
        setLoading(true);

        // Fetch FAQ questions
        const { data: faqData, error: faqError } = await supabase
          .from('faq_questions')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: true });

        if (faqError) {
          console.error('Error fetching FAQ questions:', faqError);
        } else {
          setFaqQuestions(faqData || []);
        }

        // Fetch support conversations
        let conversationsQuery = supabase
          .from('support_conversations')
          .select('*')
          .eq('user_id', userProfile.user_id);
        
        if (!showResolvedConversations) {
          // When toggle is OFF: show only unresolved conversations
          conversationsQuery = conversationsQuery.eq('is_resolved', false);
        }
        // When toggle is ON: show all conversations (no filter needed)
        
        const { data: conversations, error: conversationsError } = await conversationsQuery
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
  }, [userProfile?.user_id, showResolvedConversations]);

  // Handle FAQ question selection
  const handleFaqQuestion = async (question: any) => {
    try {
      // Create a new conversation
      const { data: conversation, error: convError } = await supabase
        .from('support_conversations')
        .insert({
          user_id: userProfile.user_id,
          title: question.question,
          faq_question_id: question.id,
          last_message: question.answer,
          last_message_at: new Date().toISOString()
        })
        .select()
        .single();

      if (convError) {
        toast({
          title: "Error",
          description: "Failed to start conversation",
          variant: "destructive"
        });
        return;
      }

      // Add the initial FAQ answer as a message
      await supabase
        .from('conversation_messages')
        .insert({
          conversation_id: conversation.id,
          sender_type: 'admin',
          message: question.answer
        });

      setSelectedConversation(conversation);
      await fetchConversationMessages(conversation.id);
      
      toast({
        title: "Question answered",
        description: "You can now ask follow-up questions",
      });
    } catch (error) {
      console.error('Error handling FAQ question:', error);
    }
  };

  // Fetch conversation messages
  const fetchConversationMessages = async (conversationId: string) => {
    const { data: messages, error } = await supabase
      .from('conversation_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
    } else {
      setConversationMessages(messages || []);
    }
  };

  // Send a new message with optional file attachment
  const handleSendMessage = async (fileUrl?: string, fileName?: string, fileType?: string, fileSize?: number) => {
    if (!newMessage.trim() && !fileUrl || !selectedConversation) return;

    try {
      const messageData: any = {
        conversation_id: selectedConversation.id,
        sender_type: 'customer',
        message: newMessage || (fileUrl ? 'File attachment' : '')
      };

      if (fileUrl) {
        messageData.file_url = fileUrl;
        messageData.file_name = fileName;
        messageData.file_type = fileType;
        messageData.file_size = fileSize;
      }

      // Add user message
      await supabase
        .from('conversation_messages')
        .insert(messageData);

      // Update conversation
      await supabase
        .from('support_conversations')
        .update({
          last_message: newMessage || `📎 ${fileName}`,
          last_message_at: new Date().toISOString()
        })
        .eq('id', selectedConversation.id);

      setNewMessage('');
      await fetchConversationMessages(selectedConversation.id);
      
      toast({
        title: "Message sent",
        description: fileUrl ? "Your message with file attachment has been sent" : "Your message has been sent to support",
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
    }
  };

  // Mark conversation as resolved
  const handleResolveConversation = async () => {
    if (!selectedConversation) return;

    try {
      await supabase
        .from('support_conversations')
        .update({ is_resolved: true, status: 'resolved' })
        .eq('id', selectedConversation.id);

      setSelectedConversation({ ...selectedConversation, is_resolved: true, status: 'resolved' });
      
      toast({
        title: "Conversation resolved",
        description: "Thank you for your feedback!",
      });
    } catch (error) {
      console.error('Error resolving conversation:', error);
    }
  };

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
          <SupportView 
            recentChats={recentChats} 
            faqQuestions={faqQuestions}
            onFaqQuestion={handleFaqQuestion}
            selectedConversation={selectedConversation}
            conversationMessages={conversationMessages}
            onBackToList={() => setSelectedConversation(null)}
            onSendMessage={handleSendMessage}
            newMessage={newMessage}
            setNewMessage={setNewMessage}
            onResolveConversation={handleResolveConversation}
            onSelectConversation={(conv) => {
              setSelectedConversation(conv);
              fetchConversationMessages(conv.id);
            }}
            showResolvedConversations={showResolvedConversations}
            setShowResolvedConversations={setShowResolvedConversations}
          />
        ) : (
          <OrderManagement 
            onStartConversation={async (conversationId, orderNumber) => {
              // Fetch the conversation and switch to support view
              const { data: conversation, error } = await supabase
                .from('support_conversations')
                .select('*')
                .eq('id', conversationId)
                .single();
              
              if (!error && conversation) {
                setSelectedConversation(conversation);
                await fetchConversationMessages(conversation.id);
                setActiveView('support');
              }
            }}
          />
        )}
      </main>
    </div>
  );
};

const ProfileView = ({ userProfile }: { userProfile: any }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState({
    full_name: '',
    email: '',
    mobile_number: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    if (userProfile) {
      setEditedProfile({
        full_name: userProfile.full_name || '',
        email: userProfile.email || '',
        mobile_number: userProfile.mobile_number || ''
      });
    }
  }, [userProfile]);

  const handleSaveProfile = async () => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: editedProfile.full_name,
          email: editedProfile.email,
          mobile_number: editedProfile.mobile_number
        })
        .eq('user_id', userProfile.user_id);

      if (error) {
        throw error;
      }

      setIsEditing(false);
      
      toast({
        title: "Success",
        description: "Profile updated successfully. Please refresh the page to see changes."
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

  return (
    <div className="space-y-6">
      <Card className="shadow-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </CardTitle>
              <CardDescription>
                View and manage your account details
              </CardDescription>
            </div>
            {!isEditing && (
              <Button 
                variant="outline" 
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2"
              >
                <User className="h-4 w-4" />
                Edit Profile
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isEditing ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-fullName">Full Name</Label>
                  <Input
                    id="edit-fullName"
                    value={editedProfile.full_name}
                    onChange={(e) => setEditedProfile({...editedProfile, full_name: e.target.value})}
                    placeholder="Enter your full name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-email">Email</Label>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <Input
                      id="edit-email"
                      type="email"
                      value={editedProfile.email}
                      onChange={(e) => setEditedProfile({...editedProfile, email: e.target.value})}
                      placeholder="Enter your email"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-mobile">Mobile Number</Label>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <Input
                      id="edit-mobile"
                      value={editedProfile.mobile_number}
                      onChange={(e) => setEditedProfile({...editedProfile, mobile_number: e.target.value})}
                      placeholder="Enter your mobile number"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button onClick={handleSaveProfile} variant="default">
                  <User className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsEditing(false);
                    if (userProfile) {
                      setEditedProfile({
                        full_name: userProfile.full_name || '',
                        email: userProfile.email || '',
                        mobile_number: userProfile.mobile_number || ''
                      });
                    }
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
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
          )}

          {!isEditing && (
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                You can now edit your profile information. Click "Edit Profile" to make changes.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

interface SupportViewProps {
  recentChats: any[];
  faqQuestions: any[];
  onFaqQuestion: (question: any) => void;
  selectedConversation: any;
  conversationMessages: any[];
  onBackToList: () => void;
  onSendMessage: (fileUrl?: string, fileName?: string, fileType?: string, fileSize?: number) => void;
  newMessage: string;
  setNewMessage: (message: string) => void;
  onResolveConversation: () => void;
  onSelectConversation: (conv: any) => void;
  showResolvedConversations: boolean;
  setShowResolvedConversations: (show: boolean) => void;
}

const SupportView = ({ 
  recentChats, 
  faqQuestions, 
  onFaqQuestion, 
  selectedConversation, 
  conversationMessages, 
  onBackToList, 
  onSendMessage, 
  newMessage, 
  setNewMessage, 
  onResolveConversation,
  onSelectConversation,
  showResolvedConversations,
  setShowResolvedConversations
}: SupportViewProps) => {
  const [showNewConversationDialog, setShowNewConversationDialog] = useState(false);
  const [selectedFAQ, setSelectedFAQ] = useState<any>(null);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [customQuestion, setCustomQuestion] = useState('');
  const [orders, setOrders] = useState<any[]>([]);
  
  // Fetch orders for the dropdown
  useEffect(() => {
    const fetchOrders = async () => {
      const { data: ordersData, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (!error) {
        setOrders(ordersData || []);
      }
    };
    fetchOrders();
  }, []);

  const handleStartNewConversation = async () => {
    if (!selectedFAQ && !customQuestion.trim()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      // Create new conversation
      const conversationData = {
        user_id: user.id,
        title: selectedFAQ ? selectedFAQ.question : customQuestion,
        faq_question_id: selectedFAQ?.id || null,
        order_id: selectedOrder?.id || null,
        last_message: selectedFAQ ? selectedFAQ.answer : customQuestion,
        last_message_at: new Date().toISOString()
      };

      const { data: conversation, error: convError } = await supabase
        .from('support_conversations')
        .insert(conversationData)
        .select()
        .single();

      if (convError) throw convError;

      // Add initial message
      if (selectedFAQ) {
        await supabase
          .from('conversation_messages')
          .insert({
            conversation_id: conversation.id,
            sender_type: 'admin',
            message: selectedFAQ.answer
          });
      } else {
        await supabase
          .from('conversation_messages')
          .insert({
            conversation_id: conversation.id,
            sender_type: 'customer',
            message: customQuestion
          });
      }

      // Reset dialog state
      setShowNewConversationDialog(false);
      setSelectedFAQ(null);
      setSelectedOrder(null);
      setCustomQuestion('');

      // Open the conversation
      onSelectConversation(conversation);
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  };
  
  if (selectedConversation) {
    return (
      <div className="space-y-4">
        {/* Conversation Header */}
        <Card className="shadow-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm" onClick={onBackToList}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                  <CardTitle className="text-lg">{selectedConversation.title}</CardTitle>
                  <CardDescription>
                    Started {new Date(selectedConversation.created_at).toLocaleDateString()}
                  </CardDescription>
                </div>
              </div>
              {!selectedConversation.is_resolved && (
                <Button onClick={onResolveConversation} variant="outline" size="sm">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark as Resolved
                </Button>
              )}
            </div>
          </CardHeader>
        </Card>

        {/* Messages */}
        <Card className="shadow-card">
          <CardContent className="p-0">
            <div className="max-h-96 overflow-y-auto p-4 space-y-4">
              {conversationMessages.map((message, index) => (
                <div 
                  key={message.id} 
                  className={`flex ${message.sender_type === 'customer' ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[80%] p-3 rounded-lg ${
                      message.sender_type === 'customer' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted'
                    }`}
                   >
                     {message.message && <p className="text-sm">{message.message}</p>}
                     {message.file_url && (
                       <div className="mt-2">
                         {message.file_type?.startsWith('image/') ? (
                           <div className="space-y-2">
                             <img 
                               src={message.file_url} 
                               alt={message.file_name} 
                               className="max-w-48 max-h-48 rounded-lg object-cover"
                             />
                             <div className="flex items-center gap-2 text-xs">
                               <FileImage className="h-3 w-3" />
                               <span>{message.file_name}</span>
                               <Button 
                                 variant="ghost" 
                                 size="sm" 
                                 className="h-auto p-1"
                                 onClick={() => window.open(message.file_url, '_blank')}
                               >
                                 <Download className="h-3 w-3" />
                               </Button>
                             </div>
                           </div>
                         ) : message.file_type?.startsWith('video/') ? (
                           <div className="space-y-2">
                             <video 
                               src={message.file_url} 
                               controls 
                               className="max-w-48 max-h-48 rounded-lg"
                             />
                             <div className="flex items-center gap-2 text-xs">
                               <Video className="h-3 w-3" />
                               <span>{message.file_name}</span>
                               <Button 
                                 variant="ghost" 
                                 size="sm" 
                                 className="h-auto p-1"
                                 onClick={() => window.open(message.file_url, '_blank')}
                               >
                                 <Download className="h-3 w-3" />
                               </Button>
                             </div>
                           </div>
                         ) : (
                           <div className="flex items-center gap-2 text-xs p-2 bg-background/10 rounded">
                             <FileImage className="h-3 w-3" />
                             <span>{message.file_name}</span>
                             <Button 
                               variant="ghost" 
                               size="sm" 
                               className="h-auto p-1"
                               onClick={() => window.open(message.file_url, '_blank')}
                             >
                               <Download className="h-3 w-3" />
                             </Button>
                           </div>
                         )}
                       </div>
                     )}
                     <p className={`text-xs mt-1 ${
                       message.sender_type === 'customer' 
                         ? 'text-primary-foreground/70' 
                         : 'text-muted-foreground'
                     }`}>
                       {new Date(message.created_at).toLocaleTimeString()}
                     </p>
                   </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Message Input */}
        {!selectedConversation.is_resolved && (
          <Card className="shadow-card">
            <CardContent className="p-4 space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="Type your follow-up question..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !newMessage.trim() ? null : onSendMessage()}
                />
                <Button onClick={() => onSendMessage()} disabled={!newMessage.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <FileUpload
                onFileUploaded={(fileUrl, fileName, fileType, fileSize) => 
                  onSendMessage(fileUrl, fileName, fileType, fileSize)
                }
                disabled={selectedConversation.is_resolved}
              />
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Recent Conversations */}
      <Card className="shadow-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Conversations
            </CardTitle>
            <CardDescription>
              View your past conversations or start a new one
            </CardDescription>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex gap-2 items-center">
              <label htmlFor="show-resolved-customer" className="text-sm font-medium">
                Show Resolved
              </label>
              <Switch
                id="show-resolved-customer"
                checked={showResolvedConversations}
                onCheckedChange={setShowResolvedConversations}
              />
            </div>
            <Button onClick={() => setShowNewConversationDialog(true)}>
              <MessageCircle className="h-4 w-4 mr-2" />
              New Conversation
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {recentChats.length > 0 ? (
            <div className="space-y-3">
              {recentChats.map((chat) => (
                <div 
                  key={chat.id} 
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                  onClick={() => {
                    const conversation = { id: chat.id, title: chat.question };
                    onSelectConversation(conversation);
                  }}
                >
                  <div className="flex items-center gap-3">
                    <MessageCircle className="h-5 w-5 text-muted-foreground" />
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
            <div className="text-center py-8">
              <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">No conversations yet</p>
              <Button onClick={() => setShowNewConversationDialog(true)}>
                Start Your First Conversation
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* New Conversation Dialog */}
      {showNewConversationDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Start New Conversation</CardTitle>
              <CardDescription>
                Choose a frequently asked question or ask your own
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* FAQ Dropdown */}
              <div className="space-y-2">
                <Label>Select a common question (optional)</Label>
                <select 
                  className="w-full p-2 border rounded-md"
                  value={selectedFAQ?.id || ''}
                  onChange={(e) => {
                    const faq = faqQuestions.find(q => q.id === e.target.value);
                    setSelectedFAQ(faq || null);
                    if (faq) setCustomQuestion('');
                  }}
                >
                  <option value="">Choose a question...</option>
                  {faqQuestions.map((faq) => (
                    <option key={faq.id} value={faq.id}>
                      {faq.question}
                    </option>
                  ))}
                </select>
              </div>

              {/* Order Selection */}
              <div className="space-y-2">
                <Label>Related to an order? (optional)</Label>
                <select 
                  className="w-full p-2 border rounded-md"
                  value={selectedOrder?.id || ''}
                  onChange={(e) => {
                    const order = orders.find(o => o.id === e.target.value);
                    setSelectedOrder(order || null);
                  }}
                >
                  <option value="">No specific order</option>
                  {orders.map((order) => (
                    <option key={order.id} value={order.id}>
                      Order {order.order_number}
                    </option>
                  ))}
                </select>
              </div>

              {/* Custom Question */}
              {!selectedFAQ && (
                <div className="space-y-2">
                  <Label>Or ask your own question</Label>
                  <textarea
                    className="w-full p-2 border rounded-md h-20 resize-none"
                    placeholder="Type your question here..."
                    value={customQuestion}
                    onChange={(e) => setCustomQuestion(e.target.value)}
                  />
                </div>
              )}
            </CardContent>
            <div className="p-6 pt-0">
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowNewConversationDialog(false);
                    setSelectedFAQ(null);
                    setSelectedOrder(null);
                    setCustomQuestion('');
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleStartNewConversation}
                  disabled={!selectedFAQ && !customQuestion.trim()}
                  className="flex-1"
                >
                  Start Conversation
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

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