"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarIcon } from "@radix-ui/react-icons";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { useForm } from "react-hook-form";
import { useState } from "react";
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
  dob: z.date({
    required_error: "생년월일을 입력해주세요.",
  }),
});

export function DatePickerForm({
  placeholder = "날짜를 선택해주세요"
}: {
  placeholder?: string;
} = {}) {
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
  });

  function onSubmit(data: z.infer<typeof FormSchema>) {
    toast.success(`선택된 생년월일: ${format(data.dob, "yyyy년 M월 d일 EEEE", { locale: ko })}`);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="dob"
          render={({ field }) => {
            const [open, setOpen] = useState(false);
            return (
              <FormItem className="flex flex-col">
                {/* <FormLabel>Date of birth</FormLabel> */}
                <Popover modal={true} open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "yyyy년 M월 d일 EEEE", { locale: ko })
                      ) : (
                        <span>{placeholder}</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent 
                  className="w-auto p-0 z-[1000]" 
                  align="start"
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  <DayPicker
                    mode="single"
                    selected={field.value}
                    onSelect={(date) => {
                      field.onChange(date);
                      if (date) {
                        setOpen(false);
                      }
                    }}
                    disabled={(date) =>
                      date > new Date() || date < new Date("1900-01-01")
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormDescription>
                provided by <a href="https://ui.shadcn.com/docs/components/date-picker#form" target="_blank" className="underline">shadcn</a>
              </FormDescription>
              <FormMessage />
            </FormItem>
            );
          }}
        />
        <Button type="submit">제출</Button>
      </form>
    </Form>
  );
}
