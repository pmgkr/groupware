import { type Control } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@components/ui/form';
import { Input } from '@components/ui/input';

type EntertainmentProps = {
  control: Control<any>;
  index: number;
};

export function EntertainmentFields({ control, index }: EntertainmentProps) {
  return (
    <div className="mt-6 grid grid-cols-2 gap-4 rounded-lg bg-gray-50 p-4">
      <FormField
        control={control}
        name={`expense_items.${index}.ent_member`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              접대 대상 <span className="text-red-500">*</span>
            </FormLabel>
            <FormControl>
              <Input placeholder="접대 대상 입력" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name={`expense_items.${index}.ent_reason`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              접대 사유 <span className="text-red-500">*</span>
            </FormLabel>
            <FormControl>
              <Input placeholder="접대 사유 입력" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
