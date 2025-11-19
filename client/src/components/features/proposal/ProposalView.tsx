import { useParams, useNavigate } from 'react-router';
import { dummyReports } from '@/components/report/BlockItem';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { CircleX } from '@/assets/images/icons';
import ProposalProgress, { type Step } from './ProposalProgress';

export default function ProposalView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  // id에 맞는 데이터 찾기
  const report = dummyReports.find((r) => r.id === Number(id));
  const steps: Step[] = [
    { label: '팀장', status: 'approved' },
    { label: '회계팀장', status: 'rejected' },
    { label: '대표', status: 'pending' },
  ];

  if (!report) {
    return (
      <div className="p-6 text-center">
        <p className="mb-4 text-gray-500">해당 문서를 찾을 수 없습니다.</p>
        <Button onClick={() => navigate(-1)}>뒤로가기</Button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between p-4 pr-1">
        <h2 className="border-gray-900 text-2xl font-bold">{report.title}</h2>
      </div>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex divide-x divide-gray-300 border-t border-b border-gray-300 p-4 text-sm leading-tight text-gray-500">
          <div className="px-3 pl-0">
            <span className="mr-2 text-gray-900">구분</span> {report.category}
          </div>
          <div className="px-3">
            <span className="mr-2 text-gray-900">금액</span> 150,000
          </div>
          <div className="px-3">
            <span className="mr-2 text-gray-900">문서번호</span>25111456789
          </div>
          <div className="px-3">
            <span className="mr-2 text-gray-900">프로젝트 번호</span> (있을 시)
          </div>
          <div className="px-3">
            <span className="mr-2 text-gray-900">작성일자</span>2025-11-14
          </div>
        </div>
        <div className="w-[300px]">
          <ProposalProgress steps={steps} />
        </div>
      </div>

      <div className="bg-gray-200 p-5">
        <p className="mb-6 text-gray-800">{report.content}</p>
      </div>
      <div className="mb-6 bg-gray-50 py-4">
        <Button
          variant="outline"
          className="hover:text-primary-blue-500 hover:bg-primary-blue-100 mr-2 text-sm [&]:border-gray-300 [&]:p-4">
          <div className="flex items-center gap-2">
            <span className="font-normal">파일명.pdf</span>
          </div>
          <CircleX className="size-4.5" />
        </Button>
      </div>

      <div className="text-right">
        <Button variant="outline" size="sm" onClick={() => navigate('..')}>
          목록
        </Button>
      </div>
    </div>
  );
}
