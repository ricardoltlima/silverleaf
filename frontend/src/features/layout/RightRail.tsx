import { useEffect, useState } from "react";

type WeatherState = {
  location: string;
  temperatureF: number;
  windMph: number;
  summary: string;
  weatherCode: number;
} | null;

const NEWS_ITEMS = [
  { title: "Pool maintenance this Friday", time: "3h ago" },
  { title: "Neighborhood watch update", time: "5h ago" },
  { title: "Garage sale registrations open", time: "9h ago" },
  { title: "HOA monthly meeting agenda posted", time: "1d ago" }
];

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
  if (code === 0) return "☀️";
  if ([1, 2].includes(code)) return "🌤️";
  if (code === 3) return "☁️";
  if ([45, 48].includes(code)) return "🌫️";
  if ([51, 53, 55, 56, 57].includes(code)) return "🌦️";
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "🌧️";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "❄️";
  if ([95, 96, 99].includes(code)) return "⛈️";
  return "🌡️";
}

export function RightRail() {
  const [weather, setWeather] = useState<WeatherState>(null);
  const [weatherError, setWeatherError] = useState<string>("");
  const [tempUnit, setTempUnit] = useState<"F" | "C">("F");

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
        <div className="space-y-3">
          {NEWS_ITEMS.map((item) => (
            <div key={item.title} className="border-b border-slate-100 pb-2 last:border-b-0">
              <p className="text-sm font-medium text-slate-800">{item.title}</p>
              <p className="text-xs text-slate-500">{item.time}</p>
            </div>
          ))}
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
            {tempUnit === "F" ? "°F" : "°C"}
          </button>
        </div>
        {weather ? (
          <div className="space-y-1">
            <p className="text-sm text-slate-600">{weather.location}</p>
            <p className="text-2xl font-bold text-slate-900">
              {(tempUnit === "F" ? weather.temperatureF : (weather.temperatureF - 32) * (5 / 9)).toFixed(0)}
              °
              {tempUnit}
            </p>
            <p className="text-sm text-slate-700">
              <span className="mr-1">{weatherIcon(weather.weatherCode)}</span>
              {weather.summary}
            </p>
            <p className="text-xs text-slate-500">
              <span className="mr-1">🌬️</span>
              Wind {weather.windMph.toFixed(0)} mph
            </p>
          </div>
        ) : (
          <p className="text-sm text-slate-500">{weatherError || "Loading weather..."}</p>
        )}
      </section>
    </aside>
  );
}
