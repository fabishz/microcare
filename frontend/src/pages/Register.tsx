import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Navbar } from '@/components/Navbar';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { register } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Password validation helpers
  const passwordRequirements = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  const allRequirementsMet = Object.values(passwordRequirements).every(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await register(name, email, password);
      toast({
        title: 'Welcome to MicroCare! 🎉',
        description: 'Your account has been created successfully.',
      });
      navigate('/dashboard');
    } catch (error: any) {
      let errorMessage = 'Please try again.';

      // Parse API error responses
      if (error?.response?.data?.error) {
        const apiError = error.response.data.error;

        // Handle validation errors with details
        if (apiError.details) {
          const details = Object.values(apiError.details).filter(Boolean);
          errorMessage = details.join(', ');
        } else {
          errorMessage = apiError.message || errorMessage;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      setError(errorMessage);
      toast({
        title: 'Registration failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md p-8 shadow-lg">
          <div className="mb-6 text-center">
            <div className="mb-4 inline-flex items-center gap-2 text-primary">
              <Sparkles className="h-8 w-8" />
            </div>
            <h1 className="mb-2 text-3xl font-bold text-foreground">Create Account</h1>
            <p className="text-muted-foreground">Start your wellness journey today</p>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a secure password"
                required
                minLength={8}
                className="mt-1"
              />

              {password && (
                <div className="mt-2 space-y-1 text-xs">
                  <p className="font-medium text-muted-foreground">Password must contain:</p>
                  <div className="grid grid-cols-2 gap-1">
                    <div className={`flex items-center gap-1 ${passwordRequirements.length ? 'text-green-600' : 'text-muted-foreground'}`}>
                      {passwordRequirements.length ? <CheckCircle2 className="h-3 w-3" /> : <span className="h-3 w-3">○</span>}
                      <span>8+ characters</span>
                    </div>
                    <div className={`flex items-center gap-1 ${passwordRequirements.uppercase ? 'text-green-600' : 'text-muted-foreground'}`}>
                      {passwordRequirements.uppercase ? <CheckCircle2 className="h-3 w-3" /> : <span className="h-3 w-3">○</span>}
                      <span>Uppercase</span>
                    </div>
                    <div className={`flex items-center gap-1 ${passwordRequirements.lowercase ? 'text-green-600' : 'text-muted-foreground'}`}>
                      {passwordRequirements.lowercase ? <CheckCircle2 className="h-3 w-3" /> : <span className="h-3 w-3">○</span>}
                      <span>Lowercase</span>
                    </div>
                    <div className={`flex items-center gap-1 ${passwordRequirements.number ? 'text-green-600' : 'text-muted-foreground'}`}>
                      {passwordRequirements.number ? <CheckCircle2 className="h-3 w-3" /> : <span className="h-3 w-3">○</span>}
                      <span>Number</span>
                    </div>
                    <div className={`flex items-center gap-1 ${passwordRequirements.special ? 'text-green-600' : 'text-muted-foreground'}`}>
                      {passwordRequirements.special ? <CheckCircle2 className="h-3 w-3" /> : <span className="h-3 w-3">○</span>}
                      <span>Special char</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !allRequirementsMet}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <LoadingSpinner size="sm" />
                  Creating account...
                </div>
              ) : (
                'Create Account'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
