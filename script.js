// =========================================================
// 1. VARIABLES & DATA STORAGE
// =========================================================

// Key name used to store data in browser localStorage
const STORAGE_KEY = "nutritionClientManagerData";

// Array that holds all client objects
let clients = loadClients();

// Stores the ID of the client currently opened in the workspace
let activeClientId = null;


// =========================================================
// 2. LOCAL STORAGE (LOAD & SAVE)
// =========================================================

// Reads saved clients from localStorage when the page loads
function loadClients() {
    let savedText = localStorage.getItem(STORAGE_KEY);
    if (savedText == null || savedText === "") {
        return [];
    }
    return JSON.parse(savedText);
}

// Converts clients array to JSON text and saves it in localStorage
function saveClients() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clients));
    renderDashboard();
}


// =========================================================
// 3. SIMPLE HELPER FUNCTIONS
// =========================================================

// Creates a unique ID using the current time in milliseconds
function makeId() {
    return String(Date.now());
}

// Converts user text into safe text so HTML tags cannot execute
function safeText(text) {
    if (!text) {
        return "";
    }
    let div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

// Finds and returns the currently opened client object
function getActiveClient() {
    for (let i = 0; i < clients.length; i++) {
        if (clients[i].id === activeClientId) {
            return clients[i];
        }
    }
    return null;
}


// =========================================================
// 4. DASHBOARD & CLIENT LIST
// =========================================================

// Updates the 3 summary cards and displays matching clients
function renderDashboard() {
    // Update total clients number
    document.getElementById("totalClients").textContent = clients.length;

    // Count total meal plans and upcoming follow-ups using simple loops
    let totalMeals = 0;
    let upcomingFollowups = 0;
    let now = new Date();

    for (let i = 0; i < clients.length; i++) {
        totalMeals = totalMeals + clients[i].meals.length;

        for (let j = 0; j < clients[i].followups.length; j++) {
            let followupDate = new Date(clients[i].followups[j].date);
            if (followupDate >= now) {
                upcomingFollowups = upcomingFollowups + 1;
            }
        }
    }

    document.getElementById("mealPlanCount").textContent = totalMeals;
    document.getElementById("upcomingCount").textContent = upcomingFollowups;

    // Filter clients based on the search box
    let searchText = document.getElementById("searchClients").value.toLowerCase();
    let listBox = document.getElementById("clientList");
    let html = "";
    let matchCount = 0;

    for (let i = 0; i < clients.length; i++) {
        let client = clients[i];
        let fullInfo = (client.name + " " + client.email + " " + client.phone).toLowerCase();

        if (fullInfo.includes(searchText)) {
            matchCount = matchCount + 1;

            let emailText = client.email || "No email";
            let phoneText = client.phone || "No phone";

            html += '<div class="client-row">' +
                '<div>' +
                    '<h3>' + safeText(client.name) + '</h3>' +
                    '<p>' + safeText(emailText) + ' · ' + safeText(phoneText) + '</p>' +
                '</div>' +
                '<div class="client-actions">' +
                    '<button type="button" class="small-btn" onclick="openWorkspace(\'' + client.id + '\')">Open workspace</button>' +
                    '<button type="button" class="small-btn" onclick="deleteClient(\'' + client.id + '\')">Delete</button>' +
                '</div>' +
            '</div>';
        }
    }

    if (matchCount === 0) {
        if (clients.length === 0) {
            listBox.innerHTML = '<p class="empty">No clients yet. Add your first client to get started.</p>';
        } else {
            listBox.innerHTML = '<p class="empty">No matching clients found.</p>';
        }
    } else {
        listBox.innerHTML = html;
    }
}


// =========================================================
// 5. ADD & DELETE CLIENT
// =========================================================

function openAddClientForm() {
    document.getElementById("clientFormPanel").hidden = false;
}

function closeAddClientForm() {
    document.getElementById("clientFormPanel").hidden = true;
}

// Runs when the "Save client" form is submitted
function addClient(event) {
    event.preventDefault(); // Stops the page from refreshing

    let newClient = {
        id: makeId(),
        name: document.getElementById("clientName").value,
        email: document.getElementById("clientEmail").value,
        phone: document.getElementById("clientPhone").value,
        dob: document.getElementById("clientDob").value,
        diet: document.getElementById("clientDiet").value,
        notes: document.getElementById("clientNotes").value,
        consultations: [],
        meals: [],
        goals: [],
        followups: [],
        progress: []
    };

    clients.push(newClient);
    saveClients();

    document.getElementById("clientForm").reset();
    closeAddClientForm();
}

// Deletes a client after user confirmation
function deleteClient(id) {
    if (!confirm("Delete this client and all their records?")) {
        return;
    }

    let updatedList = [];
    for (let i = 0; i < clients.length; i++) {
        if (clients[i].id !== id) {
            updatedList.push(clients[i]);
        }
    }
    clients = updatedList;

    if (activeClientId === id) {
        closeWorkspace();
    }
    saveClients();
}


// =========================================================
// 6. WORKSPACE & TABS
// =========================================================

function openWorkspace(id) {
    activeClientId = id;
    let client = getActiveClient();
    if (client == null) {
        return;
    }

    document.getElementById("workspace").hidden = false;
    document.getElementById("workspaceName").textContent = client.name;

    document.getElementById("profileSummary").innerHTML =
        "<strong>Contact:</strong> " + safeText(client.email || "—") + " · " + safeText(client.phone || "—") + "<br>" +
        "<strong>Date of birth:</strong> " + safeText(client.dob || "—") + "<br>" +
        "<strong>Diet / allergies:</strong> " + safeText(client.diet || "Not provided") + "<br>" +
        "<strong>Profile notes:</strong> " + safeText(client.notes || "None");

    renderAllRecords();
    switchTab("consultation");
}

function closeWorkspace() {
    document.getElementById("workspace").hidden = true;
    activeClientId = null;
}

// Shows the selected tab and hides the other 5 tabs
function switchTab(tabName) {
    let tabNames = ["consultation", "meal", "goal", "followup", "progress", "history"];

    for (let i = 0; i < tabNames.length; i++) {
        let name = tabNames[i];
        let btn = document.getElementById("tabBtn-" + name);
        let box = document.getElementById(name + "Tab");

        if (name === tabName) {
            btn.classList.add("active");
            box.hidden = false;
        } else {
            btn.classList.remove("active");
            box.hidden = true;
        }
    }
}


// =========================================================
// 7. ADDING RECORDS TO THE ACTIVE CLIENT
// =========================================================

function addConsultation(event) {
    event.preventDefault();
    let client = getActiveClient();
    if (client == null) return;

    client.consultations.push({
        id: makeId(),
        date: document.getElementById("consultDate").value,
        type: document.getElementById("consultType").value,
        details: document.getElementById("consultDetails").value
    });

    saveClients();
    renderAllRecords();
    document.getElementById("consultationForm").reset();
}

function addMealPlan(event) {
    event.preventDefault();
    let client = getActiveClient();
    if (client == null) return;

    client.meals.push({
        id: makeId(),
        name: document.getElementById("mealName").value,
        date: document.getElementById("mealDate").value,
        breakfast: document.getElementById("mealBreakfast").value,
        lunch: document.getElementById("mealLunch").value,
        dinner: document.getElementById("mealDinner").value,
        snacks: document.getElementById("mealSnacks").value
    });

    saveClients();
    renderAllRecords();
    document.getElementById("mealForm").reset();
}

function addGoal(event) {
    event.preventDefault();
    let client = getActiveClient();
    if (client == null) return;

    client.goals.push({
        id: makeId(),
        title: document.getElementById("goalTitle").value,
        target: document.getElementById("goalTarget").value,
        status: document.getElementById("goalStatus").value,
        details: document.getElementById("goalDetails").value
    });

    saveClients();
    renderAllRecords();
    document.getElementById("goalForm").reset();
}

function addFollowup(event) {
    event.preventDefault();
    let client = getActiveClient();
    if (client == null) return;

    client.followups.push({
        id: makeId(),
        date: document.getElementById("followupDate").value,
        purpose: document.getElementById("followupPurpose").value
    });

    saveClients();
    renderAllRecords();
    document.getElementById("followupForm").reset();
}

function addProgress(event) {
    event.preventDefault();
    let client = getActiveClient();
    if (client == null) return;

    client.progress.push({
        id: makeId(),
        date: document.getElementById("progressDate").value,
        topic: document.getElementById("progressTopic").value,
        details: document.getElementById("progressDetails").value
    });

    saveClients();
    renderAllRecords();
    document.getElementById("progressForm").reset();
}


// =========================================================
// 8. DISPLAYING & DELETING RECORDS
// =========================================================

// Helper to create HTML for one record card
function createRecordHTML(title, date, body, type, recordId) {
    return '<div class="record">' +
        '<div class="record-top">' +
            '<h4>' + safeText(title) + '</h4>' +
            '<small>' + safeText(date || "Date not set") + '</small>' +
        '</div>' +
        '<p>' + safeText(body || "No additional details") + '</p>' +
        '<button type="button" class="small-btn" onclick="deleteRecord(\'' + type + '\', \'' + recordId + '\')">Delete record</button>' +
    '</div>';
}

function renderAllRecords() {
    let client = getActiveClient();
    if (client == null) return;

    // 1. Consultations
    let consultBox = document.getElementById("consultationRecords");
    if (client.consultations.length === 0) {
        consultBox.innerHTML = '<p class="empty">No records added yet.</p>';
    } else {
        let html = "";
        for (let i = client.consultations.length - 1; i >= 0; i--) {
            let item = client.consultations[i];
            html += createRecordHTML(item.type || "Consultation", item.date, item.details, "consultations", item.id);
        }
        consultBox.innerHTML = html;
    }

    // 2. Meal plans
    let mealBox = document.getElementById("mealRecords");
    if (client.meals.length === 0) {
        mealBox.innerHTML = '<p class="empty">No records added yet.</p>';
    } else {
        let html = "";
        for (let i = client.meals.length - 1; i >= 0; i--) {
            let item = client.meals[i];
            let mealText =
                "Breakfast: " + (item.breakfast || "—") + "\n" +
                "Lunch: " + (item.lunch || "—") + "\n" +
                "Dinner: " + (item.dinner || "—") + "\n" +
                "Snacks / notes: " + (item.snacks || "—");
            html += createRecordHTML(item.name, item.date, mealText, "meals", item.id);
        }
        mealBox.innerHTML = html;
    }

    // 3. Goals
    let goalBox = document.getElementById("goalRecords");
    if (client.goals.length === 0) {
        goalBox.innerHTML = '<p class="empty">No records added yet.</p>';
    } else {
        let html = "";
        for (let i = client.goals.length - 1; i >= 0; i--) {
            let item = client.goals[i];
            html += createRecordHTML(item.title + " · " + item.status, item.target, item.details, "goals", item.id);
        }
        goalBox.innerHTML = html;
    }

    // 4. Follow-ups
    let followupBox = document.getElementById("followupRecords");
    if (client.followups.length === 0) {
        followupBox.innerHTML = '<p class="empty">No records added yet.</p>';
    } else {
        let html = "";
        for (let i = client.followups.length - 1; i >= 0; i--) {
            let item = client.followups[i];
            html += createRecordHTML(item.purpose || "Follow-up", item.date, "Scheduled follow-up", "followups", item.id);
        }
        followupBox.innerHTML = html;
    }

    // 5. Progress notes
    let progressBox = document.getElementById("progressRecords");
    if (client.progress.length === 0) {
        progressBox.innerHTML = '<p class="empty">No records added yet.</p>';
    } else {
        let html = "";
        for (let i = client.progress.length - 1; i >= 0; i--) {
            let item = client.progress[i];
            html += createRecordHTML(item.topic || "Progress note", item.date, item.details, "progress", item.id);
        }
        progressBox.innerHTML = html;
    }

    // 6. Combined History
    renderHistory(client);
}

// Combines all 5 record types and displays them newest-first
function renderHistory(client) {
    let history = [];

    for (let i = 0; i < client.consultations.length; i++) {
        history.push({ kind: "Consultation", date: client.consultations[i].date, summary: client.consultations[i].details });
    }
    for (let i = 0; i < client.meals.length; i++) {
        history.push({ kind: "Meal plan", date: client.meals[i].date, summary: client.meals[i].name });
    }
    for (let i = 0; i < client.goals.length; i++) {
        history.push({ kind: "Goal", date: client.goals[i].target, summary: client.goals[i].title + " (" + client.goals[i].status + ")" });
    }
    for (let i = 0; i < client.followups.length; i++) {
        history.push({ kind: "Follow-up", date: client.followups[i].date, summary: client.followups[i].purpose });
    }
    for (let i = 0; i < client.progress.length; i++) {
        history.push({ kind: "Progress note", date: client.progress[i].date, summary: client.progress[i].details });
    }

    // Sort newest date first
    history.sort(function (a, b) {
        let dateA = new Date(a.date || 0);
        let dateB = new Date(b.date || 0);
        return dateB - dateA;
    });

    let historyBox = document.getElementById("historyRecords");
    if (history.length === 0) {
        historyBox.innerHTML = '<p class="empty">No client history yet.</p>';
        return;
    }

    let html = "";
    for (let i = 0; i < history.length; i++) {
        let item = history[i];
        html += '<div class="record">' +
            '<div class="record-top">' +
                '<h4>' + safeText(item.kind) + ': ' + safeText(item.summary || "") + '</h4>' +
                '<small>' + safeText(item.date || "Date not set") + '</small>' +
            '</div>' +
        '</div>';
    }
    historyBox.innerHTML = html;
}

// Deletes a single record from the active client
function deleteRecord(type, recordId) {
    if (!confirm("Delete this record?")) {
        return;
    }
    let client = getActiveClient();
    if (client == null) return;

    let updatedRecords = [];
    let currentList = client[type];

    for (let i = 0; i < currentList.length; i++) {
        if (currentList[i].id !== recordId) {
            updatedRecords.push(currentList[i]);
        }
    }

    client[type] = updatedRecords;
    saveClients();
    renderAllRecords();
}


// =========================================================
// 9. RUN ON PAGE LOAD
// =========================================================
renderDashboard();
