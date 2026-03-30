import type { AppProps } from 'next/app';
import '@/styles/luxury-dark-theme.css'; // New luxury dark theme
import { AuthProvider } from '@/contexts/AuthContext';
import TopHeader from '@/components/TopHeader';
import BottomNavigation from '@/components/BottomNavigation';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <TopHeader />
      <main className="pt-16 pb-24 min-h-screen bg-primary">
        <Component {...pageProps} />
      </main>
      <BottomNavigation />
    </AuthProvider>
  );
}

export default MyApp;