import React, { useMemo, useState } from 'react';
import { ScheduleEntry, Course, Instructor, Room, Day, Conflict } from '../types';
import { DAYS_OF_WEEK, TIME_SLOTS } from '../constants';
import { WarningIcon, LocationMarkerIcon } from './icons';
import { formatTimeTo12Hour } from '../utils/conflictDetector';

interface ScheduleGridProps {
  schedule: ScheduleEntry[];
  courses: Course[];
  instructors: Instructor[];
  rooms: Room[];
  conflicts: Conflict[];
  onMoveEntry: (courseId: string, newDay: Day, newStartTime: string) => void;
  onOpenEdit: (entry: ScheduleEntry) => void;
}

const timeToMinutes = (time: string) => {
  if (!time || !time.includes(':')) return 0;
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + (minutes || 0);
};

const ScheduleGrid: React.FC<ScheduleGridProps> = ({ schedule, courses, instructors, rooms, conflicts, onMoveEntry, onOpenEdit }) => {
  const [draggedCourseId, setDraggedCourseId] = useState<string | null>(null);
  const [dragOverCell, setDragOverCell] = useState<{ day: Day; time: string } | null>(null);

  const dataMap = useMemo(() => {
    return {
      courses: new Map(courses.map(c => [c.id, c])),
      instructors: new Map(instructors.map(i => [i.id, i])),
      rooms: new Map(rooms.map(r => [r.id, r])),
    };
  }, [courses, instructors, rooms]);

  const isConflicting = (entry: ScheduleEntry): boolean => {
    return conflicts.some(conflict =>
      conflict.conflictingEntries.some(ce => ce.courseId === entry.courseId)
    );
  };
  
  const processedSchedule = useMemo(() => {
    const layoutProps: { [courseId: string]: { top: number; height: number; left: number; width: number; zIndex: number } } = {};

    DAYS_OF_WEEK.forEach(day => {
        const entriesOnDay = schedule.filter(entry => entry.day === day)
            .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

        entriesOnDay.forEach((entry, i) => {
            let overlaps = [];
            for (let j = 0; j < entriesOnDay.length; j++) {
                if (i === j) continue;
                const otherEntry = entriesOnDay[j];
                const startA = timeToMinutes(entry.startTime);
                const endA = timeToMinutes(entry.endTime);
                const startB = timeToMinutes(otherEntry.startTime);
                const endB = timeToMinutes(otherEntry.endTime);

                if (Math.max(startA, startB) < Math.min(endA, endB)) {
                    overlaps.push(otherEntry);
                }
            }
            
            overlaps.push(entry);
            overlaps.sort((a, b) => a.courseId.localeCompare(b.courseId));
            
            const colIndex = overlaps.findIndex(e => e.courseId === entry.courseId);
            const numCols = overlaps.length;

            const start = timeToMinutes(entry.startTime);
            const durationInMinutes = timeToMinutes(entry.endTime) - start;

            layoutProps[entry.courseId] = {
                top: ((start - (7 * 60)) / 60) * 4.5,
                height: (durationInMinutes / 60) * 4.5,
                width: 100 / numCols,
                left: (100 / numCols) * colIndex,
                zIndex: 10 + colIndex,
            };
        });
    });

    return schedule.map(entry => ({
        ...entry,
        layout: layoutProps[entry.courseId]
    }));
  }, [schedule]);


  const renderScheduleEntry = (entry: ScheduleEntry & { layout?: any }) => {
    const course = dataMap.courses.get(entry.courseId);
    const instructor = dataMap.instructors.get(entry.instructorId);
    const room = dataMap.rooms.get(entry.roomId);

    if (!course || !instructor || !room || !entry.layout) return null;
    
    const conflicting = isConflicting(entry);
    const isBeingDragged = draggedCourseId === entry.courseId;

    return (
      <div
        key={entry.courseId}
        draggable={true}
        onClick={() => onOpenEdit(entry)}
        onDragStart={(e) => {
          e.dataTransfer.setData('courseId', entry.courseId);
          e.dataTransfer.effectAllowed = 'move';
          setDraggedCourseId(entry.courseId);
        }}
        onDragEnd={() => setDraggedCourseId(null)}
        className={`absolute p-2 rounded-lg text-xs leading-tight shadow-md transition-all duration-200 ease-in-out border cursor-pointer
          ${conflicting ? 'bg-red-100 dark:bg-red-900/60 border-red-500' : 'bg-indigo-100 dark:bg-indigo-900/80 border-indigo-300 dark:border-indigo-700'}
          ${isBeingDragged ? 'opacity-0' : 'opacity-100'}`
        }
        style={{ 
            top: `${entry.layout.top}rem`, 
            height: `${entry.layout.height}rem`, 
            left: `${entry.layout.left}%`,
            width: `calc(${entry.layout.width}% - 4px)`,
            zIndex: entry.layout.zIndex,
            marginLeft: '2px',
        }}
        title={`${course.name}\n${instructor.name}\n${room.name}`}
      >
        <div className="font-bold text-gray-900 dark:text-white truncate">{course.name}</div>
        <div className="text-gray-700 dark:text-gray-300 truncate">{instructor.name}</div>
        <div className="flex items-center text-teal-700 dark:text-teal-300 font-medium">
          <LocationMarkerIcon className="h-3.5 w-3.5 mr-1 flex-shrink-0 text-teal-600 dark:text-teal-400"/>
          <span className="truncate">{room.name}</span>
        </div>
        <div className="text-gray-500 dark:text-gray-500 mt-1">{formatTimeTo12Hour(entry.startTime)} - {formatTimeTo12Hour(entry.endTime)}</div>
        {conflicting && (
            <WarningIcon className="h-5 w-5 text-red-500 absolute top-1 right-1" />
        )}
      </div>
    );
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, day: Day, time: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!dragOverCell || dragOverCell.day !== day || dragOverCell.time !== time) {
      setDragOverCell({ day, time });
    }
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>, day: Day, time: string) => {
    e.preventDefault();
    const courseId = e.dataTransfer.getData('courseId');
    if (courseId) {
      onMoveEntry(courseId, day, time);
    }
    setDragOverCell(null);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
      <div className="flex">
        <div className="w-20 flex-shrink-0" /> {/* Time column header */}
        {DAYS_OF_WEEK.map(day => (
          <div key={day} className="flex-1 text-center font-semibold text-sm sm:text-base py-3 border-b border-l border-gray-200 dark:border-gray-700">
            {day}
          </div>
        ))}
      </div>
      <div className="flex h-[63rem] overflow-y-auto">
        <div className="w-20 flex-shrink-0">
          {TIME_SLOTS.map(slot => (
            <div key={slot.value} className="h-[4.5rem] relative -top-[0.8rem] flex items-center justify-end">
              <div className="text-right pr-2 text-xs text-gray-500 dark:text-gray-400">
                {slot.display}
              </div>
            </div>
          ))}
        </div>
        {DAYS_OF_WEEK.map(day => (
          <div key={day} className="flex-1 border-l border-gray-200 dark:border-gray-700 relative">
            {TIME_SLOTS.map(slot => (
              <div 
                key={`${day}-${slot.value}`} 
                className={`h-[4.5rem] border-b border-gray-200 dark:border-gray-700 transition-colors ${dragOverCell?.day === day && dragOverCell?.time === slot.value ? 'bg-indigo-200 dark:bg-gray-700' : ''}`}
                onDragOver={(e) => handleDragOver(e, day, slot.value)}
                onDragLeave={() => setDragOverCell(null)}
                onDrop={(e) => handleDrop(e, day, slot.value)}
              ></div>
            ))}
            {processedSchedule
              .filter(entry => entry.day === day)
              .map(entry => renderScheduleEntry(entry))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ScheduleGrid;