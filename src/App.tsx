import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LanguageProvider } from './i18n/LanguageContext';
import { ThemeProvider } from './theme/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ReferralProvider } from './context/ReferralContext';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { OfflineBanner } from './components/common/OfflineBanner';
import { MapsQuotaBanner } from './components/common/MapsQuotaBanner';
import { AiTriageAssistant } from './components/ai/AiTriageAssistant';

// Pages
import { LandingPage } from './pages/LandingPage';
import { FacilitiesPage } from './pages/FacilitiesPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { UnifiedDashboard } from './pages/UnifiedDashboard';
import { PatientDashboard } from './pages/PatientDashboard';
import { AshaDashboard } from './pages/AshaDashboard';
import { HospitalDashboard } from './pages/HospitalDashboard';
import { TransportDashboard } from './pages/TransportDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { ReferralDetailPage } from './pages/ReferralDetailPage';

// Protected Route Guard
const ProtectedDashboardRoute: React.FC<{ children: React.ReactNode; allowedRole?: string }> = ({
  children,
}) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <ReferralProvider>
            <BrowserRouter>
              <div className="min-h-screen flex flex-col bg-[#F7FAFC] dark:bg-[#101C2C] text-[#334155] dark:text-[#CBD5E1] font-sans transition-colors selection:bg-[#0F766E] selection:text-white">
                {/* Quota Defense Banner (mandated by GMP skill) */}
                <MapsQuotaBanner />

                {/* Offline Sync Status Banner */}
                <OfflineBanner />

                {/* Main Navigation Bar */}
                <Navbar />

                {/* Main Route Views */}
                <main className="flex-1">
                  <Routes>
                    {/* Public Landing Page */}
                    <Route path="/" element={<LandingPage />} />

                    {/* Facilities Directory */}
                    <Route path="/facilities" element={<FacilitiesPage />} />

                    {/* Auth */}
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />

                    {/* Comprehensive Unified Dashboard (Central Access Point for All Features & Roles) */}
                    <Route
                      path="/dashboard"
                      element={
                        <ProtectedDashboardRoute>
                          <UnifiedDashboard />
                        </ProtectedDashboardRoute>
                      }
                    />
                    <Route
                      path="/dashboard/:roleParam"
                      element={
                        <ProtectedDashboardRoute>
                          <UnifiedDashboard />
                        </ProtectedDashboardRoute>
                      }
                    />

                    {/* Detailed Referral Sheet */}
                    <Route path="/referrals/:id" element={<ReferralDetailPage />} />

                    {/* Catch-all */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </main>

                {/* Global Multilingual AI Assistant Widget */}
                <AiTriageAssistant />

                {/* Platform Footer */}
                <Footer />
              </div>
            </BrowserRouter>
          </ReferralProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
