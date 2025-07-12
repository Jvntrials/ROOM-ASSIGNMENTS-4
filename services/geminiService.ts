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

    const responseBody = await response.text();

    if (!response.ok) {
      let errorMessage = `Request failed with status ${response.status}`;
      try {
        const errorJson = JSON.parse(responseBody);
        errorMessage = errorJson.error || errorMessage;
      } catch (e) {
        // The response body was not valid JSON
        if(responseBody) {
          errorMessage = responseBody;
        }
      }
      throw new Error(errorMessage);
    }
    
    // The serverless function should return a JSON with a `schedule` key.
    return JSON.parse(responseBody);

  } catch (error) {
    console.error("Error calling schedule generation service:", error);
    const message = error instanceof Error ? error.message : "An unknown network error occurred.";
    // Re-throw to be caught by the UI component
    throw new Error(message);
  }
};
