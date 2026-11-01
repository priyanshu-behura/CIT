import React, { useEffect, useState } from 'react';
import { api, setToken } from './services/api';
import type { User, DemoAccount, DatasetSummary, HealthStatus } from './types/dataset';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { AppLayout } from './components/layout/AppLayout';
import { DashboardPage } from './pages/DashboardPage';
import { TimetablePage } from './pages/TimetablePage';
import { ExamsPage } from './pages/ExamsPage';
import { VenuesPage } from './pages/VenuesPage';
import { BookingsPage } from './pages/BookingsPage';
import { SpectraPage } from './pages/SpectraPage';
import { AssistantPage } from './pages/AssistantPage';
import { DisruptionsPage } from './pages/DisruptionsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { AIChatPage } from './pages/AIChatPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';

export const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<string>('landing');
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [summary, setSummary] = useState<DatasetSummary | null>(null);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [demoAccounts, setDemoAccounts] = useState<DemoAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check URL parameters for direct deep-linking (e.g. ?page=reset-password&token=xyz or ?page=register)
    const urlParams = new URLSearchParams(window.location.search);
    const pageParam = urlParams.get('page');
    const tokenParam = urlParams.get('token') || urlParams.get('reset_token');

    if (pageParam === 'reset-password' || tokenParam) {
      if (tokenParam) setResetToken(tokenParam);
      setCurrentPage('reset-password');
    } else if (pageParam === 'register') {
      setCurrentPage('register');
    } else if (pageParam === 'forgot-password') {
      setCurrentPage('forgot-password');
    } else if (pageParam === 'login') {
      setCurrentPage('login');
    }

    const initializeApp = async () => {
      setIsLoading(true);
      try {
        const [sumRes, hRes, demoRes] = await Promise.all([
          api.getDatasetSummary().catch(() => null),
          api.getHealth().catch(() => null),
          api.getDemoAccounts().catch(() => []),
        ]);

        if (sumRes) setSummary(sumRes);
        if (hRes) setHealth(hRes);
        if (demoRes) setDemoAccounts(demoRes);

        // Check for existing saved token
        const existingToken = localStorage.getItem('tech_zephyr_token');
        if (existingToken) {
          try {
            const meRes = await api.getMe();
            setUser(meRes);
            // If already logged in and on root without explicit auth page parameter, go to dashboard
            if (!pageParam || pageParam === 'login') {
              setCurrentPage('dashboard');
            }
          } catch {
            setToken(null);
          }
        }
      } catch (err) {
        console.error('Initialization error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  const handleLoginSuccess = (authenticatedUser: User) => {
    setUser(authenticatedUser);
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    setCurrentPage('landing');
  };

  // 1. PUBLIC LANDING PAGE (First page visitors see)
  if (currentPage === 'landing') {
    return (
      <LandingPage
        summary={summary}
        userRole={user?.role}
        onNavigateLogin={() => setCurrentPage('login')}
        onNavigateApp={() => setCurrentPage('dashboard')}
      />
    );
  }

  // 2. AUTHENTICATION PAGES
  if (currentPage === 'login') {
    return (
      <LoginPage
        demoAccounts={demoAccounts}
        onLoginSuccess={handleLoginSuccess}
        onNavigateLanding={() => setCurrentPage('landing')}
        onNavigateRegister={() => setCurrentPage('register')}
        onNavigateForgotPassword={() => setCurrentPage('forgot-password')}
      />
    );
  }

  if (currentPage === 'register') {
    return (
      <RegisterPage
        onNavigateLogin={() => setCurrentPage('login')}
        onNavigateLanding={() => setCurrentPage('landing')}
      />
    );
  }

  if (currentPage === 'forgot-password') {
    return (
      <ForgotPasswordPage
        onNavigateLogin={() => setCurrentPage('login')}
        onNavigateLanding={() => setCurrentPage('landing')}
      />
    );
  }

  if (currentPage === 'reset-password') {
    return (
      <ResetPasswordPage
        token={resetToken}
        onNavigateLogin={() => setCurrentPage('login')}
        onNavigateForgotPassword={() => setCurrentPage('forgot-password')}
        onNavigateLanding={() => setCurrentPage('landing')}
      />
    );
  }

  // 3. AUTHENTICATED PORTAL (With Light Sidebar and Topbar)
  return (
    <AppLayout
      user={user}
      currentPage={currentPage}
      onNavigate={(page) => setCurrentPage(page)}
      onLogout={handleLogout}
    >
      {currentPage === 'dashboard' && (
        <DashboardPage
          user={user}
          summary={summary}
          onNavigate={(page) => setCurrentPage(page)}
        />
      )}

      {currentPage === 'timetable' && (
        <TimetablePage summary={summary} />
      )}

      {currentPage === 'exams' && (
        <ExamsPage />
      )}

      {currentPage === 'venues' && (
        <VenuesPage />
      )}

      {currentPage === 'bookings' && (
        <BookingsPage user={user} />
      )}

      {currentPage === 'spectra' && (
        <SpectraPage />
      )}

      {currentPage === 'assistant' && (
        <AssistantPage onNavigateBookings={() => setCurrentPage('bookings')} />
      )}

      {currentPage === 'disruptions' && (
        <DisruptionsPage user={user} />
      )}

      {currentPage === 'analytics' && (
        <AnalyticsPage />
      )}

      {currentPage === 'ai-chat' && (
        <AIChatPage user={user} />
      )}

      {currentPage === 'reports' && (
        <ReportsPage />
      )}

      {currentPage === 'settings' && (
        <SettingsPage
          user={user}
          summary={summary}
          demoAccounts={demoAccounts}
        />
      )}
    </AppLayout>
  );
};

export default App;
