'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/auth.service';
import Sidebar from './Sidebar';
import Header from './Header';
import ChatbotWidget from '@/components/ui/ChatbotWidget';

interface AppLayoutProps {
  title: string;
  children: React.ReactNode;
}

export default function AppLayout({ title, children }: AppLayoutProps) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!authService.isLoggedIn()) {
      router.replace('/');
    }
  }, [router]);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-[#080d14]">
      {/* Desktop sidebar — fixed, never scrolls */}
      <div className="hidden lg:block w-64 h-screen flex-shrink-0 overflow-y-auto">
        <Sidebar open={false} onClose={() => {}} />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="relative z-10 w-64 h-full shadow-2xl">
            <Sidebar open={true} onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main content — scrolls independently */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Ambient glow blobs — dark mode only */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden hidden dark:block">
          <div className="absolute -top-40 right-0 w-[600px] h-[500px] bg-blue-600/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 left-1/3 w-[400px] h-[400px] bg-indigo-600/5 rounded-full blur-[100px]" />
        </div>
        {/* Grid overlay — dark mode only */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.018] hidden dark:block" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.6) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }} />

        <Header title={title} onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 relative">{children}</main>
      </div>
      <ChatbotWidget />
    </div>
  );
}
