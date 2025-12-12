// pages/Manager/Proposal/ProposalList.tsx
import { useNavigate, useSearchParams } from 'react-router';
import { useEffect, useState } from 'react';
import ProposalListContent from '@/components/features/proposal/ProposalList';
import { getReportListManager, type ManagerReportCard } from '@/api/manager/proposal';

export default function ManagerProposalList() {
  const [reports, setReports] = useState<ManagerReportCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // URL에서 탭 정보 가져오기
  const activeTab = searchParams.get('tab') || 'pending';
  const getFlagFromTab = (tab: string): '대기' | '완료' | '반려' => {
    const flagMap: Record<string, '대기' | '완료' | '반려'> = {
      pending: '대기',
      approved: '완료',
      rejected: '반려',
    };
    return flagMap[tab] || '대기';
  };

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        // 🔥 activeTab에 따라 flag 설정
        const flag = activeTab === 'approved' ? '완료' : '대기';
        console.log('📡 Fetching reports with flag:', flag);
        const data = await getReportListManager(flag);
        setReports(data);
      } catch (err) {
        console.error('❌ 매니저용 보고서 목록 불러오기 실패:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [activeTab]);

  return (
    <ProposalListContent
      isManager={true}
      showWriterInfo={true}
      onRowClick={(id, tab) => navigate(`view/${id}?tab=${tab}`)}
      onFetchData={async (params) => {
        const flag = getFlagFromTab(activeTab);
        return await getReportListManager(flag);
      }}
    />
  );
}
