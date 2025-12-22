import { useNavigate, useSearchParams } from 'react-router';
import ProposalListContent from '@/components/features/proposal/ProposalList';
import { getReportListManager } from '@/api/manager/proposal';

export default function ManagerProposalList() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // 현재 탭
  const activeTab = searchParams.get('tab') || 'pending';

  // 탭 → flag 변환
  const getFlagFromTab = (tab: string): '대기' | '완료' | '반려' => {
    switch (tab) {
      case 'approved':
        return '완료';
      case 'rejected':
        return '반려';
      default:
        return '대기';
    }
  };

  return (
    <ProposalListContent
      isManager
      showWriterInfo
      onRowClick={(id, tab) => {
        const queryString = searchParams.toString();
        navigate(`/manager/proposal/view/${id}?${queryString}`);
      }}
      onFetchData={async () => {
        const flag = getFlagFromTab(activeTab);

        // project / non_project 둘 다 호출
        const [projectList, nonProjectList] = await Promise.all([
          getReportListManager(flag, 'project'),
          getReportListManager(flag, 'non_project'),
        ]);

        // 병합 + 중복 방지 (안전)
        const merged = [...projectList, ...nonProjectList].reduce((acc, cur) => {
          acc.set(cur.id, cur);
          return acc;
        }, new Map<number, any>());

        return Array.from(merged.values());
      }}
    />
  );
}
