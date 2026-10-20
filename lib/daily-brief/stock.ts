// 股價資料來源：台灣證交所 STOCK_DAY（免 token）
import { taipeiDate } from "./date";

const STOCK_NO = "2330";

export type StockQuote = {
  stockNo: string;
  name: string;
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  change: number;
  volume: number;
};

type TwseRow = string[];

const toNumber = (value: string) => Number(value.replace(/,/g, "").replace(/^X/, ""));

// 民國日期 115/10/19 -> 2026-10-19
const rocToIso = (roc: string) => {
  const [y, m, d] = roc.split("/");
  return `${Number(y) + 1911}-${m}-${d}`;
};

async function fetchMonth(yyyymm: string): Promise<TwseRow[]> {
  const url = `https://www.twse.com.tw/exchangeReport/STOCK_DAY?response=json&date=${yyyymm}01&stockNo=${STOCK_NO}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`證交所回應 ${res.status}`);
  const data = await res.json();
  if (data.stat !== "OK") return [];
  return data.data ?? [];
}

// 取得今天以前最近一個交易日（遇到週末或假日會往前找）
export async function getLastTradingDayQuote(): Promise<StockQuote> {
  const today = taipeiDate();
  const [year, month] = today.split("-").map(Number);
  const thisMonth = `${year}${String(month).padStart(2, "0")}`;
  const prevMonth = month === 1 ? `${year - 1}12` : `${year}${String(month - 1).padStart(2, "0")}`;

  for (const yyyymm of [thisMonth, prevMonth]) {
    const rows = (await fetchMonth(yyyymm)).filter((row) => rocToIso(row[0]) < today);
    const row = rows.at(-1);
    if (row) {
      return {
        stockNo: STOCK_NO,
        name: "台積電",
        date: rocToIso(row[0]),
        open: toNumber(row[3]),
        high: toNumber(row[4]),
        low: toNumber(row[5]),
        close: toNumber(row[6]),
        change: toNumber(row[7]),
        volume: toNumber(row[1]),
      };
    }
  }

  throw new Error("找不到最近的交易日資料");
}
