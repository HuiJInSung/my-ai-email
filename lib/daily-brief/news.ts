// 科技新聞來源：TechNews 科技新報 RSS
import Parser from "rss-parser";
import { taipeiDate } from "./date";

const FEED_URL = "https://technews.tw/feed/";
const MAX_ITEMS = 8;

export type NewsItem = {
  title: string;
  link: string;
  publishedAt: string;
  snippet: string;
};

export type TechNews = {
  source: string;
  // 今天沒有新文章時，會改用最新的幾篇，並把此欄設為 false
  isToday: boolean;
  items: NewsItem[];
};

export async function getTodayTechNews(): Promise<TechNews> {
  const feed = await new Parser().parseURL(FEED_URL);
  const today = taipeiDate();

  const items: NewsItem[] = feed.items.map((item) => ({
    title: item.title ?? "",
    link: item.link ?? "",
    publishedAt: item.isoDate ?? "",
    snippet: (item.contentSnippet ?? "").slice(0, 200),
  }));

  const todayItems = items.filter((item) => item.publishedAt && taipeiDate(new Date(item.publishedAt)) === today);
  const isToday = todayItems.length > 0;

  return {
    source: feed.title ?? FEED_URL,
    isToday,
    items: (isToday ? todayItems : items).slice(0, MAX_ITEMS),
  };
}
