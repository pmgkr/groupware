// pages/Manager/Proposal/ProposalList.tsx
import { useNavigate } from 'react-router';
import { useEffect, useState } from 'react';
import ProposalListContent from '@/components/features/proposal/ProposalList';
import { getReportListManager, type ManagerReportCard } from '@/api/manager/proposal';

export default function ManagerProposalList() {
  const [reports, setReports] = useState<ManagerReportCard[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const data = await getReportListManager();
        setReports(data);
      } catch (err) {
        console.error('❌ 매니저용 보고서 목록 불러오기 실패:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return <div className="p-6 text-center">로딩 중...</div>;
  }

  return (
    <ProposalListContent
      reports={reports}
      isManager={true}
      showWriterInfo={true}
      showRegisterButton={false}
      onRowClick={(id, tab) => navigate(`view/${id}?tab=${tab}`)}
    />
  );
}
