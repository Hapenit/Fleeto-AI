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
      if (typeof window !== 'undefined' && localStorage.getItem("mockAdmin") === "true") {
        setUser({ firstName: "Mock", lastName: "Admin", role: "ADMIN", email: "admin@fleeto.ai" });
        return;
      }
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
      localStorage.removeItem("mockAdmin");
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
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <span className="text-xl font-bold text-blue-600 cursor-pointer" onClick={() => router.push('/dashboard')}>AI Procurement</span>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <button
                onClick={() => router.push('/dashboard')}
                className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              >
                Dashboard
              </button>
              <button
                onClick={() => router.push('/requirements')}
                className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              >
                Requirements
              </button>
              <button
                onClick={() => router.push('/vendors')}
                className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              >
                Vendors
              </button>
              <button
                onClick={() => router.push('/calls')}
                className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              >
                Call History
              </button>
              <button
                onClick={() => router.push('/follow-ups')}
                className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
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
                  className="max-w-xs bg-white flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                  <span className="sr-only">Open user menu</span>
                  <div className="flex items-center space-x-3">
                    <div className="text-right hidden sm:block">
                      <div className="text-sm font-medium text-gray-900">
                        {user.firstName} {user.lastName}
                      </div>
                      <div className="text-xs font-medium text-gray-500">
                        {user.role}
                      </div>
                    </div>
                    {user.avatarUrl ? (
                      <img
                        className="h-8 w-8 rounded-full"
                        src={user.avatarUrl}
                        alt=""
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                        {user.firstName?.charAt(0)}
                      </div>
                    )}
                  </div>
                </button>
              </div>

              {isDropdownOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                  <a
                    href="/profile"
                    className="flex px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <UserIcon className="mr-2 h-4 w-4" />
                    Profile
                  </a>
                  <a
                    href="#"
                    className="flex px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </a>
                  {user.role === 'ADMIN' && (
                    <a
                      href="/admin/users"
                      className="flex px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 border-t"
                    >
                      User Management
                    </a>
                  )}
                  <button
                    onClick={handleLogout}
                    className="flex w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 border-t"
                  >
                    <LogOut className="mr-2 h-4 w-4 text-red-500" />
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
