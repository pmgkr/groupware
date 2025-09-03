// src/components/WeatherCard.tsx
import { useEffect, useState } from 'react';
import { fetchGangnamTeheran132, skyText, ptyText, type VilageRow } from '@/types/weather';

export default function Weather() {
  const [rows, setRows] = useState<VilageRow[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetchGangnamTeheran132()
      .then(setRows)
      .catch((e) => setErr(String(e)));
  }, []);

  if (err) return <div>날씨를 불러올 수 없어요 😞</div>;
  if (!rows) return <div>날씨를 불러오는 중…</div>;

  const upcoming = rows.slice(0, 8);

  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 16, maxWidth: 560 }}>
      <h3 style={{ margin: '0 0 8px' }}>강남구 테헤란로 132 단기예보</h3>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 10 }}>
        {upcoming.map((r) => (
          <li key={`${r.date}${r.time}`} style={{ display: 'grid', gridTemplateColumns: '70px 1fr', gap: 12 }}>
            <div>
              <strong>{r.time.slice(0, 2)}:00</strong>
              <div style={{ fontSize: 12, opacity: 0.7 }}>
                {r.date.slice(4, 6)}/{r.date.slice(6, 8)}
              </div>
            </div>
            <div>
              <div>
                {r.TMP ?? '-'}℃ · {skyText(r.SKY)}
                {r.PTY && r.PTY !== '0' ? ` · ${ptyText(r.PTY)}` : ''}
              </div>
              <div style={{ fontSize: 12, opacity: 0.7 }}>
                {r.POP ? `강수확률 ${r.POP}% · ` : ''}
                {r.REH ? `습도 ${r.REH}% · ` : ''}
                {r.WSD ? `풍속 ${r.WSD} m/s` : ''}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
