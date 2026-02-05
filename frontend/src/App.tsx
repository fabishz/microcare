import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";

import Landing from "./pages/Landing";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import NewEntry from "./pages/NewEntry";
import Entries from "./pages/Entries";
import EntryDetail from "./pages/EntryDetail";
import Profile from "./pages/Profile";
import About from "./pages/About";
import Contact from "./pages/Contact";
import PrivacyTerms from "./pages/PrivacyTerms";
import FAQ from "./pages/FAQ";
import Sitemap from "./pages/Sitemap";
import NotFound from "./pages/NotFound";
import { OnboardingManager } from "./components/OnboardingManager";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <OnboardingManager />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/register" element={<Register />} />
              <Route path="/login" element={<Login />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/privacy-terms" element={<PrivacyTerms />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/sitemap" element={<Sitemap />} />

              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/new-entry"
                element={
                  <ProtectedRoute>
                    <NewEntry />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/entries"
                element={
                  <ProtectedRoute>
                    <Entries />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/entry/:id"
                element={
                  <ProtectedRoute>
                    <EntryDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />

              {/* Catch-all route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
