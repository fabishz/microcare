import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { Home, User, FileText, Info, Mail, Shield, HelpCircle, Map } from 'lucide-react';

export default function Sitemap() {
  const publicPages = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'About Us', path: '/about', icon: Info },
    { name: 'Contact', path: '/contact', icon: Mail },
    { name: 'Privacy & Terms', path: '/privacy-terms', icon: Shield },
    { name: 'FAQ / Help', path: '/faq', icon: HelpCircle },
  ];

  const authPages = [
    { name: 'Login', path: '/login', icon: User },
    { name: 'Register', path: '/register', icon: User },
  ];

  const dashboardPages = [
    { name: 'Dashboard', path: '/dashboard', icon: Home },
    { name: 'New Entry', path: '/dashboard/new-entry', icon: FileText },
    { name: 'All Entries', path: '/dashboard/entries', icon: FileText },
    { name: 'Profile', path: '/dashboard/profile', icon: User },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12 animate-fade-in">
            <Map className="h-16 w-16 text-primary mx-auto mb-4" />
            <h1 className="text-4xl font-bold text-foreground mb-4">Sitemap</h1>
            <p className="text-xl text-muted-foreground">
              Navigate through all pages on MicroCare
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card className="animate-fade-in">
              <CardHeader>
                <CardTitle>Public Pages</CardTitle>
              </CardHeader>
              <CardContent>
                <nav className="space-y-2">
                  {publicPages.map((page) => {
                    const Icon = page.icon;
                    return (
                      <Link
                        key={page.path}
                        to={page.path}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors group"
                      >
                        <Icon className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
                        <span className="text-foreground group-hover:text-primary transition-colors">
                          {page.name}
                        </span>
                      </Link>
                    );
                  })}
                </nav>
              </CardContent>
            </Card>

            <Card className="animate-fade-in">
              <CardHeader>
                <CardTitle>Authentication</CardTitle>
              </CardHeader>
              <CardContent>
                <nav className="space-y-2">
                  {authPages.map((page) => {
                    const Icon = page.icon;
                    return (
                      <Link
                        key={page.path}
                        to={page.path}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors group"
                      >
                        <Icon className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
                        <span className="text-foreground group-hover:text-primary transition-colors">
                          {page.name}
                        </span>
                      </Link>
                    );
                  })}
                </nav>
              </CardContent>
            </Card>

            <Card className="animate-fade-in md:col-span-2">
              <CardHeader>
                <CardTitle>Dashboard Pages</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Requires authentication to access
                </p>
              </CardHeader>
              <CardContent>
                <nav className="grid sm:grid-cols-2 gap-2">
                  {dashboardPages.map((page) => {
                    const Icon = page.icon;
                    return (
                      <Link
                        key={page.path}
                        to={page.path}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors group"
                      >
                        <Icon className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
                        <span className="text-foreground group-hover:text-primary transition-colors">
                          {page.name}
                        </span>
                      </Link>
                    );
                  })}
                </nav>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8 p-6 bg-muted rounded-xl animate-fade-in">
            <p className="text-sm text-muted-foreground text-center">
              Can't find what you're looking for? <Link to="/contact" className="text-primary hover:underline">Contact us</Link> for assistance.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
