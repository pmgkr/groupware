// pages/Proposal/ProposalView.tsx (일반 유저용)
import { useParams, useNavigate, useSearchParams } from 'react-router';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { type ApprovalState, type Step } from '@/components/features/proposal/ProposalProgress';
import { deleteReport, getReportInfo, type ReportFileDTO, type ReportInfoResponse } from '@/api/expense/proposal';
import ProposalViewContent from '@/components/features/proposal/ProposalView';

import { useUser } from '@/hooks/useUser';
import { useAppDialog } from '@/components/common/ui/AppDialog/AppDialog';
import { useAppAlert } from '@/components/common/ui/AppAlert/AppAlert';
import { CircleCheck, AlertTriangle } from 'lucide-react';

export default function ProposalView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [report, setReport] = useState<any>(null);
  const [files, setFiles] = useState<ReportFileDTO[]>([]);
  const [steps, setSteps] = useState<Step[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'draft';

  const user = useUser();
  const { addDialog } = useAppDialog();
  const { addAlert } = useAppAlert();

  // 삭제 가능 조건
  const canDelete = (() => {
    if (!report) return false;
    if (!user?.user_id) return false;

    const isWriter = report.rp_user_id === user.user_id;
    if (!isWriter) return false;

    // 문서 최종 상태가 완료 / 반려이면 삭제 불가
    if (report.rp_state === '완료' || report.rp_state === '반려') return false;

    const isWriterManager = report.rp_user_id === report.manager_id; // ✔ 팀장이 작성한 문서인지
    const managerState = report.manager_state?.trim();
    const financeState = report.finance_state?.trim();

    // user 작성한 문서
    if (!isWriterManager) {
      // 팀장 결재가 완료되면 삭제 불가
      if (managerState === '완료') return false;
      return true;
    }

    // manager 작성한 문서
    // 회계 결재가 완료되면 삭제 불가
    if (financeState === '완료') return false;

    // 그 외에는 삭제 가능
    return true;
  })();

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

  //삭제하기
  const handleDelete = () => {
    addDialog({
      title: '<span class="font-semibold">기안서 삭제</span>',
      message: `정말로 <strong>${report.rp_title}</strong> 기안서를 삭제하시겠습니까?`,
      confirmText: '삭제',
      cancelText: '취소',
      onConfirm: async () => {
        try {
          await deleteReport(id!);

          addAlert({
            title: '삭제 완료',
            message: `<p>기안서가 삭제되었습니다.</p>`,
            icon: <CircleCheck />,
            duration: 2000,
          });

          navigate(`../proposal`);
        } catch (err) {
          console.error('삭제 실패:', err);
          addAlert({
            title: '삭제 실패',
            message: `<p>삭제 처리 중 오류가 발생했습니다.</p>`,
            icon: <AlertTriangle />,
            duration: 2000,
          });
        }
      },
    });
  };

  // 목록으로 돌아가기 - 모든 쿼리 파라미터 유지
  const handleBack = () => {
    const queryString = searchParams.toString();
    navigate(`../proposal${queryString ? `?${queryString}` : ''}`);
  };

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
      //onBack={() => navigate(`../proposal?tab=${currentTab}`)} // 목록으로
      onBack={handleBack} // 목록으로
      showApprovalButtons={false} // 일반 유저는 승인/반려 버튼 없음
      onDelete={canDelete ? handleDelete : undefined} //삭제버튼
    />
  );
}
