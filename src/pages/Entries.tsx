import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { JournalEntryCard } from '@/components/JournalEntryCard';
import { EmptyState } from '@/components/EmptyState';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Input } from '@/components/ui/input';
import { BookOpen, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface JournalEntry {
  id: string;
  content: string;
  insight?: string;
  createdAt: string;
}

export default function Entries() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<JournalEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchEntries();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = entries.filter((entry) =>
        entry.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredEntries(filtered);
    } else {
      setFilteredEntries(entries);
    }
  }, [searchQuery, entries]);

  const fetchEntries = async () => {
    try {
      const response = await fetch('/api/entries/list', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('jwt')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch entries');

      const data = await response.json();
      setEntries(data);
      setFilteredEntries(data);
    } catch (error) {
      toast({
        title: 'Failed to load entries',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="mb-2 text-4xl font-bold text-foreground">Your Journal</h1>
          <p className="text-lg text-muted-foreground">
            {entries.length} {entries.length === 1 ? 'entry' : 'entries'} in your collection
          </p>
        </div>

        {entries.length > 0 && (
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search your entries..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        )}

        {filteredEntries.length === 0 ? (
          entries.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="No entries yet"
              description="Start your wellness journey by writing your first journal entry."
              actionLabel="Write Your First Entry"
              onAction={() => navigate('/dashboard/new-entry')}
            />
          ) : (
            <EmptyState
              icon={Search}
              title="No matching entries"
              description="Try adjusting your search query."
            />
          )
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredEntries.map((entry) => (
              <JournalEntryCard
                key={entry.id}
                entry={entry}
                onClick={() => navigate(`/dashboard/entry/${entry.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
