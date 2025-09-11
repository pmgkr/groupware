"use client"

import * as React from "react"
import { CalendarIcon } from "@radix-ui/react-icons"
import { addDays, format } from "date-fns"
import { ko } from "date-fns/locale"
import type { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { DayPicker } from "@/components/daypicker"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export function DatePickerWithRange({
  className,
  selected,
  onSelect,
  placeholder = "날짜 범위를 선택해주세요"
}: {
  className?: string;
  selected?: DateRange;
  onSelect?: (range: DateRange | undefined) => void;
  placeholder?: string;
}) {
  const [date, setDate] = React.useState<DateRange | undefined>(selected)
  const [open, setOpen] = React.useState(false)

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover modal={true} open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "yyyy년 M월 d일 EEEE", { locale: ko })} -{" "}
                  {format(date.to, "yyyy년 M월 d일 EEEE", { locale: ko })}
                </>
              ) : (
                format(date.from, "yyyy년 M월 d일 EEEE", { locale: ko })
              )
            ) : (
              <span>{placeholder}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-auto p-0 z-[1000]" 
          align="start"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div className="flex flex-col">
            <DayPicker
              initialFocus
              mode="range"
              defaultMonth={date?.from}
              selected={date}
              onSelect={(selectedRange) => {
                setDate(selectedRange);
                onSelect?.(selectedRange);
              }}
              numberOfMonths={2}
            />
            {date?.from && date?.to && (
              <div className="p-3 border-t">
                <Button 
                  className="w-full" 
                  onClick={() => setOpen(false)}
                >
                  선택완료
                </Button>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
