// 공휴일 관련 타입 정의

export interface Holiday {
  /** 공휴일 이름 (예: 신정, 설날, 추석) */
  dateName: string
  /** 날짜 (YYYYMMDD 형식) */
  date: string
  /** 공휴일 여부 (Y: 공휴일, N: 일반일) */
  isHoliday: 'Y' | 'N'
  /** 순서 */
  seq: number
  /** 날짜 종류 */
  dateKind: string
  /** 실제 날짜 (YYYYMMDD 형식) */
  locdate: number
}

export interface HolidayResponse {
  response: {
    body: {
      items: {
        item: Holiday[]
      }
      numOfRows: number
      pageNo: number
      totalCount: number
    }
  }
}

export interface HolidayApiConfig {
  /** API 기본 URL */
  baseUrl: string
  /** API 키 */
  apiKey: string
  /** 페이지당 항목 수 */
  numOfRows: number
  /** 응답 형식 (json, xml) */
  responseType: 'json' | 'xml'
}

export interface HolidayCache {
  /** 날짜별 공휴일 여부 캐시 */
  holidayCache: Map<string, boolean>
  /** 날짜별 공휴일 이름 캐시 */
  holidayNameCache: Map<string, string>
  /** 연도별 공휴일 목록 캐시 */
  yearHolidays: Map<number, Holiday[]>
} 

constructor() {
  console.log('환경변수 확인:', {
    VITE_HOLIDAY_API_KEY: import.meta.env?.VITE_HOLIDAY_API_KEY,
    NEXT_PUBLIC_HOLIDAY_API_KEY: process.env?.NEXT_PUBLIC_HOLIDAY_API_KEY
  })
  
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_HOLIDAY_API_KEY) {
    this.apiKey = import.meta.env.VITE_HOLIDAY_API_KEY
    console.log('Vite 환경변수에서 API 키를 가져왔습니다:', this.apiKey ? '설정됨' : '설정되지 않음')
  } else {
    // ... 기존 코드
  }
}