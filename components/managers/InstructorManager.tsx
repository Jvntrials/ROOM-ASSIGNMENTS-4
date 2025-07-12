import React from 'react';
import { Instructor, Course, Room, Day } from '../../types';
import { PlusIcon, TrashIcon } from '../icons';
import { DAYS_OF_WEEK } from '../../constants';

interface InstructorManagerProps {
  instructors: Instructor[];
  setInstructors: React.Dispatch<React.SetStateAction<Instructor[]>>;
  courses: Course[];
  rooms: Room[];
}

const InstructorManager: React.FC<InstructorManagerProps> = ({ instructors, setInstructors, courses, rooms }) => {
  const handleAddInstructor = () => {
    const newId = `I${Date.now()}`;
    const newInstructor: Instructor = {
      id: newId, name: 'New Instructor', availability: [], preferredRoomIds: [], assignedCourseIds: []
    };
    setInstructors([...instructors, newInstructor]);
  };
  
  const handleUpdateInstructor = (id: string, field: keyof Instructor, value: any) => {
    setInstructors(instructors.map(i => i.id === id ? { ...i, [field]: value } : i));
  };
  
  const handleDeleteInstructor = (id: string) => {
    setInstructors(instructors.filter(i => i.id !== id));
  };
  
  const handleAvailabilityChange = (instructorId: string, day: Day, field: 'start' | 'end', value: string) => {
    setInstructors(prevInstructors => prevInstructors.map(inst => {
        if (inst.id !== instructorId) {
            return inst;
        }

        let availability = [...inst.availability];
        const dayAvailability = availability.find(a => a.day === day);

        if (dayAvailability) {
            // Found an existing entry, map to update it immutably
            availability = availability.map(a =>
                a.day === day ? { ...a, [field]: value } : a
            );
        } else if (value) {
            // No existing entry and a value is being set, so add a new one
            availability.push({ day, start: '09:00', end: '17:00', ...{ [field]: value } });
        }

        // Filter out entries that are now completely empty
        const filteredAvailability = availability.filter(a => a.start || a.end);

        return { ...inst, availability: filteredAvailability };
    }));
  };

  const handleToggleCourse = (instructorId: string, courseId: string) => {
    const newInstructors = instructors.map(inst => {
      if (inst.id === instructorId) {
        const assignedCourseIds = inst.assignedCourseIds.includes(courseId)
          ? inst.assignedCourseIds.filter(id => id !== courseId)
          : [...inst.assignedCourseIds, courseId];
        return { ...inst, assignedCourseIds };
      }
      return inst;
    });
    setInstructors(newInstructors);
  };


  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">Manage Instructors</h3>
        <button onClick={handleAddInstructor} className="p-2 rounded-full text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-gray-700">
          <PlusIcon className="h-6 w-6" />
        </button>
      </div>
      <ul className="space-y-4">
        {instructors.map(inst => (
          <li key={inst.id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-4">
            <div className="flex items-center gap-4">
              <input
                type="text"
                value={inst.name}
                onChange={(e) => handleUpdateInstructor(inst.id, 'name', e.target.value)}
                className="flex-grow bg-white dark:bg-gray-600 p-2 border border-gray-300 dark:border-gray-500 rounded-md"
                placeholder="Instructor Name"
              />
              <button onClick={() => handleDeleteInstructor(inst.id)} className="p-2 rounded-full text-red-500 hover:bg-red-100 dark:hover:bg-gray-600">
                <TrashIcon className="h-5 w-5" />
              </button>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Availability</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {DAYS_OF_WEEK.map(day => {
                  const avail = inst.availability.find(a => a.day === day);
                  return (
                    <div key={day} className="flex items-center gap-1">
                      <span className="text-xs w-12">{day.substring(0,3)}:</span>
                      <input type="time" value={avail?.start || ''} onChange={e => handleAvailabilityChange(inst.id, day, 'start', e.target.value)} className="w-full text-xs p-1 rounded-md border-gray-300 dark:bg-gray-600 dark:border-gray-500"/>
                      <input type="time" value={avail?.end || ''} onChange={e => handleAvailabilityChange(inst.id, day, 'end', e.target.value)} className="w-full text-xs p-1 rounded-md border-gray-300 dark:bg-gray-600 dark:border-gray-500"/>
                    </div>
                  )
                })}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Assigned Courses</h4>
              <div className="flex flex-wrap gap-2">
                {courses.map(course => (
                   <button key={course.id} onClick={() => handleToggleCourse(inst.id, course.id)} className={`px-2 py-1 text-xs rounded-full ${inst.assignedCourseIds.includes(course.id) ? 'bg-indigo-500 text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200'}`}>
                    {course.name}
                  </button>
                ))}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default InstructorManager;