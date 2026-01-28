"use client";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { signInAnonymously } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && !loading) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  const handleLogin = async () => {
    try {
      // simulating login for demo - in real app use signInWithEmailAndPassword
      if (auth) await signInAnonymously(auth);
      // force reload or let useEffect handle it
    } catch (e) {
      console.error(e);
      alert("Login failed");
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24 bg-gradient-to-br from-slate-900 to-slate-800 text-white">
      <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl mb-6">
        AI Contract Intelligence Group
      </h1>
      <p className="text-xl text-slate-300 mb-8 max-w-2xl text-center">
        Advanced contract analysis for multi-tenant organizations. Powered by Claude 3.5 Sonnet.
      </p>

      <div className="flex gap-4">
        <Button size="lg" onClick={handleLogin} className="bg-blue-600 hover:bg-blue-500">
          Enter Platform
        </Button>
        <Button variant="outline" size="lg" className="text-black border-white hover:bg-white/90">
          Documentation
        </Button>
      </div>
    </div>
  );
}
