"use client";

import { useState } from "react";
import { API_URL } from "../lib/constants";

export function SettingsView({ onLogout }: { onLogout: () => void }) {
  const [saved, setSaved] = useState(false);
  const [notifications, setNotifications] = useState(true);

  return (
    <div className="flex-1 overflow-auto p-8">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900">Settings</h2>
        <p className="text-slate-400 text-sm">Manage your account and preferences</p>
      </div>
      <div className="max-w-2xl space-y-6">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-900">Profile</h3>
            <p className="text-slate-400 text-xs mt-0.5">Update your account information</p>
          </div>
          <div className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-emerald-600 flex items-center justify-center text-white text-xl font-bold shadow-md">
                AD
              </div>
              <div>
                <p className="font-semibold text-slate-900">Administrator</p>
                <p className="text-slate-400 text-sm">admin@school.edu</p>
                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 text-xs font-medium mt-1.5">
                  Admin
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Full Name</label>
                <input
                  defaultValue="Administrator"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Email</label>
                <input
                  defaultValue="admin@school.edu"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all"
                />
              </div>
            </div>
            <button
              onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2000); }}
              className={`px-4 py-2 text-sm font-medium rounded-xl transition-all shadow-sm ${
                saved ? "bg-emerald-500 text-white" : "bg-emerald-600 hover:bg-emerald-700 text-white"
              }`}
            >
              {saved ? "✓ Saved!" : "Save Changes"}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-900">Preferences</h3>
          </div>
          <div className="divide-y divide-slate-50">
            <div className="flex items-center justify-between px-6 py-4">
              <div>
                <p className="text-sm font-medium text-slate-900">Email Notifications</p>
                <p className="text-xs text-slate-400 mt-0.5">Receive alerts for student activity</p>
              </div>
              <button
                onClick={() => setNotifications((v) => !v)}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  notifications ? "bg-emerald-600" : "bg-slate-200"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    notifications ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
            <div className="flex items-center justify-between px-6 py-4 opacity-50">
              <div>
                <p className="text-sm font-medium text-slate-900">Dark Mode</p>
                <p className="text-xs text-slate-400 mt-0.5">Coming soon</p>
              </div>
              <div className="relative w-11 h-6 rounded-full bg-slate-200 cursor-not-allowed">
                <span className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-900">System</h3>
          </div>
          <div className="divide-y divide-slate-50">
            <div className="flex items-center justify-between px-6 py-4">
              <div>
                <p className="text-sm font-medium text-slate-900">API Endpoint</p>
                <p className="text-xs text-slate-400 mt-0.5 font-mono">{API_URL}</p>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-600 text-xs font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Connected
              </span>
            </div>
            <div className="flex items-center justify-between px-6 py-4">
              <div>
                <p className="text-sm font-medium text-slate-900">Version</p>
                <p className="text-xs text-slate-400 mt-0.5">StudentHub v2.0.0</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-red-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-red-100">
            <h3 className="font-semibold text-red-500">Account</h3>
          </div>
          <div className="px-6 py-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-900">Sign Out</p>
              <p className="text-xs text-slate-400 mt-0.5">End your current session</p>
            </div>
            <button
              onClick={onLogout}
              className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-medium rounded-xl transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
