import { useNavigate } from 'react-router';
import { useEffect, useState } from 'react';
import ProposalListContent from '@/components/features/proposal/ProposalList';
import { getReportListManager, type ManagerReportCard } from '@/api/manager/proposal';
import { useUser } from '@/hooks/useUser';

export default function AdminProposalList() {
  const [reports, setReports] = useState<ManagerReportCard[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const { user_id, user_level } = useUser();

  /** 🔥 어드민 여부 */
  const isAdmin = user_level === 'admin';

  /** 🔥 회계 / GM 구분은 user_id 로 판별 */
  const financeAdmins = ['jihyo.kim@pmgasia.com'];
  const gmAdmins = ['sangmin.kang@pmgasia.com'];

  // undefined 방지
  const safeUserId = user_id ?? '';

  let adminRole: 'finance' | 'gm' | null = null;

  if (isAdmin) {
    if (financeAdmins.includes(safeUserId)) {
      adminRole = 'finance';
    } else if (gmAdmins.includes(safeUserId)) {
      adminRole = 'gm';
    }
  }

  useEffect(() => {
    (async () => {
      try {
        const data = await getReportListManager();
        setReports(data);
      } catch (err) {
        console.error('❌ 어드민용 보고서 목록 불러오기 실패:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="p-6 text-center">로딩 중...</div>;

  return (
    <ProposalListContent
      reports={reports}
      isManager={false}
      isAdmin={isAdmin}
      adminRole={adminRole}
      showWriterInfo={true}
      showRegisterButton={false}
      onRowClick={(id, tab) => navigate(`view/${id}?tab=${tab}`)}
    />
  );
}
