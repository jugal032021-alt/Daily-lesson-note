const baseURL = "https://daily-lesson-note-default-rtdb.asia-southeast1.firebasedatabase.app";

function safeSubject(subject) {
    return String(subject || "").replace(/[.#$\/\[\]]/g, '_');
}

function getNoteURL(date, className, subject) {
    return `${baseURL}/notes/${encodeURIComponent(date)}/${encodeURIComponent(className)}/${encodeURIComponent(safeSubject(subject))}.json`;
}

async function saveNote() {
    const note = getFormData();
    if (!note.date || !note.className || !note.subject || !note.fullContent) {
        alert("ଦୟା କରି ତାରିଖ, ଶ୍ରେଣୀ, ବିଷୟ ଏବଂ ନୋଟ୍ ଲେଖା ପୂରଣ କରନ୍ତୁ!");
        return;
    }
    const saveURL = getNoteURL(note.date, note.className, note.subject);
    try {
        const response = await fetch(saveURL, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                date: note.date,
                className: note.className,
                subject: note.subject,
                period: note.period,
                fullContent: note.fullContent
            })
        });
        if (!response.ok) throw new Error("HTTP Error: " + response.status);
        alert("ସଫଳତାର ସହ ନୋଟ୍ ଅପଲୋଡ୍ ହୋଇଗଲା!");
        window.location.reload();
    } catch (error) {
        console.error("Save Error:", error);
        alert("ନୋଟ୍ ଅପଲୋଡ୍ କରିବାରେ ସମସ୍ୟା ହେଲା!\n\n" + error);
    }
}

async function updateNote() {
    await saveNote();
}

async function deleteNote() {
    const sDate = document.getElementById("date")?.value;
    const sClass = document.getElementById("className")?.value;
    const sSub = document.getElementById("subject")?.value;

    if (!sDate || !sClass || !sSub) {
        alert("ଡିଲିଟ୍ କରିବା ପାଇଁ ତାରିଖ, ଶ୍ରେଣୀ ଏବଂ ବିଷୟ ବାଛନ୍ତୁ!");
        return;
    }
    if (!confirm("ଆପଣ ନିଶ୍ଚିତ ଭାବରେ ଏହି ନୋଟ୍ କୁ ଡିଲିଟ୍ କରିବାକୁ ଚାହୁଁଛନ୍ତି କି?")) return;

    try {
        const deleteURL = getNoteURL(sDate, sClass, sSub);
        const response = await fetch(deleteURL, { method: "DELETE" });
        if (!response.ok) throw new Error("HTTP Error: " + response.status);
        alert("ନୋଟ୍ ସମ୍ପୂର୍ଣ୍ଣ ଭାବରେ ଡିଲିଟ୍ ହୋଇଗଲା!");
        window.location.reload();
    } catch (error) {
        console.error("Delete Error:", error);
        alert("ଡିଲିଟ୍ କରିବାରେ ସମସ୍ୟା ହେଲା!\n\n" + error);
    }
}

async function checkExistingNote() {
    const dateEl = document.getElementById("date");
    const classEl = document.getElementById("className");
    const subjectEl = document.getElementById("subject");

    if (!dateEl || !classEl || !subjectEl) return;
    const sDate = dateEl.value, sClass = classEl.value, sSub = subjectEl.value;
    if (!sDate || !sClass || !sSub) return;

    try {
        const newResponse = await fetch(getNoteURL(sDate, sClass, sSub));
        let foundNote = newResponse.ok ? await newResponse.json() : null;

        if (!foundNote || !foundNote.fullContent) {
            const oldResponse = await fetch(`${baseURL}/notes.json?orderBy="date"&equalTo="${encodeURIComponent(sDate)}"`);
            if (oldResponse.ok) {
                const oldData = await oldResponse.json();
                if (oldData) {
                    for (const key in oldData) {
                        const item = oldData[key];
                        if (String(item.className || "").trim() === String(sClass).trim() && 
                            String(item.subject || "").trim() === String(sSub).trim()) {
                            foundNote = item;
                            break;
                        }
                    }
                }
            }
        }

        const periodEl = document.getElementById("period");
        const contentEl = document.getElementById("fullContent");
        const modeText = document.getElementById("modeText");
        const btnSubmit = document.getElementById("btnSubmit");
        const btnUpdate = document.getElementById("btnUpdate");
        const btnDelete = document.getElementById("btnDelete");

        if (foundNote && (foundNote.fullContent || foundNote.topic)) {
            if (periodEl) periodEl.value = foundNote.period || "";
            if (contentEl) {
                contentEl.value = foundNote.fullContent || 
                    `ପାଠ୍ୟ ପ୍ରସଙ୍ଗ: ${foundNote.topic || ""}\nଶିକ୍ଷଣ ଫଳାଫଳ: ${foundNote.outcomes || ""}\nଶିକ୍ଷଣ ସାମଗ୍ରୀ: ${foundNote.tlm || ""}\n\nପଞ୍ଚପଦୀ:\n୧. ଅଧିତି: ${foundNote.adhiti || ""}\n୨. ବୋଧ: ${foundNote.bodha || ""}\n୩. ଅଭ୍ୟାସ: ${foundNote.abhyasa || ""}\n୪. ପ୍ରୟୋଗ: ${foundNote.prayoga || ""}\n୫. ପ୍ରସାର: ${foundNote.prasara || ""}`;
            }
            if (modeText) modeText.innerText = "ଏଡିଟ୍ ମୋଡ୍ (ନୋଟ୍ ଅଟୋ-ଲୋଡ୍ ହେଲା)";
            if (btnSubmit) btnSubmit.style.display = "block";
            if (btnUpdate) btnUpdate.style.display = "block";
            if (btnDelete) btnDelete.style.display = "block";
        } else {
            if (periodEl) periodEl.value = "";
            if (contentEl) contentEl.value = "";
            if (modeText) modeText.innerText = "ନୂତନ ନୋଟ୍ ଅପଲୋଡ୍ ଫର୍ମ";
            if (btnSubmit) btnSubmit.style.display = "block";
            if (btnUpdate) btnUpdate.style.display = "none";
            if (btnDelete) btnDelete.style.display = "none";
        }
    } catch (error) {
        console.error("Check Existing Note Error:", error);
    }
}

async function searchNote() {
    const searchDate = document.getElementById("searchDate")?.value;
    const searchClass = document.getElementById("searchClass")?.value;
    const searchSubject = document.getElementById("searchSubject")?.value.trim();
    const resultArea = document.getElementById("resultArea");

    if (!searchDate || !searchClass || !searchSubject) {
        alert("ଦୟା କରି ତାରିଖ, ଶ୍ରେଣୀ ଓ ବିଷୟ ପୂରଣ କରନ୍ତୁ!");
        return;
    }
    resultArea.innerHTML = "<p style='text-align:center;'>ଖୋଜା ଚାଲିଛି...</p>";

    try {
        const newResponse = await fetch(getNoteURL(searchDate, searchClass, searchSubject));
        let foundNote = newResponse.ok ? await newResponse.json() : null;

        if (!foundNote || !foundNote.fullContent) {
            const oldResponse = await fetch(`${baseURL}/notes.json?orderBy="date"&equalTo="${encodeURIComponent(searchDate)}"`);
            if (oldResponse.ok) {
                const oldData = await oldResponse.json();
                if (oldData) {
                    for (const key in oldData) {
                        const item = oldData[key];
                        if (String(item.className || "").trim() === String(searchClass).trim() && 
                            String(item.subject || "").trim() === searchSubject) {
                            foundNote = item;
                            break;
                        }
                    }
                }
            }
        }

        if (foundNote && (foundNote.fullContent || foundNote.topic)) {
            const contentToShow = foundNote.fullContent || 
                `ପାଠ୍ୟ ପ୍ରସଙ୍ଗ: ${foundNote.topic || ""}\nଶିକ୍ଷଣ ଫଳାଫଳ: ${foundNote.outcomes || ""}\nଶିକ୍ଷଣ ସାମଗ୍ରୀ: ${foundNote.tlm || ""}\n\nପଞ୍ଚପଦୀ:\n୧. ଅଧିତି: ${foundNote.adhiti || ""}\n୨. ବୋଧ: ${foundNote.bodha || ""}\n୩. ଅଭ୍ୟାସ: ${foundNote.abhyasa || ""}\n୪. ପ୍ରୟୋଗ: ${foundNote.prayoga || ""}\n୫. ପ୍ରସାର: ${foundNote.prasara || ""}`;

            resultArea.innerHTML = `
                <div class="note-card" style="background:transparent !important; border:none !important; box-shadow:none !important; padding:15px;">
                    <h3 style="font-size:20px; font-weight:bold; color:#b30000; border-bottom:1px solid #ccc; padding-bottom:5px;">${foundNote.className || searchClass} - ${foundNote.subject || searchSubject}</h3>
                    <div class="note-item" style="font-size:16px; line-height:1.8; margin-bottom:8px;"><strong>ତାରିଖ:</strong> ${foundNote.date || searchDate} | <strong>କାଳାଂଶ:</strong> ${foundNote.period || ''}</div>
                    <div class="note-item" style="font-size:16px; line-height:1.8; white-space:pre-wrap; margin-top:10px; background:rgba(255,255,255,0.8); padding:12px; border-radius:5px; border-left:4px solid #0056b3;">${contentToShow}</div>
                </div>`;
        } else {
            resultArea.innerHTML = `<p style="color:red; text-align:center; margin-top:15px;">କ୍ଷମା କରିବେ, ଏହି ତାରିଖ, ଶ୍ରେଣୀ ଏବଂ ବିଷୟ ପାଇଁ କୌଣସି ନୋଟ୍ ମିଳିଲା ନାହିଁ!</p>`;
        }
    } catch (error) {
        console.error("Search Error:", error);
        resultArea.innerHTML = `<p style="color:red; text-align:center;">ଏରର୍: ${error}</p>`;
    }
}

function getFormData() {
    return {
        date: document.getElementById("date")?.value || "",
        className: document.getElementById("className")?.value || "",
        period: document.getElementById("period")?.value || "",
        subject: document.getElementById("subject")?.value || "",
        fullContent: document.getElementById("fullContent")?.value || ""
    };
}

window.addEventListener("load", function () {
    const today = new Date().toISOString().split("T")[0];
    const dateEl = document.getElementById("date");
    const searchDateEl = document.getElementById("searchDate");

    if (dateEl) dateEl.value = today;
    if (searchDateEl) searchDateEl.value = today;

    if (dateEl) dateEl.addEventListener("change", checkExistingNote);
    const classEl = document.getElementById("className");
    if (classEl) classEl.addEventListener("change", checkExistingNote);
    const subjectEl = document.getElementById("subject");
    if (subjectEl) subjectEl.addEventListener("change", checkExistingNote);
});

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

const classSelect = document.getElementById("searchClass");
const subjectSelect = document.getElementById("searchSubject");
if (classSelect && subjectSelect) {
    classSelect.addEventListener("change", function () {
        const selectedClass = this.value;
        subjectSelect.innerHTML = '<option value="">ବହି ବାଛନ୍ତୁ</option>';
        if (selectedClass && classBooks[selectedClass]) {
            classBooks[selectedClass].forEach(function (bookName) {
                const option = document.createElement("option");
                option.value = bookName;
                option.textContent = bookName;
                subjectSelect.appendChild(option);
            });
        } else {
            subjectSelect.innerHTML = '<option value="">ପ୍ରଥମେ ଶ୍ରେଣୀ ବାଛନ୍ତୁ</option>';
        }
    });
}

const adminClassSelect = document.getElementById("className");
const adminSubjectSelect = document.getElementById("subject");
if (adminClassSelect && adminSubjectSelect) {
    adminClassSelect.addEventListener("change", function () {
        const selectedClass = this.value;
        adminSubjectSelect.innerHTML = '<option value="">ବହି ବାଛନ୍ତୁ</option>';
        if (selectedClass && classBooks[selectedClass]) {
            classBooks[selectedClass].forEach(function (bookName) {
                const option = document.createElement("option");
                option.value = bookName;
                option.textContent = bookName;
                adminSubjectSelect.appendChild(option);
            });
        } else {
            adminSubjectSelect.innerHTML = '<option value="">ପ୍ରଥମେ ଶ୍ରେଣୀ ବାଛନ୍ତୁ</option>';
        }
        checkExistingNote();
    });
}
