"use client";

import React, { useEffect, useState, useCallback } from "react";
import { listAuditLogs, type AuditLogEntry } from "@/lib/api";

export default function AdminAuditLogPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await listAuditLogs({ limit: 100 });
      setLogs(data);
    } catch {
      setError("Failed to load audit log.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-white font-bold text-2xl">Audit Log</h1>
        <p className="text-slate-400 text-sm mt-1">
          Recent administrative actions — most recent first.
        </p>
      </div>

      {error && (
        <div role="alert" className="bg-red-900/40 border border-red-700 rounded-lg p-3 text-red-300 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-slate-400" role="status">Loading…</p>
      ) : logs.length === 0 ? (
        <p className="text-slate-500 text-sm">No audit log entries yet.</p>
      ) : (
        <ul className="space-y-2" role="list">
          {logs.map((log) => (
            <li
              key={log.id}
              className="bg-slate-900 border border-slate-800 rounded-lg px-4 py-3"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-white text-sm font-medium">{log.action}</p>
                  {log.resource_type && (
                    <p className="text-slate-400 text-xs mt-0.5">
                      {log.resource_type}
                      {log.resource_id ? ` · ${log.resource_id}` : ""}
                    </p>
                  )}
                  {Object.keys(log.details).length > 0 && (
                    <pre className="text-slate-500 text-xs mt-2 overflow-x-auto whitespace-pre-wrap break-all">
                      {JSON.stringify(log.details, null, 2)}
                    </pre>
                  )}
                </div>
                <span className="text-slate-500 text-xs shrink-0 whitespace-nowrap">
                  {new Date(log.created_at).toLocaleString()}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
