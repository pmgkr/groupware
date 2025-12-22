"use client";

import * as React from "react";
import { CalendarIcon } from "@radix-ui/react-icons"
import { format } from "date-fns";
import { ko } from "date-fns/locale";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { DayPicker } from "@/components/daypicker";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

export function DateTimePicker24h({
  placeholder = "날짜와 시간을 선택해주세요",
  timeRestriction,
  selected,
  onSelect
}: {
  placeholder?: string;
  timeRestriction?: {
    startHour: number;
    startMinute: number;
    endHour: number;
    endMinute: number;
  };
  selected?: Date;
  onSelect?: (date: Date | undefined) => void;
} = {}) {
  const [date, setDate] = React.useState<Date | undefined>(selected);
  const [isOpen, setIsOpen] = React.useState(false);

  // 외부에서 selected 값이 변경되면 내부 상태도 업데이트
  React.useEffect(() => {
    setDate(selected);
  }, [selected]);

  // 시간 제한이 있는 경우 해당 시간대만 표시
  const getAvailableHours = () => {
    if (timeRestriction) {
      const availableHours = [];
      for (let hour = timeRestriction.startHour; hour <= timeRestriction.endHour; hour++) {
        availableHours.push(hour);
      }
      return availableHours;
    }
    return Array.from({ length: 24 }, (_, i) => i);
  };

  const hours = getAvailableHours();
  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      // 기존 시간을 유지하면서 날짜만 업데이트
      const currentTime = date ? { hours: date.getHours(), minutes: date.getMinutes() } : { hours: 0, minutes: 0 };
      const localDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), currentTime.hours, currentTime.minutes, 0);
      setDate(localDate);
      onSelect?.(localDate);
    }
  };

  const handleTimeChange = (
    type: "hour" | "minute",
    value: string
  ) => {
    if (date) {
      const newDate = new Date(date);
      if (type === "hour") {
        newDate.setHours(parseInt(value));
      } else if (type === "minute") {
        newDate.setMinutes(parseInt(value));
      }
      setDate(newDate);
      onSelect?.(newDate); // 시간 변경 시 부모 컴포넌트에 알림
    }
  };

  // 시간 제한이 있는 경우 해당 시간대의 분만 표시
  const getAvailableMinutes = () => {
    if (timeRestriction && date) {
      const currentHour = date.getHours();
      const minutes = [];
      
      if (currentHour === timeRestriction.startHour && currentHour === timeRestriction.endHour) {
        // 시작 시간과 종료 시간이 같은 시간대인 경우
        for (let min = timeRestriction.startMinute; min <= timeRestriction.endMinute; min += 5) {
          minutes.push(min);
        }
      } else if (currentHour === timeRestriction.startHour) {
        // 시작 시간인 경우 시작 분부터 60분까지
        for (let min = timeRestriction.startMinute; min < 60; min += 5) {
          minutes.push(min);
        }
      } else if (currentHour === timeRestriction.endHour) {
        // 종료 시간인 경우 0분부터 종료 분까지
        for (let min = 0; min <= timeRestriction.endMinute; min += 5) {
          minutes.push(min);
        }
      } else {
        // 중간 시간인 경우 0분부터 60분까지
        for (let min = 0; min < 60; min += 5) {
          minutes.push(min);
        }
      }
      return minutes;
    }
    return Array.from({ length: 12 }, (_, i) => i * 5);
  };

  const availableMinutes = getAvailableMinutes();

  return (
    <Popover modal={true} open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? (
            format(date, "yyyy년 M월 d일 EEEE HH:mm", { locale: ko })
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-auto p-0 z-[1000]" 
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col">
          <div className="sm:flex">
            <DayPicker
              mode="single"
              selected={date}
              onSelect={handleDateSelect}
              initialFocus
            />
            <div className="flex flex-col sm:flex-row sm:h-[300px] divide-y sm:divide-y-0 sm:divide-x">
            <ScrollArea className="w-64 sm:w-auto">
              <div className="flex sm:flex-col p-2">
                {hours.map((hour) => (
                  <Button
                    key={hour}
                    size="icon"
                    variant={date && date.getHours() === hour ? "default" : "ghost"}
                    className="sm:w-full shrink-0 aspect-square"
                    onClick={() => handleTimeChange("hour", hour.toString())}
                  >
                    {hour}
                  </Button>
                ))}
              </div>
              <ScrollBar orientation="horizontal" className="sm:hidden" />
            </ScrollArea>
            <ScrollArea className="w-64 sm:w-auto">
              <div className="flex sm:flex-col p-2">
                {availableMinutes.map((minute) => (
                  <Button
                    key={minute}
                    size="icon"
                    variant={date && date.getMinutes() === minute ? "default" : "ghost"}
                    className="sm:w-full shrink-0 aspect-square"
                    onClick={() => handleTimeChange("minute", minute.toString())}
                  >
                    {minute.toString().padStart(2, '0')}
                  </Button>
                ))}
              </div>
              <ScrollBar orientation="horizontal" className="sm:hidden" />
            </ScrollArea>
            </div>
          </div>
          {date && (
            <div className="p-3 border-t">
              <Button 
                className="w-full" 
                onClick={() => {
                  onSelect?.(date); // 선택완료 시 최종 값 전달
                  setIsOpen(false);
                }}
              >
                선택완료
              </Button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
