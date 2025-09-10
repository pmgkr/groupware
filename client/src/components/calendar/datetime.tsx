import React from 'react';
import Datetime from 'react-datetime';
import 'react-datetime/css/react-datetime.css';

interface DateTimePickerProps {
  value?: string | Date;
  onChange: (value: string | Date) => void;
  placeholder?: string;
  className?: string;
  dateFormat?: string;
  timeFormat?: string;
  inputProps?: any;
}

export default function DateTimePicker({
  value,
  onChange,
  placeholder = "날짜와 시간을 선택하세요",
  className = "",
  dateFormat = "YYYY-MM-DD",
  timeFormat = "HH:mm",
  inputProps = {}
}: DateTimePickerProps) {
  const handleChange = (selectedDate: string | Date) => {
    onChange(selectedDate);
  };

  return (
    <div className={`datetime-picker ${className}`}>
      <Datetime
        value={value}
        onChange={handleChange}
        dateFormat={dateFormat}
        timeFormat={timeFormat}
        inputProps={{
          placeholder,
          className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500",
          ...inputProps
        }}
      />
    </div>
  );
}