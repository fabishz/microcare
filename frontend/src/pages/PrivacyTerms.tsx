import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function PrivacyTerms() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12 animate-fade-in">
            <h1 className="text-4xl font-bold text-foreground mb-4">Privacy & Terms</h1>
            <p className="text-xl text-muted-foreground">
              Your privacy and trust matter to us
            </p>
          </div>

          <Tabs defaultValue="privacy" className="animate-fade-in">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="privacy">Privacy Policy</TabsTrigger>
              <TabsTrigger value="terms">Terms of Service</TabsTrigger>
            </TabsList>

            <TabsContent value="privacy" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Privacy Policy</CardTitle>
                  <p className="text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
                </CardHeader>
                <CardContent className="space-y-6 text-muted-foreground">
                  <section>
                    <h3 className="text-lg font-semibold text-foreground mb-3">1. Information We Collect</h3>
                    <p className="mb-2">
                      At MicroCare, we collect minimal information necessary to provide our services:
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Account information (name, email address)</li>
                      <li>Journal entries and reflections you create</li>
                      <li>Usage data (login times, features used)</li>
                      <li>Device and browser information</li>
                    </ul>
                  </section>

                  <section>
                    <h3 className="text-lg font-semibold text-foreground mb-3">2. How We Use Your Information</h3>
                    <p className="mb-2">Your information is used to:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Provide and improve our mental wellness services</li>
                      <li>Generate AI-powered insights from your journal entries</li>
                      <li>Send important account and service updates</li>
                      <li>Maintain security and prevent fraud</li>
                    </ul>
                  </section>

                  <section>
                    <h3 className="text-lg font-semibold text-foreground mb-3">3. Your Privacy Rights</h3>
                    <p className="mb-2">You have complete control over your data:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Access, download, or delete your data at any time</li>
                      <li>Opt out of communications</li>
                      <li>Request data portability</li>
                      <li>Close your account permanently</li>
                    </ul>
                  </section>

                  <section>
                    <h3 className="text-lg font-semibold text-foreground mb-3">4. Data Security</h3>
                    <p>
                      We implement industry-standard security measures including encryption, secure servers, 
                      and regular security audits. Your journal entries are encrypted both in transit and at rest.
                    </p>
                  </section>

                  <section>
                    <h3 className="text-lg font-semibold text-foreground mb-3">5. Data Sharing</h3>
                    <p className="mb-2">
                      We do NOT sell your personal information. We only share data when:
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Required by law or legal process</li>
                      <li>Necessary to provide our services (e.g., AI processing)</li>
                      <li>You explicitly consent to sharing</li>
                    </ul>
                  </section>

                  <section>
                    <h3 className="text-lg font-semibold text-foreground mb-3">6. Cookies and Tracking</h3>
                    <p>
                      We use essential cookies for authentication and preferences. Analytics cookies help us 
                      improve the service but can be disabled in your browser settings.
                    </p>
                  </section>

                  <section>
                    <h3 className="text-lg font-semibold text-foreground mb-3">7. Children's Privacy</h3>
                    <p>
                      MicroCare is not intended for users under 13 years of age. We do not knowingly collect 
                      information from children.
                    </p>
                  </section>

                  <section>
                    <h3 className="text-lg font-semibold text-foreground mb-3">8. Changes to This Policy</h3>
                    <p>
                      We may update this policy periodically. We'll notify you of significant changes via 
                      email or in-app notification.
                    </p>
                  </section>

                  <div className="pt-6 border-t border-border">
                    <p className="text-sm">
                      Questions about our privacy practices? Contact us at privacy@microcare.app
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="terms" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Terms of Service</CardTitle>
                  <p className="text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
                </CardHeader>
                <CardContent className="space-y-6 text-muted-foreground">
                  <section>
                    <h3 className="text-lg font-semibold text-foreground mb-3">1. Acceptance of Terms</h3>
                    <p>
                      By accessing or using MicroCare, you agree to be bound by these Terms of Service. 
                      If you do not agree, please do not use our service.
                    </p>
                  </section>

                  <section>
                    <h3 className="text-lg font-semibold text-foreground mb-3">2. Description of Service</h3>
                    <p>
                      MicroCare provides a digital platform for journaling and mental wellness tracking with 
                      AI-powered insights. Our service is designed to support, not replace, professional 
                      mental health care.
                    </p>
                  </section>

                  <section>
                    <h3 className="text-lg font-semibold text-foreground mb-3">3. User Responsibilities</h3>
                    <p className="mb-2">You agree to:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Provide accurate registration information</li>
                      <li>Maintain the security of your account credentials</li>
                      <li>Use the service lawfully and respectfully</li>
                      <li>Not share explicit, harmful, or illegal content</li>
                      <li>Seek professional help for mental health crises</li>
                    </ul>
                  </section>

                  <section>
                    <h3 className="text-lg font-semibold text-foreground mb-3">4. Not Medical Advice</h3>
                    <p>
                      MicroCare is NOT a substitute for professional medical advice, diagnosis, or treatment. 
                      Always consult qualified healthcare providers for mental health concerns. In case of 
                      emergency, contact your local emergency services.
                    </p>
                  </section>

                  <section>
                    <h3 className="text-lg font-semibold text-foreground mb-3">5. Intellectual Property</h3>
                    <p>
                      You retain ownership of your journal entries. By using MicroCare, you grant us a license 
                      to process your content to provide AI insights and improve our services. We do not claim 
                      ownership of your personal writings.
                    </p>
                  </section>

                  <section>
                    <h3 className="text-lg font-semibold text-foreground mb-3">6. Account Termination</h3>
                    <p className="mb-2">
                      We reserve the right to suspend or terminate accounts that:
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Violate these terms</li>
                      <li>Engage in harmful or abusive behavior</li>
                      <li>Compromise service security</li>
                    </ul>
                    <p className="mt-2">You may delete your account at any time from your profile settings.</p>
                  </section>

                  <section>
                    <h3 className="text-lg font-semibold text-foreground mb-3">7. Limitation of Liability</h3>
                    <p>
                      MicroCare is provided "as is" without warranties. We are not liable for any indirect, 
                      incidental, or consequential damages arising from your use of the service.
                    </p>
                  </section>

                  <section>
                    <h3 className="text-lg font-semibold text-foreground mb-3">8. Changes to Terms</h3>
                    <p>
                      We may modify these terms at any time. Continued use of MicroCare after changes 
                      constitutes acceptance of the updated terms.
                    </p>
                  </section>

                  <section>
                    <h3 className="text-lg font-semibold text-foreground mb-3">9. Contact</h3>
                    <p>
                      For questions about these terms, contact us at legal@microcare.app
                    </p>
                  </section>

                  <div className="pt-6 border-t border-border">
                    <p className="text-sm">
                      By using MicroCare, you acknowledge that you have read, understood, and agree to 
                      these Terms of Service.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
}
