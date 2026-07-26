// ଆପଣଙ୍କର Firebase ଲିଙ୍କ୍
const baseURL = "https://daily-lesson-note-default-rtdb.asia-southeast1.firebasedatabase.app"; 

// 1. ନୂଆ ନୋଟ୍ ସେଭ୍ କରିବା (Save)
async function saveNote() {
    let note = getFormData();
    if (!note.date || !note.className || !note.subject) { alert("ଦୟାକରି ତାରିଖ, ଶ୍ରେଣୀ ଏବଂ ବିଷୟ ପୂରଣ କରନ୍ତୁ!"); return; }

    try {
        let response = await fetch(`${baseURL}/notes.json`, {
            method: 'POST',
            body: JSON.stringify(note),
            headers: { 'Content-Type': 'application/json' }
        });
        if(response.ok) { alert("ସଫଳତାର ସହ ଅପଲୋଡ୍ ହୋଇଗଲା!"); window.location.reload(); } 
        else { alert("କିଛି ଅସୁବିଧା ହେଲା!"); }
    } catch (error) { alert("ଏରର୍: " + error); }
}

// 2. ଏଡିଟ୍ କରିବା ପାଇଁ ପୁରୁଣା ନୋଟ୍ ଖୋଜିବା (Fetch for Edit)
async function fetchNoteForEdit() {
    let sDate = document.getElementById('searchEditDate').value;
    let sClass = document.getElementById('searchEditClass').value;
    if (!sDate) { alert("ଦୟାକରି ତାରିଖ ବାଛନ୍ତୁ!"); return; }

    try {
        let response = await fetch(`${baseURL}/notes.json`);
        let data = await response.json();
        
        let foundId = null;
        let foundNote = null;

        if(data) {
            for (let key in data) {
                if (data[key].date === sDate && data[key].className === sClass) {
                    foundId = key;
                    foundNote = data[key];
                    break;
                }
            }
        }

        if (foundNote) {
            document.getElementById('noteId').value = foundId; 
            document.getElementById('date').value = foundNote.date;
            document.getElementById('className').value = foundNote.className;
            document.getElementById('period').value = foundNote.period;
            document.getElementById('subject').value = foundNote.subject;
            document.getElementById('topic').value = foundNote.topic;
            document.getElementById('outcomes').value = foundNote.outcomes;
            document.getElementById('tlm').value = foundNote.tlm;
            document.getElementById('adhiti').value = foundNote.adhiti;
            document.getElementById('bodha').value = foundNote.bodha;
            document.getElementById('abhyasa').value = foundNote.abhyasa;
            document.getElementById('prayoga').value = foundNote.prayoga;
            document.getElementById('prasara').value = foundNote.prasara;

            document.getElementById('modeText').innerText = "ନୋଟ୍ କୁ ଏଡିଟ୍ କରନ୍ତୁ";
            document.getElementById('btnSubmit').style.display = 'none';
            document.getElementById('btnUpdate').style.display = 'block';
            document.getElementById('btnDelete').style.display = 'block';
            
            alert("ନୋଟ୍ ମିଳିଗଲା! ତଳକୁ ଯାଇ ଏଡିଟ୍ କରନ୍ତୁ।");
        } else {
            alert("କ୍ଷମା କରିବେ, ଏହି ତାରିଖ ପାଇଁ କୌଣସି ନୋଟ୍ ମିଳିଲା ନାହିଁ!");
        }
    } catch (error) { alert("ଏରର୍: " + error); }
}

// 3. ସୁଧାରିବା ପରେ ଅପଡେଟ୍ କରିବା (Update)
async function updateNote() {
    let noteId = document.getElementById('noteId').value;
    let updatedNote = getFormData();
    
    try {
        let response = await fetch(`${baseURL}/notes/${noteId}.json`, {
            method: 'PUT',
            body: JSON.stringify(updatedNote),
            headers: { 'Content-Type': 'application/json' }
        });
        if(response.ok) { alert("ନୋଟ୍ ସଫଳତାର ସହ ଅପଡେଟ୍ ହୋଇଗଲା!"); window.location.reload(); } 
        else { alert("ଅପଡେଟ୍ କରିବାରେ ଅସୁବିଧା ହେଲା!"); }
    } catch (error) { alert("ଏରର୍: " + error); }
}

// 4. ନୋଟ୍ କୁ ଡିଲିଟ୍ କରିବା (Delete)
async function deleteNote() {
    let noteId = document.getElementById('noteId').value;
    let confirmDelete = confirm("ଆପଣ ନିଶ୍ଚିତ ଭାବରେ ଏହି ନୋଟ୍ କୁ ଡିଲିଟ୍ କରିବାକୁ ଚାହୁଁଛନ୍ତି କି?");
    
    if (confirmDelete) {
        try {
            let response = await fetch(`${baseURL}/notes/${noteId}.json`, {
                method: 'DELETE'
            });
            if(response.ok) { alert("ନୋଟ୍ ସମ୍ପୂର୍ଣ୍ଣ ରୂପେ ଡିଲିଟ୍ ହୋଇଗଲା!"); window.location.reload(); } 
            else { alert("ଡିଲିଟ୍ କରିବାରେ ଅସୁବିଧା ହେଲା!"); }
        } catch (error) { alert("ଏରର୍: " + error); }
    }
}

// 5. ଶିକ୍ଷକଙ୍କ ପାଇଁ Index ପେଜ୍ ରୁ ଖୋଜିବା (ଅପଡେଟ୍ ହୋଇଥିବା)
async function searchNote() {
    let searchDate = document.getElementById('searchDate').value;
    let searchClass = document.getElementById('searchClass').value;
    let searchSubject = document.getElementById('searchSubject').value.trim().toLowerCase(); // ନୂଆ ବିଷୟ ଫିଲ୍ଟର୍
    let resultArea = document.getElementById('resultArea');

    if (!searchDate || !searchClass || !searchSubject) { 
        alert("ଦୟାକରି ତାରିଖ, ଶ୍ରେଣୀ ଓ ବିଷୟ ପୂରଣ କରନ୍ତୁ!"); 
        return; 
    }
    
    resultArea.innerHTML = "<p style='text-align:center;'>ଖୋଜା ଚାଲିଛି...</p>";

    try {
        let response = await fetch(`${baseURL}/notes.json`);
        let data = await response.json();

        if(data) {
            let foundNote = null;
            // ତାରିଖ, ଶ୍ରେଣୀ ଏବଂ ବିଷୟ (subject) ତିନୋଟି ଯାକ ମ୍ୟାଚ୍ କରିବା
            for (let key in data) {
                let noteSub = data[key].subject ? data[key].subject.toLowerCase() : "";
                
                if (data[key].date === searchDate && 
                    data[key].className === searchClass && 
                    noteSub.includes(searchSubject)) {
                    foundNote = data[key]; 
                    break;
                }
            }

            if (foundNote) {
                resultArea.innerHTML = `
                    <div class="note-card">
                        <h3>${foundNote.className} - ${foundNote.subject}</h3>
                        <div class="note-item"><strong>ତାରିଖ:</strong> ${foundNote.date} | <strong>ପିରିୟଡ଼:</strong> ${foundNote.period}</div>
                        <div class="note-item"><strong>ପାଠ୍ୟ ପ୍ରସଙ୍ଗ (Topic):</strong> ${foundNote.topic}</div>
                        <div class="note-item"><strong>ଶିକ୍ଷଣ ଫଳାଫଳ:</strong> ${foundNote.outcomes}</div>
                        <div class="note-item"><strong>ଶିକ୍ଷଣ ସାମଗ୍ରୀ (TLM):</strong> ${foundNote.tlm}</div>
                        <h4 style="color:#0056b3; border-bottom: 1px dashed #ccc;">ପଞ୍ଚପଦୀ:</h4>
                        <div class="note-item"><strong>୧. ଅଧିତି:</strong> ${foundNote.adhiti}</div>
                        <div class="note-item"><strong>୨. ବୋଧ:</strong> ${foundNote.bodha}</div>
                        <div class="note-item"><strong>୩. ଅଭ୍ୟାସ:</strong> ${foundNote.abhyasa}</div>
                        <div class="note-item"><strong>୪. ପ୍ରୟୋଗ:</strong> ${foundNote.prayoga}</div>
                        <div class="note-item"><strong>୫. ପ୍ରସାର:</strong> ${foundNote.prasara}</div>
                    </div>
                `;
            } else { resultArea.innerHTML = `<p style="color:red; text-align:center; margin-top:20px;">କୌଣସି ନୋଟ୍ ମିଳିଲା ନାହିଁ! (ଦୟାକରି ତାରିଖ, ଶ୍ରେଣୀ ଓ ବିଷୟର ବନାନ ଠିକ୍ ଅଛି କି ନାହିଁ ଯାଞ୍ଚ କରନ୍ତୁ)</p>`; }
        } else { resultArea.innerHTML = `<p style="color:red; text-align:center; margin-top:20px;">ଏପର୍ଯ୍ୟନ୍ତ କୌଣସି ଡାଟା ଉପଲବ୍ଧ ନାହିଁ!</p>`; }
    } catch (error) { resultArea.innerHTML = `<p style="color:red; text-align:center;">କିଛି ଅସୁବିଧା ହେଲା!</p>`; }
}

function getFormData() {
    return {
        date: document.getElementById('date').value,
        className: document.getElementById('className').value,
        period: document.getElementById('period').value,
        subject: document.getElementById('subject').value,
        topic: document.getElementById('topic').value,
        outcomes: document.getElementById('outcomes').value,
        tlm: document.getElementById('tlm').value,
        adhiti: document.getElementById('adhiti').value,
        bodha: document.getElementById('bodha').value,
        abhyasa: document.getElementById('abhyasa').value,
        prayoga: document.getElementById('prayoga').value,
        prasara: document.getElementById('prasara').value
    };
}

window.onload = function() {
    let today = new Date().toISOString().split('T')[0];
    if(document.getElementById('date')) document.getElementById('date').value = today;
    if(document.getElementById('searchDate')) document.getElementById('searchDate').value = today;
    if(document.getElementById('searchEditDate')) document.getElementById('searchEditDate').value = today;
}
