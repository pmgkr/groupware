// pages/Admin/Proposal/ProposalList.tsx
import { useNavigate, useSearchParams } from 'react-router';
import { useMemo } from 'react';
import ProposalListContent from '@/components/features/proposal/ProposalList';
import { getReportListAdmin } from '@/api/admin/proposal';
import { useUser } from '@/hooks/useUser';

export default function AdminProposalList() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user_id, user_level } = useUser();

  const isAdmin = user_level === 'admin';
  const GM_ADMINS = ['sangmin.kang@pmgasia.com', 'admin@pmgasia.com'];

  const adminRole = useMemo<'finance' | 'gm' | null>(() => {
    if (!isAdmin) return null;
    const safeUserId = user_id ?? '';
    return GM_ADMINS.includes(safeUserId) ? 'gm' : 'finance';
  }, [isAdmin, user_id]);

  return (
    <ProposalListContent
      isAdmin
      adminRole={adminRole}
      showWriterInfo
      onRowClick={(id, tab) => {
        const queryString = searchParams.toString();
        navigate(`/admin/proposal/${id}?${queryString}`);
      }}
      onFetchData={async (params) => {
        // 🔥 전체 탭일 때
        if (!params.type) {
          const baseParams = {
            page: params.page,
            size: params.size,
            q: params.q,
          };

          const [finance, gm, rejected, completed] = await Promise.all([
            getReportListAdmin({ ...baseParams, status: 'finance' }),
            getReportListAdmin({ ...baseParams, status: 'gm' }),
            getReportListAdmin({ ...baseParams, status: 'rejected' }),
            getReportListAdmin({ ...baseParams, status: 'completed' }), // 🔥 승인완료
          ]);

          // 🔥 병합 + 중복 제거
          const merged = [...finance, ...gm, ...rejected, ...completed].reduce((acc, cur) => {
            acc.set(cur.id, cur);
            return acc;
          }, new Map<number, any>());

          return Array.from(merged.values());
        }

        // pending / completed / rejected 탭
        return await getReportListAdmin(params);
      }}
    />
  );
}
