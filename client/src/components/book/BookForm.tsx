import { TableColumn, TableColumnHeader, TableColumnHeaderCell, TableColumnBody, TableColumnCell } from '@/components/ui/tableColumn';
import { Textbox } from '@/components/ui/textbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/assets/images/icons';
import { DayPicker } from '../daypicker';
import { useState } from 'react';
import { formatKST } from '@/utils';
import { Button } from '../ui/button';

export type BookFormData = {
  id?: number;
  category: string;
  title: string;
  author: string;
  publish: string;
  buylink?: string;
  purchaseAt?: string;
  team_id?: number;
  user_name?: string;
  createdAt?: string;
  team_name?: string;
};

type EditableBookFormData = Pick<BookFormData, 'category' | 'title' | 'author' | 'publish' | 'buylink' | 'purchaseAt'>;

type BookFormProps =
  | {
      mode: 'create' | 'edit' | 'apply';
      form: EditableBookFormData;
      onChange: (key: keyof EditableBookFormData, value: string) => void;
    }
  | {
      mode: 'view';
      form: BookFormData;
      onChange?: never;
    };

export function BookForm(props: BookFormProps) {
  const { form, mode } = props;
  const readOnly = mode === 'view';
  const [open, setOpen] = useState(false);
  const [selectDate, setSelectDate] = useState(formatKST(new Date(), true));
  const date = new Date(selectDate);

  // onChange는 view 모드일 때 없음
  const handleChange = mode === 'view' ? undefined : props.onChange;

  return (
    <TableColumn className="max-md:w-full max-md:min-w-0 [&>div]:text-[13px]">
      <TableColumnHeader className="max-md:[&>div] text-base max-md:w-22.5 max-md:border-r-0 max-md:[&>div]:bg-white max-md:[&>div]:px-3 max-md:[&>div]:font-normal max-md:[&>div]:text-gray-600">
        <TableColumnHeaderCell>카테고리</TableColumnHeaderCell>
        <TableColumnHeaderCell>도서명</TableColumnHeaderCell>
        <TableColumnHeaderCell>저자명</TableColumnHeaderCell>
        <TableColumnHeaderCell>출판사</TableColumnHeaderCell>
        {(mode === 'apply' || mode === 'view' || mode === 'edit') && <TableColumnHeaderCell>링크</TableColumnHeaderCell>}
        {mode === 'view' && <TableColumnHeaderCell>팀</TableColumnHeaderCell>}
        {mode === 'view' && <TableColumnHeaderCell>신청자</TableColumnHeaderCell>}
        {mode === 'create' && <TableColumnHeaderCell>구매일자</TableColumnHeaderCell>}
      </TableColumnHeader>

      <TableColumnBody className="w-full min-w-0 text-base [&>div]:text-black max-md:[&>div]:justify-end max-md:[&>div]:truncate max-md:[&>div]:px-3">
        {/* 카테고리 */}
        <TableColumnCell>
          {readOnly ? (
            form.category
          ) : (
            <input
              type="text"
              value={form.category}
              onChange={(e) => handleChange?.('category', e.target.value)}
              placeholder="* 알라딘 기준 카테고리를 입력해주세요"
              className="w-full"
            />
          )}
        </TableColumnCell>

        {/* 도서명 */}
        <TableColumnCell>
          {readOnly ? (
            form.title
          ) : (
            <input
              type="text"
              value={form.title}
              onChange={(e) => handleChange?.('title', e.target.value)}
              placeholder="도서명 입력해주세요"
              className="w-full"
            />
          )}
        </TableColumnCell>

        {/* 저자명 */}
        <TableColumnCell>
          {readOnly ? (
            form.author
          ) : (
            <input
              type="text"
              value={form.author}
              onChange={(e) => handleChange?.('author', e.target.value)}
              placeholder="저자명 입력해주세요"
              className="w-full"
            />
          )}
        </TableColumnCell>

        {/* 출판사 */}
        <TableColumnCell>
          {readOnly ? (
            form.publish
          ) : (
            <input
              type="text"
              value={form.publish}
              onChange={(e) => handleChange?.('publish', e.target.value)}
              placeholder="출판사 입력해주세요"
              className="w-full"
            />
          )}
        </TableColumnCell>

        {/* 링크 */}
        {(mode === 'apply' || mode === 'view' || mode === 'edit') && (
          <TableColumnCell>
            {readOnly ? (
              form.buylink ? (
                <a
                  href={form.buylink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full max-w-[300px] truncate break-all text-blue-600 underline hover:text-blue-800 max-md:w-full max-md:text-right">
                  {form.buylink}
                </a>
              ) : (
                '-'
              )
            ) : (
              <input
                type="url"
                value={form.buylink || ''}
                onChange={(e) => handleChange?.('buylink', e.target.value)}
                placeholder="링크 입력해주세요"
                className="w-full"
              />
            )}
          </TableColumnCell>
        )}

        {/* 팀 (view 전용) */}
        {mode === 'view' && <TableColumnCell className="px-4 py-2.5">{form.team_name}</TableColumnCell>}

        {/* 신청자 (view 전용) */}
        {mode === 'view' && <TableColumnCell className="px-4 py-2.5">{form.user_name}</TableColumnCell>}

        {/* 구매일자 (create 전용) */}
        {mode === 'create' && (
          <TableColumnCell className="p-0 max-md:justify-start! max-md:py-2.5">
            <Popover open={open} onOpenChange={setOpen}>
              <div className="relative">
                <PopoverTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-[45px] w-full items-center rounded-none border-0 px-5 text-left font-normal text-gray-900 shadow-none max-md:px-0!">
                    <Calendar className="ml-auto size-4.5 opacity-50" />
                    {selectDate}
                  </Button>
                </PopoverTrigger>
              </div>
              <PopoverContent className="w-auto p-0" align="start">
                <DayPicker
                  key={selectDate}
                  captionLayout="dropdown"
                  mode="single"
                  selected={date}
                  month={date}
                  onSelect={(d) => {
                    if (!d) return;
                    setSelectDate(formatKST(d, true));
                    handleChange?.('purchaseAt', formatKST(d, true));
                  }}
                />
              </PopoverContent>
            </Popover>
          </TableColumnCell>
        )}
      </TableColumnBody>
    </TableColumn>
  );
}
