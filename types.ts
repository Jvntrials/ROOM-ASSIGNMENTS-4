export interface Course {
  id: string;
  name: string;
  duration: number; // in hours
  classSize: number;
}

export interface Instructor {
  id: string;
  name:string;
  availability: {
    day: Day;
    start: string; // "HH:MM"
    end: string; // "HH:MM"
  }[];
  preferredRoomIds: string[];
  assignedCourseIds: string[];
}

export interface Room {
  id: string;
  name: string;
  capacity: number;
}

export interface ScheduleEntry {
  courseId: string;
  instructorId: string;
  roomId: string;
  day: Day;
  startTime: string; // "HH:MM"
  endTime: string; // "HH:MM"
}

export enum Day {
  Monday = "Monday",
  Tuesday = "Tuesday",
  Wednesday = "Wednesday",
  Thursday = "Thursday",
  Friday = "Friday",
  Saturday = "Saturday",
}

export interface TimeSlot {
  display: string;
  value: string; // "HH:MM"
}

export interface Conflict {
  type: 'instructor' | 'room';
  id: string; // instructorId or roomId
  day: Day;
  time: string; // Start time of conflict
  conflictingEntries: ScheduleEntry[];
}