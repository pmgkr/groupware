// src/api/office/itdevice/index.ts
import { http } from '@/lib/http';

// 타입정의 :  API가 주는 원래 구조
export interface DeviceDTO {
  seq: number;
  device: string;
  brand: string;
  model: string;
  serial: string;
  p_date: string; // 구매일자
  reg_date: string | null; // 등록일자
  user_id: string | null;
  user_name: string | null;
  team_id: number | null;
}

//타입정의 :  프론트
export interface Device {
  id: number;
  user: string;
  device: string;
  brand: string;
  model: string;
  serial: string;
  purchaseAt: string;
  createdAt: string;
}

//변환기 DTO -> 도메인
export function toItDevice(dto: DeviceDTO): Device {
  return {
    id: dto.seq,
    user: dto.user_name ?? '-', // 사용자 이름이 null일 수 있음
    device: dto.device,
    brand: dto.brand,
    model: dto.model,
    serial: dto.serial,
    purchaseAt: dto.p_date ? dto.p_date.split('T')[0] : '-', // 날짜만 추출
    createdAt: dto.reg_date ? dto.reg_date.split('T')[0] : '-', // 등록일
  };
}

//it디바이스 목록
export async function getItDevice(
  page = 1,
  size = 10
): Promise<{ items: Device[]; total: number; page: number; size: number; pages: number }> {
  const dto = await http<{ items: DeviceDTO[]; total: number; page: number; size: number; pages: number }>(
    `/user/office/device/list`, // ✅ 수정
    { method: 'GET' }
  );

  console.log('📦 서버 응답:', dto); // ✅ 실제 키 확인용

  const items = dto.items.map(toItDevice);
  return { items, total: dto.total, page: dto.page, size: dto.size, pages: dto.pages };
}
