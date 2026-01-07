import { useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router';
import WorkingList from '@components/working/list';
import Toolbar from '@components/working/toolbar';
import { getWeekStartDate, getWeekNumber, getDateFromWeekNumber } from '@/utils/dateHelper';
import { useWorkingData } from '@/hooks/useWorkingData';

export default function ManagerWorking() {
  const [searchParams, setSearchParams] = useSearchParams();
  const isInitialMount = useRef(true);
  const isUpdatingFromUrl = useRef(false);
  
  // URL에서 파라미터 읽기
  const urlYear = searchParams.get('year');
  const urlWeek = searchParams.get('week');
  const urlTeamIds = searchParams.get('teamid');

  // 초기 날짜 설정: URL 파라미터가 있으면 사용, 없으면 오늘
  const getInitialDate = () => {
    if (urlYear && urlWeek) {
      const year = parseInt(urlYear, 10);
      const week = parseInt(urlWeek, 10);
      if (!isNaN(year) && !isNaN(week)) {
        return getDateFromWeekNumber(year, week);
      }
    }
    return new Date();
  };

  const [currentDate, setCurrentDate] = useState(() => getInitialDate());

  // 초기 팀 ID 설정: URL 파라미터가 있으면 사용
  const getInitialTeamIds = () => {
    if (urlTeamIds) {
      const ids = urlTeamIds.split(',').map(id => parseInt(id, 10)).filter(id => !isNaN(id));
      return ids;
    }
    return [];
  };

  const [selectedTeamIds, setSelectedTeamIds] = useState<number[]>(() => getInitialTeamIds());

  // URL 파라미터가 변경되면 state 업데이트 (외부에서 URL이 변경된 경우만)
  const prevUrlYearRef = useRef(urlYear);
  const prevUrlWeekRef = useRef(urlWeek);
  const currentDateRef = useRef(currentDate);
  
  // currentDate가 변경될 때마다 ref 업데이트
  useEffect(() => {
    currentDateRef.current = currentDate;
  }, [currentDate]);
  
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      prevUrlYearRef.current = urlYear;
      prevUrlWeekRef.current = urlWeek;
      return;
    }

    if (isUpdatingFromUrl.current) {
      prevUrlYearRef.current = urlYear;
      prevUrlWeekRef.current = urlWeek;
      return;
    }

    // URL 파라미터가 실제로 변경된 경우에만 업데이트
    if (urlYear !== prevUrlYearRef.current || urlWeek !== prevUrlWeekRef.current) {
      prevUrlYearRef.current = urlYear;
      prevUrlWeekRef.current = urlWeek;

      if (urlYear && urlWeek) {
        const year = parseInt(urlYear, 10);
        const week = parseInt(urlWeek, 10);
        if (!isNaN(year) && !isNaN(week)) {
          const newDate = getDateFromWeekNumber(year, week);
          const currentWeekStart = getWeekStartDate(currentDateRef.current);
          const newWeekStart = getWeekStartDate(newDate);
          // 실제로 다른 주인 경우에만 업데이트
          if (currentWeekStart.getTime() !== newWeekStart.getTime()) {
            isUpdatingFromUrl.current = true;
            setCurrentDate(newDate);
            setTimeout(() => {
              isUpdatingFromUrl.current = false;
            }, 0);
          }
        }
      }
    }
  }, [urlYear, urlWeek]);

  const prevUrlTeamIdsRef = useRef(urlTeamIds);
  const selectedTeamIdsRef = useRef(selectedTeamIds);
  
  // selectedTeamIds가 변경될 때마다 ref 업데이트
  useEffect(() => {
    selectedTeamIdsRef.current = selectedTeamIds;
  }, [selectedTeamIds]);
  
  useEffect(() => {
    if (isInitialMount.current) {
      prevUrlTeamIdsRef.current = urlTeamIds;
      return;
    }

    if (isUpdatingFromUrl.current) {
      prevUrlTeamIdsRef.current = urlTeamIds;
      return;
    }

    // URL 파라미터가 실제로 변경된 경우에만 업데이트
    if (urlTeamIds !== prevUrlTeamIdsRef.current) {
      prevUrlTeamIdsRef.current = urlTeamIds;

      if (urlTeamIds) {
        const ids = urlTeamIds.split(',').map(id => parseInt(id, 10)).filter(id => !isNaN(id));
        // 배열이 실제로 다른 경우에만 업데이트
        if (ids.length !== selectedTeamIdsRef.current.length || 
            ids.some((id, idx) => id !== selectedTeamIdsRef.current[idx])) {
          isUpdatingFromUrl.current = true;
          setSelectedTeamIds(ids);
          setTimeout(() => {
            isUpdatingFromUrl.current = false;
          }, 0);
        }
      } else if (selectedTeamIdsRef.current.length > 0) {
        isUpdatingFromUrl.current = true;
        setSelectedTeamIds([]);
        setTimeout(() => {
          isUpdatingFromUrl.current = false;
        }, 0);
      }
    }
  }, [urlTeamIds]);

  // 현재 주의 시작일 계산
  const weekStartDate = useMemo(() => getWeekStartDate(currentDate), [currentDate]);
  
  // 근태 데이터 로드
  const { workingList, loading } = useWorkingData({ weekStartDate, selectedTeamIds, page: 'manager' });

  // 날짜 변경 핸들러: URL 업데이트
  const handleDateChange = (newDate: Date) => {
    if (isUpdatingFromUrl.current) return;
    
    setCurrentDate(newDate);
    const { year, week } = getWeekNumber(getWeekStartDate(newDate));
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('year', year.toString());
    newSearchParams.set('week', week.toString());
    setSearchParams(newSearchParams, { replace: true });
  };

  // 팀 선택 핸들러: URL 업데이트
  const handleTeamSelect = (teamIds: number[]) => {
    if (isUpdatingFromUrl.current) return;
    
    setSelectedTeamIds(teamIds);
    const newSearchParams = new URLSearchParams(searchParams);
    if (teamIds.length > 0) {
      newSearchParams.set('teamid', teamIds.join(','));
    } else {
      newSearchParams.delete('teamid');
    }
    setSearchParams(newSearchParams, { replace: true });
  };

  return (
    <div className="mb-5">
      <Toolbar 
        currentDate={currentDate} 
        onDateChange={handleDateChange} 
        onTeamSelect={handleTeamSelect}
        page="manager"
        workingList={workingList}
        weekStartDate={weekStartDate}
        initialSelectedTeamIds={selectedTeamIds}
      />
      
      <WorkingList
        data={workingList}
        loading={loading}
        weekStartDate={weekStartDate}
        page="manager"
      />
    </div>
  );
}
