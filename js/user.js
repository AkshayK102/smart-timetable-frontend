// User JavaScript

const API_BASE_URL = "http://localhost:8080/api";


// Get complete timetable
async function loadTimetable() {

    try {

        const response = await fetch(`${API_BASE_URL}/timetable`);

        if (!response.ok) {
            throw new Error("Failed to fetch timetable");
        }

        const timetable = await response.json();

        console.log("Timetable data:", timetable);

        return timetable;

    } catch (error) {

        console.error("Timetable error:", error);

    }

}


// Run when page loads
document.addEventListener("DOMContentLoaded", function () {

    const timetableTable = document.getElementById("timetableTable");

    if (timetableTable) {
        loadTimetable();
    }

});