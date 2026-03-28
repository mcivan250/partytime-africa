import type { AppProps } from 'next/app';
import '@/styles/globals.css'; // Existing global styles
import '@/styles/luxury-dark-theme.css'; // New luxury dark theme

function MyApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}

export default MyApp;
