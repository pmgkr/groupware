import { http } from '@/lib/http';

export type NotificationParams = {
    user_id: string; // 조회할 대상아이디
    is_read?: string; // 읽음 여부 (Y/N)
    type?: string; // today(오늘) / recent(7일)
};

export type NotificationRegisterDto = {
    user_id: string; // 유저아이디
    user_name: string; // 유저이름
    noti_target: string; // 알림대상
    noti_title: string; // 제목
    noti_message: string; // 내용
    noti_type: string; // 유형
    noti_url: string; // 링크
    noti_is_read: string; // Y/N
    noti_read_at: string; // 읽은 시간
    noti_created_at: string; // 생성 시간
};

export type NotificationReadResponse = {
    ok: boolean;
    noti_id: number;
};

export interface Notification {
    noti_id: number;
    user_id: string; // 수신인 (알림을 받는 사람)
    user_name: string; // 수신인 이름
    noti_target: string; // 발신인 (알림을 보낸 사람)
    noti_title: string;
    noti_type: string;
    noti_message: string;
    noti_url: string;
    noti_is_read: string; // Y/N
    noti_read_at?: string; // 읽은 시간
    noti_created_at?: string; // 생성 시간
}


export const notificationApi = {
    /** 알림 목록 조회 *
     * 알림 목록 조회
     * @param params - 조회 파라미터 (user_id 필수, is_read, type 선택)
     */
    getNotification: async (params: NotificationParams): Promise<Notification[]> => {
        const queryParams = new URLSearchParams();
        queryParams.append('user_id', params.user_id);
        if (params.is_read) {
            queryParams.append('is_read', params.is_read);
        }
        if (params.type) {
            queryParams.append('type', params.type);
        }

        const response = await http<Notification[]>(`/user/common/notification?${queryParams.toString()}`, {
            method: 'GET',
        });
        return response;
    },

    /**
     * 알림 등록
     * @param data - 알림 등록 데이터
     */
    registerNotification: async (data: NotificationRegisterDto): Promise<void> => {
        await http('/user/common/notification/register', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    /**
     * 알림 읽음 처리
     * @param noti_id - 알림 ID
     */
    readNotification: async (noti_id: number): Promise<NotificationReadResponse> => {
        const response = await http<NotificationReadResponse>(`/user/common/notification/read/${noti_id}`, {
            method: 'PATCH',
        });
        return response;
    },
};
