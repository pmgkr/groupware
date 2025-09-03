// Vercel api/ 폴더 안의 파일을 자동으로 서버리스 API로 배포함
// 아래 함수가 단기예보 엔드포인트를 호출하고 필요한 필드만 정리해서 프론트로 반환함
export const config = {
  runtime: 'nodejs18.x',
};

type Category = 'POP' | 'PTY' | 'REH' | 'SKY' | 'TMP' | 'WSD';

function getLatestBaseDateTime(now = new Date()) {
  // KST 기준으로 가장 최근 발표시각(02,05,08,11,14,17,20,23)을 계산
  const kst = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
  const hours = kst.getHours();
  const minutes = kst.getMinutes();
  const bases = [2, 5, 8, 11, 14, 17, 20, 23];

  let baseHour = bases.filter((h) => h < hours || (h === hours && minutes >= 0)).pop();
  if (baseHour === undefined) {
    // 00:00~01:59 → 전날 23시로
    baseHour = 23;
    kst.setDate(kst.getDate() - 1);
  }
  const y = kst.getFullYear();
  const m = String(kst.getMonth() + 1).padStart(2, '0');
  const d = String(kst.getDate()).padStart(2, '0');

  return { base_date: `${y}${m}${d}`, base_time: String(baseHour).padStart(2, '0') + '00' };
}

export default async function handler(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    // 기본 좌표: 강남구 테헤란로 132 대략 격자 (61,125)
    const nx = Number(searchParams.get('nx') ?? 61);
    const ny = Number(searchParams.get('ny') ?? 125);
    const base_date = searchParams.get('base_date');
    const base_time = searchParams.get('base_time');

    const key = process.env.KMA_SERVICE_KEY;
    if (!key) {
      return new Response(JSON.stringify({ error: 'Missing KMA_SERVICE_KEY' }), { status: 500 });
    }

    const { base_date: autoDate, base_time: autoTime } = getLatestBaseDateTime();
    const params = new URLSearchParams({
      serviceKey: key, // Decoding 키
      pageNo: '1',
      numOfRows: '500',
      dataType: 'JSON',
      base_date: base_date ?? autoDate,
      base_time: base_time ?? autoTime,
      nx: String(nx),
      ny: String(ny),
    });

    const url = 'https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst?' + params.toString();
    const res = await fetch(url);
    if (!res.ok) {
      return new Response(JSON.stringify({ error: `KMA HTTP ${res.status}` }), { status: res.status });
    }
    const json = await res.json();

    const body = json?.response?.body;
    if (!body?.items?.item) {
      // 간혹 발표 직후 비어있을 수 있으니, 한 단계 이전 발표시각으로 재시도
      const bases = getLatestBaseDateTime(new Date(Date.now() - 3 * 60 * 60 * 1000));
      const retryParams = new URLSearchParams(params);
      retryParams.set('base_date', bases.base_date);
      retryParams.set('base_time', bases.base_time);
      const retryUrl = 'https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst?' + retryParams.toString();
      const retry = await fetch(retryUrl);
      const retryJson = await retry.json();
      const rb = retryJson?.response?.body;
      if (!rb?.items?.item) {
        return new Response(JSON.stringify({ error: 'Empty response from KMA' }), { status: 502 });
      }
      return new Response(JSON.stringify(simplify(rb.items.item)), {
        headers: corsJsonHeaders(),
      });
    }

    return new Response(JSON.stringify(simplify(body.items.item)), {
      headers: corsJsonHeaders(),
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: String(e?.message || e) }), { status: 500, headers: corsJsonHeaders() });
  }
}

function corsJsonHeaders() {
  // 로컬 개발 시 Vite(:5173)에서 접근해도 되도록 CORS 허용
  return {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  };
}

type RawItem = { category: Category; fcstDate: string; fcstTime: string; fcstValue: string };

function simplify(items: RawItem[]) {
  // fcstDate+fcstTime 별로 묶고, 필요한 카테고리만 추림
  const byKey = new Map<string, Partial<Record<Category, string>>>();
  for (const it of items) {
    const key = `${it.fcstDate}${it.fcstTime}`;
    const now = byKey.get(key) ?? {};
    now[it.category] = it.fcstValue;
    byKey.set(key, now);
  }
  return Array.from(byKey.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([k, v]) => ({
      date: k.slice(0, 8),
      time: k.slice(8, 12),
      TMP: v.TMP, // 기온℃
      SKY: v.SKY, // 하늘상태(1 맑음, 3 구름많음, 4 흐림)
      PTY: v.PTY, // 강수형태(0 없음, 1 비, 2 비/눈, 3 눈, 4 소나기, 5~7 약식코드)
      POP: v.POP, // 강수확률%
      REH: v.REH, // 습도%
      WSD: v.WSD, // 풍속 m/s
    }));
}
