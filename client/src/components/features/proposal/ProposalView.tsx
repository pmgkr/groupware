import { useParams, useNavigate } from 'react-router';
import { dummyReports } from '@/components/report/BlockItem';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { CircleX } from '@/assets/images/icons';
import ProposalProgress, { type ApprovalState, type Step } from './ProposalProgress';
import { generateReportNumber, getReportInfo, type ReportInfoResponse } from '@/api/expense/proposal';
import { formatAmount, formatKST } from '@/utils';

export default function ProposalView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [report, setReport] = useState<any>(null);
  const [lines, setLines] = useState<any[]>([]);
  const [steps, setSteps] = useState<Step[]>([]);
  const [data, setData] = useState<ReportInfoResponse | null>(null);

  useEffect(() => {
    if (!id) return;

    (async () => {
      try {
        const data = await getReportInfo(id);
        setReport(data.report);
        setLines(data.lines);

        //step변환
        const roleLabels: Record<number, string> = {
          2: '팀장',
          3: '회계팀장',
          4: '대표',
        };

        const converted = data.lines.map((line) => ({
          label: roleLabels[line.rl_order],
          status: line.rl_state as ApprovalState,
        }));

        /* const converted = data.lines.map((line) => ({
          label: line.rl_approver_name,
          status: line.rl_state as ApprovalState,
        })); */
        setSteps(converted.slice(1, 4));
      } catch (err) {
        console.error(err);
      }
    })();
  }, [id]);

  if (!report) {
    return (
      <div className="p-6 text-center">
        <p className="mb-4 text-gray-500">해당 문서를 찾을 수 없습니다.</p>
        <Button onClick={() => navigate(-1)}>뒤로가기</Button>
      </div>
    );
  }

  //문서번호
  const reportNum = generateReportNumber(report.rp_category, report.rp_seq);

  return (
    <div>
      <div className="flex justify-between p-4 pr-1">
        <h2 className="border-gray-900 text-2xl font-bold">{report.rp_title}</h2>
      </div>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex divide-x divide-gray-300 border-t border-b border-gray-300 p-4 text-base leading-tight text-gray-500">
          <div className="px-3 pl-0">
            <span className="mr-2 text-gray-900">구분</span> {report.rp_category}
          </div>
          <div className="px-3">
            <span className="mr-2 text-gray-900">금액</span> {formatAmount(report.rp_cost)}
          </div>
          <div className="px-3">
            <span className="mr-2 text-gray-900">문서번호</span>
            {reportNum}
          </div>
          {report.rp_category === '프로젝트' && report.rp_project_no && (
            <div className="px-3">
              <span className="mr-2 text-gray-900">프로젝트 번호</span>
              {report.rp_project_no}
            </div>
          )}
          <div className="px-3">
            <span className="mr-2 text-gray-900">작성일자</span>
            {formatKST(report.rp_date)}
          </div>
        </div>
        <div className="w-[300px]">
          <ProposalProgress steps={steps} />
        </div>
      </div>

      <div className="bg-gray-200 p-5">
        <p className="mb-6 text-gray-800">{report.rp_content}</p>
      </div>
      <div className="mb-6 bg-gray-50 py-4">
        <Button
          variant="outline"
          className="hover:text-primary-blue-500 hover:bg-primary-blue-100 mr-2 text-sm [&]:border-gray-300 [&]:p-4">
          <div className="flex items-center gap-2">
            <span className="font-normal">파일명.pdf</span>
          </div>
          <CircleX className="size-4.5" />
        </Button>
      </div>

      <div className="text-right">
        <Button variant="outline" size="sm" onClick={() => navigate('..')}>
          목록
        </Button>
      </div>
    </div>
  );
}
