import { Link, useNavigate } from 'react-router';

import { Button } from '@components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@components/ui/avatar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@components/ui/tabs';
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@components/ui/sheet';
import { Alarm } from '@/assets/images/icons';

import { notificationApi, type Notification } from '@/api/notification';
import { getMemberList } from '@/api/common/team';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getImageUrl, getAvatarFallback } from '@/utils';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/ko';

dayjs.extend(relativeTime);
dayjs.locale('ko');

// 상대 시간 포맷팅 함수 (예: "10일 5시간 3분 전")
const formatRelativeTime = (dateString?: string): string => {
  if (!dateString) {
    return '';
  }
  
  const targetDate = dayjs(dateString);
  
  // 날짜가 유효한지 확인
  if (!targetDate.isValid()) {
    return '';
  }
  
  const now = dayjs();
  
  // 미래 날짜인 경우 처리
  if (targetDate.isAfter(now)) {
    return '방금 전';
  }
  
  const days = now.diff(targetDate, 'day');
  const hours = now.diff(targetDate, 'hour') % 24;
  const minutes = now.diff(targetDate, 'minute') % 60;
  
  const parts: string[] = [];
  
  if (days > 0) {
    parts.push(`${days}일`);
  }
  if (hours > 0) {
    parts.push(`${hours}시간`);
  }
  if (minutes > 0 || parts.length === 0) {
    parts.push(`${minutes}분`);
  }
  
  return parts.length > 0 ? `${parts.join(' ')} 전` : '방금 전';
};

export function Notification() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeTab, setActiveTab] = useState<string>('today');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [userProfiles, setUserProfiles] = useState<Map<string, { user_name: string; profile_image?: string }>>(new Map());
  const navigate = useNavigate();

  // 알림 목록 조회
  const fetchNotifications = useCallback(async (type: 'today' | 'recent') => {
    if (!user?.user_id) {
      console.log('사용자 정보가 없습니다.');
      return;
    }
    
    const userId = user.user_id;
    setIsLoading(true);
    try {
      const response = await notificationApi.getNotification({ 
        user_id: userId,
        type 
      });
      
      console.log('API 응답:', response);
      console.log('현재 사용자 ID:', userId);
      console.log('응답 개수:', response.length);
      
      // 서버에서 이미 필터링을 해주는 경우도 있으므로, 
      // 클라이언트에서도 user_id가 일치하는지 확인
      const filteredResponse = response.filter(noti => {
        const matches = String(noti.user_id) === String(userId);
        if (!matches) {
          console.log('필터링된 알림 - user_id 불일치:', {
            알림_user_id: noti.user_id,
            현재_user_id: userId,
            알림: noti
          });
        }
        return matches;
      });
      
      console.log('필터링된 알림 개수:', filteredResponse.length);
      
      // 고유한 noti_target user_id 추출
      const uniqueTargetIds = [...new Set(filteredResponse.map(noti => noti.noti_target))];
      
      // 전체 멤버 목록 가져오기 (팀 ID 없이 호출하면 전체 멤버 반환)
      try {
        const allMembers = await getMemberList();
        const newProfilesMap = new Map(userProfiles);
        
        // 멤버 목록에서 noti_target에 해당하는 사용자 정보 찾기
        uniqueTargetIds.forEach((targetId) => {
          const member = allMembers.find((m: any) => m.user_id === targetId);
          if (member) {
            newProfilesMap.set(targetId, {
              user_name: member.user_name || '',
              profile_image: member.profile_image || undefined
            });
          }
        });
        
        setUserProfiles(newProfilesMap);
      } catch (error) {
        console.error('멤버 목록 조회 실패:', error);
        // 에러가 발생해도 알림은 표시되도록 함
      }
      
      setNotifications(filteredResponse);
    } catch (error) {
      console.error('알림 조회 실패:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

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
        setNotifications(prev => 
          prev.map(n => n.noti_id === noti.noti_id ? { ...n, noti_is_read: 'Y' } : n)
        );
      } catch (error) {
        console.error('알림 읽음 처리 실패:', error);
      }
    }
    
    // 알림 URL로 이동
    if (noti.noti_url) {
      navigate(noti.noti_url);
    }
  };

  // 알림 아이템 렌더링 함수
  const renderNotificationItem = (noti: Notification) => {
    const targetUser = userProfiles.get(noti.noti_target);
    return (
      <li
        key={noti.noti_id}
        className={`flex items-center gap-x-4 border-b-1 border-b-gray-300 px-1 py-3.5 last:border-b-0 cursor-pointer hover:bg-gray-50 ${
          noti.noti_is_read === 'Y' ? 'opacity-50' : ''
        }`}
        onClick={() => handleNotificationClick(noti)}
      >
        {targetUser ? (
          <Avatar className="size-12">
            <AvatarImage 
              src={
                targetUser.profile_image
                  ? `${import.meta.env.VITE_API_ORIGIN}/uploads/mypage/${targetUser.profile_image}`
                  : getImageUrl('dummy/profile')
              }
              alt={targetUser.user_name} 
            />
            <AvatarFallback>
              {targetUser.user_name ? targetUser.user_name.charAt(0).toUpperCase() : getAvatarFallback(noti.noti_target)}
            </AvatarFallback>
          </Avatar>
        ) : (
          <Avatar className="size-12">
            <AvatarImage src={getImageUrl('dummy/profile')} alt={noti.noti_target} />
            <AvatarFallback>{getAvatarFallback(noti.noti_target)}</AvatarFallback>
          </Avatar>
        )}
        <div className="w-66 flex-1">
          <p className="overflow-hidden text-base leading-6">
            {noti.noti_message}
          </p>
          <p className="overflow-hidden text-sm overflow-ellipsis whitespace-nowrap">
            <span>{targetUser?.user_name && <strong>{targetUser.user_name}</strong>} </span>
            {noti.noti_created_at && (
              <>
                <span className="text-gray-500">{formatRelativeTime(noti.noti_created_at)}</span>
                {noti.noti_title && <span className="text-gray-500"> · </span>}
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
                  <div className="flex h-24 w-full items-center justify-center text-base text-gray-500">
                    로딩 중...
                  </div>
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
            <Button 
              type="button" 
              size="full"
              onClick={() => {
                // TODO: 전체 알림 지우기 API 구현 시 사용
                // 현재는 API에 해당 기능이 없으므로 주석 처리
                console.log('전체 알림 지우기 기능은 아직 구현되지 않았습니다.');
              }}
            >
              전체 알림 지우기
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}
