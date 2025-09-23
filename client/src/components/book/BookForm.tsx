import { TableColumn, TableColumnHeader, TableColumnHeaderCell, TableColumnBody, TableColumnCell } from '@/components/ui/tableColumn';
import { Textbox } from '@/components/ui/textbox';

export type BookFormData = {
  category: string;
  title: string;
  author: string;
  publish: string;
  link?: string;
  purchaseAt?: string;
  team?: string;
  user?: string;
};

type BookFormProps = {
  form: BookFormData;
  onChange: (key: keyof BookFormData, value: string) => void;
  mode?: 'create' | 'edit' | 'view' | 'apply';
};

export function BookForm({ form, onChange, mode = 'create' }: BookFormProps) {
  const readOnly = mode === 'view';

  return (
    <TableColumn>
      <TableColumnHeader className="text-base">
        <TableColumnHeaderCell>카테고리</TableColumnHeaderCell>
        <TableColumnHeaderCell>도서명</TableColumnHeaderCell>
        <TableColumnHeaderCell>저자명</TableColumnHeaderCell>
        <TableColumnHeaderCell>출판사</TableColumnHeaderCell>
        {(mode === 'apply' || mode === 'view') && <TableColumnHeaderCell>링크</TableColumnHeaderCell>}
        {mode === 'view' && <TableColumnHeaderCell>팀</TableColumnHeaderCell>}
        {mode === 'view' && <TableColumnHeaderCell>신청자</TableColumnHeaderCell>}
        {mode === 'create' && <TableColumnHeaderCell>구매일자</TableColumnHeaderCell>}
      </TableColumnHeader>

      <TableColumnBody className="text-base">
        {/* 카테고리 */}
        <TableColumnCell>
          {readOnly ? (
            form.category
          ) : (
            <input
              type="text"
              value={form.category}
              onChange={(e) => onChange('category', e.target.value)}
              placeholder="*yes24 기준 카테고리를 입력해주세요"
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
              onChange={(e) => onChange('title', e.target.value)}
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
            <input type="text" value={form.author} onChange={(e) => onChange('author', e.target.value)} placeholder="저자명 입력해주세요" />
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
              onChange={(e) => onChange('publish', e.target.value)}
              placeholder="출판사 입력해주세요"
            />
          )}
        </TableColumnCell>

        {/* 링크 (apply, view 모드일 때) */}
        {(mode === 'apply' || mode === 'view') && (
          <TableColumnCell>
            {readOnly ? (
              form.link ? (
                <a
                  href={form.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="max-w-[300px] truncate text-blue-600 underline hover:text-blue-800">
                  {form.link}
                </a>
              ) : (
                '-'
              )
            ) : (
              <input
                type="url"
                value={form.link || ''}
                onChange={(e) => onChange('link', e.target.value)}
                placeholder="링크 입력해주세요"
              />
            )}
          </TableColumnCell>
        )}

        {/* 팀 (view 모드일 때) */}
        {mode === 'view' && <TableColumnCell className={readOnly ? 'px-4 py-2.5' : 'p-0'}>{form.team}</TableColumnCell>}

        {/* 신청자 (view 모드일 때) */}
        {mode === 'view' && <TableColumnCell className={readOnly ? 'px-4 py-2.5' : 'p-0'}>{form.user}</TableColumnCell>}

        {/* 구매일자 (create 모드일 때) */}
        {mode === 'create' && (
          <TableColumnCell className={readOnly ? 'px-4 py-2.5' : 'p-0'}>
            {readOnly ? (
              form.purchaseAt
            ) : (
              <Textbox
                id="entryDate"
                type="date"
                className="w-full justify-start border-0"
                value={form.purchaseAt}
                onChange={(e) => onChange('purchaseAt', e.target.value)}
              />
            )}
          </TableColumnCell>
        )}
      </TableColumnBody>
    </TableColumn>
  );
}
