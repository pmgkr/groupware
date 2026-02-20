import { type Control } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@components/ui/form';
import { Input } from '@components/ui/input';

type EntertainmentProps = {
  control: Control<any>;
  index: number;
};

export function EntertainmentFields({ control, index }: EntertainmentProps) {
  return (
    <div className="mt-6 grid w-full grid-cols-2 gap-4 border-t-1 border-dashed border-gray-300 pt-6 tracking-tight">
      <FormField
        control={control}
        name={`expense_items.${index}.ent_member`}
        render={({ field }) => (
          <FormItem>
            <FormLabel className="gap-.5 font-bold text-gray-950">접대 대상</FormLabel>
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
            <FormLabel className="gap-.5 font-bold text-gray-950">접대 사유</FormLabel>
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
