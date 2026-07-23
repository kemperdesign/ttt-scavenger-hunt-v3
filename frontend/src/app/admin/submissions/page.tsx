"use client";

import React, { useEffect, useState } from "react";
import { listSubmissions, approveSubmission, rejectSubmission } from "@/lib/api";

interface Submission {
  id: string;
  user_id: string;
  challenge_id: string;
  image_url: string;
  status: string;
  submitted_at: string;
}

export default function AdminSubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected">("pending");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const data = await listSubmissions(filter);
      setSubmissions(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filter]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleReview = async (id: string, action: "approve" | "reject") => {
    if (action === "approve") {
      await approveSubmission(id);
    } else {
      await rejectSubmission(id, "Does not meet requirements.");
    }
    load();
  };

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-white font-bold text-2xl">Photo Submissions</h1>

      {/* Filter tabs */}
      <div role="tablist" aria-label="Filter submissions by status" className="flex gap-2">
        {(["pending", "approved", "rejected"] as const).map((status) => (
          <button
            key={status}
            role="tab"
            aria-selected={filter === status}
            onClick={() => setFilter(status)}
            className={`min-h-[40px] px-4 py-1.5 rounded-lg text-sm font-medium transition-colors focus-visible:outline-amber-500 capitalize ${
              filter === status
                ? "bg-amber-600 text-white"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-slate-400" role="status">Loading…</p>
      ) : submissions.length === 0 ? (
        <p className="text-slate-500 text-sm">No {filter} submissions.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3" role="list">
          {submissions.map((sub) => (
            <div
              key={sub.id}
              role="listitem"
              className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={sub.image_url}
                alt={`Submission for challenge ${sub.challenge_id}`}
                className="w-full h-48 object-cover"
              />
              <div className="p-3 space-y-2">
                <p className="text-slate-400 text-xs">
                  {new Date(sub.submitted_at).toLocaleDateString()}
                </p>
                {filter === "pending" && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleReview(sub.id, "approve")}
                      className="flex-1 min-h-[36px] bg-green-700 hover:bg-green-600 text-white rounded text-xs font-medium transition-colors focus-visible:outline-green-500"
                      aria-label="Approve this submission"
                    >
                      ✅ Approve
                    </button>
                    <button
                      onClick={() => handleReview(sub.id, "reject")}
                      className="flex-1 min-h-[36px] bg-red-800 hover:bg-red-700 text-white rounded text-xs font-medium transition-colors focus-visible:outline-red-500"
                      aria-label="Reject this submission"
                    >
                      ✗ Reject
                    </button>
                  </div>
                )}
                {filter !== "pending" && (
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-xs font-medium capitalize ${
                      sub.status === "approved"
                        ? "bg-green-900/40 text-green-400"
                        : "bg-red-900/40 text-red-400"
                    }`}
                  >
                    {sub.status}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
