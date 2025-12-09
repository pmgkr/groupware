import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import ReactQuillEditor from '@/components/board/ReactQuillEditor';
import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { BoardAttachFile } from '@/components/board/BoardAttachFile';
import { formatAmount } from '@/utils';
import { registerReport } from '@/api/expense/proposal';
import { uploadFilesToServer } from '@/api';
import { useAppDialog } from '@/components/common/ui/AppDialog/AppDialog';
import { Check } from 'lucide-react';
import { useAppAlert } from '@/components/common/ui/AppAlert/AppAlert';
import { useLocation } from 'react-router';
import { TableColumn, TableColumnBody, TableColumnCell, TableColumnHeader, TableColumnHeaderCell } from '@/components/ui/tableColumn';

// Zod 스키마 정의 (유효성 검사 규칙)
const formSchema = z.object({
  category: z.string().min(1, { message: '카테고리를 선택해주세요.' }),
  title: z.string().min(1, { message: '제목을 입력해주세요.' }),
  price: z.string().min(1, { message: '금액을 입력해주세요.' }),
  content: z.string().min(1, { message: '기안서 내용을 작성해주세요.' }),
});
// 스키마 기반 타입 선언
type FormValues = z.infer<typeof formSchema>;

export default function ProposalRegister() {
  type PreviewFile = File | { id: number; name: string; url: string; size?: number; type?: string };
  const location = useLocation();

  //일반비용 - 프로젝트 구분
  const isProject = location.pathname.includes('/project');
  const navigate = useNavigate();

  useEffect(() => {
    if (isProject) {
      form.setValue('category', '프로젝트', {
        shouldValidate: false,
        shouldDirty: false,
      });
    }
  }, [isProject]);

  const onBack = () => {
    if (isProject) navigate('/project/proposal');
    else navigate('/expense/proposal');
  };

  const [files, setFiles] = useState<PreviewFile[]>([]);
  const [deletedFileIds, setDeletedFileIds] = useState<number[]>([]);
  const [formattedPrice, setFormattedPrice] = useState('');

  //다이얼로그
  const { addDialog } = useAppDialog();
  const { addAlert } = useAppAlert();

  // React Hook Form 초기화
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      category: '',
      title: '',
      content: '',
      price: '',
    },
  });

  // 제출(다이얼로그)
  const onSubmit = (data: FormValues) => {
    addDialog({
      title: `<span class="font-semibold">기안서 등록</span>`,
      message: '이 기안서를 제출하시겠습니까?',
      confirmText: '확인',
      cancelText: '취소',
      onConfirm: () => handleFinalSubmit(data), // ⭐ 중요
    });
  };

  //제출 (form)
  const handleFinalSubmit = async (data: FormValues) => {
    try {
      const newFiles = files.filter((f) => f instanceof File) as File[];
      const uploaded = await uploadFilesToServer(newFiles, 'report');

      const payload = {
        rp_category: isProject ? '프로젝트' : data.category,
        rp_title: data.title,
        rp_state: '진행',
        rp_content: data.content,
        rp_cost: Number(data.price),
        rp_project_type: isProject ? 'project' : 'non_project',
        rp_expense_no: null,
        references: [],
        files: uploaded.map((f) => ({
          rf_name: f.fname,
          rf_sname: f.sname,
          rf_type: f.ext,
        })),
      };

      await registerReport(payload);

      addAlert({
        title: '기안서 제출 완료',
        message: `${data.title}이 성공적으로 제출되었습니다.`,
        icon: <Check />,
        duration: 2000,
      });

      onBack(); // 리스트로 이동
    } catch (err) {
      console.error('등록 실패:', err);
    }
  };

  return (
    <div>
      <div>
        <Form {...form}>
          <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
            {/* 카테고리 Select Box */}
            {/* 입력 영역 테이블 */}
            <div className="mt-6 mb-4 overflow-hidden">
              {/* 첫번째 줄: 카테고리 + 금액 */}
              <TableColumn className="[&_div]:text-[13px] [&_input]:text-[13px]">
                {/* 카테고리 */}

                <TableColumnHeader className="w-[14%]">
                  <TableColumnHeaderCell>카테고리</TableColumnHeaderCell>
                </TableColumnHeader>
                <TableColumnBody>
                  <TableColumnCell>
                    {isProject ? (
                      <div className="px-0 py-1 text-[13px]!">프로젝트</div>
                    ) : (
                      <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => {
                          const error = form.formState.errors.category?.message;

                          return (
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <SelectTrigger
                                size="sm"
                                className={`h-full! w-full border-0 p-0 text-[13px]! shadow-none ${error ? 'text-red-500!' : ''} `}>
                                <SelectValue placeholder={error ? error.toString() : '선택'} />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="교육비">교육비</SelectItem>
                                <SelectItem value="구매요청">구매요청</SelectItem>
                                <SelectItem value="일반비용">일반비용</SelectItem>
                              </SelectContent>
                            </Select>
                          );
                        }}
                      />
                    )}
                  </TableColumnCell>
                </TableColumnBody>

                {/* 금액 */}
                <TableColumnHeader className="w-[14%]">
                  <TableColumnHeaderCell>금액</TableColumnHeaderCell>
                </TableColumnHeader>
                <TableColumnBody>
                  <TableColumnCell>
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => {
                        const error = form.formState.errors.price?.message;

                        return (
                          <Input
                            placeholder={error ? error.toString() : '0'}
                            className={`h-full w-full border-0 p-0 text-[13px] shadow-none ${error ? 'placeholder-red-500!' : ''} placeholder:text-[13px]!`}
                            inputMode="numeric"
                            value={formattedPrice}
                            onChange={(e) => {
                              const raw = e.target.value.replace(/,/g, '');
                              if (!/^\d*$/.test(raw)) return;
                              field.onChange(raw);
                              setFormattedPrice(raw ? formatAmount(raw) : '');
                            }}
                          />
                        );
                      }}
                    />
                  </TableColumnCell>
                </TableColumnBody>
              </TableColumn>

              {/* 두번째 줄: 제목 */}
              <TableColumn className="border-t-0 [&_div]:text-[13px] [&_input]:text-[13px]">
                <TableColumnHeader className="w-[14%]">
                  <TableColumnHeaderCell>제목</TableColumnHeaderCell>
                </TableColumnHeader>
                <TableColumnBody>
                  <TableColumnCell>
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => {
                        const error = form.formState.errors.title?.message;

                        return (
                          <Input
                            {...field}
                            placeholder={error ? error.toString() : '제목을 입력하세요'}
                            className={`h-full w-full border-0 p-0 text-[13px] shadow-none ${error ? 'placeholder-red-500!' : ''} placeholder:text-[13px]!`}
                          />
                        );
                      }}
                    />
                  </TableColumnCell>
                </TableColumnBody>
              </TableColumn>
            </div>

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem className="h-[56vh]">
                  <FormControl>
                    <ReactQuillEditor value={field.value} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 전송 버튼 */}
            <div className="flex items-center justify-between">
              <BoardAttachFile files={files} setFiles={setFiles} onRemoveExisting={(id) => setDeletedFileIds((prev) => [...prev, id])} />
              <div className="flex gap-x-2">
                <Button type="submit">제출</Button>
                <Button type="button" variant="secondary" onClick={onBack}>
                  취소
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
