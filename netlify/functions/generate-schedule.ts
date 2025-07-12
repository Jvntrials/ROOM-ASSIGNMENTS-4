import { Handler } from "@netlify/functions";
import { GoogleGenAI, Type } from "@google/genai";
import { Course, Instructor, Room, Day, ScheduleEntry } from '../../types';

// The main handler for the Netlify function
const handler: Handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  // Handle missing API key gracefully for development environments
  if (!process.env.API_KEY) {
    console.warn("API_KEY environment variable not set. Returning a mock schedule for development purposes.");
    
    const mockSchedule: ScheduleEntry[] = [
      { courseId: 'C101', instructorId: 'I001', roomId: 'R1', day: Day.Monday, startTime: '09:00', endTime: '10:30' },
      { courseId: 'A401', instructorId: 'I001', roomId: 'R1', day: Day.Wednesday, startTime: '09:00', endTime: '11:30' },
      { courseId: 'P303', instructorId: 'I002', roomId: 'R2', day: Day.Tuesday, startTime: '10:00', endTime: '12:00' },
      { courseId: 'M201', instructorId: 'I003', roomId: 'R2', day: Day.Friday, startTime: '10:00', endTime: '11:00' },
      { courseId: 'H110', instructorId: 'I004', roomId: 'R4', day: Day.Wednesday, startTime: '13:00', endTime: '14:30' },
      { courseId: 'E210', instructorId: 'I004', roomId: 'R3', day: Day.Tuesday, startTime: '14:00', endTime: '16:00' },
    ];
    
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ schedule: mockSchedule }),
    };
  }

  try {
    const { courses, instructors, rooms } = JSON.parse(event.body || "{}");
    if (!courses || !instructors || !rooms) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: "Missing courses, instructors, or rooms in request body." }),
        };
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const model = "gemini-2.5-flash";

    const scheduleSchema = {
      type: Type.OBJECT,
      properties: {
        schedule: {
          type: Type.ARRAY,
          description: "The generated class schedule.",
          items: {
            type: Type.OBJECT,
            properties: {
              courseId: { type: Type.STRING, description: "ID of the course." },
              instructorId: { type: Type.STRING, description: "ID of the instructor." },
              roomId: { type: Type.STRING, description: "ID of the room." },
              day: { type: Type.STRING, enum: Object.values(Day), description: "Day of the week." },
              startTime: { type: Type.STRING, description: "Start time in HH:MM format." },
              endTime: { type: Type.STRING, description: "End time in HH:MM format." },
            },
            required: ["courseId", "instructorId", "roomId", "day", "startTime", "endTime"]
          },
        },
      },
      required: ["schedule"],
    };
  
    const prompt = `
      You are an expert university scheduler. Your task is to create an optimal, conflict-free class schedule based on the provided data.
  
      **CRITICAL RULE: YOU MUST NOT CREATE ANY SCHEDULING CONFLICTS.**
      - A professor **CANNOT** be assigned to two different classes that overlap in time on the same day.
      - A classroom **CANNOT** host two different classes that overlap in time on the same day.
      - This is the most important rule. For example, if Class A is in Room 1 from 09:00 to 10:00 on Monday, you cannot schedule Class B in Room 1 between 09:00 and 10:00 on Monday. The same applies to professors.
  
      **Other Constraints:**
      1.  **Professor Availability:** Classes must ONLY be scheduled during the professor's specified available hours.
      2.  **Room Capacity:** The number of students in a class must not exceed the capacity of the assigned classroom.
      3.  **Working Hours:** All classes must be scheduled between Monday and Saturday, from 07:00 to 21:00.
      4.  **Assign all Courses:** Every course listed must be assigned to a schedule slot.
      5.  **Correct Instructor:** Assign courses only to instructors who are listed as teaching them.
      6.  **Calculate End Time:** The end time must be calculated based on the course duration. For example, a 1.5-hour class starting at 09:00 should end at 10:30.
      7.  **Efficiency:** Create a compact schedule. Try to group a professor's classes close together if possible.
  
      **Input Data:**
  
      Courses: ${JSON.stringify(courses)}
      
      Instructors: ${JSON.stringify(instructors)}
  
      Rooms: ${JSON.stringify(rooms)}
  
      **Final Check & Output Format:**
      Before providing the final JSON, double-check your generated schedule to ensure there are absolutely no time conflicts for any professor or any room.
      You MUST respond with a JSON object that contains a single key "schedule" which is an array of schedule entries. Each entry must conform to the provided schema. Do not include any explanatory text or markdown formatting. Ensure every course is scheduled.
    `;
    
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: scheduleSchema,
        temperature: 0.2,
      },
    });
    
    const jsonText = response.text.trim();
    if (!jsonText) {
      throw new Error("Received an empty response from the AI.");
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: jsonText,
    };
  } catch (error) {
    console.error("Error calling Gemini API in Netlify function:", error);
    const message = error instanceof Error ? error.message : "An unknown server error occurred.";
    return {
      statusCode: 500,
      body: JSON.stringify({ error: `AI Service Error: ${message}` }),
    };
  }
};

export { handler };
