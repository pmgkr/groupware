"use client"

import * as React from "react"
import { CalendarIcon } from "@radix-ui/react-icons"
import { addDays, format } from "date-fns"
import { ko } from "date-fns/locale"
import type { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export function DatePickerWithRange({
  className,
}: React.HTMLAttributes<HTMLDivElement>) {
  const [date, setDate] = React.useState<DateRange | undefined>({
    from: new Date(),
    to: addDays(new Date(), 20),
  })

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
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
              <span>날짜 범위 선택</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={setDate}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
