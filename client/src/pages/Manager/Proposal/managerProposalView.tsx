// pages/Manager/Proposal/ProposalView.tsx (매니저용)
import { useParams, useNavigate, useSearchParams } from 'react-router';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { type ApprovalState, type Step } from '@/components/features/proposal/ProposalProgress';
import ProposalViewContent from '@/components/features/proposal/ProposalView';
import { useUser } from '@/hooks/useUser';
import { getMemberList } from '@/api';
import { useAppDialog } from '@/components/common/ui/AppDialog/AppDialog';
import { useAppAlert } from '@/components/common/ui/AppAlert/AppAlert';
import { AlertTriangle, CircleCheck, CircleX } from 'lucide-react';
import type { ReportFileDTO } from '@/api/expense/proposal';
import { approveReport, getReportInfoManager, rejectReport } from '@/api/manager/proposal';

export default function ManagerProposalView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [report, setReport] = useState<any>(null);
  const [files, setFiles] = useState<ReportFileDTO[]>([]);
  const [steps, setSteps] = useState<Step[]>([]);
  const [loading, setLoading] = useState(true);
  const user = useUser();
  const [searchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'pending';

  // 데이터 가져오기
  useEffect(() => {
    if (!id) return;

    (async () => {
      try {
        const data = await getReportInfoManager(id); // 매니저용 API
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

  const { addDialog } = useAppDialog();
  const { addAlert } = useAppAlert();

  // 승인 처리
  const handleApprove = async () => {
    if (!id || !user?.user_id) {
      alert('사용자 정보가 없어 승인할 수 없습니다.');
      return;
    }

    // 🔥 비용매칭 경고 메시지 조건부 생성
    const matchingNotice =
      !report.rp_expense_no && ['일반비용', '교육비', '프로젝트'].includes(report.rp_category)
        ? `<br/><span style="color:#d9534f; font-weight:500; line-height: 1.5;">※ 이 기안서는 비용 기안서 매칭이 필요합니다.</span>`
        : '';

    addDialog({
      title: '<span class="font-semibold">승인 확인</span>',
      message: `이 기안서를 승인하시겠습니까?${matchingNotice}`,
      confirmText: '확인',
      cancelText: '취소',
      onConfirm: async () => {
        try {
          const res = await approveReport(id, user.user_id!);

          addAlert({
            title: '승인 완료',
            message: `<p><strong>${report.rp_title}</strong> 기안서가 승인되었습니다.</p>`,
            icon: <CircleCheck />,
            duration: 2000,
          });

          navigate('../proposal');
        } catch (err) {
          console.error('승인 실패:', err);

          addAlert({
            title: '승인 실패',
            message: `<p>승인 처리 중 오류가 발생했습니다.</p>`,
            icon: <CircleX />,
            duration: 2000,
          });
        }
      },
    });
  };

  // 반려 처리
  const handleReject = async () => {
    if (!id || !user?.user_id) {
      alert('사용자 정보가 없어 반려할 수 없습니다.');
      return;
    }

    addDialog({
      title: '<span class=" font-semibold">반려 확인</span>',
      message: `정말로 이 기안서를 반려하시겠습니까?`,
      confirmText: '확인',
      cancelText: '취소',
      onConfirm: async () => {
        try {
          await rejectReport(id, user.user_id!);

          addAlert({
            title: '반려 완료',
            message: `<p><strong>${report.rp_title}</strong> 기안서가 반려되었습니다.</p>`,
            icon: <CircleX />,
            duration: 2000,
          });

          navigate('../proposal');
        } catch (err) {
          console.error('반려 실패:', err);

          addAlert({
            title: '반려 실패',
            message: `<p>반려 처리 중 오류가 발생했습니다.</p>`,
            icon: <AlertTriangle />,
            duration: 2000,
          });
        }
      },
    });
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

  // 승인 / 반려 버튼
  const canApprove = (() => {
    if (!user?.user_id) return false;

    if (report.manager_id === user.user_id) {
      return report.manager_state === '대기';
    }

    if (report.finance_id === user.user_id) {
      return report.finance_state === '대기';
    }

    if (report.gm_id === user.user_id) {
      return report.gm_state === '대기';
    }

    return false;
  })();

  const writerTeamName = report.team_name;
  // 실제 렌더링 - 공통 컴포넌트에 데이터 전달
  return (
    <ProposalViewContent
      report={report}
      steps={steps} //프로그래스바
      files={files}
      onBack={() => navigate(`../proposal?tab=${currentTab}`)} // 목록으로
      showWriterInfo={true}
      writerTeamName={writerTeamName}
      showApprovalButtons={canApprove} // 매니저는 승인/반려 버튼 보이기
      onApprove={handleApprove} // 승인 핸들러
      onReject={handleReject} // 반려 핸들러
    />
  );
}
