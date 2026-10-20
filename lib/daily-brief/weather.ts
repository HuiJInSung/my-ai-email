// 天氣資料來源：Open-Meteo（免 token）
const TAIPEI = { name: "台北", latitude: 25.033, longitude: 121.5654 };

const WEATHER_CODES: Record<number, string> = {
  0: "晴朗",
  1: "大致晴朗",
  2: "局部多雲",
  3: "陰天",
  45: "有霧",
  48: "霧凇",
  51: "毛毛雨（小）",
  53: "毛毛雨（中）",
  55: "毛毛雨（大）",
  61: "小雨",
  63: "中雨",
  65: "大雨",
  80: "陣雨（小）",
  81: "陣雨（中）",
  82: "陣雨（大）",
  95: "雷雨",
  96: "雷雨伴隨冰雹",
  99: "強烈雷雨伴隨冰雹",
};

export type Weather = {
  location: string;
  date: string;
  description: string;
  currentTemperature: number;
  apparentTemperature: number;
  humidity: number;
  maxTemperature: number;
  minTemperature: number;
  precipitationProbability: number;
};

export async function getTodayWeather(): Promise<Weather> {
  const params = new URLSearchParams({
    latitude: String(TAIPEI.latitude),
    longitude: String(TAIPEI.longitude),
    current: "temperature_2m,apparent_temperature,relative_humidity_2m,weather_code",
    daily: "temperature_2m_max,temperature_2m_min,precipitation_probability_max",
    timezone: "Asia/Taipei",
    forecast_days: "1",
  });

  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
  if (!res.ok) throw new Error(`Open-Meteo 回應 ${res.status}`);
  const data = await res.json();

  return {
    location: TAIPEI.name,
    date: data.daily.time[0],
    description: WEATHER_CODES[data.current.weather_code] ?? `天氣代碼 ${data.current.weather_code}`,
    currentTemperature: data.current.temperature_2m,
    apparentTemperature: data.current.apparent_temperature,
    humidity: data.current.relative_humidity_2m,
    maxTemperature: data.daily.temperature_2m_max[0],
    minTemperature: data.daily.temperature_2m_min[0],
    precipitationProbability: data.daily.precipitation_probability_max[0],
  };
}
