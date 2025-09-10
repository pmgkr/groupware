import { SearchGray } from '@/assets/images/icons';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import BlockItem from '@/components/report/BlockItem';

export default function BlockList() {
  return (
    <>
      <div>
        {/* 검색창 */}
        <div className="flex justify-end gap-3">
          <div className="relative mb-4 w-[200px]">
            <Input className="h-[40px] px-4 [&]:bg-white" placeholder="검색어 입력" />
            <Button variant="svgIcon" size="icon" className="absolute top-1/2 right-2 h-4 w-4 -translate-y-1/2" aria-label="검색">
              <SearchGray className="text-gray-400" />
            </Button>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
        <div className="bg-primary-blue-100 h-[79vh] overflow-hidden rounded-2xl p-4 pt-4.5 pr-1">
          <h2 className="mb-3.5 text-lg font-bold">기안 문서</h2>
          <div className="scrollbar-thin h-[70vh] overflow-hidden overflow-y-scroll scroll-smooth pr-2 [&::-webkit-scrollbar]:w-[6px] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-track]:bg-transparent">
            <BlockItem filter="all"></BlockItem>
          </div>
        </div>
        <div className="h-[79vh] overflow-hidden rounded-2xl border p-4 pt-4.5 pr-1">
          <h2 className="mb-3.5 text-lg font-bold">수신 문서</h2>
          <div className="scrollbar-thin h-[70vh] overflow-hidden overflow-y-scroll scroll-smooth pr-2 [&::-webkit-scrollbar]:w-[6px] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-track]:bg-transparent">
            <BlockItem filter="대기"></BlockItem>
          </div>
        </div>
        <div className="bg-primary-blue-100 h-[79vh] overflow-hidden rounded-2xl p-4 pt-4.5 pr-1">
          <h2 className="mb-3.5 text-lg font-bold">완료 문서</h2>
          <div className="scrollbar-thin h-[70vh] overflow-hidden overflow-y-scroll scroll-smooth pr-2 [&::-webkit-scrollbar]:w-[6px] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-track]:bg-transparent">
            <BlockItem filter="완료"></BlockItem>
          </div>
        </div>
        <div className="h-[79vh] overflow-hidden rounded-2xl border p-4 pt-4.5 pr-1">
          <h2 className="mb-3.5 text-lg font-bold">참조 문서</h2>
          <div className="scrollbar-thin h-[70vh] overflow-hidden overflow-y-scroll scroll-smooth pr-2 [&::-webkit-scrollbar]:w-[6px] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-track]:bg-transparent">
            <BlockItem filter="진행중"></BlockItem>
          </div>
        </div>
      </div>
    </>
  );
}
