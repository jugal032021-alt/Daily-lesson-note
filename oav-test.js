/* =========================================================
   OAV-2026 TEST SYSTEM
   Questions = Local JSON
   Firebase = Registration + Attempt + Result + Leaderboard
   ========================================================= */

const oavDb = firebase.firestore();

let currentTestId = null;
let currentSubject = null;
let testQuestions = [];
let currentQuestionIndex = 0;
let studentAnswers = {};
let timerInterval = null;
let testDurationSeconds = 30 * 60;


/* =========================================================
   PAGE START
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    if (document.getElementById("questionBox")) {
        initializeTestPage();
    }

    if (document.getElementById("resScore")) {
        loadResultPage();
    }

});

/* =====================================================
   STUDENT REGISTRATION
   Firebase: ONLY ONE WRITE
   ===================================================== */

async function registerStudent(event) {

    event.preventDefault();

    const name =
        document.getElementById("regName").value.trim();

    const school =
        document.getElementById("regSchool").value.trim();

    const city =
        document.getElementById("regCity").value.trim();

    const mobile =
        document.getElementById("regMobile").value.trim();


    /* VALIDATION */

    if (!name || !school || !city || !mobile) {

        alert("Please fill all details.");

        return;
    }


    if (!/^[0-9]{10}$/.test(mobile)) {

        alert("Please enter a valid 10-digit mobile number.");

        return;
    }


    try {

        /* SAVE STUDENT */

        await oavDb
            .collection("oav_students")
            .doc(mobile)
            .set({

                name: name,
                school: school,
                city: city,
                mobile: mobile,

                registeredAt:
                    firebase.firestore.FieldValue.serverTimestamp()

            }, {
                merge: true
            });


        /* SAVE MOBILE LOCALLY */

        localStorage.setItem(
            "oav_student_mobile",
            mobile
        );


        /* HIDE REGISTRATION */

        const regSection =
            document.getElementById("regSection");

        const dashboardSection =
            document.getElementById("dashboardSection");


        if (regSection) {

            regSection.style.display = "none";

        }


        if (dashboardSection) {

            dashboardSection.style.display = "block";

        }


        /* WELCOME MESSAGE */

        const welcomeMsg =
            document.getElementById("welcomeMsg");

        if (welcomeMsg) {

            welcomeMsg.innerText =
                "Welcome, " + name + "!";

        }


        /* STUDENT DETAILS */

        const studentMeta =
            document.getElementById("studentMeta");

        if (studentMeta) {

            studentMeta.innerText =
                school + " • " + city;

        }


        /* CLEAR FORM */

        const form =
            document.getElementById("studentRegForm");

        if (form) {

            form.reset();

        }


        alert(
            "Registration successful! You can now start the practice tests."
        );


    } catch (error) {

        console.error(
            "Registration error:",
            error
        );

        alert(
            "Registration failed. Please check your internet connection and try again."
        );

    }

}
/* =========================================================
   LOAD AVAILABLE TESTS
   ========================================================= */

async function loadAvailableTests() {

    const container =
        document.getElementById("testsListContainer");

    if (!container) return;

    try {

        const snapshot = await oavDb
            .collection("oav_tests")
            .get();

        if (snapshot.empty) {

            container.innerHTML = `
                <p style="text-align:center;color:#777;">
                    No practice tests available yet.
                </p>
            `;

            return;
        }

        container.innerHTML = "";

        snapshot.forEach(function(doc) {

            const data = doc.data();

            const testId = doc.id;

            const testName =
                data.testName || "OAV Practice Test";

            const subjects =
                data.subjects || [
                    "Mathematics",
                    "EVS",
                    "English"
                ];

            let subjectButtons = "";

            subjects.forEach(function(subject) {

                subjectButtons += `
                    <a href="oav-test.html?test=${encodeURIComponent(testId)}&subject=${encodeURIComponent(subject)}"
                       style="
                       display:inline-block;
                       margin:5px;
                       padding:10px 15px;
                       background:#0044cc;
                       color:white;
                       text-decoration:none;
                       border-radius:6px;
                       font-weight:bold;
                       ">
                       ${subject}
                    </a>
                `;

            });

            container.innerHTML += `
                <div style="
                    background:#f8f9fa;
                    border:1px solid #ddd;
                    border-radius:8px;
                    padding:15px;
                    margin-bottom:15px;
                ">

                    <h4 style="
                        margin:0 0 8px 0;
                        color:#0044cc;
                    ">
                        ${escapeHTML(testName)}
                    </h4>

                    <p style="
                        margin:5px 0 10px 0;
                        color:#666;
                    ">
                        30 Marks • 30 Minutes
                    </p>

                    <div>
                        ${subjectButtons}
                    </div>

                </div>
            `;

        });

    } catch (error) {

        console.error(
            "Load tests error:",
            error
        );

        container.innerHTML = `
            <p style="
                text-align:center;
                color:red;
            ">
                Unable to load practice tests.
            </p>
        `;

    }
}
/* =========================================================
   LOAD QUESTIONS FROM JSON
   ========================================================= */

async function loadQuestionsFromJSON(testId, subject) {

    const fileName =
        `oav-data/${encodeURIComponent(testId)}-${encodeURIComponent(subject)}.json`;

    console.log("Loading questions:", fileName);

    const response = await fetch(fileName, {
        cache: "force-cache"
    });

    if (!response.ok) {
        throw new Error(
            "Question file not found: " + fileName
        );
    }

    const questions = await response.json();

    if (!Array.isArray(questions)) {
        throw new Error("Invalid question JSON format.");
    }

    if (questions.length === 0) {
        throw new Error("No questions available.");
    }

    return questions;
}


/* =========================================================
   INITIALIZE TEST
   ========================================================= */

async function initializeTestPage() {

    const params = new URLSearchParams(window.location.search);

    currentTestId = params.get("test");
    currentSubject = params.get("subject");

    const mobile =
        localStorage.getItem("oav_student_mobile");

    if (!mobile) {

        alert("Please register first.");

        window.location.href =
            "oav-2026.html";

        return;
    }


    if (!currentTestId || !currentSubject) {

        showStatus(
            "Invalid test information."
        );

        return;
    }


    try {

        /* -----------------------------------------
           CHECK ALREADY ATTEMPTED
           ----------------------------------------- */

        const attemptSnapshot =
            await oavDb
                .collection("oav_attempts")
                .where(
                    "studentMobile",
                    "==",
                    mobile
                )
                .where(
                    "testId",
                    "==",
                    currentTestId
                )
                .where(
                    "subject",
                    "==",
                    currentSubject
                )
                .limit(1)
                .get();


        if (!attemptSnapshot.empty) {

            document.getElementById(
                "questionBox"
            ).style.display = "none";


            document.getElementById(
                "timerDisplay"
            ).style.display = "none";


            showStatus(`
                <div class="already-attempted">

                    <h3>
                        ⚠️ You have already attempted this test.
                    </h3>

                    <p>
                        You can attempt each subject only once.
                    </p>

                    <a href="oav-result.html?test=${encodeURIComponent(currentTestId)}&subject=${encodeURIComponent(currentSubject)}">
                        View Result →
                    </a>

                </div>
            `);

            return;
        }


        /* -----------------------------------------
           LOAD TEST INFORMATION
           ----------------------------------------- */

        const testDoc =
            await oavDb
                .collection("oav_tests")
                .doc(currentTestId)
                .get();


        if (testDoc.exists) {

            const data = testDoc.data();

            testDurationSeconds =
                (data.duration || 30) * 60;


            const nameElement =
                document.getElementById(
                    "lblTestName"
                );

            if (nameElement) {

                nameElement.innerText =
                    "Test: " +
                    (data.testName ||
                    "OAV Practice Test");

            }

        }


        const subjectElement =
            document.getElementById(
                "lblSubject"
            );

        if (subjectElement) {

            subjectElement.innerText =
                "Subject: " +
                currentSubject;

        }


        const marksElement =
            document.getElementById(
                "lblTotalMarks"
            );

        if (marksElement) {

            marksElement.innerText =
                "Marks: 30";

        }


        /* -----------------------------------------
           LOAD QUESTIONS FROM LOCAL JSON
           ----------------------------------------- */

        testQuestions =
            await loadQuestionsFromJSON(
                currentTestId,
                currentSubject
            );


        /* Only maximum 30 questions */

        testQuestions =
            testQuestions.slice(0, 30);


        if (testQuestions.length === 0) {

            throw new Error(
                "No questions found."
            );

        }


        /* -----------------------------------------
           START TEST
           ----------------------------------------- */

        const status =
            document.getElementById(
                "testStatusMsg"
            );

        if (status) {

            status.style.display =
                "none";

        }


        document.getElementById(
            "questionBox"
        ).style.display = "block";


        startTimer();

        renderQuestion();


    } catch (error) {

        console.error(error);

        showStatus(
            "Error loading test: " +
            error.message
        );

    }

}


/* =========================================================
   SHOW STATUS
   ========================================================= */

function showStatus(message) {

    const element =
        document.getElementById(
            "testStatusMsg"
        );

    if (!element) return;

    element.innerHTML = message;

    element.style.display =
        "block";

}


/* =========================================================
   TIMER
   ========================================================= */

function startTimer() {

    let remaining =
        testDurationSeconds;


    const timer =
        document.getElementById(
            "timeRemaining"
        );


    timerInterval =
        setInterval(function () {

            const minutes =
                Math.floor(
                    remaining / 60
                );

            const seconds =
                remaining % 60;


            timer.innerText =
                String(minutes)
                .padStart(2, "0")
                +
                ":"
                +
                String(seconds)
                .padStart(2, "0");


            if (remaining <= 0) {

                clearInterval(
                    timerInterval
                );

                submitTest(true);

                return;

            }


            remaining--;

        }, 1000);

}


/* =========================================================
   DISPLAY QUESTION
   ========================================================= */

function renderQuestion() {

    const question =
        testQuestions[
            currentQuestionIndex
        ];


    if (!question) return;


    const numberTitle =
        document.getElementById(
            "qNumberTitle"
        );


    if (numberTitle) {

        numberTitle.innerText =
            `Question ${currentQuestionIndex + 1} of ${testQuestions.length}`;

    }


    const questionText =
        document.getElementById(
            "qText"
        );


    if (questionText) {

        questionText.innerText =
            question.question;

    }


    const options =
        document.getElementById(
            "optionsContainer"
        );


    if (!options) return;


    options.innerHTML = "";


    const optionList = [

        ["A", question.optionA],

        ["B", question.optionB],

        ["C", question.optionC],

        ["D", question.optionD]

    ];


    optionList.forEach(
        function ([key, text]) {

            const label =
                document.createElement(
                    "label"
                );


            label.className =
                "option-label";


            label.innerHTML = `

                <input
                    type="radio"
                    name="examOption"
                    value="${key}"
                >

                <span>
                    <b>${key}.</b>
                    ${escapeHTML(text || "")}
                </span>

            `;


            const radio =
                label.querySelector(
                    "input"
                );


            radio.checked =
                studentAnswers[
                    currentQuestionIndex
                ] === key;


            radio.onclick =
                function () {

                    selectAnswer(key);

                };


            options.appendChild(
                label
            );

        }
    );


    updateButtons();

}


/* =========================================================
   SELECT ANSWER
   ========================================================= */

function selectAnswer(answer) {

    studentAnswers[
        currentQuestionIndex
    ] = answer;


    renderQuestion();

}


/* =========================================================
   NEXT QUESTION
   ========================================================= */

function nextQuestion() {

    if (
        currentQuestionIndex <
        testQuestions.length - 1
    ) {

        currentQuestionIndex++;

        renderQuestion();

    }

}


/* =========================================================
   PREVIOUS QUESTION
   ========================================================= */

function prevQuestion() {

    if (
        currentQuestionIndex > 0
    ) {

        currentQuestionIndex--;

        renderQuestion();

    }

}


/* =========================================================
   BUTTON CONTROL
   ========================================================= */

function updateButtons() {

    const previous =
        document.getElementById(
            "btnPrev"
        );

    const next =
        document.getElementById(
            "btnNext"
        );

    const submit =
        document.getElementById(
            "btnSubmitTest"
        );


    if (previous) {

        previous.style.display =
            currentQuestionIndex === 0
            ? "none"
            : "inline-block";

    }


    if (next) {

        next.style.display =
            currentQuestionIndex ===
            testQuestions.length - 1
            ? "none"
            : "inline-block";

    }


    if (submit) {

        submit.style.display =
            currentQuestionIndex ===
            testQuestions.length - 1
            ? "inline-block"
            : "none";

    }

}


/* =========================================================
   CONFIRM SUBMIT
   ========================================================= */

function confirmSubmitTest() {

    const answerCount =
        Object.keys(
            studentAnswers
        ).length;


    const message =
        `You answered ${answerCount} of ${testQuestions.length} questions.\n\nSubmit test?`;


    if (
        confirm(message)
    ) {

        clearInterval(
            timerInterval
        );

        submitTest(false);

    }

}


/* =========================================================
   SUBMIT TEST
   ========================================================= */

async function submitTest(autoSubmit) {

    const mobile =
        localStorage.getItem(
            "oav_student_mobile"
        );


    if (!mobile) {

        alert(
            "Student information not found."
        );

        return;

    }


    try {

        /* -----------------------------------------
           GET STUDENT
           ----------------------------------------- */

        const studentDoc =
            await oavDb
                .collection("oav_students")
                .doc(mobile)
                .get();


        const student =
            studentDoc.exists
            ? studentDoc.data()
            : {
                name: "Student",
                school: "N/A",
                city: "N/A"
            };


        /* -----------------------------------------
           CALCULATE SCORE
           ----------------------------------------- */

        let correct = 0;


        testQuestions.forEach(
            function (question, index) {

                if (
                    studentAnswers[index] ===
                    question.correctAnswer
                ) {

                    correct++;

                }

            }
        );


        const total =
            testQuestions.length;


        const wrong =
            total - correct;


        const percentage =
            Math.round(
                (correct / total) * 100
            );


        /* -----------------------------------------
           SAVE ATTEMPT
           ----------------------------------------- */

        await oavDb
            .collection("oav_attempts")
            .add({

                studentMobile:
                    mobile,

                testId:
                    currentTestId,

                subject:
                    currentSubject,

                attempted:
                    true,

                submittedAt:
                    firebase.firestore
                    .FieldValue
                    .serverTimestamp()

            });


        /* -----------------------------------------
           SAVE RESULT
           ----------------------------------------- */

        await oavDb
            .collection("oav_results")
            .add({

                studentMobile:
                    mobile,

                studentName:
                    student.name,

                school:
                    student.school,

                city:
                    student.city,

                testId:
                    currentTestId,

                subject:
                    currentSubject,

                score:
                    correct,

                totalMarks:
                    total,

                percentage:
                    percentage,

                correct:
                    correct,

                wrong:
                    wrong,

                createdAt:
                    firebase.firestore
                    .FieldValue
                    .serverTimestamp()

            });


        /* -----------------------------------------
           SAVE QUESTIONS TEMPORARILY IN BROWSER
           ----------------------------------------- */

        sessionStorage.setItem(
            "oav_last_submission",
            JSON.stringify({

                testId:
                    currentTestId,

                subject:
                    currentSubject,

                questions:
                    testQuestions,

                studentAnswers:
                    studentAnswers

            })
        );


        /* -----------------------------------------
           GO TO RESULT
           ----------------------------------------- */

        window.location.href =
            `oav-result.html?test=${encodeURIComponent(currentTestId)}&subject=${encodeURIComponent(currentSubject)}`;


    } catch (error) {

        console.error(error);

        alert(
            "Submit error: " +
            error.message
        );

    }

}


/* =========================================================
   RESULT PAGE
   ========================================================= */

async function loadResultPage() {

    const params =
        new URLSearchParams(
            window.location.search
        );


    const testId =
        params.get("test");


    const subject =
        params.get("subject");


    const mobile =
        localStorage.getItem(
            "oav_student_mobile"
        );


    if (
        !testId ||
        !subject ||
        !mobile
    ) {

        return;

    }


    try {

        /* -----------------------------------------
           MY RESULT
           ----------------------------------------- */

        const myResult =
            await oavDb
                .collection("oav_results")
                .where(
                    "studentMobile",
                    "==",
                    mobile
                )
                .where(
                    "testId",
                    "==",
                    testId
                )
                .where(
                    "subject",
                    "==",
                    subject
                )
                .limit(1)
                .get();


        if (!myResult.empty) {

            const data =
                myResult.docs[0].data();


            setText(
                "resTestDetails",
                "Subject: " + subject
            );


            setText(
                "resScore",
                `${data.score} / ${data.totalMarks}`
            );


            setText(
                "resPercentage",
                `${data.percentage}%`
            );


            setText(
                "resCorrectWrong",
                `${data.correct} / ${data.wrong}`
            );


        }


        /* -----------------------------------------
           TOP 10 LEADERBOARD
           ----------------------------------------- */

        const leaderboard =
            await oavDb
                .collection("oav_results")
                .where(
                    "testId",
                    "==",
                    testId
                )
                .where(
                    "subject",
                    "==",
                    subject
                )
                .orderBy(
                    "score",
                    "desc"
                )
                .limit(10)
                .get();


        const rows =
            document.getElementById(
                "leaderboardRows"
            );


        if (!rows) return;


        rows.innerHTML = "";


        let rank = 1;


        leaderboard.forEach(
            function (doc) {

                const data =
                    doc.data();


                rows.innerHTML += `

                    <tr>

                        <td>${rank}</td>

                        <td>
                            ${escapeHTML(
                                data.studentName ||
                                "Student"
                            )}
                        </td>

                        <td>
                            ${escapeHTML(
                                data.school ||
                                "N/A"
                            )}
                        </td>

                        <td>
                            ${escapeHTML(
                                data.city ||
                                "N/A"
                            )}
                        </td>

                        <td>
                            <b>
                                ${data.score}/${data.totalMarks}
                            </b>
                        </td>

                    </tr>

                `;


                rank++;

            }
        );


    } catch (error) {

        console.error(
            "Result error:",
            error
        );

    }

}


/* =========================================================
   HELPERS
   ========================================================= */

function setText(id, value) {

    const element =
        document.getElementById(id);


    if (element) {

        element.innerText =
            value;

    }

}


function escapeHTML(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}
