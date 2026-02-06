import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { HelpCircle, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function FAQ() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12 animate-fade-in">
            <HelpCircle className="h-16 w-16 text-primary mx-auto mb-4" />
            <h1 className="text-4xl font-bold text-foreground mb-4">Frequently Asked Questions</h1>
            <p className="text-xl text-muted-foreground">
              Find answers to common questions about MicroCare
            </p>
          </div>

          <div className="animate-fade-in mb-8">
            <Accordion type="single" collapsible className="space-y-4">
              <Card>
                <AccordionItem value="item-1" className="border-none">
                  <AccordionTrigger className="px-6 py-4 hover:no-underline">
                    <span className="text-left font-semibold">What is MicroCare?</span>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-4 text-muted-foreground">
                    MicroCare is a mental wellness platform that combines journaling with AI-powered insights. 
                    It helps you reflect on your thoughts and emotions, track your mental health journey, and 
                    gain personalized insights to support your well-being.
                  </AccordionContent>
                </AccordionItem>
              </Card>

              <Card>
                <AccordionItem value="item-2" className="border-none">
                  <AccordionTrigger className="px-6 py-4 hover:no-underline">
                    <span className="text-left font-semibold">Is my data private and secure?</span>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-4 text-muted-foreground">
                    Absolutely. Your privacy is our top priority. All journal entries are encrypted both in 
                    transit and at rest. We never share, sell, or access your personal writings without your 
                    explicit consent. You have complete control over your data and can delete it at any time.
                  </AccordionContent>
                </AccordionItem>
              </Card>

              <Card>
                <AccordionItem value="item-3" className="border-none">
                  <AccordionTrigger className="px-6 py-4 hover:no-underline">
                    <span className="text-left font-semibold">How do the AI insights work?</span>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-4 text-muted-foreground">
                    Our AI analyzes patterns in your journal entries to provide personalized insights about 
                    your emotional trends, recurring themes, and potential areas for growth. The insights are 
                    designed to be supportive and non-judgmental, helping you better understand yourself.
                  </AccordionContent>
                </AccordionItem>
              </Card>

              <Card>
                <AccordionItem value="item-4" className="border-none">
                  <AccordionTrigger className="px-6 py-4 hover:no-underline">
                    <span className="text-left font-semibold">Can MicroCare replace therapy?</span>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-4 text-muted-foreground">
                    No. MicroCare is a wellness tool that complements professional mental health care but does 
                    not replace it. If you're experiencing a mental health crisis or need clinical support, 
                    please consult with a licensed mental health professional or contact emergency services.
                  </AccordionContent>
                </AccordionItem>
              </Card>

              <Card>
                <AccordionItem value="item-5" className="border-none">
                  <AccordionTrigger className="px-6 py-4 hover:no-underline">
                    <span className="text-left font-semibold">How often should I journal?</span>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-4 text-muted-foreground">
                    There's no right or wrong frequency! Some users journal daily, while others write weekly 
                    or whenever they need to process their thoughts. We recommend starting with whatever feels 
                    comfortable and building a habit that works for your lifestyle.
                  </AccordionContent>
                </AccordionItem>
              </Card>

              <Card>
                <AccordionItem value="item-6" className="border-none">
                  <AccordionTrigger className="px-6 py-4 hover:no-underline">
                    <span className="text-left font-semibold">Is MicroCare free to use?</span>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-4 text-muted-foreground">
                    We offer both free and premium plans. The free plan includes basic journaling and limited 
                    AI insights. Premium plans provide unlimited insights, advanced analytics, and additional 
                    features to support your wellness journey.
                  </AccordionContent>
                </AccordionItem>
              </Card>

              <Card>
                <AccordionItem value="item-7" className="border-none">
                  <AccordionTrigger className="px-6 py-4 hover:no-underline">
                    <span className="text-left font-semibold">Can I access my journals on multiple devices?</span>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-4 text-muted-foreground">
                    Yes! Your account and all journal entries are synced across all your devices. You can write 
                    on your phone, tablet, or computer and access your entries anywhere.
                  </AccordionContent>
                </AccordionItem>
              </Card>

              <Card>
                <AccordionItem value="item-8" className="border-none">
                  <AccordionTrigger className="px-6 py-4 hover:no-underline">
                    <span className="text-left font-semibold">How do I delete my account?</span>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-4 text-muted-foreground">
                    You can delete your account at any time from your Profile settings. This will permanently 
                    remove all your data, including journal entries and insights. This action cannot be undone, 
                    so please make sure to download any entries you want to keep before deleting your account.
                  </AccordionContent>
                </AccordionItem>
              </Card>

              <Card>
                <AccordionItem value="item-9" className="border-none">
                  <AccordionTrigger className="px-6 py-4 hover:no-underline">
                    <span className="text-left font-semibold">What if I'm in crisis?</span>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-4 text-muted-foreground">
                    If you're experiencing a mental health emergency, please contact emergency services 
                    immediately or reach out to a crisis helpline. In the US, you can call 988 for the Suicide 
                    & Crisis Lifeline, available 24/7. MicroCare is not equipped to handle crisis situations.
                  </AccordionContent>
                </AccordionItem>
              </Card>

              <Card>
                <AccordionItem value="item-10" className="border-none">
                  <AccordionTrigger className="px-6 py-4 hover:no-underline">
                    <span className="text-left font-semibold">Can I export my journal entries?</span>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-4 text-muted-foreground">
                    Yes! You can export all your journal entries in various formats (PDF, JSON, TXT) from your 
                    Profile settings. This allows you to keep a backup or use your writings elsewhere.
                  </AccordionContent>
                </AccordionItem>
              </Card>
            </Accordion>
          </div>

          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle>Still have questions?</CardTitle>
              <CardDescription>
                We're here to help. Reach out to our support team.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/contact">
                <Button className="w-full">
                  <Mail className="h-4 w-4 mr-2" />
                  Contact Support
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
