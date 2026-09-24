/* =========================================================
   VOTESECURE - APP.JS
   Premium Online Voting System
   Backend: Flask + SQLite + JWT
========================================================= */


/* =========================================================
   1. CONFIGURATION
========================================================= */

const API_URL = "http://127.0.0.1:5000";

let ELECTION_ID = null;


/* =========================================================
   2. GLOBAL DATA
========================================================= */

const candidates = [
    {
        id: 1,
        name: "Aarav Sharma",
        department: "Computer Science",
        votes: 0,
        image: "https://i.pravatar.cc/100?img=11"
    },
    {
        id: 2,
        name: "Priya Verma",
        department: "Electronics",
        votes: 0,
        image: "https://i.pravatar.cc/100?img=47"
    },
    {
        id: 3,
        name: "Rohan Mehta",
        department: "Mechanical",
        votes: 0,
        image: "https://i.pravatar.cc/100?img=13"
    }
];

let selectedCandidateId = null;


/* =========================================================
   3. DOM READY
========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    console.log("VoteSecure application starting...");

    initializeApp();

});


/* =========================================================
   4. INITIALIZE APPLICATION
========================================================= */

function initializeApp() {

    initializeUser();

    initializeDate();

    initializeVoteCount();

    initializeSearch();

    initializeMobileMenu();

    initializeAnimations();

    initializeCandidateInteractions();

    initializeActiveMenu();


    /* =====================================================
       LOAD ELECTIONS ON DASHBOARD
    ===================================================== */

    if (document.getElementById("elections")) {

        loadElectionsFromBackend();

    }


    /* =====================================================
       LOAD CANDIDATES ON VOTE PAGE
    ===================================================== */

    if (document.getElementById("candidateList")) {

        loadVoteCandidates();

    }

}
/* =========================================================
   LOAD ELECTIONS FROM BACKEND
========================================================= */

async function loadElectionsFromBackend() {

    console.log("Loading elections from backend...");

    const electionContainer =
        document.getElementById("elections");

    if (!electionContainer) {
        console.log("Election container not found on this page.");
        return;
    }

    try {

        const response = await fetch(
            `${API_URL}/api/elections/`
        );

        const data = await response.json();

        console.log(
            "Elections API response:",
            data
        );

        if (!response.ok) {

            throw new Error(
                data.message ||
                "Unable to load elections."
            );
        }

        if (
            !data.elections ||
            data.elections.length === 0
        ) {

            electionContainer.innerHTML = `
                <div class="empty-election">
                    <i class="fa-solid fa-calendar-xmark"></i>
                    <p>No elections available.</p>
                </div>
            `;

            return;
        }

        electionContainer.innerHTML = "";

        data.elections.forEach(
            election => {

                const electionElement =
                    document.createElement("div");

                electionElement.className =
                    "election";

                const startDate =
                    formatElectionDate(
                        election.start_date
                    );

                const endDate =
                    formatElectionDate(
                        election.end_date
                    );

                const status =
                    String(
                        election.status || "upcoming"
                    ).toLowerCase();

                let statusText =
                    "Upcoming";

                if (status === "active") {
                    statusText = "Active";
                }

                if (status === "completed") {
                    statusText = "Completed";
                }

                electionElement.innerHTML = `
                    <div class="election-info">

                        <div class="election-icon">
                            <i class="fa-solid fa-check-to-slot"></i>
                        </div>

                        <div class="election-details">

                            <h3>
                                ${escapeHTML(
                                    election.title
                                )}
                            </h3>

                            <p>
                                ${escapeHTML(
                                    election.description || ""
                                )}
                            </p>

                            <div class="election-meta">

                                <span>
                                    <i class="fa-regular fa-calendar"></i>
                                    ${startDate}
                                </span>

                                <span>
                                    <i class="fa-regular fa-clock"></i>
                                    Ends ${endDate}
                                </span>

                            </div>

                        </div>

                    </div>

                    <div class="election-status">

                        <span class="status ${status}">
                            ${statusText}
                        </span>

                    </div>
                `;

                electionContainer.appendChild(
                    electionElement
                );
            }
        );

        console.log(
            "Elections loaded successfully."
        );

    } catch (error) {

        console.error(
            "Election loading error:",
            error
        );

        electionContainer.innerHTML = `
            <div class="empty-election">
                <i class="fa-solid fa-triangle-exclamation"></i>
                <p>
                    Unable to load elections.
                </p>
            </div>
        `;
    }
}


/* =========================================================
   FORMAT ELECTION DATE
========================================================= */

function formatElectionDate(dateValue) {

    if (!dateValue) {
        return "Date unavailable";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
        return String(dateValue);
    }

    return date.toLocaleDateString(
        "en-GB",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );
}

/* =========================================================
   5. USER INITIALIZATION
========================================================= */

function initializeUser() {

    const storedUserName =
        localStorage.getItem("userName") ||
        "Sameer Ahmad";

    const shortName =
        storedUserName.split(" ")[0] ||
        "Sameer";


    /* Topbar username */

    const topbarUserName =
        document.getElementById("topbarUserName");

    if (topbarUserName) {

        topbarUserName.textContent =
            storedUserName;

    }


    /* Welcome username */

    const welcomeUserName =
        document.getElementById("welcomeUserName");

    if (welcomeUserName) {

        welcomeUserName.textContent =
            shortName;

    }


    /* Save default username */

    if (!localStorage.getItem("userName")) {

        localStorage.setItem(
            "userName",
            storedUserName
        );

    }


    /* Profile name */

    const profileName =
        document.getElementById("profileName");

    if (profileName) {

        profileName.textContent =
            storedUserName;

    }


    /* Profile email */

    const profileEmail =
        document.getElementById("profileEmail");

    const storedEmail =
        localStorage.getItem("userEmail");

    if (profileEmail && storedEmail) {

        profileEmail.textContent =
            storedEmail;

    }


    /* Profile department */

    const profileDepartment =
        document.getElementById("profileDepartment");

    const storedDepartment =
        localStorage.getItem("department");

    if (
        profileDepartment &&
        storedDepartment
    ) {

        profileDepartment.textContent =
            storedDepartment;

    }

}


/* =========================================================
   6. DATE
========================================================= */

function initializeDate() {

    const dateElement =
        document.getElementById("currentDate");

    if (!dateElement) {
        return;
    }

    const today = new Date();

    const options = {
        day: "2-digit",
        month: "short",
        year: "numeric"
    };

    dateElement.textContent =
        today.toLocaleDateString(
            "en-GB",
            options
        );

}


/* =========================================================
   7. VOTE COUNT
========================================================= */

function initializeVoteCount() {

    const voteCount =
        document.getElementById("voteCount");

    if (!voteCount) {
        return;
    }

    const voteSubmitted =
        localStorage.getItem(
            "voteSubmitted"
        ) === "true";

    voteCount.textContent =
        voteSubmitted ? "01" : "00";

}


/* =========================================================
   8. SEARCH
========================================================= */

function initializeSearch() {

    const searchInput =
        document.getElementById("searchInput");

    if (!searchInput) {
        return;
    }

    searchInput.addEventListener(
        "input",
        function () {

            const searchTerm =
                this.value
                    .trim()
                    .toLowerCase();

            const elections =
                document.querySelectorAll(
                    ".election"
                );

            elections.forEach(
                election => {

                    const text =
                        election.textContent
                            .toLowerCase();

                    if (
                        searchTerm === "" ||
                        text.includes(searchTerm)
                    ) {

                        election.style.display =
                            "flex";

                    } else {

                        election.style.display =
                            "none";

                    }

                }
            );

        }
    );

}


/* =========================================================
   9. MOBILE SIDEBAR
========================================================= */

function initializeMobileMenu() {

    const sidebar =
        document.querySelector(".sidebar");

    const mobileMenuBtn =
        document.getElementById(
            "mobileMenuBtn"
        );

    if (!sidebar || !mobileMenuBtn) {
        return;
    }

    mobileMenuBtn.addEventListener(
        "click",
        function () {

            sidebar.classList.toggle(
                "open"
            );

        }
    );


    /* Close sidebar after menu click */

    const menuItems =
        document.querySelectorAll(
            ".sidebar .menu-item"
        );

    menuItems.forEach(
        item => {

            item.addEventListener(
                "click",
                function () {

                    if (
                        window.innerWidth <= 950
                    ) {

                        sidebar.classList.remove(
                            "open"
                        );

                    }

                }
            );

        }
    );

}


/* =========================================================
   10. ACTIVE MENU
========================================================= */

function initializeActiveMenu() {

    const currentPage =
        window.location.pathname
            .split("/")
            .pop()
            .toLowerCase();

    const menuItems =
        document.querySelectorAll(
            ".sidebar .menu-item"
        );

    menuItems.forEach(
        item => {

            const href =
                item.getAttribute("href");

            if (!href) {
                return;
            }

            const cleanHref =
                href
                    .split("#")[0]
                    .toLowerCase();

            if (
                currentPage &&
                cleanHref === currentPage
            ) {

                menuItems.forEach(
                    menu =>
                        menu.classList.remove(
                            "active"
                        )
                );

                item.classList.add(
                    "active"
                );

            }

        }
    );


    /* Dashboard active */

    if (
        currentPage === "" ||
        currentPage === "index.html"
    ) {

        menuItems.forEach(
            menu =>
                menu.classList.remove(
                    "active"
                )
        );

        const dashboard =
            document.querySelector(
                '.menu-item[href="index.html"]'
            );

        if (dashboard) {

            dashboard.classList.add(
                "active"
            );

        }

    }

}


/* =========================================================
   11. QUICK CANDIDATE INTERACTIONS
========================================================= */

function initializeCandidateInteractions() {

    const candidateElements =
        document.querySelectorAll(
            ".quick-candidate"
        );

    candidateElements.forEach(
        candidate => {

            candidate.addEventListener(
                "click",
                function () {

                    const name =
                        candidate.querySelector(
                            "strong"
                        );

                    if (!name) {
                        return;
                    }

                    const candidateName =
                        name.textContent.trim();

                    showNotification(
                        `${candidateName} selected.`,
                        "success"
                    );

                }
            );

        }
    );

}


/* =========================================================
   12. GO TO VOTE
========================================================= */

/* =========================================================
   12. GO TO VOTE
========================================================= */

async function goToVote() {

    const token = localStorage.getItem("accessToken");

    if (!token) {
        window.location.href = "login.html";
        return;
    }

    try {

        const response = await fetch(
            `${API_URL}/api/elections/`
        );

        const data = await response.json();

        if (!response.ok || !data.elections) {
            throw new Error(
                data.message || "Unable to load elections."
            );
        }

        const activeElection = data.elections.find(
            election =>
                String(election.status).toLowerCase() === "active"
        );

        if (!activeElection) {
            showNotification(
                "No active election is available.",
                "warning"
            );
            return;
        }

        ELECTION_ID = activeElection.id;

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
            "Unable to open voting page:",
            error
        );

        showNotification(
            error.message ||
            "Unable to connect to backend.",
            "warning"
        );
    }
}


/* =========================================================
   13. LOGOUT
========================================================= */

function logout() {

    const confirmed =
        window.confirm(
            "Are you sure you want to logout?"
        );

    if (!confirmed) {
        return;
    }


    localStorage.removeItem(
        "loggedIn"
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
        "accessToken"
    );

    localStorage.removeItem(
        "userId"
    );

    localStorage.removeItem(
        "selectedCandidateId"
    );


    showNotification(
        "You have been logged out.",
        "success"
    );


    setTimeout(
        function () {

            window.location.href =
                "login.html";

        },
        700
    );

}



/* =========================================================
   14. LOAD CANDIDATES FROM BACKEND
========================================================= */

async function loadVoteCandidates() {

    console.log(
        "Loading candidates from backend..."
    );

    const token =
        localStorage.getItem("accessToken");

    if (!token) {

        console.warn(
            "No access token found."
        );

        window.location.href =
            "login.html";

        return;
    }

    const candidateList =
        document.getElementById("candidateList");

    if (!candidateList) {

        console.error(
            "candidateList element not found."
        );

        return;
    }

    try {

        /* =========================================
           GET ELECTION ID
        ========================================= */

        const urlParams =
            new URLSearchParams(
                window.location.search
            );

        const urlElectionId =
            urlParams.get("election_id");

        if (urlElectionId) {

            ELECTION_ID =
                Number(urlElectionId);

        } else {

            /* Get current active election */

            const electionResponse =
                await fetch(
                    `${API_URL}/api/elections/`
                );

            const electionData =
                await electionResponse.json();

            if (
                !electionResponse.ok ||
                !electionData.elections
            ) {

                throw new Error(
                    electionData.message ||
                    "Unable to load elections."
                );

            }

            const activeElection =
                electionData.elections.find(
                    election =>
                        String(
                            election.status
                        ).toLowerCase() === "active"
                );

            if (!activeElection) {

                throw new Error(
                    "No active election is available."
                );

            }

            ELECTION_ID =
                Number(activeElection.id);

        }


        console.log(
            "Using Election ID:",
            ELECTION_ID
        );


        /* =========================================
           SAVE CURRENT ELECTION
        ========================================= */

        localStorage.setItem(
            "currentElectionId",
            String(ELECTION_ID)
        );


        /* =========================================
           LOAD CANDIDATES
        ========================================= */

        const response =
            await fetch(
                `${API_URL}/api/elections/${ELECTION_ID}/candidates`
            );


        const data =
            await response.json();


        console.log(
            "Candidates API response:",
            data
        );


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Unable to load candidates."
            );

        }


        candidateList.innerHTML =
            "";


        if (
            !data.candidates ||
            data.candidates.length === 0
        ) {

            candidateList.innerHTML = `
                <div style="
                    padding: 30px;
                    text-align: center;
                ">
                    <p>No candidates available.</p>
                </div>
            `;

            return;
        }


        /* =========================================
           CREATE CANDIDATE CARDS
        ========================================= */

        data.candidates.forEach(
            candidate => {

                const candidateElement =
                    document.createElement("div");


                candidateElement.className =
                    "candidate";


                candidateElement.dataset.candidateId =
                    candidate.id;


                let avatar =
                    candidate.avatar || "";


                /* Remove markdown URL formatting */

                const markdownMatch =
                    avatar.match(
                        /\((https?:\/\/.*?)\)/
                    );


                if (markdownMatch) {

                    avatar =
                        markdownMatch[1];

                }


                avatar =
                    avatar
                        .replace("[", "")
                        .replace("]", "");


                if (
                    !avatar.startsWith("http://") &&
                    !avatar.startsWith("https://")
                ) {

                    avatar =
                        "https://i.pravatar.cc/150?img=12";

                }


                candidateElement.innerHTML = `
                    <div class="candidate-info">

                        <img
                            src="${escapeHTML(avatar)}"
                            alt="${escapeHTML(candidate.name)}"
                            class="candidate-avatar"
                        >

                        <div>

                            <h3>
                                ${escapeHTML(
                                    candidate.name
                                )}
                            </h3>

                            <p>
                                ${escapeHTML(
                                    candidate.department || ""
                                )}
                            </p>

                            <small>
                                ${escapeHTML(
                                    candidate.description || ""
                                )}
                            </small>

                        </div>

                    </div>

                    <div class="radio"></div>
                `;


                /* Candidate click */

                candidateElement.addEventListener(
                    "click",
                    function () {

                        selectCandidate(
                            candidate.id
                        );

                    }
                );


                candidateList.appendChild(
                    candidateElement
                );

            }
        );


        console.log(
            "Candidates loaded successfully."
        );


        /* Check whether user already voted */

        await checkExistingVote();


        /* Restore previous selection */

        restoreCandidateSelection();


    } catch (error) {

        console.error(
            "Candidate loading error:",
            error
        );

        showNotification(
            "Unable to connect to backend. " +
            error.message,
            "warning"
        );

    }

}

/* =========================================================
   15. SELECT CANDIDATE
========================================================= */

function selectCandidate(candidateId) {

    console.log(
        "Candidate clicked:",
        candidateId
    );


    /*
     * Prevent selection after voting.
     */
    if (
        localStorage.getItem(
            "voteSubmitted"
        ) === "true"
    ) {

        showNotification(
            "You have already submitted your vote.",
            "warning"
        );

        return;
    }


    const id =
        Number(candidateId);


    /*
     * Find candidate in frontend
     * fallback data.
     */
    const candidate =
        candidates.find(
            item =>
                item.id === id
        );


    /*
     * Candidate may have come
     * directly from backend.
     */
    const candidateElement =
        document.querySelector(
            `.candidate[data-candidate-id="${id}"]`
        );


    if (!candidateElement) {

        console.error(
            "Candidate element not found:",
            id
        );

        return;
    }


    /*
     * Save selection.
     */
    selectedCandidateId =
        id;


    localStorage.setItem(
        "selectedCandidateId",
        String(id)
    );


    /*
     * Remove previous selection.
     */
    document
        .querySelectorAll(
            ".candidate"
        )
        .forEach(
            element => {

                element.classList.remove(
                    "selected"
                );

            }
        );


    /*
     * Add selected class.
     */
    candidateElement.classList.add(
        "selected"
    );


    /*
     * Update radio indicator.
     */
    document
        .querySelectorAll(
            ".candidate .radio"
        )
        .forEach(
            radio => {

                radio.classList.remove(
                    "selected"
                );

            }
        );


    const radio =
        candidateElement.querySelector(
            ".radio"
        );


    if (radio) {

        radio.classList.add(
            "selected"
        );

    }


    const candidateName =
        candidate
            ? candidate.name
            : (
                candidateElement.querySelector(
                    "h3"
                )?.textContent ||
                "Candidate"
            );


    console.log(
        "Selected candidate:",
        candidateName
    );


    showNotification(
        `${candidateName} selected.`,
        "success"
    );

}


/* =========================================================
   16. RESTORE CANDIDATE SELECTION
========================================================= */

function restoreCandidateSelection() {

    if (
        localStorage.getItem(
            "voteSubmitted"
        ) === "true"
    ) {
        return;
    }


    const savedId =
        localStorage.getItem(
            "selectedCandidateId"
        );


    if (!savedId) {
        return;
    }


    const id =
        Number(savedId);


    const element =
        document.querySelector(
            `.candidate[data-candidate-id="${id}"]`
        );


    if (!element) {
        return;
    }


    selectedCandidateId =
        id;


    element.classList.add(
        "selected"
    );


    const radio =
        element.querySelector(
            ".radio"
        );


    if (radio) {

        radio.classList.add(
            "selected"
        );

    }

}


/* =========================================================
   17. CHECK EXISTING VOTE
========================================================= */

async function checkExistingVote() {

    const token =
        localStorage.getItem(
            "accessToken"
        );


    if (!token) {
        return;
    }


    try {

        const response =
            await fetch(
                `${API_URL}/api/votes/my/${ELECTION_ID}`,
                {
                    method: "GET",

                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    }
                }
            );


        const data =
            await response.json();


        console.log(
            "Existing vote:",
            data
        );


        if (
            response.ok &&
            data.has_voted === true
        ) {

            /*
             * User already voted.
             */
            localStorage.setItem(
                "voteSubmitted",
                "true"
            );


            /*
             * Disable submit button.
             */
            const button =
                document.getElementById(
                    "submitVoteButton"
                );


            if (button) {

                button.disabled =
                    true;


                const span =
                    button.querySelector(
                        "span"
                    );


                if (span) {

                    span.textContent =
                        "Vote Already Submitted";

                }

            }


            /*
             * Disable candidates.
             */
            document
                .querySelectorAll(
                    ".candidate"
                )
                .forEach(
                    element => {

                        element.style.pointerEvents =
                            "none";

                        element.style.cursor =
                            "default";

                        element.style.opacity =
                            "0.7";

                    }
                );


        } else {

            /*
             * User has NOT voted.
             */
            if (
                localStorage.getItem(
                    "voteSubmitted"
                ) !== "true"
            ) {

                document
                    .querySelectorAll(
                        ".candidate"
                    )
                    .forEach(
                        element => {

                            element.style.pointerEvents =
                                "auto";

                            element.style.cursor =
                                "pointer";

                            element.style.opacity =
                                "1";

                        }
                    );


                const button =
                    document.getElementById(
                        "submitVoteButton"
                    );


                if (button) {

                    button.disabled =
                        false;


                    const span =
                        button.querySelector(
                            "span"
                        );


                    if (span) {

                        span.textContent =
                            "Submit Vote";

                    }

                }

            }

        }

    } catch (error) {

        console.error(
            "Existing vote check error:",
            error
        );

    }

}


/* =========================================================
   18. SUBMIT VOTE
========================================================= */

async function submitVote() {
    const token = localStorage.getItem("accessToken");

    console.log("========== SUBMIT VOTE DEBUG ==========");
    console.log("Token exists:", !!token);
    console.log("Selected candidate:", selectedCandidateId);
    console.log("Election ID:", ELECTION_ID);

    if (!token) {
        showNotification("Please login again.", "warning");
        console.error("No access token found.");
        return;
    }

    if (!selectedCandidateId) {
        showNotification("Please select a candidate first.", "warning");
        return;
    }

    const candidate = candidates.find(
        c => Number(c.id) === Number(selectedCandidateId)
    );

    if (!candidate) {
        showNotification("Selected candidate not found.", "warning");
        console.error("Candidate not found:", selectedCandidateId);
        return;
    }

    const confirmed = confirm(
        `Are you sure you want to vote for ${candidate.name}?`
    );

    if (!confirmed) {
        return;
    }

    const button = document.getElementById("submitVoteButton");

    if (button) {
        button.disabled = true;
        button.innerHTML = `
            <i class="fa-solid fa-spinner fa-spin"></i>
            <span>Submitting...</span>
        `;
    }

    try {
        const response = await fetch(`${API_URL}/api/votes/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                election_id: Number(ELECTION_ID),
                candidate_id: Number(selectedCandidateId)
            })
        });

        console.log("Backend HTTP status:", response.status);

        // Read response as text first so we can see even non-JSON errors
        const rawResponse = await response.text();

        console.log("Backend raw response:", rawResponse);

        let data = {};

        try {
            data = JSON.parse(rawResponse);
        } catch (jsonError) {
            console.warn("Backend did not return JSON.");
        }

        console.log("Backend parsed response:", data);

        if (!response.ok) {
            throw new Error(
                data.message ||
                data.msg ||
                rawResponse ||
                `HTTP ${response.status}`
            );
        }

        if (!data.success) {
            throw new Error(
                data.message ||
                "Vote submission failed."
            );
        }

        console.log("VOTE SUBMITTED SUCCESSFULLY:", data);

        localStorage.setItem("voteSubmitted", "true");
        localStorage.setItem(
            "lastVote",
            JSON.stringify({
                election_id: ELECTION_ID,
                candidate_id: selectedCandidateId,
                candidate_name: candidate.name
            })
        );

        selectedCandidateId = null;

        if (button) {
            button.disabled = true;
            button.innerHTML = `
                <i class="fa-solid fa-check"></i>
                <span>Vote Submitted</span>
            `;
        }

        document.querySelectorAll(".candidate").forEach(card => {
            card.classList.remove("selected");
            card.style.pointerEvents = "none";
        });

        showNotification(
            "Your vote has been submitted successfully!",
            "success"
        );

    } catch (error) {

        console.error("========== SUBMIT VOTE ERROR ==========");
        console.error(error);
        console.error("Error message:", error.message);

        showNotification(
            error.message || "Vote submission failed.",
            "warning"
        );

        // Restore button
        if (button) {
            button.disabled = false;
            button.innerHTML = `
                <i class="fa-solid fa-check"></i>
                <span>Submit Vote</span>
            `;
        }
    }
}


/* =========================================================
   20. GET LAST VOTE
========================================================= */

function getLastVote() {

    const vote =
        localStorage.getItem(
            "lastVote"
        );


    if (!vote) {
        return null;
    }


    try {

        return JSON.parse(
            vote
        );

    } catch (error) {

        console.error(
            "Unable to read last vote:",
            error
        );

        return null;

    }

}


/* =========================================================
   21. NOTIFICATION
========================================================= */

function showNotification(
    message,
    type = "success"
) {

    /*
     * Remove old notification.
     */
    const existing =
        document.querySelector(
            ".custom-notification"
        );


    if (existing) {
        existing.remove();
    }


    /*
     * Create notification.
     */
    const notification =
        document.createElement(
            "div"
        );


    notification.className =
        "custom-notification";


    if (type === "warning") {

        notification.classList.add(
            "warning"
        );

    }


    /*
     * Icon.
     */
    const icon =
        document.createElement(
            "i"
        );


    if (type === "warning") {

        icon.className =
            "fa-solid fa-triangle-exclamation";

    } else {

        icon.className =
            "fa-solid fa-circle-check";

    }


    /*
     * Text.
     */
    const text =
        document.createElement(
            "span"
        );


    text.textContent =
        String(message);


    notification.appendChild(
        icon
    );

    notification.appendChild(
        text
    );


    document.body.appendChild(
        notification
    );


    /*
     * Remove after 4 seconds.
     */
    setTimeout(
        function () {

            if (
                notification &&
                notification.parentNode
            ) {

                notification.style.opacity =
                    "0";

                notification.style.transform =
                    "translateX(30px)";

                notification.style.transition =
                    "all .25s ease";


                setTimeout(
                    function () {

                        if (
                            notification.parentNode
                        ) {

                            notification.remove();

                        }

                    },
                    250
                );

            }

        },
        4000
    );

}


/* =========================================================
   22. HTML ESCAPE
========================================================= */

function escapeHTML(value) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        String(
            value ?? ""
        );


    return div.innerHTML;

}


/* =========================================================
   23. CHECK LOGIN
========================================================= */

function isLoggedIn() {

    return (
        localStorage.getItem(
            "loggedIn"
        ) === "true"
    );

}


/* =========================================================
   24. PROTECT PAGE
========================================================= */

function protectPage() {

    if (!isLoggedIn()) {

        window.location.href =
            "login.html";

    }

}


/* =========================================================
   25. INITIALIZE ANIMATIONS
========================================================= */

function initializeAnimations() {

    const cards =
        document.querySelectorAll(
            ".stat-card, .dashboard-card, .hero-banner"
        );


    if (!cards.length) {
        return;
    }


    cards.forEach(
        (card, index) => {

            card.style.opacity =
                "0";

            card.style.transform =
                "translateY(8px)";

            card.style.transition =
                `opacity .4s ease ${index * 0.05}s,
                 transform .4s ease ${index * 0.05}s`;


            requestAnimationFrame(
                function () {

                    card.style.opacity =
                        "1";

                    card.style.transform =
                        "translateY(0)";

                }
            );

        }
    );

}


/* =========================================================
   26. WINDOW RESIZE
========================================================= */

window.addEventListener(
    "resize",
    function () {

        const sidebar =
            document.querySelector(
                ".sidebar"
            );


        if (
            sidebar &&
            window.innerWidth > 950
        ) {

            sidebar.classList.remove(
                "open"
            );

        }

    }
);


/* =========================================================
   27. CLOSE SIDEBAR ON OUTSIDE CLICK
========================================================= */

document.addEventListener(
    "click",
    function (event) {

        const sidebar =
            document.querySelector(
                ".sidebar"
            );


        const mobileButton =
            document.getElementById(
                "mobileMenuBtn"
            );


        if (
            !sidebar ||
            !mobileButton ||
            window.innerWidth > 950
        ) {

            return;

        }


        const clickedInsideSidebar =
            sidebar.contains(
                event.target
            );


        const clickedMenuButton =
            mobileButton.contains(
                event.target
            );


        if (
            !clickedInsideSidebar &&
            !clickedMenuButton
        ) {

            sidebar.classList.remove(
                "open"
            );

        }

    }
);


/* =========================================================
   28. EXPORT GLOBAL FUNCTIONS
========================================================= */

window.goToVote =
    goToVote;

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


/* =========================================================
   29. CONSOLE MESSAGE
========================================================= */

console.log(
    "%c VoteSecure ",
    "background:#2563eb;color:#fff;padding:5px 10px;border-radius:5px;font-weight:bold;"
);

console.log(
    "Secure Online Voting System initialized successfully."
);