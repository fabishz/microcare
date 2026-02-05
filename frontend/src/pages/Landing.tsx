import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Sparkles, Heart, Brain, TrendingUp, Shield, Smile } from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
            <Sparkles className="h-4 w-4" />
            Your AI-Powered Wellness Companion
          </div>
          
          <h1 className="mb-6 text-5xl font-extrabold tracking-tight text-foreground sm:text-6xl lg:text-7xl">
            Find Peace Through{' '}
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Reflection
            </span>
          </h1>
          
          <p className="mb-10 text-xl text-muted-foreground sm:text-2xl">
            MicroCare helps you understand your emotions, track your mental wellness,
            and grow through guided journaling with AI-powered insights.
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link to="/register">
              <Button size="lg" className="h-12 px-8 text-lg">
                Start Your Journey
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline" className="h-12 px-8 text-lg">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-y border-border bg-muted/30 py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-foreground sm:text-4xl">
              Everything You Need for Mental Wellness
            </h2>
            <p className="text-lg text-muted-foreground">
              Simple, powerful tools designed with care
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <Card className="p-6 transition-all hover:shadow-lg">
              <div className="mb-4 rounded-full bg-primary/10 p-3 w-fit">
                <Brain className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-foreground">AI-Powered Insights</h3>
              <p className="text-muted-foreground">
                Receive thoughtful, personalized insights that help you understand your emotions and patterns.
              </p>
            </Card>

            <Card className="p-6 transition-all hover:shadow-lg">
              <div className="mb-4 rounded-full bg-accent/10 p-3 w-fit">
                <Heart className="h-6 w-6 text-accent" />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-foreground">Safe & Private</h3>
              <p className="text-muted-foreground">
                Your thoughts are yours alone. Write freely in a secure, judgment-free space.
              </p>
            </Card>

            <Card className="p-6 transition-all hover:shadow-lg">
              <div className="mb-4 rounded-full bg-secondary/10 p-3 w-fit">
                <TrendingUp className="h-6 w-6 text-secondary" />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-foreground">Track Progress</h3>
              <p className="text-muted-foreground">
                See your emotional journey over time and celebrate your growth milestones.
              </p>
            </Card>

            <Card className="p-6 transition-all hover:shadow-lg">
              <div className="mb-4 rounded-full bg-primary/10 p-3 w-fit">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-foreground">Daily Prompts</h3>
              <p className="text-muted-foreground">
                Guided journaling prompts help you explore deeper and build a consistent practice.
              </p>
            </Card>

            <Card className="p-6 transition-all hover:shadow-lg">
              <div className="mb-4 rounded-full bg-accent/10 p-3 w-fit">
                <Shield className="h-6 w-6 text-accent" />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-foreground">Mindful Design</h3>
              <p className="text-muted-foreground">
                Calming interface designed to promote focus, reduce stress, and encourage reflection.
              </p>
            </Card>

            <Card className="p-6 transition-all hover:shadow-lg">
              <div className="mb-4 rounded-full bg-secondary/10 p-3 w-fit">
                <Smile className="h-6 w-6 text-secondary" />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-foreground">Feel Better</h3>
              <p className="text-muted-foreground">
                Join thousands who've found clarity, reduced anxiety, and improved their mental health.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="overflow-hidden bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10">
            <div className="p-12 text-center">
              <h2 className="mb-4 text-3xl font-bold text-foreground sm:text-4xl">
                Ready to Start Your Wellness Journey?
              </h2>
              <p className="mb-8 text-lg text-muted-foreground">
                Take the first step towards better mental health today.
              </p>
              <Link to="/register">
                <Button size="lg" className="h-12 px-8 text-lg">
                  Create Free Account
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
}
