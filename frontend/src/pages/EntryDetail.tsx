import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { InsightCard } from '@/components/journal/InsightCard';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Calendar, Trash2, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useEntries, JournalEntry } from '@/hooks/useEntries';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function EntryDetail() {
  const { id } = useParams<{ id: string }>();
  const [entry, setEntry] = useState<JournalEntry | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { getEntry, deleteEntry, isLoading, error } = useEntries();

  useEffect(() => {
    if (!id) return;

    const loadEntry = async () => {
      try {
        const fetchedEntry = await getEntry(id);
        setEntry(fetchedEntry);
      } catch (err) {
        toast({
          title: 'Failed to load entry',
          description: 'The entry could not be found.',
          variant: 'destructive',
        });
      }
    };

    loadEntry();
  }, [id, getEntry, toast]);

  const handleDelete = async () => {
    if (!id) return;

    setIsDeleting(true);
    try {
      await deleteEntry(id);

      toast({
        title: 'Entry deleted',
        description: 'Your journal entry has been removed.',
      });
      
      navigate('/dashboard/entries');
    } catch (err) {
      toast({
        title: 'Failed to delete entry',
        description: error || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <p className="text-center text-muted-foreground">Entry not found</p>
        </div>
      </div>
    );
  }

  const date = new Date(entry.createdAt);
  const formattedDate = date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/dashboard/entries')}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Entries
        </Button>

        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-5 w-5" />
            <span>{formattedDate}</span>
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete this journal entry. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isDeleting ? 'Deleting...' : 'Delete Entry'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <div className="space-y-6">
          <Card className="p-8">
            <p className="whitespace-pre-wrap text-lg leading-relaxed text-foreground">
              {entry.content}
            </p>
          </Card>

          {entry.insight && <InsightCard insight={entry.insight} />}
        </div>
      </div>
    </div>
  );
}
