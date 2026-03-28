import type { AppProps } from 'next/app';
import '@/styles/luxury-dark-theme.css'; // New luxury dark theme
import { AuthProvider } from '@/contexts/AuthContext';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <Component {...pageProps} />
    </AuthProvider>
  );
}

export default MyApp;