// Firebase Initialization & Core Logic for OAV-2026
// Uses existing Firebase project configuration from OdishaPathasala

const oavDb = firebase.firestore();

// Global State Variables for Test Session
let currentTestId = null;
let currentSubject = null;
let testQuestions = [];
let currentQuestionIndex = 0;
let studentAnswers = {};
let timerInterval = null;
let testDurationSeconds = 1800; // default 30 mins

document.addEventListener("DOMContentLoaded", function () {
    // Check page context and execute appropriate functions
    if (document.getElementById("regSection")) {
        checkSession();
    }
    if (document.getElementById("questionBox")) {
        initializeTestPage();
    }
    if (document.getElementById("resScore")) {
        loadResultPage();
    }
});

// ==================== 1. REGISTRATION & DASHBOARD LOGIC ====================
function checkSession() {
    let savedMobile = localStorage.getItem("oav_student_mobile");
    if (savedMobile) {
        oavDb.collection("oav_students").doc(savedMobile).get().then((doc) => {
            if (doc.exists) {
                let data = doc.data();
                document.getElementById("regSection").style.display = "none";
                document.getElementById("dashboardSection").style.display = "block";
                document.getElementById("welcomeMsg").innerText = `Welcome, ${data.name}!`;
                document.getElementById("studentMeta").innerText = `School: ${data.school} | City: ${data.city} | Mobile: ${data.mobile}`;
                loadDashboardTests(savedMobile);
            } else {
                localStorage.removeItem("oav_student_mobile");
            }
        });
    }
}

function registerStudent(e) {
    e.preventDefault();
    let name = document.getElementById("regName").value.trim();
    let school = document.getElementById("regSchool").value.trim();
    let city = document.getElementById("regCity").value.trim();
    let mobile = document.getElementById("regMobile").value.trim();

    if (mobile.length !== 10) {
        alert("Please enter a valid 10-digit mobile number.");
        return;
    }

    let studentData = {
        name: name,
        school: school,
        city: city,
        mobile: mobile,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    oavDb.collection("oav_students").doc(mobile).set(studentData, { merge: true }).then(() => {
        localStorage.setItem("oav_student_mobile", mobile);
        alert("Registration Successful!");
        checkSession();
    }).catch((err) => {
        alert("Registration error: " + err.message);
    });
}

function logoutStudent() {
    localStorage.removeItem("oav_student_mobile");
    location.reload();
}

async function loadDashboardTests(mobile) {
    let container = document.getElementById("testsListContainer");
    container.innerHTML = "<p style='text-align:center; color:#666;'>Loading tests...</p>";

    try {
        let testsSnap = await oavDb.collection("oav_tests").where("isPublished", "==", true).get();
        let attemptsSnap = await oavDb.collection("oav_attempts").where("studentMobile", "==", mobile).get();
        
        let attemptedMap = {};
        attemptsSnap.forEach(doc => {
            let d = doc.data();
            attemptedMap[`${d.testId}_${d.subject}`] = true;
        });

        if (testsSnap.empty) {
            container.innerHTML = "<p style='text-align:center; color:#777;'>No practice tests published yet. Check back soon!</p>";
            return;
        }

        let testsMap = {};
        testsSnap.forEach(doc => {
            let t = doc.data();
            t.id = doc.id;
            if (!testsMap[t.testNumber]) {
                testsMap[t.testNumber] = { testName: t.testName, duration: t.duration || 30, subjects: {} };
            }
            testsMap[t.testNumber].subjects[t.subject] = t.id;
        });

        let html = "";
        for (let tNum in testsMap) {
            let testObj = testsMap[tNum];
            html += `
                <div style="background: #fdfdfd; border: 1px solid #e2e8f0; border-radius: 10px; padding: 18px; margin-bottom: 20px; box-shadow: 0 2px 5px rgba(0,0,0,0.02);">
                    <h4 style="margin: 0 0 12px 0; color: #0044cc; font-size: 18px;">📌 ${testObj.testName}</h4>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px;">
            `;

            ['Mathematics', 'EVS', 'English'].forEach(sub => {
                let testId = testObj.subjects[sub];
                let isAttempted = testId ? attemptedMap[`${testId}_${sub}`] : false;
                
                if (testId) {
                    if (isAttempted) {
                        html += `
                            <div style="background: #f1f3f5; padding: 12px; border-radius: 8px; border-left: 4px solid #6c757d; display: flex; justify-content: space-between; align-items: center;">
                                <div>
                                    <div style="font-weight: bold; color: #333;">${sub} (30 Marks)</div>
                                    <div style="font-size: 12px; color: #28a745; margin-top: 3px;">✅ Attempted</div>
                                </div>
                                <a href="oav-result.html?test=${testId}&subject=${sub}" style="background: #6c757d; color: white; padding: 6px 12px; border-radius: 4px; text-decoration: none; font-size: 12px; font-weight: bold;">View Result</a>
                            </div>
                        `;
                    } else {
                        html += `
                            <div style="background: #f8f9fa; padding: 12px; border-radius: 8px; border-left: 4px solid #0044cc; display: flex; justify-content: space-between; align-items: center;">
                                <div>
                                    <div style="font-weight: bold; color: #333;">${sub} (30 Marks)</div>
                                    <div style="font-size: 12px; color: #0044cc; margin-top: 3px;">🟢 Free Test</div>
                                </div>
                                <a href="oav-test.html?test=${testId}&subject=${sub}" style="background: #28a745; color: white; padding: 6px 14px; border-radius: 4px; text-decoration: none; font-size: 13px; font-weight: bold;">START TEST</a>
                            </div>
                        `;
                    }
                } else {
                    html += `
                        <div style="background: #fafafa; padding: 12px; border-radius: 8px; border-left: 4px solid #ccc; opacity: 0.6;">
                            <div style="font-weight: bold; color: #777;">${sub} (30 Marks)</div>
                            <div style="font-size: 12px; color: #999; margin-top: 3px;">Coming Soon</div>
                        </div>
                    `;
                }
            });

            html += `</div></div>`;
        }

        container.innerHTML = html;

    } catch (err) {
        container.innerHTML = `<p style="color:red; text-align:center;">Error loading tests: ${err.message}</p>`;
    }
}


// ==================== 2. TEST EXECUTION & TIMER LOGIC ====================
async function initializeTestPage() {
    let urlParams = new URLSearchParams(window.location.search);
    currentTestId = urlParams.get("test");
    currentSubject = urlParams.get("subject");
    let mobile = localStorage.getItem("oav_student_mobile");

    if (!mobile) {
        alert("Please register first!");
        window.location.href = "oav-2026.html";
        return;
    }

    if (!currentTestId || !currentSubject) {
        document.getElementById("testStatusMsg").innerText = "Invalid Test Parameters.";
        return;
    }

    try {
        let attemptDoc = await oavDb.collection("oav_attempts")
            .where("studentMobile", "==", mobile)
            .where("testId", "==", currentTestId)
            .where("subject", "==", currentSubject)
            .get();

        if (!attemptDoc.empty) {
            document.getElementById("questionBox").style.display = "none";
            document.getElementById("timerDisplay").style.display = "none";
            document.getElementById("testStatusMsg").innerHTML = `
                <div style="background: #ffebee; color: #c62828; padding: 20px; border-radius: 8px; border: 1px solid #ef9a9a;">
                    <h3>⚠️ You have already attempted this test!</h3>
                    <p>One-attempt rule applies. You cannot attempt this test again.</p>
                    <a href="oav-result.html?test=${currentTestId}&subject=${currentSubject}" style="background: #0044cc; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px; font-weight: bold;">View Your Result & Solutions</a>
                </div>
            `;
            return;
        }

        let testDoc = await oavDb.collection("oav_tests").doc(currentTestId).get();
        let testData = testDoc.exists ? testDoc.data() : { testName: "Practice Test", duration: 30 };
        testDurationSeconds = (testData.duration || 30) * 60;

        document.getElementById("lblTestName").innerText = `Test: ${testData.testName}`;
        document.getElementById("lblSubject").innerText = `Subject: ${currentSubject}`;

        let qSnap = await oavDb.collection("oav_questions")
            .where("testId", "==", currentTestId)
            .where("subject", "==", currentSubject)
            .orderBy("questionNumber", "asc")
            .get();

        if (qSnap.empty) {
            document.getElementById("testStatusMsg").innerText = "No questions found for this test yet.";
            return;
        }

        testQuestions = [];
        qSnap.forEach(doc => {
            let q = doc.data();
            q.id = doc.id;
            testQuestions.push(q);
        });

        document.getElementById("testStatusMsg").style.display = "none";
        document.getElementById("questionBox").style.display = "block";

        startTestTimer();
        renderQuestion();

    } catch (err) {
        document.getElementById("testStatusMsg").innerText = "Error loading test: " + err.message;
    }
}

function startTestTimer() {
    let remaining = testDurationSeconds;
    let timerEl = document.getElementById("timeRemaining");

    timerInterval = setInterval(() => {
        let mins = Math.floor(remaining / 60);
        let secs = remaining % 60;
        timerEl.innerText = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

        if (remaining <= 0) {
            clearInterval(timerInterval);
            alert("Time is up! Submitting your test automatically.");
            submitTest(true);
        }
        remaining--;
    }, 1000);
}

function renderQuestion() {
    let q = testQuestions[currentQuestionIndex];
    document.getElementById("qNumberTitle").innerText = `Question ${currentQuestionIndex + 1} of ${testQuestions.length}`;
    document.getElementById("qText").innerText = q.question;

    let optContainer = document.getElementById("optionsContainer");
    let options = [
        { key: 'A', text: q.optionA },
        { key: 'B', text: q.optionB },
        { key: 'C', text: q.optionC },
        { key: 'D', text: q.optionD }
    ];

    let html = "";
    options.forEach(opt => {
        let isChecked = studentAnswers[currentQuestionIndex] === opt.key ? "checked" : "";
        let selectedClass = studentAnswers[currentQuestionIndex] === opt.key ? "selected" : "";
        html += `
            <label class="option-label ${selectedClass}">
                <input type="radio" name="examOption" value="${opt.key}" ${isChecked} onclick="selectAnswer('${opt.key}')">
                <span><b>${opt.key}.</b> ${opt.text}</span>
            </label>
        `;
    });
    optContainer.innerHTML = html;

    document.getElementById("btnPrev").style.display = currentQuestionIndex === 0 ? "none" : "block";
    if (currentQuestionIndex === testQuestions.length - 1) {
        document.getElementById("btnNext").style.display = "none";
        document.getElementById("btnSubmitTest").style.display = "block";
    } else {
        document.getElementById("btnNext").style.display = "block";
        document.getElementById("btnSubmitTest").style.display = "none";
    }
}

function selectAnswer(optKey) {
    studentAnswers[currentQuestionIndex] = optKey;
    renderQuestion();
}

function nextQuestion() {
    if (currentQuestionIndex < testQuestions.length - 1) {
        currentQuestionIndex++;
        renderQuestion();
    }
}

function prevQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        renderQuestion();
    }
}

function confirmSubmitTest() {
    if (confirm("Are you sure you want to submit your test?")) {
        clearInterval(timerInterval);
        submitTest(false);
    }
}

async function submitTest(isAutoSubmit) {
    let mobile = localStorage.getItem("oav_student_mobile");
    if (!mobile) return;

    let studentDoc = await oavDb.collection("oav_students").doc(mobile).get();
    let studentInfo = studentDoc.data() || { name: "Student", school: "", city: "" };

    let correctCount = 0;
    let wrongCount = 0;

    testQuestions.forEach((q, idx) => {
        let ans = studentAnswers[idx];
        if (ans && ans === q.correctAnswer) {
            correctCount++;
        } else {
            wrongCount++;
        }
    });

    let score = correctCount;
    let totalMarks = testQuestions.length;
    let percentage = Math.round((score / totalMarks) * 100);
    let timeTakenSecs = testDurationSeconds - parseInt(document.getElementById("timeRemaining").innerText.split(':')[0]) * 60;
    let timeTakenFormatted = `${Math.floor(timeTakenSecs / 60)} mins`;

    let attemptData = {
        studentMobile: mobile,
        testId: currentTestId,
        subject: currentSubject,
        attempted: true,
        submittedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    let resultData = {
        studentMobile: mobile,
        studentName: studentInfo.name,
        school: studentInfo.school,
        city: studentInfo.city,
        testId: currentTestId,
        subject: currentSubject,
        score: score,
        totalMarks: totalMarks,
        percentage: percentage,
        correct: correctCount,
        wrong: wrongCount,
        timeTaken: timeTakenFormatted,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    try {
        await oavDb.collection("oav_attempts").add(attemptData);
        let resRef = await oavDb.collection("oav_results").add(resultData);

        sessionStorage.setItem("oav_last_submission", JSON.stringify({
            studentAnswers: studentAnswers,
            questions: testQuestions
        }));

        window.location.href = `oav-result.html?test=${currentTestId}&subject=${currentSubject}&resId=${resRef.id}`;
    } catch (err) {
        alert("Error submitting test: " + err.message);
    }
}


// ==================== 3. RESULT & LEADERBOARD LOGIC ====================
async function loadResultPage() {
    let urlParams = new URLSearchParams(window.location.search);
    let testId = urlParams.get("test");
    let subject = urlParams.get("subject");
    let mobile = localStorage.getItem("oav_student_mobile");

    if (!testId || !subject) return;

    document.getElementById("leaderboardTitle").innerText = subject;

    try {
        let resSnap = await oavDb.collection("oav_results")
            .where("studentMobile", "==", mobile)
            .where("testId", "==", testId)
            .where("subject", "==", subject)
            .get();

        if (!resSnap.empty) {
            let resData = resSnap.docs[0].data();
            document.getElementById("resTestDetails").innerText = `Subject: ${subject} | Test ID: ${testId}`;
            document.getElementById("resScore").innerText = `${resData.score} / ${resData.totalMarks}`;
            document.getElementById("resPercentage").innerText = `${resData.percentage}%`;
            document.getElementById("resCorrectWrong").innerText = `${resData.correct} / ${resData.wrong}`;
            document.getElementById("resTimeTaken").innerText = resData.timeTaken;
        }

        let topSnap = await oavDb.collection("oav_results")
            .where("testId", "==", testId)
            .where("subject", "==", subject)
            .orderBy("score", "desc")
            .limit(10)
            .get();

        let lbRows = "";
        let rank = 1;
        topSnap.forEach(doc => {
            let d = doc.data();
            lbRows += `
                <tr style="border-bottom: 1px solid #eee;">
                    <td style="padding: 10px; font-weight: bold;">#${rank}</td>
                    <td style="padding: 10px;">${d.studentName}</td>
                    <td style="padding: 10px;">${d.school || 'N/A'}</td>
                    <td style="padding: 10px;">${d.city || 'N/A'}</td>
                    <td style="padding: 10px; font-weight: bold; color: #28a745;">${d.score}/${d.totalMarks}</td>
                    <td style="padding: 10px; color: #666;">${d.timeTaken}</td>
                </tr>
            `;
            rank++;
        });
        document.getElementById("leaderboardRows").style.display = topSnap.empty ? "none" : "";
        if (!topSnap.empty) {
            document.getElementById("leaderboardRows").innerHTML = lbRows;
        } else {
            document.getElementById("leaderboardRows").innerHTML = `<tr><td colspan="6" style="text-align:center; padding:15px; color:#666;">No leaderboard entries yet.</td></tr>`;
        }

        let qSnap = await oavDb.collection("oav_questions")
            .where("testId", "==", testId)
            .where("subject", "==", subject)
            .orderBy("questionNumber", "asc")
            .get();

        let subData = JSON.parse(sessionStorage.getItem("oav_last_submission") || "{}");
        let studentAnsMap = subData.studentAnswers || {};

        let reviewHtml = "";
        let idx = 0;
        qSnap.forEach(doc => {
            let q = doc.data();
            let userAns = studentAnsMap[idx] || "Not Answered";
            let isCorrect = userAns === q.correctAnswer;
            let statusColor = isCorrect ? "#d4edda" : "#f8d7da";
            let borderColor = isCorrect ? "#28a745" : "#dc3545";
            let statusText = isCorrect ? "✅ Correct" : "❌ Incorrect";

            reviewHtml += `
                <div style="background: ${statusColor}; border-left: 5px solid ${borderColor}; padding: 15px; border-radius: 8px;">
                    <div style="font-weight: bold; margin-bottom: 5px; color: #333;">Q${idx + 1}: ${q.question}</div>
                    <div style="font-size: 14px; margin-bottom: 5px;">Your Answer: <b>${userAns}</b> | Correct Answer: <b>${q.correctAnswer}</b> (${statusText})</div>
                    <div style="font-size: 13px; color: #555; background: rgba(255,255,255,0.7); padding: 8px; border-radius: 4px; margin-top: 8px;">
                        <b>Explanation:</b> ${q.explanation || 'No explanation provided.'}
                    </div>
                </div>
            `;
            idx++;
        });

        document.getElementById("reviewContainer").innerHTML = reviewHtml || "<p>Review data not available in session.</p>";

    } catch (err) {
        console.error("Error loading results:", err);
    }
}
