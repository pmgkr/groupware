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
export interface DeviceHistoryDTO {
  seq: number;
  user_name: string;
  team_name: string;
}

//타입정의 :  프론트
export interface Device {
  id: number;
  user: string;
  device: string;
  brand: string;
  model: string;
  serial: string;
  p_date: string;
  createdAt: string;
}
export interface DeviceHistory {
  id: number;
  user: string;
  team: string;
  createdAt: string;
  returnedAt: string | null;
}

//변환기 DTO -> 도메인 (list는 model / 상세는 it_model으로 들어옴)
export function toItDevice(dto: any): Device {
  const date = (v?: string | null) => v?.split('T')[0] ?? '-';

  return {
    id: dto.it_seq ?? dto.seq ?? 0,
    user: dto.it_user_name ?? dto.user_name ?? '-',
    device: dto.it_device ?? dto.device ?? '-',
    brand: dto.it_brand ?? dto.brand ?? '-',
    model: dto.it_model ?? dto.model ?? '-',
    serial: dto.it_serial ?? dto.serial ?? '-',
    p_date: date(dto.it_date ?? dto.p_date),
    createdAt: date(dto.it_reg_date ?? dto.reg_date),
  };
}

export function toDeviceHistory(dto: any): DeviceHistory {
  //console.log('🔍 [toDeviceHistory] dto:', dto);

  return {
    id: dto.seq ?? dto.history_id ?? 0,
    user: dto.user_name ?? dto.user ?? '-',
    team: dto.team_name ?? dto.team ?? '-',
    createdAt: dto.created_at ? dto.created_at.split('T')[0] : '-',
    returnedAt: dto.returned_at ? dto.returned_at.split('T')[0] : null,
  };
}

//it디바이스 목록
export async function getItDevice(
  page = 1,
  size = 100,
  q?: string
): Promise<{ items: Device[]; total: number; page: number; size: number; pages: number }> {
  const query = q && q.trim() ? `&q=${encodeURIComponent(q)}` : '';
  const dto = await http<{ items: DeviceDTO[]; total: number; page: number; size: number; pages: number }>(
    `/user/office/device/list?page=${page}&size=${size}${query}`,
    {
      method: 'GET',
    }
  );
  //console.log('📦 [getItDevice] 응답 원본:', dto.items);

  const items = dto.items.map(toItDevice);
  return { items, total: dto.total, page: dto.page, size: dto.size, pages: dto.pages };
}

//it디바이스 상세
export async function getItDeviceDetail(it_seq: number): Promise<{ device: Device; history: DeviceHistory[] }> {
  const dto = await http<{ device: DeviceDTO; history: DeviceHistoryDTO[] }>(`/user/office/device/info/${it_seq}`, {
    method: 'GET',
  });

  return {
    device: toItDevice(dto.device),
    history: dto.history.map(toDeviceHistory),
  };
}

// it디바이스 등록
export async function registerItDevice(data: {
  it_device: string;
  it_brand: string;
  it_model: string;
  it_serial: string;
  it_date: string;
}): Promise<void> {
  await http('/user/office/device/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
