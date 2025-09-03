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