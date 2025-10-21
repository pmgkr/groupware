import { TableColumn, TableColumnHeader, TableColumnHeaderCell, TableColumnBody, TableColumnCell } from '@/components/ui/tableColumn';
import { Textbox } from '@/components/ui/textbox';

export type BookFormData = {
  id?: number;
  category: string;
  title: string;
  author: string;
  publish: string;
  buylink?: string;
  purchaseAt?: string;
  team_id?: number;
  user?: string;
  createdAt?: string;
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

  // onChange는 view 모드일 때 없음
  const handleChange = mode === 'view' ? undefined : props.onChange;

  return (
    <TableColumn>
      <TableColumnHeader className="text-base">
        <TableColumnHeaderCell>카테고리</TableColumnHeaderCell>
        <TableColumnHeaderCell>도서명</TableColumnHeaderCell>
        <TableColumnHeaderCell>저자명</TableColumnHeaderCell>
        <TableColumnHeaderCell>출판사</TableColumnHeaderCell>
        {(mode === 'apply' || mode === 'view' || mode === 'edit') && <TableColumnHeaderCell>링크</TableColumnHeaderCell>}
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
              onChange={(e) => handleChange?.('category', e.target.value)}
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
                  className="max-w-[300px] truncate text-blue-600 underline hover:text-blue-800">
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
        {mode === 'view' && <TableColumnCell className="px-4 py-2.5">{form.team_id}</TableColumnCell>}

        {/* 신청자 (view 전용) */}
        {mode === 'view' && <TableColumnCell className="px-4 py-2.5">{form.user}</TableColumnCell>}

        {/* 구매일자 (create 전용) */}
        {mode === 'create' && (
          <TableColumnCell>
            <Textbox
              id="entryDate"
              type="date"
              className="w-full justify-start border-0"
              value={form.purchaseAt}
              onChange={(e) => handleChange?.('purchaseAt', e.target.value)}
            />
          </TableColumnCell>
        )}
      </TableColumnBody>
    </TableColumn>
  );
}
