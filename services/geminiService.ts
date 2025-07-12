import { Course, Instructor, Room, ScheduleEntry } from '../types';

export const generateSchedule = async (
  courses: Course[],
  instructors: Instructor[],
  rooms: Room[]
): Promise<{ schedule: ScheduleEntry[] }> => {
  try {
    const response = await fetch('/.netlify/functions/generate-schedule', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ courses, instructors, rooms }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response from server.' }));
      throw new Error(errorData.error || `Request failed with status ${response.status}`);
    }

    const result = await response.json();
    return result;

  } catch (error) {
    console.error("Error calling generate-schedule function:", error);
    const message = error instanceof Error ? error.message : "An unknown error occurred.";
    if (message.includes("API_KEY")) {
        throw new Error("The AI service is not configured correctly on the server.");
    }
    throw new Error(`AI Service Error: ${message}`);
  }
};