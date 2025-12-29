import { formatKST } from '@/utils';
import {
  Info,
  FileCheck,
  FileMinus,
  FileText,
  FilePlus,
  FilePen,
  BanknoteArrowDown,
  XCircle,
  BanknoteArrowUp,
  Repeat,
  UserCheck,
  UserPlus,
  UserMinus,
  BanknoteX,
} from 'lucide-react';

type ProjectLog = {
  seq: number;
  pl_type: string;
  pl_remark: string;
  user_id: string;
  user_nm: string;
  pl_date: string;
};

type Props = {
  logs: ProjectLog[];
};

export const ProjectHistory = ({ logs }: Props) => {
  const ALLOWED_LOG_TYPES = [
    // project
    'created',
    'updated',
    'cancelled',
    'closed',
    'status_changed',
    'owner_changed',
    'member_added',
    'member_removed',

    // estimate
    'est_created',
    'est_updated',
    'est_added',
    'est_deactivated',

    // invoice
    'inv_created',
    'inv_completed',
    'inv_rejected',
  ];
  const filteredLogs = logs.filter((log) => ALLOWED_LOG_TYPES.includes(log.pl_type));

  const getLogIcon = (type: string) => {
    switch (type) {
      // project
      case 'created':
        return <FilePlus className="text-primary-blue size-4" />;

      case 'updated':
        return <FilePen className="text-primary-blue size-4" />;

      case 'cancelled':
        return <FileMinus className="text-primary-blue size-4" />;

      case 'closed':
        return <FileCheck className="text-primary-blue size-4" />;

      case 'status_changed':
        return <Repeat className="text-primary-blue size-4" />;

      case 'owner_changed':
        return <UserCheck className="text-primary-blue size-4" />;

      case 'member_added':
        return <UserPlus className="text-primary-blue size-4" />;

      case 'member_removed':
        return <UserMinus className="text-primary-blue size-4" />;

      // estimate
      case 'est_created':
      case 'est_added':
        return <FilePlus className="text-primary-blue size-4" />;

      case 'est_updated':
        return <FileText className="text-primary-blue size-4" />;

      case 'est_deactivated':
        return <FileText className="text-primary-blue size-4" />;

      // invoice
      case 'inv_created':
        return <BanknoteArrowDown className="text-primary-blue size-4" />;

      case 'inv_completed':
        return <BanknoteArrowUp className="text-primary-blue size-4" />;

      case 'inv_rejected':
        return <BanknoteX className="text-primary-blue size-4" />;

      default:
        return <Info className="text-primary-blue size-4" />;
    }
  };

  const renderRemark = (remark: string) => {
    const keyword = '니다.';
    const idx = remark.indexOf(keyword);

    // '니다.'가 없으면 그대로 출력
    if (idx === -1) {
      return <>{remark}</>;
    }

    const before = remark.slice(0, idx + keyword.length);
    const after = remark.slice(idx + keyword.length).trim();

    return (
      <>
        {before}
        {after && (
          <>
            <br />
            <span className="text-sm text-gray-500">{after}</span>
          </>
        )}
      </>
    );
  };

  if (!filteredLogs || filteredLogs.length === 0) {
    return <div className="flex items-center justify-center py-8 text-sm text-gray-400">프로젝트 히스토리 로딩중 . . .</div>;
  }

  return (
    <ul className="flex flex-col gap-4">
      {filteredLogs.map((log, idx) => (
        <li key={log.seq}>
          <div className="relative before:absolute before:bottom-[100%] before:left-[15.5px] before:mb-1 before:h-6 before:w-[1px] before:bg-gray-400/80 first:before:hidden">
            <div className="flex items-center gap-4">
              <span className="flex size-8 items-center justify-center rounded-full bg-white ring-1 ring-gray-300">
                {getLogIcon(log.pl_type)}
              </span>
              <dl className="text-base leading-[1.3] text-gray-800">
                <dt>{renderRemark(log.pl_remark)}</dt>
                <dd className="text-[.88em] text-gray-500">{formatKST(log.pl_date)}</dd>
              </dl>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
};
