import Link from "next/link";
import { getLeaderboard } from "@/lib/api";

interface Props {
  params: { id: string };
}

export default async function LeaderboardPage({ params }: Props) {
  let entries: Awaited<ReturnType<typeof getLeaderboard>> = [];
  let error = false;

  try {
    entries = await getLeaderboard(params.id);
  } catch {
    error = true;
  }

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <main className="min-h-screen bg-slate-900 text-white px-4 py-8 max-w-lg mx-auto">
      <header className="mb-8">
        <Link
          href={`/adventure/${params.id}/complete`}
          className="text-amber-400 text-sm hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400 rounded"
          aria-label="Back to completion page"
        >
          ← Back
        </Link>
        <h1 className="text-2xl font-bold mt-3">Leaderboard</h1>
        <p className="text-slate-400 text-sm mt-1">Top completions for this adventure</p>
      </header>

      {error && (
        <div role="alert" className="bg-red-900/40 border border-red-700 rounded-lg p-4 mb-6">
          <p className="text-red-300 text-sm">Could not load leaderboard. Try again later.</p>
        </div>
      )}

      {!error && entries.length === 0 && (
        <div className="text-center py-16 text-slate-400">
          <p className="text-4xl mb-3">🏆</p>
          <p className="font-medium">No completions yet</p>
          <p className="text-sm mt-1">Be the first to finish!</p>
        </div>
      )}

      {entries.length > 0 && (
        <ol aria-label="Leaderboard rankings" className="space-y-3">
          {entries.map((entry, idx) => {
            const isTop3 = idx < 3;
            return (
              <li
                key={entry.user_id}
                className={`flex items-center gap-4 rounded-xl p-4 ${
                  isTop3
                    ? "bg-amber-900/30 border border-amber-700/50"
                    : "bg-slate-800"
                }`}
                aria-label={`Rank ${idx + 1}: ${entry.username}, ${entry.total_points} points`}
              >
                {/* Rank */}
                <span
                  className="text-2xl w-10 text-center shrink-0"
                  aria-hidden="true"
                >
                  {isTop3 ? medals[idx] : `#${idx + 1}`}
                </span>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{entry.username}</p>
                  {entry.completed_at && (
                    <p className="text-slate-400 text-xs mt-0.5">
                      {new Date(entry.completed_at).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  )}
                </div>

                {/* Points */}
                <div className="text-right shrink-0">
                  <p className="font-bold text-amber-400 text-lg">
                    {entry.total_points.toLocaleString()}
                  </p>
                  <p className="text-slate-500 text-xs">pts</p>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      <div className="mt-10 text-center">
        <Link
          href="/"
          className="inline-block bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold py-3 px-8 rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-300"
        >
          Explore More Adventures
        </Link>
      </div>
    </main>
  );
}
