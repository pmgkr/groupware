import React from "react";
import ReactECharts from "echarts-for-react";
import dayjs from "dayjs";

// workTimeData는 질문에 주신 그대로 사용
const workTimeData = [
  { date: "2025-09-01", startTime: "09:30", endTime: "18:00", workHours: 8 },
  { date: "2025-09-02", startTime: "09:49", endTime: "17:30", workHours: 7.5 },
  { date: "2025-09-03", startTime: "09:30", endTime: "18:30", workHours: 9 },
  { date: "2025-09-04", startTime: "10:00", endTime: "16:00", workHours: 6.5 },
  { date: "2025-09-05", startTime: "10:00", endTime: "19:00", workHours: 8 },
  { date: "2025-09-08", startTime: "09:40", endTime: "18:00", workHours: 8 },
  { date: "2025-09-09", startTime: "09:45", endTime: "17:00", workHours: 8 },
  { date: "2025-09-10", startTime: "09:55", endTime: "18:15", workHours: 8 },
  { date: "2025-09-11", startTime: "09:52", endTime: "17:30", workHours: 7.5 },
  { date: "2025-09-12", startTime: "09:30", endTime: "18:30", workHours: 9 },
];

const BASE = dayjs("2000-01-01");
const toBaseTime = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return BASE.hour(h).minute(m).second(0).millisecond(0).toDate().getTime();
};

const xMin = toBaseTime("08:00"); // 고정 범위 시작
const xMax = toBaseTime("20:00"); // 고정 범위 끝

const dates = workTimeData.map(d => d.date); // Y축 카테고리(날짜)
const dateIndex = new Map(dates.map((d, i) => [d, i] as const));

// series data: [yIndex, startMs, endMs, date]
const seriesData = workTimeData.map(d => {
  const y = dateIndex.get(d.date)!;
  const start = toBaseTime(d.startTime);
  const end = toBaseTime(d.endTime);
  return [y, start, end, d.date, d.startTime, d.endTime];
});

// 점심시간 데이터 생성 (12:00-13:00)
const lunchBreakData = workTimeData.map(d => {
  const y = dateIndex.get(d.date)!;
  const lunchStart = toBaseTime("12:00");
  const lunchEnd = toBaseTime("13:00");
  return [y, lunchStart, lunchEnd, d.date, "12:00", "13:00"];
});

function renderItem(params: any, api: any) {
  const yIndex = api.value(0);
  const start = api.coord([api.value(1), yIndex]);
  const end = api.coord([api.value(2), yIndex]);
  const barHeight = Math.min(api.size([0, 1])[1] * 0.6, 28);

  const rectShape = {
    x: start[0],
    y: start[1] - barHeight / 2,
    width: Math.max(end[0] - start[0], 1),
    height: barHeight,
    r: 6,
  };

  return {
    type: "rect",
    shape: rectShape,
    style: api.style({ fill: "#3b82f6" }),
    emphasis: { style: { opacity: 0.9 } },
  };
}

export default function WorkHoursChart() {
  const option = {
    grid: { left: 120, right: 24, top: 24, bottom: 40 },
    tooltip: {
      trigger: "item",
      formatter: (p: any) => {
        const [_, s, e, date, sText, eText] = p.value;
        const hours = ((e - s) / 36e5).toFixed(1);
        
        // 점심시간인지 확인 (12:00-13:00)
        const isLunchBreak = sText === "12:00" && eText === "13:00";
        
        if (isLunchBreak) {
          return `
            <div>
              <div><b>${date}</b></div>
              <div>점심시간: ${sText} - ${eText}</div>
              <div>휴식시간: ${hours}시간</div>
            </div>
          `;
        } else {
          return `
            <div>
              <div><b>${date}</b></div>
              <div>시작: ${sText} / 종료: ${eText}</div>
              <div>업무시간: ${hours}시간</div>
            </div>
          `;
        }
      },
      appendToBody: true,
      confine: true,
    },
    xAxis: {
      type: "time",
      min: xMin,
      max: xMax,
      axisLabel: {
        formatter: (value: number) => dayjs(value).format("HH:mm"),
      },
      splitNumber: 12,
    },
    yAxis: {
      type: "category",
      data: dates,
      axisLabel: { formatter: (d: string) => d },
    },
    dataZoom: [
      { type: "inside", xAxisIndex: 0 },
      { type: "slider", xAxisIndex: 0, height: 16, bottom: 10 },
    ],
    series: [
      {
        type: "custom",
        renderItem,
        encode: { x: [1, 2], y: 0 },
        itemStyle: { borderRadius: 6 },
        data: seriesData,
      },
      {
        type: "custom",
        renderItem: (params: any, api: any) => {
          const yIndex = api.value(0);
          const start = api.coord([api.value(1), yIndex]);
          const end = api.coord([api.value(2), yIndex]);
          const barHeight = Math.min(api.size([0, 1])[1] * 0.4, 20);

          const rectShape = {
            x: start[0],
            y: start[1] - barHeight / 2,
            width: Math.max(end[0] - start[0], 1),
            height: barHeight,
            r: 4,
          };

          return {
            type: "rect",
            shape: rectShape,
            style: api.style({ fill: "#ef4444" }), // 빨간색으로 점심시간 표시
            emphasis: { style: { opacity: 0.9 } },
          };
        },
        encode: { x: [1, 2], y: 0 },
        itemStyle: { borderRadius: 4 },
        data: lunchBreakData,
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: 420, width: "100%" }} />;
}