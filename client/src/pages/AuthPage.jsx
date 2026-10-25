import { SignIn, SignUp } from '@clerk/clerk-react';
import { MessagesSquare } from 'lucide-react';

export default function AuthPage({ mode }) {
  return (
    <div className="min-h-full grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-center bg-slate-900 text-white p-16">
        <div className="flex items-center gap-2 text-2xl font-bold"><MessagesSquare className="text-indigo-400" size={30} /> Relay</div>
        <h1 className="text-5xl font-bold mt-8 leading-tight">Your team.<br /><span className="text-indigo-400">In sync.</span></h1>
        <p className="mt-4 text-slate-400 max-w-md">Channels, direct messages and threads — a lightweight home for your team's conversations.</p>
      </div>
      <div className="grid place-items-center p-6 bg-slate-50">
        {mode === 'in'
          ? <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" fallbackRedirectUrl="/" />
          : <SignUp routing="path" path="/sign-up" signInUrl="/sign-in" fallbackRedirectUrl="/" />}
      </div>
    </div>
  );
}
