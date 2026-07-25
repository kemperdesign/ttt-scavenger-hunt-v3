"use client";

import React, { useEffect, useState, useCallback } from "react";
import { listUsers, updateUser, type AdminUser } from "@/lib/api";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await listUsers();
      setUsers(data);
    } catch {
      setError("Failed to load users.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleToggleAdmin = async (user: AdminUser) => {
    if (user.is_admin && !confirm(`Remove admin access from ${user.username}?`)) return;
    setBusyId(user.id);
    setError("");
    try {
      const updated = await updateUser(user.id, { is_admin: !user.is_admin });
      setUsers((prev) => prev.map((u) => (u.id === user.id ? updated : u)));
    } catch {
      setError("Failed to update user. You may not be able to change your own account.");
    } finally {
      setBusyId(null);
    }
  };

  const handleToggleActive = async (user: AdminUser) => {
    const verb = user.is_active ? "deactivate" : "reactivate";
    if (!confirm(`Are you sure you want to ${verb} ${user.username}?`)) return;
    setBusyId(user.id);
    setError("");
    try {
      const updated = await updateUser(user.id, { is_active: !user.is_active });
      setUsers((prev) => prev.map((u) => (u.id === user.id ? updated : u)));
    } catch {
      setError("Failed to update user. You may not be able to change your own account.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-white font-bold text-2xl">Users</h1>
        <p className="text-slate-400 text-sm mt-1">
          Manage admin access and account status.
        </p>
      </div>

      {error && (
        <div role="alert" className="bg-red-900/40 border border-red-700 rounded-lg p-3 text-red-300 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-slate-400" role="status">Loading…</p>
      ) : users.length === 0 ? (
        <p className="text-slate-500 text-sm">No users found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="text-slate-400 border-b border-slate-800">
                <th className="py-2 pr-4 font-medium">Username</th>
                <th className="py-2 pr-4 font-medium">Email</th>
                <th className="py-2 pr-4 font-medium">Joined</th>
                <th className="py-2 pr-4 font-medium">Role</th>
                <th className="py-2 pr-4 font-medium">Status</th>
                <th className="py-2 pr-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-slate-800/60">
                  <td className="py-3 pr-4 text-white font-medium">{u.username}</td>
                  <td className="py-3 pr-4 text-slate-300">{u.email}</td>
                  <td className="py-3 pr-4 text-slate-400">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3 pr-4">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                        u.is_admin
                          ? "bg-amber-900/40 text-amber-400"
                          : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      {u.is_admin ? "Admin" : "Player"}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                        u.is_active
                          ? "bg-green-900/40 text-green-400"
                          : "bg-red-900/40 text-red-400"
                      }`}
                    >
                      {u.is_active ? "Active" : "Deactivated"}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleToggleAdmin(u)}
                        disabled={busyId === u.id}
                        className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg min-h-[36px] disabled:opacity-50"
                      >
                        {u.is_admin ? "Revoke Admin" : "Make Admin"}
                      </button>
                      <button
                        onClick={() => handleToggleActive(u)}
                        disabled={busyId === u.id}
                        className={`text-xs px-3 py-1.5 rounded-lg min-h-[36px] disabled:opacity-50 ${
                          u.is_active
                            ? "bg-red-900/40 hover:bg-red-900/60 text-red-300"
                            : "bg-green-900/40 hover:bg-green-900/60 text-green-300"
                        }`}
                      >
                        {u.is_active ? "Deactivate" : "Reactivate"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
