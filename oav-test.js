/* =========================================================
   OAV-2026 TEST SYSTEM
   ========================================================= */

const oavDb = firebase.firestore();

let currentTestId = null;
let currentSubject = null;
let testQuestions = [];
let currentQuestionIndex = 0;
let studentAnswers = {};
let timerInterval = null;
let testDurationSeconds = 30 * 60;

document.addEventListener("DOMContentLoaded", function () {
    if (document.getElementById("regSection")) {
        if (localStorage.getItem("oav_student_mobile")) {
            document.getElementById("regSection").style.display = "none";
            const dashboard = document.getElementById("dashboardSection");
            if (dashboard) dashboard.style.display = "block";
        }
        restoreRegisteredStudent();
    }
    if (document.getElementById("questionBox")) initializeTestPage();
    if (document.getElementById("resScore")) loadResultPage();
});

async function restoreRegisteredStudent() {
    const mobile = localStorage.getItem("oav_student_mobile");
    if (!mobile) return;
    try {
        const doc = await oavDb.collection("oav_students").doc(mobile).get();
        if (!doc.exists) {
            localStorage.removeItem("oav_student_mobile");
            return;
        }
        const student = doc.data();
        document.getElementById("regSection").style.display = "none";
        const dashboard = document.getElementById("dashboardSection");
        if (dashboard) dashboard.style.display = "block";
        
        const welcome = document.getElementById("welcomeMsg");
        if (welcome) welcome.innerText = "Welcome, " + (student.name || "Student") + "!";
        
        const meta = document.getElementById("studentMeta");
        if (meta) meta.innerText = (student.school || "") + " • " + (student.city || "");
        
        loadAvailableTests();
    } catch (error) {
        console.error("Restore error:", error);
    }
}

async function registerStudent(event) {
    event.preventDefault();
    const name = document.getElementById("regName").value.trim();
    const school = document.getElementById("regSchool").value.trim();
    const city = document.getElementById("regCity").value.trim();
    const mobile = document.getElementById("regMobile").value.trim();

    if (!name || !school || !city || !mobile) {
        alert("Please fill all details.");
        return;
    }
    if (!/^[0-9]{10}$/.test(mobile)) {
        alert("Please enter a valid 10-digit mobile number.");
        return;
    }

    try {
        await oavDb.collection("oav_students").doc(mobile).set({
            name, school, city, mobile,
            registeredAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        localStorage.setItem("oav_student_mobile", mobile);
        document.getElementById("regSection").style.display = "none";
        document.getElementById("dashboardSection").style.display = "block";
        
        document.getElementById("welcomeMsg").innerText = "Welcome, " + name + "!";
        document.getElementById("studentMeta").innerText = school + " • " + city;
        
        const form = document.getElementById("studentRegForm");
        if (form) form.reset();
        
        alert("Registration successful! You can now start the practice tests.");
        loadAvailableTests();
    } catch (error) {
        console.error("Registration error:", error);
        alert("Registration failed. Please check your connection.");
    }
}

async function loadAvailableTests() {
    const container = document.getElementById("testsListContainer");
    if (!container) return;
    try {
        const snapshot = await oavDb.collection("oav_tests").get();
        if (snapshot.empty) {
            container.innerHTML = `<p style="text-align:center;color:#777;">No practice tests available yet.</p>`;
            return;
        }
        container.innerHTML = "";
        snapshot.forEach(function (doc) {
            const data = doc.data();
            const testId = doc.id;
            const testName = data.testName || "OAV Practice Test";
            const subjects = data.subjects || ["Mathematics", "EVS", "English"];
            let subjectButtons = "";

            subjects.forEach(function (subject) {
                subjectButtons += `
                    <a href="oav-test.html?test=${encodeURIComponent(testId)}&subject=${encodeURIComponent(subject)}"
                       style="display:inline-block;margin:5px;padding:10px 15px;background:#0044cc;color:white;text-decoration:none;border-radius:6px;font-weight:bold;">
                       ${escapeHTML(subject)}
                    </a>`;
            });

            container.innerHTML += `
                <div style="background:#f8f9fa;border:1px solid #ddd;border-radius:8px;padding:15px;margin-bottom:15px;">
                    <h4 style="margin:0 0 8px 0;color:#0044cc;">${escapeHTML(testName)}</h4>
                    <p style="margin:5px 0 10px 0;color:#666;">30 Marks • 30 Minutes</p>
                    <div>${subjectButtons}</div>
                </div>`;
        });
    } catch (error) {
        console.error("Load tests error:", error);
        container.innerHTML = `<p style="text-align:center;color:red;">Unable to load practice tests.</p>`;
    }
}

async function loadQuestionsFromJSON(testId, subject) {
    const fileName = `oav-data/${encodeURIComponent(testId)}-${encodeURIComponent(subject)}.json`;
    const response = await fetch(fileName);
    if (!response.ok) throw new Error("Question file not found: " + fileName);
    const questions = await response.json();
    if (!Array.isArray(questions) || questions.length === 0) throw new Error("Invalid or empty question format.");
    return questions;
}

async function initializeTestPage() {
    const params = new URLSearchParams(window.location.search);
    currentTestId = params.get("test");
    currentSubject = params.get("subject");
    const mobile = localStorage.getItem("oav_student_mobile");

    if (!mobile) {
        alert("Please register first.");
        window.location.href = "oav-2026.html";
        return;
    }
    if (!currentTestId || !currentSubject) {
        showStatus("Invalid test information.");
        return;
    }

    try {
        const attemptSnapshot = await oavDb.collection("oav_attempts")
            .where("studentMobile", "==", mobile)
            .where("testId", "==", currentTestId)
            .where("subject", "==", currentSubject)
            .limit(1).get();

        if (!attemptSnapshot.empty) {
            document.getElementById("questionBox").style.display = "none";
            document.getElementById("timerDisplay").style.display = "none";
            showStatus(`
                <div class="already-attempted">
                    <h3>⚠️ You have already attempted this test.</h3>
                    <p>You can attempt each subject only once.</p>
                    <a href="oav-result.html?test=${encodeURIComponent(currentTestId)}&subject=${encodeURIComponent(currentSubject)}">View Result →</a>
                </div>`);
            return;
        }

        const testDoc = await oavDb.collection("oav_tests").doc(currentTestId).get();
        if (testDoc.exists) {
            testDurationSeconds = (testDoc.data().duration || 30) * 60;
            const nameEl = document.getElementById("lblTestName");
            if (nameEl) nameEl.innerText = "Test: " + (testDoc.data().testName || "OAV Practice Test");
        }

        const subEl = document.getElementById("lblSubject");
        if (subEl) subEl.innerText = "Subject: " + currentSubject;
        const marksEl = document.getElementById("lblTotalMarks");
        if (marksEl) marksEl.innerText = "Marks: 30";

        testQuestions = await loadQuestionsFromJSON(currentTestId, currentSubject);
        testQuestions = testQuestions.slice(0, 30);

        document.getElementById("testStatusMsg").style.display = "none";
        document.getElementById("questionBox").style.display = "block";

        startTimer();
        renderQuestion();
    } catch (error) {
        console.error(error);
        showStatus("Error loading test: " + error.message);
    }
}

function showStatus(message) {
    const el = document.getElementById("testStatusMsg");
    if (el) {
        el.innerHTML = message;
        el.style.display = "block";
    }
}

function startTimer() {
    let remaining = testDurationSeconds;
    const timer = document.getElementById("timeRemaining");
    if (!timer) return;

    timerInterval = setInterval(function () {
        const minutes = Math.floor(remaining / 60);
        const seconds = remaining % 60;
        timer.innerText = String(minutes).padStart(2, "0") + ":" + String(seconds).padStart(2, "0");

        if (remaining <= 0) {
            clearInterval(timerInterval);
            submitTest(true);
            return;
        }
        remaining--;
    }, 1000);
}

function renderQuestion() {
    const numberTitle = document.getElementById("qNumberTitle");
    const questionText = document.getElementById("qText");
    const options = document.getElementById("optionsContainer");
    if (!options) return;

    if (numberTitle) numberTitle.innerText = "All Questions (" + testQuestions.length + ")";
    if (questionText) questionText.innerHTML = "";
    options.innerHTML = "";

    testQuestions.forEach(function (question, index) {
        const questionDiv = document.createElement("div");
        questionDiv.className = "all-question";

        const title = document.createElement("div");
        title.className = "all-question-title";
        title.innerHTML = "<strong>Question " + (index + 1) + ".</strong> " + escapeHTML(question.question || "");
        questionDiv.appendChild(title);

        const optionList = [["A", question.optionA], ["B", question.optionB], ["C", question.optionC], ["D", question.optionD]];

        optionList.forEach(function (item) {
            const label = document.createElement("label");
            label.className = "option-label";
            label.innerHTML = `<input type="radio" name="question_${index}" value="${escapeHTML(item[0])}"><span><b>${escapeHTML(item[0])}.</b> ${escapeHTML(item[1] || "")}</span>`;
            
            const radio = label.querySelector("input");
            radio.checked = studentAnswers[index] === item[0];
            radio.addEventListener("change", function () {
                studentAnswers[index] = item[0];
            });
            questionDiv.appendChild(label);
        });
        options.appendChild(questionDiv);
    });

    const prev = document.getElementById("btnPrev");
    const next = document.getElementById("btnNext");
    const submit = document.getElementById("btnSubmitTest");

    if (prev) prev.style.display = "none";
    if (next) next.style.display = "none";
    if (submit) submit.style.display = "inline-block";
}

function confirmSubmitTest() {
    const answerCount = Object.keys(studentAnswers).length;
    if (confirm(`You answered ${answerCount} of ${testQuestions.length} questions.\n\nSubmit test?`)) {
        clearInterval(timerInterval);
        submitTest(false);
    }
}

async function submitTest(autoSubmit) {
    const mobile = localStorage.getItem("oav_student_mobile");
    if (!mobile) {
        alert("Student information not found.");
        return;
    }

    try {
        const studentDoc = await oavDb.collection("oav_students").doc(mobile).get();
        const student = studentDoc.exists ? studentDoc.data() : { name: "Student", school: "N/A", city: "N/A" };

        let correct = 0;
        testQuestions.forEach(function (question, index) {
            const correctAns = String(question.correctAnswer || "").trim().toUpperCase();
            const studentAns = String(studentAnswers[index] || "").trim().toUpperCase();
            if (studentAns && studentAns === correctAns) correct++;
        });

        const total = testQuestions.length;
        const wrong = total - correct;
        const percentage = Math.round((correct / total) * 100);

        await oavDb.collection("oav_attempts").add({
            studentMobile: mobile,
            testId: currentTestId,
            subject: currentSubject,
            attempted: true,
            submittedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        await oavDb.collection("oav_results").add({
            studentMobile: mobile,
            studentName: student.name,
            school: student.school,
            city: student.city,
            testId: currentTestId,
            subject: currentSubject,
            score: correct,
            totalMarks: total,
            percentage: percentage,
            correct: correct,
            wrong: wrong,
            studentAnswers: studentAnswers,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        window.location.href = `oav-result.html?test=${encodeURIComponent(currentTestId)}&subject=${encodeURIComponent(currentSubject)}`;
    } catch (error) {
        console.error("Submit error:", error);
        alert("Submit error: " + error.message);
    }
}

async function loadResultPage() {
    const params = new URLSearchParams(window.location.search);
    const testId = params.get("test");
    const subject = params.get("subject");
    const mobile = localStorage.getItem("oav_student_mobile");

    if (!testId || !subject || !mobile) return;

    try {
        const myResult = await oavDb.collection("oav_results")
            .where("studentMobile", "==", mobile)
            .where("testId", "==", testId)
            .where("subject", "==", subject)
            .limit(1).get();

        if (myResult.empty) return;

        const data = myResult.docs[0].data();
        setText("resTestDetails", "Subject: " + subject);
        setText("resScore", `${data.score} / ${data.totalMarks}`);
        setText("resPercentage", `${data.percentage}%`);
        setText("resCorrectWrong", `${data.correct} / ${data.wrong}`);

        const questions = await loadQuestionsFromJSON(testId, subject);
        renderQuestionReview(questions.slice(0, 30), data.studentAnswers || {});
    } catch (error) {
        console.error("Result page error:", error);
    }
}

function renderQuestionReview(questions, answers) {
    const reviewContainer = document.getElementById("reviewContainer");
    if (!reviewContainer) return;
    if (!questions || !questions.length) {
        reviewContainer.innerHTML = "<p>No questions found.</p>";
        return;
    }

    reviewContainer.innerHTML = "";
    questions.forEach(function (q, index) {
        const correct = String(q.correctAnswer || "").trim().toUpperCase();
        const selected = String(answers[index] || "").trim().toUpperCase();
        const isCorrect = selected === correct;

        const card = document.createElement("div");
        card.style.cssText = "border:1px solid #ddd;border-radius:10px;padding:15px;margin-bottom:15px;background:#fff;box-shadow:0 2px 6px rgba(0,0,0,0.08);";

        const options = [["A", q.optionA], ["B", q.optionB], ["C", q.optionC], ["D", q.optionD]];
        let optionsHTML = "";

        options.forEach(function (item) {
            const letter = item[0];
            const text = item[1] || "";
            let mark = "";

            if (letter === correct) {
                mark = '<span style="color:green;font-weight:bold;margin-left:8px;">✅ Correct Answer</span>';
            }
            if (letter === selected && letter !== correct) {
                mark = '<span style="color:red;font-weight:bold;margin-left:8px;">❌ Your Answer</span>';
            }

            optionsHTML += `<div style="padding:9px;margin:5px 0;border-radius:6px;background:#f8f9fa;"><b>${escapeHTML(letter)}.</b> ${escapeHTML(text)} ${mark}</div>`;
        });

        let resultHTML = isCorrect ? 
            `<div style="margin-top:10px;color:green;font-weight:bold;">✅ Correct</div>` :
            selected === "" ? 
            `<div style="margin-top:10px;color:#d97706;font-weight:bold;">⚪ Not Answered</div>` :
            `<div style="margin-top:10px;color:red;font-weight:bold;">❌ Wrong</div>`;

        const explanation = q.explanation || q.solution || q.answerExplanation || "No explanation available.";

        card.innerHTML = `
            <div style="font-size:17px;font-weight:bold;margin-bottom:12px;color:#123;">Q${index + 1}. ${escapeHTML(q.question || "")}</div>
            ${optionsHTML}
            ${resultHTML}
            <div style="margin-top:12px;padding:12px;background:#f1f8e9;border-left:4px solid #4caf50;border-radius:6px;line-height:1.7;">
                <b>💡 Solution:</b><br>${escapeHTML(explanation)}
            </div>`;
        reviewContainer.appendChild(card);
    });
}

function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.innerText = value;
}

function escapeHTML(value) {
    return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function changeUser() {
    localStorage.removeItem("oav_student_mobile");
    const reg = document.getElementById("regSection");
    const dash = document.getElementById("dashboardSection");
    if (reg) reg.style.display = "block";
    if (dash) dash.style.display = "none";
    ["regName", "regSchool", "regCity", "regMobile"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = "";
    });
}
