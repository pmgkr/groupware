// src/api/office/itdevice/index.ts
import { http } from '@/lib/http';

// 타입정의 :  API가 주는 원래 구조
export interface DeviceDTO {
  it_seq: number;
  it_user_id: string;
  it_user_name: string;
  it_device: 'Desktop' | 'Monitor' | 'Laptop';
  it_brand: string;
  it_model: string;
  it_serial: string;
  it_date: string;
  it_reg_date: string;
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
    id: dto.it_seq,
    user: dto.it_user_name,
    device: dto.it_device,
    brand: dto.it_brand,
    model: dto.it_model,
    serial: dto.it_serial,
    purchaseAt: dto.it_date,
    createdAt: dto.it_reg_date,
  };
}

//it디바이스 목록
export async function getItDevice(
  page = 1,
  size = 10
): Promise<{ items: Device[]; total: number; page: number; size: number; pages: number }> {
  const dto = await http<{ items: DeviceDTO[]; total: number; page: number; size: number; pages: number }>(
    `/user/office/device/list?page=${page}&size=${size}`,
    { method: 'GET' }
  );
  const items = dto.items.map(toItDevice);
  return { items, total: dto.total, page: dto.page, size: dto.size, pages: dto.pages };
}
