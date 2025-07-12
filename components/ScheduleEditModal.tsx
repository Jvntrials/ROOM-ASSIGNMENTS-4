import React, { useState, useEffect, useMemo } from 'react';
import { Course, Instructor, Room, ScheduleEntry, Day } from '../types';
import { DAYS_OF_WEEK, TIME_SLOTS } from '../constants';
import { TrashIcon } from './icons';
import { formatTimeTo12Hour, checkForManualConflict } from '../utils/conflictDetector';

interface ScheduleEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (entry: ScheduleEntry) => void;
  onDelete: (courseId: string) => void;
  entryData: { entry?: ScheduleEntry; courseId?: string };
  courses: Course[];
  instructors: Instructor[];
  rooms: Room[];
  schedule: ScheduleEntry[];
}

const ScheduleEditModal: React.FC<ScheduleEditModalProps> = ({ isOpen, onClose, onSave, onDelete, entryData, courses, instructors, rooms, schedule }) => {
  const [formData, setFormData] = useState<{
    instructorId: string;
    roomId: string;
    day: Day;
    startTime: string;
  }>({
    instructorId: '',
    roomId: '',
    day: Day.Monday,
    startTime: '09:00',
  });
  const [validationError, setValidationError] = useState<string | null>(null);

  const isEditing = useMemo(() => !!entryData.entry, [entryData]);
  const activeCourseId = useMemo(() => entryData.entry?.courseId || entryData.courseId, [entryData]);
  const activeCourse = useMemo(() => courses.find(c => c.id === activeCourseId), [courses, activeCourseId]);

  const filteredInstructors = useMemo(() => {
    if (!activeCourseId) return [];
    return instructors.filter(i => i.assignedCourseIds.includes(activeCourseId));
  }, [instructors, activeCourseId]);

  const timeToMinutes = (time: string): number => {
    if (!time) return 0;
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + (minutes || 0);
  };

  const minutesToTime = (minutes: number): string => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  const calculatedEndTime = useMemo(() => {
    if (!activeCourse || !formData.startTime) return '';
    const startMinutes = timeToMinutes(formData.startTime);
    const endMinutes = startMinutes + activeCourse.duration * 60;
    return minutesToTime(endMinutes);
  }, [formData.startTime, activeCourse]);

  useEffect(() => {
    if (entryData.entry) {
      setFormData({
        instructorId: entryData.entry.instructorId,
        roomId: entryData.entry.roomId,
        day: entryData.entry.day,
        startTime: entryData.entry.startTime,
      });
    } else {
      // Reset for new entry, pre-selecting first available instructor if possible
      setFormData({
        instructorId: filteredInstructors[0]?.id || '',
        roomId: rooms[0]?.id || '',
        day: Day.Monday,
        startTime: '09:00',
      });
    }
  }, [entryData, filteredInstructors, rooms]);


  useEffect(() => {
    if (!isOpen || !activeCourse || !formData.instructorId || !formData.roomId) {
      setValidationError(null);
      return;
    }

    const currentEntry: ScheduleEntry = {
      courseId: activeCourse.id,
      endTime: calculatedEndTime,
      ...formData,
    };
    
    const error = checkForManualConflict(currentEntry, schedule, courses, rooms, instructors);
    setValidationError(error);

  }, [formData, activeCourse, calculatedEndTime, schedule, courses, rooms, instructors, isOpen]);

  const handleSave = () => {
    if (!activeCourseId || !calculatedEndTime || validationError) return;
    onSave({
      courseId: activeCourseId,
      endTime: calculatedEndTime,
      ...formData,
    });
  };

  const handleDelete = () => {
    if (activeCourseId) {
      if (window.confirm(`Are you sure you want to remove ${activeCourse?.name} from the schedule?`)) {
        onDelete(activeCourseId);
      }
    }
  };

  if (!isOpen || !activeCourse) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-40" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-lg mx-4" onClick={e => e.stopPropagation()}>
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
          {isEditing ? `Edit: ${activeCourse.name}` : `Schedule: ${activeCourse.name}`}
        </h2>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="instructor" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Instructor</label>
            <select id="instructor" value={formData.instructorId} onChange={e => setFormData({...formData, instructorId: e.target.value})} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
              {filteredInstructors.length > 0 ? filteredInstructors.map(i => (
                <option key={i.id} value={i.id}>{i.name}</option>
              )) : <option value="" disabled>No instructors assigned to this course</option>}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="room" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Room</label>
              <select id="room" value={formData.roomId} onChange={e => setFormData({...formData, roomId: e.target.value})} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                {rooms.map(r => (
                  <option key={r.id} value={r.id}>{r.name} (Cap: {r.capacity})</option>
                ))}
              </select>
            </div>
             <div>
              <label htmlFor="day" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Day</label>
              <select id="day" value={formData.day} onChange={e => setFormData({...formData, day: e.target.value as Day})} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                {DAYS_OF_WEEK.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             <div>
              <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Start Time</label>
              <select id="startTime" value={formData.startTime} onChange={e => setFormData({...formData, startTime: e.target.value})} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                {TIME_SLOTS.map(t => (
                  <option key={t.value} value={t.value}>{t.display}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">End Time (auto)</label>
              <div className="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-gray-100 dark:bg-gray-900 border-gray-300 dark:border-gray-600 sm:text-sm rounded-md">
                {formatTimeTo12Hour(calculatedEndTime) || 'N/A'}
              </div>
            </div>
          </div>
        </div>
        
        {validationError && (
          <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200 rounded-md text-sm transition-all">
            {validationError}
          </div>
        )}

        <div className="mt-6 flex justify-between">
          <div>
            {isEditing && (
              <button
                type="button"
                onClick={handleDelete}
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <TrashIcon className="h-5 w-5 mr-2" />
                Delete
              </button>
            )}
          </div>
          <div className="flex justify-end gap-3">
             <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!formData.instructorId || !formData.roomId || !!validationError}
              className="inline-flex justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 disabled:cursor-not-allowed"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleEditModal;