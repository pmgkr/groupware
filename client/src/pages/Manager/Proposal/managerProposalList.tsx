// pages/Manager/Proposal/ProposalList.tsx (매니저용)
import { useNavigate } from 'react-router';
import { useEffect, useState } from 'react';
import ProposalListContent from '@/components/features/proposal/ProposalList';
import { getReportListManager, type ManagerReportCard, type MemberDTO } from '@/api/manager/proposal';
import { getMemberList } from '@/api';

export default function ManagerProposalList() {
  const [reports, setReports] = useState<ManagerReportCard[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [members, setMembers] = useState<MemberDTO[]>([]);

  // 결재 상태 텍스트 매핑 (팀장 전용)
  const getManagerDisplayState = (state: string | null) => {
    if (!state) return '';

    switch (state) {
      case '대기':
        return '팀장결재대기';
      case '완료':
        return '팀장결재완료';
      case '반려':
        return '팀장반려';
      default:
        return '';
    }
  };

  // 데이터 가져오기
  useEffect(() => {
    (async () => {
      try {
        const data = await getReportListManager(); // ManagerReportCard[]

        const processed = data.map((item) => ({
          ...item,
          approval_display_state: getManagerDisplayState(item.manager_state),
        }));

        setReports(processed);

        const memberList = await getMemberList();
        setMembers(memberList);
      } catch (err) {
        console.error('❌ 매니저용 보고서 목록 불러오기 실패:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // 로딩 중
  if (loading) {
    return <div className="p-6 text-center">로딩 중...</div>;
  }

  // 렌더링
  return (
    <ProposalListContent
      reports={reports}
      isManager={true}
      members={members}
      showWriterInfo={true}
      onRowClick={(id, tab) => navigate(`view/${id}?tab=${tab}`)}
      showRegisterButton={false}
    />
  );
}
