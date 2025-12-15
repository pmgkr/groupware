// ===== 1. User ProposalList (기존 방식 유지) =====
// pages/Proposal/ProposalList.tsx (일반 유저용)
import { useNavigate } from 'react-router';
import { useEffect, useState } from 'react';
import { getReportList, type ReportCard } from '@/api/expense/proposal';
import ProposalListContent from '@/components/features/proposal/ProposalList';

export default function ProposalList() {
  const [reports, setReports] = useState<ReportCard[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const data = await getReportList();
        const filtered = data.filter((r) => r.category !== '프로젝트');
        setReports(filtered);
      } catch (err) {
        console.error('❌ 보고서 목록 불러오기 실패:', err);
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
      onRowClick={(id, tab) => navigate(`view/${id}?tab=${tab}`)}
      showRegisterButton={true}
      onRegister={() => navigate('register')}
    />
  );
}
