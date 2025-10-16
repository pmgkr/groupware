import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { cn } from '@/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { ProfileSchema, type ProfileValues } from '@/components/features/Profile/ProfileSchema';

import { SectionHeader } from '@components/ui/SectionHeader';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@components/ui/form';
import { Input } from '@components/ui/input';
import { Textarea } from '@components/ui/textarea';
import { Button } from '@components/ui/button';
import { Badge } from '@components/ui/badge';
import { DayPicker } from '@components/daypicker';
import { RadioButton, RadioGroup } from '@components/ui/radioButton';
import { Popover, PopoverTrigger, PopoverContent } from '@components/ui/popover';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectGroup, SelectItem } from '@components/ui/select';

import { Add, Calendar } from '@/assets/images/icons';
import { format } from 'date-fns';

export default function ExpenseRegister() {
  const form = useForm();
  const [desiredOpen, setDesiredOpen] = useState(false); // 입금희망일 팝업용

  // YYYY-MM-DD 포맷으로 변경
  const formatDate = (d?: Date) => (d ? format(d, 'yyyy-MM-dd') : '');

  return (
    <>
      <Form {...form}>
        <div className="grid min-h-160 grid-cols-6 grid-rows-1 gap-6">
          <div className="col-span-4">
            <SectionHeader title="기본 정보" className="mb-4" />
            {/* 기본정보 입력 폼 */}
            <div className="mb-12 grid grid-cols-4 gap-y-6 tracking-tight">
              <div className="pr-5 text-base leading-[1.5] text-gray-700">
                <FormField
                  control={form.control}
                  name="account_number"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex h-6 justify-between">
                        <FormLabel className="gap-.5 font-bold text-gray-950">
                          계좌번호<span className="text-primary-blue-500">*</span>
                        </FormLabel>
                        <Button variant="outlinePrimary" size="xs">
                          <Add />
                          계좌 불러오기
                        </Button>
                      </div>
                      <FormControl>
                        <Input placeholder="계좌번호를 입력해 주세요" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="long-v-divider px-5 text-base leading-[1.5] text-gray-700">
                <FormField
                  control={form.control}
                  name="account_bank"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex h-6 justify-between">
                        <FormLabel className="gap-.5 font-bold text-gray-950">
                          은행명<span className="text-primary-blue-500">*</span>
                        </FormLabel>
                      </div>
                      <FormControl>
                        <Select onValueChange={field.onChange} defaultValue={field.value} name={field.name}>
                          <FormControl>
                            <SelectTrigger className="aria-[invalid=true]:border-destructive w-full">
                              <SelectValue placeholder="은행 선택" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="max-h-80 w-full">
                            <SelectItem value="국민은행">국민은행</SelectItem>
                            <SelectItem value="신한은행">신한은행</SelectItem>
                            <SelectItem value="농협은행">농협은행</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="long-v-divider px-5 text-base leading-[1.5] text-gray-700">
                <FormField
                  control={form.control}
                  name="account_name"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex h-6 justify-between">
                        <FormLabel className="gap-.5 font-bold text-gray-950">
                          예금주명<span className="text-primary-blue-500">*</span>
                        </FormLabel>
                      </div>
                      <FormControl>
                        <Input placeholder="예금주명을 입력해 주세요" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="long-v-divider px-5 text-base leading-[1.5] text-gray-700">
                <FormField
                  control={form.control}
                  name="desired_deposit_date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <div className="flex h-6 justify-between">
                        <FormLabel className="gap-.5 font-bold text-gray-950">입금희망일</FormLabel>
                      </div>
                      <Popover open={desiredOpen} onOpenChange={setDesiredOpen}>
                        <div className="relative w-full">
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={'outline'}
                                className={cn(
                                  'border-input text-accent-foreground h-11 w-full px-3 text-left text-base font-normal hover:bg-[none]',
                                  !field.value && 'text-muted-foreground hover:text-muted-foreground'
                                )}>
                                {field.value ? String(field.value) : <span>YYYY-MM-DD</span>}
                                <Calendar className="ml-auto size-4.5 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                        </div>

                        <PopoverContent className="w-auto p-0" align="start">
                          <DayPicker
                            captionLayout="dropdown"
                            mode="single"
                            selected={field.value}
                            onSelect={(date) => {
                              const formattedDate = date ? formatDate(date) : null;
                              field.onChange(formattedDate);

                              if (date) setDesiredOpen(false);
                            }}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="col-span-4 text-base leading-[1.5] text-gray-700">
                <FormField
                  control={form.control}
                  name="expense_remark"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex h-6 justify-between">
                        <FormLabel className="gap-.5 font-bold text-gray-950">비고</FormLabel>
                      </div>
                      <FormControl>
                        <Textarea placeholder="추가 기입할 정보가 있으면 입력해 주세요." className="hover:shadow-none" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* 비용항목 입력 폼 */}
            <SectionHeader
              title="비용 항목"
              buttonText="항목 추가"
              buttonVariant="outlinePrimary"
              buttonSize="sm"
              buttonIcon={<Add className="size-4" />}
              onButtonClick={() => console.log('항목 추가')}
              className="mb-4"
            />
            <div className="">
              <article className="border-b border-gray-300 py-6 first:pt-0 last:border-b-0">
                <div className="flex items-center justify-between">
                  <RadioGroup defaultValue="PMG" className="flex gap-x-1.5 [&_button]:mb-0">
                    <RadioButton value="PMG" label="PMG" variant="dynamic" size="xs" iconHide={true} />
                    <RadioButton value="MCS" label="MCS" variant="dynamic" size="xs" iconHide={true} />
                    <RadioButton value="개인" label="개인카드" variant="dynamic" size="xs" iconHide={true} />
                  </RadioGroup>

                  {/* 증빙자료 첨부 상태에 따라 Badge 상태 변경 */}
                  <Badge className="bg-[#FFF098] text-[#BC9D47]">증빙자료 미제출</Badge>
                </div>
                <div className="mt-4 flex justify-between">
                  <div className="grid w-[66%] grid-cols-3 gap-4 tracking-tight">
                    <div className="long-v-divider text-base leading-[1.5] text-gray-700">
                      <FormField
                        control={form.control}
                        name="expense_type"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex h-6 justify-between">
                              <FormLabel className="gap-.5 font-bold text-gray-950">비용 유형</FormLabel>
                            </div>
                            <FormControl>
                              <Select onValueChange={field.onChange} defaultValue={field.value} name={field.name}>
                                <FormControl>
                                  <SelectTrigger className="aria-[invalid=true]:border-destructive w-full">
                                    <SelectValue placeholder="은행 선택" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent className="max-h-80 w-full">
                                  <SelectItem value="국민은행">국민은행</SelectItem>
                                  <SelectItem value="신한은행">신한은행</SelectItem>
                                  <SelectItem value="농협은행">농협은행</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="text-base leading-[1.5] text-gray-700">
                      <FormField
                        control={form.control}
                        name="expense_title"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex h-6 justify-between">
                              <FormLabel className="gap-.5 font-bold text-gray-950">비용 제목</FormLabel>
                            </div>
                            <FormControl>
                              <Input placeholder="비용 제목" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="text-base leading-[1.5] text-gray-700">
                      <FormField
                        control={form.control}
                        name="expense_date"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex h-6 justify-between">
                              <FormLabel className="gap-.5 font-bold text-gray-950">매입 날짜</FormLabel>
                            </div>
                            <FormControl>
                              <Input placeholder="매입 날짜" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="text-base leading-[1.5] text-gray-700">
                      <FormField
                        control={form.control}
                        name="expense_price"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex h-6 justify-between">
                              <FormLabel className="gap-.5 font-bold text-gray-950">금액</FormLabel>
                            </div>
                            <FormControl>
                              <Input placeholder="금액" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="text-base leading-[1.5] text-gray-700">
                      <FormField
                        control={form.control}
                        name="expense_tax"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex h-6 justify-between">
                              <FormLabel className="gap-.5 font-bold text-gray-950">세금</FormLabel>
                            </div>
                            <FormControl>
                              <Input placeholder="세금" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="text-base leading-[1.5] text-gray-700">
                      <FormField
                        control={form.control}
                        name="expense_total"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex h-6 justify-between">
                              <FormLabel className="gap-.5 font-bold text-gray-950">합계</FormLabel>
                            </div>
                            <FormControl>
                              <Input placeholder="합계" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  <div className="w-[32%] pl-2">
                    <FormField
                      control={form.control}
                      name="expense_attachment"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex h-6 justify-between">
                            <FormLabel className="gap-.5 font-bold text-gray-950">증빙자료</FormLabel>
                          </div>
                          <FormControl></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </article>
              <article className="border-b border-gray-300 py-6 first:pt-0 last:border-b-0">
                <div className="flex items-center justify-between">
                  <RadioGroup defaultValue="PMG" className="flex gap-x-1.5 [&_button]:mb-0">
                    <RadioButton value="PMG" label="PMG" variant="dynamic" size="xs" iconHide={true} />
                    <RadioButton value="MCS" label="MCS" variant="dynamic" size="xs" iconHide={true} />
                    <RadioButton value="개인" label="개인카드" variant="dynamic" size="xs" iconHide={true} />
                  </RadioGroup>

                  {/* 증빙자료 첨부 상태에 따라 Badge 상태 변경 */}
                  <Badge className="bg-[#FFF098] text-[#BC9D47]">증빙자료 미제출</Badge>
                </div>
                <div className="mt-4 flex justify-between">
                  <div className="grid w-[66%] grid-cols-3 gap-4 tracking-tight">
                    <div className="long-v-divider text-base leading-[1.5] text-gray-700">
                      <FormField
                        control={form.control}
                        name="expense_type"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex h-6 justify-between">
                              <FormLabel className="gap-.5 font-bold text-gray-950">비용 유형</FormLabel>
                            </div>
                            <FormControl>
                              <Select onValueChange={field.onChange} defaultValue={field.value} name={field.name}>
                                <FormControl>
                                  <SelectTrigger className="aria-[invalid=true]:border-destructive w-full">
                                    <SelectValue placeholder="은행 선택" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent className="max-h-80 w-full">
                                  <SelectItem value="국민은행">국민은행</SelectItem>
                                  <SelectItem value="신한은행">신한은행</SelectItem>
                                  <SelectItem value="농협은행">농협은행</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="text-base leading-[1.5] text-gray-700">
                      <FormField
                        control={form.control}
                        name="expense_title"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex h-6 justify-between">
                              <FormLabel className="gap-.5 font-bold text-gray-950">비용 제목</FormLabel>
                            </div>
                            <FormControl>
                              <Input placeholder="비용 제목" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="text-base leading-[1.5] text-gray-700">
                      <FormField
                        control={form.control}
                        name="expense_date"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex h-6 justify-between">
                              <FormLabel className="gap-.5 font-bold text-gray-950">매입 날짜</FormLabel>
                            </div>
                            <FormControl>
                              <Input placeholder="매입 날짜" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="text-base leading-[1.5] text-gray-700">
                      <FormField
                        control={form.control}
                        name="expense_price"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex h-6 justify-between">
                              <FormLabel className="gap-.5 font-bold text-gray-950">금액</FormLabel>
                            </div>
                            <FormControl>
                              <Input placeholder="금액" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="text-base leading-[1.5] text-gray-700">
                      <FormField
                        control={form.control}
                        name="expense_tax"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex h-6 justify-between">
                              <FormLabel className="gap-.5 font-bold text-gray-950">세금</FormLabel>
                            </div>
                            <FormControl>
                              <Input placeholder="세금" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="text-base leading-[1.5] text-gray-700">
                      <FormField
                        control={form.control}
                        name="expense_total"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex h-6 justify-between">
                              <FormLabel className="gap-.5 font-bold text-gray-950">합계</FormLabel>
                            </div>
                            <FormControl>
                              <Input placeholder="합계" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  <div className="w-[32%] pl-2">
                    <FormField
                      control={form.control}
                      name="expense_attachment"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex h-6 justify-between">
                            <FormLabel className="gap-.5 font-bold text-gray-950">증빙자료</FormLabel>
                          </div>
                          <FormControl></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </article>
              <article className="border-b border-gray-300 py-6 first:pt-0 last:border-b-0">
                <div className="flex items-center justify-between">
                  <RadioGroup defaultValue="PMG" className="flex gap-x-1.5 [&_button]:mb-0">
                    <RadioButton value="PMG" label="PMG" variant="dynamic" size="xs" iconHide={true} />
                    <RadioButton value="MCS" label="MCS" variant="dynamic" size="xs" iconHide={true} />
                    <RadioButton value="개인" label="개인카드" variant="dynamic" size="xs" iconHide={true} />
                  </RadioGroup>

                  {/* 증빙자료 첨부 상태에 따라 Badge 상태 변경 */}
                  <Badge className="bg-[#FFF098] text-[#BC9D47]">증빙자료 미제출</Badge>
                </div>
                <div className="mt-4 flex justify-between">
                  <div className="grid w-[66%] grid-cols-3 gap-4 tracking-tight">
                    <div className="long-v-divider text-base leading-[1.5] text-gray-700">
                      <FormField
                        control={form.control}
                        name="expense_type"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex h-6 justify-between">
                              <FormLabel className="gap-.5 font-bold text-gray-950">비용 유형</FormLabel>
                            </div>
                            <FormControl>
                              <Select onValueChange={field.onChange} defaultValue={field.value} name={field.name}>
                                <FormControl>
                                  <SelectTrigger className="aria-[invalid=true]:border-destructive w-full">
                                    <SelectValue placeholder="은행 선택" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent className="max-h-80 w-full">
                                  <SelectItem value="국민은행">국민은행</SelectItem>
                                  <SelectItem value="신한은행">신한은행</SelectItem>
                                  <SelectItem value="농협은행">농협은행</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="text-base leading-[1.5] text-gray-700">
                      <FormField
                        control={form.control}
                        name="expense_title"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex h-6 justify-between">
                              <FormLabel className="gap-.5 font-bold text-gray-950">비용 제목</FormLabel>
                            </div>
                            <FormControl>
                              <Input placeholder="비용 제목" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="text-base leading-[1.5] text-gray-700">
                      <FormField
                        control={form.control}
                        name="expense_date"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex h-6 justify-between">
                              <FormLabel className="gap-.5 font-bold text-gray-950">매입 날짜</FormLabel>
                            </div>
                            <FormControl>
                              <Input placeholder="매입 날짜" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="text-base leading-[1.5] text-gray-700">
                      <FormField
                        control={form.control}
                        name="expense_price"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex h-6 justify-between">
                              <FormLabel className="gap-.5 font-bold text-gray-950">금액</FormLabel>
                            </div>
                            <FormControl>
                              <Input placeholder="금액" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="text-base leading-[1.5] text-gray-700">
                      <FormField
                        control={form.control}
                        name="expense_tax"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex h-6 justify-between">
                              <FormLabel className="gap-.5 font-bold text-gray-950">세금</FormLabel>
                            </div>
                            <FormControl>
                              <Input placeholder="세금" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="text-base leading-[1.5] text-gray-700">
                      <FormField
                        control={form.control}
                        name="expense_total"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex h-6 justify-between">
                              <FormLabel className="gap-.5 font-bold text-gray-950">합계</FormLabel>
                            </div>
                            <FormControl>
                              <Input placeholder="합계" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  <div className="w-[32%] pl-2">
                    <FormField
                      control={form.control}
                      name="expense_attachment"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex h-6 justify-between">
                            <FormLabel className="gap-.5 font-bold text-gray-950">증빙자료</FormLabel>
                          </div>
                          <FormControl></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </article>
            </div>
          </div>
          <div className="col-span-2">
            <div className="h-full rounded-xl bg-gray-300"></div>
          </div>
        </div>
      </Form>
    </>
  );
}
