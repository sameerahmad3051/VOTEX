/* =========================================================
   VOTESECURE - APP.JS
   Frontend ↔ Flask Backend
   ========================================================= */

const API_URL = "http://127.0.0.1:5000";

let ELECTION_ID = null;
let selectedCandidateId = null;
let candidates = [];
let currentElection = null;


/* =========================================================
   AUTH HELPERS
   ========================================================= */

function getToken() {
    return localStorage.getItem("accessToken");
}

function isLoggedIn() {
    return !!getToken();
}

function getUserName() {
    return localStorage.getItem("userName") || "Voter";
}

function getUserEmail() {
    return localStorage.getItem("userEmail") || "";
}

function getDepartment() {
    return localStorage.getItem("department") || "";
}

function getAuthHeaders() {
    const token = getToken();

    return {
        "Content-Type": "application/json",
        ...(token ? { "Authorization": `Bearer ${token}` } : {})
    };
}


/* =========================================================
   PAGE PROTECTION
   ========================================================= */

function requireLogin() {
    if (!isLoggedIn()) {
        window.location.href = "login.html";
        return false;
    }

    return true;
}

function protectPage() {
    const protectedPages = [
        "index.html",
        "vote.html",
        "results.html",
        "profile.html",
        "admin.html"
    ];

    const currentPage = window.location.pathname
        .split("/")
        .pop()
        .toLowerCase();

    if (protectedPages.includes(currentPage) && !isLoggedIn()) {
        window.location.href = "login.html";
        return false;
    }

    return true;
}


/* =========================================================
   API HELPER
   ========================================================= */

async function apiFetch(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers: {
                ...getAuthHeaders(),
                ...(options.headers || {})
            }
        });

        let data = {};

        try {
            data = await response.json();
        } catch {
            data = {};
        }

        if (response.status === 401) {
            const message = String(data.message || data.msg || "").toLowerCase();

            if (
                message.includes("token") ||
                message.includes("expired") ||
                message.includes("authorization")
            ) {
                localStorage.removeItem("accessToken");
                localStorage.removeItem("loggedIn");
                window.location.href = "login.html";
                return null;
            }
        }

        if (!response.ok) {
            throw new Error(
                data.message ||
                data.msg ||
                `Request failed with status ${response.status}`
            );
        }

        return data;

    } catch (error) {
        console.error(`API Error: ${endpoint}`, error);
        throw error;
    }
}


/* =========================================================
   INITIALIZATION
   ========================================================= */

document.addEventListener("DOMContentLoaded", async () => {

    protectPage();

    setupMobileMenu();
    setupSearch();
    setupActiveMenu();
    setupAnimations();

    updateUserName();
    updateCurrentDate();

    const page = getCurrentPage();

    try {

        if (page === "index.html" || page === "") {
            await loadDashboard();
        }

        else if (page === "vote.html") {
            await loadVoteCandidates();
        }

        else if (page === "results.html") {
            await loadResults();
        }

        else if (page === "profile.html") {
            await loadProfile();
        }

        else if (page === "admin.html") {
            /*
             * admin.html has its own dashboard logic.
             * Do not interfere with it here.
             */
        }

    } catch (error) {
        console.error("Page initialization error:", error);
    }
});


function getCurrentPage() {
    let page = window.location.pathname.split("/").pop().toLowerCase();

    if (!page) {
        page = "index.html";
    }

    return page;
}


/* =========================================================
   USER INFORMATION
   ========================================================= */

function updateUserName() {

    const name = getUserName();

    const topbarName = document.getElementById("topbarUserName");
    const welcomeName = document.getElementById("welcomeUserName");

    if (topbarName) {
        topbarName.textContent = name;
    }

    if (welcomeName) {
        const firstName = name.split(" ")[0];
        welcomeName.textContent = firstName;
    }
}


async function loadCurrentUser() {

    if (!isLoggedIn()) {
        return null;
    }

    try {

        const data = await apiFetch("/api/auth/me");

        if (!data) {
            return null;
        }

        const user = data.user || data;

        if (user.name) {
            localStorage.setItem("userName", user.name);
        }

        if (user.email) {
            localStorage.setItem("userEmail", user.email);
        }

        if (user.department) {
            localStorage.setItem("department", user.department);
        }

        if (typeof user.is_admin !== "undefined") {
            localStorage.setItem(
                "isAdmin",
                user.is_admin ? "true" : "false"
            );
        }

        updateUserName();

        return user;

    } catch (error) {

        console.error("Unable to load current user:", error);
        return null;
    }
}


/* =========================================================
   DATE
   ========================================================= */

function updateCurrentDate() {

    const element = document.getElementById("currentDate");

    if (!element) {
        return;
    }

    const now = new Date();

    element.textContent = now.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric"
    });
}


/* =========================================================
   ELECTION API
   ========================================================= */

async function getElections() {

    const data = await apiFetch("/api/elections/");

    if (!data) {
        return [];
    }

    return data.elections || [];
}


async function getElection(electionId) {

    const data = await apiFetch(
        `/api/elections/${electionId}`
    );

    if (!data) {
        return null;
    }

    return data.election || data;
}


async function getCandidates(electionId) {

    const data = await apiFetch(
        `/api/elections/${electionId}/candidates`
    );

    if (!data) {
        return [];
    }

    return data.candidates || [];
}


/* =========================================================
   FIND ELECTIONS
   ========================================================= */

function findActiveElection(elections) {

    if (!Array.isArray(elections)) {
        return null;
    }

    return elections.find(
        election =>
            String(election.status).toLowerCase() === "active"
    ) || null;
}


function findUpcomingElections(elections) {

    if (!Array.isArray(elections)) {
        return [];
    }

    return elections.filter(
        election =>
            String(election.status).toLowerCase() === "upcoming"
    );
}


/* =========================================================
   DASHBOARD
   ========================================================= */

async function loadDashboard() {

    console.log("Loading VoteSecure dashboard...");

    try {

        await loadCurrentUser();

        const elections = await getElections();

        console.log("Dashboard elections:", elections);

        renderElectionStats(elections);
        renderElections(elections);

        const activeElection = findActiveElection(elections);

        if (activeElection) {

            currentElection = activeElection;
            ELECTION_ID = activeElection.id;

            localStorage.setItem(
                "currentElectionId",
                activeElection.id
            );

            localStorage.setItem(
                "currentElectionTitle",
                activeElection.title
            );

            await loadQuickVote(activeElection);

        } else {

            renderEmptyQuickVote();
        }

        await loadVoteCount(elections);

    } catch (error) {

        console.error("Dashboard loading failed:", error);

        const list = document.getElementById("electionsList");

        if (list) {

            list.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-triangle-exclamation"></i>
                    <h3>Unable to load elections</h3>
                    <p>Please make sure the Flask backend is running.</p>
                </div>
            `;
        }
    }
}


/* =========================================================
   DASHBOARD STATS
   ========================================================= */

function renderElectionStats(elections) {

    const totalElement =
        document.getElementById("totalElections");

    const activeElement =
        document.getElementById("activeElections");

    if (totalElement) {
        totalElement.textContent =
            String(elections.length).padStart(2, "0");
    }

    if (activeElement) {

        const activeCount = elections.filter(
            election =>
                String(election.status).toLowerCase() === "active"
        ).length;

        activeElement.textContent =
            String(activeCount).padStart(2, "0");
    }
}


/* =========================================================
   RENDER CURRENT ELECTIONS
   ========================================================= */

function renderElections(elections) {

    const container =
        document.getElementById("electionsList");

    if (!container) {
        return;
    }

    if (!elections.length) {

        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-calendar-xmark"></i>
                <h3>No elections available</h3>
                <p>There are currently no elections available.</p>
            </div>
        `;

        return;
    }

    container.innerHTML = elections.map(election => {

        const status =
            String(election.status || "upcoming").toLowerCase();

        const statusClass =
            status === "active"
                ? "active"
                : status === "ended"
                    ? "ended"
                    : "upcoming";

        const statusText =
            status.charAt(0).toUpperCase() +
            status.slice(1);

        const dateText = getElectionDateText(election);

        return `
            <div class="election-item"
                 data-election-id="${escapeHTML(election.id)}">

                <div class="election-icon">
                    <i class="fas fa-vote-yea"></i>
                </div>

                <div class="election-info">
                    <h3>${escapeHTML(election.title || "Untitled Election")}</h3>

                    <p>
                        ${escapeHTML(
                            election.description ||
                            "Online voting election"
                        )}
                    </p>

                    <span class="election-date">
                        <i class="far fa-calendar"></i>
                        ${escapeHTML(dateText)}
                    </span>
                </div>

                <div class="election-meta">

                    <span class="election-status ${statusClass}">
                        <span class="status-dot"></span>
                        ${escapeHTML(statusText)}
                    </span>

                    <button
                        class="btn btn-primary"
                        onclick="openElection(${Number(election.id)})">
                        ${
                            status === "active"
                                ? "Vote Now"
                                : "View Election"
                        }
                    </button>

                </div>

            </div>
        `;

    }).join("");
}


/* =========================================================
   ELECTION DATE
   ========================================================= */

function getElectionDateText(election) {

    if (!election) {
        return "";
    }

    if (election.status === "active") {

        if (election.end_date) {
            return `Ends on ${formatDate(election.end_date)}`;
        }

        return "Currently active";
    }

    if (election.status === "upcoming") {

        if (election.start_date) {
            return `Starts on ${formatDate(election.start_date)}`;
        }

        return "Upcoming";
    }

    if (election.end_date) {
        return `Ended on ${formatDate(election.end_date)}`;
    }

    return "Election";
}


/* =========================================================
   OPEN ELECTION
   ========================================================= */

function openElection(electionId) {

    if (!electionId) {
        showNotification(
            "Invalid election.",
            "error"
        );
        return;
    }

    localStorage.setItem(
        "currentElectionId",
        electionId
    );

    window.location.href =
        `vote.html?election_id=${encodeURIComponent(electionId)}`;
}


/* =========================================================
   CAST YOUR VOTE BUTTON
   ========================================================= */

async function goToVote() {

    if (!requireLogin()) {
        return;
    }

    try {

        const elections = await getElections();

        const activeElection =
            findActiveElection(elections);

        if (!activeElection) {

            showNotification(
                "There is no active election right now.",
                "warning"
            );

            return;
        }

        localStorage.setItem(
            "currentElectionId",
            activeElection.id
        );

        localStorage.setItem(
            "currentElectionTitle",
            activeElection.title
        );

        window.location.href =
            `vote.html?election_id=${activeElection.id}`;

    } catch (error) {

        console.error(error);

        showNotification(
            "Unable to load elections.",
            "error"
        );
    }
}


/* =========================================================
   QUICK VOTE
   ========================================================= */

async function loadQuickVote(election) {

    const titleElement =
        document.getElementById("quickVoteElectionTitle");

    const candidateContainer =
        document.getElementById("quickVoteCandidateList");

    if (titleElement) {
        titleElement.textContent =
            election.title || "Current Election";
    }

    if (!candidateContainer) {
        return;
    }

    try {

        const electionCandidates =
            await getCandidates(election.id);

        candidates = electionCandidates;

        if (!electionCandidates.length) {

            candidateContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-user-slash"></i>
                    <h3>No candidates yet</h3>
                    <p>The administrator has not added candidates.</p>
                </div>
            `;

            return;
        }

        candidateContainer.innerHTML =
            electionCandidates.map(candidate => `
                <div class="quick-vote-item">

                    <img
                        src="${escapeHTML(
                            candidate.avatar ||
                            "https://i.pravatar.cc/100?img=12"
                        )}"
                        alt="${escapeHTML(candidate.name)}"
                        class="candidate-avatar"
                    >

                    <div class="candidate-info">
                        <strong>
                            ${escapeHTML(candidate.name)}
                        </strong>

                        <span>
                            ${escapeHTML(
                                candidate.department || ""
                            )}
                        </span>
                    </div>

                </div>
            `).join("");

    } catch (error) {

        console.error(
            "Quick vote candidates failed:",
            error
        );

        candidateContainer.innerHTML = `
            <div class="empty-state">
                <p>Unable to load candidates.</p>
            </div>
        `;
    }
}


function renderEmptyQuickVote() {

    const titleElement =
        document.getElementById("quickVoteElectionTitle");

    const candidateContainer =
        document.getElementById("quickVoteCandidateList");

    if (titleElement) {
        titleElement.textContent =
            "No Active Election";
    }

    if (candidateContainer) {

        candidateContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-calendar-xmark"></i>
                <h3>No active election</h3>
                <p>There is currently no election available for voting.</p>
            </div>
        `;
    }
}


/* =========================================================
   VOTE COUNT
   ========================================================= */

async function loadVoteCount(elections) {

    const voteCountElement =
        document.getElementById("voteCount");

    if (!voteCountElement) {
        return;
    }

    let votedCount = 0;

    for (const election of elections) {

        try {

            const data = await apiFetch(
                `/api/votes/my/${election.id}`
            );

            if (data && data.has_voted) {
                votedCount++;
            }

        } catch (error) {

            /*
             * Don't stop dashboard loading if one
             * vote-status request fails.
             */
            console.warn(
                `Could not check vote for election ${election.id}`,
                error
            );
        }
    }

    voteCountElement.textContent =
        String(votedCount).padStart(2, "0");
}


/* =========================================================
   VOTE PAGE
   ========================================================= */

async function loadVoteCandidates() {

    if (!requireLogin()) {
        return;
    }

    try {

        let electionId =
            getElectionIdFromURL();

        if (!electionId) {
            electionId =
                localStorage.getItem("currentElectionId");
        }

        if (!electionId) {

            const elections =
                await getElections();

            const activeElection =
                findActiveElection(elections);

            if (activeElection) {
                electionId = activeElection.id;
            }
        }

        if (!electionId) {

            showVoteError(
                "No election was selected."
            );

            return;
        }

        ELECTION_ID = Number(electionId);

        localStorage.setItem(
            "currentElectionId",
            ELECTION_ID
        );

        const election =
            await getElection(ELECTION_ID);

        if (!election) {

            showVoteError(
                "Election not found."
            );

            return;
        }

        currentElection = election;

        updateVoteElectionInfo(election);

        candidates =
            await getCandidates(ELECTION_ID);

        renderCandidates(candidates);

        await checkExistingVote();

    } catch (error) {

        console.error(
            "Vote page loading failed:",
            error
        );

        showVoteError(
            error.message ||
            "Unable to connect to backend."
        );
    }
}


/* =========================================================
   VOTE ELECTION INFO
   ========================================================= */

function updateVoteElectionInfo(election) {

    const topTitle =
        document.getElementById("electionTopTitle");

    const title =
        document.getElementById("electionTitle");

    const status =
        document.getElementById("electionStatus");

    const statusText =
        document.getElementById("electionStatusText");

    const endDate =
        document.getElementById("electionEndDate");

    const candidateCount =
        document.getElementById("candidateCount");

    if (topTitle) {
        topTitle.textContent =
            election.title || "Election";
    }

    if (title) {
        title.textContent =
            election.title || "Election";
    }

    if (status) {

        status.textContent =
            election.status || "Unknown";

        status.className =
            `vote-status ${
                election.status === "active"
                    ? "active"
                    : ""
            }`;
    }

    if (statusText) {

        statusText.textContent =
            election.status === "active"
                ? "Active"
                : election.status || "Unknown";
    }

    if (endDate) {

        endDate.textContent =
            election.end_date
                ? formatDate(election.end_date)
                : "—";
    }

    if (candidateCount) {
        candidateCount.textContent =
            candidates.length;
    }
}


/* =========================================================
   RENDER VOTE CANDIDATES
   ========================================================= */

function renderCandidates(candidateList) {

    const container =
        document.getElementById("candidateList");

    if (!container) {
        return;
    }

    if (!candidateList.length) {

        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-users-slash"></i>
                <h3>No candidates available</h3>
                <p>Please check back later.</p>
            </div>
        `;

        return;
    }

    container.innerHTML =
        candidateList.map(candidate => `
            <div
                class="candidate"
                data-candidate-id="${Number(candidate.id)}"
                onclick="selectCandidate(${Number(candidate.id)})">

                <img
                    src="${escapeHTML(
                        candidate.avatar ||
                        "https://i.pravatar.cc/150?img=12"
                    )}"
                    alt="${escapeHTML(candidate.name)}"
                    class="candidate-avatar"
                >

                <div class="candidate-details">

                    <h3>
                        ${escapeHTML(candidate.name)}
                    </h3>

                    <span class="candidate-department">
                        ${escapeHTML(
                            candidate.department || ""
                        )}
                    </span>

                    <p>
                        ${escapeHTML(
                            candidate.description || ""
                        )}
                    </p>

                </div>

                <div class="candidate-select">
                    <span class="radio-circle"></span>
                </div>

            </div>
        `).join("");
}


/* =========================================================
   SELECT CANDIDATE
   ========================================================= */

function selectCandidate(candidateId) {

    if (!candidateId) {
        return;
    }

    const alreadySubmitted =
        localStorage.getItem(
            `voteSubmitted_${getUserId()}_${ELECTION_ID}`
        ) === "true";

    if (alreadySubmitted) {
        return;
    }

    selectedCandidateId =
        Number(candidateId);

    document.querySelectorAll(".candidate")
        .forEach(candidate => {

            const id =
                Number(
                    candidate.dataset.candidateId
                );

            candidate.classList.toggle(
                "selected",
                id === selectedCandidateId
            );
        });

    const submitButton =
        document.getElementById("submitVoteButton");

    if (submitButton) {

        submitButton.disabled = false;

        submitButton.textContent =
            "Submit Vote";
    }

    const selected =
        candidates.find(
            candidate =>
                Number(candidate.id) ===
                selectedCandidateId
        );

    if (selected) {

        console.log(
            "Selected candidate:",
            selected.name
        );
    }
}


/* =========================================================
   CHECK EXISTING VOTE
   ========================================================= */

async function checkExistingVote() {

    if (!ELECTION_ID || !isLoggedIn()) {
        return;
    }

    try {

        const data =
            await apiFetch(
                `/api/votes/my/${ELECTION_ID}`
            );

        if (data && data.has_voted) {

            markVoteAsSubmitted(
                data.vote
                    ? data.vote.candidate_id
                    : null
            );

        } else {

            updateVotingStatus(
                "Not yet voted"
            );
        }

    } catch (error) {

        console.error(
            "Checking existing vote failed:",
            error
        );
    }
}


/* =========================================================
   SUBMIT VOTE
   ========================================================= */

async function submitVote() {

    if (!requireLogin()) {
        return;
    }

    if (!ELECTION_ID) {

        showNotification(
            "No election selected.",
            "error"
        );

        return;
    }

    if (!selectedCandidateId) {

        showNotification(
            "Please select a candidate first.",
            "warning"
        );

        return;
    }

    const candidate =
        candidates.find(
            c =>
                Number(c.id) ===
                Number(selectedCandidateId)
        );

    if (!candidate) {

        showNotification(
            "Selected candidate was not found.",
            "error"
        );

        return;
    }

    const confirmed = confirm(
        `Are you sure you want to vote for ${candidate.name}?`
    );

    if (!confirmed) {
        return;
    }

    const button =
        document.getElementById("submitVoteButton");

    if (button) {

        button.disabled = true;
        button.textContent =
            "Submitting...";
    }

    try {

        const data = await apiFetch(
            "/api/votes/",
            {
                method: "POST",
                body: JSON.stringify({
                    election_id: ELECTION_ID,
                    candidate_id: selectedCandidateId
                })
            }
        );

        if (!data) {
            return;
        }

        console.log(
            "Vote submitted:",
            data
        );

        /*
         * Store vote state per USER + ELECTION.
         * This prevents one account from affecting
         * another account on the same browser.
         */

        const voteKey =
            `voteSubmitted_${getUserId()}_${ELECTION_ID}`;

        localStorage.setItem(
            voteKey,
            "true"
        );

        localStorage.setItem(
            "lastVote",
            JSON.stringify({
                election_id: ELECTION_ID,
                candidate_id: selectedCandidateId,
                candidate_name: candidate.name
            })
        );

        markVoteAsSubmitted(
            selectedCandidateId
        );

        showNotification(
            "Your vote was submitted successfully!",
            "success"
        );

    } catch (error) {

        console.error(
            "Vote submission failed:",
            error
        );

        if (
            error.message &&
            error.message.toLowerCase().includes(
                "already voted"
            )
        ) {

            markVoteAsSubmitted(
                selectedCandidateId
            );

            showNotification(
                "You have already voted in this election.",
                "warning"
            );

        } else {

            if (button) {
                button.disabled = false;
                button.textContent = "Submit Vote";
            }

            showNotification(
                error.message ||
                "Vote submission failed.",
                "error"
            );
        }
    }
}


/* =========================================================
   MARK VOTE SUBMITTED
   ========================================================= */

function markVoteAsSubmitted(candidateId) {

    document.querySelectorAll(".candidate")
        .forEach(candidate => {

            const id =
                Number(
                    candidate.dataset.candidateId
                );

            candidate.classList.remove(
                "selected"
            );

            if (
                candidateId &&
                id === Number(candidateId)
            ) {

                candidate.classList.add(
                    "selected"
                );
            }

            candidate.style.pointerEvents =
                "none";
        });

    const button =
        document.getElementById("submitVoteButton");

    if (button) {

        button.disabled = true;

        button.textContent =
            "Vote Already Submitted";
    }

    updateVotingStatus(
        "Vote submitted"
    );
}


function updateVotingStatus(statusText) {

    const element =
        document.getElementById("votingStatus");

    if (element) {
        element.textContent =
            statusText;
    }
}


/* =========================================================
   RESULTS
   ========================================================= */

async function loadResults() {

    if (!requireLogin()) {
        return;
    }

    try {

        let electionId =
            getElectionIdFromURL();

        if (!electionId) {
            electionId =
                localStorage.getItem(
                    "currentElectionId"
                );
        }

        if (!electionId) {

            const elections =
                await getElections();

            const active =
                findActiveElection(elections);

            if (active) {
                electionId = active.id;
            }
        }

        if (!electionId) {
            return;
        }

        const data =
            await apiFetch(
                `/api/votes/results/${electionId}`
            );

        if (!data) {
            return;
        }

        renderResults(data);

    } catch (error) {

        console.error(
            "Results loading failed:",
            error
        );

        showNotification(
            "Unable to load results.",
            "error"
        );
    }
}


/* =========================================================
   RENDER RESULTS
   ========================================================= */

function renderResults(data) {

    const results =
        data.results || [];

    /*
     * These selectors cover the current results page.
     * If an element exists, update it.
     */

    const title =
        document.getElementById("resultElectionTitle");

    if (title) {
        title.textContent =
            data.election_title || "Election Results";
    }

    const totalVotes =
        document.getElementById("totalVotes");

    if (totalVotes) {
        totalVotes.textContent =
            data.total_votes || 0;
    }

    const candidateCount =
        document.getElementById("resultCandidateCount");

    if (candidateCount) {
        candidateCount.textContent =
            results.length;
    }

    const resultContainer =
        document.getElementById("resultsList") ||
        document.getElementById("resultList");

    if (!resultContainer) {
        return;
    }

    if (!results.length) {

        resultContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-chart-column"></i>
                <h3>No votes yet</h3>
                <p>Results will appear after votes are submitted.</p>
            </div>
        `;

        return;
    }

    resultContainer.innerHTML =
        results.map(result => `
            <div class="result-row">

                <div class="result-candidate">

                    <img
                        src="${escapeHTML(
                            result.avatar ||
                            "https://i.pravatar.cc/100?img=12"
                        )}"
                        alt="${escapeHTML(
                            result.candidate_name
                        )}"
                    >

                    <div>
                        <strong>
                            ${escapeHTML(
                                result.candidate_name
                            )}
                        </strong>

                        <span>
                            ${escapeHTML(
                                result.department || ""
                            )}
                        </span>
                    </div>

                </div>

                <div class="result-votes">
                    <strong>
                        ${Number(result.votes || 0)}
                    </strong>

                    <span>
                        ${Number(
                            result.percentage || 0
                        )}%
                    </span>
                </div>

                <div class="result-progress">
                    <div
                        class="result-progress-bar"
                        style="width:${Number(
                            result.percentage || 0
                        )}%">
                    </div>
                </div>

            </div>
        `).join("");
}


/* =========================================================
   PROFILE
   ========================================================= */

async function loadProfile() {

    if (!requireLogin()) {
        return;
    }

    try {

        const user =
            await loadCurrentUser();

        if (!user) {
            return;
        }

        const name =
            document.getElementById("profileName");

        const email =
            document.getElementById("profileEmail");

        const department =
            document.getElementById("profileDepartment");

        if (name) {
            name.textContent =
                user.name || "Voter";
        }

        if (email) {
            email.textContent =
                user.email || "";
        }

        if (department) {
            department.textContent =
                user.department || "Not specified";
        }

        fillElement(
            "profileUserName",
            user.name
        );

        fillElement(
            "profileUserEmail",
            user.email
        );

        fillElement(
            "profileUserDepartment",
            user.department
        );

    } catch (error) {

        console.error(
            "Profile loading failed:",
            error
        );
    }
}


function fillElement(id, value) {

    const element =
        document.getElementById(id);

    if (element) {
        element.textContent =
            value || "—";
    }
}


/* =========================================================
   ELECTION ID FROM URL
   ========================================================= */

function getElectionIdFromURL() {

    const params =
        new URLSearchParams(
            window.location.search
        );

    const id =
        params.get("election_id");

    return id ? Number(id) : null;
}


/* =========================================================
   LOGOUT
   ========================================================= */

function logout() {

    localStorage.removeItem("accessToken");
    localStorage.removeItem("loggedIn");

    localStorage.removeItem("userId");
    localStorage.removeItem("userName");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("department");
    localStorage.removeItem("isAdmin");

    localStorage.removeItem("currentElectionId");
    localStorage.removeItem("currentElectionTitle");
    localStorage.removeItem("lastVote");

    /*
     * Remove old global voting flag if it exists.
     * Voting state is now stored per user + election.
     */
    localStorage.removeItem("voteSubmitted");

    window.location.href = "login.html";
}


/* =========================================================
   USER ID
   ========================================================= */

function getUserId() {
    return localStorage.getItem("userId") || "unknown";
}


/* =========================================================
   MOBILE MENU
   ========================================================= */

function setupMobileMenu() {

    const button =
        document.getElementById("mobileMenuBtn");

    const sidebar =
        document.querySelector(".sidebar");

    if (!button || !sidebar) {
        return;
    }

    button.addEventListener(
        "click",
        () => {

            sidebar.classList.toggle(
                "open"
            );
        }
    );
}


/* =========================================================
   SEARCH
   ========================================================= */

function setupSearch() {

    const searchInput =
        document.getElementById("searchInput");

    if (!searchInput) {
        return;
    }

    searchInput.addEventListener(
        "input",
        () => {

            const query =
                searchInput.value
                    .trim()
                    .toLowerCase();

            document.querySelectorAll(
                ".election-item"
            ).forEach(item => {

                const text =
                    item.textContent
                        .toLowerCase();

                item.style.display =
                    !query ||
                    text.includes(query)
                        ? ""
                        : "none";
            });
        }
    );
}


/* =========================================================
   ACTIVE SIDEBAR MENU
   ========================================================= */

function setupActiveMenu() {

    const currentPage =
        getCurrentPage();

    document.querySelectorAll(
        ".sidebar a"
    ).forEach(link => {

        const href =
            link.getAttribute("href");

        if (!href) {
            return;
        }

        const cleanHref =
            href.split("#")[0]
                .split("?")[0];

        if (
            cleanHref &&
            cleanHref.toLowerCase() ===
            currentPage
        ) {

            link.classList.add(
                "active"
            );
        }
    });
}


/* =========================================================
   ANIMATIONS
   ========================================================= */

function setupAnimations() {

    if (
        typeof IntersectionObserver ===
        "undefined"
    ) {
        return;
    }

    const observer =
        new IntersectionObserver(
            entries => {

                entries.forEach(entry => {

                    if (
                        entry.isIntersecting
                    ) {

                        entry.target.classList.add(
                            "visible"
                        );

                        observer.unobserve(
                            entry.target
                        );
                    }
                });
            },
            {
                threshold: 0.1
            }
        );

    document
        .querySelectorAll(
            ".card, .election-item, .candidate, .result-row"
        )
        .forEach(element => {

            observer.observe(element);
        });
}


/* =========================================================
   NOTIFICATIONS
   ========================================================= */

function showNotification(
    message,
    type = "info"
) {

    let container =
        document.getElementById(
            "notificationContainer"
        );

    if (!container) {

        container =
            document.createElement("div");

        container.id =
            "notificationContainer";

        document.body.appendChild(
            container
        );
    }

    const notification =
        document.createElement("div");

    notification.className =
        `notification notification-${type}`;

    notification.innerHTML = `
        <span class="notification-message">
            ${escapeHTML(message)}
        </span>

        <button
            class="notification-close"
            aria-label="Close">
            &times;
        </button>
    `;

    container.appendChild(
        notification
    );

    const closeButton =
        notification.querySelector(
            ".notification-close"
        );

    if (closeButton) {

        closeButton.addEventListener(
            "click",
            () => notification.remove()
        );
    }

    setTimeout(() => {

        if (
            notification &&
            notification.parentNode
        ) {
            notification.remove();
        }

    }, 4500);
}


/* =========================================================
   VOTE ERROR
   ========================================================= */

function showVoteError(message) {

    const container =
        document.getElementById(
            "candidateList"
        );

    if (!container) {
        return;
    }

    container.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-circle-exclamation"></i>

            <h3>
                ${escapeHTML(message)}
            </h3>

            <p>
                Please check your connection
                and try again.
            </p>
        </div>
    `;
}


/* =========================================================
   DATE FORMATTER
   ========================================================= */

function formatDate(dateValue) {

    if (!dateValue) {
        return "—";
    }

    const date =
        new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
        return dateValue;
    }

    return date.toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );
}


/* =========================================================
   HTML ESCAPE
   ========================================================= */

function escapeHTML(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* =========================================================
   GLOBAL FUNCTIONS
   ========================================================= */

window.goToVote = goToVote;
window.openElection = openElection;
window.selectCandidate = selectCandidate;
window.submitVote = submitVote;
window.logout = logout;
window.showNotification = showNotification;