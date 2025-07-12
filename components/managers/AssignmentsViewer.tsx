import React, { useMemo, useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ScheduleEntry, Course, Instructor, Room } from '../../types';
import { formatTimeTo12Hour } from '../../utils/conflictDetector';
import { DAYS_OF_WEEK } from '../../constants';
import { DownloadIcon } from '../icons';


interface AssignmentsViewerProps {
  schedule: ScheduleEntry[];
  courses: Course[];
  instructors: Instructor[];
  rooms: Room[];
}

type ViewTab = 'professors' | 'subjects' | 'rooms';

const AssignmentsViewer: React.FC<AssignmentsViewerProps> = ({ schedule, courses, instructors, rooms }) => {
  const [activeView, setActiveView] = useState<ViewTab>('professors');

  const dataMap = useMemo(() => {
    return {
      courses: new Map(courses.map(c => [c.id, c])),
      instructors: new Map(instructors.map(i => [i.id, i])),
      rooms: new Map(rooms.map(r => [r.id, r])),
    };
  }, [courses, instructors, rooms]);

  const sortedSchedule = useMemo(() => {
    return [...schedule].sort((a, b) => {
      const dayAIndex = DAYS_OF_WEEK.indexOf(a.day);
      const dayBIndex = DAYS_OF_WEEK.indexOf(b.day);
      if (dayAIndex !== dayBIndex) {
        return dayAIndex - dayBIndex;
      }
      return a.startTime.localeCompare(b.startTime);
    });
  }, [schedule]);

  const scheduleByProfessor = useMemo(() => {
    const grouped = new Map<string, ScheduleEntry[]>();
    sortedSchedule.forEach(entry => {
      const list = grouped.get(entry.instructorId) || [];
      list.push(entry);
      grouped.set(entry.instructorId, list);
    });
    return grouped;
  }, [sortedSchedule]);

  const scheduleByRoom = useMemo(() => {
    const grouped = new Map<string, ScheduleEntry[]>();
    sortedSchedule.forEach(entry => {
      const list = grouped.get(entry.roomId) || [];
      list.push(entry);
      grouped.set(entry.roomId, list);
    });
    return grouped;
  }, [sortedSchedule]);

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text("Class Schedule", 14, 16);

    const tableHead = [['Day', 'Time', 'Subject', 'Professor', 'Room']];
    const tableBody = sortedSchedule.map(entry => {
      const course = dataMap.courses.get(entry.courseId);
      const instructor = dataMap.instructors.get(entry.instructorId);
      const room = dataMap.rooms.get(entry.roomId);
      return [
        entry.day,
        `${formatTimeTo12Hour(entry.startTime)} - ${formatTimeTo12Hour(entry.endTime)}`,
        course?.name || 'N/A',
        instructor?.name || 'N/A',
        room?.name || 'N/A',
      ];
    });

    autoTable(doc, {
        head: tableHead,
        body: tableBody,
        startY: 20,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [22, 160, 133] }, // A teal color
    });

    doc.save('class-schedule.pdf');
  };

  if (sortedSchedule.length === 0) {
    return (
      <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow text-center">
        <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">Assignments Overview</h3>
        <p className="mt-4 text-gray-500 dark:text-gray-400">No classes have been scheduled yet. Click "AI Generate Schedule" to begin.</p>
      </div>
    );
  }
  
  const getTabClass = (tab: ViewTab) => 
    `px-1 py-3 border-b-2 font-medium text-sm transition-colors cursor-pointer ${
      activeView === tab
        ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-600'
    }`;

  const renderContent = () => {
    switch(activeView) {
      case 'professors':
        return (
          <div className="space-y-4">
            {Array.from(scheduleByProfessor.entries()).map(([instructorId, entries]) => {
              const instructor = dataMap.instructors.get(instructorId);
              if (!instructor) return null;
              return (
                <div key={instructorId} className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg shadow-sm">
                  <h4 className="font-bold text-lg text-indigo-700 dark:text-indigo-400">{instructor.name}</h4>
                  <ul className="mt-2 space-y-3">
                    {entries.map(entry => {
                      const course = dataMap.courses.get(entry.courseId);
                      const room = dataMap.rooms.get(entry.roomId);
                      if (!course || !room) return null;
                      return (
                        <li key={`${entry.courseId}-${entry.day}-${entry.startTime}`} className="p-3 bg-white dark:bg-gray-800 rounded-md ring-1 ring-gray-200 dark:ring-gray-700/50">
                          <p className="font-semibold text-gray-800 dark:text-gray-100">{course.name}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-300">Room: {room.name}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{entry.day}, {formatTimeTo12Hour(entry.startTime)} - {formatTimeTo12Hour(entry.endTime)}</p>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )
            })}
          </div>
        );

      case 'rooms':
        return (
          <div className="space-y-4">
            {Array.from(scheduleByRoom.entries()).map(([roomId, entries]) => {
              const room = dataMap.rooms.get(roomId);
              if (!room) return null;
              return (
                <div key={roomId} className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg shadow-sm">
                  <h4 className="font-bold text-lg text-teal-700 dark:text-teal-400">{room.name} <span className="text-sm font-normal text-gray-500 dark:text-gray-400">(Capacity: {room.capacity})</span></h4>
                  <ul className="mt-2 space-y-3">
                    {entries.map(entry => {
                      const course = dataMap.courses.get(entry.courseId);
                      const instructor = dataMap.instructors.get(entry.instructorId);
                      if (!course || !instructor) return null;
                      return (
                        <li key={`${entry.courseId}-${entry.day}-${entry.startTime}`} className="p-3 bg-white dark:bg-gray-800 rounded-md ring-1 ring-gray-200 dark:ring-gray-700/50">
                          <p className="font-semibold text-gray-800 dark:text-gray-100">{course.name}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-300">Prof: {instructor.name}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{entry.day}, {formatTimeTo12Hour(entry.startTime)} - {formatTimeTo12Hour(entry.endTime)}</p>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )
            })}
          </div>
        );

      case 'subjects':
      default:
        return (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Subject</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Professor</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Room</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Day</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Time</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {sortedSchedule.map((entry) => {
                    const course = dataMap.courses.get(entry.courseId);
                    const instructor = dataMap.instructors.get(entry.instructorId);
                    const room = dataMap.rooms.get(entry.roomId);
                    if (!course || !instructor || !room) return null;

                    return (
                      <tr key={`${entry.courseId}-${entry.day}-${entry.startTime}`}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{course.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{instructor.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{room.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{entry.day}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          {formatTimeTo12Hour(entry.startTime)} - {formatTimeTo12Hour(entry.endTime)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
              {sortedSchedule.map((entry) => {
                  const course = dataMap.courses.get(entry.courseId);
                  const instructor = dataMap.instructors.get(entry.instructorId);
                  const room = dataMap.rooms.get(entry.roomId);
                  if (!course || !instructor || !room) return null;

                  return (
                      <div key={`${entry.courseId}-${entry.day}-${entry.startTime}`} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg shadow">
                          <h4 className="font-bold text-gray-900 dark:text-white">{course.name}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-300">Prof: {instructor.name}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-300">Room: {room.name}</p>
                          <p className="mt-2 text-sm font-semibold text-gray-800 dark:text-gray-200">{entry.day} at {formatTimeTo12Hour(entry.startTime)} - {formatTimeTo12Hour(entry.endTime)}</p>
                      </div>
                  )
              })}
            </div>
          </>
        );
    }
  }

  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">Assignments Overview</h3>
          <div className="border-b border-gray-200 dark:border-gray-700 mt-2">
              <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                  <button onClick={() => setActiveView('professors')} className={getTabClass('professors')}>
                      By Professor
                  </button>
                  <button onClick={() => setActiveView('subjects')} className={getTabClass('subjects')}>
                      By Subject
                  </button>
                  <button onClick={() => setActiveView('rooms')} className={getTabClass('rooms')}>
                      By Room
                  </button>
              </nav>
          </div>
        </div>
        <button
          onClick={handleExportPDF}
          className="ml-4 inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <DownloadIcon className="h-5 w-5 mr-2" />
          Export PDF
        </button>
      </div>
      
      <div className="mt-6">
        {renderContent()}
      </div>
    </div>
  );
};

export default AssignmentsViewer;