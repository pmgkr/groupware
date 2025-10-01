"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarIcon } from "@radix-ui/react-icons";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { DayPicker } from "@/components/daypicker";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";

const FormSchema = z.object({
  dateRange: z.object({
    from: z.date({
      required_error: "시작일을 입력해주세요.",
    }),
    to: z.date({
      required_error: "종료일을 입력해주세요.",
    }),
  }),
});

export function DatePickerWithRangeForm({
  placeholder = "날짜 범위를 선택해주세요"
}: {
  placeholder?: string;
} = {}) {
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
  });

  function onSubmit(data: z.infer<typeof FormSchema>) {
    toast.success(`선택된 날짜 범위: ${format(data.dateRange.from, "yyyy년 M월 d일 EEEE", { locale: ko })} ~ ${format(data.dateRange.to, "yyyy년 M월 d일 EEEE", { locale: ko })}`);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="dateRange"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              {/* <FormLabel>Select date range</FormLabel> */}
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      id="date"
                      variant={"outline"}
                      className={cn(
                        "w-full justify-between text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value?.from ? (
                        field.value.to ? (
                          <>
                            {format(field.value.from, "yyyy년 M월 d일 EEEE", { locale: ko })} -{" "}
                            {format(field.value.to, "yyyy년 M월 d일 EEEE", { locale: ko })}
                          </>
                        ) : (
                          format(field.value.from, "yyyy년 M월 d일 EEEE", { locale: ko })
                        )
                      ) : (
                        <span>{placeholder}</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent 
                  className="w-auto p-0" 
                  align="start"
                >
                  <DayPicker
                    initialFocus
                    mode="range"
                    defaultMonth={field.value?.from}
                    selected={field.value}
                    onSelect={field.onChange}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
              <FormDescription>
                이벤트의 날짜 범위를 선택해주세요.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">제출</Button>
      </form>
    </Form>
  );
}
