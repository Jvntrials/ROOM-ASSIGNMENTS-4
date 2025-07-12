import { Course, Instructor, Room, Day, TimeSlot } from './types';
import { formatTimeTo12Hour } from './utils/conflictDetector';

export const DAYS_OF_WEEK: Day[] = [Day.Monday, Day.Tuesday, Day.Wednesday, Day.Thursday, Day.Friday, Day.Saturday];

export const TIME_SLOTS: TimeSlot[] = Array.from({ length: 14 }, (_, i) => {
  const hour24 = i + 7;
  const timeValue = `${String(hour24).padStart(2, '0')}:00`;
  return {
    display: formatTimeTo12Hour(timeValue),
    value: timeValue,
  };
});

export const DEFAULT_COURSES: Course[] = [
  { id: 'C101', name: 'Intro to Computer Science', duration: 1.5, classSize: 45 },
  { id: 'M201', name: 'Calculus II', duration: 1, classSize: 30 },
  { id: 'P303', name: 'Modern Physics', duration: 2, classSize: 25 },
  { id: 'H110', name: 'World History', duration: 1.5, classSize: 50 },
  { id: 'A401', name: 'Advanced Algorithms', duration: 2.5, classSize: 20 },
  { id: 'E210', name: 'Digital Circuits', duration: 2, classSize: 35 },
];

export const DEFAULT_INSTRUCTORS: Instructor[] = [
  {
    id: 'I001',
    name: 'Dr. Alan Turing',
    availability: [
      { day: Day.Monday, start: '09:00', end: '12:00' },
      { day: Day.Wednesday, start: '09:00', end: '12:00' },
    ],
    preferredRoomIds: ['R1'],
    assignedCourseIds: ['C101', 'A401'],
  },
  {
    id: 'I002',
    name: 'Dr. Marie Curie',
    availability: [
      { day: Day.Tuesday, start: '10:00', end: '15:00' },
      { day: Day.Thursday, start: '10:00', end: '15:00' },
    ],
    preferredRoomIds: ['R2'],
    assignedCourseIds: ['P303'],
  },
  {
    id: 'I003',
    name: 'Dr. Isaac Newton',
    availability: [
        { day: Day.Monday, start: '13:00', end: '17:00' },
        { day: Day.Friday, start: '08:00', end: '12:00' },
    ],
    preferredRoomIds: [],
    assignedCourseIds: ['M201'],
  },
    {
    id: 'I004',
    name: 'Dr. Ada Lovelace',
    availability: [
        { day: Day.Tuesday, start: '09:00', end: '17:00' },
        { day: Day.Wednesday, start: '13:00', end: '17:00' },
        { day: Day.Saturday, start: '10:00', end: '14:00' },
    ],
    preferredRoomIds: ['R3'],
    assignedCourseIds: ['H110', 'E210'],
  },
];

export const DEFAULT_ROOMS: Room[] = [
  { id: 'R1', name: 'Main Hall', capacity: 50 },
  { id: 'R2', name: 'Physics Lab', capacity: 30 },
  { id: 'R3', name: 'Room 201', capacity: 40 },
  { id: 'R4', name: 'Small Auditorium', capacity: 60 },
];