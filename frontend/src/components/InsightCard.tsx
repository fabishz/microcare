import { Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface InsightCardProps {
  insight: string;
  className?: string;
}

export function InsightCard({ insight, className = '' }: InsightCardProps) {
  return (
    <Card className={`animate-fade-in border-accent/20 bg-gradient-to-br from-accent/5 to-transparent p-6 ${className}`}>
      <div className="mb-3 flex items-center gap-2">
        <div className="rounded-full bg-accent/10 p-2">
          <Sparkles className="h-4 w-4 text-accent" />
        </div>
        <h3 className="font-semibold text-foreground">AI Insight</h3>
      </div>
      <p className="leading-relaxed text-muted-foreground">{insight}</p>
    </Card>
  );
}
