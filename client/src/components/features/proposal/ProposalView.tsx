import { Button } from '@/components/ui/button';
import ProposalProgress, { type Step } from '@/components/features/proposal/ProposalProgress';
import { generateReportNumber } from '@/api/expense/proposal';
import { formatAmount, formatKST } from '@/utils';
import 'quill/dist/quill.snow.css';
import { Link } from 'react-router';
import ProposalAttachFiles from './ProposalAttachFiles';

interface ProposalViewContentProps {
  report: any;
  steps: Step[];
  onBack: () => void;
  // 매니저용 추가 props (옵셔널)
  showWriterInfo?: boolean;
  writerTeamName?: string;
  showApprovalButtons?: boolean;
  onApprove?: () => void;
  onReject?: () => void;
  onDelete?: () => void;

  // 파일 리스트 추가
  files?: {
    rf_seq: number;
    rp_seq: number;
    rf_name: string;
    rf_type: string;
    rf_uploaded_at: string;
    rf_sname?: string; // 서버 저장명 있을 수 있음
  }[];
}

export default function ProposalView({
  report,
  steps,
  files = [],
  onBack,
  onApprove,
  onReject,
  onDelete,
  showApprovalButtons = false,
  showWriterInfo = false,
  writerTeamName,
}: ProposalViewContentProps) {
  return (
    <div>
      <div className="flex justify-between p-4 pr-1">
        <h2 className="border-gray-900 text-2xl font-bold">{report.rp_title}</h2>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <div className="flex divide-x divide-gray-300 border-t border-b border-gray-300 p-4 text-base leading-tight text-gray-500">
          <div className="px-3">
            <span className="mr-2 text-gray-900">구분</span> {report.rp_category}
          </div>
          <div className="px-3">
            <span className="mr-2 text-gray-900">금액</span> {formatAmount(report.rp_cost)}
          </div>

          {showWriterInfo && (
            <>
              <div className="px-3">
                <span className="mr-2 text-gray-900">팀</span> {report.team_name}
              </div>
              <div className="px-3">
                <span className="mr-2 text-gray-900">작성자</span> {report.rp_user_name}
              </div>
            </>
          )}

          <div className="px-3">
            <span className="mr-2 text-gray-900">작성일자</span>
            {formatKST(report.rp_date)}
          </div>
          {report.rp_expense_no && (
            <div className="px-3">
              <span className="mr-2 text-gray-900">EXP#</span>

              <Link
                to={`/expense/${report.rp_expense_no}`}
                className="text-primary hover:text-primary/80 underline"
                onClick={(e) => e.stopPropagation()}>
                {report.rp_expense_no}
              </Link>
            </div>
          )}
        </div>

        <div className="w-[300px]">
          <ProposalProgress steps={steps} />
        </div>
      </div>

      <div className="ql-snow bg-gray-200 p-5">
        <div className="ql-editor mb-6 text-gray-800" dangerouslySetInnerHTML={{ __html: report.rp_content }}></div>
      </div>

      {/* 첨부파일 */}
      {files.length > 0 && (
        <div className="mb-4 bg-gray-50 py-4">
          <ProposalAttachFiles
            mode="view"
            viewFiles={files
              .filter((f) => !!f.rf_sname) // ✅ undefined 제거
              .map((f) => ({
                name: f.rf_name,
                url: f.rf_sname!, // ✅ 이제 string 확정
              }))}
          />
        </div>
      )}

      <div className="mt-4 flex justify-between">
        <div>
          <Button variant="outline" size="sm" onClick={onBack}>
            목록
          </Button>
        </div>
        {/* 매니저 전용 승인/반려 버튼 */}
        {showApprovalButtons && (
          <div className="flex gap-2">
            <Button className="bg-destructive hover:bg-destructive mr-0 w-15" variant="destructive" size="sm" onClick={onReject}>
              반려
            </Button>
            <Button
              className="bg-primary-blue-500 active:bg-primary-blue hover:bg-primary-blue mr-0 w-15"
              variant="default"
              size="sm"
              onClick={onApprove}>
              승인
            </Button>
          </div>
        )}

        {onDelete && (
          <div className="flex gap-2">
            <Button variant="destructive" size="sm" className="bg-red-500 text-white" onClick={onDelete}>
              삭제
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
