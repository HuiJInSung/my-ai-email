// 台灣國內重大新聞：Google 新聞「台灣」版，保留 Google 依重要性排序的順序
import Parser from "rss-parser";

const FEED_URL = "https://news.google.com/rss/headlines/section/geo/Taiwan?hl=zh-TW&gl=TW&ceid=TW:zh-Hant";
const MAX_ITEMS = 10;

export type Headline = {
  title: string;
  publisher: string;
  link: string;
  publishedAt: string;
};

export type Headlines = {
  source: string;
  items: Headline[];
};

// Google 新聞標題格式為「標題 - 媒體名稱」
function splitPublisher(raw: string): { title: string; publisher: string } {
  const index = raw.lastIndexOf(" - ");
  return index > 0 ? { title: raw.slice(0, index), publisher: raw.slice(index + 3) } : { title: raw, publisher: "" };
}

export async function getTaiwanHeadlines(): Promise<Headlines> {
  const feed = await new Parser({ timeout: 15000 }).parseURL(FEED_URL);

  return {
    source: "Google 新聞・台灣",
    items: feed.items.slice(0, MAX_ITEMS).map((item) => ({
      ...splitPublisher(item.title ?? ""),
      link: item.link ?? "",
      publishedAt: item.isoDate ?? "",
    })),
  };
}
