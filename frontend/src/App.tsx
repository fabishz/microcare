import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, UserRole } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { HelmetProvider } from "react-helmet-async";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { RoleRoute } from "@/components/auth/RoleRoute";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";

import Landing from "./pages/Landing";
import Register from "./pages/Register";
import Login from "./pages/Login";
import UserDashboard from "./pages/UserDashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";
import MedicalDashboard from "./pages/medical/MedicalDashboard";
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
import { OnboardingManager } from "./components/auth/OnboardingManager";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <HelmetProvider>
      <ErrorBoundary>
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

                  {/* User Dashboard (default for regular users) */}
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute>
                        <RoleRoute allowedRoles={[UserRole.USER]}>
                          <UserDashboard />
                        </RoleRoute>
                      </ProtectedRoute>
                    }
                  />

                  {/* Admin Dashboard */}
                  <Route
                    path="/dashboard/admin"
                    element={
                      <ProtectedRoute>
                        <RoleRoute allowedRoles={[UserRole.ADMIN]}>
                          <AdminDashboard />
                        </RoleRoute>
                      </ProtectedRoute>
                    }
                  />

                  {/* Medical Professional Dashboard */}
                  <Route
                    path="/dashboard/medical"
                    element={
                      <ProtectedRoute>
                        <RoleRoute allowedRoles={[UserRole.MEDICAL_PROFESSIONAL, UserRole.ADMIN]}>
                          <MedicalDashboard />
                        </RoleRoute>
                      </ProtectedRoute>
                    }
                  />

                  {/* Journal Entry Routes */}
                  <Route
                    path="/entries/new"
                    element={
                      <ProtectedRoute>
                        <NewEntry />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/entries"
                    element={
                      <ProtectedRoute>
                        <Entries />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/entries/:id"
                    element={
                      <ProtectedRoute>
                        <EntryDetail />
                      </ProtectedRoute>
                    }
                  />

                  {/* Profile Route */}
                  <Route
                    path="/profile"
                    element={
                      <ProtectedRoute>
                        <Profile />
                      </ProtectedRoute>
                    }
                  />

                  {/* Legacy routes - redirect to new structure */}
                  <Route path="/dashboard/new-entry" element={<Navigate to="/entries/new" replace />} />
                  <Route path="/dashboard/entries" element={<Navigate to="/entries" replace />} />

                  {/* 404 */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </TooltipProvider>
          </AuthProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;
