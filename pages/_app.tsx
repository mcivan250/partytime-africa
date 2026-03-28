import type { AppProps } from 'next/app';
import '@/styles/luxury-dark-theme.css'; // New luxury dark theme

function MyApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}

export default MyApp;
