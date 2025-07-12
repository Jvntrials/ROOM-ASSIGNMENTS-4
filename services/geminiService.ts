import { GoogleGenAI, Type } from "@google/genai";
import { Course, Instructor, Room, ScheduleEntry, Day } from '../types';

export const generateSchedule = async (
  courses: Course[],
  instructors: Instructor[],
  rooms: Room[]
): Promise<{ schedule: ScheduleEntry[] }> => {
  // Per instructions, assume process.env.API_KEY is available.
  // The GoogleGenAI constructor will handle missing/invalid keys.
  try {
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

    const result = JSON.parse(jsonText);
    return result;

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    const message = error instanceof Error ? error.message : "An unknown error occurred.";
    throw new Error(`AI Service Error: ${message}`);
  }
};
