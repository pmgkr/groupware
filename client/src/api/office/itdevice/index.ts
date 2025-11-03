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
  it_status: string;
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
  os?: string;
  ram?: string;
  gpu?: string;
  storage?: string;
  p_date: string;
  createdAt: string;
  it_status: string;
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
    os: dto.os ?? '-',
    ram: dto.ram ?? '-',
    gpu: dto.gpu ?? '-',
    storage: dto.storage ?? '-',
    p_date: date(dto.it_date ?? dto.p_date),
    createdAt: date(dto.it_reg_date ?? dto.reg_date),
    it_status: dto.it_status,
  };
}

export function toDeviceHistory(dto: any): DeviceHistory {
  const date = (v?: string | null) => v?.split('T')[0] ?? '-';

  return {
    id: dto.seq ?? dto.history_id ?? 0,
    user: dto.user_name ?? dto.user ?? '-',
    team: dto.team_name ?? dto.team ?? '-',
    createdAt: date(dto.ih_created_at),
    returnedAt: dto.ih_returned_at ? date(dto.ih_returned_at) : null,
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
  os?: string;
  ram?: string;
  gpu?: string;
  storage?: string;
}): Promise<void> {
  await http('/user/office/device/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

//it디바이스 사용자 등록
export async function registerItDeviceUser(data: {
  it_seq: number;
  ih_user_id: string;
  ih_user_name: string;
  ih_team_id: string;
  ih_created_at: string;
}): Promise<void> {
  await http('/user/office/device/application', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

// 장비 정보 수정
export async function updateItDevice(data: {
  it_seq: number;
  device: string;
  brand: string;
  model: string;
  serial: string;
  p_date: string;
  os?: string;
  ram?: string;
  gpu?: string;
  storage?: string;
}): Promise<void> {
  const renamed = {
    it_device: data.device,
    it_brand: data.brand,
    it_model: data.model,
    it_serial: data.serial,
    it_date: data.p_date,
    os: data.os ?? '',
    ram: data.ram ?? '',
    gpu: data.gpu ?? '',
    storage: data.storage ?? '',
  };

  await http(`/user/office/device/update/${data.it_seq}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(renamed),
  });
}

// it디바이스 사용 상태 변경
export async function updateItDeviceStatus(it_seq: number, status: string) {
  await http(`/user/office/device/status/${it_seq}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ it_status: status }),
  });
}
