import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  X
} from "lucide-react";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState<'questions' | 'queries'>('questions');
  const [editingQuestion, setEditingQuestion] = useState<string | null>(null);
  const [newQuestion, setNewQuestion] = useState({ question: '', answer: '' });
  const [questions, setQuestions] = useState<any[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Fetch data from Supabase
  useEffect(() => {
    fetchQuestions();
    fetchConversations();
  }, []);

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
      const { data, error } = await supabase
        .from('support_conversations')
        .select(`
          *,
          profiles!inner(mobile_number, full_name)
        `)
        .eq('is_resolved', false)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching conversations:', error);
      } else {
        setConversations(data || []);
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

  const handleResolveConversation = async (conversationId: string) => {
    try {
      const { error } = await supabase
        .from('support_conversations')
        .update({ 
          is_resolved: true, 
          status: 'resolved' 
        })
        .eq('id', conversationId);

      if (error) {
        throw error;
      }

      await fetchConversations();
      
      toast({
        title: "Success",
        description: "Conversation marked as resolved"
      });
    } catch (error) {
      console.error('Error resolving conversation:', error);
      toast({
        title: "Error",
        description: "Failed to resolve conversation",
        variant: "destructive"
      });
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
            <Badge variant="secondary">
              EcoRide Support Admin
            </Badge>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="border-b bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="flex">
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
        ) : (
          <QueriesManagement 
            conversations={conversations} 
            onResolveConversation={handleResolveConversation}
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

const QueriesManagement = ({ conversations, onResolveConversation }: { conversations: any[], onResolveConversation: (id: string) => void }) => (
  <div className="space-y-6">
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Pending Customer Queries
        </CardTitle>
        <CardDescription>
          Review and respond to customer questions that need human attention
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {conversations.length > 0 ? conversations.map((conversation) => (
            <div key={conversation.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Customer: {conversation.profiles?.mobile_number || 'Unknown'}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(conversation.created_at).toLocaleDateString()} at {new Date(conversation.created_at).toLocaleTimeString()}
                  </p>
                </div>
                <Badge variant="secondary">{conversation.status}</Badge>
              </div>
              
              <div className="bg-muted/50 p-3 rounded-lg">
                <h4 className="font-medium mb-1">{conversation.title}</h4>
                {conversation.last_message && (
                  <p className="text-sm">{conversation.last_message}</p>
                )}
              </div>

              <div className="flex gap-2">
                <Button variant="electric" size="sm">
                  View Conversation
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onResolveConversation(conversation.id)}
                >
                  Mark Resolved
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

export default AdminDashboard;