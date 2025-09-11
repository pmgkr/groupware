// src/types/weather.ts
export function skyText(code?: string) {
  switch (code) {
    case '1':
      return '맑음';
    case '3':
      return '구름많음';
    case '4':
      return '흐림';
    default:
      return code ? `SKY(${code})` : '-';
  }
}
export function ptyText(code?: string) {
  const map: Record<string, string> = {
    '0': '없음',
    '1': '비',
    '2': '비/눈',
    '3': '눈',
    '4': '소나기',
    '5': '빗방울',
    '6': '빗방울/눈날림',
    '7': '눈날림',
  };
  return code ? (map[code] ?? `PTY(${code})`) : '-';
}

export type VilageRow = {
  date: string;
  time: string;
  TMP?: string;
  SKY?: string;
  PTY?: string;
  POP?: string;
  REH?: string;
  WSD?: string;
};

// PMG 사무실 주소 강남구 테헤란로 132: (61,125)
export async function fetchGangnamTeheran132(): Promise<VilageRow[]> {
  const res = await fetch(`/api/kma/vilage?nx=61&ny=125`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
