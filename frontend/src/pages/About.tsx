import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, Target, Users, Sparkles } from 'lucide-react';

export default function About() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12 animate-fade-in">
            <h1 className="text-4xl font-bold text-foreground mb-4">About MicroCare</h1>
            <p className="text-xl text-muted-foreground">
              Your personal companion for mental wellness and self-reflection
            </p>
          </div>

          <div className="grid gap-8 mb-12 animate-fade-in">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-6 w-6 text-primary" />
                  Our Mission
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  MicroCare was created to make mental wellness accessible, private, and meaningful. 
                  We believe that taking small moments each day to reflect on your thoughts and feelings 
                  can lead to profound personal growth. Our AI-powered insights help you understand patterns 
                  in your emotional journey, providing gentle guidance without judgment.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-6 w-6 text-primary" />
                  What We Do
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  MicroCare combines the therapeutic practice of journaling with thoughtful AI analysis 
                  to help you:
                </p>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Process your thoughts and emotions in a safe, private space</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Gain insights into your mental and emotional patterns</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Track your wellness journey over time</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Develop healthier coping strategies and self-awareness</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-6 w-6 text-primary" />
                  Our Approach
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  We believe mental wellness is not about perfection—it's about progress. MicroCare 
                  uses compassionate AI technology to provide personalized insights while maintaining 
                  complete privacy. Your journal entries are yours alone, and our platform is designed 
                  to support your unique journey without imposing rigid frameworks or one-size-fits-all 
                  solutions.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-6 w-6 text-primary" />
                  Our Values
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 gap-4 text-muted-foreground">
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">Privacy First</h4>
                    <p className="text-sm">Your thoughts are personal. We never share your data.</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">Non-Judgmental</h4>
                    <p className="text-sm">Every feeling is valid. We provide support, not criticism.</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">Accessible</h4>
                    <p className="text-sm">Mental wellness tools should be available to everyone.</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">Evidence-Based</h4>
                    <p className="text-sm">Our approach is grounded in therapeutic principles.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="text-center p-8 bg-muted rounded-xl animate-fade-in">
            <p className="text-muted-foreground mb-4">
              MicroCare is not a replacement for professional mental health care. If you're experiencing 
              a crisis, please reach out to a mental health professional or crisis helpline.
            </p>
            <p className="text-sm text-muted-foreground">
              We're here to support your daily wellness journey, one reflection at a time.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
