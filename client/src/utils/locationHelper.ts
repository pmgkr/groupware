/**
 * 위치 관련 유틸리티 함수
 */

/**
 * IP 기반 위치 정보 인터페이스
 */
export interface LocationInfo {
  latitude: number;
  longitude: number;
  city?: string;
  region?: string;
  country?: string;
}

/**
 * IP 기반 위치 정보 가져오기 (ip-api.com 사용)
 */
export async function getLocationByIP(): Promise<LocationInfo | null> {
  try {
    // ipapi.co 사용 (HTTPS 지원, 무료)
    const response = await fetch('https://ipapi.co/json/');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // ipapi.co 응답 형식
    if (data.latitude && data.longitude) {
      // 한국인 경우 위도/경도로 더 정확한 위치 추정
      let city = data.city;
      let region = data.region;
      
      // 한국이고 위도/경도가 있는 경우, 좌표 기반으로 더 정확한 위치 추정
      if (data.country_code === 'KR' && data.latitude && data.longitude) {
        // 서울 강남구 대략 범위: 위도 37.48~37.56, 경도 126.98~127.08
        const lat = data.latitude;
        const lon = data.longitude;
        
        if (lat >= 37.48 && lat <= 37.56 && lon >= 126.98 && lon <= 127.08) {
          city = 'Gangnam-gu';
          region = 'Seoul';
        }
        // 서울 노원구 대략 범위: 위도 37.63~37.68, 경도 127.05~127.10
        else if (lat >= 37.63 && lat <= 37.68 && lon >= 127.05 && lon <= 127.10) {
          city = 'Nowon-gu';
          region = 'Seoul';
        }
        // 서울 전체 범위 내에 있으면 기본값으로 강남구 사용
        else if (lat >= 37.4 && lat <= 37.7 && lon >= 126.7 && lon <= 127.2) {
          city = 'Gangnam-gu';
          region = 'Seoul';
        }
      }
      
      return {
        latitude: data.latitude,
        longitude: data.longitude,
        city: city,
        region: region,
        country: data.country_name,
      };
    }
    
    return null;
  } catch (error) {
    console.error('IP 기반 위치 정보 가져오기 실패:', error);
    return null;
  }
}

/**
 * 위도/경도를 기상청 격자 좌표(nx, ny)로 변환
 * 기상청 API 격자 좌표 변환 공식 사용
 */
export function convertLatLonToGrid(lat: number, lon: number): { nx: number; ny: number } {
  const RE = 6371.00877; // 지구 반경(km)
  const GRID = 5.0; // 격자 간격(km)
  const SLAT1 = 30.0; // 투영 위도1(degree)
  const SLAT2 = 60.0; // 투영 위도2(degree)
  const OLON = 126.0; // 기준점 경도(degree)
  const OLAT = 38.0; // 기준점 위도(degree)
  const XO = 43; // 기준점 X좌표(GRID)
  const YO = 136; // 기준점 Y좌표(GRID)

  const DEGRAD = Math.PI / 180.0;
  const RADDEG = 180.0 / Math.PI;

  const re = RE / GRID;
  const slat1 = SLAT1 * DEGRAD;
  const slat2 = SLAT2 * DEGRAD;
  const olon = OLON * DEGRAD;
  const olat = OLAT * DEGRAD;

  let sn = Math.tan(Math.PI * 0.25 + slat2 * 0.5) / Math.tan(Math.PI * 0.25 + slat1 * 0.5);
  sn = Math.log(Math.cos(slat1) / Math.cos(slat2)) / Math.log(sn);
  let sf = Math.tan(Math.PI * 0.25 + slat1 * 0.5);
  sf = Math.pow(sf, sn) * Math.cos(slat1) / sn;
  let ro = Math.tan(Math.PI * 0.25 + olat * 0.5);
  ro = re * sf / Math.pow(ro, sn);

  let ra = Math.tan(Math.PI * 0.25 + (lat) * DEGRAD * 0.5);
  ra = re * sf / Math.pow(ra, sn);
  let theta = lon * DEGRAD - olon;
  if (theta > Math.PI) theta -= 2.0 * Math.PI;
  if (theta < -Math.PI) theta += 2.0 * Math.PI;
  theta *= sn;

  const nx = Math.floor(ra * Math.sin(theta) + XO + 0.5);
  const ny = Math.floor(ro - ra * Math.cos(theta) + YO + 0.5);

  return { nx, ny };
}

/**
 * 영문 지역명을 한글로 변환 (한국 지역)
 */
function translateKoreanLocation(city: string | undefined, region: string | undefined): string {
  // 서울 지역 매핑
  const seoulDistricts: Record<string, string> = {
    'Gangnam-gu': '강남구',
    'Gangdong-gu': '강동구',
    'Gangbuk-gu': '강북구',
    'Gangseo-gu': '강서구',
    'Gwanak-gu': '관악구',
    'Gwangjin-gu': '광진구',
    'Guro-gu': '구로구',
    'Geumcheon-gu': '금천구',
    'Nowon-gu': '노원구',
    'Dobong-gu': '도봉구',
    'Dongdaemun-gu': '동대문구',
    'Dongjak-gu': '동작구',
    'Mapo-gu': '마포구',
    'Seodaemun-gu': '서대문구',
    'Seocho-gu': '서초구',
    'Seongdong-gu': '성동구',
    'Seongbuk-gu': '성북구',
    'Songpa-gu': '송파구',
    'Yangcheon-gu': '양천구',
    'Yeongdeungpo-gu': '영등포구',
    'Yongsan-gu': '용산구',
    'Eunpyeong-gu': '은평구',
    'Jongno-gu': '종로구',
    'Jung-gu': '중구',
    'Jungnang-gu': '중랑구',
  };

  // 시/도 매핑
  const provinces: Record<string, string> = {
    'Seoul': '서울',
    'Busan': '부산',
    'Daegu': '대구',
    'Incheon': '인천',
    'Gwangju': '광주',
    'Daejeon': '대전',
    'Ulsan': '울산',
    'Gyeonggi-do': '경기도',
    'Gangwon-do': '강원도',
    'Chungcheongbuk-do': '충청북도',
    'Chungcheongnam-do': '충청남도',
    'Jeollabuk-do': '전라북도',
    'Jeollanam-do': '전라남도',
    'Gyeongsangbuk-do': '경상북도',
    'Gyeongsangnam-do': '경상남도',
    'Jeju-do': '제주도',
  };

  // 서울인 경우
  if (region === 'Seoul' || city === 'Seoul') {
    if (city && seoulDistricts[city]) {
      return `서울 ${seoulDistricts[city]}`;
    }
    // city가 구 정보가 아닌 경우, 위도/경도로 추정
    // 강남구는 대략 위도 37.5, 경도 127.0 근처
    return '서울 강남구'; // 기본값
  }

  // 다른 시/도인 경우
  if (region && provinces[region]) {
    if (city) {
      // city가 한글이면 그대로 사용, 영문이면 변환 시도
      const district = seoulDistricts[city] || city;
      return `${provinces[region]} ${district}`;
    }
    return provinces[region];
  }

  // 매핑되지 않은 경우 원본 반환
  if (city && region) {
    return `${region} ${city}`;
  }
  return city || region || '서울 강남구';
}

/**
 * 위치 정보를 기반으로 지역명 반환 (한글)
 */
export function getLocationName(location: LocationInfo | null): string {
  if (!location) {
    return '서울 강남구'; // 기본값
  }
  
  // 한국인 경우 한글 변환
  if (location.country === 'South Korea' || location.country === 'Korea' || location.country === 'KR' || location.country === 'South Korea') {
    return translateKoreanLocation(location.city, location.region);
  }
  
  // 한국이 아닌 경우 원본 반환
  if (location.city && location.region) {
    return `${location.region} ${location.city}`;
  }
  return location.city || location.region || '서울 강남구';
}

