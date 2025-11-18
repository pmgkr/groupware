import { useRef, useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import * as XLSX from 'xlsx';

import { useAppAlert } from '@/components/common/ui/AppAlert/AppAlert';
import { useAppDialog } from '@/components/common/ui/AppDialog/AppDialog';
import { Button } from '@components/ui/button';
import { AppPagination } from '@/components/ui/AppPagination';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogClose, DialogDescription, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Excel } from '@/assets/images/icons';

export default function ProjectEstimate() {
  const navigate = useNavigate();
  const { projectId } = useParams();

  const [registerDialog, setRegisterDialog] = useState(false); // Dialog용 State
  const [registerType, setRegisterType] = useState<'new' | 'add' | null>(null); // Dialog Type용 State

  // Excel 데이터 업로드용 Input
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Excel 파일 업로드 핸들러
  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = file.name.replace(/\.[^/.]+$/, '');

    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    console.log('✅ 업로드된 Excel 데이터:', jsonData);

    // 업로드 완료 후 register 페이지로 이동
    navigate('preview', { state: { registerType, estName: fileName, excelData: jsonData } });
  };

  // 엑셀 업로드 버튼 클릭 시 input 트리거
  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button
          size="sm"
          onClick={() => {
            setRegisterDialog(true);
          }}>
          견적서 등록
        </Button>
      </div>
      <Table variant="primary" align="center" className="table-fixed">
        <TableHeader>
          <TableRow className="[&_th]:text-[13px] [&_th]:font-medium">
            <TableHead className="w-[6%]">#</TableHead>
            <TableHead className="text-left">견적서 제목</TableHead>
            <TableHead className="w-[12%]">클라이언트</TableHead>
            <TableHead className="w-[10%]">견적서 총액</TableHead>
            <TableHead className="w-[10%]">가용 예산</TableHead>
            <TableHead className="w-[8%]">작성자</TableHead>
            <TableHead className="w-[12%]">작성일시</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow className="[&_td]:text-[13px]">
            <TableCell>1</TableCell>
            <TableCell className="text-left">
              <Link to="2">Windsor_Global_Official_Website</Link>
            </TableCell>
            <TableCell>윈저글로벌</TableCell>
            <TableCell>1,231,000</TableCell>
            <TableCell>633,500</TableCell>
            <TableCell>홍길동</TableCell>
            <TableCell>2025-11-17 17:24:30</TableCell>
          </TableRow>
        </TableBody>
      </Table>

      <Dialog open={registerDialog} onOpenChange={setRegisterDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>신규 견적서 등록</DialogTitle>
            <DialogDescription>견적서 비용 혹은 견적서 외 비용을 등록할 수 있습니다.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <div className="grid grid-cols-2 gap-4">
              <Button variant="outline" onClick={() => setRegisterType('new')}>
                신규 견적서 등록
              </Button>
              <Button variant="outline" onClick={() => setRegisterType('add')}>
                추가 견적서 등록
              </Button>
            </div>
            {registerType && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <Button variant="outline" onClick={openFileDialog}>
                    <Excel className="size-4.5" /> Excel 업로드
                  </Button>
                  <Button variant="outline" onClick={() => navigate('register', { state: { registerType } })}>
                    수기 입력
                  </Button>
                </div>
                <input ref={fileInputRef} type="file" accept=".xlsx, .xls" className="h-0 w-0 text-[0]" onChange={handleExcelUpload} />
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
