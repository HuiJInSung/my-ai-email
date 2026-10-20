import type { DailyBrief } from "@/lib/daily-brief";

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("zh-TW", { timeZone: "Asia/Taipei", hour: "2-digit", minute: "2-digit" });

function Card({ title, error, children }: { title: string; error?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-black/[.08] bg-white p-6 shadow-sm dark:border-white/[.145] dark:bg-zinc-900">
      <h2 className="mb-4 text-lg font-semibold">{title}</h2>
      {error ? <p className="text-sm text-red-600 dark:text-red-400">資料取得失敗：{error}</p> : children}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-zinc-500 dark:text-zinc-400">{label}</dt>
      <dd className="text-base font-medium">{value}</dd>
    </div>
  );
}

// 顯示一份晨報的所有卡片：鼓勵、天氣、股價、AI 新聞重點、科技新聞
export default function BriefView({ brief }: { brief: DailyBrief }) {
  const { weather, stock, news, summary } = brief;
  const errors = brief.errors ?? {};
  const changeColor =
    stock && stock.change > 0 ? "text-red-600" : stock && stock.change < 0 ? "text-green-600" : "text-zinc-500";

  return (
    <div className="flex flex-col gap-6">
      <Card title="💪 給你的鼓勵" error={errors.summary}>
        {summary && (
          <div className="space-y-3">
            <p className="text-xl font-semibold">{summary.greeting}</p>
            <p className="leading-7">{summary.encouragement}</p>
          </div>
        )}
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="🌤️ 今日天氣" error={errors.weather}>
          {weather && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-baseline gap-3">
                <span className="text-4xl font-bold">{weather.currentTemperature}°C</span>
                <span className="text-zinc-600 dark:text-zinc-300">
                  {weather.location}・{weather.description}
                </span>
              </div>
              <dl className="grid grid-cols-2 gap-3">
                <Stat label="最高 / 最低" value={`${weather.maxTemperature}° / ${weather.minTemperature}°`} />
                <Stat label="體感溫度" value={`${weather.apparentTemperature}°C`} />
                <Stat label="濕度" value={`${weather.humidity}%`} />
                <Stat label="降雨機率" value={`${weather.precipitationProbability}%`} />
              </dl>
              {summary && <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-300">{summary.weatherSummary}</p>}
            </div>
          )}
        </Card>

        <Card title="📈 台積電股價" error={errors.stock}>
          {stock && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-baseline gap-3">
                <span className="text-4xl font-bold">{stock.close.toLocaleString()}</span>
                <span className={`font-medium ${changeColor}`}>
                  {stock.change > 0 ? "▲" : stock.change < 0 ? "▼" : "－"} {Math.abs(stock.change)}
                </span>
                <span className="text-sm text-zinc-500">
                  {stock.stockNo}・{stock.date}
                </span>
              </div>
              <dl className="grid grid-cols-2 gap-3">
                <Stat label="開盤" value={stock.open.toLocaleString()} />
                <Stat label="最高" value={stock.high.toLocaleString()} />
                <Stat label="最低" value={stock.low.toLocaleString()} />
                <Stat label="成交量（張）" value={Math.round(stock.volume / 1000).toLocaleString()} />
              </dl>
              {summary && <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-300">{summary.stockSummary}</p>}
            </div>
          )}
        </Card>
      </div>

      {summary && summary.newsHighlights.length > 0 && (
        <Card title="✨ AI 新聞重點">
          <ul className="list-disc space-y-2 pl-5 leading-7">
            {summary.newsHighlights.map((highlight) => (
              <li key={highlight}>{highlight}</li>
            ))}
          </ul>
        </Card>
      )}

      <Card
        title={`📰 科技新聞${news ? `（${news.source}${news.isToday ? "" : "・當日尚無新文，顯示最新"}）` : ""}`}
        error={errors.news}
      >
        {news && (
          <ul className="divide-y divide-black/[.06] dark:divide-white/[.1]">
            {news.items.map((item) => (
              <li key={item.link} className="py-3 first:pt-0 last:pb-0">
                <a href={item.link} target="_blank" rel="noopener noreferrer" className="font-medium hover:underline">
                  {item.title}
                </a>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{item.snippet}</p>
                <p className="mt-1 text-xs text-zinc-400">{formatTime(item.publishedAt)}</p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
