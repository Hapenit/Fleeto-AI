"use client";

import { useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import { fetchApi } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useParams } from "next/navigation";

const updateUserSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().optional(),
  role: z.enum(["ADMIN", "MARKETING_USER"]),
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]),
});

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(updateUserSchema),
  });

  useEffect(() => {
    fetchApi(`/users/${id}`)
      .then(res => {
        setUser(res);
        reset({
          firstName: res.firstName,
          lastName: res.lastName,
          phone: res.phone || "",
          role: res.role,
          status: res.status,
        });
      })
      .catch(err => {
        setError("Failed to load user");
      });
  }, [id, reset]);

  const onSubmit = async (data: any) => {
    try {
      await fetchApi(`/users/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
      router.push("/admin/users");
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (!user && !error) return <div className="min-h-screen bg-gray-50"><Header /><div className="p-10 text-center">Loading...</div></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-3xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="bg-white shadow sm:rounded-lg px-4 py-5 sm:p-6">
          <h1 className="text-xl font-bold mb-4">Edit User</h1>
          {error && <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm">{error}</div>}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input type="email" disabled value={user?.email || ""} className="mt-1 block w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-md text-gray-500" />
              <p className="text-xs text-gray-400 mt-1">Email cannot be changed.</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">First Name</label>
                <input {...register("firstName")} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
                {errors.firstName && <p className="text-xs text-red-500 mt-1">{errors.firstName.message?.toString()}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Last Name</label>
                <input {...register("lastName")} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
                {errors.lastName && <p className="text-xs text-red-500 mt-1">{errors.lastName.message?.toString()}</p>}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone</label>
              <input {...register("phone")} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Role</label>
                <select {...register("role")} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md">
                  <option value="MARKETING_USER">MARKETING_USER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select {...register("status")} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md">
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                  <option value="SUSPENDED">SUSPENDED</option>
                </select>
              </div>
            </div>
            <div className="pt-4 flex space-x-3">
              <button type="button" onClick={() => router.back()} className="px-4 py-2 border border-gray-300 rounded-md text-sm bg-white hover:bg-gray-50">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700">Save Changes</button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
