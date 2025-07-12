import React from 'react';
import { Course } from '../../types';
import { PlusIcon, TrashIcon } from '../icons';

interface CourseManagerProps {
  courses: Course[];
  setCourses: React.Dispatch<React.SetStateAction<Course[]>>;
}

const CourseManager: React.FC<CourseManagerProps> = ({ courses, setCourses }) => {
  const handleAddCourse = () => {
    const newId = `C${Date.now()}`;
    const newCourse: Course = { id: newId, name: 'New Subject', duration: 1, classSize: 30 };
    setCourses([...courses, newCourse]);
  };

  const handleUpdateCourse = (id: string, field: keyof Course, value: string | number) => {
    setCourses(courses.map(c => c.id === id ? { ...c, [field]: value } : c));
  };
  
  const handleDeleteCourse = (id: string) => {
    setCourses(courses.filter(c => c.id !== id));
  };

  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">Manage Subjects</h3>
        <button onClick={handleAddCourse} className="p-2 rounded-full text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-gray-700">
          <PlusIcon className="h-6 w-6" />
        </button>
      </div>

      {/* HEADERS for wider screens */}
      <div className="hidden sm:grid grid-cols-[minmax(0,1fr)_100px_80px_40px] gap-x-4 items-center px-3 pb-2 border-b border-gray-200 dark:border-gray-700">
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Subject</span>
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400 text-center">Duration (hrs)</span>
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400 text-center">Size</span>
          <span className="sr-only">Delete</span>
      </div>

      <ul className="space-y-3 mt-3">
        {courses.map(course => (
          <li key={course.id} className="sm:p-0 sm:pr-3 sm:py-2 rounded-md sm:bg-transparent sm:dark:bg-transparent sm:hover:bg-gray-50 sm:dark:hover:bg-gray-900/50">
            <div className="p-3 sm:p-0 bg-gray-50 dark:bg-gray-700 rounded-md sm:bg-transparent sm:dark:bg-transparent grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_100px_80px_40px] gap-x-4 gap-y-2 items-center">
              
              {/* Subject Name Input */}
              <div className="sm:col-span-1">
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 sm:hidden">Subject</label>
                  <input
                      type="text"
                      value={course.name}
                      onChange={(e) => handleUpdateCourse(course.id, 'name', e.target.value)}
                      className="w-full bg-white dark:bg-gray-600 p-2 border border-gray-300 dark:border-gray-500 rounded-md"
                      placeholder="Subject Name"
                  />
              </div>

              {/* Duration Input */}
              <div className="sm:col-span-1">
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 sm:hidden">Duration (hrs)</label>
                   <input
                      type="number"
                      value={course.duration}
                      onChange={(e) => handleUpdateCourse(course.id, 'duration', parseFloat(e.target.value) || 0)}
                      className="w-full bg-white dark:bg-gray-600 p-2 border border-gray-300 dark:border-gray-500 rounded-md text-center"
                      placeholder="Hours"
                      step="0.5"
                      min="0.5"
                  />
              </div>

              {/* Class Size Input */}
               <div className="sm:col-span-1">
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 sm:hidden">Size</label>
                   <input
                      type="number"
                      value={course.classSize}
                      onChange={(e) => handleUpdateCourse(course.id, 'classSize', parseInt(e.target.value) || 0)}
                      className="w-full bg-white dark:bg-gray-600 p-2 border border-gray-300 dark:border-gray-500 rounded-md text-center"
                      placeholder="Size"
                   />
              </div>
             
             {/* Delete Button */}
             <div className="sm:col-span-1 flex justify-end sm:justify-center">
                  <button onClick={() => handleDeleteCourse(course.id)} className="p-2 rounded-full text-red-500 hover:bg-red-100 dark:hover:bg-gray-600">
                      <TrashIcon className="h-5 w-5" />
                  </button>
             </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CourseManager;