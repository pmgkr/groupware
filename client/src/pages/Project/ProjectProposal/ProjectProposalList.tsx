import { useNavigate } from 'react-router';
import { useEffect, useState } from 'react';
import { getReportList, type ReportCard } from '@/api/expense/proposal';
import ProposalListContent from '@/components/features/proposal/ProposalList';

export default function ProjectProposalList() {
  const [reports, setReports] = useState<ReportCard[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // 데이터 가져오기
  useEffect(() => {
    (async () => {
      try {
        const data = await getReportList();
        const filtered = data.filter((r) => r.category == '프로젝트');

        setReports(filtered);
      } catch (err) {
        console.error('❌ 보고서 목록 불러오기 실패:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // 로딩 중
  if (loading) {
    return <div className="p-6 text-center">로딩 중...</div>;
  }
  return (
    <ProposalListContent
      reports={reports}
      onRowClick={(id, tab) => navigate(`view/${id}?tab=${tab}`)} // 클릭 시 상세 페이지로
      showRegisterButton={true} // 작성 버튼 보이기
      onRegister={() => navigate('register')} // 작성 페이지로
    />
  );
}
