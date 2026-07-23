export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-6 text-center">
      <div className="text-7xl mb-6" aria-hidden="true">📡</div>
      <h1 className="text-white font-bold text-2xl mb-3">You're Offline</h1>
      <p className="text-slate-400 text-lg max-w-xs leading-relaxed mb-8">
        No internet connection. Your progress is saved and will sync when you reconnect.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="min-h-[52px] px-8 py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold transition-colors"
      >
        Try Again
      </button>
    </div>
  );
}
