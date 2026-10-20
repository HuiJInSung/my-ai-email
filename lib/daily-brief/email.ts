// 把每日晨報轉成日式雜誌風的 email HTML（table 排版 + inline style，相容各家信箱）與純文字版
import type { DailyBrief } from ".";

const escapeHtml = (value: string | number) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

// 信箱不支援 web font，用系統內建的明朝體／襯線字
const SERIF = "'Noto Serif TC','Songti TC','PMingLiU','MingLiU',Georgia,serif";
const LATIN = "Georgia,'Times New Roman',serif";

const PAPER = "#f3eee4";
const PAPER_DEEP = "#e9e2d4";
const INK = "#2b2724";
const INK_SOFT = "#5b544c";
const MUTED = "#948b7e";
const RULE = "#cfc5b4";
const ACCENT = "#a3432c";
const MOSS = "#5e6b4e";

const KANJI_NUMERALS = ["一", "二", "三", "四", "五", "六", "七", "八", "九", "十"];

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("zh-TW", { timeZone: "Asia/Taipei", hour: "2-digit", minute: "2-digit", hour12: false });

const weekdayOf = (ymd: string) =>
  new Date(`${ymd}T00:00:00+08:00`).toLocaleDateString("zh-TW", { timeZone: "Asia/Taipei", weekday: "narrow" });

const missing = (text: string) =>
  `<p style="margin:0;font-family:${SERIF};font-size:13px;font-style:italic;color:${MUTED};">— 本期資料暫缺：${escapeHtml(text)}</p>`;

const note = (text: string) =>
  `<p style="margin:18px 0 0;font-family:${SERIF};font-size:13px;line-height:26px;color:${INK_SOFT};">${escapeHtml(text)}</p>`;

// 雜誌式段落：編號、中文標題、英文小標、上方細線
function section(no: string, title: string, label: string, body: string) {
  return `
    <tr>
      <td style="padding:0 40px 44px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid ${INK};">
          <tr>
            <td style="padding:16px 0 22px;white-space:nowrap;">
              <span style="font-family:${LATIN};font-size:24px;font-style:italic;color:${ACCENT};">${no}</span>
              <span style="font-family:${SERIF};font-size:16px;letter-spacing:5px;color:${INK};padding-left:12px;">${title}</span>
            </td>
            <td align="right" style="padding:16px 0 22px;font-family:${LATIN};font-size:10px;letter-spacing:3px;text-transform:uppercase;color:${MUTED};">${escapeHtml(label)}</td>
          </tr>
          <tr>
            <td colspan="2">${body}</td>
          </tr>
        </table>
      </td>
    </tr>`;
}

// 標籤在左、數值在右、虛線分隔的數據列
function stats(rows: [string, string][]) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:18px;">${rows
    .map(
      ([label, value]) => `
      <tr>
        <td style="padding:9px 0;border-bottom:1px dotted ${RULE};font-family:${SERIF};font-size:12px;letter-spacing:3px;color:${MUTED};">${escapeHtml(label)}</td>
        <td align="right" style="padding:9px 0;border-bottom:1px dotted ${RULE};font-family:${LATIN};font-size:16px;color:${INK};">${escapeHtml(value)}</td>
      </tr>`,
    )
    .join("")}</table>`;
}

// 大數字 + 右側小字說明
function figure(big: string, side: string) {
  return `<table role="presentation" cellpadding="0" cellspacing="0"><tr>
      <td style="font-family:${LATIN};font-size:56px;line-height:56px;font-weight:300;color:${INK};padding-right:16px;">${big}</td>
      <td style="vertical-align:bottom;font-family:${SERIF};font-size:13px;line-height:22px;letter-spacing:3px;color:${INK_SOFT};">${side}</td>
    </tr></table>`;
}

export function renderBriefEmail(brief: DailyBrief): { subject: string; html: string; text: string } {
  const { date, weather, stock, news, summary, errors } = brief;
  const subject = `每日晨報｜${date}`;
  const dottedDate = date.replaceAll("-", ".");
  const weekday = weekdayOf(date);

  const words = errors.summary
    ? missing(errors.summary)
    : summary
      ? `<p style="margin:0 0 4px;font-family:${LATIN};font-size:48px;line-height:40px;color:#d9b8ad;">「</p>
         <p style="margin:0 0 16px;padding:0 12px;font-family:${SERIF};font-size:13px;letter-spacing:3px;color:${INK_SOFT};">${escapeHtml(summary.greeting)}</p>
         <p style="margin:0;padding:0 12px;font-family:${SERIF};font-size:19px;line-height:38px;font-weight:300;color:${INK};">${escapeHtml(summary.encouragement)}</p>
         <p style="margin:4px 0 0;text-align:right;font-family:${LATIN};font-size:48px;line-height:40px;color:#d9b8ad;">」</p>`
      : "";

  const weatherBody = errors.weather
    ? missing(errors.weather)
    : weather
      ? `${figure(`${escapeHtml(weather.currentTemperature)}°`, `${escapeHtml(weather.location)}<br>${escapeHtml(weather.description)}`)}
         ${stats([
           ["最高／最低", `${weather.maxTemperature}° / ${weather.minTemperature}°`],
           ["體感溫度", `${weather.apparentTemperature}°`],
           ["濕度", `${weather.humidity}%`],
           ["降雨機率", `${weather.precipitationProbability}%`],
         ])}
         ${summary ? note(summary.weatherSummary) : ""}`
      : "";

  // 台股慣例：漲用朱色、跌用苔綠
  const changeColor = stock && stock.change > 0 ? ACCENT : stock && stock.change < 0 ? MOSS : MUTED;
  const changeSign = stock && stock.change > 0 ? "▲" : stock && stock.change < 0 ? "▼" : "—";
  const stockBody = errors.stock
    ? missing(errors.stock)
    : stock
      ? `${figure(
          escapeHtml(stock.close.toLocaleString()),
          `<span style="font-family:${LATIN};font-size:17px;letter-spacing:0;color:${changeColor};">${changeSign} ${escapeHtml(Math.abs(stock.change))}</span><br>
           <span style="font-family:${LATIN};font-size:12px;color:${MUTED};">${escapeHtml(stock.stockNo)}・${escapeHtml(stock.date.replaceAll("-", "."))}</span>`,
        )}
         ${stats([
           ["開盤", stock.open.toLocaleString()],
           ["最高", stock.high.toLocaleString()],
           ["最低", stock.low.toLocaleString()],
           ["成交量（張）", Math.round(stock.volume / 1000).toLocaleString()],
         ])}
         ${summary ? note(summary.stockSummary) : ""}`
      : "";

  const picks =
    summary && summary.newsHighlights.length > 0
      ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${summary.newsHighlights
          .map(
            (highlight, i) => `
          <tr>
            <td width="30" style="vertical-align:top;padding:0 0 16px;font-family:${SERIF};font-size:13px;line-height:28px;color:${ACCENT};">${KANJI_NUMERALS[i] ?? i + 1}</td>
            <td style="vertical-align:top;padding:0 0 16px;font-family:${SERIF};font-size:15px;line-height:28px;color:${INK};">${escapeHtml(highlight)}</td>
          </tr>`,
          )
          .join("")}</table>`
      : "";

  const newsBody = errors.news
    ? missing(errors.news)
    : news
      ? news.items
          .map(
            (item) => `
          <div style="padding:0 0 20px;margin:0 0 20px;border-bottom:1px solid ${RULE};">
            <p style="margin:0 0 6px;font-family:${LATIN};font-size:11px;letter-spacing:3px;color:${MUTED};">${escapeHtml(formatTime(item.publishedAt))}</p>
            <a href="${escapeHtml(item.link)}" style="font-family:${SERIF};font-size:16px;line-height:28px;font-weight:500;color:${INK};text-decoration:none;border-bottom:1px solid ${ACCENT};">${escapeHtml(item.title)}</a>
            <p style="margin:8px 0 0;font-family:${SERIF};font-size:13px;line-height:24px;color:${INK_SOFT};">${escapeHtml(item.snippet)}</p>
          </div>`,
          )
          .join("")
      : "";

  // 直書裝飾：信箱不支援 writing-mode，改用逐字換行
  const vertical = [..."日日是好日"].join("<br>");

  const html = `<!DOCTYPE html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light only">
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:${PAPER_DEEP};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${PAPER_DEEP};">
    <tr>
      <td align="center" style="padding:32px 12px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:${PAPER};">
          <!-- 刊頭 -->
          <tr>
            <td style="padding:40px 40px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="vertical-align:top;">
                    <p style="margin:0;font-family:${LATIN};font-size:10px;letter-spacing:4px;text-transform:uppercase;color:${MUTED};">The Morning Letter</p>
                    <h1 style="margin:22px 0 0;font-family:${SERIF};font-size:40px;line-height:48px;font-weight:300;letter-spacing:12px;color:${INK};">每日晨報</h1>
                    <p style="margin:14px 0 0;font-family:${SERIF};font-size:12px;letter-spacing:5px;color:${INK_SOFT};">一日一信・為你而寫</p>
                  </td>
                  <td width="24" align="right" style="vertical-align:top;padding-top:24px;font-family:${SERIF};font-size:15px;line-height:22px;color:${ACCENT};">${vertical}</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 40px 44px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:3px double ${INK};border-bottom:1px solid ${INK};">
                <tr>
                  <td style="padding:10px 0;font-family:${LATIN};font-size:13px;letter-spacing:3px;color:${INK};">${escapeHtml(dottedDate)}<span style="font-family:${SERIF};font-size:12px;">（${escapeHtml(weekday)}）</span></td>
                  <td align="right" style="padding:10px 0;font-family:${LATIN};font-size:11px;font-style:italic;letter-spacing:2px;color:${ACCENT};">Today's Issue</td>
                </tr>
              </table>
            </td>
          </tr>
          ${section("01", "今日寄語", "Words for Today", words)}
          ${section("02", "天氣", "Weather", weatherBody)}
          ${section("03", "台積電", "Market", stockBody)}
          ${picks ? section("04", "編輯選讀", "Editor's Picks", picks) : ""}
          ${section("05", "國內新聞", news ? news.source : "Taiwan News", newsBody)}
          <!-- 結尾 -->
          <tr>
            <td align="center" style="padding:8px 40px 44px;">
              <p style="margin:0;font-family:${SERIF};font-size:13px;letter-spacing:10px;color:${MUTED};">— 完 —</p>
              <p style="margin:12px 0 0;font-family:${LATIN};font-size:10px;letter-spacing:3px;text-transform:uppercase;color:${MUTED};">Edited by AI · Delivered by Resend</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = [
    `每日晨報 ${dottedDate}（${weekday}）`,
    "",
    "01 今日寄語",
    summary ? `${summary.greeting}\n「${summary.encouragement}」` : `本期資料暫缺：${errors.summary ?? ""}`,
    "",
    "02 天氣",
    weather
      ? `${weather.location} ${weather.description} ${weather.currentTemperature}°（${weather.minTemperature}°～${weather.maxTemperature}°，降雨 ${weather.precipitationProbability}%）`
      : `本期資料暫缺：${errors.weather ?? ""}`,
    summary?.weatherSummary ?? "",
    "",
    "03 台積電",
    stock ? `${stock.date} 收盤 ${stock.close}（${changeSign}${Math.abs(stock.change)}）` : `本期資料暫缺：${errors.stock ?? ""}`,
    summary?.stockSummary ?? "",
    "",
    "04 編輯選讀",
    ...(summary?.newsHighlights.map((h, i) => `${KANJI_NUMERALS[i] ?? i + 1}、${h}`) ?? []),
    "",
    "05 國內新聞",
    ...(news?.items.map((item) => `・${item.title}\n  ${item.link}`) ?? [`本期資料暫缺：${errors.news ?? ""}`]),
    "",
    "— 完 —",
  ].join("\n");

  return { subject, html, text };
}
