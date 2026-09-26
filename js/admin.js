// Admin JavaScript

console.log("Admin panel loaded");

// API base URL
const API_BASE_URL = "http://localhost:8080/api";

// Load timetable data
async function loadAdminTimetable() {

    try {

        const response = await fetch(`${API_BASE_URL}/timetable`);

        if (!response.ok) {
            throw new Error("Failed to load timetable");
        }

        const data = await response.json();

        console.log("Timetable:", data);

        return data;

    } catch (error) {

        console.error("Error loading timetable:", error);

    }

}