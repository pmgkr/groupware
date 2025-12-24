import { FilePlus } from 'lucide-react';

type ProjectLog = {
  id: number;
  action: string;
  message: string;
  user_nm: string;
  created_at: string;
};

type Props = {
  logs: ProjectLog[];
};

export default function ProjectHistory({ logs }: Props) {
  if (!logs || logs.length === 0) {
    return <div className="flex items-center justify-center py-8 text-sm text-gray-400">프로젝트 히스토리가 없습니다.</div>;
  }

  return (
    <ul className="flex flex-col gap-4">
      {logs.map((log, idx) => (
        <li>
          <div className="relative before:absolute before:bottom-[100%] before:left-[15.5px] before:mb-1 before:h-6 before:w-[1px] before:bg-gray-400/80 first:before:hidden">
            <div className="flex items-center gap-4">
              <span className="flex size-8 items-center justify-center rounded-full bg-white ring-1 ring-gray-300">
                <FilePlus className="text-primary-blue size-4.5" />
              </span>
              <dl className="text-base leading-[1.3] text-gray-800">
                <dt>
                  <strong className="font-semibold text-gray-900">홍길동</strong>님이 프로젝트를 생성했습니다.
                </dt>
                <dd className="text-[.88em] text-gray-500">2025-11-13 19:00:00</dd>
              </dl>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
