import { useParams, useNavigate, useLocation } from 'react-router';
import { dummyReports } from '@/components/report/BlockItem';
import { Button } from '@/components/ui/button';
import Logo from '@/assets/images/common/pmg_logo.svg?react';
import { useState } from 'react';

export default function ReportDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  // 현재 탭 정보 (없으면 block)
  const tab = new URLSearchParams(location.search).get('tab') || 'block';
  // id에 맞는 데이터 찾기
  const report = dummyReports.find((r) => r.id === Number(id));

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
      {/* <div className="flex h-[200px] items-center justify-between">
        <Logo className="h-[200px] w-auto" />
        <div className="flex h-full w-full items-center justify-center border-t border-b text-center text-3xl font-bold">기안서</div>
        <div className="h-[200px]">
          <ul className="flex text-center text-base">
            <li className="grid h-full grid-rows-3 items-start border">
              <div className="border-b">담당자</div>
              <div className="border-b">서명라인</div>
              <p>홍길동</p>
            </li>
          </ul>
          <div className="flex">
            <span>참조</span>
            <div>셀렉트바 들어갈 자리</div>
          </div>
        </div>
      </div> */}
      <header className="flex h-40 items-stretch">
        <div className="flex h-full items-center justify-center">
          <Logo className="h-full w-auto" />
        </div>

        <div className="flex flex-1 items-center justify-center border border-r-0 text-4xl font-bold">기안서</div>

        <table className="border-collapse text-center">
          <thead>
            <tr className="text-sm">
              <td className="w-[105px] border px-6 py-1">담당자</td>
              <td className="w-[105px] border px-6 py-1">팀장</td>
              <td className="w-[105px] border px-6 py-1">회계팀장</td>
              <td className="w-[105px] border px-6 py-1">대표</td>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border"></td>
              <td className="border"></td>
              <td className="border"></td>
              <td className="border"></td>
            </tr>
            <tr className="h-10">
              <td className="border py-1">
                <span className="text-sm">차혜리</span>
                <p className="text-xs text-gray-600">2025-09-21 13:30</p>
              </td>
              <td className="border">
                <span className="text-sm">박보검</span>
                <p className="text-xs text-gray-600">2025-09-21 13:30</p>
              </td>
              <td className="border">
                <span className="text-sm">홍길동</span>
                <p className="text-xs text-gray-600"></p>
              </td>
              <td className="border">
                <span className="text-sm">김원필</span>
                <p className="text-xs text-gray-600"></p>
              </td>
            </tr>
          </tbody>
        </table>
      </header>
      <div className="py-5 text-center text-base">아래와 같이 기안서를 제출합니다.</div>

      <div className="border-t">
        <table className="w-full table-fixed text-base">
          <tr className="border-b">
            <th className="p-3 text-left">구분</th>
            <td className="border-r py-3">{report.category}</td>
            <th className="p-3 text-left">Project #</th>
            <td className="border-r py-3">PMG123456789</td>
            <th className="p-3 text-left">문서번호</th>
            <td className="border-r py-3">{report.report_num}</td>
            <th className="p-3 text-left">작성일자</th>
            <td className="py-3">{report.date}</td>
          </tr>
          <tr className="border-b">
            <th className="p-3 text-left">Expense No.</th>
            <td className="border-r py-3">선택</td>
            <th className="p-3 text-left">금액</th>
            <td className="border-r py-3">{report.price.toLocaleString()} 원</td>
            <th className="p-3 text-left">소속</th>
            <td className="border-r py-3">{report.team}</td>
            <th className="p-3 text-left">작성자</th>
            <td className="py-3">{report.user}</td>
          </tr>
          <tr className="border-b">
            <th className="p-3 text-left">제목</th>
            <td className="py-3 font-medium" colSpan={7}>
              {report.title}
            </td>
          </tr>
        </table>
      </div>

      <div className="p-5">
        <p className="mb-6 text-gray-600">{report.content}</p>
      </div>

      <Button variant="outline" size="sm" onClick={() => navigate(`/report?tab=${tab}`)}>
        목록
      </Button>
    </div>
  );
}
