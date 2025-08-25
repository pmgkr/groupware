import * as React from "react"
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react"
import { DayButton, DayPicker as RDPDayPicker, getDefaultClassNames } from "react-day-picker"
import { cva, type VariantProps } from "class-variance-authority"
import { ChevronLeft, ChevronRight, X } from "lucide-react"
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfDay, endOfDay, eachHourOfInterval, addDays, subDays, addWeeks, subWeeks } from "date-fns"
import { ko } from "date-fns/locale"
import { useHotkeys } from "react-hotkeys-hook"

import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"
import { getCachedHolidays, isHolidayCached, getHolidayNameCached } from "@/services/holidayApi"
import type { Holiday } from "@/types/holiday"

const dayPickerVariants = cva(
  "bg-background group/calendar p-3 [--cell-size:--spacing(8)] [[data-slot=card-content]_&]:bg-transparent [[data-slot=popover-content]_&]:bg-transparent",
  {
    variants: {
      variant: {
        default: "",
        filled: "bg-gray-50 border border-gray-200 rounded-lg",
        minimal: "bg-transparent p-1",
      },
      size: {
        default: "[--cell-size:--spacing(8)]",
        sm: "[--cell-size:--spacing(6)] p-2",
        lg: "[--cell-size:--spacing(10)] p-4",
        full: "[--cell-size:--spacing(12)] p-6",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function DayPicker({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  buttonVariant = "ghost",
  variant,
  size,
  formatters,
  components,
  ...props
}: React.ComponentProps<typeof RDPDayPicker> & 
  VariantProps<typeof dayPickerVariants> & {
    buttonVariant?: React.ComponentProps<typeof Button>["variant"]
  }) {
  const defaultClassNames = getDefaultClassNames()
  
  // props에서 mode를 추출하여 numberOfMonths 결정
  const mode = (props as any).mode
  const numberOfMonths = mode === "range" ? 2 : 1

  return (
    <RDPDayPicker
      showOutsideDays={showOutsideDays}
      className={cn(
        dayPickerVariants({ variant, size }),
        String.raw`rtl:**:[.rdp-button_next>svg]:rotate-180`,
        String.raw`rtl:**:[.rdp-button_previous>svg]:rotate-180`,
        className
      )}
      captionLayout={captionLayout}
      numberOfMonths={numberOfMonths}
      formatters={{
        formatMonthDropdown: (date) =>
          date.toLocaleString("default", { month: "short" }),
        ...formatters,
      }}
      classNames={{
        root: cn("w-fit", defaultClassNames.root),
        months: cn(
          "flex gap-4 flex-col md:flex-row relative",
          defaultClassNames.months
        ),
        month: cn("flex flex-col w-full gap-4", defaultClassNames.month),
        nav: cn(
          "flex items-center gap-1 w-full absolute top-0 inset-x-0 justify-between",
          defaultClassNames.nav
        ),
        button_previous: cn(
          buttonVariants({ variant: buttonVariant }),
          "size-(--cell-size) aria-disabled:opacity-50 p-0 select-none",
          defaultClassNames.button_previous
        ),
        button_next: cn(
          buttonVariants({ variant: buttonVariant }),
          "size-(--cell-size) aria-disabled:opacity-50 p-0 select-none",
          defaultClassNames.button_next
        ),
        month_caption: cn(
          "flex items-center justify-center h-(--cell-size) w-full px-(--cell-size)",
          defaultClassNames.month_caption
        ),
        dropdowns: cn(
          "w-full flex items-center text-sm font-medium justify-center h-(--cell-size) gap-1.5",
          defaultClassNames.dropdowns
        ),
        dropdown_root: cn(
          "relative has-focus:border-ring border border-input shadow-xs has-focus:ring-ring/50 has-focus:ring-[3px] rounded-md",
          defaultClassNames.dropdown_root
        ),
        dropdown: cn(
          "absolute bg-popover inset-0 opacity-0",
          defaultClassNames.dropdown
        ),
        caption_label: cn(
          "select-none font-medium",
          captionLayout === "label"
            ? "text-sm"
            : "rounded-md pl-2 pr-1 flex items-center gap-1 text-sm h-8 [&>svg]:text-muted-foreground [&>svg]:size-3.5",
          defaultClassNames.caption_label
        ),
        table: "w-full border-collapse",
        weekdays: cn("flex", defaultClassNames.weekdays),
        weekday: cn(
          "text-muted-foreground rounded-md flex-1 font-normal text-[0.8rem] select-none",
          defaultClassNames.weekday
        ),
        week: cn("flex w-full mt-2", defaultClassNames.week),
        week_number_header: cn(
          "select-none w-(--cell-size)",
          defaultClassNames.week_number_header
        ),
        week_number: cn(
          "text-[0.8rem] select-none text-muted-foreground",
          defaultClassNames.week_number
        ),
        day: cn(
          "relative w-full h-full p-0 text-center [&:first-child[data-selected=true]_button]:rounded-l-md [&:last-child[data-selected=true]_button]:rounded-r-md group/day aspect-square select-none",
          defaultClassNames.day
        ),
        range_start: cn(
          "rounded-l-md bg-accent",
          defaultClassNames.range_start
        ),
        range_middle: cn("rounded-none", defaultClassNames.range_middle),
        range_end: cn("rounded-r-md bg-accent", defaultClassNames.range_end),
        today: cn(
          "bg-accent text-accent-foreground rounded-md data-[selected=true]:rounded-none",
          defaultClassNames.today
        ),
        outside: cn(
          "text-muted-foreground aria-selected:text-muted-foreground",
          defaultClassNames.outside
        ),
        disabled: cn(
          "text-muted-foreground opacity-50",
          defaultClassNames.disabled
        ),
        hidden: cn("invisible", defaultClassNames.hidden),
        ...classNames,
      }}
      components={{
        Root: ({ className, rootRef, ...props }) => {
          return (
            <div
              data-slot="calendar"
              ref={rootRef}
              className={cn(className)}
              {...props}
            />
          )
        },
        Chevron: ({ className, orientation, ...props }) => {
          if (orientation === "left") {
            return (
              <ChevronLeftIcon className={cn("size-4", className)} {...props} />
            )
          }

          if (orientation === "right") {
            return (
              <ChevronRightIcon
                className={cn("size-4", className)}
                {...props}
              />
            )
          }

          return (
            <ChevronDownIcon className={cn("size-4", className)} {...props} />
          )
        },
        DayButton: DayPickerDayButton,
        WeekNumber: ({ children, ...props }) => {
          return (
            <td {...props}>
              <div className="flex size-(--cell-size) items-center justify-center text-center">
                {children}
              </div>
            </td>
          )
        },
        ...components,
      }}
      {...props}
    />
  )
}

function DayPickerDayButton({
  className,
  day,
  modifiers,
  ...props
}: React.ComponentProps<typeof DayButton>) {
  const defaultClassNames = getDefaultClassNames()

  const ref = React.useRef<HTMLButtonElement>(null)
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus()
  }, [modifiers.focused])

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      data-day={day.date.toLocaleDateString()}
      data-selected-single={
        modifiers.selected &&
        !modifiers.range_start &&
        !modifiers.range_end &&
        !modifiers.range_middle
      }
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      className={cn(
        "data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground data-[range-middle=true]:bg-accent data-[range-middle=true]:text-accent-foreground data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-ring/50 dark:hover:text-accent-foreground flex aspect-square size-auto w-full min-w-(--cell-size) flex-col gap-1 leading-none font-normal group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:ring-[3px] data-[range-end=true]:rounded-md data-[range-end=true]:rounded-r-md data-[range-middle=true]:rounded-none data-[range-start=true]:rounded-md data-[range-start=true]:rounded-l-md [&>span]:text-xs [&>span]:opacity-70",
        defaultClassNames.day,
        className
      )}
      {...props}
    />
  )
}

// 새로운 Calendar 컴포넌트 (큰 버전)
interface Event {
  id: string
  title: string
  start: Date
  end: Date
  color?: string
  category?: string // 카테고리 추가
  assignee?: string // 담당자 추가
}

interface CalendarProps {
  events?: Event[]
  onEventClick?: (event: Event) => void
  onDateClick?: (date: Date) => void
  className?: string
  showHolidays?: boolean // 공휴일 표시 여부
  initialViewMode?: ViewMode // 초기 뷰 모드
}

type ViewMode = "day" | "week" | "month" | "year"

// 카테고리별 색상 매핑
const categoryColorMap = {
  '연차': {
    bg: 'bg-blue-100',
    text: 'text-blue-500'
  },
  '반차': {
    bg: 'bg-purple-100',
    text: 'text-pink-500'
  },
  '반반차': {
    bg: 'bg-purple-100',
    text: 'text-purple-500'
  },
  '외부일정': {
    bg: 'bg-yellow-100',
    text: 'text-orange-500'
  },
  '기타': {
    bg: 'bg-gray-100',
    text: 'text-gray-800'
  }
}

// 기존 colorMap은 유지 (하위 호환성)
const colorMap = {
  blue: "bg-blue-500 text-white",
  red: "bg-red-500 text-white",
  green: "bg-green-500 text-white",
  yellow: "bg-yellow-500 text-black",
  purple: "bg-purple-500 text-white",
  pink: "bg-pink-500 text-white",
  gray: "bg-gray-500 text-white",
  orange: "bg-orange-500 text-white",
}

// 이벤트의 스타일 클래스를 가져오는 함수
const getEventStyle = (event: Event) => {
  if (event.category && categoryColorMap[event.category as keyof typeof categoryColorMap]) {
    const style = categoryColorMap[event.category as keyof typeof categoryColorMap]
    return `${style.bg} ${style.text}`
  }
  
  // 기존 color 속성이 있으면 사용
  if (event.color && colorMap[event.color as keyof typeof colorMap]) {
    return colorMap[event.color as keyof typeof colorMap]
  }
  
  // 기본값
  return 'bg-gray-100 text-gray-800'
}

function Calendar({ events = [], onEventClick, onDateClick, className, showHolidays = true, initialViewMode = "month" }: CalendarProps) {
  const [currentDate, setCurrentDate] = React.useState(new Date())
  const [viewMode, setViewMode] = React.useState<ViewMode>(initialViewMode)
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null)
  const [isMoreEventsOpen, setIsMoreEventsOpen] = React.useState(false)
  const [holidays, setHolidays] = React.useState<Holiday[]>([])
  const [holidayCache, setHolidayCache] = React.useState<Map<string, boolean>>(new Map())
  const [holidayNameCache, setHolidayNameCache] = React.useState<Map<string, string>>(new Map())

  // 이벤트 데이터 디버깅
  React.useEffect(() => {
    console.log('Calendar 컴포넌트 렌더링, 이벤트 개수:', events.length)
    console.log('이벤트 데이터:', events)
  }, [events])

  // 공휴일 정보 로드
  React.useEffect(() => {
    if (showHolidays) {
      console.log('공휴일 로딩 시작, 연도:', currentDate.getFullYear())
      loadHolidays(currentDate.getFullYear())
    }
  }, [currentDate.getFullYear(), showHolidays])

  const loadHolidays = async (year: number) => {
    try {
      console.log('공휴일 API 호출 시작, 연도:', year)
      const yearHolidays = await getCachedHolidays(year)
      console.log('받아온 공휴일 데이터:', yearHolidays)
      setHolidays(yearHolidays)
      
      // 캐시 초기화
      const newHolidayCache = new Map<string, boolean>()
      const newHolidayNameCache = new Map<string, string>()
      
      yearHolidays.forEach(holiday => {
        // locdate를 사용하여 캐시 키 생성
        const dateKey = holiday.locdate.toString()
        newHolidayCache.set(dateKey, true)
        newHolidayNameCache.set(dateKey, holiday.dateName)
        console.log('캐시에 추가:', dateKey, holiday.dateName)
      })
      
      console.log('공휴일 캐시 설정 완료:', newHolidayCache.size, '개')
      setHolidayCache(newHolidayCache)
      setHolidayNameCache(newHolidayNameCache)
    } catch (error) {
      console.error('공휴일 정보를 로드하는 중 오류가 발생했습니다:', error)
    }
  }

  // 특정 날짜가 공휴일인지 확인
  const isHoliday = (date: Date): boolean => {
    const dateString = format(date, 'yyyyMMdd')
    const result = holidayCache.get(dateString) || false
    console.log('공휴일 확인:', format(date, 'yyyy-MM-dd'), '결과:', result, '캐시 크기:', holidayCache.size)
    return result
  }

  // 공휴일 이름 가져오기
  const getHolidayName = (date: Date): string | null => {
    const dateString = format(date, 'yyyyMMdd')
    return holidayNameCache.get(dateString) || null
  }

  // 키보드 단축키
  useHotkeys("left", () => navigateDate(-1), { preventDefault: true })
  useHotkeys("right", () => navigateDate(1), { preventDefault: true })
  useHotkeys("up", () => navigateDate(-7), { preventDefault: true })
  useHotkeys("down", () => navigateDate(7), { preventDefault: true })
  useHotkeys("home", () => setCurrentDate(new Date()), { preventDefault: true })

  const navigateDate = (direction: number) => {
    switch (viewMode) {
      case "day":
        setCurrentDate(addDays(currentDate, direction))
        break
      case "week":
        setCurrentDate(addWeeks(currentDate, direction))
        break
      case "month":
        setCurrentDate(addMonths(currentDate, direction))
        break
      case "year":
        setCurrentDate(addMonths(currentDate, direction * 12))
        break
    }
  }

  const getViewTitle = () => {
    switch (viewMode) {
      case "day":
        return format(currentDate, "yyyy년 M월 d일", { locale: ko })
      case "week":
        const weekStart = startOfWeek(currentDate)
        const weekEnd = endOfWeek(currentDate)
        return `${format(weekStart, "yyyy년 M월 d일", { locale: ko })} - ${format(weekEnd, "M월 d일", { locale: ko })}`
      case "month":
        return format(currentDate, "yyyy년 M월", { locale: ko })
      case "year":
        return format(currentDate, "yyyy년", { locale: ko })
    }
  }

  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      const eventStart = startOfDay(event.start)
      const eventEnd = endOfDay(event.end)
      const checkDate = startOfDay(date)
      return checkDate >= eventStart && checkDate <= eventEnd
    })
  }

  const getEventsForHour = (hour: Date) => {
    return events.filter(event => {
      const eventStart = event.start
      const eventEnd = event.end
      const checkHour = hour
      return checkHour >= eventStart && checkHour < eventEnd
    })
  }

  const handleMoreEventsClick = (date: Date, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedDate(date)
    setIsMoreEventsOpen(true)
  }

  const renderDayView = () => {
    const dayStart = startOfDay(currentDate)
    const dayEnd = endOfDay(currentDate)
    // 9:00부터 다음 날 8:00까지의 30분 간격 시간 슬롯 생성 (48개)
    const timeSlots = Array.from({ length: 48 }, (_, index) => {
      const slot = new Date(dayStart)
      const totalMinutes = (9 * 60) + (index * 30) // 9시부터 30분씩 증가
      const hours = Math.floor(totalMinutes / 60)
      const minutes = totalMinutes % 60
      
      if (hours >= 24) {
        // 24시 이후는 다음 날로 설정
        slot.setDate(slot.getDate() + 1)
        slot.setHours(hours - 24, minutes, 0, 0)
      } else {
        slot.setHours(hours, minutes, 0, 0)
      }
      return slot
    })

    // 이벤트를 시간 슬롯에 배치
    const eventsWithPosition = events.map(event => {
      const startMinutes = (event.start.getHours() * 60 + event.start.getMinutes()) - (9 * 60)
      const endMinutes = (event.end.getHours() * 60 + event.end.getMinutes()) - (9 * 60)
      
      // 9시 이전이면 0부터 시작
      const startSlot = Math.max(0, startMinutes / 30) // 소수점 포함하여 정확한 위치 계산
      const endSlot = Math.min(47, endMinutes / 30)
      
      // top 위치를 슬롯 인덱스가 아닌 실제 시간 기반으로 계산
      const top = startMinutes // 9시를 0으로 하는 분 단위 위치
      const height = (endMinutes - startMinutes) // 실제 지속 시간 (분 단위)
      
      console.log(`이벤트: ${event.title}, 시작: ${format(event.start, 'HH:mm')}, startMinutes: ${startMinutes}, startSlot: ${startSlot}, top: ${top}`)
      
      return {
        ...event,
        startSlot,
        endSlot,
        top,
        height: Math.max(height, 20) // 최소 높이 20px로 줄임
      }
    }).filter(event => event.startSlot < 48) // 9시 이전 이벤트는 제외

    return (
      <div className="h-[600px] overflow-y-auto relative">
        {/* 시간 슬롯 배경 */}
        {timeSlots.map((slot, index) => {
          const totalMinutes = (9 * 60) + (index * 30)
          const displayHours = Math.floor(totalMinutes / 60)
          const displayMinutes = totalMinutes % 60
          
          let displayText = ""
          if (displayHours >= 24) {
            const nextDayHour = displayHours - 24
            displayText = `${String(nextDayHour).padStart(2, '0')}:${String(displayMinutes).padStart(2, '0')} (다음날)`
          } else {
            displayText = `${String(displayHours).padStart(2, '0')}:${String(displayMinutes).padStart(2, '0')}`
          }
          
          // 이 슬롯에 표시할 이벤트들 찾기
          const eventsInThisSlot = eventsWithPosition.filter(event => {
            const slotStartMinutes = index * 30
            const slotEndMinutes = (index + 1) * 30
            const eventStartMinutes = (event.start.getHours() * 60 + event.start.getMinutes()) - (9 * 60)
            
            // 이벤트가 이 슬롯에서 시작하는지 확인
            return eventStartMinutes >= slotStartMinutes && eventStartMinutes < slotEndMinutes
          })
          
          return (
            <div key={index} className="flex border-b border-gray-200 min-h-[30px]">
              <div className="w-20 p-1 text-xs text-gray-500 border-r border-gray-200">
                {displayText}
              </div>
              <div className="flex-1 p-1 relative">
                {/* 이벤트가 시작하는 슬롯에만 표시 */}
                {eventsInThisSlot.map((event) => {
                  const eventStartMinutes = (event.start.getHours() * 60 + event.start.getMinutes()) - (9 * 60)
                  const eventEndMinutes = (event.end.getHours() * 60 + event.end.getMinutes()) - (9 * 60)
                  
                  // 이 슬롯 내에서의 상대적 위치 계산
                  const relativeTop = (eventStartMinutes - (index * 30)) * 2 // 1분 = 2px로 변환
                  
                  // 이벤트가 이 슬롯에서 끝나는지 확인
                  const slotEndMinutes = (index + 1) * 30
                  let height
                  
                  if (eventEndMinutes <= slotEndMinutes) {
                    // 이벤트가 이 슬롯에서 끝나는 경우
                    height = (eventEndMinutes - eventStartMinutes) * 2
                  } else {
                    // 이벤트가 다음 슬롯까지 이어지는 경우, 이 슬롯에서의 높이만 계산
                    height = (slotEndMinutes - eventStartMinutes) * 2
                  }
                  
                  return (
                    <div
                      key={event.id}
                      className={cn(
                        "absolute left-0 right-0 p-1 text-xs rounded cursor-pointer",
                        getEventStyle(event)
                      )}
                      style={{
                        top: `${relativeTop}px`,
                        height: `${Math.max(height, 20)}px`,
                        zIndex: 10
                      }}
                      onClick={() => onEventClick?.(event)}
                    >
                      <div className="truncate font-medium">{event.title}</div>
                      {event.assignee && (
                        <div className="text-xs opacity-75 font-medium">{event.assignee}</div>
                      )}
                      <div className="text-xs opacity-75">
                        {format(event.start, 'HH:mm')} - {format(event.end, 'HH:mm')}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate)
    const weekEnd = endOfWeek(currentDate)
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd })

    // 각 날짜별로 이벤트 위치 계산
    const eventsByDay = days.map(day => {
      const dayEvents = events.filter(event => {
        const eventStart = startOfDay(event.start)
        const eventEnd = endOfDay(event.end)
        const checkDay = startOfDay(day)
        return checkDay >= eventStart && checkDay <= eventEnd
      })

      return dayEvents.map(event => {
        const startMinutes = (event.start.getHours() * 60 + event.start.getMinutes()) - (9 * 60)
        const endMinutes = (event.end.getHours() * 60 + event.end.getMinutes()) - (9 * 60)
        
        // 9시 이전이면 0부터 시작
        const startSlot = Math.max(0, startMinutes / 30) // 소수점 포함하여 정확한 위치 계산
        const endSlot = Math.min(47, endMinutes / 30)
        
        // top 위치를 슬롯 인덱스가 아닌 실제 시간 기반으로 계산
        const top = startMinutes // 9시를 0으로 하는 분 단위 위치
        const height = (endMinutes - startMinutes) // 실제 지속 시간 (분 단위)
        
        return {
          ...event,
          startSlot,
          endSlot,
          top,
          height: Math.max(height, 20) // 최소 높이 20px로 줄임
        }
      }).filter(event => event.startSlot < 48) // 9시 이전 이벤트는 제외
    })

    return (
      <div className="h-[600px] overflow-y-auto relative">
        <div className="grid grid-cols-8 border-b border-gray-200">
          <div className="p-2 text-sm font-medium text-gray-500"></div>
          {days.map((day) => (
            <div key={day.toISOString()} className="p-2 text-sm font-medium text-center border-l border-gray-200">
              <div>{format(day, "EEE", { locale: ko })}</div>
              <div className={cn("text-lg", isSameDay(day, new Date()) && "text-blue-600 font-bold")}>
                {format(day, "d")}
              </div>
            </div>
          ))}
        </div>
        {Array.from({ length: 48 }, (_, slotIndex) => {
          const totalMinutes = (9 * 60) + (slotIndex * 30)
          const hours = Math.floor(totalMinutes / 60)
          const minutes = totalMinutes % 60
          
          let displayText = ""
          if (hours >= 24) {
            const nextDayHour = hours - 24
            displayText = `${String(nextDayHour).padStart(2, '0')}:${String(minutes).padStart(2, '0')} (다음날)`
          } else {
            displayText = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
          }
          
          return (
            <div key={slotIndex} className="grid grid-cols-8 border-b border-gray-200 min-h-[30px]">
              <div className="p-1 text-xs text-gray-500 border-r border-gray-200">
                {displayText}
              </div>
              {days.map((day, dayIndex) => {
                const dayEvents = eventsByDay[dayIndex]
                return (
                  <div key={day.toISOString()} className="p-1 border-l border-gray-200 relative">
                    {/* 이벤트가 시작하는 슬롯에만 표시 */}
                    {dayEvents
                      .filter(event => {
                        const slotStartMinutes = slotIndex * 30
                        const slotEndMinutes = (slotIndex + 1) * 30
                        const eventStartMinutes = (event.start.getHours() * 60 + event.start.getMinutes()) - (9 * 60)
                        
                        // 이벤트가 이 슬롯에서 시작하는지 확인
                        return eventStartMinutes >= slotStartMinutes && eventStartMinutes < slotEndMinutes
                      })
                      .map((event) => {
                        const eventStartMinutes = (event.start.getHours() * 60 + event.start.getMinutes()) - (9 * 60)
                        const eventEndMinutes = (event.end.getHours() * 60 + event.end.getMinutes()) - (9 * 60)
                        
                        // 이 슬롯 내에서의 상대적 위치 계산
                        const relativeTop = (eventStartMinutes - (slotIndex * 30)) * 2 // 1분 = 2px로 변환
                        
                        // 이벤트가 이 슬롯에서 끝나는지 확인
                        const slotEndMinutes = (slotIndex + 1) * 30
                        let height
                        
                        if (eventEndMinutes <= slotEndMinutes) {
                          // 이벤트가 이 슬롯에서 끝나는 경우
                          height = (eventEndMinutes - eventStartMinutes) * 2
                        } else {
                          // 이벤트가 다음 슬롯까지 이어지는 경우, 이 슬롯에서의 높이만 계산
                          height = (slotEndMinutes - eventStartMinutes) * 2
                        }
                        
                        return (
                          <div
                            key={event.id}
                            className={cn(
                              "absolute left-0 right-0 p-1 text-xs rounded cursor-pointer",
                              getEventStyle(event)
                            )}
                            style={{
                              top: `${relativeTop}px`,
                              height: `${Math.max(height, 20)}px`,
                              zIndex: 10
                            }}
                            onClick={() => onEventClick?.(event)}
                          >
                            <div className="truncate font-medium">{event.title}</div>
                            {event.assignee && (
                              <div className="text-xs opacity-75 font-medium">{event.assignee}</div>
                            )}
                            <div className="text-xs opacity-75">
                              {format(event.start, 'HH:mm')} - {format(event.end, 'HH:mm')}
                            </div>
                          </div>
                        )
                      })}
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    )
  }

  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    const startDate = startOfWeek(monthStart)
    const endDate = endOfWeek(monthEnd)
    const days = eachDayOfInterval({ start: startDate, end: endDate })

    // 주별로 그룹화
    const weeks = []
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7))
    }

    return (
      <div className="grid grid-cols-7" style={{ gridTemplateRows: 'auto repeat(' + (weeks.length * 2) + ', auto)' }}>
        {["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"].map((day) => (
          <div key={day} className="p-2 text-sm font-medium text-center text-gray-500">
            {day}
          </div>
        ))}
        
        {/* 날짜 그리드 - 각 날짜별로 grid-area 배치 */}
        {days.map((day, dayIndex) => {
          const dayEvents = getEventsForDate(day)
          const isHolidayDay = isHoliday(day)
          const holidayName = getHolidayName(day)
          const isSunday = day.getDay() === 0
          const isSaturday = day.getDay() === 6
          
          // 디버깅 로그 추가
          if (isHolidayDay) {
            console.log('공휴일 발견:', format(day, 'yyyy-MM-dd'), '이름:', holidayName)
          }
          
          // 주별로 행 번호 계산 (첫째주: 2행, 둘째주: 3행, 셋째주: 4행...)
          const weekIndex = Math.floor(dayIndex / 7)
          const rowNumber = weekIndex + 2
          const colNumber = (dayIndex % 7) + 1
          
          return (
            <div
              key={day.toISOString()}
              className={cn(
                "p-2 min-h-[200px] border border-gray-200 cursor-pointer",
                !isSameMonth(day, currentDate) && "bg-gray-50 text-gray-400",
                isSameDay(day, new Date()) && "bg-blue-50 border-blue-200",
                isHolidayDay && "bg-gray-200",
                isSunday && !isHolidayDay && "bg-gray-200",
                isSaturday && !isHolidayDay && "bg-gray-200"
              )}
              style={{
                gridArea: `${rowNumber} / ${colNumber} / ${rowNumber + 1} / ${colNumber + 1}`
              }}
              onClick={() => onDateClick?.(day)}
            >
              <div className="flex items-center justify-between mb-1">
                <div className={cn(
                  "text-sm font-medium",
                  isHolidayDay && "text-red-500",
                  isSunday && !isHolidayDay && "text-red-500",
                  isSaturday && !isHolidayDay && "text-blue-500"
                )}>
                  {format(day, "d")}
                </div>
                {isHolidayDay && holidayName && (
                  <div className="text-xs text-red-600 font-medium bg-red-100 px-1 py-0.5 rounded">
                    {holidayName}
                  </div>
                )}
              </div>
            </div>
          )
        })}

        {/* 주별 이벤트 그리드 - grid-area로 배치 */}
        {weeks.map((weekDays, weekIndex) => (
          <div
            key={`week-${weekIndex}`}
            className="min-h-[80px]"
            style={{
              overflow: 'hidden',
              gridArea: `${weekIndex + 2} / 1 / ${weekIndex + 3} / 8`,
              marginTop: '42px'
            }}
          >
            <div 
              className="grid grid-cols-7 grid-auto-rows-20 gap-y-1 gap-x-0"
            >
              {weekDays.map((day, dayIndex) => {
                const dayEvents = getEventsForDate(day)
                
                return dayEvents.map((event) => {
                  // 이벤트가 여러 날짜에 걸쳐 있는지 확인
                  const eventStart = startOfDay(event.start)
                  const eventEnd = endOfDay(event.end)
                  const dayStart = startOfDay(day)
                  const isEventStart = isSameDay(eventStart, dayStart)
                  const isEventEnd = isSameDay(eventEnd, dayStart)
                  const isEventMiddle = !isEventStart && !isEventEnd && dayStart > eventStart && dayStart < eventEnd
                  
                  // 이벤트가 이 날짜에서 차지하는 그리드 열 수 계산
                  let colSpan = 1
                  if (isEventStart) {
                    const daysDiff = Math.ceil((eventEnd.getTime() - dayStart.getTime()) / (1000 * 60 * 60 * 24))
                    colSpan = Math.min(daysDiff, 7 - dayIndex)
                  }

                  return (
                    <div
                      key={event.id}
                      className={cn(
                        "flex items-center gap-2 text-sm cursor-pointer truncate pl-1 pr-1 ml-1 mr-1",
                        getEventStyle(event),
                        isEventStart && "ml-1",
                        isEventEnd && "mr-1",
                        isEventMiddle && ""
                      )}
                      style={{
                        ...(colSpan > 1 && {
                          gridColumn: `span ${colSpan}`,
                          position: 'relative',
                          zIndex: 10
                        })
                      }}
                      onClick={(e) => {
                        e.stopPropagation()
                        onEventClick?.(event)
                      }}
                    >
                      <div className="text-sm truncate font-black">{event.title}</div>
                      {event.assignee && (
                        <div className="text-sm text-gray-900">{event.assignee}</div>
                      )}
                    </div>
                  )
                })
              })}
            </div>
          </div>
        ))}
      </div>
    )
  }

  const renderYearView = () => {
    const months = Array.from({ length: 12 }, (_, i) => {
      const month = new Date(currentDate.getFullYear(), i, 1)
      return month
    })

    return (
      <div className="grid grid-cols-3 gap-4">
        {months.map((month) => (
          <div key={month.toISOString()} className="border border-gray-200 rounded-lg p-4">
            <div className="text-lg font-medium text-center mb-2">
              {format(month, "M월", { locale: ko })}
            </div>
            <div className="grid grid-cols-7 gap-1 text-xs">
              {["일", "월", "화", "수", "목", "금", "토"].map((day) => (
                <div key={day} className="text-center text-gray-400">
                  {day}
                </div>
              ))}
              {eachDayOfInterval({
                start: startOfWeek(startOfMonth(month)),
                end: endOfWeek(endOfMonth(month))
              }).map((day) => {
                const isHolidayDay = isHoliday(day)
                const isSunday = day.getDay() === 0
                const isSaturday = day.getDay() === 6
                
                return (
                  <div
                    key={day.toISOString()}
                    className={cn(
                      "text-center p-1",
                      !isSameMonth(day, month) && "text-gray-300",
                      isSameDay(day, new Date()) && "bg-blue-500 text-white rounded",
                      isHolidayDay && "bg-red-500 text-white rounded",
                      isSunday && !isHolidayDay && "text-red-400",
                      isSaturday && !isHolidayDay && "text-blue-400"
                    )}
                  >
                    {format(day, "d")}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <>
      <div className={cn("space-y-4", className)}>
        {/* 헤더 */}
        <div className="flex items-center justify-between relative">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(new Date())}
            >
              오늘
            </Button>
          </div>
          
          <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center space-x-2">
            <Button
                variant="outline"
                size="icon"
                onClick={() => navigateDate(-1)}
                >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-xl font-semibold">{getViewTitle()}</h2>
            <Button
                variant="outline"
                size="icon"
                onClick={() => navigateDate(1)}
                >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          
          <div className="flex items-center space-x-1">
            <Button
              variant={viewMode === "day" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("day")}
            >
              일간
            </Button>
            <Button
              variant={viewMode === "week" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("week")}
            >
              주간
            </Button>
            <Button
              variant={viewMode === "month" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("month")}
            >
              월간
            </Button>
            <Button
              variant={viewMode === "year" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("year")}
            >
              연간
            </Button>
          </div>
        </div>

        {/* 공휴일 정보 표시 */}
        {showHolidays && holidays.length > 0 && (
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span>공휴일</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-400 rounded-full"></div>
              <span>일요일</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
              <span>토요일</span>
            </div>
          </div>
        )}

        {/* 카테고리별 색상 범례 */}
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          {Object.entries(categoryColorMap).map(([category, style]) => (
            <div key={category} className="flex items-center space-x-2">
              <div className={cn("w-3 h-3 rounded-full", style.bg)}></div>
              <span>{category}</span>
            </div>
          ))}
        </div>

        {/* 캘린더 뷰 */}
        <div className="border border-gray-200 rounded-lg">
          {viewMode === "day" && renderDayView()}
          {viewMode === "week" && renderWeekView()}
          {viewMode === "month" && renderMonthView()}
          {viewMode === "year" && renderYearView()}
        </div>
      </div>

      {/* More Events Modal */}
      {isMoreEventsOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-96 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">
                {selectedDate && format(selectedDate, "yyyy년 M월 d일", { locale: ko })}의 일정
              </h3>
              <button
                onClick={() => setIsMoreEventsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 space-y-2 max-h-64 overflow-y-auto">
              {selectedDate && getEventsForDate(selectedDate).map((event) => (
                <div
                  key={event.id}
                  className={cn(
                    "p-3 rounded-lg cursor-pointer hover:opacity-80 transition-opacity",
                    getEventStyle(event)
                  )}
                  onClick={() => {
                    onEventClick?.(event)
                    setIsMoreEventsOpen(false)
                  }}
                >
                  <div className="font-medium">{event.title}</div>
                  {event.assignee && (
                    <div className="text-sm opacity-90 font-medium">{event.assignee}</div>
                  )}
                  <div className="text-sm opacity-90">
                    {format(event.start, "HH:mm", { locale: ko })} - {format(event.end, "HH:mm", { locale: ko })}
                  </div>
                </div>
              ))}
              {selectedDate && getEventsForDate(selectedDate).length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  이 날에는 일정이 없습니다.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export { DayPicker, DayPickerDayButton, dayPickerVariants, Calendar }

