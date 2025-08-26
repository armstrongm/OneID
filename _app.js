// pages/_app.js - Fixed version with proper auth flow
import { AuthProvider } from '../lib/auth';
import Layout from '../components/Layout';
import ProtectedRoute from '../components/ProtectedRoute';
import '../styles/globals.css';

// Define which pages are public (don't require authentication)
const publicPages = [
  '/auth/signin',
  '/auth/callback',
  '/auth/test',  // Add test page to public pages
  // Add any other public pages here
];

export default function MyApp({ Component, pageProps, router }) {
  const isPublicPage = publicPages.includes(router.pathname);
  
  return (
    <AuthProvider>
      {isPublicPage ? (
        // Public pages - no authentication required
        <Component {...pageProps} />
      ) : (
        // Protected pages - require authentication
        <ProtectedRoute>
          <Layout>
            <Component {...pageProps} />
          </Layout>
        </ProtectedRoute>
      )}
    </AuthProvider>
  );
}