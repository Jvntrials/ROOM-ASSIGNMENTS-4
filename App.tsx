import React, {
  useState,
  useEffect,
  useCallback,
  useMemo
} from 'react';
import {
  Course,
  Instructor,
  Room,
  ScheduleEntry,
  Conflict,
  Day
} from './types';
import useLocalStorage from './hooks/useLocalStorage';
import {
  DEFAULT_COURSES,
  DEFAULT_INSTRUCTORS,
  DEFAULT_ROOMS
} from './constants';
import Header from './components/Header';
import AdminPanel from './components/AdminPanel';
import ScheduleGrid from './components/ScheduleGrid';
import {
  generateSchedule as fetchGeneratedSchedule
} from './services/geminiService';
import {
  ToastContainer
} from './components/Toast';
import {
  detectConflicts,
  formatTimeTo12Hour,
  checkForManualConflict
} from './utils/conflictDetector';
import LoadingSpinner from './components/LoadingSpinner';
import ScheduleEditModal from './components/ScheduleEditModal';

const App: React.FC = () => {
  const [courses, setCourses] = useLocalStorage<Course[]>('courses', DEFAULT_COURSES);
  const [instructors, setInstructors] = useLocalStorage<Instructor[]>('instructors', DEFAULT_INSTRUCTORS);
  const [rooms, setRooms] = useLocalStorage<Room[]>('rooms', DEFAULT_ROOMS);
  const [schedule, setSchedule] = useLocalStorage<ScheduleEntry[]>('schedule', []);
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [toasts, setToasts] = useState<{
    id: number;message: string;type: 'success' | 'error'
  }[]>([]);
  const [editingState, setEditingState] = useState<{
    entry?: ScheduleEntry;
    courseId?: string;
  } | null>(null);

  const addToast = useCallback((message: string, type: 'success' | 'error') => {
    const id = Date.now();
    setToasts(prev => [...prev, {
      id,
      message,
      type
    }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  }, []);

  useEffect(() => {
    const detected = detectConflicts(schedule);
    setConflicts(detected);
    if (detected.length > 0) {
      // Don't toast on initial load, only on changes. This could be improved.
      // addToast(`${detected.length} schedule conflict(s) detected!`, 'error');
    }
  }, [schedule]);


  const handleGenerateSchedule = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await fetchGeneratedSchedule(courses, instructors, rooms);
      if (result && result.schedule) {
        const conflictsInResult = detectConflicts(result.schedule);
        if (conflictsInResult.length > 0) {
          console.error("AI returned a schedule with conflicts:", conflictsInResult);
          throw new Error("AI returned a schedule with conflicts. Please try generating again.");
        }
        
        setSchedule(result.schedule);
        addToast('AI schedule generated successfully!', 'success');
      } else {
        throw new Error('AI generation returned an empty schedule.');
      }
    } catch (error) {
      console.error("Failed to generate schedule:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      addToast(`Error generating schedule: ${errorMessage}`, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [courses, instructors, rooms, setSchedule, addToast]);

  const unassignedCourses = useMemo(() => {
    const scheduledCourseIds = new Set(schedule.map(entry => entry.courseId));
    return courses.filter(course => !scheduledCourseIds.has(course.id));
  }, [courses, schedule]);

  const handleMoveScheduleEntry = useCallback((courseId: string, newDay: Day, newStartTime: string) => {
    const entryToMove = schedule.find(e => e.courseId === courseId);
    if (!entryToMove) return;

    const course = courses.find(c => c.id === courseId);
    if (!course) return;

    const instructor = instructors.find(i => i.id === entryToMove.instructorId);
    if (!instructor) return;

    const timeToMinutes = (time: string): number => {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + (minutes || 0);
    };

    const minutesToTime = (minutes: number): string => {
      const h = Math.floor(minutes / 60);
      const m = minutes % 60;
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    };

    const newEndTime = minutesToTime(timeToMinutes(newStartTime) + course.duration * 60);

    const updatedEntry = { ...entryToMove, day: newDay, startTime: newStartTime, endTime: newEndTime };

    const conflictError = checkForManualConflict(updatedEntry, schedule, courses, rooms, instructors);

    if (conflictError) {
        addToast(conflictError, 'error');
        return;
    }

    setSchedule(prevSchedule =>
      prevSchedule.map(entry =>
        entry.courseId === courseId ? updatedEntry : entry
      )
    );
    addToast(`${course.name} was moved successfully.`, 'success');
  }, [schedule, courses, instructors, setSchedule, addToast]);

  const handleOpenCreateModal = (courseId: string) => {
    setEditingState({ courseId });
  };

  const handleOpenEditModal = (entry: ScheduleEntry) => {
    setEditingState({ entry });
  };

  const handleCloseModal = () => {
    setEditingState(null);
  };

  const handleDeleteEntry = (courseId: string) => {
    setSchedule(prev => prev.filter(e => e.courseId !== courseId));
    addToast('Class removed from schedule.', 'success');
    handleCloseModal();
  };

  const handleSaveEntry = (updatedEntry: ScheduleEntry) => {
    const conflictError = checkForManualConflict(
      updatedEntry,
      schedule,
      courses,
      rooms,
      instructors
    );

    if (conflictError) {
      addToast(conflictError, 'error');
      return; // Don't save if there's a conflict
    }

    setSchedule(prev => {
      const isEditing = prev.some(e => e.courseId === updatedEntry.courseId);
      if (isEditing) {
        return prev.map(e => e.courseId === updatedEntry.courseId ? updatedEntry : e);
      }
      return [...prev, updatedEntry];
    });
    addToast('Schedule updated successfully!', 'success');
    handleCloseModal();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header onGenerate={handleGenerateSchedule} isGenerating={isLoading} />
      <main className="p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-1">
            <AdminPanel
              courses={courses}
              setCourses={setCourses}
              instructors={instructors}
              setInstructors={setInstructors}
              rooms={rooms}
              setRooms={setRooms}
              unassignedCourses={unassignedCourses}
              schedule={schedule}
              onScheduleCourse={handleOpenCreateModal}
            />
          </div>
          <div className="xl:col-span-2">
            <ScheduleGrid
              schedule={schedule}
              courses={courses}
              instructors={instructors}
              rooms={rooms}
              conflicts={conflicts}
              onMoveEntry={handleMoveScheduleEntry}
              onOpenEdit={handleOpenEditModal}
            />
          </div>
        </div>
      </main>
      {isLoading && <LoadingSpinner />}
      <ToastContainer toasts={toasts} />
      {editingState && (
        <ScheduleEditModal
            isOpen={!!editingState}
            onClose={handleCloseModal}
            onSave={handleSaveEntry}
            onDelete={handleDeleteEntry}
            entryData={editingState}
            courses={courses}
            instructors={instructors}
            rooms={rooms}
            schedule={schedule}
        />
      )}
    </div>
  );
};

export default App;