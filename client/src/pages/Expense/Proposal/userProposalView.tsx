// pages/Proposal/ProposalView.tsx (일반 유저용)
import { useParams, useNavigate, useSearchParams } from 'react-router';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { type ApprovalState, type Step } from '@/components/features/proposal/ProposalProgress';
import { getReportInfo, type ReportFileDTO, type ReportInfoResponse } from '@/api/expense/proposal';
import ProposalViewContent from '@/components/features/proposal/ProposalView';

export default function ProposalView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [report, setReport] = useState<any>(null);
  const [files, setFiles] = useState<ReportFileDTO[]>([]);
  const [steps, setSteps] = useState<Step[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'draft';

  // 데이터 가져오기
  useEffect(() => {
    if (!id) return;

    (async () => {
      try {
        const data = await getReportInfo(id); // 일반 유저용 API
        setReport(data.report);
        setFiles(data.files || []);

        // Steps 생성
        const roleLabels: Record<number, string> = {
          2: '팀장',
          3: '회계팀장',
          4: '대표',
        };

        const orderedSteps = (data.lines || [])
          .filter((line) => line.rl_order >= 2 && line.rl_order <= 4)
          .sort((a, b) => a.rl_order - b.rl_order)
          .map((line) => ({
            label: roleLabels[line.rl_order] ?? `단계${line.rl_order}`,
            status: line.rl_state as ApprovalState,
          }));

        setSteps(orderedSteps);
      } catch (err) {
        console.error('❌ 기안서 조회 실패:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // 로딩 중
  if (loading) {
    return <div className="p-6 text-center">로딩 중...</div>;
  }

  // 데이터 없음
  if (!report) {
    return (
      <div className="p-6 text-center">
        <p className="mb-4 text-gray-500">해당 문서를 찾을 수 없습니다.</p>
        <Button onClick={() => navigate(-1)}>뒤로가기</Button>
      </div>
    );
  }

  // 실제 렌더링 - 공통 컴포넌트에 데이터 전달
  return (
    <ProposalViewContent
      report={report}
      files={files}
      steps={steps}
      onBack={() => navigate(`../proposal?tab=${currentTab}`)} // 목록으로
      showApprovalButtons={false} // 일반 유저는 승인/반려 버튼 없음
    />
  );
}
