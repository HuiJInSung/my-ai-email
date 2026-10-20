"use client";

import { useEffect, useState } from "react";
import type { Headlines } from "@/lib/daily-brief/headlines";

const KANJI_NUMERALS = ["一", "二", "三", "四", "五", "六", "七", "八", "九", "十"];

type FetchResult = { ok: true; data: Headlines } | { ok: false; error: string };

async function fetchHeadlines(): Promise<FetchResult> {
  try {
    const res = await fetch("/api/headlines", { cache: "no-store" });
    const result = await res.json();
    if (!res.ok || !result.ok) throw new Error(result.error ?? `API 回應 ${res.status}`);
    return { ok: true, data: result };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

const formatTime = (iso: string) =>
  new Date(iso).toLocaleString("zh-TW", {
    timeZone: "Asia/Taipei",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

// 即時的台灣國內重大新聞，與下方的寄信紀錄無關
export default function TodayHeadlines() {
  const [result, setResult] = useState<FetchResult | null>(null);

  useEffect(() => {
    fetchHeadlines().then(setResult);
  }, []);

  return (
    <section className="mt-20">
      <header className="mb-6 flex items-baseline gap-4 border-b border-ink pb-2">
        <h2 className="text-base tracking-[0.4em]">今日要聞</h2>
        <span className="font-display text-xs uppercase tracking-[0.3em] text-muted">Headlines · Taiwan</span>
        {result?.ok && (
          <span className="ml-auto hidden text-xs tracking-[0.2em] text-muted sm:inline">{result.data.source}</span>
        )}
      </header>

      {!result && <p className="py-6 text-sm tracking-[0.3em] text-muted">讀取要聞中…</p>}
      {result && !result.ok && <p className="text-sm italic text-muted">— 要聞暫時無法取得：{result.error}</p>}

      {result?.ok && (
        <ol className="grid gap-x-10 md:grid-cols-2">
          {result.data.items.map((item, i) => (
            <li key={item.link} className="flex gap-4 border-b border-dotted border-rule py-4">
              <span className="w-5 shrink-0 pt-0.5 text-center text-sm text-accent">{KANJI_NUMERALS[i] ?? i + 1}</span>
              <div className="min-w-0">
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="leading-7 decoration-accent decoration-1 underline-offset-4 hover:underline"
                >
                  {item.title}
                </a>
                <p className="mt-1 text-xs tracking-wider text-muted">
                  {item.publisher}
                  {item.publisher && item.publishedAt && "・"}
                  {item.publishedAt && <span className="font-display">{formatTime(item.publishedAt)}</span>}
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
