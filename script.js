// ============================================================
//  VaxCare — script.js
//  Smart Vaccination Scheduling (Frontend Only)
// ============================================================

// ---- DUMMY VACCINE SCHEDULE DATA ----
// Age in months → vaccines due
const VACCINE_SCHEDULE = [
  { ageMonths: 0,   label: "At Birth",     vaccines: ["BCG", "OPV-0", "Hepatitis B (1st)"] },
  { ageMonths: 1.5, label: "6 Weeks",      vaccines: ["DTwP/DTaP (1st)", "IPV (1st)", "Hib (1st)", "Hepatitis B (2nd)", "Rotavirus (1st)", "PCV (1st)"] },
  { ageMonths: 2.5, label: "10 Weeks",     vaccines: ["DTwP/DTaP (2nd)", "IPV (2nd)", "Hib (2nd)", "Rotavirus (2nd)", "PCV (2nd)"] },
  { ageMonths: 3.5, label: "14 Weeks",     vaccines: ["DTwP/DTaP (3rd)", "IPV (3rd)", "Hib (3rd)", "Rotavirus (3rd)", "PCV (3rd)"] },
  { ageMonths: 6,   label: "6 Months",     vaccines: ["OPV (2nd)", "Hepatitis B (3rd)", "Influenza (1st)"] },
  { ageMonths: 9,   label: "9 Months",     vaccines: ["MMR (1st)", "OPV (3rd)", "Typhoid"] },
  { ageMonths: 12,  label: "12 Months",    vaccines: ["Hepatitis A (1st)", "Varicella (1st)", "PCV Booster"] },
  { ageMonths: 15,  label: "15 Months",    vaccines: ["MMR (2nd)", "Varicella (2nd)", "DTwP Booster"] },
  { ageMonths: 18,  label: "18 Months",    vaccines: ["DTwP/DTaP Booster", "IPV Booster", "Hib Booster", "Hepatitis A (2nd)"] },
  { ageMonths: 24,  label: "2 Years",      vaccines: ["Typhoid Booster", "Influenza (Annual)"] },
  { ageMonths: 60,  label: "5 Years",      vaccines: ["DTwP/DTaP Booster", "MMR Booster", "OPV Booster"] },
  { ageMonths: 120, label: "10 Years",     vaccines: ["Tdap", "HPV (1st)", "Hepatitis B (if missed)"] },
  { ageMonths: 132, label: "11 Years",     vaccines: ["HPV (2nd)", "Meningococcal"] },
];

// ---- STORAGE HELPERS ----
function getPatients() {
  return JSON.parse(localStorage.getItem("vaxcare_patients") || "[]");
}

function savePatients(patients) {
  localStorage.setItem("vaxcare_patients", JSON.stringify(patients));
}

function getScheduleData() {
  return JSON.parse(localStorage.getItem("vaxcare_schedule") || "[]");
}

function saveScheduleData(data) {
  localStorage.setItem("vaxcare_schedule", JSON.stringify(data));
}

// ---- LOGIN ----
function handleLogin(e) {
  e.preventDefault();
  const user = document.getElementById("login-username").value.trim();
  const pass = document.getElementById("login-password").value;
  const err  = document.getElementById("login-error");

  if (user === "admin" && pass === "admin123") {

     localStorage.setItem("vaxcare_logged_in", "true"); // ✅ ADD THIS
    err.classList.add("hidden");
    document.getElementById("page-login").classList.remove("active");
    document.getElementById("page-login").classList.add("hidden");
    document.getElementById("page-app").classList.remove("hidden");
    document.getElementById("page-app").classList.add("active");
    refreshDashboard();
    renderSchedule();
    renderVaccineRefChart();
    checkNotifications();
  } else {
    err.classList.remove("hidden");
  }
}

// ---- CHECK LOGIN ON PAGE LOAD ----
(function checkLoginState() {
  const isLoggedIn = localStorage.getItem("vaxcare_logged_in");

  if (isLoggedIn === "true") {
    document.getElementById("page-login").classList.remove("active");
    document.getElementById("page-login").classList.add("hidden");

    document.getElementById("page-app").classList.remove("hidden");
    document.getElementById("page-app").classList.add("active");

    refreshDashboard();
    renderSchedule();
    renderVaccineRefChart();
    checkNotifications();
  }
})();

function handleLogout() {

   localStorage.removeItem("vaxcare_logged_in"); // ✅ ADD THIS
  document.getElementById("page-app").classList.remove("active");
  document.getElementById("page-app").classList.add("hidden");
  document.getElementById("page-login").classList.add("active");
  document.getElementById("page-login").classList.remove("hidden");
  document.getElementById("login-username").value = "";
  document.getElementById("login-password").value = "";
}

// ---- NAVIGATION ----
function showSection(name, linkEl) {
  document.querySelectorAll(".section").forEach(s => {
    s.classList.remove("active");
    s.classList.add("hidden");
  });
  document.querySelectorAll(".nav-link").forEach(l => l.classList.remove("active"));

  const section = document.getElementById("section-" + name);
  if (section) {
    section.classList.remove("hidden");
    section.classList.add("active");
  }
  if (linkEl) linkEl.classList.add("active");

  const titles = {
    "dashboard":   ["Dashboard",           "Overview of your vaccination program"],
    "add-patient": ["Add Patient",          "Register a new patient and generate their schedule"],
    "schedule":    ["Vaccination Schedule", "View and manage all scheduled vaccinations"],
  };

  const t = titles[name];
  if (t) {
    document.getElementById("section-title").textContent = t[0];
    document.getElementById("section-subtitle").textContent = t[1];
  }

  if (name === "dashboard")  { refreshDashboard(); checkNotifications(); }
  if (name === "schedule")   { renderSchedule(); renderVaccineRefChart(); }
  if (name === "add-patient") { document.getElementById("form-success").classList.add("hidden"); }
}

// ---- ADD PATIENT ----
function handleAddPatient(e) {
  e.preventDefault();

  const name    = document.getElementById("p-name").value.trim();
  const ageMonths = parseInt(document.getElementById("p-age").value);
  const parent  = document.getElementById("p-parent").value.trim();
  const contact = document.getElementById("p-contact").value.trim();
  const dob     = document.getElementById("p-dob").value;
  const notes   = document.getElementById("p-notes").value.trim();

  const patients = getPatients();
  const id = Date.now().toString();

  const patient = { id, name, ageMonths, parent, contact, dob, notes, addedAt: new Date().toISOString() };
  patients.push(patient);
  savePatients(patients);

  // Generate schedule entries for this patient
  generateScheduleForPatient(patient);

  // Show success
  document.getElementById("form-success").classList.remove("hidden");
  document.getElementById("patient-form").reset();

  // Show notification
  showUINotification(`✅ Patient "${name}" added! Schedule generated for ${ageMonths}+ month age group.`);

  setTimeout(() => {
    document.getElementById("form-success").classList.add("hidden");
  }, 4000);
}

function generateScheduleForPatient(patient) {
  const schedule = getScheduleData();
  const dobDate = patient.dob ? new Date(patient.dob) : new Date();

  // Find vaccines due from current age onward
  VACCINE_SCHEDULE.forEach(slot => {
    if (slot.ageMonths >= patient.ageMonths) {
      // Calculate due date from DOB
      const dueDate = new Date(dobDate);
      dueDate.setDate(dueDate.getDate() + Math.round(slot.ageMonths * 30.44));

      slot.vaccines.forEach(vaccine => {
        schedule.push({
          id: Date.now().toString() + Math.random().toString(36).slice(2),
          patientId:  patient.id,
          patientName: patient.name,
          ageLabel:   slot.label,
          ageMonths:  slot.ageMonths,
          vaccine,
          dueDate:    dueDate.toISOString().split("T")[0],
          status:     "pending",
          completedAt: null,
        });
      });
    }
  });

  saveScheduleData(schedule);
}

function clearForm() {
  document.getElementById("patient-form").reset();
  document.getElementById("form-success").classList.add("hidden");
}

// ---- DASHBOARD ----
function refreshDashboard() {
  const patients = getPatients();
  const schedule = getScheduleData();
  const today    = new Date().toISOString().split("T")[0];
  const thisMonth= today.slice(0, 7);

  const totalPatients  = patients.length;
  const totalVaccines  = schedule.length;
  const dueThisMonth   = schedule.filter(s => s.status === "pending" && s.dueDate.startsWith(thisMonth)).length;
  const completed      = schedule.filter(s => s.status === "completed").length;

  document.getElementById("stat-patients").textContent  = totalPatients;
  document.getElementById("stat-vaccines").textContent  = totalVaccines;
  document.getElementById("stat-due").textContent       = dueThisMonth;
  document.getElementById("stat-completed").textContent = completed;

  // Recent patients
  const recentEl = document.getElementById("recent-patients-list");
  if (patients.length === 0) {
    recentEl.innerHTML = `<p class="empty-msg">No patients added yet.</p>`;
  } else {
    recentEl.innerHTML = patients.slice(-5).reverse().map(p => `
      <div class="patient-row">
        <div class="patient-avatar">${p.name.charAt(0).toUpperCase()}</div>
        <div class="patient-info">
          <strong>${escape(p.name)}</strong>
          <span>${p.ageMonths} months old · ${p.parent || "No guardian"}</span>
        </div>
      </div>
    `).join("");
  }

  // Upcoming reminders on dashboard
  const reminderEl = document.getElementById("dashboard-reminders");
  const upcoming = schedule
    .filter(s => s.status === "pending")
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 6);

  if (upcoming.length === 0) {
    reminderEl.innerHTML = `<p class="empty-msg">No upcoming vaccinations.</p>`;
  } else {
    reminderEl.innerHTML = upcoming.map(s => {
      const days = daysDiff(s.dueDate);
      const cls  = days < 0 ? "rb-due" : days <= 7 ? "rb-due" : days <= 30 ? "rb-soon" : "rb-ok";
      const lbl  = days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? "Today!" : `in ${days}d`;
      return `
        <div class="reminder-item">
          <span class="reminder-badge ${cls}">${lbl}</span>
          <div>
            <strong>${escape(s.patientName)}</strong> — ${escape(s.vaccine)}<br>
            <span style="color:var(--text-muted);font-size:0.78rem;">${s.ageLabel} · Due: ${s.dueDate}</span>
          </div>
        </div>
      `;
    }).join("");
  }
}

// ---- SCHEDULE PAGE ----
function renderSchedule() {
  const schedule = getScheduleData();
  const search   = (document.getElementById("search-patient")?.value || "").toLowerCase();
  const filter   = document.getElementById("filter-status")?.value || "all";
  const today    = new Date().toISOString().split("T")[0];
  const wrap     = document.getElementById("schedule-table-wrap");

  let rows = schedule.map(s => {
    // Auto-mark overdue
    if (s.status === "pending" && s.dueDate < today) s.status = "overdue";
    return s;
  });

  // Save any auto-updated statuses
  saveScheduleData(schedule);

  // Filter
  if (search) rows = rows.filter(r => r.patientName.toLowerCase().includes(search) || r.vaccine.toLowerCase().includes(search));
  if (filter !== "all") rows = rows.filter(r => r.status === filter);

  // Sort by dueDate
  rows.sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  if (rows.length === 0) {
    wrap.innerHTML = `<p class="empty-msg">No results found. Add a patient first or adjust filters.</p>`;
    return;
  }

  wrap.innerHTML = `
    <div style="overflow-x:auto;">
      <table class="schedule-table">
        <thead>
          <tr>
            <th>Patient</th>
            <th>Vaccine</th>
            <th>Age Stage</th>
            <th>Due Date</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map(s => {
            const sCls = s.status === "completed" ? "sp-completed" : s.status === "overdue" ? "sp-overdue" : "sp-pending";
            const sLbl = s.status.charAt(0).toUpperCase() + s.status.slice(1);
            const actionBtn = s.status !== "completed"
              ? `<button class="action-btn done" onclick="markComplete('${s.id}')">✓ Done</button>`
              : `<span style="color:var(--text-muted);font-size:0.8rem;">Completed ${s.completedAt || ""}</span>`;
            return `
              <tr>
                <td><strong>${escape(s.patientName)}</strong></td>
                <td>${escape(s.vaccine)}</td>
                <td>${escape(s.ageLabel)}</td>
                <td>${s.dueDate}</td>
                <td><span class="status-pill ${sCls}">${sLbl}</span></td>
                <td>${actionBtn}</td>
              </tr>
            `;
          }).join("")}
        </tbody>
      </table>
    </div>
    <p style="font-size:0.8rem;color:var(--text-muted);margin-top:0.8rem;">Showing ${rows.length} record(s)</p>
  `;
}

function markComplete(id) {
  const schedule = getScheduleData();
  const entry    = schedule.find(s => s.id === id);
  if (!entry) return;

  entry.status      = "completed";
  entry.completedAt = new Date().toISOString().split("T")[0];
  saveScheduleData(schedule);

  showUINotification(`💉 Vaccination "${entry.vaccine}" marked as completed for ${entry.patientName}!`);
  renderSchedule();
  refreshDashboard();
}

// ---- VACCINE REFERENCE CHART ----
function renderVaccineRefChart() {
  const el = document.getElementById("vaccine-ref-chart");
  el.innerHTML = `<div class="ref-grid">
    ${VACCINE_SCHEDULE.map(slot => `
      <div class="ref-card">
        <div class="ref-age">📅 ${slot.label}</div>
        <div class="ref-vaccines">
          ${slot.vaccines.map(v => `<span class="vax-tag">${v}</span>`).join("")}
        </div>
      </div>
    `).join("")}
  </div>`;
}

// ---- NOTIFICATIONS ----
function checkNotifications() {
  const schedule = getScheduleData();
  const today    = new Date().toISOString().split("T")[0];

  const urgent = schedule.filter(s => {
    if (s.status !== "pending") return false;
    const days = daysDiff(s.dueDate);
    return days <= 7; // due within 7 days or overdue
  });

  const countEl = document.getElementById("notif-count");
  countEl.textContent = urgent.length;
  countEl.style.display = urgent.length > 0 ? "inline" : "none";

  // Populate notification panel
  const listEl = document.getElementById("notif-list");
  if (urgent.length === 0) {
    listEl.innerHTML = `<p class="empty-msg" style="padding:0.5rem 0;">No urgent reminders 🎉</p>`;
  } else {
    listEl.innerHTML = urgent.map(s => {
      const days = daysDiff(s.dueDate);
      const cls  = days < 0 ? "urgent" : "ok";
      const lbl  = days < 0 ? `${Math.abs(days)} day(s) overdue` : days === 0 ? "Due TODAY" : `Due in ${days} day(s)`;
      return `
        <div class="notif-item">
          <div class="notif-dot ${cls}"></div>
          <div>
            <strong>${escape(s.patientName)}</strong> — ${escape(s.vaccine)}<br>
            <span style="font-size:0.78rem;">${lbl} · ${s.dueDate}</span>
          </div>
        </div>
      `;
    }).join("");

    // Show browser-style alert simulation if page just loaded
    if (window._notifShown !== true && urgent.length > 0) {
      window._notifShown = true;
      setTimeout(() => {
        showUINotification(`🔔 You have ${urgent.length} upcoming or overdue vaccination(s) requiring attention!`);
      }, 800);
    }
  }
}

function toggleNotifPanel() {
  const panel = document.getElementById("notif-panel");
  panel.classList.toggle("hidden");
  checkNotifications();
}

// ---- UI NOTIFICATION TOAST ----
function showUINotification(message) {
  let toast = document.getElementById("toast-notif");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast-notif";
    toast.style.cssText = `
      position: fixed; bottom: 1.5rem; right: 1.5rem;
      background: #1e293b; color: #fff;
      padding: 0.9rem 1.4rem; border-radius: 12px;
      font-family: 'DM Sans', sans-serif; font-size: 0.9rem;
      box-shadow: 0 8px 28px rgba(0,0,0,0.25);
      z-index: 9999; max-width: 340px;
      animation: slideUp 0.3s ease;
      border-left: 4px solid #3b82f6;
    `;
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.style.display = "block";
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(() => {
    toast.style.display = "none";
  }, 4000);
}

// ---- UTILITY ----
function daysDiff(dateStr) {
  const today   = new Date(); today.setHours(0,0,0,0);
  const due     = new Date(dateStr);
  return Math.round((due - today) / 86400000);
}

function escape(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ---- INIT: Load demo data if empty ----
(function initDemoData() {
  const patients = getPatients();
  if (patients.length > 0) return; // already has data

  const demoPatients = [
    { id: "demo1", name: "Aarav Sharma",  ageMonths: 0,  parent: "Rajesh Sharma",  contact: "+91 98765 11111", dob: offsetDOB(0),   notes: "", addedAt: new Date().toISOString() },
    { id: "demo2", name: "Priya Patel",   ageMonths: 6,  parent: "Suresh Patel",   contact: "+91 98765 22222", dob: offsetDOB(6),   notes: "Mild allergy to eggs", addedAt: new Date().toISOString() },
    { id: "demo3", name: "Rohan Verma",   ageMonths: 12, parent: "Neha Verma",     contact: "+91 98765 33333", dob: offsetDOB(12),  notes: "", addedAt: new Date().toISOString() },
    { id: "demo4", name: "Sneha Nair",    ageMonths: 24, parent: "Anita Nair",     contact: "+91 98765 44444", dob: offsetDOB(24),  notes: "", addedAt: new Date().toISOString() },
  ];

  savePatients(demoPatients);
  demoPatients.forEach(p => generateScheduleForPatient(p));

  // Mark a few as completed for realism
  const sched = getScheduleData();
  sched.filter(s => s.patientName === "Rohan Verma" && s.ageMonths <= 9)
       .forEach(s => { s.status = "completed"; s.completedAt = "2024-12-01"; });
  sched.filter(s => s.patientName === "Priya Patel" && s.ageMonths <= 3.5)
       .forEach(s => { s.status = "completed"; s.completedAt = "2024-11-15"; });
  saveScheduleData(sched);
})();

function offsetDOB(months) {
  const d = new Date();
  d.setMonth(d.getMonth() - months);
  return d.toISOString().split("T")[0];
}
