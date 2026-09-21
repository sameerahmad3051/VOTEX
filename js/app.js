javascript
/* =========================================================
   VOTESECURE - APP.JS
   Premium Online Voting System
========================================================= */


/* =========================================================
   1. GLOBAL DATA
========================================================= */

const candidates = [
    {
        id: 1,
        name: "Aarav Sharma",
        department: "Computer Science",
        votes: 4850,
        image: "https://i.pravatar.cc/100?img=11"
    },
    {
        id: 2,
        name: "Priya Verma",
        department: "Electronics",
        votes: 3920,
        image: "https://i.pravatar.cc/100?img=47"
    },
    {
        id: 3,
        name: "Rohan Mehta",
        department: "Mechanical",
        votes: 3010,
        image: "https://i.pravatar.cc/100?img=13"
    }
];

let selectedCandidateId = null;


/* =========================================================
   2. DOM READY
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    initializeApp();

});


/* =========================================================
   3. INITIALIZE APPLICATION
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

}


/* =========================================================
   4. USER INITIALIZATION
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
            escapeHTML(storedUserName);
    }


    /* Welcome username */

    const welcomeUserName =
        document.getElementById("welcomeUserName");

    if (welcomeUserName) {
        welcomeUserName.textContent =
            escapeHTML(shortName);
    }


    /* Store default user */

    if (!localStorage.getItem("userName")) {
        localStorage.setItem(
            "userName",
            storedUserName
        );
    }

}


/* =========================================================
   5. DATE
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
   6. VOTE COUNT
========================================================= */

function initializeVoteCount() {

    const voteCount =
        document.getElementById("voteCount");

    if (!voteCount) {
        return;
    }

    const voteSubmitted =
        localStorage.getItem("voteSubmitted") === "true";

    voteCount.textContent =
        voteSubmitted ? "01" : "00";

}


/* =========================================================
   7. SEARCH
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

            elections.forEach(election => {

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

            });

        }
    );

}


/* =========================================================
   8. MOBILE SIDEBAR
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
        () => {

            sidebar.classList.toggle(
                "open"
            );

        }
    );


    /* Close sidebar after clicking menu */

    const menuItems =
        document.querySelectorAll(
            ".sidebar .menu-item"
        );

    menuItems.forEach(item => {

        item.addEventListener(
            "click",
            () => {

                if (
                    window.innerWidth <= 950
                ) {

                    sidebar.classList.remove(
                        "open"
                    );

                }

            }
        );

    });

}


/* =========================================================
   9. ACTIVE MENU
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

    menuItems.forEach(item => {

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
                menu => menu.classList.remove(
                    "active"
                )
            );

            item.classList.add("active");

        }

    });


    /* Dashboard should remain active on index */

    if (
        currentPage === "" ||
        currentPage === "index.html"
    ) {

        menuItems.forEach(
            menu => menu.classList.remove(
                "active"
            )
        );

        const dashboard =
            document.querySelector(
                '.menu-item[href="index.html"]'
            );

        if (dashboard) {
            dashboard.classList.add("active");
        }

    }

}


/* =========================================================
   10. CANDIDATE INTERACTIONS
========================================================= */

function initializeCandidateInteractions() {

    const candidatesElements =
        document.querySelectorAll(
            ".quick-candidate"
        );

    candidatesElements.forEach(
        candidate => {

            candidate.addEventListener(
                "click",
                () => {

                    const name =
                        candidate
                            .querySelector(
                                "strong"
                            );

                    if (!name) {
                        return;
                    }

                    const candidateName =
                        name.textContent.trim();

                    showNotification(
                        `${candidateName} selected.`
                    );

                }
            );

        }
    );

}


/* =========================================================
   11. GO TO VOTE
========================================================= */

function goToVote() {

    window.location.href =
        "vote.html";

}


/* =========================================================
   12. LOGOUT
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
        "selectedCandidate"
    );


    showNotification(
        "You have been logged out.",
        "success"
    );


    setTimeout(() => {

        window.location.href =
            "login.html";

    }, 700);

}


/* =========================================================
   13. SELECT CANDIDATE
========================================================= */

function selectCandidate(candidateId) {

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


    const candidate =
        candidates.find(
            item =>
                item.id === Number(candidateId)
        );

    if (!candidate) {
        return;
    }


    selectedCandidateId =
        candidate.id;


    const candidateElements =
        document.querySelectorAll(
            ".candidate"
        );

    candidateElements.forEach(
        element => {

            element.classList.remove(
                "selected"
            );

        }
    );


    const selectedElement =
        document.querySelector(
            `.candidate[data-candidate-id="${candidate.id}"]`
        );

    if (selectedElement) {

        selectedElement.classList.add(
            "selected"
        );

    }

}


/* =========================================================
   14. SUBMIT VOTE
========================================================= */

function submitVote() {

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


    if (!selectedCandidateId) {

        showNotification(
            "Please select a candidate first.",
            "warning"
        );

        return;
    }


    const candidate =
        candidates.find(
            item =>
                item.id === selectedCandidateId
        );

    if (!candidate) {

        showNotification(
            "Candidate not found.",
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


    /*
       Save vote information locally.

       NOTE:
       This is frontend/demo storage only.
       Real elections require a secure backend.
    */

    localStorage.setItem(
        "voteSubmitted",
        "true"
    );

    localStorage.setItem(
        "lastVote",
        JSON.stringify({
            candidateId: candidate.id,
            candidateName: candidate.name,
            submittedAt:
                new Date().toISOString()
        })
    );


    /* Update submit button */

    const submitButton =
        document.getElementById(
            "submitVoteButton"
        );

    if (submitButton) {

        submitButton.textContent =
            "Vote Submitted";

        submitButton.disabled = true;

        submitButton.classList.add(
            "submitted"
        );

    }


    /* Disable candidate selection */

    const candidateElements =
        document.querySelectorAll(
            ".candidate"
        );

    candidateElements.forEach(
        element => {

            element.style.pointerEvents =
                "none";

        }
    );


    /* Update vote count */

    const voteCount =
        document.getElementById(
            "voteCount"
        );

    if (voteCount) {
        voteCount.textContent = "01";
    }


    showNotification(
        "Your vote has been submitted successfully."
    );

}


/* =========================================================
   15. GET USER NAME
========================================================= */

function getUserName() {

    return (
        localStorage.getItem("userName") ||
        "Sameer Ahmad"
    );

}


/* =========================================================
   16. GET LAST VOTE
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

        return JSON.parse(vote);

    } catch (error) {

        console.error(
            "Unable to read last vote:",
            error
        );

        return null;
    }

}


/* =========================================================
   17. NOTIFICATION
========================================================= */

function showNotification(
    message,
    type = "success"
) {

    /* Remove previous notification */

    const existing =
        document.querySelector(
            ".custom-notification"
        );

    if (existing) {
        existing.remove();
    }


    /* Create notification */

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


    const icon =
        document.createElement("i");


    if (type === "warning") {

        icon.className =
            "fa-solid fa-triangle-exclamation";

    } else {

        icon.className =
            "fa-solid fa-circle-check";

    }


    const text =
        document.createElement("span");

    text.textContent =
        String(message);


    notification.appendChild(icon);

    notification.appendChild(text);

    document.body.appendChild(
        notification
    );


    /* Auto remove */

    setTimeout(() => {

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


            setTimeout(() => {

                if (
                    notification.parentNode
                ) {

                    notification.remove();

                }

            }, 250);

        }

    }, 4000);

}


/* =========================================================
   18. HTML ESCAPE
========================================================= */

function escapeHTML(value) {

    const div =
        document.createElement("div");

    div.textContent =
        String(value ?? "");

    return div.innerHTML;

}


/* =========================================================
   19. CHECK LOGIN
========================================================= */

function isLoggedIn() {

    return (
        localStorage.getItem(
            "loggedIn"
        ) === "true"
    );

}


/* =========================================================
   20. PROTECT PAGE
========================================================= */

function protectPage() {

    if (!isLoggedIn()) {

        window.location.href =
            "login.html";

    }

}


/* =========================================================
   21. INITIALIZE ANIMATIONS
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

            card.style.opacity = "0";

            card.style.transform =
                "translateY(8px)";


            card.style.transition =
                `opacity .4s ease ${index * 0.05}s,
                 transform .4s ease ${index * 0.05}s`;


            requestAnimationFrame(() => {

                card.style.opacity = "1";

                card.style.transform =
                    "translateY(0)";

            });

        }
    );

}


/* =========================================================
   22. HANDLE WINDOW RESIZE
========================================================= */

window.addEventListener(
    "resize",
    () => {

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
   23. CLOSE SIDEBAR ON OUTSIDE CLICK
========================================================= */

document.addEventListener(
    "click",
    event => {

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
            sidebar.contains(event.target);

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
   24. EXPORT GLOBAL FUNCTIONS
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
   25. CONSOLE MESSAGE
========================================================= */

console.log(
    "%c VoteSecure ",
    "background:#2563eb;color:#fff;padding:5px 10px;border-radius:5px;font-weight:bold;"
);

console.log(
    "Secure Online Voting System initialized successfully."
);