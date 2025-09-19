import React, { useState } from "react";
import { Gantt, ViewMode } from '@rsagiev/gantt-task-react-19';
import type { Task } from '@rsagiev/gantt-task-react-19';
import "@rsagiev/gantt-task-react-19/dist/index.css";

// Gantt 차트용 데이터 구조
const ganttData: Task[] = [
  {
    start: new Date(2025, 8, 1, 9, 0),
    end: new Date(2025, 8, 1, 18, 0),
    name: '2025-09-01',
    id: '1',
    type: 'task',
    progress: 100,
	barTextColor: '#374151',
	
    styles: { progressColor: '#10b981', progressSelectedColor: '#059669' }
  },
  {
    start: new Date(2025, 8, 2, 9, 30),
    end: new Date(2025, 8, 2, 17, 30),
    name: '2025-09-02',
    id: '2',
    type: 'task',
    progress: 100,
    styles: { progressColor: '#f59e0b', progressSelectedColor: '#d97706' }
  },
  {
    start: new Date(2025, 8, 3, 8, 30),
    end: new Date(2025, 8, 3, 18, 30),
    name: '2025-09-03',
    id: '3',
    type: 'task',
    progress: 100,
    styles: { progressColor: '#10b981', progressSelectedColor: '#059669' }
  },
  {
    start: new Date(2025, 8, 4, 9, 0),
    end: new Date(2025, 8, 4, 16, 0),
    name: '2025-09-04',
    id: '4',
    type: 'task',
    progress: 100,
    styles: { progressColor: '#ef4444', progressSelectedColor: '#dc2626' }
  },
  {
    start: new Date(2025, 8, 5, 10, 0),
    end: new Date(2025, 8, 5, 19, 0),
    name: '2025-09-05',
    id: '5',
    type: 'task',
    progress: 100,
    styles: { progressColor: '#10b981', progressSelectedColor: '#059669' }
  },
  {
    start: new Date(2025, 8, 8, 9, 0),
    end: new Date(2025, 8, 8, 18, 0),
    name: '2025-09-08',
    id: '6',
    type: 'task',
    progress: 100,
    styles: { progressColor: '#10b981', progressSelectedColor: '#059669' }
  },
  {
    start: new Date(2025, 8, 9, 8, 0),
    end: new Date(2025, 8, 9, 17, 0),
    name: '2025-09-09',
    id: '7',
    type: 'task',
    progress: 100,
    styles: { progressColor: '#10b981', progressSelectedColor: '#059669' }
  },
  {
    start: new Date(2025, 8, 10, 9, 15),
    end: new Date(2025, 8, 10, 18, 15),
    name: '2025-09-10',
    id: '8',
    type: 'task',
    progress: 100,
    styles: { progressColor: '#10b981', progressSelectedColor: '#059669' }
  },
  {
    start: new Date(2025, 8, 11, 9, 0),
    end: new Date(2025, 8, 11, 17, 30),
    name: '2025-09-11',
    id: '9',
    type: 'task',
    progress: 100,
    styles: { progressColor: '#f59e0b', progressSelectedColor: '#d97706' }
  },
  {
    start: new Date(2025, 8, 12, 8, 30),
    end: new Date(2025, 8, 12, 18, 30),
    name: '2025-09-12',
    id: '10',
    type: 'task',
    progress: 100,
    styles: { progressColor: '#10b981', progressSelectedColor: '#059669' }
  }
];

// 샘플 데이터 - 실제로는 API에서 가져올 데이터
const workTimeData = [
  { date: '2025-09-01', startTime: '09:00', endTime: '18:00', workHours: 8 },
  { date: '2025-09-02', startTime: '09:30', endTime: '17:30', workHours: 7.5 },
  { date: '2025-09-03', startTime: '08:30', endTime: '18:30', workHours: 9 },
  { date: '2025-09-04', startTime: '09:00', endTime: '16:00', workHours: 6.5 },
  { date: '2025-09-05', startTime: '10:00', endTime: '19:00', workHours: 8 },
  { date: '2025-09-08', startTime: '09:00', endTime: '18:00', workHours: 8 },
  { date: '2025-09-09', startTime: '08:00', endTime: '17:00', workHours: 8 },
  { date: '2025-09-10', startTime: '09:15', endTime: '18:15', workHours: 8 },
  { date: '2025-09-11', startTime: '09:00', endTime: '17:30', workHours: 7.5 },
  { date: '2025-09-12', startTime: '08:30', endTime: '18:30', workHours: 9 },
];

function Working() {
  const [view, setView] = useState<ViewMode>(ViewMode.Hour);

  const handleTaskChange = (task: Task) => {
    console.log('Task changed:', task);
  };

  const handleTaskDelete = (task: Task) => {
    console.log('Task deleted:', task);
  };

  const handleProgressChange = (task: Task) => {
    console.log('Progress changed:', task);
  };

  const handleDblClick = (task: Task) => {
    console.log('Task double clicked:', task);
  };

  const handleClick = (task: Task) => {
    console.log('Task clicked:', task);
  };

  const handleSelect = (task: Task, isSelected: boolean) => {
    console.log('Task selected:', task, isSelected);
  };

  const handleExpanderClick = (task: Task) => {
    console.log('Expander clicked:', task);
  };

  return (

	
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">출퇴근 관리</h1>

	        
      {/* 요약 정보 */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold text-blue-800">총 업무시간</h3>
          <p className="text-2xl font-bold text-blue-600">
            {workTimeData.reduce((sum, item) => sum + item.workHours, 0).toFixed(1)}시간
          </p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="font-semibold text-green-800">평균 업무시간</h3>
          <p className="text-2xl font-bold text-green-600">
            {(workTimeData.reduce((sum, item) => sum + item.workHours, 0) / workTimeData.length).toFixed(1)}시간
          </p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <h3 className="font-semibold text-purple-800">출근일수</h3>
          <p className="text-2xl font-bold text-purple-600">{workTimeData.length}일</p>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">주간 업무시간 현황 (Gantt 차트)</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setView(ViewMode.Day)}
              className={`px-3 py-1 text-sm rounded ${
                view === ViewMode.Day ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              일간
            </button>
            <button
              onClick={() => setView(ViewMode.Week)}
              className={`px-3 py-1 text-sm rounded ${
                view === ViewMode.Week ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              주간
            </button>
            <button
              onClick={() => setView(ViewMode.Month)}
              className={`px-3 py-1 text-sm rounded ${
                view === ViewMode.Month ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              월간
            </button>
          </div>
        </div>
        
        <div className="h-96">
          <Gantt
            tasks={ganttData}
            viewMode={view}
            onDateChange={handleTaskChange}
            onDelete={handleTaskDelete}
            onProgressChange={handleProgressChange}
            onDoubleClick={handleDblClick}
            onClick={handleClick}
            onSelect={handleSelect}
            onExpanderClick={handleExpanderClick}
            locale="ko"
            rtl={false}
            barBackgroundColor="#e5e7eb"
            barBackgroundSelectedColor="#9ca3af"
            barCornerRadius={4}
            barProgressColor="#3b82f6"
            barProgressSelectedColor="#1d4ed8"
            headerHeight={50}
            rowHeight={40}
            listCellWidth="120px"
            fontSize="14px"
            fontFamily="Inter, system-ui, sans-serif"
            arrowColor="#6b7280"
            arrowIndent={20}
            todayColor="#ef4444"
            preStepsCount={1}
            postStepsCount={1}
            columnWidth={60}
            TooltipContent={({ task }) => (
              <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                <p className="font-semibold">{`날짜: ${task.name}`}</p>
                <p className="text-sm text-gray-600">{`시작: ${task.start.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}`}</p>
                <p className="text-sm text-gray-600">{`종료: ${task.end.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}`}</p>
                <p className="text-sm font-medium text-blue-600">{`업무시간: ${((task.end.getTime() - task.start.getTime()) / (1000 * 60 * 60)).toFixed(1)}시간`}</p>
              </div>
            )}
          />
        </div>
        
        {/* 범례 */}
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span>8시간 이상</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-amber-500 rounded"></div>
            <span>7-8시간</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span>6-7시간</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-500 rounded"></div>
            <span>6시간 미만</span>
          </div>
        </div>
      </div>

    </div>
  );
}

export default Working;
