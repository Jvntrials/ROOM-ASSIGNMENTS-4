import React, { useState } from 'react';
import { Course, Instructor, Room, ScheduleEntry } from '../types';
import CourseManager from './managers/CourseManager';
import InstructorManager from './managers/InstructorManager';
import RoomManager from './managers/RoomManager';
import AssignmentsViewer from './managers/AssignmentsViewer';
import { CalendarPlusIcon } from './icons';

interface AdminPanelProps {
  courses: Course[];
  setCourses: React.Dispatch<React.SetStateAction<Course[]>>;
  instructors: Instructor[];
  setInstructors: React.Dispatch<React.SetStateAction<Instructor[]>>;
  rooms: Room[];
  setRooms: React.Dispatch<React.SetStateAction<Room[]>>;
  unassignedCourses: Course[];
  schedule: ScheduleEntry[];
  onScheduleCourse: (courseId: string) => void;
}

type Tab = 'assignments' | 'subjects' | 'instructors' | 'rooms' | 'unassigned';

const AdminPanel: React.FC<AdminPanelProps> = ({
  courses,
  setCourses,
  instructors,
  setInstructors,
  rooms,
  setRooms,
  unassignedCourses,
  schedule,
  onScheduleCourse,
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('assignments');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'assignments':
        return <AssignmentsViewer schedule={schedule} courses={courses} instructors={instructors} rooms={rooms} />;
      case 'subjects':
        return <CourseManager courses={courses} setCourses={setCourses} />;
      case 'instructors':
        return <InstructorManager instructors={instructors} setInstructors={setInstructors} courses={courses} rooms={rooms} />;
      case 'rooms':
        return <RoomManager rooms={rooms} setRooms={setRooms} />;
      case 'unassigned':
        return (
          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
             <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">Unassigned Courses</h3>
             <ul className="mt-4 space-y-2">
              {unassignedCourses.length > 0 ? (
                unassignedCourses.map(course => (
                  <li key={course.id} className="p-2 bg-yellow-100 dark:bg-yellow-800/50 rounded-md text-yellow-800 dark:text-yellow-100 flex justify-between items-center">
                    <span>{course.name}</span>
                     <button
                        onClick={() => onScheduleCourse(course.id)}
                        className="p-1 rounded-full text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-gray-700"
                        title={`Schedule ${course.name}`}
                    >
                        <CalendarPlusIcon className="h-5 w-5" />
                    </button>
                  </li>
                ))
              ) : (
                <p className="text-gray-500 dark:text-gray-400">All courses have been scheduled.</p>
              )}
             </ul>
          </div>
        )
      default:
        return null;
    }
  };

  const getTabClass = (tab: Tab) => `px-3 py-2 font-medium text-sm rounded-md cursor-pointer transition-colors ${
      activeTab === tab
        ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200'
        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
    }`;

  return (
    <div className="space-y-6">
      <div>
        <div className="sm:hidden">
          <label htmlFor="tabs" className="sr-only">Select a tab</label>
          <select
            id="tabs"
            name="tabs"
            className="block w-full focus:ring-indigo-500 focus:border-indigo-500 border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            onChange={(e) => setActiveTab(e.target.value as Tab)}
            value={activeTab}
          >
            <option value="assignments">Assignments</option>
            <option value="subjects">Subjects</option>
            <option value="instructors">Instructors</option>
            <option value="rooms">Rooms</option>
            <option value="unassigned">Unassigned</option>
          </select>
        </div>
        <div className="hidden sm:block">
          <nav className="flex flex-wrap gap-2 bg-gray-200 dark:bg-gray-800 p-1 rounded-lg" aria-label="Tabs">
            <button onClick={() => setActiveTab('assignments')} className={getTabClass('assignments')}>Assignments</button>
            <button onClick={() => setActiveTab('subjects')} className={getTabClass('subjects')}>Subjects</button>
            <button onClick={() => setActiveTab('instructors')} className={getTabClass('instructors')}>Instructors</button>
            <button onClick={() => setActiveTab('rooms')} className={getTabClass('rooms')}>Rooms</button>
            <button onClick={() => setActiveTab('unassigned')} className={getTabClass('unassigned')}>
              Unassigned <span className="ml-1 inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-200 text-yellow-800">{unassignedCourses.length}</span>
            </button>
          </nav>
        </div>
      </div>
      <div>
        {renderTabContent()}
      </div>
    </div>
  );
};

export default AdminPanel;