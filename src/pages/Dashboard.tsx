import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Navbar } from '@/components/Navbar';
import { PenLine, BookOpen, Sparkles, TrendingUp } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="mb-2 text-4xl font-bold text-foreground">
            Welcome back, {user?.name} 👋
          </h1>
          <p className="text-lg text-muted-foreground">
            How are you feeling today?
          </p>
        </div>

        {/* Quick Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-primary/10 p-3">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">0</p>
                <p className="text-sm text-muted-foreground">Total Entries</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-accent/10 p-3">
                <TrendingUp className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">0</p>
                <p className="text-sm text-muted-foreground">Day Streak</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-secondary/10 p-3">
                <Sparkles className="h-5 w-5 text-secondary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">0</p>
                <p className="text-sm text-muted-foreground">AI Insights</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-primary/10 p-3">
                <PenLine className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">New</p>
                <p className="text-sm text-muted-foreground">This Week</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="overflow-hidden">
            <div className="bg-gradient-to-br from-primary/10 to-secondary/5 p-8">
              <div className="mb-4 inline-flex rounded-full bg-primary/10 p-3">
                <PenLine className="h-6 w-6 text-primary" />
              </div>
              <h2 className="mb-2 text-2xl font-bold text-foreground">Write a New Entry</h2>
              <p className="mb-6 text-muted-foreground">
                Take a moment to reflect on your thoughts and feelings.
              </p>
              <Link to="/dashboard/new-entry">
                <Button size="lg">Start Writing</Button>
              </Link>
            </div>
          </Card>

          <Card className="overflow-hidden">
            <div className="bg-gradient-to-br from-accent/10 to-primary/5 p-8">
              <div className="mb-4 inline-flex rounded-full bg-accent/10 p-3">
                <BookOpen className="h-6 w-6 text-accent" />
              </div>
              <h2 className="mb-2 text-2xl font-bold text-foreground">View Your Entries</h2>
              <p className="mb-6 text-muted-foreground">
                Revisit your past reflections and see your progress.
              </p>
              <Link to="/dashboard/entries">
                <Button size="lg" variant="outline">
                  Browse Entries
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
