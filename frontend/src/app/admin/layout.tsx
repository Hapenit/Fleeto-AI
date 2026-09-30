'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Bot, Settings, FileText, Phone, BarChart2, ShieldCheck, Activity } from 'lucide-react';

const navigation = [
  { name: 'Overview', href: '/admin', icon: LayoutDashboard },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'AI Configuration', href: '/admin/ai', icon: Bot },
  { name: 'Voice & Telephony', href: '/admin/voice', icon: Phone },
  { name: 'Policies', href: '/admin/policies', icon: ShieldCheck },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
  { name: 'Analytics', href: '/admin/analytics', icon: BarChart2 },
  { name: 'Audit Logs', href: '/admin/audit', icon: FileText },
  { name: 'System Health', href: '/admin/health', icon: Activity },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 hidden md:block shrink-0">
        <nav className="p-4 space-y-1">
          <div className="px-3 mb-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Administration
          </div>
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  isActive
                    ? 'bg-black text-white'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <item.icon
                  className={`mr-3 flex-shrink-0 h-5 w-5 ${
                    isActive ? 'text-white' : 'text-gray-400'
                  }`}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
