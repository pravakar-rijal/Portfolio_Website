import React, { useState, useEffect } from 'react';

const WMO: Record<number, { icon: string; label: string }> = {
  0: { icon: '☀️', label: 'Clear'     },
  1: { icon: '🌤️', label: 'Clear'     },
  2: { icon: '⛅', label: 'Cloudy'    },
  3: { icon: '☁️', label: 'Overcast'  },
  45:{ icon: '🌫️', label: 'Fog'       },
  48:{ icon: '🌫️', label: 'Fog'       },
  51:{ icon: '🌦️', label: 'Drizzle'   },
  61:{ icon: '🌧️', label: 'Rain'      },
  63:{ icon: '🌧️', label: 'Rain'      },
  65:{ icon: '🌧️', label: 'Heavy rain'},
  71:{ icon: '🌨️', label: 'Snow'      },
  80:{ icon: '🌦️', label: 'Showers'   },
  95:{ icon: '⛈️', label: 'Thunder'   },
};

export default function WeatherWidget() {
  const [weather, setWeather] = useState<{ temp: number; icon: string; label: string } | null>(null);

  useEffect(() => {
    const load = () =>
      fetch('https://api.open-meteo.com/v1/forecast?latitude=27.7172&longitude=85.3240&current_weather=true&timezone=Asia%2FKathmandu')
        .then(r => r.json())
        .then(d => {
          const cw   = d.current_weather;
          const info = WMO[cw.weathercode] || { icon: '🌡️', label: '' };
          setWeather({ temp: Math.round(cw.temperature), icon: info.icon, label: info.label });
        })
        .catch(() => {});

    load();
    const t = setInterval(load, 10 * 60 * 1000); // refresh every 10 min
    return () => clearInterval(t);
  }, []);

  if (!weather) return null;

  return (
    <div className="flex items-center gap-1.5 text-xs text-gray-400 cursor-default" title={`Kathmandu: ${weather.label}`}>
      <span>{weather.icon}</span>
      <span className="font-mono tabular-nums">{weather.temp}°C</span>
    </div>
  );
}
