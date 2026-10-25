import { Navigate, Route, Routes } from 'react-router-dom';
import { RedirectToSignIn, SignedIn, SignedOut } from '@clerk/clerk-react';
import { AppProvider } from './hooks/useApp';
import AuthPage from './pages/AuthPage';
import Home from './pages/Home';
import Workspace from './pages/Workspace';

function Protected() {
  return (
    <>
      <SignedIn>
        <AppProvider>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/w/:wid/:kind?/:id?" element={<Workspace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppProvider>
      </SignedIn>
      <SignedOut><RedirectToSignIn /></SignedOut>
    </>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/sign-in/*" element={<AuthPage mode="in" />} />
      <Route path="/sign-up/*" element={<AuthPage mode="up" />} />
      <Route path="/*" element={<Protected />} />
    </Routes>
  );
}
