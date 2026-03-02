import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchNews, type NewsItem } from "@/features/board/boardApi";

const WEATHER_UNIT_KEY = "silverleaf_weather_unit";

type WeatherState = {
  location: string;
  temperatureF: number;
  windMph: number;
  summary: string;
  weatherCode: number;
} | null;

function weatherLabel(code: number): string {
  if (code === 0) return "Clear";
  if ([1, 2, 3].includes(code)) return "Partly cloudy";
  if ([45, 48].includes(code)) return "Fog";
  if ([51, 53, 55, 56, 57].includes(code)) return "Drizzle";
  if ([61, 63, 65, 66, 67].includes(code)) return "Rain";
  if ([71, 73, 75, 77].includes(code)) return "Snow";
  if ([80, 81, 82].includes(code)) return "Rain showers";
  if ([85, 86].includes(code)) return "Snow showers";
  if ([95, 96, 99].includes(code)) return "Thunderstorm";
  return "Unknown";
}

function weatherIcon(code: number): string {
  if (code === 0) return "\u2600\uFE0F";
  if ([1, 2, 3].includes(code)) return "\u2601\uFE0F";
  if ([45, 48].includes(code)) return "\uD83C\uDF2B\uFE0F";
  if ([51, 53, 55, 56, 57].includes(code)) return "\uD83C\uDF26\uFE0F";
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "\uD83C\uDF27\uFE0F";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "\u2744\uFE0F";
  if ([95, 96, 99].includes(code)) return "\u26C8\uFE0F";
  return "\uD83C\uDF21\uFE0F";
}

function newsTimeLabel(createdAt: string): string {
  const diffMs = Date.now() - Date.parse(createdAt);
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 60) return `${Math.max(diffMin, 1)}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

function isVideoUrl(url: string): boolean {
  const value = url.toLowerCase();
  return value.endsWith(".mp4") || value.endsWith(".webm") || value.endsWith(".ogg") || value.includes("/video/");
}

export function RightRail() {
  const [weather, setWeather] = useState<WeatherState>(null);
  const [weatherError, setWeatherError] = useState<string>("");
  const [tempUnit, setTempUnit] = useState<"F" | "C">(() => {
    const savedUnit = localStorage.getItem(WEATHER_UNIT_KEY);
    return savedUnit === "C" ? "C" : "F";
  });
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);

  const newsQuery = useQuery({
    queryKey: ["board", "news"],
    queryFn: fetchNews,
    refetchInterval: 15000
  });

  const topNews = useMemo(() => (newsQuery.data ?? []).slice(0, 6), [newsQuery.data]);

  useEffect(() => {
    localStorage.setItem(WEATHER_UNIT_KEY, tempUnit);
  }, [tempUnit]);

  useEffect(() => {
    let active = true;

    async function loadWeather() {
      try {
        const geoResponse = await fetch(
          "https://geocoding-api.open-meteo.com/v1/search?name=Winter%20Garden&count=1&language=en&format=json"
        );
        const geoJson = (await geoResponse.json()) as {
          results?: Array<{ latitude: number; longitude: number; name: string; admin1?: string }>;
        };
        const place = geoJson.results?.[0];
        if (!place) {
          throw new Error("Weather location unavailable");
        }

        const weatherResponse = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current=temperature_2m,weather_code,wind_speed_10m&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=auto`
        );
        const weatherJson = (await weatherResponse.json()) as {
          current?: { temperature_2m: number; weather_code: number; wind_speed_10m: number };
        };
        if (!weatherJson.current) {
          throw new Error("Weather data unavailable");
        }

        if (!active) return;
        setWeather({
          location: `${place.name}${place.admin1 ? `, ${place.admin1}` : ""}`,
          temperatureF: weatherJson.current.temperature_2m,
          windMph: weatherJson.current.wind_speed_10m,
          summary: weatherLabel(weatherJson.current.weather_code),
          weatherCode: weatherJson.current.weather_code
        });
      } catch {
        if (!active) return;
        setWeatherError("Unable to load weather.");
      }
    }

    loadWeather();
    return () => {
      active = false;
    };
  }, []);

  return (
    <aside className="hidden space-y-4 xl:block">
      <section className="card p-4">
        <h3 className="mb-3 text-lg font-semibold text-slate-900">Silverleaf News</h3>
        {newsQuery.isLoading ? <p className="text-sm text-slate-500">Loading news...</p> : null}
        {newsQuery.isError ? <p className="text-sm text-rose-700">{(newsQuery.error as Error).message}</p> : null}
        <div className="space-y-3">
          {topNews.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelectedNews(item)}
              className="w-full border-b border-slate-100 pb-2 text-left last:border-b-0"
            >
              <p className="text-sm font-medium text-slate-800 hover:underline">{item.title}</p>
              <p className="text-xs text-slate-500">{newsTimeLabel(item.createdAt)}</p>
            </button>
          ))}
          {!newsQuery.isLoading && !topNews.length ? (
            <p className="text-sm text-slate-500">No board news published yet.</p>
          ) : null}
        </div>
      </section>

      <section className="card p-4">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">Weather</h3>
          <button
            type="button"
            onClick={() => setTempUnit((unit) => (unit === "F" ? "C" : "F"))}
            className="rounded-full border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
            title="Toggle Celsius/Fahrenheit"
          >
            {tempUnit === "F" ? "F" : "C"}
          </button>
        </div>
        {weather ? (
          <div className="space-y-1">
            <p className="text-sm text-slate-600">{weather.location}</p>
            <p className="text-2xl font-bold text-slate-900">
              {(tempUnit === "F" ? weather.temperatureF : (weather.temperatureF - 32) * (5 / 9)).toFixed(0)}
              {'\u00B0'}
              {tempUnit}
            </p>
            <p className="text-sm text-slate-700">
              <span className="mr-1">{weatherIcon(weather.weatherCode)}</span>
              {weather.summary}
            </p>
            <p className="text-xs text-slate-500">
              <span className="mr-1">{"\uD83C\uDF2C\uFE0F"}</span>
              {weather.windMph.toFixed(0)} mph
            </p>
          </div>
        ) : (
          <p className="text-sm text-slate-500">{weatherError || "Loading weather..."}</p>
        )}
      </section>

      {selectedNews ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setSelectedNews(null)}
        >
          <div
            className="w-[min(640px,96vw)] rounded-2xl bg-white p-4 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-2 flex items-start justify-between gap-3">
              <h4 className="text-lg font-semibold text-slate-900">{selectedNews.title}</h4>
              <button
                type="button"
                onClick={() => setSelectedNews(null)}
                className="rounded-md border border-slate-300 px-2 py-1 text-sm text-slate-700 hover:bg-slate-100"
              >
                Close
              </button>
            </div>
            <p className="mb-3 text-xs text-slate-500">
              {selectedNews.authorName} - {new Date(selectedNews.createdAt).toLocaleString()}
            </p>
            <p className="text-sm leading-6 text-slate-700">{selectedNews.body}</p>
            {selectedNews.mediaUrls?.length ? (
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                {selectedNews.mediaUrls.map((url, index) =>
                  isVideoUrl(url) ? (
                    <video
                      key={`news-video-${index}`}
                      src={url}
                      controls
                      className="max-h-[62vh] w-full rounded bg-black object-contain"
                    />
                  ) : (
                    <a key={`news-img-${index}`} href={url} target="_blank" rel="noreferrer" className="block">
                      <img
                        src={url}
                        alt="News media"
                        className="max-h-[62vh] w-full rounded bg-slate-100 object-contain"
                      />
                    </a>
                  )
                )}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </aside>
  );
}
