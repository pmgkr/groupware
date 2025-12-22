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
import { notificationApi } from '@/api/notification';

export default function ManagerProposalView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [report, setReport] = useState<any>(null);
  const [files, setFiles] = useState<ReportFileDTO[]>([]);
  const [steps, setSteps] = useState<Step[]>([]);
  const [lines, setLines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const user = useUser();
  const [searchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'pending';

  // 데이터 가져오기
  useEffect(() => {
    if (!id) return;

    (async () => {
      try {
        const data = await getReportInfoManager(id);
        setReport(data.report);
        setFiles(data.files || []);
        setLines(data.lines || []);

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

  // 다음 결재자 찾기
  const getNextApprover = () => {
    try {
      if (!Array.isArray(lines) || lines.length === 0) {
        return null;
      }

      // 현재 승인한 사람의 order 찾기
      const currentLine = lines.find((line) => line.rl_approver_id === user?.user_id);

      if (!currentLine) {
        console.error('[NEXT] 현재 승인자를 결재선에서 찾을 수 없음');
        return null;
      }

      const currentOrder = currentLine.rl_order;

      // 다음 order의 결재자 찾기
      const nextOrder = currentOrder + 1;
      const nextLine = lines.find((line) => line.rl_order === nextOrder);

      if (!nextLine) {
        console.log('[NEXT] 다음 결재자 없음 (최종 승인)');
        return null;
      }

      return {
        user_id: nextLine.rl_approver_id,
        user_name: nextLine.rl_approver_name,
      };
    } catch (e) {
      console.error('[NEXT] 결재선 조회 실패:', e);
      return null;
    }
  };

  // 목록으로 돌아가기 - 모든 쿼리 파라미터 유지
  const handleBack = () => {
    const queryString = searchParams.toString();
    navigate(`/manager/proposal${queryString ? `?${queryString}` : ''}`);
  };

  // 승인 처리
  const handleApprove = async () => {
    if (!id || !user?.user_id) {
      alert('사용자 정보가 없어 승인할 수 없습니다.');
      return;
    }

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
          // 1. 먼저 승인 처리
          await approveReport(id, user.user_id!);

          // 🔔 알림 보내기
          // URL 결정: project_type에 따라 분기
          const isProject = report.rp_project_type === 'project';
          const userUrl = isProject ? `/project/proposal/view/${id}` : `/expense/proposal/view/${id}`;
          const adminUrl = `/admin/proposal/${id}`;

          // ✅ 카테고리별 메시지 생성
          const categoryLabel = (() => {
            if (isProject) return '프로젝트';
            return report.rp_category || ''; // 일반비용, 교육비, 구매요청 등
          })();

          console.log('🔍 알림 URL:', { userUrl, adminUrl, isProject });
          // 2. 작성자에게 알림
          try {
            const notificationData = {
              user_id: report.rp_user_id,
              user_name: report.rp_user_name,
              noti_target: user.user_id!,
              noti_title: report.rp_title,
              noti_message: `${categoryLabel} 기안서를 승인하였습니다.`,
              noti_type: 'proposal',
              noti_url: userUrl,
            };

            const notiResult1 = await notificationApi.registerNotification(notificationData);
            console.log(' 작성자 알림 성공:', notiResult1);
          } catch (err) {
            console.error('❌ 작성자 알림 전송 실패:', err);
            console.error('❌ 에러 상세:', JSON.stringify(err, null, 2));
          }

          // 3. 다음 결재자 조회 및 알림
          const nextApprover = await getNextApprover();
          //console.log('🔍 조회된 다음 결재자:', nextApprover);

          if (nextApprover?.user_id) {
            try {
              const notificationData = {
                user_id: nextApprover.user_id,
                user_name: nextApprover.user_name,
                noti_target: report.rp_user_id,
                noti_title: report.rp_title,
                noti_message: `${categoryLabel} 기안서 결재 요청 하였습니다.`,
                noti_type: 'proposal',
                noti_url: adminUrl,
              };

              console.log('📦 알림 데이터:', notificationData);

              const notiResult2 = await notificationApi.registerNotification(notificationData);
              console.log('다음 결재자 알림 성공:', notiResult2);
            } catch (err) {
              console.error('❌ 다음 결재자 알림 전송 실패:', err);
              console.error('❌ 에러 상세:', JSON.stringify(err, null, 2));
            }
          } else {
            console.log('ℹ️ 다음 결재자 없음 (최종 승인)');
          }

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
          console.log('✅ 반려 완료');

          // 🔔 기안서 작성자에게 반려 알림
          // URL 결정: project_type에 따라 분기
          const isProject = report.rp_project_type === 'project';
          const userUrl = isProject ? `/project/proposal/view/${id}` : `/expense/proposal/view/${id}`;
          const categoryLabel = (() => {
            if (isProject) return '프로젝트';
            return report.rp_category || ''; // 일반비용, 교육비, 구매요청 등
          })();

          //console.log('🔍 반려 알림 URL:', { userUrl, isProject });
          //console.log('📤 작성자 반려 알림 전송 시작 - target:', report.rp_user_id);

          try {
            const notiResult = await notificationApi.registerNotification({
              user_id: report.rp_user_id,
              user_name: report.rp_user_name,
              noti_target: user.user_id!,
              noti_title: report.rp_title,
              noti_message: `${categoryLabel} 기안서를 반려하였습니다.`,
              noti_type: 'proposal',
              noti_url: userUrl,
            });
            console.log('✅ 반려 알림 성공:', notiResult);
          } catch (err) {
            console.error('❌ 반려 알림 전송 실패:', err);
          }

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

  return (
    <ProposalViewContent
      report={report}
      steps={steps}
      files={files}
      //onBack={() => navigate(`../proposal?tab=${currentTab}`)}
      onBack={handleBack}
      showWriterInfo={true}
      writerTeamName={writerTeamName}
      showApprovalButtons={canApprove}
      onApprove={handleApprove}
      onReject={handleReject}
    />
  );
}
