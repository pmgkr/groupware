import { http } from '@/lib/http';

// 기상청 날씨정보
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

// 날씨 API
export const weatherApi = {
    // 현재 위치의 날씨 정보 조회 (서버 엔드포인트 사용)
    getCurrentWeather: async (): Promise<Weather> => {
        const response = await http<Weather>('/dashboard/weather', {
            method: 'POST',
        });
        return response;
    },
};
