import type { VercelRequest, VercelResponse } from '@vercel/node';

const BACKEND = 'http://gbend.cafe24.com';

// 원본 바디 그대로 읽기(멀티파트/파일 업로드 지원)
function readRawBody(req: VercelRequest): Promise<Buffer | null> {
  const m = (req.method || 'GET').toUpperCase();
  if (m === 'GET' || m === 'HEAD') return Promise.resolve(null);
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

// 백엔드의 Set-Cookie를 프런트(=vercel 도메인) 쿠키로 재작성
function rewriteSetCookie(c: string, isHttps = true) {
  let out = c.replace(/;\s*Domain=[^;]*/gi, ''); // Domain 제거
  if (!/;\s*Path=/i.test(out)) out += '; Path=/'; // Path 기본값
  if (isHttps && !/;\s*Secure/i.test(out)) out += '; Secure'; // 배포는 https
  if (!/;\s*SameSite=/i.test(out)) out += '; SameSite=None'; // 호환성↑
  return out;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'OPTIONS') return res.status(204).end();

    const isHttps = String(req.headers['x-forwarded-proto'] || 'https') === 'https';
    // "/api" 접두사 제거 + 쿼리 포함
    const urlPath = (req.url || '').replace(/^\/api/, '') || '/';
    const backendURL = BACKEND + urlPath;

    // 전달할 헤더 구성(문제되는 헤더 제거)
    const fwdHeaders: Record<string, string> = {};
    for (const [k, v] of Object.entries(req.headers)) {
      if (!v) continue;
      const key = k.toLowerCase();
      if (['host', 'connection', 'accept-encoding', 'content-length'].includes(key)) continue;
      fwdHeaders[key] = Array.isArray(v) ? v.join(', ') : String(v);
    }

    const rawBody = await readRawBody(req);

    const backendResp = await fetch(backendURL, {
      method: req.method,
      headers: fwdHeaders,
      body: rawBody ?? undefined,
      // redirect: 'manual', // 필요하면 30x 직접 처리
    });

    // 일반 헤더 전달(Set-Cookie는 아래에서 따로)
    backendResp.headers.forEach((value, key) => {
      const k = key.toLowerCase();
      if (['content-length', 'connection', 'transfer-encoding', 'set-cookie'].includes(k)) return;
      res.setHeader(key, value);
    });

    // Set-Cookie 재작성
    const sc = (backendResp as any).headers.getSetCookie?.() as string[] | undefined;
    const cookies =
      (sc && sc.length ? sc : []) || (backendResp.headers.get('set-cookie') ? [backendResp.headers.get('set-cookie') as string] : []);
    cookies.forEach((c) => c && res.appendHeader('Set-Cookie', rewriteSetCookie(c, isHttps)));

    // 상태 + 바디 스트리밍
    res.status(backendResp.status);
    if (backendResp.body) {
      // @ts-ignore
      backendResp.body.pipe(res);
    } else {
      res.end();
    }
  } catch (err: any) {
    console.error('[BFF ERROR]', err);
    res.status(502).json({ ok: false, error: 'Bad Gateway via BFF', detail: String(err?.message || err) });
  }
}
