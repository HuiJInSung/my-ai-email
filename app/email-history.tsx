"use client";

import { useCallback, useEffect, useState } from "react";
import type { DailyBrief } from "@/lib/daily-brief";
import BriefView from "./brief-view";

type EmailRecord = {
  id: string;
  from: string;
  to: string;
  subject: string;
  status: "sent" | "failed";
  resendId?: string;
  error?: string;
  brief: DailyBrief;
  createdAt: string;
};

type FetchResult = { ok: true; emails: EmailRecord[] } | { ok: false; error: string };

async function fetchEmails(): Promise<FetchResult> {
  try {
    const res = await fetch("/api/emails", { cache: "no-store" });
    const result = await res.json();
    if (!res.ok || !result.ok) throw new Error(result.error ?? `API 回應 ${res.status}`);
    return { ok: true, emails: result.emails };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("zh-TW", {
    timeZone: "Asia/Taipei",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

function StatusBadge({ status }: { status: EmailRecord["status"] }) {
  return status === "sent" ? (
    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-950 dark:text-green-300">
      已寄出
    </span>
  ) : (
    <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-950 dark:text-red-300">
      失敗
    </span>
  );
}

export default function EmailHistory() {
  const [emails, setEmails] = useState<EmailRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const applyResult = useCallback((result: FetchResult) => {
    if (result.ok) {
      setEmails(result.emails);
      setError(null);
    } else {
      setError(result.error);
    }
    setLoading(false);
  }, []);

  const load = () => {
    setLoading(true);
    fetchEmails().then(applyResult);
  };

  // 首次載入：loading 初始值已是 true，這裡只負責發出請求
  useEffect(() => {
    fetchEmails().then(applyResult);
  }, [applyResult]);

  // 預設選最新一筆；選取的紀錄不在清單中（例如重新整理後）也退回最新一筆
  const selected = emails.find((email) => email.id === selectedId) ?? emails[0];

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-10 sm:px-8">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">寄信紀錄</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {loading ? "載入中…" : `共 ${emails.length} 筆，依寄送時間由新到舊`}
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background transition-opacity hover:opacity-80 disabled:opacity-50"
        >
          {loading ? "更新中…" : "重新整理"}
        </button>
      </header>

      {error && <p className="rounded-xl bg-red-50 p-4 text-red-700 dark:bg-red-950 dark:text-red-300">讀取失敗：{error}</p>}

      {!loading && !error && emails.length === 0 && (
        <p className="py-20 text-center text-zinc-500">目前還沒有寄信紀錄，等排程寄出第一封信後就會出現在這裡。</p>
      )}

      {emails.length > 0 && selected && (
        <div className="grid gap-6 md:grid-cols-[18rem_1fr]">
          <nav className="flex max-h-[70vh] flex-col gap-2 overflow-y-auto md:sticky md:top-6 md:self-start">
            {emails.map((email) => (
              <button
                key={email.id}
                onClick={() => setSelectedId(email.id)}
                className={`rounded-xl border p-3 text-left transition-colors ${
                  email.id === selected.id
                    ? "border-foreground bg-white dark:bg-zinc-900"
                    : "border-black/[.08] hover:bg-black/[.03] dark:border-white/[.145] dark:hover:bg-white/[.05]"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{email.brief.date}</span>
                  <StatusBadge status={email.status} />
                </div>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">寄送於 {formatDateTime(email.createdAt)}</p>
              </button>
            ))}
          </nav>

          <div className="flex min-w-0 flex-col gap-6">
            <section className="rounded-2xl border border-black/[.08] bg-white p-6 text-sm shadow-sm dark:border-white/[.145] dark:bg-zinc-900">
              <div className="mb-3 flex flex-wrap items-center gap-3">
                <h2 className="text-lg font-semibold">{selected.subject}</h2>
                <StatusBadge status={selected.status} />
              </div>
              <dl className="grid gap-x-6 gap-y-1 text-zinc-600 sm:grid-cols-[auto_1fr] dark:text-zinc-300">
                <dt className="text-zinc-400">寄件人</dt>
                <dd className="break-all">{selected.from}</dd>
                <dt className="text-zinc-400">收件人</dt>
                <dd className="break-all">{selected.to}</dd>
                <dt className="text-zinc-400">寄送時間</dt>
                <dd>{formatDateTime(selected.createdAt)}</dd>
                {selected.resendId && (
                  <>
                    <dt className="text-zinc-400">Resend ID</dt>
                    <dd className="break-all font-mono text-xs leading-5">{selected.resendId}</dd>
                  </>
                )}
                {selected.error && (
                  <>
                    <dt className="text-zinc-400">錯誤</dt>
                    <dd className="text-red-600 dark:text-red-400">{selected.error}</dd>
                  </>
                )}
              </dl>
            </section>

            <BriefView brief={selected.brief} />
          </div>
        </div>
      )}
    </main>
  );
}
