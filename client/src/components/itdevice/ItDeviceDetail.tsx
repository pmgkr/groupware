import { SectionHeader } from '@components/ui/SectionHeader';
import { Navigate, useNavigate, useParams } from 'react-router';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function itDeviceDetail() {
  const { id } = useParams<{ id: string }>(); // /itdevice/:id
  const navigate = useNavigate();

  const posts = [
    {
      id: 4,
      device: 'Monitor',
      brand: 'SONY',
      model: 'sony monitor model name',
      serial: '12345687',
      purchaseAt: '2025-09-01',
      createdAt: '2025-09-02',
      user: '빙홍차',
    },
    {
      id: 3,
      device: 'Laptop',
      brand: 'SONY',
      model: 'sony Laptop model name',
      serial: '5445d26ds',
      os: 'Windows 11 Business',
      ram: '16.0GB',
      gpu: '-',
      ssdhdd: 'ssdhdd',
      purchaseAt: '2025-08-01',
      createdAt: '2025-08-02',
      user: '김원필',
    },
    {
      id: 2,
      device: 'Desktop',
      brand: 'Asus',
      model: 'Expert Book',
      serial: '12345687',
      purchaseAt: '2025-07-01',
      createdAt: '2025-07-02',
      user: '유승호',
    },
    {
      id: 1,
      device: 'Monitor',
      brand: 'LG',
      model: 'LED Monitor',
      serial: '203NTEPCT052',
      purchaseAt: '2025-06-01',
      createdAt: '2025-06-02',
      user: '이영서',
    },
  ];

  const history = [
    {
      historyId: 101,
      deviceId: 4, // device.id와 연결
      user: '구경이',
      team: 'CCD',
      createdAt: '2024-04-05',
      returnedAt: '2025-05-29',
    },
    {
      historyId: 102,
      deviceId: 4,
      user: '빙홍차',
      team: 'CCP',
      createdAt: '2025-09-02',
      returnedAt: null,
    },
    {
      historyId: 103,
      deviceId: 1,
      user: '이영서',
      team: 'CCD',
      createdAt: '2025-06-02',
      returnedAt: null,
    },
    {
      historyId: 104,
      deviceId: 2,
      user: '유승호',
      team: 'CCD',
      createdAt: '2025-07-02',
      returnedAt: null,
    },
    {
      historyId: 105,
      deviceId: 3,
      user: '김원필',
      team: 'CCP',
      createdAt: '2025-08-02',
      returnedAt: null,
    },
  ];

  //사용이력
  // 현재 장비
  const post = posts.find((p) => String(p.id) === id);

  // 이 장비의 이력
  const deviceHistories = history.filter((h) => String(h.deviceId) === id);

  // 현재 사용자 = returnedAt === null
  const currentUser = deviceHistories.find((h) => h.returnedAt === null);
  // 이전 사용자들 = returnedAt !== null
  const previousUsers = deviceHistories
    .filter((h) => h.returnedAt !== null)
    .sort((a, b) => new Date(b.returnedAt!).getTime() - new Date(a.returnedAt!).getTime());

  if (!post) return <div className="p-4">장비를 찾을 수 없습니다.</div>;
  return (
    <>
      <h2 className="mb-5 text-3xl font-bold">
        [{post.device}] {post.model}
      </h2>
      <div className="flex gap-8">
        <div className="flex-1 rounded-md border p-8">
          <SectionHeader
            title="장비 정보"
            buttonText="수정"
            buttonVariant="outline"
            buttonSize="sm"
            buttonHref="#"
            className="mb-4 shrink-0"
          />
          <div className="flex">
            <ul className="border-r pr-6 text-base leading-10">
              <li>디바이스</li>
              <li>브랜드</li>
              <li>모델</li>
              <li>시리얼넘버</li>
              {post.device === 'Laptop' && post.os && <li>OS</li>}
              {post.device === 'Laptop' && post.ram && <li>RAM</li>}
              {post.device === 'Laptop' && post.gpu && <li>GPU</li>}
              {post.device === 'Laptop' && post.ssdhdd && <li>SSD-HDD</li>}
              <li>구매일자</li>
            </ul>
            <ul className="pl-8 text-base leading-10">
              <li>{post.device}</li>
              <li>{post.brand}</li>
              <li>{post.model}</li>
              <li>{post.serial}</li>
              {post.device === 'Laptop' && post.os && <li>{post.os}</li>}
              {post.device === 'Laptop' && post.ram && <li>{post.ram}</li>}
              {post.device === 'Laptop' && post.gpu && <li>{post.gpu}</li>}
              {post.device === 'Laptop' && post.ssdhdd && <li>{post.ssdhdd}</li>}
              <li>{post.purchaseAt}</li>
            </ul>
          </div>
        </div>
        <div className="flex-1 rounded-md border p-8">
          <SectionHeader
            title="사용 이력"
            buttonText="사용자 등록"
            buttonVariant="outline"
            buttonSize="sm"
            buttonHref="#"
            className="mb-4 shrink-0"
          />
          <div className="">
            {/* 현재 사용자 */}
            {currentUser && (
              <div className="border-primary-blue-300 bg-primary-blue-100 mb-4 flex items-center justify-between rounded border p-3">
                <div className="flex items-center text-base font-medium">
                  {currentUser.user} <span className="pl-1 text-sm text-gray-500">({currentUser.team})</span>
                  <Badge className="ml-2 bg-[#FF6B6B]">현재 사용중</Badge>
                </div>

                <div className="text-sm text-gray-600">시작일: {currentUser.createdAt}</div>
              </div>
            )}

            {/* 이전 사용자들 */}
            {previousUsers.length > 0 ? (
              <div className="space-y-2">
                {previousUsers.map((h) => (
                  <div key={h.historyId} className="flex justify-between rounded border p-3">
                    <div className="text-base font-medium">
                      {h.user} <span className="text-sm text-gray-500">({h.team})</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {h.createdAt} ~ {h.returnedAt}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500"></p>
            )}
          </div>
        </div>
      </div>
      <div className="mt-3 text-right">
        <Button onClick={() => navigate('/itdevice')}>목록</Button>
      </div>
    </>
  );
}
