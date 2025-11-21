import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { InsightCard } from '@/components/InsightCard';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Sparkles, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function NewEntry() {
  const [content, setContent] = useState('');
  const [insight, setInsight] = useState('');
  const [isGeneratingInsight, setIsGeneratingInsight] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const generateInsight = async () => {
    if (!content.trim()) {
      toast({
        title: 'Write something first',
        description: 'Please write in your journal before generating an insight.',
        variant: 'destructive',
      });
      return;
    }

    setIsGeneratingInsight(true);
    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('jwt')}`,
        },
        body: JSON.stringify({ prompt: content }),
      });

      if (!response.ok) throw new Error('Failed to generate insight');

      const data = await response.json();
      setInsight(data.insight);
      
      toast({
        title: 'Insight generated! ✨',
        description: 'Here\'s what I noticed in your reflection.',
      });
    } catch (error) {
      toast({
        title: 'Failed to generate insight',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingInsight(false);
    }
  };

  const saveEntry = async () => {
    if (!content.trim()) {
      toast({
        title: 'Entry is empty',
        description: 'Please write something before saving.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('/api/entries/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('jwt')}`,
        },
        body: JSON.stringify({ content, insight }),
      });

      if (!response.ok) throw new Error('Failed to save entry');

      toast({
        title: 'Entry saved! 📝',
        description: 'Your reflection has been saved successfully.',
      });
      
      navigate('/dashboard/entries');
    } catch (error) {
      toast({
        title: 'Failed to save entry',
        description: 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="mb-2 text-4xl font-bold text-foreground">New Journal Entry</h1>
          <p className="text-lg text-muted-foreground">
            Take your time. Write freely. Your thoughts are safe here.
          </p>
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="How are you feeling? What's on your mind today?"
              className="min-h-[300px] resize-none border-0 text-base focus-visible:ring-0"
              autoFocus
            />
          </Card>

          {insight && <InsightCard insight={insight} />}

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              onClick={generateInsight}
              disabled={isGeneratingInsight || !content.trim()}
              variant="outline"
              className="flex-1"
            >
              {isGeneratingInsight ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span className="ml-2">Generating insight...</span>
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Insight
                </>
              )}
            </Button>

            <Button
              onClick={saveEntry}
              disabled={isSaving || !content.trim()}
              className="flex-1"
            >
              {isSaving ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span className="ml-2">Saving...</span>
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Entry
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
