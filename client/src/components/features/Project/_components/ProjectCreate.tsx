import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { cn } from '@/lib/utils';
import { useToggleState } from '@/hooks/useToggleState';
import { useUser } from '@/hooks/useUser';

import { MemberSelect, type Member } from '@components/common/MemberSelect';
import { getClientList, type ClientList } from '@/api';

import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { SearchableSelect, type SingleSelectOption } from '@components/ui/SearchableSelect';
import { Badge } from '@components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@components/ui/avatar';
import { Select, SelectTriggerFull, SelectValue, SelectContent, SelectItem } from '@components/ui/select';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@components/ui/form';
import { Dialog, DialogTrigger, DialogClose, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Popover, PopoverTrigger, PopoverContent } from '@components/ui/popover';
import { DayPicker } from '@components/daypicker';
import { format } from 'date-fns';

import { CalendarIcon, Plus } from 'lucide-react';

const projectSchema = z.object({
  year: z.string(),
  brand: z.string(),
  category: z.string(),
  client: z.string(),
  projectName: z.string().min(2, '프로젝트 이름을 입력하세요.'),
  members: z.array(z.string()).min(1, '멤버를 선택하세요.'),
  project_sdate: z.date(),
  project_edate: z.date(),
});

type ProjectFormValues = z.infer<typeof projectSchema>;

type Props = {
  onClose?: () => void;
};

export function ProjectCreateForm({ onClose }: Props) {
  const { user_id, user_name, profile_image } = useUser();
  const formatDate = (d?: Date) => (d ? format(d, 'yyyy-MM-dd') : '');

  // API 데이터 State
  const [clientOptions, setClientOptions] = useState<SingleSelectOption[]>([]);

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      year: '2026',
      brand: '',
      category: '',
      client: '',
      projectName: '',
      members: [],
    },
  });

  useEffect(() => {
    (async () => {
      try {
        const res = await getClientList();
        console.log('📦 클라이언트 API 응답:', res);

        const mapped = res.map((t: any) => ({
          label: t.cl_name,
          value: String(t.cl_seq),
        }));

        setClientOptions(mapped);
      } catch (err) {
        console.error('❌ 클라이언트 불러오기 오류 :', err);
      }
    })();
  }, []);

  const [members, setMembers] = useState<Member[]>(() =>
    user_id && user_name
      ? [
          {
            user_id,
            user_name,
            profile_image: profile_image ?? undefined,
            user_type: 'owner',
          },
        ]
      : []
  );

  const handleSubmit = async (values: ProjectFormValues) => {};

  const handleCancel = () => {
    form.reset();
    setMembers(
      user_id && user_name
        ? [
            {
              user_id,
              user_name,
              profile: profile_image ?? undefined,
              user_type: 'owner',
            } as Member,
          ]
        : []
    );
    onClose?.();
  };

  return (
    <Form {...form}>
      <Dialog>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5 pt-4">
          <div className="grid grid-cols-2 gap-4">
            {/* 생성년도 */}
            <FormField
              control={form.control}
              name="year"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>생성년도</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTriggerFull className="w-full">
                        <SelectValue placeholder="년도 선택" />
                      </SelectTriggerFull>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="2025">2025</SelectItem>
                      <SelectItem value="2026">2026</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            {/* 브랜드 */}
            <FormField
              control={form.control}
              name="brand"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ICG 브랜드</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTriggerFull>
                        <SelectValue placeholder="브랜드 선택" />
                      </SelectTriggerFull>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="PMG">PMG</SelectItem>
                      <SelectItem value="MCS">MCS</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            {/* 카테고리 */}
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>카테고리</FormLabel>
                  <FormControl>
                    <SearchableSelect
                      placeholder="카테고리 선택"
                      options={[
                        { label: 'Event', value: 'Event' },
                        { label: 'Campaign', value: 'Campaign' },
                        { label: 'Web', value: 'Web' },
                      ]}
                      value={field.value}
                      onChange={(v) => field.onChange(v)}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* 클라이언트 */}
            <FormField
              control={form.control}
              name="client"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>클라이언트</FormLabel>
                  <FormControl>
                    <SearchableSelect
                      placeholder="클라이언트 선택"
                      options={clientOptions}
                      value={field.value}
                      onChange={(v) => field.onChange(v)}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          {/* 프로젝트 이름 */}
          <FormField
            control={form.control}
            name="projectName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>프로젝트 이름</FormLabel>
                <FormControl>
                  <Input placeholder="프로젝트 이름을 입력해 주세요" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 날짜 */}
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="project_sdate"
              render={({ field }) => {
                const { isOpen, setIsOpen, close } = useToggleState();

                return (
                  <FormItem>
                    <FormLabel>프로젝트 시작일</FormLabel>
                    <Popover open={isOpen} onOpenChange={setIsOpen} modal={true}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              'border-input focus-visible:border-primary-blue-300 h-11 w-full px-3 text-left text-base font-normal text-gray-800 hover:bg-[none]',
                              !field.value && 'text-muted-foreground hover:text-muted-foreground',
                              isOpen && 'border-primary-blue-300'
                            )}>
                            {field.value ? formatDate(field.value) : <span>날짜 선택</span>}
                            <CalendarIcon className="ml-auto size-4.5 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <DayPicker
                          captionLayout="dropdown"
                          mode="single"
                          selected={field.value ? new Date(field.value) : undefined}
                          onSelect={(date) => {
                            const formattedDate = date ? formatDate(date) : null;
                            field.onChange(formattedDate);

                            if (date) close();
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                  </FormItem>
                );
              }}
            />

            <FormField
              control={form.control}
              name="project_edate"
              render={({ field }) => {
                const { isOpen, setIsOpen, close } = useToggleState();

                return (
                  <FormItem>
                    <FormLabel>프로젝트 종료일</FormLabel>
                    <Popover open={isOpen} onOpenChange={setIsOpen} modal={true}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              'border-input focus-visible:border-primary-blue-300 h-11 w-full px-3 text-left text-base font-normal text-gray-800 hover:bg-[none]',
                              !field.value && 'text-muted-foreground hover:text-muted-foreground',
                              isOpen && 'border-primary-blue-300'
                            )}>
                            {field.value ? formatDate(field.value) : <span>날짜 선택</span>}
                            <CalendarIcon className="ml-auto size-4.5 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <DayPicker
                          captionLayout="dropdown"
                          mode="single"
                          selected={field.value ? new Date(field.value) : undefined}
                          onSelect={(date) => {
                            const formattedDate = date ? formatDate(date) : null;
                            field.onChange(formattedDate);

                            if (date) close();
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                  </FormItem>
                );
              }}
            />
          </div>

          {/* 프로젝트 멤버 */}
          <FormItem>
            <div className="flex items-center justify-between">
              <FormLabel>프로젝트 멤버</FormLabel>
              <DialogTrigger asChild>
                <Button type="button" variant="ghost" size="xs" className="text-primary-blue-500 hover:text-primary-blue-500">
                  <Plus className="size-3.5" />
                  멤버 추가
                </Button>
              </DialogTrigger>
            </div>
            <div className="border-input flex flex-wrap gap-2">
              {members.map((m) => (
                <Badge key={m.user_id} variant="grayish" className="flex items-center gap-1 px-1.5 py-1 not-has-[>button]:px-2">
                  <Avatar className="size-5">
                    <AvatarImage src={`${import.meta.env.VITE_API_ORIGIN}/uploads/users/${m.profile_image}`} />
                    <AvatarFallback className="text-xs">{m.user_name[0]}</AvatarFallback>
                  </Avatar>
                  {m.user_name}
                  {user_id !== m.user_id && (
                    <button
                      type="button"
                      className="ml-1 cursor-pointer text-gray-500 hover:text-gray-700"
                      onClick={() => setMembers((prev) => prev.filter((x) => x.user_id !== m.user_id))}>
                      ✕
                    </button>
                  )}
                </Badge>
              ))}
            </div>
          </FormItem>

          <div className="flex justify-end gap-3 pt-3">
            <Button type="button" variant="outline" onClick={handleCancel}>
              취소
            </Button>
            <Button type="submit">등록</Button>
          </div>
        </form>

        <DialogContent>
          <DialogHeader>
            <DialogTitle>멤버 선택</DialogTitle>
          </DialogHeader>

          <MemberSelect
            value={members}
            onChange={(selected) =>
              setMembers((prev) => {
                const owner = prev.find((m) => m.user_type === 'owner');
                const unique = selected.filter((m) => m.user_id !== owner?.user_id);
                return owner ? [owner, ...unique] : unique;
              })
            }
            currentUserId={user_id}
          />

          <ul className="mt-2 flex flex-wrap items-center gap-2">
            {members.map((m) => (
              <li key={m.user_id}>
                <Badge key={m.user_id} variant="grayish" className="flex items-center gap-1 px-1.5 py-1 not-has-[>button]:px-2">
                  <Avatar className="size-5">
                    <AvatarImage src={`${import.meta.env.VITE_API_ORIGIN}/uploads/users/${m.profile_image}`} />
                    <AvatarFallback className="text-xs">{m.user_name[0]}</AvatarFallback>
                  </Avatar>
                  {m.user_name}
                  {user_id !== m.user_id && (
                    <button
                      type="button"
                      className="ml-1 cursor-pointer text-gray-500 hover:text-gray-700"
                      onClick={() => setMembers((prev) => prev.filter((x) => x.user_id !== m.user_id))}>
                      ✕
                    </button>
                  )}
                </Badge>
              </li>
            ))}
          </ul>

          <div className="mt-4 flex justify-end">
            <DialogClose asChild>
              <Button type="button">확인</Button>
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>
    </Form>
  );
}
