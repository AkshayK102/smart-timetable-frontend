// ===== Login / Signup =====
const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");

function goToDashboard(role) {
    window.location.href = role === "ADMIN" ? "admin/dashboard.html" : "user/dashboard.html";
}

// Red message above the submit button (login errors, server errors)
function showError(message) {
    const el = document.getElementById("errorMsg");
    if (el) {
        el.textContent = message;
        el.classList.remove("hidden");
    } else {
        alert(message);
    }
}

function hideError() {
    const el = document.getElementById("errorMsg");
    if (el) el.classList.add("hidden");
}

// Red message directly under an input field. Pass null to clear it.
function setFieldError(input, message) {
    let p = input.parentElement.querySelector(".field-error");

    if (!message) {
        if (p) p.remove();
        return;
    }

    if (!p) {
        p = document.createElement("p");
        p.className = "field-error mt-1.5 text-sm text-red-600";
        p.setAttribute("role", "alert");
        input.insertAdjacentElement("afterend", p);
    }
    p.textContent = message;
}

function hasFieldError(input) {
    return input.parentElement.querySelector(".field-error") !== null;
}

// ---- Validation rules (each returns ONE message, or null if the value is fine) ----
const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/;

function getNameError(name) {
    if (name === "") return "Full name is required.";
    return null;
}

function getEmailError(email) {
    if (email === "") return "Email is required.";
    if (!EMAIL_REGEX.test(email)) return "Please enter a valid email address (for example: name@gmail.com).";
    return null;
}

function getPasswordError(password) {
    if (password === "") return "Password is required.";
    if (password.length < 8) return "Password must be at least 8 characters long.";
    if (/\s/.test(password)) return "Password must not contain spaces.";
    if (!/[A-Z]/.test(password)) return "Password must include at least one uppercase letter.";
    if (!/[a-z]/.test(password)) return "Password must include at least one lowercase letter.";
    if (!/[0-9]/.test(password)) return "Password must include at least one number.";
    if (!/[^A-Za-z0-9\s]/.test(password)) return "Password must include at least one special character (for example @, #, $, !).";
    return null;
}

function getConfirmError(password, confirmPassword) {
    if (confirmPassword === "") return "Please confirm your password.";
    if (password !== confirmPassword) return "Passwords do not match.";
    return null;
}

// ---- Login ----
if (loginForm) {
    loginForm.addEventListener("submit", async function (event) {
        event.preventDefault();
        hideError();

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;
        const button = loginForm.querySelector('button[type="submit"]');

        button.disabled = true;
        try {
            const data = await apiRequest("/auth/login", "POST", { email: email, password: password });
            saveSession(data);
            goToDashboard(data.role); // ADMIN -> admin dashboard, everyone else -> user dashboard
        } catch (err) {
            showError(err.message);
        } finally {
            button.disabled = false;
        }
    });
}

// ---- Signup ----
if (signupForm) {
    const nameEl = document.getElementById("fullName");
    const emailEl = document.getElementById("email");
    const passEl = document.getElementById("password");
    const confirmEl = document.getElementById("confirmPassword");

    // Each check shows/clears the message under its own field and returns true if valid
    function checkName() {
        const msg = getNameError(nameEl.value.trim());
        setFieldError(nameEl, msg);
        return msg === null;
    }
    function checkEmail() {
        const msg = getEmailError(emailEl.value.trim());
        setFieldError(emailEl, msg);
        return msg === null;
    }
    function checkPassword() {
        const msg = getPasswordError(passEl.value);
        setFieldError(passEl, msg);
        return msg === null;
    }
    function checkConfirm() {
        const msg = getConfirmError(passEl.value, confirmEl.value);
        setFieldError(confirmEl, msg);
        return msg === null;
    }

    const checks = [
        [nameEl, checkName],
        [emailEl, checkEmail],
        [passEl, checkPassword],
        [confirmEl, checkConfirm]
    ];

    checks.forEach(function (pair) {
        const input = pair[0];
        const check = pair[1];
        // Validate when the user leaves the field
        input.addEventListener("blur", check);
        // If an error is showing, re-check while typing so it disappears as soon as it is fixed
        input.addEventListener("input", function () {
            if (hasFieldError(input)) check();
        });
    });

    // If the password changes, the "do not match" message on confirm must update too
    passEl.addEventListener("input", function () {
        if (confirmEl.value !== "") checkConfirm();
    });

    signupForm.addEventListener("submit", async function (event) {
        event.preventDefault();
        hideError();

        // Run every check (no short-circuit) so all wrong fields get their message
        let firstInvalid = null;
        checks.forEach(function (pair) {
            const ok = pair[1]();
            if (!ok && firstInvalid === null) firstInvalid = pair[0];
        });
        if (firstInvalid !== null) {
            firstInvalid.focus();
            return;
        }

        const button = signupForm.querySelector('button[type="submit"]');
        button.disabled = true;
        try {
            const data = await apiRequest("/auth/signup", "POST", {
                name: nameEl.value.trim(),
                email: emailEl.value.trim(),
                password: passEl.value
            });
            saveSession(data);
            goToDashboard(data.role); // always USER
        } catch (err) {
            // Show the server message under the field it is about
            const lower = err.message.toLowerCase();
            if (lower.includes("password")) {
                setFieldError(passEl, err.message);
            } else if (lower.includes("email")) {
                setFieldError(emailEl, err.message);
            } else {
                showError(err.message);
            }
        } finally {
            button.disabled = false;
        }
    });
}