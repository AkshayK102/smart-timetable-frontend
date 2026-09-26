// ===== Smart Timetable: common API helper =====
const API_BASE = "http://localhost:8080/api";

// login.html is at root, admin/user pages are one folder in
const IN_SUBFOLDER =
    window.location.pathname.includes("/admin/") ||
    window.location.pathname.includes("/user/");
const ROOT = IN_SUBFOLDER ? "../" : "";

function getToken() {
    return localStorage.getItem("token");
}

function getUser() {
    try {
        return JSON.parse(localStorage.getItem("user"));
    } catch (e) {
        return null;
    }
}

function saveSession(data) {
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify({
        id: data.userId,
        name: data.name,
        email: data.email,
        role: data.role
    }));
}

function clearSession() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
}

// Every backend call goes through this (token gets attached automatically)
async function apiRequest(path, method = "GET", body = null) {
    const headers = { "Content-Type": "application/json" };
    const token = getToken();
    if (token) {
        headers["Authorization"] = "Bearer " + token;
    }

    let response;
    try {
        response = await fetch(API_BASE + path, {
            method: method,
            headers: headers,
            body: body ? JSON.stringify(body) : undefined
        });
    } catch (e) {
        throw new Error("Can't reach the backend. Is the server running?");
    }

    // Bad/expired token: force re-login
    if (response.status === 401 && !path.startsWith("/auth/")) {
        clearSession();
        window.location.href = ROOT + "login.html";
        throw new Error("Your session has expired. Please log in again.");
    }

    if (response.status === 204) {
        return null;
    }

    let data = null;
    try {
        data = await response.json();
    } catch (e) {
        data = null;
    }

    if (!response.ok) {
        let message = "Something went wrong (" + response.status + ")";
        if (data && data.fieldErrors) {
            message = Object.values(data.fieldErrors).join(", ");
        } else if (data && data.error) {
            message = data.error;
        }
        throw new Error(message);
    }

    return data;
}

// Protects a page: requireLogin() or requireLogin("ADMIN")
function requireLogin(role) {
    const user = getUser();
    if (!getToken() || !user) {
        window.location.href = ROOT + "login.html";
        return;
    }
    if (role && user.role !== role) {
        window.location.href = ROOT + "user/dashboard.html";
    }
}

async function logout() {
    try {
        await apiRequest("/auth/logout", "POST");
    } catch (e) {
        // ignore - we'll clear the local session regardless
    }
    clearSession();
    window.location.href = ROOT + "login.html";
}

// Admin/User pages: make the Logout link actually log out + show "Welcome, <name>"
document.addEventListener("DOMContentLoaded", function () {
    if (!IN_SUBFOLDER) return;

    document.querySelectorAll('a[href="../login.html"]').forEach(function (a) {
        a.addEventListener("click", function (event) {
            event.preventDefault();
            logout();
        });
    });

    const user = getUser();
    if (user) {
        document.querySelectorAll("span").forEach(function (s) {
            if (s.textContent.trim().startsWith("Welcome,")) {
                s.textContent = "Welcome, " + user.name;
            }
        });
    }
});