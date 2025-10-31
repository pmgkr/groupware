import { FilePlus, FileUp, FileDiff, FileCheck, Banknote, BanknoteArrowDown, FileX, Paperclip } from 'lucide-react';

/**
 * 상태별 아이콘 매핑
 */
export const statusIconMap = {
  Saved: <FilePlus className="text-primary-blue size-4.5" />,
  Edit: <FileDiff className="text-primary-blue size-4.5" />,
  Claimed: <FileUp className="text-primary-blue size-4.5" />,
  Confirmed: <FileCheck className="text-primary-blue size-4.5" />,
  Approved: <Banknote className="text-primary-blue size-4.5" />,
  Completed: <BanknoteArrowDown className="text-primary-blue size-4.5" />,
  Rejected: <FileX className="text-primary-blue size-4.5" />,
  Attachment: <Paperclip className="text-primary-blue size-4.5" />,
};

/**
 * 로그 메시지 생성 함수
 * @param log 로그 객체 (exp_status, user_nm 등을 포함)
 */
export const getLogMessage = (log: any) => {
  switch (log.exp_status) {
    case 'Saved':
      return (
        <>
          <strong className="font-semibold text-gray-900">{log.user_nm}</strong>
          님이 비용을 저장했습니다.
        </>
      );

    case 'Edit':
      return (
        <>
          <strong className="font-semibold text-gray-900">{log.user_nm}</strong>
          님이 비용을 수정했습니다.
        </>
      );

    case 'Claimed':
      return (
        <>
          <strong className="font-semibold text-gray-900">{log.user_nm}</strong>님이 비용을 <span className="text-primary-blue">청구</span>
          했습니다.
        </>
      );

    case 'Confirmed':
      return (
        <>
          <strong className="font-semibold text-gray-900">{log.user_nm}</strong>님이 비용을 <span className="text-primary-blue">승인</span>
          했습니다.
        </>
      );

    case 'Rejected':
      return (
        <>
          <strong className="font-semibold text-gray-900">{log.user_nm}</strong>님이 비용을 <span className="text-destructive">반려</span>
          했습니다.
        </>
      );

    case 'Approved':
      return (
        <>
          비용 <span className="text-primary-blue">지급 대기</span>로 상태가 변경되었습니다.
        </>
      );

    case 'Completed':
      return (
        <>
          비용 <span className="text-primary-blue">지급 완료</span>되었습니다.
        </>
      );

    case 'Attachment':
      switch (log.remark) {
        case '첨부 파일 등록':
          return (
            <>
              <strong className="font-semibold text-gray-900">{log.user_nm}</strong>님이 증빙자료를를 등록했습니다.
            </>
          );
        case '첨부 파일 삭제':
          return (
            <>
              <strong className="font-semibold text-gray-900">{log.user_nm}</strong>님이 증빙자료를 삭제했습니다.
            </>
          );
        default:
          return null;
      }

    default:
      return null;
  }
};
