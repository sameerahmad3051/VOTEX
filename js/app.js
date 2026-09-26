/* =========================================================
   VOTESECURE - APP.JS
   Frontend API Integration
========================================================= */

const API_URL = "http://127.0.0.1:5000";

let ELECTION_ID = null;
let selectedCandidateId = null;
let candidates = [];


/* =========================================================
   INITIALIZE APP
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    initializeApp();
});


async function initializeApp() {

    initializeUser();
    initializeDate();
    initializeVoteCount();
    initializeSearch();
    initializeMobileMenu();
    initializeAnimations();
    initializeActiveMenu();

    /*
     * Dashboard
     */
    if (document.getElementById("elections")) {
        loadElectionsFromBackend();
    }

    /*
     * Vote page
     */
    if (document.getElementById("candidateList")) {
        await loadVoteCandidates();
    }

    /*
     * Results page
     */
    if (
        document.getElementById("resultsList") ||
        document.getElementById("resultsContainer")
    ) {
        loadResults();
    }

    /*
     * Profile page
     */
    if (document.getElementById("profileName")) {
        loadProfile();
    }
}


/* =========================================================
   AUTHENTICATION
========================================================= */

function getToken() {
    return localStorage.getItem("accessToken");
}


function isLoggedIn() {
    return !!getToken();
}


function getUserName() {
    return localStorage.getItem("userName") || "Sameer Ahmad";
}


function getUserEmail() {
    return localStorage.getItem("userEmail") || "voter@example.com";
}


function getDepartment() {
    return localStorage.getItem("department") || "Computer Science";
}


function getAuthHeaders() {

    const token = getToken();

    return {
        "Content-Type": "application/json",
        ...(token
            ? {
                "Authorization": `Bearer ${token}`
            }
            : {})
    };
}


function requireLogin() {

    if (!isLoggedIn()) {
        window.location.href = "login.html";
        return false;
    }

    return true;
}


async function protectPage() {

    if (!requireLogin()) {
        return false;
    }

    try {

        const response = await fetch(
            `${API_URL}/api/auth/me`,
            {
                method: "GET",
                headers: getAuthHeaders()
            }
        );

        if (!response.ok) {
            throw new Error("Authentication failed");
        }

        const data = await response.json();

        if (data.user) {

            localStorage.setItem(
                "userName",
                data.user.name || ""
            );

            localStorage.setItem(
                "userEmail",
                data.user.email || ""
            );

            localStorage.setItem(
                "department",
                data.user.department || ""
            );

            localStorage.setItem(
                "isAdmin",
                data.user.is_admin === true
                    ? "true"
                    : "false"
            );
        }

        return true;

    } catch (error) {

        console.error("AUTH ERROR:", error);

        localStorage.removeItem("accessToken");
        localStorage.removeItem("loggedIn");

        window.location.href = "login.html";

        return false;
    }
}


/* =========================================================
   USER INITIALIZATION
========================================================= */

function initializeUser() {

    const userName = getUserName();

    const elements = [
        "topbarUserName",
        "profileName",
        "userName",
        "welcomeUserName"
    ];

    elements.forEach(id => {

        const element = document.getElementById(id);

        if (element) {
            element.textContent = userName;
        }

    });
}


/* =========================================================
   DATE
========================================================= */

function initializeDate() {

    const dateElements = document.querySelectorAll(
        "[data-current-date]"
    );

    const today = new Date();

    const formattedDate = today.toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );

    dateElements.forEach(element => {
        element.textContent = formattedDate;
    });
}


/* =========================================================
   VOTE COUNT
========================================================= */

function initializeVoteCount() {

    const voteCountElement =
        document.getElementById("voteCount");

    if (!voteCountElement) {
        return;
    }

    const hasVoted =
        localStorage.getItem("voteSubmitted") === "true";

    voteCountElement.textContent =
        hasVoted ? "01" : "00";
}


/* =========================================================
   API - GET ELECTIONS
========================================================= */

async function getElections() {

    const response = await fetch(
        `${API_URL}/api/elections/`,
        {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            }
        }
    );

    if (!response.ok) {
        throw new Error(
            `Unable to load elections (${response.status})`
        );
    }

    const data = await response.json();

    return data.elections || [];
}


/* =========================================================
   FIND ACTIVE ELECTION
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


/* =========================================================
   GET ELECTION ID FROM URL
========================================================= */

function getElectionIdFromURL() {

    const params =
        new URLSearchParams(window.location.search);

    const id = params.get("election_id");

    if (!id) {
        return null;
    }

    const numericId = Number(id);

    return Number.isInteger(numericId) && numericId > 0
        ? numericId
        : null;
}


/* =========================================================
   GO TO VOTE
========================================================= */

async function goToVote() {

    if (!requireLogin()) {
        return;
    }

    try {

        showNotification(
            "Finding an active election...",
            "success"
        );

        const elections =
            await getElections();

        const activeElection =
            findActiveElection(elections);

        if (!activeElection) {

            showNotification(
                "No active election is available right now.",
                "warning"
            );

            return;
        }

        ELECTION_ID =
            Number(activeElection.id);

        localStorage.setItem(
            "currentElectionId",
            String(ELECTION_ID)
        );

        localStorage.setItem(
            "currentElectionTitle",
            activeElection.title || ""
        );

        window.location.href =
            `vote.html?election_id=${ELECTION_ID}`;

    } catch (error) {

        console.error(
            "GO TO VOTE ERROR:",
            error
        );

        showNotification(
            "Unable to connect to backend.",
            "warning"
        );
    }
}


/* =========================================================
   LOAD ELECTIONS
========================================================= */

async function loadElectionsFromBackend() {

    const container =
        document.getElementById("elections");

    if (!container) {
        return;
    }

    try {

        const elections =
            await getElections();

        renderElections(elections);

    } catch (error) {

        console.error(
            "ELECTION LOAD ERROR:",
            error
        );

        showNotification(
            "Unable to load elections.",
            "warning"
        );
    }
}


/* =========================================================
   RENDER ELECTIONS
========================================================= */

function renderElections(elections) {

    const container =
        document.getElementById("elections");

    if (!container) {
        return;
    }

    if (!elections.length) {

        container.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-calendar-xmark"></i>
                <h3>No Elections Found</h3>
                <p>There are currently no elections available.</p>
            </div>
        `;

        return;
    }

    container.innerHTML =
        elections.map(election => {

            const status =
                String(election.status || "")
                    .toLowerCase();

            const statusClass =
                status === "active"
                    ? "active"
                    : status === "upcoming"
                        ? "upcoming"
                        : "completed";

            const startDate =
                formatDate(election.start_date);

            const endDate =
                formatDate(election.end_date);

            return `
                <div
                    class="election"
                    data-election-title="${escapeHTML(
                        election.title || ""
                    )}"
                >

                    <div class="election-icon">
                        <i class="fa-solid fa-landmark"></i>
                    </div>

                    <div class="election-info">

                        <h3>
                            ${escapeHTML(
                                election.title || "Election"
                            )}
                        </h3>

                        <p>
                            ${escapeHTML(
                                election.description || ""
                            )}
                        </p>

                        <span class="election-date">
                            ${startDate}
                            -
                            ${endDate}
                        </span>

                    </div>

                    <div class="election-status ${statusClass}">
                        ${escapeHTML(
                            election.status || ""
                        )}
                    </div>

                    ${
                        status === "active"
                            ? `
                                <button
                                    type="button"
                                    class="primary-btn"
                                    onclick="openElection(${Number(election.id)})"
                                >
                                    Vote
                                    <i class="fa-solid fa-arrow-right"></i>
                                </button>
                            `
                            : ""
                    }

                </div>
            `;

        }).join("");
}


/* =========================================================
   OPEN SPECIFIC ELECTION
========================================================= */

function openElection(electionId) {

    if (!requireLogin()) {
        return;
    }

    ELECTION_ID =
        Number(electionId);

    localStorage.setItem(
        "currentElectionId",
        String(ELECTION_ID)
    );

    window.location.href =
        `vote.html?election_id=${ELECTION_ID}`;
}


/* =========================================================
   LOAD VOTE CANDIDATES
========================================================= */

async function loadVoteCandidates() {

    const candidateList =
        document.getElementById("candidateList");

    if (!candidateList) {
        return;
    }

    if (!requireLogin()) {
        return;
    }

    try {

        /*
         * First try URL parameter
         */
        let electionId =
            getElectionIdFromURL();


        /*
         * If URL has no ID,
         * use stored election ID
         */
        if (!electionId) {

            const storedId =
                Number(
                    localStorage.getItem(
                        "currentElectionId"
                    )
                );

            if (
                Number.isInteger(storedId) &&
                storedId > 0
            ) {
                electionId = storedId;
            }
        }


        /*
         * If still no election ID,
         * fetch active election.
         */
        if (!electionId) {

            const elections =
                await getElections();

            const activeElection =
                findActiveElection(elections);

            if (!activeElection) {

                showVoteError(
                    "No active election is available."
                );

                return;
            }

            electionId =
                Number(activeElection.id);

            localStorage.setItem(
                "currentElectionId",
                String(electionId)
            );

            localStorage.setItem(
                "currentElectionTitle",
                activeElection.title || ""
            );
        }


        ELECTION_ID =
            Number(electionId);


        /*
         * Fetch election details
         */
        const electionResponse =
            await fetch(
                `${API_URL}/api/elections/${ELECTION_ID}`,
                {
                    method: "GET",
                    headers: {
                        "Content-Type":
                            "application/json"
                    }
                }
            );


        /*
         * If details endpoint is unavailable,
         * candidates endpoint can still work.
         */
        if (electionResponse.ok) {

            const electionData =
                await electionResponse.json();

            const election =
                electionData.election ||
                electionData;

            updateElectionInformation(election);
        }


        /*
         * Fetch candidates
         */
        const response =
            await fetch(
                `${API_URL}/api/elections/${ELECTION_ID}/candidates`,
                {
                    method: "GET",
                    headers: {
                        "Content-Type":
                            "application/json"
                    }
                }
            );


        if (!response.ok) {

            if (response.status === 404) {
                throw new Error(
                    "Election or candidates not found."
                );
            }

            throw new Error(
                `Candidate request failed (${response.status})`
            );
        }


        const data =
            await response.json();


        candidates =
            Array.isArray(data)
                ? data
                : data.candidates || [];


        if (!candidates.length) {

            candidateList.innerHTML = `
                <div
                    class="empty-state"
                    style="
                        width:100%;
                        padding:40px;
                        text-align:center;
                    "
                >
                    <i class="fa-solid fa-users-slash"></i>

                    <h3>
                        No Candidates Found
                    </h3>

                    <p>
                        This election currently has
                        no candidates.
                    </p>
                </div>
            `;

            updateCandidateCount(0);

            return;
        }


        renderCandidates(candidates);

        updateCandidateCount(
            candidates.length
        );


        /*
         * Check whether current user
         * already voted.
         */
        await checkExistingVote();

    } catch (error) {

        console.error(
            "LOAD VOTE CANDIDATES ERROR:",
            error
        );

        showVoteError(
            error.message ||
            "Unable to connect to backend."
        );
    }
}


/* =========================================================
   RENDER CANDIDATES
========================================================= */

function renderCandidates(candidateData) {

    const candidateList =
        document.getElementById("candidateList");

    if (!candidateList) {
        return;
    }

    candidateList.innerHTML =
        candidateData.map(candidate => {

            const candidateId =
                Number(candidate.id);

            const image =
                candidate.avatar ||
                candidate.image ||
                `https://i.pravatar.cc/100?img=${candidateId + 10}`;

            return `
                <div
                    class="candidate"
                    data-candidate-id="${candidateId}"
                    onclick="selectCandidate(${candidateId})"
                >

                    <div class="candidate-radio">
                        <span class="radio"></span>
                    </div>

                    <img
                        class="candidate-avatar"
                        src="${escapeHTML(image)}"
                        alt="${escapeHTML(
                            candidate.name || "Candidate"
                        )}"
                    >

                    <div class="candidate-info">

                        <h4>
                            ${escapeHTML(
                                candidate.name ||
                                "Unknown Candidate"
                            )}
                        </h4>

                        <p>
                            ${escapeHTML(
                                candidate.department ||
                                "Department not specified"
                            )}
                        </p>

                        ${
                            candidate.description
                                ? `
                                    <span class="candidate-description">
                                        ${escapeHTML(
                                            candidate.description
                                        )}
                                    </span>
                                `
                                : ""
                        }

                    </div>

                    <i class="fa-solid fa-chevron-right candidate-arrow"></i>

                </div>
            `;

        }).join("");
}


/* =========================================================
   SELECT CANDIDATE
========================================================= */

function selectCandidate(candidateId) {

    if (!ELECTION_ID) {

        showNotification(
            "Election information is not available.",
            "warning"
        );

        return;
    }


    const submitButton =
        document.getElementById(
            "submitVoteButton"
        );

    if (
        submitButton &&
        submitButton.disabled &&
        submitButton.dataset.submitted === "true"
    ) {
        return;
    }


    selectedCandidateId =
        Number(candidateId);


    document
        .querySelectorAll(".candidate")
        .forEach(candidate => {

            candidate.classList.remove(
                "selected"
            );

        });


    const selected =
        document.querySelector(
            `.candidate[data-candidate-id="${selectedCandidateId}"]`
        );


    if (selected) {
        selected.classList.add("selected");
    }


    /*
     * Enable submit button
     */
    if (submitButton) {

        submitButton.disabled = false;

        submitButton.classList.remove(
            "disabled"
        );

        const span =
            submitButton.querySelector("span");

        if (span) {
            span.textContent =
                "Submit Vote";
        }
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

        const response =
            await fetch(
                `${API_URL}/api/votes/my/${ELECTION_ID}`,
                {
                    method: "GET",
                    headers: getAuthHeaders()
                }
            );


        if (!response.ok) {
            return;
        }


        const data =
            await response.json();


        if (data.has_voted === true) {

            markVoteAsSubmitted(
                data.vote
            );
        }

    } catch (error) {

        console.error(
            "CHECK VOTE ERROR:",
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
            "Election information is missing.",
            "warning"
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
            candidate =>
                Number(candidate.id) ===
                Number(selectedCandidateId)
        );


    if (!candidate) {

        showNotification(
            "Selected candidate was not found.",
            "warning"
        );

        return;
    }


    const confirmed =
        window.confirm(
            `Are you sure you want to vote for ${candidate.name}?`
        );


    if (!confirmed) {
        return;
    }


    const submitButton =
        document.getElementById(
            "submitVoteButton"
        );


    if (submitButton) {

        submitButton.disabled = true;

        submitButton.dataset.submitting =
            "true";

        const span =
            submitButton.querySelector("span");

        if (span) {
            span.textContent =
                "Submitting...";
        }
    }


    try {

        const response =
            await fetch(
                `${API_URL}/api/votes/`,
                {
                    method: "POST",

                    headers:
                        getAuthHeaders(),

                    body:
                        JSON.stringify({
                            election_id:
                                Number(ELECTION_ID),

                            candidate_id:
                                Number(selectedCandidateId)
                        })
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            /*
             * Backend returns 409 when
             * the user already voted.
             */
            if (response.status === 409) {

                markVoteAsSubmitted(
                    data.vote
                );

                showNotification(
                    data.message ||
                    "You have already voted in this election.",
                    "warning"
                );

                return;
            }


            throw new Error(
                data.message ||
                "Vote submission failed."
            );
        }


        /*
         * Keep old frontend compatibility
         */
        localStorage.setItem(
            "voteSubmitted",
            "true"
        );


        localStorage.setItem(
            "lastVote",
            candidate.name
        );


        markVoteAsSubmitted(
            data.vote
        );


        showNotification(
            "Your vote has been submitted successfully!",
            "success"
        );


    } catch (error) {

        console.error(
            "SUBMIT VOTE ERROR:",
            error
        );


        if (submitButton) {

            submitButton.disabled = false;

            delete submitButton.dataset.submitting;

            const span =
                submitButton.querySelector("span");

            if (span) {
                span.textContent =
                    "Submit Vote";
            }
        }


        showNotification(
            error.message ||
            "Unable to submit vote.",
            "warning"
        );
    }
}


/* =========================================================
   MARK VOTE AS SUBMITTED
========================================================= */

function markVoteAsSubmitted(vote) {

    const submitButton =
        document.getElementById(
            "submitVoteButton"
        );


    if (submitButton) {

        submitButton.disabled = true;

        submitButton.dataset.submitted =
            "true";

        const span =
            submitButton.querySelector("span");

        if (span) {

            span.textContent =
                "Vote Already Submitted";
        }
    }


    document
        .querySelectorAll(".candidate")
        .forEach(candidate => {

            candidate.style.pointerEvents =
                "none";

        });


    /*
     * Highlight voted candidate
     */
    if (vote && vote.candidate_id) {

        const selected =
            document.querySelector(
                `.candidate[data-candidate-id="${Number(
                    vote.candidate_id
                )}"]`
            );

        if (selected) {

            selected.classList.add(
                "selected"
            );
        }
    }


    const votingStatus =
        document.getElementById(
            "votingStatus"
        );

    if (votingStatus) {
        votingStatus.textContent =
            "Vote Submitted";
    }
}


/* =========================================================
   RESULTS
========================================================= */

async function loadResults() {

    const container =
        document.getElementById("resultsList") ||
        document.getElementById("resultsContainer");

    if (!container) {
        return;
    }


    if (!requireLogin()) {
        return;
    }


    try {

        let electionId =
            getElectionIdFromURL();


        if (!electionId) {

            electionId =
                Number(
                    localStorage.getItem(
                        "currentElectionId"
                    )
                );
        }


        if (!electionId) {

            const elections =
                await getElections();

            const activeElection =
                findActiveElection(elections);

            if (!activeElection) {
                throw new Error(
                    "No election found."
                );
            }

            electionId =
                Number(activeElection.id);
        }


        const response =
            await fetch(
                `${API_URL}/api/votes/results/${electionId}`,
                {
                    method: "GET",
                    headers: getAuthHeaders()
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Unable to load results."
            );
        }


        renderResults(data);

    } catch (error) {

        console.error(
            "RESULTS ERROR:",
            error
        );

        showNotification(
            error.message ||
            "Unable to load results.",
            "warning"
        );
    }
}


/* =========================================================
   RENDER RESULTS
========================================================= */

function renderResults(data) {

    const container =
        document.getElementById("resultsList") ||
        document.getElementById("resultsContainer");

    if (!container) {
        return;
    }


    const results =
        data.results || [];


    if (!results.length) {

        container.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-chart-column"></i>

                <h3>
                    No Results Available
                </h3>

                <p>
                    There are no votes recorded yet.
                </p>
            </div>
        `;

        return;
    }


    container.innerHTML =
        results.map(result => {

            const percentage =
                Number(result.percentage || 0);

            return `
                <div class="result-item">

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


                    <div class="result-progress">

                        <div class="progress-bar">

                            <div
                                class="progress-fill"
                                style="
                                    width:${percentage}%;
                                "
                            ></div>

                        </div>

                        <span>
                            ${percentage}%
                        </span>

                    </div>


                    <strong class="result-votes">
                        ${Number(result.votes || 0)}
                    </strong>

                </div>
            `;

        }).join("");
}


/* =========================================================
   PROFILE
========================================================= */

async function loadProfile() {

    if (!requireLogin()) {
        return;
    }


    const name =
        getUserName();

    const email =
        getUserEmail();

    const department =
        getDepartment();


    const nameElement =
        document.getElementById("profileName");

    const emailElement =
        document.getElementById("profileEmail");

    const departmentElement =
        document.getElementById("profileDepartment");


    if (nameElement) {
        nameElement.textContent = name;
    }

    if (emailElement) {
        emailElement.textContent = email;
    }

    if (departmentElement) {
        departmentElement.textContent =
            department;
    }


    /*
     * Try refreshing profile from backend.
     */
    try {

        const response =
            await fetch(
                `${API_URL}/api/auth/me`,
                {
                    method: "GET",
                    headers: getAuthHeaders()
                }
            );


        if (!response.ok) {
            return;
        }


        const data =
            await response.json();


        if (data.user) {

            localStorage.setItem(
                "userName",
                data.user.name || ""
            );

            localStorage.setItem(
                "userEmail",
                data.user.email || ""
            );

            localStorage.setItem(
                "department",
                data.user.department || ""
            );

            initializeUser();
        }

    } catch (error) {

        console.error(
            "PROFILE ERROR:",
            error
        );
    }
}


/* =========================================================
   UPDATE ELECTION INFORMATION
========================================================= */

function updateElectionInformation(election) {

    if (!election) {
        return;
    }


    const title =
        election.title ||
        localStorage.getItem(
            "currentElectionTitle"
        ) ||
        "Election";


    localStorage.setItem(
        "currentElectionTitle",
        title
    );


    const titleElements = [
        "electionTitle",
        "electionTopTitle"
    ];


    titleElements.forEach(id => {

        const element =
            document.getElementById(id);

        if (element) {
            element.textContent = title;
        }

    });


    const endDate =
        document.getElementById(
            "electionEndDate"
        );


    if (endDate) {

        endDate.textContent =
            formatDate(election.end_date);
    }


    const status =
        document.getElementById(
            "electionStatus"
        );


    const statusText =
        document.getElementById(
            "electionStatusText"
        );


    const votingStatus =
        document.getElementById(
            "votingStatus"
        );


    const electionStatus =
        String(
            election.status || ""
        ).toLowerCase();


    if (statusText) {

        statusText.textContent =
            election.status ||
            "Unknown";
    }


    if (votingStatus) {

        votingStatus.textContent =
            electionStatus === "active"
                ? "Open"
                : "Closed";
    }


    if (status) {

        status.classList.remove(
            "active",
            "upcoming",
            "completed"
        );


        status.classList.add(
            electionStatus || "active"
        );
    }
}


/* =========================================================
   CANDIDATE COUNT
========================================================= */

function updateCandidateCount(count) {

    const element =
        document.getElementById(
            "candidateCount"
        );

    if (element) {
        element.textContent =
            String(count);
    }
}


/* =========================================================
   VOTE ERROR
========================================================= */

function showVoteError(message) {

    const candidateList =
        document.getElementById(
            "candidateList"
        );


    if (candidateList) {

        candidateList.innerHTML = `
            <div
                class="empty-state"
                style="
                    width:100%;
                    padding:45px 20px;
                    text-align:center;
                "
            >

                <i
                    class="fa-solid fa-triangle-exclamation"
                    style="font-size:32px;"
                ></i>

                <h3>
                    Unable to Load Election
                </h3>

                <p>
                    ${escapeHTML(message)}
                </p>

                <button
                    type="button"
                    class="primary-btn"
                    onclick="loadVoteCandidates()"
                >
                    <i class="fa-solid fa-rotate"></i>
                    Try Again
                </button>

            </div>
        `;
    }


    showNotification(
        message,
        "warning"
    );
}


/* =========================================================
   SEARCH
========================================================= */

function initializeSearch() {

    const searchInput =
        document.getElementById(
            "searchInput"
        );

    if (!searchInput) {
        return;
    }


    searchInput.addEventListener(
        "input",
        function () {

            const query =
                this.value
                    .trim()
                    .toLowerCase();


            const electionElements =
                document.querySelectorAll(
                    ".election"
                );


            electionElements.forEach(
                election => {

                    const text =
                        election.textContent
                            .toLowerCase();

                    election.style.display =
                        text.includes(query)
                            ? ""
                            : "none";
                }
            );

        }
    );
}


/* =========================================================
   MOBILE MENU
========================================================= */

function initializeMobileMenu() {

    const button =
        document.getElementById(
            "mobileMenuBtn"
        );

    const sidebar =
        document.getElementById(
            "sidebar"
        );


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
   ANIMATIONS
========================================================= */

function initializeAnimations() {

    const elements =
        document.querySelectorAll(
            ".stat-card, .election, .vote-card, .candidate"
        );


    elements.forEach(
        (element, index) => {

            element.style.animationDelay =
                `${index * 50}ms`;

        }
    );
}


/* =========================================================
   ACTIVE MENU
========================================================= */

function initializeActiveMenu() {

    const currentPage =
        window.location.pathname
            .split("/")
            .pop()
            .toLowerCase();


    document
        .querySelectorAll(".menu-item")
        .forEach(item => {

            const href =
                item.getAttribute("href");

            if (!href) {
                return;
            }


            const target =
                href
                    .split("?")[0]
                    .split("#")[0]
                    .toLowerCase();


            if (
                target &&
                target !== "#" &&
                target === currentPage
            ) {

                item.classList.add(
                    "active"
                );

            }

        });
}


/* =========================================================
   LOGOUT
========================================================= */

function logout() {

    const confirmed =
        window.confirm(
            "Are you sure you want to logout?"
        );


    if (!confirmed) {
        return false;
    }


    localStorage.removeItem(
        "accessToken"
    );

    localStorage.removeItem(
        "loggedIn"
    );

    localStorage.removeItem(
        "userId"
    );

    localStorage.removeItem(
        "userName"
    );

    localStorage.removeItem(
        "userEmail"
    );

    localStorage.removeItem(
        "department"
    );

    localStorage.removeItem(
        "isAdmin"
    );

    localStorage.removeItem(
        "currentElectionId"
    );

    localStorage.removeItem(
        "currentElectionTitle"
    );

    localStorage.removeItem(
        "voteSubmitted"
    );

    localStorage.removeItem(
        "lastVote"
    );


    window.location.href =
        "login.html";


    return false;
}


/* =========================================================
   NOTIFICATION
========================================================= */

function showNotification(
    message,
    type = "success"
) {

    /*
     * Remove existing notification
     */
    const oldNotification =
        document.querySelector(
            ".custom-notification"
        );


    if (oldNotification) {
        oldNotification.remove();
    }


    const notification =
        document.createElement(
            "div"
        );


    notification.className =
        `custom-notification ${type}`;


    const icon =
        type === "warning"
            ? "fa-triangle-exclamation"
            : type === "error"
                ? "fa-circle-xmark"
                : "fa-circle-check";


    notification.innerHTML = `

        <div class="notification-icon">

            <i class="fa-solid ${icon}"></i>

        </div>

        <div class="notification-message">
            ${escapeHTML(message)}
        </div>

        <button
            type="button"
            class="notification-close"
            aria-label="Close"
        >
            <i class="fa-solid fa-xmark"></i>
        </button>

    `;


    document.body.appendChild(
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


    setTimeout(
        () => {

            if (
                notification &&
                notification.parentNode
            ) {
                notification.remove();
            }

        },
        4000
    );
}


/* =========================================================
   FORMAT DATE
========================================================= */

function formatDate(value) {

    if (!value) {
        return "--";
    }


    const date =
        new Date(value);


    if (Number.isNaN(
        date.getTime()
    )) {
        return String(value);
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
   ESCAPE HTML
========================================================= */

function escapeHTML(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }


    const div =
        document.createElement("div");


    div.textContent =
        String(value);


    return div.innerHTML;
}


/* =========================================================
   LAST VOTE
========================================================= */

function getLastVote() {

    return localStorage.getItem(
        "lastVote"
    ) || "";
}


/* =========================================================
   GLOBAL FUNCTIONS
========================================================= */

window.goToVote =
    goToVote;

window.openElection =
    openElection;

window.logout =
    logout;

window.selectCandidate =
    selectCandidate;

window.submitVote =
    submitVote;

window.showNotification =
    showNotification;

window.getUserName =
    getUserName;

window.getLastVote =
    getLastVote;

window.isLoggedIn =
    isLoggedIn;

window.protectPage =
    protectPage;

window.loadVoteCandidates =
    loadVoteCandidates;

window.loadResults =
    loadResults;