import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import ReactQuillEditor from '@/components/board/ReactQuillEditor';
import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { BoardAttachFile } from '@/components/board/BoardAttachFile';
import { formatAmount } from '@/utils';
import { registerReport } from '@/api/expense/proposal';

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

  const navigate = useNavigate();
  const [files, setFiles] = useState<PreviewFile[]>([]);
  const [deletedFileIds, setDeletedFileIds] = useState<number[]>([]);
  const [formattedPrice, setFormattedPrice] = useState('');

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
  // 폼 제출 핸들러
  const onSubmit = async (data: FormValues) => {
    try {
      const payload = {
        rp_category: data.category,
        rp_title: data.title,
        rp_state: '진행',
        rp_content: data.content,
        rp_cost: Number(data.price),
        rp_project_type: 'non_project',
        rp_expense_no: '',
        references: [],

        // 🔥 파일명만 전달해야 함 (File 객체 X)
        files: files.map((file) => ({
          rf_name: file.name,
          rf_type: file.type?.split('/')[1] ?? '',
        })),
      };

      console.log('📌 최종 전송 payload:', payload);

      await registerReport(payload); // JSON 방식으로 수정할 것
      navigate('..');
    } catch (err) {
      console.error('❌ 등록 실패:', err);
    }
  };

  return (
    <div>
      <div>
        <Form {...form}>
          <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
            {/* 카테고리 Select Box */}
            <div className="mb-3 flex flex-1 gap-x-2.5">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem className="w-[180px]">
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="카테고리를 선택하세요" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="교육비">교육비</SelectItem>
                        <SelectItem value="구매요청">구매요청</SelectItem>
                        <SelectItem value="일반비용">일반비용</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 제목 Input */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormControl>
                      <Input placeholder="제목을 입력하세요" {...field} />
                    </FormControl>

                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {/* 금액 Input */}
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      placeholder="금액을 입력하세요"
                      inputMode="numeric"
                      value={formattedPrice}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/,/g, '');
                        // 숫자 외 입력 방지
                        if (!/^\d*$/.test(raw)) return;
                        // RHF 실제 값 업데이트
                        field.onChange(raw);
                        // 화면 표시용 formatting
                        setFormattedPrice(raw ? formatAmount(raw) : '');
                      }}
                    />
                  </FormControl>

                  <FormMessage />
                </FormItem>
              )}
            />
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
                <Button type="button" variant="secondary" onClick={() => navigate('..')}>
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
