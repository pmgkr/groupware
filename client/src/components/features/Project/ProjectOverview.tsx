// src/components/features/Project/ProjectOverview
import { getAvatarFallback } from '@/utils';
import { useOutletContext } from 'react-router';
import { type projectMemberDTO, type ProjectViewDTO } from '@/api';
import type { ProjectLayoutContext } from '@/pages/Project/ProjectLayout';

import { Button } from '@components/ui/button';
import { TableColumn, TableColumnHeader, TableColumnHeaderCell, TableColumnBody, TableColumnCell } from '@/components/ui/tableColumn';
import { ProjectMember } from './_components/ProjectMember';

import { Edit } from '@/assets/images/icons';
import { FilePlus } from 'lucide-react';
import { format } from 'date-fns';

type Props = { data: ProjectViewDTO; members: projectMemberDTO[] };

export default function Overview() {
  const { data, members } = useOutletContext<ProjectLayoutContext>();

  const formatDate = (d?: string | Date | null) => {
    if (!d) return '';
    const date = typeof d === 'string' ? new Date(d) : d;
    return format(date, 'yyyy-MM-dd');
  };

  const sortedMembers = members
    ? [...members].sort((a, b) => {
        if (a.user_type === 'owner' && b.user_type !== 'owner') return -1;
        if (b.user_type === 'owner' && a.user_type !== 'owner') return 1;
        return 0;
      })
    : [];

  console.log(sortedMembers);

  return (
    <>
      <div className="flex min-h-160 flex-wrap justify-between py-2">
        <div className="w-[76%] tracking-tight">
          <div className="flex flex-wrap gap-[3%]">
            <div className="w-full">
              <h3 className="mb-2 text-lg font-bold text-gray-800">프로젝트 정보</h3>
              <TableColumn>
                <TableColumnHeader className="w-[15%]">
                  <TableColumnHeaderCell>프로젝트 #</TableColumnHeaderCell>
                  <TableColumnHeaderCell>프로젝트 오너</TableColumnHeaderCell>
                  <TableColumnHeaderCell>프로젝트 견적</TableColumnHeaderCell>
                </TableColumnHeader>
                <TableColumnBody>
                  <TableColumnCell>{data.project_id}</TableColumnCell>
                  <TableColumnCell>{data.owner_nm}</TableColumnCell>
                  <TableColumnCell>300,000,000</TableColumnCell>
                </TableColumnBody>
                <TableColumnHeader className="w-[15%]">
                  <TableColumnHeaderCell>클라이언트</TableColumnHeaderCell>
                  <TableColumnHeaderCell>프로젝트 기간</TableColumnHeaderCell>
                  <TableColumnHeaderCell>프로젝트 예상 지출</TableColumnHeaderCell>
                </TableColumnHeader>
                <TableColumnBody>
                  <TableColumnCell>{data.client_nm}</TableColumnCell>
                  <TableColumnCell>{`${formatDate(data.project_sdate)} ~ ${formatDate(data.project_edate)}`}</TableColumnCell>
                  <TableColumnCell>182,000,000</TableColumnCell>
                </TableColumnBody>
              </TableColumn>
            </div>
            <div className="mt-8 grid w-full grid-cols-2 grid-rows-2 gap-4">
              <div className="h-80 rounded-sm border border-gray-300 p-4">
                <h3 className="mb-2 text-lg font-bold text-gray-800">코스트</h3>
              </div>
              <div className="rounded-sm border border-gray-300 p-4">
                <h3 className="mb-2 text-lg font-bold text-gray-800">비용 차트</h3>
              </div>
              <div className="rounded-sm border border-gray-300 p-4">
                <h3 className="mb-2 text-lg font-bold text-gray-800">인보이스</h3>
              </div>
              <div className="rounded-sm border border-gray-300 p-4">
                <h3 className="mb-2 text-lg font-bold text-gray-800">비용 유형</h3>
              </div>
            </div>
          </div>
          <div className="mt-8 flex w-full items-center justify-between">
            <Button type="button" variant="outline" size="sm">
              목록
            </Button>
          </div>
        </div>
        <div className="flex w-[20%] flex-col gap-4">
          <div className="flex h-[45%] flex-col pb-4">
            <div className="mb-2 flex shrink-0 items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800">프로젝트 멤버</h2>
              <Button type="button" variant="outline" size="sm">
                <Edit />
                수정
              </Button>
            </div>
            <div className="overflow-y-auto pr-2">
              <ul className="flex flex-col gap-4">
                {sortedMembers.map((m) => (
                  <li key={m.user_id} className="flex items-center gap-2.5">
                    <ProjectMember member={m} />
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="flex h-[45%] flex-col pb-4">
            <div className="mb-2 flex shrink-0 items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800">프로젝트 히스토리</h2>
            </div>
            <div className="overflow-y-auto pr-2">
              <ul className="flex flex-col gap-4">
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
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
