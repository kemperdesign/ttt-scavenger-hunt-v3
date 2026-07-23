"use client";

import { useCallback } from "react";

const DB_NAME = "tq-offline-queue";
const STORE_NAME = "queue";
const SYNC_TAG = "tq-offline-sync";

interface QueueItem {
  url: string;
  method: string;
  headers: Record<string, string>;
  body: string | null;
  createdAt: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE_NAME, { keyPath: "id", autoIncrement: true });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function enqueue(item: QueueItem): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).add(item);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * useOfflineSync — wraps fetch with offline queue support.
 *
 * If the network request fails, the request is saved to IndexedDB
 * and replayed when connectivity returns via the Background Sync API.
 */
export function useOfflineSync() {
  const syncFetch = useCallback(
    async (
      url: string,
      init?: RequestInit
    ): Promise<{ ok: boolean; queued?: boolean; data?: unknown }> => {
      try {
        const response = await fetch(url, init);
        if (response.ok) {
          const data = await response.json().catch(() => null);
          return { ok: true, data };
        }
        return { ok: false };
      } catch {
        // Network failure — queue for later
        const item: QueueItem = {
          url,
          method: (init?.method ?? "POST").toUpperCase(),
          headers: Object.fromEntries(
            Object.entries((init?.headers as Record<string, string>) ?? {})
          ),
          body: typeof init?.body === "string" ? init.body : null,
          createdAt: Date.now(),
        };

        try {
          await enqueue(item);
          // Register background sync
          if ("serviceWorker" in navigator && "SyncManager" in window) {
            const reg = await navigator.serviceWorker.ready;
            await (reg as ServiceWorkerRegistration & { sync: { register(tag: string): Promise<void> } }).sync.register(SYNC_TAG);
          }
          return { ok: false, queued: true };
        } catch {
          return { ok: false, queued: false };
        }
      }
    },
    []
  );

  return { syncFetch };
}
