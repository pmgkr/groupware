"use client"

import * as React from "react"
import { CalendarIcon } from "@radix-ui/react-icons"
import { format } from "date-fns"
import { ko } from "date-fns/locale"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { DayPicker } from "@/components/daypicker"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export function DatePickerDemo({
  selected,
  onSelect,
  placeholder = "날짜를 선택해주세요"
}: { 
  selected?: Date; 
  onSelect?: (date: Date | undefined) => void;
  placeholder?: string;
} = {}) {
  const [date, setDate] = React.useState<Date | undefined>(selected)
  const [open, setOpen] = React.useState(false)

  return (
    <Popover modal={true} open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "yyyy년 M월 d일 EEEE", { locale: ko }) : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-auto p-0 z-[1000]" 
        align="start"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col">
          <DayPicker
            mode="single"
            selected={date}
            onSelect={(selectedDate) => {
              setDate(selectedDate);
              onSelect?.(selectedDate);
            }}
            initialFocus
          />
          {date && (
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
  )
}
