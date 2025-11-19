import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate, useOutletContext, useParams } from 'react-router';
import { useForm, useFieldArray } from 'react-hook-form';
import { mapExcelToQuotationItems } from '@/utils';
import type { ProjectLayoutContext } from '@/pages/Project/ProjectLayout';
import { formatAmount } from '@/utils';

import { Input } from '@components/ui/input';
import { Button } from '@components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TableColumn, TableColumnHeader, TableColumnHeaderCell, TableColumnBody, TableColumnCell } from '@/components/ui/tableColumn';

type QuotationNormalItem = {
  type: 'item';
  item: string;
  unit_price: number;
  qty: number;
  amount: number;
  remarks: string;
  depth: number;
};

type QuotationTitle = {
  type: 'title';
  item: string;
  depth: number;
};

type QuotationSubtotal = {
  type: 'subtotal';
  label: string;
  amount: number;
};

type QuotationGrandTotal = {
  type: 'grandtotal';
  label: string;
  amount: number;
};

export type QuotationMappedItem = QuotationNormalItem | QuotationTitle | QuotationSubtotal | QuotationGrandTotal;

type EstimateForm = {
  estimate_items: QuotationMappedItem[];
};

export default function EstimatePreview() {
  const location = useLocation();
  const { projectId } = useParams();
  const { registerType, excelData, estName } = location.state;
  const { data } = useOutletContext<ProjectLayoutContext>();

  const [estimateName, setEstimateName] = useState(estName ?? '');
  const nameInputRef = useRef<HTMLInputElement | null>(null);

  // --------------------------
  // 1) react-hook-form 세팅
  // --------------------------
  const form = useForm<EstimateForm>({
    defaultValues: {
      estimate_items: [],
    },
  });

  const { control } = form;

  const { fields, replace } = useFieldArray({
    control,
    name: 'estimate_items',
  });

  console.log(fields);

  // --------------------------
  // 2) Excel 매핑하여 row 생성
  // --------------------------
  useEffect(() => {
    if (excelData && Array.isArray(excelData)) {
      const mapped = mapExcelToQuotationItems(excelData);

      if (mapped.length > 0) {
        replace(mapped);

        // form 데이터에도 반영
        form.reset({
          estimate_items: mapped,
        });
      }
    }
  }, [excelData]);

  useEffect(() => {
    nameInputRef.current?.focus();
  }, []);

  return (
    <>
      <div className="flex flex-wrap justify-between">
        <div className="w-[74%] tracking-tight">
          <h2 className="mb-2 text-lg font-bold text-gray-800">견적서 정보</h2>
          <TableColumn>
            <TableColumnHeader className="w-[15%]">
              <TableColumnHeaderCell>프로젝트 #</TableColumnHeaderCell>
            </TableColumnHeader>
            <TableColumnBody>
              <TableColumnCell>{data.project_id}</TableColumnCell>
            </TableColumnBody>
            <TableColumnHeader className="w-[15%]">
              <TableColumnHeaderCell>클라이언트</TableColumnHeaderCell>
            </TableColumnHeader>
            <TableColumnBody>
              <TableColumnCell>{data.client_nm}</TableColumnCell>
            </TableColumnBody>
          </TableColumn>

          <TableColumn className="border-t-0">
            <TableColumnHeader className="w-[15%]">
              <TableColumnHeaderCell className="h-full">견적서 제목</TableColumnHeaderCell>
            </TableColumnHeader>
            <TableColumnBody>
              <TableColumnCell className="h-full">
                <Input
                  ref={nameInputRef}
                  value={estimateName}
                  onChange={(e) => setEstimateName(e.target.value)}
                  className="h-full border-0 p-0 shadow-none"
                />
              </TableColumnCell>
            </TableColumnBody>
          </TableColumn>
        </div>

        <div className="flex w-[24%] flex-col">
          <h2 className="mb-2 text-lg font-bold text-gray-800">견적서 증빙</h2>
          <div className="h-full rounded-sm border-1 border-dashed"></div>
        </div>
      </div>

      {/* ------------------------------- */}
      {/*      견적서 항목 렌더링        */}
      {/* ------------------------------- */}
      <div className="mt-6">
        <h2 className="mb-2 text-lg font-bold text-gray-800">견적서 항목</h2>

        <Table variant="primary" align="center" className="table-fixed">
          <TableHeader>
            <TableRow className="[&_th]:text-[13px] [&_th]:font-medium">
              <TableHead className="text-left">항목명</TableHead>
              <TableHead className="w-[10%]">단가</TableHead>
              <TableHead className="w-[6%]">수량</TableHead>
              <TableHead className="w-[10%]">금액</TableHead>
              <TableHead className="w-[10%]">예상 지출 금액</TableHead>
              <TableHead className="w-[10%]">가용 금액</TableHead>
              <TableHead className="w-[24%]">비고</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {fields.map((row, index) => (
              <TableRow key={row.id} className="whitespace-nowrap [&_td]:text-[13px]">
                {/* ------------------------ */}
                {/* 일반 Item Row */}
                {/* ------------------------ */}
                {row.type === 'title' && (
                  <>
                    <TableCell className="text-left font-bold" colSpan={7}>
                      {row.item}
                    </TableCell>
                  </>
                )}

                {/* ------------------------ */}
                {/* 일반 Item Row */}
                {/* ------------------------ */}
                {row.type === 'item' && (
                  <>
                    <TableCell className="text-left">{row.item}</TableCell>
                    <TableCell className="text-right">{formatAmount(row.unit_price)}</TableCell>
                    <TableCell className="text-right">{row.qty}</TableCell>
                    <TableCell className="text-right">{formatAmount(row.amount)}</TableCell>
                    <TableCell>
                      <Input type="text" size="sm" className="h-7 rounded-sm text-right" />
                    </TableCell>
                    <TableCell>-</TableCell>
                    <TableCell className="text-left leading-[1.1] break-keep whitespace-break-spaces">{row.remarks}</TableCell>
                  </>
                )}

                {/* ------------------------ */}
                {/* Sub Total Row */}
                {/* ------------------------ */}
                {row.type === 'subtotal' && (
                  <>
                    <TableCell colSpan={3} className="bg-gray-100 font-semibold">
                      {row.label}
                    </TableCell>
                    <TableCell className="bg-gray-100 font-semibold">{formatAmount(row.amount)}</TableCell>
                    <TableCell colSpan={3} className="bg-gray-100"></TableCell>
                  </>
                )}

                {/* ------------------------ */}
                {/* Grand Total Row */}
                {/* ------------------------ */}
                {row.type === 'grandtotal' && (
                  <>
                    <TableCell colSpan={3} className="bg-primary-blue-150 font-bold text-gray-900">
                      {row.label}
                    </TableCell>
                    <TableCell className="bg-primary-blue-150 font-bold text-gray-900">{formatAmount(row.amount)}</TableCell>
                    <TableCell colSpan={3} className="bg-primary-blue-150"></TableCell>
                  </>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="my-10 flex justify-center gap-2">
          <Button type="submit" className="min-w-[120px]">
            등록
          </Button>
          <Button type="button" variant="outline" className="min-w-[120px]" asChild>
            <Link to={`/project/${projectId}/estimate`}>취소</Link>
          </Button>
        </div>
      </div>
    </>
  );
}
