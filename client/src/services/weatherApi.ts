// 기상청 날씨정보 API 서비스
// API 키는 환경변수에서 가져와야 합니다

export interface Weather {
  tdate: string;
  time: string;
  TMP: string;
  SKY: string;
  PTY: string;
  POP: string;
  REH: string;
  WSD: string;
  locationName?: string; // 위치 정보 (IP 기반)
}

export interface WeatherResponse {
  response: {
    header: {
      resultCode: string;
      resultMsg: string;
    };
    body: {
      dataType: string;
      items: {
        item: Weather | Weather[];
      };
      numOfRows: number;
      pageNo: number;
      totalCount: number;
    };
  };
}

class WeatherApiService {
  private baseUrl = 'https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0'
  private apiKey: string
  // 기본 좌표 (서울 강남구 테헤란로 132) - IP 기반 위치 추정 실패 시 사용
  private defaultNx = 61
  private defaultNy = 125
  private locationCache: { nx: number; ny: number; locationName: string } | null = null

  constructor() {
    // Vite 환경에서는 VITE_ 접두사 사용
    // .env.local 파일에 VITE_KMA_SERVICE_KEY로 설정 필요
    if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_KMA_SERVICE_KEY) {
      // API 키를 URL 디코딩
      const encodedKey = import.meta.env.VITE_KMA_SERVICE_KEY
      this.apiKey = decodeURIComponent(encodedKey)
    } else {
      this.apiKey = ''
      console.warn('날씨 API 키가 설정되지 않았습니다. .env.local 파일에 VITE_KMA_SERVICE_KEY를 설정하세요.')
    }
  }

  /**
   * 현재 날짜와 시간을 기상청 API 형식으로 변환
   */
  private getBaseDateTime(): { baseDate: string; baseTime: string } {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const date = String(now.getDate()).padStart(2, '0')
    
    // 기상청 API는 매시간 30분에 갱신되므로, 현재 시간의 이전 시간대 데이터를 가져옴
    let hour = now.getHours()
    let minute = now.getMinutes()
    
    // 30분 이전이면 이전 시간대 데이터 사용
    if (minute < 30) {
      hour = hour - 1
      if (hour < 0) hour = 23
    }
    
    const baseTime = String(hour).padStart(2, '0') + '00'
    const baseDate = `${year}${month}${date}`
    
    return { baseDate, baseTime }
  }

  /**
   * IP 기반 위치 정보를 가져와서 격자 좌표로 변환
   */
  private async getLocationCoordinates(): Promise<{ nx: number; ny: number; locationName: string }> {
    // 캐시가 있으면 캐시 사용 (1시간 유효)
    if (this.locationCache) {
      return this.locationCache;
    }

    try {
      const { getLocationByIP, convertLatLonToGrid, getLocationName } = await import('@/utils/locationHelper');
      const location = await getLocationByIP();
      
      if (location) {
        const { nx, ny } = convertLatLonToGrid(location.latitude, location.longitude);
        const locationName = getLocationName(location);
        
        // 캐시 저장
        this.locationCache = { nx, ny, locationName };
        
        // 1시간 후 캐시 삭제
        setTimeout(() => {
          this.locationCache = null;
        }, 60 * 60 * 1000);
        
        return { nx, ny, locationName };
      }
    } catch (error) {
      console.warn('IP 기반 위치 추정 실패, 기본 위치 사용:', error);
    }
    
    // 기본 위치 반환
    return { nx: this.defaultNx, ny: this.defaultNy, locationName: '서울 강남구' };
  }

  /**
   * 현재 위치의 날씨 정보를 가져옵니다
   */
  async getCurrentWeather(): Promise<Weather | null> {
    if (!this.apiKey) {
      console.warn('날씨 API 키가 설정되지 않았습니다. .env.local 파일에 VITE_KMA_SERVICE_KEY를 설정하세요.')
      return null
    }

    try {
      const { baseDate, baseTime } = this.getBaseDateTime()
      
      // IP 기반 위치 좌표 가져오기
      const { nx, ny, locationName } = await this.getLocationCoordinates()
      
      // 초단기실황 조회 (getUltraSrtNcst) - TMP, REH, PTY, WSD
      const ncstUrl = `${this.baseUrl}/getUltraSrtNcst`
      const ncstParams = new URLSearchParams({
        serviceKey: this.apiKey,
        pageNo: '1',
        numOfRows: '10',
        dataType: 'JSON',
        base_date: baseDate,
        base_time: baseTime,
        nx: nx.toString(),
        ny: ny.toString(),
      })

      // 초단기예보 조회 (getUltraSrtFcst) - SKY, POP
      const fcstUrl = `${this.baseUrl}/getUltraSrtFcst`
      const fcstParams = new URLSearchParams({
        serviceKey: this.apiKey,
        pageNo: '1',
        numOfRows: '60',
        dataType: 'JSON',
        base_date: baseDate,
        base_time: baseTime,
        nx: nx.toString(),
        ny: ny.toString(),
      })

      // 두 API를 병렬로 호출
      const [ncstResponse, fcstResponse] = await Promise.all([
        fetch(`${ncstUrl}?${ncstParams}`),
        fetch(`${fcstUrl}?${fcstParams}`)
      ])
            
      if (!ncstResponse.ok || !fcstResponse.ok) {
        throw new Error(`HTTP error! status: ${ncstResponse.status} / ${fcstResponse.status}`)
      }

      const ncstText = await ncstResponse.text()
      const fcstText = await fcstResponse.text()

      // 응답이 JSON인지 확인
      if (!ncstText.trim().startsWith('{') || !fcstText.trim().startsWith('{')) {
        console.error('API 응답이 JSON이 아닙니다.')
        return null
      }

      const ncstData: WeatherResponse = JSON.parse(ncstText)
      const fcstData: WeatherResponse = JSON.parse(fcstText)
      
      if (ncstData.response?.header?.resultCode !== '00') {
        console.error('초단기실황 API 오류:', ncstData.response?.header?.resultMsg)
        return null
      }

      if (fcstData.response?.header?.resultCode !== '00') {
        console.warn('초단기예보 API 오류:', fcstData.response?.header?.resultMsg, '- 실황 데이터만 사용합니다')
      }
      
      const weatherData: Partial<Weather> = {
        tdate: baseDate,
        time: baseTime,
      }

      // 초단기실황 데이터 파싱
      if (ncstData.response?.body?.items?.item) {
        const items = Array.isArray(ncstData.response.body.items.item) 
          ? ncstData.response.body.items.item 
          : [ncstData.response.body.items.item]
        
        items.forEach((item: any) => {
          switch (item.category) {
            case 'T1H': // 기온
              weatherData.TMP = item.obsrValue
              break
            case 'PTY': // 강수형태
              weatherData.PTY = item.obsrValue
              break
            case 'REH': // 습도
              weatherData.REH = item.obsrValue
              break
            case 'WSD': // 풍속
              weatherData.WSD = item.obsrValue
              break
          }
        })
      }

      // 초단기예보 데이터 파싱 (SKY, POP)
      if (fcstData.response?.body?.items?.item) {
        const items = Array.isArray(fcstData.response.body.items.item) 
          ? fcstData.response.body.items.item 
          : [fcstData.response.body.items.item]
        
        // 초단기예보는 현재 시간 이후의 예보 데이터
        // 가장 가까운 시간대의 SKY와 POP 데이터 찾기
        let skyFound = false
        let popFound = false
        
        items.forEach((item: any) => {
          if (!skyFound && item.category === 'SKY') {
            weatherData.SKY = item.fcstValue
            skyFound = true
          }
          if (!popFound && item.category === 'POP') {
            weatherData.POP = item.fcstValue
            popFound = true
          }
        })
        
        // 디버깅: SKY 데이터가 없으면 로그 출력
        if (!skyFound) {
          console.warn('초단기예보에서 SKY 데이터를 찾을 수 없습니다. 응답 항목 수:', items.length)
        }
      } else {
        console.warn('초단기예보 응답에 items.item이 없습니다.')
      }
      
      // TMP(기온)만 있으면 반환
      if (weatherData.TMP) {
        return {
          tdate: weatherData.tdate || baseDate,
          time: weatherData.time || baseTime,
          TMP: weatherData.TMP || '',
          SKY: weatherData.SKY || '',
          PTY: weatherData.PTY || '0',
          POP: weatherData.POP || '',
          REH: weatherData.REH || '',
          WSD: weatherData.WSD || '',
          locationName,
        }
      }

      return null
    } catch (error) {
      console.error('날씨 정보를 가져오는 중 오류가 발생했습니다:', error)
      throw error
    }
  }
}

// 싱글톤 인스턴스 생성
export const weatherApiService = new WeatherApiService()

// 로컬 캐시/백오프 설정
const CACHE_KEY = 'weather.cache'
const BACKOFF_KEY = 'weather.backoffUntil'
const CACHE_TTL_MS = 60 * 60 * 1000 // 1시간
const BACKOFF_MS = 10 * 60 * 1000 // 10분

function loadCachedWeather(): Weather | null {
  if (typeof localStorage === 'undefined') return null
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { expiresAt: number; data: Weather }
    if (Date.now() < parsed.expiresAt) {
      return parsed.data
    }
  } catch (err) {
    console.warn('날씨 캐시 읽기 실패:', err)
  }
  return null
}

function saveCachedWeather(data: Weather) {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ expiresAt: Date.now() + CACHE_TTL_MS, data })
    )
  } catch (err) {
    console.warn('날씨 캐시 저장 실패:', err)
  }
}

function getBackoffUntil(): number {
  if (typeof localStorage === 'undefined') return 0
  const raw = localStorage.getItem(BACKOFF_KEY)
  return raw ? Number(raw) || 0 : 0
}

function setBackoff(durationMs: number) {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(BACKOFF_KEY, String(Date.now() + durationMs))
}

/**
 * 캐시된 날씨 정보를 가져오는 함수
 */
export async function getCachedCurrentWeather(): Promise<Weather | null> {
  const cached = loadCachedWeather()

  // 429 등으로 백오프 중이면 캐시만 반환
  const backoffUntil = getBackoffUntil()
  if (Date.now() < backoffUntil) {
    return cached
  }

  // 캐시가 아직 유효하면 그대로 사용
  if (cached) {
    return cached
  }

  try {
    const weather = await weatherApiService.getCurrentWeather()
    if (weather) {
      saveCachedWeather(weather)
      return weather
    }
    return cached
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    if (message.includes('429')) {
      setBackoff(BACKOFF_MS)
    }
    return cached
  }
}
