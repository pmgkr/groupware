// pages/Admin/Proposal/ProposalList.tsx
import { useNavigate } from 'react-router';
import { useMemo } from 'react';
import ProposalListContent from '@/components/features/proposal/ProposalList';
import { getReportListAdmin } from '@/api/admin/proposal';
import { useUser } from '@/hooks/useUser';

export default function AdminProposalList() {
  const navigate = useNavigate();
  const { user_id, user_level } = useUser();

  const isAdmin = user_level === 'admin';
  const GM_ADMINS = ['sangmin.kang@pmgasia.com'];

  const adminRole = useMemo<'finance' | 'gm' | null>(() => {
    if (!isAdmin) return null;
    const safeUserId = user_id ?? '';
    return GM_ADMINS.includes(safeUserId) ? 'gm' : 'finance';
  }, [isAdmin, user_id]);

  return (
    <ProposalListContent
      isAdmin={true}
      adminRole={adminRole}
      showWriterInfo={true}
      onRowClick={(id, tab) => navigate(`/admin/proposal/${id}?tab=${tab}`)}
      onFetchData={async (params) => {
        return await getReportListAdmin(params);
      }}
    />
  );
}
