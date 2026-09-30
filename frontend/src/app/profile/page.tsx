"use client";

import { useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import { fetchApi } from "@/lib/api";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const updateProfileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
});

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [profileMsg, setProfileMsg] = useState({ text: "", type: "" });
  const [passwordMsg, setPasswordMsg] = useState({ text: "", type: "" });

  const profileForm = useForm({ resolver: zodResolver(updateProfileSchema) });
  const passwordForm = useForm({ resolver: zodResolver(changePasswordSchema) });

  useEffect(() => {
    fetchApi("/auth/me")
      .then((res) => {
        setUser(res.data);
        profileForm.reset({
          firstName: res.data.firstName,
          lastName: res.data.lastName,
          phone: res.data.phone || "",
        });
      })
      .catch((err) => {
        window.location.href = "/login";
      });
  }, [profileForm]);

  const onProfileSubmit = async (data: any) => {
    try {
      await fetchApi(`/users/${user.id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
      setProfileMsg({ text: "Profile updated successfully.", type: "success" });
      setUser({ ...user, ...data });
    } catch (err: any) {
      setProfileMsg({ text: err.message, type: "error" });
    }
  };

  const onPasswordSubmit = async (data: any) => {
    try {
      await fetchApi("/auth/change-password", {
        method: "POST",
        body: JSON.stringify(data),
      });
      setPasswordMsg({ text: "Password changed successfully.", type: "success" });
      passwordForm.reset();
    } catch (err: any) {
      setPasswordMsg({ text: err.message, type: "error" });
    }
  };

  if (!user) return <div className="min-h-screen bg-gray-50"><Header /><div className="text-center p-10">Loading...</div></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 space-y-6">
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Profile Information</h3>
            
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-500 mb-6">
              <div><strong>Email:</strong> {user.email}</div>
              <div><strong>Role:</strong> {user.role}</div>
              <div><strong>Account Status:</strong> {user.status}</div>
              <div><strong>Created Date:</strong> {new Date(user.createdAt).toLocaleDateString()}</div>
              <div><strong>Last Login:</strong> {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Never'}</div>
            </div>

            <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4 max-w-xl">
              {profileMsg.text && (
                <div className={`p-3 text-sm rounded ${profileMsg.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                  {profileMsg.text}
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">First Name</label>
                  <input {...profileForm.register("firstName")} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Last Name</label>
                  <input {...profileForm.register("lastName")} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <input {...profileForm.register("phone")} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
              </div>
              <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm">Update Profile</button>
            </form>
          </div>
        </div>

        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Change Password</h3>
            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="mt-5 space-y-4 max-w-xl">
              {passwordMsg.text && (
                <div className={`p-3 text-sm rounded ${passwordMsg.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                  {passwordMsg.text}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700">Current Password</label>
                <input type="password" {...passwordForm.register("currentPassword")} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">New Password</label>
                <input type="password" {...passwordForm.register("newPassword")} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
              </div>
              <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm">Change Password</button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
