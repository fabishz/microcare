import { Calendar, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface JournalEntry {
  id: string;
  content: string;
  insight?: string;
  createdAt: string;
}

interface JournalEntryCardProps {
  entry: JournalEntry;
  onClick: () => void;
}

export function JournalEntryCard({ entry, onClick }: JournalEntryCardProps) {
  const date = new Date(entry.createdAt);
  const formattedDate = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <Card className="group cursor-pointer overflow-hidden transition-all hover:shadow-md" onClick={onClick}>
      <div className="p-6">
        <div className="mb-3 flex items-start justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{formattedDate}</span>
          </div>
          {entry.insight && (
            <div className="rounded-full bg-accent/10 p-1">
              <Sparkles className="h-3 w-3 text-accent" />
            </div>
          )}
        </div>
        
        <p className="mb-4 line-clamp-3 text-foreground">{entry.content}</p>
        
        <Button variant="ghost" size="sm" className="group-hover:text-primary">
          Read more →
        </Button>
      </div>
    </Card>
  );
}
