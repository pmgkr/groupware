import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import ReactQuillEditor from '@/components/board/ReactQuillEditor';
import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { formatAmount } from '@/utils';
import { registerReport } from '@/api/expense/proposal';
import { uploadFilesToServer } from '@/api';
import { useAppDialog } from '@/components/common/ui/AppDialog/AppDialog';
import { Check, Loader2 } from 'lucide-react'; // 🔥 Loader2 추가
import { useAppAlert } from '@/components/common/ui/AppAlert/AppAlert';
import { TableColumn, TableColumnBody, TableColumnCell, TableColumnHeader, TableColumnHeaderCell } from '@/components/ui/tableColumn';
import ProposalAttachFiles from './ProposalAttachFiles';

const formSchema = z.object({
  category: z.string().min(1, { message: '카테고리를 선택해주세요.' }),
  title: z.string().min(1, { message: '제목을 입력해주세요.' }),
  price: z.string().min(1, { message: '금액을 입력해주세요.' }),
  content: z.string().min(1, { message: '기안서 내용을 작성해주세요.' }),
});

type FormValues = z.infer<typeof formSchema>;

export default function ProposalRegister() {
  const location = useLocation();
  const navigate = useNavigate();
  const isProject = location.pathname.includes('/project');

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      category: '',
      title: '',
      content: '',
      price: '',
    },
  });

  useEffect(() => {
    if (isProject) {
      form.setValue('category', '프로젝트', {
        shouldValidate: false,
        shouldDirty: false,
      });
    }
  }, [isProject]);

  /* ---------- state ---------- */

  const [files, setFiles] = useState<File[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<
    {
      rf_name: string;
      rf_type: string;
      rf_sname: string;
    }[]
  >([]);
  const [formattedPrice, setFormattedPrice] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const { addDialog } = useAppDialog();
  const { addAlert } = useAppAlert();

  const onBack = () => {
    navigate(isProject ? '/project/proposal' : '/expense/proposal');
  };

  /* ---------- file  ---------- */

  const handleAddFiles = async (newFiles: File[]) => {
    console.log('📂 selected files', newFiles);

    // UI용 파일 상태 업데이트 (즉시 표시)
    setFiles((prev) => [...prev, ...newFiles]);
    setIsUploading(true); // 🔥 업로드 시작

    try {
      const uploaded = await uploadFilesToServer(newFiles, 'report');
      console.log('☁️ upload result', uploaded);

      const mapped = uploaded.map((f) => ({
        rf_name: f.fname,
        rf_type: f.ext,
        rf_sname: f.url,
      }));

      console.log('🧾 mapped files', mapped);

      setUploadedFiles((prev) => [...prev, ...mapped]);
      console.log('✅ uploadedFiles 업데이트 완료:', [...uploadedFiles, ...mapped]); // 🔥 확인
    } catch (error) {
      console.error('파일 업로드 실패:', error);
      // 업로드 실패 시 UI에서 추가한 파일 제거
      setFiles((prev) => prev.filter((f) => !newFiles.includes(f)));
      addAlert({
        title: '파일 업로드 실패',
        message: '파일 업로드 중 오류가 발생했습니다.',
        duration: 2000,
      });
    } finally {
      setIsUploading(false); // 🔥 업로드 완료
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  /* ---------- submit ---------- */

  const onSubmit = (data: FormValues) => {
    // 🔥 업로드 중이면 제출 불가
    if (isUploading) {
      addAlert({
        title: '파일 업로드 중',
        message: '파일 업로드가 완료될 때까지 기다려주세요.',
        duration: 2000,
      });
      return;
    }

    addDialog({
      title: `<span class="font-semibold">기안서 등록</span>`,
      message: '이 기안서를 제출하시겠습니까?',
      confirmText: '확인',
      cancelText: '취소',
      onConfirm: () => handleFinalSubmit(data),
    });
  };

  const handleFinalSubmit = async (data: FormValues) => {
    console.log('📋 현재 uploadedFiles:', uploadedFiles); // 🔥 디버깅

    try {
      const payload = {
        rp_category: isProject ? '프로젝트' : data.category,
        rp_title: data.title,
        rp_state: '진행',
        rp_cost: Number(data.price),
        rp_content: data.content,
        rp_project_type: isProject ? 'project' : 'non_project',
        rp_expense_no: '',
        references: [],
        files: uploadedFiles,
      };

      console.log('🔥 register payload', payload);

      await registerReport(payload);

      addAlert({
        title: '기안서 제출 완료',
        message: `${data.title}이 성공적으로 제출되었습니다.`,
        icon: <Check />,
        duration: 2000,
      });

      onBack();
    } catch (err) {
      console.error('등록 실패:', err);
    }
  };

  /* ================= render ================= */

  return (
    <Form {...form}>
      <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
        {/* ================= 상단 입력 ================= */}
        <div className="mt-6 mb-4 overflow-hidden">
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
                            className={`h-full! w-full border-0 p-0 text-[13px]! shadow-none ${error ? 'text-red-500!' : ''}`}>
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
                        className={`h-full w-full border-0 p-0 text-[13px] shadow-none ${
                          error ? 'placeholder-red-500!' : ''
                        } placeholder:text-[13px]!`}
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

          {/* 제목 */}
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
                        className={`h-full w-full border-0 p-0 text-[13px] shadow-none ${
                          error ? 'placeholder-red-500!' : ''
                        } placeholder:text-[13px]!`}
                      />
                    );
                  }}
                />
              </TableColumnCell>
            </TableColumnBody>
          </TableColumn>
        </div>

        {/* ================= 내용 ================= */}
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

        {/* ================= 하단 ================= */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-x-2">
            <ProposalAttachFiles mode="upload" files={files} onAddFiles={handleAddFiles} onRemove={handleRemoveFile} />

            {/* 🔥 업로드 중 표시 */}
            {isUploading && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>파일 업로드 중...</span>
              </div>
            )}
          </div>

          <div className="flex gap-x-2">
            <Button type="submit" disabled={isUploading}>
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  업로드 중...
                </>
              ) : (
                '제출'
              )}
            </Button>
            <Button type="button" variant="secondary" onClick={onBack} disabled={isUploading}>
              취소
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
