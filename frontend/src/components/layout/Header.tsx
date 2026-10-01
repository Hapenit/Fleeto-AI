"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchApi } from "@/lib/api";
import { LogOut, User as UserIcon, Settings } from "lucide-react";

export default function Header() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetchApi("/auth/me");
        setUser(res.data);
      } catch (err) {
        // If unauthenticated, redirect to login
        router.push("/login");
      }
    }
    loadUser();
  }, [router]);

  const handleLogout = async () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem("accessToken");
    }
    try {
      await fetchApi("/auth/logout", { method: "POST" });
    } catch (err) {
      console.error(err);
    }
    router.push("/login");
  };

  if (!user) return null; // or a skeleton

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/80 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <span className="text-xl font-bold tracking-tight text-blue-600 cursor-pointer flex items-center" onClick={() => router.push('/dashboard')}>
                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                Fleeto AI
              </span>
            </div>
            <div className="hidden sm:ml-8 sm:flex sm:space-x-1">
              <button
                onClick={() => router.push('/dashboard')}
                className="text-gray-500 hover:text-gray-900 hover:bg-gray-50/80 inline-flex items-center px-3 py-2 my-auto rounded-lg text-sm font-medium transition-colors"
              >
                Dashboard
              </button>
              <button
                onClick={() => router.push('/requirements')}
                className="text-gray-900 bg-blue-50/50 inline-flex items-center px-3 py-2 my-auto rounded-lg text-sm font-semibold transition-colors"
              >
                Requirements
              </button>
              <button
                onClick={() => router.push('/vendors')}
                className="text-gray-500 hover:text-gray-900 hover:bg-gray-50/80 inline-flex items-center px-3 py-2 my-auto rounded-lg text-sm font-medium transition-colors"
              >
                Vendors
              </button>
              <button
                onClick={() => router.push('/calls')}
                className="text-gray-500 hover:text-gray-900 hover:bg-gray-50/80 inline-flex items-center px-3 py-2 my-auto rounded-lg text-sm font-medium transition-colors"
              >
                Call History
              </button>
              <button
                onClick={() => router.push('/follow-ups')}
                className="text-gray-500 hover:text-gray-900 hover:bg-gray-50/80 inline-flex items-center px-3 py-2 my-auto rounded-lg text-sm font-medium transition-colors"
              >
                Follow-ups
              </button>
            </div>
          </div>
          <div className="flex items-center">
            <div className="ml-3 relative">
              <div>
                <button
                  type="button"
                  className="bg-white/50 border border-gray-200/80 flex items-center p-1 pr-3 text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-sm hover:bg-gray-50 transition-colors"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                  <span className="sr-only">Open user menu</span>
                  <div className="flex items-center space-x-3">
                    {user.avatarUrl ? (
                      <img
                        className="h-8 w-8 rounded-full"
                        src={user.avatarUrl}
                        alt=""
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                        {user.firstName?.charAt(0) || user.email?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="text-left hidden sm:block">
                      <div className="text-sm font-semibold text-gray-800 tracking-tight leading-none">
                        {user.firstName ? `${user.firstName} ${user.lastName}` : 'Admin User'}
                      </div>
                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-1">
                        {user.role}
                      </div>
                    </div>
                    <svg className="w-4 h-4 text-gray-400 hidden sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </button>
              </div>

              {isDropdownOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-xl shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-4 py-3 border-b border-gray-100 sm:hidden">
                    <p className="text-sm font-semibold text-gray-900">{user.firstName ? `${user.firstName} ${user.lastName}` : 'Admin User'}</p>
                    <p className="text-xs font-medium text-gray-500 truncate">{user.email}</p>
                  </div>
                  <a
                    href="/profile"
                    className="flex px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors"
                  >
                    <UserIcon className="mr-3 h-4 w-4" />
                    Profile
                  </a>
                  <a
                    href="#"
                    className="flex px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors"
                  >
                    <Settings className="mr-3 h-4 w-4" />
                    Settings
                  </a>
                  {user.role === 'ADMIN' && (
                    <a
                      href="/admin/users"
                      className="flex px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors border-t border-gray-100"
                    >
                      User Management
                    </a>
                  )}
                  <button
                    onClick={handleLogout}
                    className="flex w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-gray-100"
                  >
                    <LogOut className="mr-3 h-4 w-4" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
