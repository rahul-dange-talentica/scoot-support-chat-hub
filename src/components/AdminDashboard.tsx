import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  const [editingQuestion, setEditingQuestion] = useState<number | null>(null);
  const [newQuestion, setNewQuestion] = useState({ question: '', answer: '', category: '' });

  // Mock data - will be replaced with Supabase data
  const [questions, setQuestions] = useState([
    {
      id: 1,
      question: "How do I charge my electric scooter?",
      answer: "Connect the charger to your scooter's charging port and plug it into a wall outlet. The LED indicator will show charging status.",
      category: "Charging",
      active: true
    },
    {
      id: 2,
      question: "What's the maximum speed?",
      answer: "Our scooters can reach up to 25 mph (40 km/h) depending on the model and local regulations.",
      category: "Performance",
      active: true
    },
    {
      id: 3,
      question: "How do I reset my scooter?",
      answer: "Press and hold the power button for 10 seconds while the scooter is off. The display will flash to confirm reset.",
      category: "Troubleshooting",
      active: true
    }
  ]);

  const pendingQueries = [
    {
      id: 1,
      customerPhone: "+1 (555) 123-4567",
      query: "My scooter makes a strange noise when braking",
      timestamp: "2024-01-20 14:30",
      status: "pending"
    },
    {
      id: 2,
      customerPhone: "+1 (555) 987-6543",
      query: "Battery drains faster than expected",
      timestamp: "2024-01-20 11:15",
      status: "pending"
    }
  ];

  const handleAddQuestion = () => {
    if (newQuestion.question && newQuestion.answer) {
      setQuestions([...questions, {
        id: Date.now(),
        ...newQuestion,
        active: true
      }]);
      setNewQuestion({ question: '', answer: '', category: '' });
    }
  };

  const handleDeleteQuestion = (id: number) => {
    setQuestions(questions.filter(q => q.id !== id));
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
            setQuestions={setQuestions}
            newQuestion={newQuestion}
            setNewQuestion={setNewQuestion}
            editingQuestion={editingQuestion}
            setEditingQuestion={setEditingQuestion}
            handleAddQuestion={handleAddQuestion}
            handleDeleteQuestion={handleDeleteQuestion}
          />
        ) : (
          <QueriesManagement queries={pendingQueries} />
        )}
      </main>
    </div>
  );
};

const QuestionsManagement = ({ 
  questions, 
  setQuestions, 
  newQuestion, 
  setNewQuestion, 
  editingQuestion, 
  setEditingQuestion,
  handleAddQuestion,
  handleDeleteQuestion 
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            placeholder="Category (e.g., Charging, Performance)"
            value={newQuestion.category}
            onChange={(e) => setNewQuestion({...newQuestion, category: e.target.value})}
          />
          <div></div>
        </div>
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
                    <Badge variant="outline">{q.category}</Badge>
                    <Badge variant={q.active ? 'default' : 'secondary'}>
                      {q.active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  {editingQuestion === q.id ? (
                    <EditQuestionForm 
                      question={q} 
                      onSave={(updated: any) => {
                        setQuestions(questions.map((qu: any) => qu.id === q.id ? updated : qu));
                        setEditingQuestion(null);
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
        value={editData.category}
        onChange={(e) => setEditData({...editData, category: e.target.value})}
        placeholder="Category"
      />
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

const QueriesManagement = ({ queries }: { queries: any[] }) => (
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
          {queries.map((query) => (
            <div key={query.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Customer: {query.customerPhone}</p>
                  <p className="text-sm text-muted-foreground">{query.timestamp}</p>
                </div>
                <Badge variant="secondary">{query.status}</Badge>
              </div>
              
              <div className="bg-muted/50 p-3 rounded-lg">
                <p className="text-sm">{query.query}</p>
              </div>

              <div className="flex gap-2">
                <Button variant="electric" size="sm">
                  Respond
                </Button>
                <Button variant="outline" size="sm">
                  Mark Resolved
                </Button>
                <Button variant="ghost" size="sm">
                  Escalate
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  </div>
);

export default AdminDashboard;