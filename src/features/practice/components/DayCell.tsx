import type { FC } from 'react';
import type { DayCellProps } from '../types/streak';

const STATUS_ICONS: Record<string, string> = {
  completed: 'local_fire_department',
  today: 'star',
  locked: 'lock',
  future: 'radio_button_unchecked',
};

const STATUS_CLASSES: Record<string, string> = {
  completed: 'practice-streak__day-box--done',
  today: 'practice-streak__day-box--today',
  locked: 'practice-streak__day-box--locked',
  future: 'practice-streak__day-box--future',
};

export const DayCell: FC<DayCellProps> = ({
  day,
  onClick,
  isCheckInDisabled = false,
}) => {
  const canCheckIn = day.status === 'today' && !isCheckInDisabled;
  const isInteractive = canCheckIn;

  const handleClick = () => {
    if (isInteractive && onClick) {
      onClick();
    }
  };

  const dayClasses = [
    'practice-streak__day',
    day.isToday && 'practice-streak__day--today',
    day.status === 'locked' && 'practice-streak__day--locked',
    day.status === 'future' && 'practice-streak__day--future',
    canCheckIn && 'practice-streak__day--clickable',
  ]
    .filter(Boolean)
    .join(' ');

  const boxClasses = [
    'practice-streak__day-box',
    STATUS_CLASSES[day.status],
    canCheckIn && 'practice-streak__day-box--clickable',
    day.isToday && canCheckIn && 'practice-streak__day-box--can-checkin',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={dayClasses}
      onClick={handleClick}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && isInteractive) {
          handleClick();
        }
      }}
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      aria-label={
        isInteractive
          ? `${day.label}: Nhấn để check-in`
          : `${day.label}: ${day.status === 'completed' ? 'Đã hoàn thành' : day.status === 'today' ? 'Hôm nay' : day.status === 'locked' ? 'Đã khóa' : 'Sắp tới'}`
      }
    >
      <span className="practice-streak__day-label">{day.label}</span>
      <div className={boxClasses}>
        <span className="material-symbols-outlined practice-streak__day-icon">
          {STATUS_ICONS[day.status]}
        </span>
        {day.isToday && day.status === 'today' && (
          <div className="practice-streak__day-today-dot" />
        )}
        {canCheckIn && (
          <div className="practice-streak__day-checkin-pulse" />
        )}
      </div>
    </div>
  );
};