import { Link, useNavigate } from 'react-router';
import { useAppDialog } from '@/components/common/ui/AppDialog/AppDialog';

import { Button } from '@components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@components/ui/avatar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@components/ui/tabs';
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@components/ui/sheet';
import { Alarm } from '@/assets/images/icons';

import { notificationApi, type Notification } from '@/api/notification';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getImageUrl, getAvatarFallback } from '@/utils';
import { getProfileImageUrl } from '@/utils/profileImageHelper';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/ko';

dayjs.extend(relativeTime);
dayjs.locale('ko');

// 상대 시간 포맷팅 함수 (n일 전 or n시간 전 or n분 전)
const formatRelativeTime = (dateString?: string): string => {
  if (!dateString) return '';

  const targetDate = dayjs(dateString);
  if (!targetDate.isValid()) return '';

  const now = dayjs();

  // 미래 시각 → 방금 전 처리
  if (targetDate.isAfter(now)) return '방금 전';

  const diffMinutes = now.diff(targetDate, 'minute'); // 전체 분 차이
  const diffHours = now.diff(targetDate, 'hour'); // 전체 시간 차이
  const diffDays = now.diff(targetDate, 'day'); // 전체 일 차이

  // 0분 이하 → 방금 전
  if (diffMinutes <= 0) {
    return '방금 전';
  }

  // 1시간 미만 → 분 단위 표시
  if (diffMinutes < 60) {
    return `${diffMinutes}분 전`;
  }

  // 24시간 미만 → 시간 단위 표시
  if (diffHours < 24) {
    return `${diffHours}시간 전`;
  }

  // 24시간 이상 → 일 단위 표시
  return `${diffDays}일 전`;
};

function formatNotiMessage(msg: string) {
  return msg.split(/(승인|반려|등록|요청|초대|변경|수정)/g).map((part, i) => {
    if (part === '승인') {
      return (
        <span key={i} className="text-green-600">
          승인
        </span>
      );
    }
    if (part === '반려') {
      return (
        <span key={i} className="text-destructive">
          반려
        </span>
      );
    }
    if (part === '요청' || part === '등록' || part === '초대' || part === '변경' || part === '수정') {
      return (
        <span key={i} className="text-primary">
          {part}
        </span>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

export function Notification() {
  const { user } = useAuth();
  const { addDialog } = useAppDialog();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeTab, setActiveTab] = useState<string>('today');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const navigate = useNavigate();

  // 알림 목록 조회
  const fetchNotifications = useCallback(
    async (type: 'today' | 'recent') => {
      if (!user?.user_id) {
        console.log('사용자 정보가 없습니다.');
        return;
      }

      const userId = user.user_id;
      setIsLoading(true);
      try {
        const response = await notificationApi.getNotification({
          user_id: userId,
          type,
        });

        // 서버에서 이미 필터링을 해주는 경우도 있으므로,
        // 클라이언트에서도 user_id가 일치하는지 확인
        const filteredResponse = response.filter((noti) => {
          const matches = String(noti.user_id) === String(userId);
          if (!matches) {
            console.log('필터링된 알림 - user_id 불일치:', {
              알림_user_id: noti.user_id,
              현재_user_id: userId,
              알림: noti,
            });
          }
          return matches;
        });

        setNotifications(filteredResponse);
      } catch (error) {
        console.error('알림 조회 실패:', error);
      } finally {
        setTimeout(() => setIsLoading(false), 150);
      }
    },
    [user]
  );

  // 탭 변경 시 알림 조회
  useEffect(() => {
    fetchNotifications(activeTab === 'today' ? 'today' : 'recent');
  }, [activeTab, fetchNotifications]);

  // 초기 로드 시 오늘 알림 조회
  useEffect(() => {
    if (user?.user_id) {
      fetchNotifications('today');
    }
  }, [user, fetchNotifications]);

  // 알림 클릭 시 읽음 처리
  const handleNotificationClick = async (noti: Notification) => {
    if (noti.noti_is_read === 'N') {
      try {
        await notificationApi.readNotification(noti.noti_id);
        // 읽음 상태 업데이트
        setNotifications((prev) => prev.map((n) => (n.noti_id === noti.noti_id ? { ...n, noti_is_read: 'Y' } : n)));
      } catch (error) {
        console.error('알림 읽음 처리 실패:', error);
      }
    }

    // 알림 URL로 이동
    if (noti.noti_url) {
      navigate(noti.noti_url);
    }
  };

  const handleNotificationRemove = async () => {
    addDialog({
      title: '알림을 지우시겠습니까?',
      message: `<span class="text-primary-blue-500 font-semibold">${notifications.length}</span>건의 알림이 삭제되며, 삭제된 알림은 복구할 수 없습니다.`,
      confirmText: '확인',
      cancelText: '취소',
      onConfirm: async () => {
        try {
          const noti_ids = notifications.map((noti) => noti.noti_id).join(',');
          const res = await notificationApi.deleteNotification(noti_ids);

          if (res.ok) {
            setNotifications([]); // 알림 배열 초기화
            await fetchNotifications(activeTab === 'today' ? 'today' : 'recent'); // 리스트 다시 조회
          }
        } catch (error) {
          console.error('알림 삭제 처리 실패:', error);
        }
      },
    });
  };

  // 알림 아이템 렌더링 함수
  const renderNotificationItem = (noti: Notification) => {
    const displayName = noti.target_name || noti.noti_target || '';
    const fallbackKey = displayName || noti.noti_target || '';
    const profileSrc = getProfileImageUrl(noti.target_image);

    return (
      <li
        key={noti.noti_id}
        className={`flex cursor-pointer items-center gap-x-4 border-b-1 border-b-gray-300 px-1 py-3.5 last:border-b-0 hover:bg-gray-50 ${
          noti.noti_is_read === 'Y' ? 'opacity-50' : ''
        }`}
        onClick={() => handleNotificationClick(noti)}>
        <Avatar className="size-12">
          <AvatarImage src={profileSrc} alt={displayName} />
          <AvatarFallback>{getAvatarFallback(fallbackKey)}</AvatarFallback>
        </Avatar>
        <div className="w-66 flex-1">
          <p className="overflow-hidden text-base leading-6">{formatNotiMessage(noti.noti_message)}</p>
          <p className="overflow-hidden text-sm overflow-ellipsis whitespace-nowrap text-gray-500">
            {noti.noti_created_at && (
              <>
                <span>{formatRelativeTime(noti.noti_created_at)}</span>
                {noti.noti_title && <span> · </span>}
              </>
            )}
            {noti.noti_title && <span>{noti.noti_title}</span>}
          </p>
        </div>
      </li>
    );
  };

  return (
    <>
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="svgIcon" size="icon" className="hover:text-primary-blue-500" aria-label="알람">
            <Alarm className="size-6" />
          </Button>
        </SheetTrigger>
        <SheetContent className="flex flex-col">
          <SheetHeader>
            <SheetTitle>알림</SheetTitle>
          </SheetHeader>
          <div className="flex-1">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full w-full">
              <TabsList className="h-12 w-full px-4 py-2">
                <TabsTrigger value="today">오늘</TabsTrigger>
                <TabsTrigger value="recent">최근 알림</TabsTrigger>
              </TabsList>
              <TabsContent value={activeTab} className="flex-1 overflow-hidden">
                {isLoading ? (
                  <div className="flex h-24 w-full items-center justify-center text-base text-gray-500">로딩 중...</div>
                ) : notifications.length === 0 ? (
                  <ul>
                    <li className="flex h-24 w-full items-center justify-center text-base text-gray-500">
                      {activeTab === 'today' ? '오늘 알림이 없습니다.' : '최근 알림이 없습니다.'}
                    </li>
                  </ul>
                ) : (
                  <ul className="max-h-[calc(100vh-(var(--spacing)*54))] overflow-y-auto overscroll-contain">
                    {notifications.map(renderNotificationItem)}
                  </ul>
                )}
              </TabsContent>
            </Tabs>
          </div>

          <SheetFooter>
            <Button type="button" size="full" onClick={handleNotificationRemove}>
              전체 알림 지우기
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}
