import dns from "node:dns";
import mongoose from "mongoose";

// 部分 Windows 環境下 Node 讀到的 DNS 只有 127.0.0.1，導致 mongodb+srv 的 SRV 查詢 ECONNREFUSED；
// 只在 DNS 全是 loopback 時改用公共 DNS（dns 與 dns.promises 的設定各自獨立，MongoDB driver 用的是 dns.promises）
const PUBLIC_DNS = ["8.8.8.8", "1.1.1.1"];
const isLoopback = (server: string) => server.startsWith("127.") || server === "::1";
if (dns.getServers().every(isLoopback)) dns.setServers(PUBLIC_DNS);
if (dns.promises.getServers().every(isLoopback)) dns.promises.setServers(PUBLIC_DNS);

// 開發模式下熱更新會重新載入模組，把連線快取在 global 上避免重複連線
const globalForMongoose = globalThis as unknown as {
  mongooseConnection?: Promise<typeof mongoose>;
};

export function connectToDatabase(): Promise<typeof mongoose> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("缺少環境變數 MONGODB_URI");

  globalForMongoose.mongooseConnection ??= mongoose.connect(uri).catch((error) => {
    // 連線失敗時清掉快取，下次請求才會重試
    globalForMongoose.mongooseConnection = undefined;
    throw error;
  });

  return globalForMongoose.mongooseConnection;
}
