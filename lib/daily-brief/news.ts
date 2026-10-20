// 國內新聞來源：中央社 RSS（政治、社會、地方），合併後依時間排序
import Parser from "rss-parser";
import { taipeiDate } from "./date";

const SOURCE = "中央社";
const FEED_URLS = [
  "https://feeds.feedburner.com/rsscna/politics",
  "https://feeds.feedburner.com/rsscna/social",
  "https://feeds.feedburner.com/rsscna/local",
];
const MAX_ITEMS = 8;

export type NewsItem = {
  title: string;
  link: string;
  publishedAt: string;
  snippet: string;
};

export type LocalNews = {
  source: string;
  // 今天沒有新文章時，會改用最新的幾篇，並把此欄設為 false
  isToday: boolean;
  items: NewsItem[];
};

export async function getTodayLocalNews(): Promise<LocalNews> {
  const parser = new Parser();
  // 任一分類失敗仍使用其他分類；全部失敗才拋錯
  const feeds = await Promise.allSettled(FEED_URLS.map((url) => parser.parseURL(url)));
  const loaded = feeds.flatMap((feed) => (feed.status === "fulfilled" ? [feed.value] : []));
  if (loaded.length === 0) {
    const reason = feeds[0].status === "rejected" ? feeds[0].reason : null;
    throw new Error(`中央社 RSS 皆無法取得：${reason instanceof Error ? reason.message : String(reason)}`);
  }

  // 同一則新聞可能出現在多個分類，依連結去重
  const byLink = new Map<string, NewsItem>();
  for (const item of loaded.flatMap((feed) => feed.items)) {
    if (!item.link || byLink.has(item.link)) continue;
    byLink.set(item.link, {
      title: item.title ?? "",
      link: item.link,
      publishedAt: item.isoDate ?? "",
      snippet: (item.contentSnippet ?? "").slice(0, 200),
    });
  }
  const items = [...byLink.values()].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

  const today = taipeiDate();
  const todayItems = items.filter((item) => item.publishedAt && taipeiDate(new Date(item.publishedAt)) === today);
  const isToday = todayItems.length > 0;

  return {
    source: SOURCE,
    isToday,
    items: (isToday ? todayItems : items).slice(0, MAX_ITEMS),
  };
}
