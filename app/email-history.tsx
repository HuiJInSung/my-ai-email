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

const TIME_ZONE = "Asia/Taipei";

// 2026-10-20 -> { date: "2026.10.20", weekday: "二" }
const formatIssueDate = (ymd: string) => ({
  date: ymd.replaceAll("-", "."),
  weekday: new Date(`${ymd}T00:00:00+08:00`).toLocaleDateString("zh-TW", { timeZone: TIME_ZONE, weekday: "narrow" }),
});

const formatClock = (iso: string) =>
  new Date(iso).toLocaleTimeString("zh-TW", { timeZone: TIME_ZONE, hour: "2-digit", minute: "2-digit", hour12: false });

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("zh-TW", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

const issueNo = (n: number) => `No.${String(n).padStart(2, "0")}`;

// 印章風格的狀態標記
function Seal({ status, size = "sm" }: { status: EmailRecord["status"]; size?: "sm" | "lg" }) {
  const sent = status === "sent";
  const dimension = size === "lg" ? "h-14 w-14 text-base" : "h-8 w-8 text-[0.65rem]";
  return (
    <span
      title={sent ? "已寄出" : "寄送失敗"}
      className={`inline-flex shrink-0 -rotate-12 items-center justify-center rounded-full border-2 font-medium ${dimension} ${
        sent ? "border-accent text-accent" : "border-muted text-muted"
      }`}
    >
      {sent ? "已寄" : "未達"}
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
  // 期數：最舊的一封為 No.01
  const numberOf = (email: EmailRecord) => emails.length - emails.indexOf(email);
  const latest = emails[0] ? formatIssueDate(emails[0].brief.date) : null;

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-5 py-10 sm:px-10 sm:py-14">
      {/* 刊頭 */}
      <header className="relative">
        <div className="flex items-center justify-between font-display text-xs uppercase tracking-[0.35em] text-muted">
          <span>The Morning Letter</span>
          <span className="hidden sm:inline">Archive of Daily Briefs</span>
        </div>
        <div className="mt-6 flex items-end justify-between gap-6">
          <div>
            <h1 className="text-5xl font-light tracking-[0.35em] sm:text-7xl">每日晨報</h1>
            <p className="mt-4 text-sm tracking-[0.4em] text-ink-soft">寄信紀錄・一日一信</p>
          </div>
          <p
            aria-hidden
            className="hidden text-lg tracking-[0.5em] text-accent [writing-mode:vertical-rl] sm:block"
          >
            日日是好日
          </p>
        </div>
        <div className="mt-8 border-t-[3px] border-double border-ink" />
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ink py-3 font-display text-sm tracking-[0.2em]">
          <span>
            {loading ? "Loading…" : `Vol. ${emails.length}`}
            {latest && (
              <span className="ml-4 text-muted">
                {latest.date}（{latest.weekday}）
              </span>
            )}
          </span>
          <button
            onClick={load}
            disabled={loading}
            className="border border-ink px-4 py-1 font-serif text-xs tracking-[0.3em] transition-colors hover:bg-ink hover:text-paper disabled:opacity-40"
          >
            {loading ? "更新中…" : "重新整理"}
          </button>
        </div>
      </header>

      {error && <p className="mt-10 border-l-2 border-accent pl-4 text-sm text-accent">讀取失敗：{error}</p>}

      {!loading && !error && emails.length === 0 && (
        <p className="py-32 text-center tracking-[0.3em] text-muted">尚無寄信紀錄。待第一封信寄出，便會刊載於此。</p>
      )}

      {emails.length > 0 && selected && (
        <div className="mt-12 grid gap-14 md:grid-cols-[14rem_1fr] md:gap-12">
          {/* 目次 */}
          <nav className="md:sticky md:top-10 md:self-start">
            <h2 className="mb-4 flex items-baseline gap-3 border-b border-ink pb-2">
              <span className="text-base tracking-[0.4em]">目次</span>
              <span className="font-display text-xs uppercase tracking-[0.3em] text-muted">Contents</span>
            </h2>
            <ul className="max-h-[60vh] overflow-y-auto">
              {emails.map((email) => {
                const active = email.id === selected.id;
                const { date, weekday } = formatIssueDate(email.brief.date);
                return (
                  <li key={email.id}>
                    <button
                      onClick={() => setSelectedId(email.id)}
                      className={`group flex w-full items-center gap-3 border-b border-dotted border-rule py-3 text-left transition-colors ${
                        active ? "text-accent" : "hover:text-accent"
                      }`}
                    >
                      <span className="w-12 shrink-0 font-display text-sm italic">{issueNo(numberOf(email))}</span>
                      <span className="flex-1">
                        <span className="block font-display text-base tracking-wider">
                          {date}
                          <span className="ml-1 font-serif text-xs">（{weekday}）</span>
                        </span>
                        <span className="block font-display text-xs tracking-widest text-muted">
                          {formatClock(email.createdAt)}
                        </span>
                      </span>
                      <Seal status={email.status} />
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* 本期內容 */}
          <article className="min-w-0">
            <header className="mb-14 flex items-start justify-between gap-6">
              <div className="min-w-0">
                <p className="font-display text-sm italic tracking-[0.3em] text-accent">
                  Issue {issueNo(numberOf(selected))}
                </p>
                <h2 className="mt-3 text-2xl leading-relaxed font-medium tracking-[0.15em] sm:text-3xl">
                  {selected.subject}
                </h2>
                <dl className="mt-6 grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5 text-xs tracking-wider text-ink-soft">
                  <dt className="tracking-[0.3em] text-muted">寄件</dt>
                  <dd className="break-all">{selected.from}</dd>
                  <dt className="tracking-[0.3em] text-muted">收件</dt>
                  <dd className="break-all">{selected.to}</dd>
                  <dt className="tracking-[0.3em] text-muted">發送</dt>
                  <dd className="font-display text-sm">{formatDateTime(selected.createdAt)}</dd>
                  {selected.resendId && (
                    <>
                      <dt className="tracking-[0.3em] text-muted">編號</dt>
                      <dd className="break-all font-mono text-[0.7rem]">{selected.resendId}</dd>
                    </>
                  )}
                  {selected.error && (
                    <>
                      <dt className="tracking-[0.3em] text-muted">錯誤</dt>
                      <dd className="text-accent">{selected.error}</dd>
                    </>
                  )}
                </dl>
              </div>
              <Seal status={selected.status} size="lg" />
            </header>

            <BriefView brief={selected.brief} />

            <footer className="mt-20 text-center">
              <p className="tracking-[1em] text-muted">— 完 —</p>
              <p className="mt-3 font-display text-xs uppercase tracking-[0.3em] text-muted">
                Edited by AI · Delivered by Resend
              </p>
            </footer>
          </article>
        </div>
      )}
    </main>
  );
}
