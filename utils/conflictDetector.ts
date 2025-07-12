import { ScheduleEntry, Conflict, Day, Course, Instructor, Room } from '../types';

// Helper to convert 24-hour "HH:MM" to 12-hour "h:mm AM/PM"
export const formatTimeTo12Hour = (time24: string): string => {
  if (!time24 || !time24.includes(':')) {
    return time24; // Return original if format is invalid
  }
  const [hourString, minute] = time24.split(':');
  let hour = parseInt(hourString, 10);
  const period = hour >= 12 ? 'PM' : 'AM';
  
  if (hour > 12) {
    hour -= 12;
  } else if (hour === 0) {
    hour = 12;
  }
  
  return `${hour}:${minute} ${period}`;
};

// Helper to convert "HH:MM" time to minutes from midnight
const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

export const detectConflicts = (schedule: ScheduleEntry[]): Conflict[] => {
  const conflicts: Conflict[] = [];
  const instructorBookings: { [key: string]: ScheduleEntry[] } = {};
  const roomBookings: { [key: string]: ScheduleEntry[] } = {};

  // Group bookings by instructor/day and room/day
  for (const entry of schedule) {
    const instructorKey = `${entry.instructorId}-${entry.day}`;
    const roomKey = `${entry.roomId}-${entry.day}`;

    if (!instructorBookings[instructorKey]) instructorBookings[instructorKey] = [];
    instructorBookings[instructorKey].push(entry);

    if (!roomBookings[roomKey]) roomBookings[roomKey] = [];
    roomBookings[roomKey].push(entry);
  }

  // Check for instructor conflicts
  for (const key in instructorBookings) {
    const bookings = instructorBookings[key].sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
    for (let i = 0; i < bookings.length - 1; i++) {
      const current = bookings[i];
      const next = bookings[i + 1];
      if (timeToMinutes(current.endTime) > timeToMinutes(next.startTime)) {
        conflicts.push({
          type: 'instructor',
          id: current.instructorId,
          day: current.day,
          time: next.startTime,
          conflictingEntries: [current, next],
        });
      }
    }
  }
  
  // Check for room conflicts
  for (const key in roomBookings) {
    const bookings = roomBookings[key].sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
    for (let i = 0; i < bookings.length - 1; i++) {
      const current = bookings[i];
      const next = bookings[i + 1];
      if (timeToMinutes(current.endTime) > timeToMinutes(next.startTime)) {
        conflicts.push({
          type: 'room',
          id: current.roomId,
          day: current.day,
          time: next.startTime,
          conflictingEntries: [current, next],
        });
      }
    }
  }

  return conflicts;
};

export const checkForManualConflict = (
  entryToCheck: ScheduleEntry,
  allEntries: ScheduleEntry[],
  courses: Course[],
  rooms: Room[],
  instructors: Instructor[]
): string | null => {
  const course = courses.find(c => c.id === entryToCheck.courseId);
  if (!course) return "Course not found.";

  const room = rooms.find(r => r.id === entryToCheck.roomId);
  if (!room) return "Room not found.";

  const instructor = instructors.find(i => i.id === entryToCheck.instructorId);
  if (!instructor) return "Instructor not found.";

  // 1. Check room capacity
  if (room.capacity < course.classSize) {
    return `Conflict: Room '${room.name}' capacity (${room.capacity}) is less than class size (${course.classSize}).`;
  }

  const startTimeMinutes = timeToMinutes(entryToCheck.startTime);
  const endTimeMinutes = timeToMinutes(entryToCheck.endTime);
  
  // 2. Check instructor availability
  const availabilityForDay = instructor.availability.find(a => a.day === entryToCheck.day);
  if (!availabilityForDay || !availabilityForDay.start || !availabilityForDay.end) {
    return `Conflict: ${instructor.name} is not available on ${entryToCheck.day}.`;
  }
  const availStartMinutes = timeToMinutes(availabilityForDay.start);
  const availEndMinutes = timeToMinutes(availabilityForDay.end);

  if (startTimeMinutes < availStartMinutes || endTimeMinutes > availEndMinutes) {
    return `Conflict: Class time is outside ${instructor.name}'s availability (${formatTimeTo12Hour(availabilityForDay.start)}-${formatTimeTo12Hour(availabilityForDay.end)}).`;
  }

  // 3. Check for overlaps with other classes
  for (const existingEntry of allEntries) {
    // Skip if it's the same class entry we are editing
    if (existingEntry.courseId === entryToCheck.courseId) {
      continue;
    }

    if (existingEntry.day === entryToCheck.day) {
      const existingStartMinutes = timeToMinutes(existingEntry.startTime);
      const existingEndMinutes = timeToMinutes(existingEntry.endTime);

      const isOverlapping =
        (startTimeMinutes < existingEndMinutes) && (endTimeMinutes > existingStartMinutes);

      if (isOverlapping) {
        const existingCourse = courses.find(c => c.id === existingEntry.courseId);
        // Check for room conflict
        if (existingEntry.roomId === entryToCheck.roomId) {
          return `Conflict: Room '${room.name}' is already booked for '${existingCourse?.name}' at this time.`;
        }
        // Check for instructor conflict
        if (existingEntry.instructorId === entryToCheck.instructorId) {
          return `Conflict: Instructor '${instructor.name}' is already teaching '${existingCourse?.name}' at this time.`;
        }
      }
    }
  }

  return null; // No conflicts found
};
