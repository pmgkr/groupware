// src/api/search.ts
import { http } from '@/lib/http';

export type SearchCategory = 'notice' | 'project' | 'expense' | 'calendar' | 'book' | 'meetingroom' | 'itdevice' | 'suggest';

export type SearchResultItem = {
  id: number | string;
  title: string;
  category: SearchCategory;
  description?: string;
  url: string;
  created_at?: string;
};

export type SearchResponse = {
  results: SearchResultItem[];
  total: number;
};

export const searchApi = {
  /** 통합검색 */
  search: (params: { q: string; category?: SearchCategory; page?: number; limit?: number }) => {
    const queryParams = new URLSearchParams();
    queryParams.set('q', params.q);
    if (params.category) queryParams.set('category', params.category);
    if (params.page) queryParams.set('page', String(params.page));
    queryParams.set('limit', String(params.limit ?? 20));

    return http<SearchResponse>(`/user/search?${queryParams.toString()}`);
  },
};
