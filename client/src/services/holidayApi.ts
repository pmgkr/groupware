// 한국천문연구원 특일정보 API 서비스
// API 키는 환경변수에서 가져와야 합니다

import type { Holiday, HolidayResponse, HolidayApiConfig, HolidayCache } from '@/types/holiday'

class HolidayApiService {
  private baseUrl = 'https://apis.data.go.kr/B090041/openapi/service/SpcdeInfoService'
  private apiKey: string

  constructor() {

    // Vite 환경에서는 VITE_ 접두사 사용
    if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_HOLIDAY_API_KEY) {
      // API 키를 URL 디코딩
      const encodedKey = import.meta.env.VITE_HOLIDAY_API_KEY
      this.apiKey = decodeURIComponent(encodedKey)
    } else {
      this.apiKey = ''
      console.warn('공휴일 API 키가 설정되지 않았습니다. .env.local 파일에 VITE_HOLIDAY_API_KEY를 설정하세요.')
    }
  }

  /**
   * 특정 연도의 공휴일 정보를 가져옵니다
   */
  async getHolidays(year: number): Promise<Holiday[]> {
    if (!this.apiKey) {
      console.warn('공휴일 API 키가 설정되지 않았습니다. .env.local 파일에 VITE_HOLIDAY_API_KEY를 설정하세요.')
      return []
    }

    try {
      const url = `${this.baseUrl}/getHoliDeInfo`
      const params = new URLSearchParams({
        serviceKey: this.apiKey,
        solYear: year.toString(),
        numOfRows: '100',
        pageNo: '1',
        _type: 'json'
      })

      const fullUrl = `${url}?${params}`      
      const response = await fetch(fullUrl)
            
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const responseText = await response.text()

      // 응답이 JSON인지 확인
      if (!responseText.trim().startsWith('{')) {
        console.error('API 응답이 JSON이 아닙니다. 응답 내용:', responseText)
        return []
      }

      const data: HolidayResponse = JSON.parse(responseText)
      
      if (data.response?.body?.items?.item) {
        // 단일 아이템인 경우 배열로 변환
        const items = Array.isArray(data.response.body.items.item) 
          ? data.response.body.items.item 
          : [data.response.body.items.item]
        
        // console.log('API 응답 아이템:', items)
        
        // 공휴일만 필터링하고 locdate 필드를 date 필드로 매핑
        const holidays = items
          .filter(item => item.isHoliday === 'Y')
          .map(item => ({
            ...item,
            date: item.locdate.toString() // locdate를 date로 매핑
          }))
        
        // console.log('필터링된 공휴일:', holidays)
        return holidays
      }

      return []
    } catch (error) {
      console.error('공휴일 정보를 가져오는 중 오류가 발생했습니다:', error)
      return []
    }
  }

  /**
   * 특정 월의 공휴일 정보를 가져옵니다
   */
  async getHolidaysByMonth(year: number, month: number): Promise<Holiday[]> {
    const holidays = await this.getHolidays(year)
    return holidays.filter(holiday => {
      const holidayMonth = parseInt(holiday.date.substring(4, 6))
      return holidayMonth === month
    })
  }

  /**
   * 특정 날짜가 공휴일인지 확인합니다
   */
  async isHoliday(date: Date): Promise<boolean> {
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    
    const holidays = await this.getHolidaysByMonth(year, month)
    const dateString = `${year}${month.toString().padStart(2, '0')}${day.toString().padStart(2, '0')}`
    
    return holidays.some(holiday => holiday.date === dateString)
  }

  /**
   * 공휴일 이름을 가져옵니다
   */
  async getHolidayName(date: Date): Promise<string | null> {
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    
    const holidays = await this.getHolidaysByMonth(year, month)
    const dateString = `${year}${month.toString().padStart(2, '0')}${day.toString().padStart(2, '0')}`
    
    const holiday = holidays.find(h => h.date === dateString)
    return holiday ? holiday.dateName : null
  }
}

// 싱글톤 인스턴스 생성
export const holidayApiService = new HolidayApiService()

// 캐시를 위한 Map
const holidayCache = new Map<string, Holiday[]>()

/**
 * 캐시된 공휴일 정보를 가져오는 함수
 */
export async function getCachedHolidays(year: number): Promise<Holiday[]> {
  const cacheKey = `holidays_${year}`
  
  if (holidayCache.has(cacheKey)) {
    return holidayCache.get(cacheKey)!
  }

  const holidays = await holidayApiService.getHolidays(year)
  holidayCache.set(cacheKey, holidays)
  
  return holidays
}

/**
 * 특정 날짜가 공휴일인지 확인하는 함수 (캐시 사용)
 */
export async function isHolidayCached(date: Date): Promise<boolean> {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  
  const holidays = await getCachedHolidays(year)
  const dateString = `${year}${month.toString().padStart(2, '0')}${day.toString().padStart(2, '0')}`
  
  return holidays.some(holiday => holiday.date === dateString)
}

/**
 * 공휴일 이름을 가져오는 함수 (캐시 사용)
 */
export async function getHolidayNameCached(date: Date): Promise<string | null> {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  
  const holidays = await getCachedHolidays(year)
  const dateString = `${year}${month.toString().padStart(2, '0')}${day.toString().padStart(2, '0')}`
  
  const holiday = holidays.find(h => h.date === dateString)
  return holiday ? holiday.dateName : null
}

// 타입 재export
export type { Holiday, HolidayResponse, HolidayApiConfig, HolidayCache } 