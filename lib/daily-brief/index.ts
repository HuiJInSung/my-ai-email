import { taipeiDate } from "./date";
import { getTodayWeather, type Weather } from "./weather";
import { getLastTradingDayQuote, type StockQuote } from "./stock";
import { getTodayLocalNews, type LocalNews } from "./news";
import { summarizeBrief, type BriefSummary } from "./summarize";

export type DailyBrief = {
  date: string;
  weather: Weather | null;
  stock: StockQuote | null;
  news: LocalNews | null;
  summary: BriefSummary | null;
  errors: Record<string, string>;
};

const errorMessage = (reason: unknown) => (reason instanceof Error ? reason.message : String(reason));

export async function getDailyBrief(): Promise<DailyBrief> {
  // 任一來源失敗不影響其他來源
  const [weather, stock, news] = await Promise.allSettled([
    getTodayWeather(),
    getLastTradingDayQuote(),
    getTodayLocalNews(),
  ]);

  const errors: Record<string, string> = {};
  if (weather.status === "rejected") errors.weather = errorMessage(weather.reason);
  if (stock.status === "rejected") errors.stock = errorMessage(stock.reason);
  if (news.status === "rejected") errors.news = errorMessage(news.reason);

  const data = {
    date: taipeiDate(),
    weather: weather.status === "fulfilled" ? weather.value : null,
    stock: stock.status === "fulfilled" ? stock.value : null,
    news: news.status === "fulfilled" ? news.value : null,
  };

  let summary = null;
  try {
    summary = await summarizeBrief(data);
  } catch (error) {
    errors.summary = errorMessage(error);
  }

  return { ...data, summary, errors };
}
