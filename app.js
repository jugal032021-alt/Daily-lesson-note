
// ============================================
// ODISHA PATHASALA - DAILY LESSON NOTE SYSTEM
// Complete Firebase Realtime Database App
// ============================================

const baseURL = "https://daily-lesson-note-default-rtdb.asia-southeast1.firebasedatabase.app";

// ============================================
// CLASS & BOOK LIST
// ============================================

const classBooks = {
    "Class 1": ["ଗଣିତ ଖେଳ", "ଝୁଲଣା-୧"],
    "Class 2": ["ମଜା ମଜାରେ ଗଣିତ", "ଝୁଲଣା-୨"],
    "Class 3": ["ଗଣିତ ମେଳା", "ଭାଷା ମହକ-୧", "Pallavi", "ବିଚିତ୍ର ଆମ ପୃଥିବୀ"],
    "Class 4": ["ଗଣିତ ମେଳା", "ଭାଷା ମହକ-୨", "Pallavi", "ଆମ ବିଚିତ୍ର ବିଶ୍ୱ"],
    "Class 5": ["ଗଣିତ ମେଳା", "ଭାଷା ମହକ-୩", "Pallavi", "ଆମ ବିଚିତ୍ର ବିଶ୍ୱ"],
    "Class 6": ["ସାହିତ୍ୟ ସୁଧା", "ଗଣିତ ପ୍ରକାଶ", "Jasmine", "ଜିଜ୍ଞାସା", "ସାମାଜିକ ବିଜ୍ଞାନ - ଭାରତ ଓ ଆମ ପୃଥିବୀ"],
    "Class 7": ["ସାହିତ୍ୟ ସୁମନ", "ଗଣିତ ପ୍ରକାଶ", "Jasmine", "ଜିଜ୍ଞାସା", "ସାମାଜିକ ବିଜ୍ଞାନ - ଭାରତ ଓ ଆମ ପୃଥିବୀ"],
    "Class 8": ["ସାହିତ୍ୟ ସୁରଭି", "ଗଣିତ ପ୍ରକାଶ", "Jasmine", "ଜିଜ୍ଞାସା", "ସାମାଜିକ ବିଜ୍ଞାନ - ଭାରତ ଓ ଆମ ପୃଥିବୀ"]
};

// ============================================
// DATABASE URL
// ============================================

function safeSubject(subject) {
    return String(subject || "").replace(/[.#$\/\[\]]/g, "_");
}

function getNoteURL(date, className, subject) {
    return `${baseURL}/notes/${encodeURIComponent(date)}/${encodeURIComponent(className)}/${encodeURIComponent(safeSubject(subject))}.json`;
}

// ============================================
// LOCAL DATE
// ============================================

function getTodayDate() {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

// ============================================
// LEGACY DATABASE SUPPORT
// ============================================

async function findOldNote(date, className, subject) {
    const url = `${baseURL}/notes.json?orderBy="date"&equalTo="${encodeURIComponent(date)}"`;

    const response = await fetch(url);

    if (!response.ok) return null;

    const data = await response.json();

    if (!data) return null;

    for (const key in data) {
        const item = data[key];

        if (
            item &&
            String(item.date || "") === String(date) &&
            String(item.className || "").trim() === String(className).trim() &&
            String(item.subject || "").trim() === String(subject).trim()
        ) {
            return item;
        }
    }

    return null;
}

// ============================================
// GET EXISTING NOTE
// ============================================

async function getExistingNote(date, className, subject) {
    const response = await fetch(
        getNoteURL(date, className, subject)
    );

    if (!response.ok) {
        throw new Error("Database connection failed: " + response.status);
    }

    const note = await response.json();

    if (note && (note.fullContent || note.topic)) {
        return note;
    }

    return await findOldNote(date, className, subject);
}

// ============================================
// SAVE NEW NOTE
// ============================================

async function saveNote() {
    const note = getFormData();

    if (!note.date || !note.className || !note.subject || !note.fullContent.trim()) {
        alert("ଦୟା କରି ତାରିଖ, ଶ୍ରେଣୀ, ବିଷୟ ଏବଂ ନୋଟ୍ ଲେଖା ପୂରଣ କରନ୍ତୁ!");
        return;
    }

    const btn = document.getElementById("btnSubmit");
    if (btn) btn.disabled = true;

    try {
        const response = await fetch(
            getNoteURL(note.date, note.className, note.subject),
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(note)
            }
        );

        if (!response.ok) {
            throw new Error("HTTP Error: " + response.status);
        }

        alert("ସଫଳତାର ସହ ନୋଟ୍ ସେଭ୍ ହୋଇଗଲା!");

        window.location.reload();

    } catch (error) {
        console.error("Save Error:", error);
        alert("ନୋଟ୍ ସେଭ୍ କରିବାରେ ସମସ୍ୟା ହେଲା!\n" + error.message);
        if (btn) btn.disabled = false;
    }
}

// ============================================
// UPDATE NOTE
// ============================================

async function updateNote() {
    await saveNote();
}

// ============================================
// DELETE NOTE
// ============================================

async function deleteNote() {
    const date = document.getElementById("date")?.value;
    const className = document.getElementById("className")?.value;
    const subject = document.getElementById("subject")?.value;

    if (!date || !className || !subject) {
        alert("ଦୟା କରି ତାରିଖ, ଶ୍ରେଣୀ ଓ ବିଷୟ ବାଛନ୍ତୁ!");
        return;
    }

    if (!confirm("ଆପଣ ନିଶ୍ଚିତ ଏହି ନୋଟ୍ ଡିଲିଟ୍ କରିବାକୁ ଚାହୁଁଛନ୍ତି କି?")) {
        return;
    }

    try {
        const response = await fetch(
            getNoteURL(date, className, subject),
            { method: "DELETE" }
        );

        if (!response.ok) {
            throw new Error("HTTP Error: " + response.status);
        }

        alert("ନୋଟ୍ ସଫଳତାର ସହ ଡିଲିଟ୍ ହୋଇଗଲା!");

        window.location.reload();

    } catch (error) {
        console.error("Delete Error:", error);
        alert("ଡିଲିଟ୍ କରିବାରେ ସମସ୍ୟା ହେଲା!\n" + error.message);
    }
}

// ============================================
// AUTO LOAD EXISTING NOTE IN ADMIN PANEL
// ============================================

async function checkExistingNote() {
    const date = document.getElementById("date")?.value;
    const className = document.getElementById("className")?.value;
    const subject = document.getElementById("subject")?.value;

    const periodEl = document.getElementById("period");
    const contentEl = document.getElementById("fullContent");

    const modeText = document.getElementById("modeText");
    const btnSubmit = document.getElementById("btnSubmit");
    const btnUpdate = document.getElementById("btnUpdate");
    const btnDelete = document.getElementById("btnDelete");

    if (!date || !className || !subject) return;

    if (modeText) modeText.innerText = "ନୋଟ୍ ଖୋଜା ଚାଲିଛି...";

    try {
        const note = await getExistingNote(date, className, subject);

        if (note) {
            if (periodEl) periodEl.value = note.period || "";

            if (contentEl) {
                contentEl.value = note.fullContent || buildLegacyContent(note);
            }

            if (modeText) {
                modeText.innerText = "ଏଡିଟ୍ ମୋଡ୍ (ପୁରୁଣା ନୋଟ୍ ଲୋଡ୍ ହେଲା)";
            }

            if (btnSubmit) btnSubmit.style.display = "none";
            if (btnUpdate) btnUpdate.style.display = "block";
            if (btnDelete) btnDelete.style.display = "block";

        } else {
            if (periodEl) periodEl.value = "";
            if (contentEl) contentEl.value = "";

            if (modeText) {
                modeText.innerText = "ନୂତନ ନୋଟ୍ ଅପଲୋଡ୍ ଫର୍ମ";
            }

            if (btnSubmit) btnSubmit.style.display = "block";
            if (btnUpdate) btnUpdate.style.display = "none";
            if (btnDelete) btnDelete.style.display = "none";
        }

    } catch (error) {
        console.error("Auto Load Error:", error);

        if (modeText) {
            modeText.innerText = "ନୋଟ୍ ଲୋଡ୍ କରିବାରେ ସମସ୍ୟା ହେଲା";
        }
    }
}

// ============================================
// OLD NOTE FORMAT CONVERSION
// ============================================

function buildLegacyContent(note) {
    return `ପାଠ୍ୟ ପ୍ରସଙ୍ଗ: ${note.topic || ""}
ଶିକ୍ଷଣ ଫଳାଫଳ: ${note.outcomes || ""}
ଶିକ୍ଷଣ ସାମଗ୍ରୀ: ${note.tlm || ""}

ପଞ୍ଚପଦୀ:
୧. ଅଧିତି: ${note.adhiti || ""}
୨. ବୋଧ: ${note.bodha || ""}
୩. ଅଭ୍ୟାସ: ${note.abhyasa || ""}
୪. ପ୍ରୟୋଗ: ${note.prayoga || ""}
୫. ପ୍ରସାର: ${note.prasara || ""}`;
}

// ============================================
// AUTOMATIC LATEX FRACTION FORMATTING
// Handles nested fractions too
// ============================================

function autoFormatMath(content) {
    let result = "";
    let i = 0;
    let mathOpen = false;

    while (i < content.length) {
        if (content.startsWith("\\(", i) || content.startsWith("$$", i)) {
            mathOpen = true;
            const delimiter = content.startsWith("\\(", i) ? "\\(" : "$$";
            result += delimiter;
            i += delimiter.length;
            continue;
        }

        if (content.startsWith("\\)", i) || content.startsWith("$$", i)) {
            const delimiter = content.startsWith("\\)", i) ? "\\)" : "$$";
            result += delimiter;
            i += delimiter.length;
            mathOpen = false;
            continue;
        }

        let command = "";

        if (content.startsWith("\\dfrac", i)) {
            command = "\\dfrac";
        } else if (content.startsWith("\\frac", i)) {
            command = "\\frac";
        }

        if (command && !mathOpen) {
            let j = i + command.length;

            while (content[j] === " ") j++;

            if (content[j] !== "{") {
                result += content[i];
                i++;
                continue;
            }

            // Find numerator closing brace
            let depth = 0;
            let numeratorEnd = -1;

            for (let k = j; k < content.length; k++) {
                if (content[k] === "{") depth++;
                if (content[k] === "}") depth--;

                if (depth === 0) {
                    numeratorEnd = k;
                    break;
                }
            }

            if (numeratorEnd === -1) {
                result += content[i];
                i++;
                continue;
            }

            let denominatorStart = numeratorEnd + 1;

            while (content[denominatorStart] === " ") {
                denominatorStart++;
            }

            if (content[denominatorStart] !== "{") {
                result += content[i];
                i++;
                continue;
            }

            depth = 0;
            let denominatorEnd = -1;

            for (let k = denominatorStart; k < content.length; k++) {
                if (content[k] === "{") depth++;
                if (content[k] === "}") depth--;

                if (depth === 0) {
                    denominatorEnd = k;
                    break;
                }
            }

            if (denominatorEnd === -1) {
                result += content[i];
                i++;
                continue;
            }

            const fraction = content.substring(i, denominatorEnd + 1);

            result += "\\( " + fraction + " \\)";
            i = denominatorEnd + 1;

        } else {
            result += content[i];
            i++;
        }
    }

    return result;
}

// ============================================
// SEARCH & DISPLAY LESSON NOTE
// ============================================

async function searchNote() {
    const date = document.getElementById("searchDate")?.value;
    const className = document.getElementById("searchClass")?.value;
    const subject = document.getElementById("searchSubject")?.value;

    const resultArea = document.getElementById("resultArea");

    if (!date || !className || !subject) {
        alert("ଦୟା କରି ତାରିଖ, ଶ୍ରେଣୀ ଓ ବିଷୟ ବାଛନ୍ତୁ!");
        return;
    }

    resultArea.textContent = "ନୋଟ୍ ଖୋଜା ଚାଲିଛି...";

    try {
        const note = await getExistingNote(date, className, subject);

        if (!note || (!note.fullContent && !note.topic)) {
            resultArea.textContent =
                "କ୍ଷମା କରିବେ, ଏହି ତାରିଖ, ଶ୍ରେଣୀ ଓ ବିଷୟ ପାଇଁ କୌଣସି ନୋଟ୍ ମିଳିଲା ନାହିଁ!";
            resultArea.style.color = "red";
            return;
        }

        const content = note.fullContent || buildLegacyContent(note);

        // Convert fractions into MathJax inline math
        const formattedContent = autoFormatMath(content);

        // Clear old MathJax before replacing content
        if (window.MathJax && window.MathJax.typesetClear) {
            MathJax.typesetClear([resultArea]);
        }

        resultArea.replaceChildren();

        const card = document.createElement("div");
        card.className = "note-card";

        card.style.cssText =
            "background:transparent;border:none;box-shadow:none;padding:15px;";

        const heading = document.createElement("h3");
        heading.style.cssText =
            "font-size:20px;font-weight:bold;color:#b30000;border-bottom:1px solid #ccc;padding-bottom:8px;";

        heading.textContent =
            `${note.className || className} - ${note.subject || subject}`;

        const info = document.createElement("div");
        info.style.cssText =
            "font-size:16px;line-height:1.8;margin:8px 0;";

        info.textContent =
            `ତାରିଖ: ${note.date || date} | କାଳାଂଶ: ${note.period || ""}`;

        const contentBox = document.createElement("div");
        contentBox.className = "note-item";

        contentBox.style.cssText =
            "font-size:16px;line-height:1.8;white-space:pre-wrap;overflow-wrap:anywhere;margin-top:10px;background:rgba(255,255,255,0.9);padding:12px;border-radius:5px;border-left:4px solid #0056b3;color:#222;";

        // Safe text insertion - no HTML injection
        contentBox.textContent = formattedContent;

        card.appendChild(heading);
        card.appendChild(info);
        card.appendChild(contentBox);

        resultArea.appendChild(card);
        resultArea.style.color = "#222";

        // Render mathematical expressions
        if (window.MathJax && window.MathJax.typesetPromise) {
            await MathJax.typesetPromise([resultArea]);
        }

    } catch (error) {
        console.error("Search Error:", error);

        resultArea.textContent =
            "ନୋଟ୍ ଲୋଡ୍ କରିବାରେ ସମସ୍ୟା ହେଲା: " + error.message;

        resultArea.style.color = "red";
    }
}

// ============================================
// FORM DATA
// ============================================

function getFormData() {
    return {
        date: document.getElementById("date")?.value || "",
        className: document.getElementById("className")?.value || "",
        period: document.getElementById("period")?.value || "",
        subject: document.getElementById("subject")?.value || "",
        fullContent: document.getElementById("fullContent")?.value || ""
    };
}

// ============================================
// CLASS DROPDOWN
// ============================================

function populateSubjects(classElement, subjectElement, onChange) {
    if (!classElement || !subjectElement) return;

    classElement.addEventListener("change", function() {
        const selectedClass = this.value;

        subjectElement.innerHTML =
            '<option value="">ବହି ବାଛନ୍ତୁ</option>';

        if (selectedClass && classBooks[selectedClass]) {
            classBooks[selectedClass].forEach(bookName => {
                const option = document.createElement("option");

                option.value = bookName;
                option.textContent = bookName;

                subjectElement.appendChild(option);
            });
        } else {
            subjectElement.innerHTML =
                '<option value="">ପ୍ରଥମେ ଶ୍ରେଣୀ ବାଛନ୍ତୁ</option>';
        }

        if (onChange) onChange();
    });
}

// ============================================
// PAGE INITIALIZATION
// ============================================

window.addEventListener("DOMContentLoaded", function() {

    const today = getTodayDate();

    const dateEl = document.getElementById("date");
    const searchDateEl = document.getElementById("searchDate");

    if (dateEl && !dateEl.value) {
        dateEl.value = today;
    }

    if (searchDateEl && !searchDateEl.value) {
        searchDateEl.value = today;
    }

    // Admin form events
    if (dateEl) {
        dateEl.addEventListener("change", checkExistingNote);
    }

    const adminClass = document.getElementById("className");
    const adminSubject = document.getElementById("subject");

    if (adminClass) {
        populateSubjects(adminClass, adminSubject, checkExistingNote);
    }

    if (adminSubject) {
        adminSubject.addEventListener("change", checkExistingNote);
    }

    // Search form events
    const searchClass = document.getElementById("searchClass");
    const searchSubject = document.getElementById("searchSubject");

    populateSubjects(searchClass, searchSubject);

    // Search date does not trigger search automatically
});

// ============================================
// END OF APP.JS
// ============================================
