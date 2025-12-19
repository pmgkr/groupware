import { useEffect, useState } from 'react';
import { getCachedCurrentWeather } from '@/services/weatherApi';
import type { Weather as WeatherType } from '@/services/weatherApi';
import { skyText, ptyText } from '@/types/weather';

export default function Weather() {
  const [weather, setWeather] = useState<WeatherType | null>(null);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const weatherData = await getCachedCurrentWeather();
        if (weatherData) {
          setWeather(weatherData);
        }
      } catch (error) {
        console.error('날씨 정보 조회 실패:', error);
      }
    };

    fetchWeather();
  }, []);

  return (
    <div className="flex items-center gap-1">
      {weather ? (
        <>
          <span className="text-gray-800">{weather.locationName || '서울 강남구'}</span>
          <span>
            {weather.TMP ? `${weather.TMP}°C` : '-'}
            {weather.SKY && `, ${skyText(weather.SKY)}`}
            {weather.PTY && weather.PTY !== '0' && `, ${ptyText(weather.PTY)}`}
          </span>
          {weather.SKY === '1' && <span>🌤️</span>} {/* 맑음 */}
          {weather.SKY === '2' && <span>🌤️</span>} {/* 구름 조금 */}
          {weather.SKY === '3' && <span>⛅</span>} {/* 구름많음 */}
          {weather.SKY === '4' && <span>☁️</span>} {/* 흐림 */}
          {weather.PTY === '1' && <span>☔</span>} {/* 비 */}
          {weather.PTY === '2' && <span>☔☃️</span>} {/* 비/눈 */}
          {weather.PTY === '3' && <span>☃️</span>} {/* 눈 */}
          {weather.PTY === '4' && <span>🌂</span>} {/* 소나기 */}
          {weather.PTY === '5' && <span>🌧️</span>} {/* 빗방울 */}
          {weather.PTY === '6' && <span>🌧️🌨️</span>} {/* 빗방울/눈날림 */}
          {weather.PTY === '7' && <span>️❄️</span>} {/* 눈날림 */}
        </>
      ) : (
        <span>날씨 정보 로딩중</span>
      )}
    </div>
  );
}
