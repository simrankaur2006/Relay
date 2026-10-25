import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, useNavigate } from 'react-router-dom';
import { ClerkProvider } from '@clerk/clerk-react';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './index.css';

const key = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

function Root() {
  const navigate = useNavigate();
  return (
    <ClerkProvider publishableKey={key} afterSignOutUrl="/sign-in" signInUrl="/sign-in" signUpUrl="/sign-up"
      routerPush={(to) => navigate(to)} routerReplace={(to) => navigate(to, { replace: true })}>
      <App />
      <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
    </ClerkProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  key ? (
    <React.StrictMode><BrowserRouter><Root /></BrowserRouter></React.StrictMode>
  ) : (
    <div style={{ padding: 40, fontFamily: 'sans-serif' }}>
      <h2>Missing VITE_CLERK_PUBLISHABLE_KEY</h2>
      <p>Copy <code>client/.env.example</code> to <code>client/.env</code> and add your Clerk publishable key.</p>
    </div>
  )
);
