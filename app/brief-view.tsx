import type { DailyBrief } from "@/lib/daily-brief";

const KANJI_NUMERALS = ["一", "二", "三", "四", "五", "六", "七", "八", "九", "十"];

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("zh-TW", { timeZone: "Asia/Taipei", hour: "2-digit", minute: "2-digit", hour12: false });

// 雜誌式段落標題：編號、英文小標、中文標題、細線
function Section({
  no,
  label,
  title,
  error,
  children,
}: {
  no: string;
  label: string;
  title: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-ink pt-5">
      <header className="mb-6 flex items-baseline gap-4">
        <span className="font-display text-3xl font-light italic text-accent">{no}</span>
        <h2 className="text-lg font-medium tracking-[0.3em]">{title}</h2>
        <span className="ml-auto font-display text-xs uppercase tracking-[0.3em] text-muted">{label}</span>
      </header>
      {error ? <p className="text-sm italic text-muted">— 本期資料暫缺：{error}</p> : children}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-dotted border-rule py-2">
      <dt className="text-xs tracking-[0.2em] text-muted">{label}</dt>
      <dd className="font-display text-lg">{value}</dd>
    </div>
  );
}

const Note = ({ children }: { children: React.ReactNode }) => (
  <p className="mt-5 text-sm leading-7 text-ink-soft">{children}</p>
);

// 顯示一份晨報的所有段落：寄語、天氣、股價、編輯選讀、國內新聞
export default function BriefView({ brief }: { brief: DailyBrief }) {
  const { weather, stock, news, summary } = brief;
  const errors = brief.errors ?? {};
  // 台股慣例：漲用朱色、跌用苔綠
  const changeColor = stock && stock.change > 0 ? "text-accent" : stock && stock.change < 0 ? "text-moss" : "text-muted";

  return (
    <div className="flex flex-col gap-14">
      <Section no="01" label="Words for Today" title="今日寄語" error={errors.summary}>
        {summary && (
          <figure className="relative px-2 sm:px-8">
            <span aria-hidden className="absolute -top-6 -left-1 font-display text-7xl leading-none text-accent/30 sm:left-2">
              「
            </span>
            <p className="mb-5 text-sm tracking-[0.25em] text-ink-soft">{summary.greeting}</p>
            <blockquote className="text-xl leading-[2.1] font-light sm:text-2xl sm:leading-[2.1]">
              {summary.encouragement}
            </blockquote>
            <span aria-hidden className="-mt-4 block text-right font-display text-7xl leading-none text-accent/30">
              」
            </span>
          </figure>
        )}
      </Section>

      <div className="grid gap-14 lg:grid-cols-2 lg:gap-10">
        <Section no="02" label="Weather" title="天氣" error={errors.weather}>
          {weather && (
            <div>
              <div className="flex items-end gap-4">
                <span className="font-display text-7xl leading-none font-light">
                  {weather.currentTemperature}
                  <span className="text-4xl">°</span>
                </span>
                <div className="pb-1 text-sm leading-6 text-ink-soft">
                  <p className="tracking-[0.2em]">{weather.location}</p>
                  <p className="tracking-[0.2em]">{weather.description}</p>
                </div>
              </div>
              <dl className="mt-6">
                <Stat label="最高／最低" value={`${weather.maxTemperature}° / ${weather.minTemperature}°`} />
                <Stat label="體感溫度" value={`${weather.apparentTemperature}°`} />
                <Stat label="濕度" value={`${weather.humidity}%`} />
                <Stat label="降雨機率" value={`${weather.precipitationProbability}%`} />
              </dl>
              {summary && <Note>{summary.weatherSummary}</Note>}
            </div>
          )}
        </Section>

        <Section no="03" label="Market" title="台積電" error={errors.stock}>
          {stock && (
            <div>
              <div className="flex items-end gap-4">
                <span className="font-display text-7xl leading-none font-light">{stock.close.toLocaleString()}</span>
                <div className="pb-1 text-sm leading-6">
                  <p className={`font-display text-lg ${changeColor}`}>
                    {stock.change > 0 ? "▲" : stock.change < 0 ? "▼" : "—"} {Math.abs(stock.change)}
                  </p>
                  <p className="font-display tracking-widest text-muted">
                    {stock.stockNo}・{stock.date.replaceAll("-", ".")}
                  </p>
                </div>
              </div>
              <dl className="mt-6">
                <Stat label="開盤" value={stock.open.toLocaleString()} />
                <Stat label="最高" value={stock.high.toLocaleString()} />
                <Stat label="最低" value={stock.low.toLocaleString()} />
                <Stat label="成交量（張）" value={Math.round(stock.volume / 1000).toLocaleString()} />
              </dl>
              {summary && <Note>{summary.stockSummary}</Note>}
            </div>
          )}
        </Section>
      </div>

      {summary && summary.newsHighlights.length > 0 && (
        <Section no="04" label="Editor's Picks" title="編輯選讀">
          <ol className="space-y-5">
            {summary.newsHighlights.map((highlight, i) => (
              <li key={highlight} className="flex gap-5">
                <span className="w-6 shrink-0 pt-0.5 text-center text-sm text-accent">{KANJI_NUMERALS[i] ?? i + 1}</span>
                <p className="leading-8">{highlight}</p>
              </li>
            ))}
          </ol>
        </Section>
      )}

      <Section
        no="05"
        label={news ? news.source : "Taiwan News"}
        title={news && !news.isToday ? "國內新聞（當日無新文・最新）" : "國內新聞"}
        error={errors.news}
      >
        {news && (
          <ul className="gap-10 md:columns-2">
            {news.items.map((item) => (
              <li key={item.link} className="mb-7 break-inside-avoid border-b border-rule pb-6">
                <p className="mb-2 font-display text-xs tracking-[0.3em] text-muted">{formatTime(item.publishedAt)}</p>
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-base leading-7 font-medium decoration-accent decoration-1 underline-offset-4 hover:underline"
                >
                  {item.title}
                </a>
                <p className="mt-2 text-sm leading-7 text-ink-soft">{item.snippet}</p>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}
