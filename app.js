const baseURL = "https://daily-lesson-note-default-rtdb.asia-southeast1.firebasedatabase.app";

// 1. ନୂଆ ନୋଟ୍ ସେଭ୍ କରିବା (Save)
async function saveNote() {
  let note = getFormData();
  if (!note.date || !note.className || !note.subject || !note.fullContent) {
    alert("ଦୟା କରି ତାରିଖ, ଶ୍ରେଣୀ, ବିଷୟ ଏବଂ ନୋଟ୍ ଲେଖା ପୂରଣ କରନ୍ତୁ!");
    return;
  }
  try {
    let response = await fetch(`${baseURL}/notes.json`, {
      method: 'POST',
      body: JSON.stringify(note),
      headers: { 'Content-Type': 'application/json' }
    });
    if(response.ok) {
      alert("ସଫଳତାର ସହ ଅପଲୋଡ଼ ହୋଇଗଲା!");
      window.location.reload();
    } else {
      alert("କିଛି ଅସୁବିଧା ହେଲା!");
    }
  } catch (error) {
    alert("ଏରର୍: " + error);
  }
}

// 3. ଅପଡେଟ୍ କରିବା (Update using PATCH)
async function updateNote() {
    let noteId = document.getElementById('noteId').value;
    if (!noteId) {
        alert("ଅପଡେଟ୍ କରିବା ପାଇଁ କୌଣସି ନୋଟ୍ ଚୟନ ହୋଇନାହିଁ!");
        return;
    }
    let updatedNote = getFormData();
    try {
        let response = await fetch(`${baseURL}/notes/${noteId}.json`, {
            method: 'PATCH',
            body: JSON.stringify(updatedNote),
            headers: { 'Content-Type': 'application/json' }
        });
        if (response.ok) {
            alert("ନୋଟ୍ ସଫଳତା ସହ ଅପଡେଟ୍ ହୋଇଗଲା!");
            window.location.reload();
        } else {
            alert("ଅପଡେଟ୍ କରିବାରେ ଅସୁବିଧା ହେଲା!");
        }
    } catch (error) {
        alert("ଏରର୍: " + error);
    }
}

// 4. ନୋଟ୍ ଡିଲିଟ୍ କରିବା (Delete)
async function deleteNote() {
  let noteId = document.getElementById('noteId').value;
  if (!noteId) {
    alert("ଡିଲିଟ୍ କରିବା ପାଇଁ କୌଣସି ନୋଟ୍ ଚୟନ ହୋଇନାହିଁ!");
    return;
  }
  let confirmDelete = confirm("ଆପଣ ନିଶ୍ଚିତ ଭାବରେ ଏହି ନୋଟ୍ କୁ ଡିଲିଟ୍ କରିବାକୁ ଚାହୁଁଛନ୍ତି କି?");
  if (confirmDelete) {
    try {
      let response = await fetch(`${baseURL}/notes/${noteId}.json`, {
        method: 'DELETE'
      });
      if(response.ok) {
        alert("ନୋଟ୍ ସମ୍ପୂର୍ଣ ରୂପେ ଡିଲିଟ୍ ହୋଇଗଲା!");
        window.location.reload();
      } else {
        alert("ଡିଲିଟ୍ କରିବାରେ ଅସୁବିଧା ହେଲା!");
      }
    } catch (error) {
      alert("ଏରର୍: " + error);
    }
  }
}

// ତାରିଖ, ଶ୍ରେଣୀ ଓ ବିଷୟ ବାଛିବା ମାତ୍ରେ ପୁରୁଣା/ନୂଆ ନୋଟ୍ ଅଟୋ-ଲୋଡ୍ ହେବା
async function checkExistingNote() {
    let sDate = document.getElementById('date').value;
    let sClass = document.getElementById('className').value;
    let sSub = document.getElementById('subject').value;
    
    if (!sDate || !sClass || !sSub) return;

    try {
        let response = await fetch(`${baseURL}/notes.json`);
        let data = await response.json();
        let foundId = null;
        let foundNote = null;
        if(data) {
            for (let key in data) {
                if (data[key].date === sDate && data[key].className === sClass && data[key].subject === sSub) {
                    foundId = key;
                    foundNote = data[key];
                    break;
                }
            }
        }
        if (foundNote) {
            document.getElementById('noteId').value = foundId;
            document.getElementById('period').value = foundNote.period || '';
            
            // ଯଦି ନୂଆ ଫର୍ମାଟ୍ ଥାଏ (fullContent) ତେବେ ତାହା ଦେଖାବ, ନହଲେ ପୁରୁଣା ଫିଲ୍ଡଗୁଡ଼ିକୁ ମିଶାଇ ଦେଖାବ
            if (foundNote.fullContent) {
                document.getElementById('fullContent').value = foundNote.fullContent;
            } else {
                let oldText = `ପାଠ୍ୟ ପ୍ରସଙ୍ଗ: ${foundNote.topic || ''}\n` +
                              `ଶିକ୍ଷଣ ଫଳାଫଳ: ${foundNote.outcomes || ''}\n` +
                              `ଶିକ୍ଷଣ ସାମଗ୍ରୀ: ${foundNote.tlm || ''}\n\n` +
                              `ପଞ୍ଚପଦୀ:\n` +
                              `୧. ଅଧିତି: ${foundNote.adhiti || ''}\n` +
                              `୨. ବୋଧ: ${foundNote.bodha || ''}\n` +
                              `୩. ଅଭ୍ୟାସ: ${foundNote.abhyasa || ''}\n` +
                              `୪. ପ୍ରୟୋଗ: ${foundNote.prayoga || ''}\n` +
                              `୫. ପ୍ରସାର: ${foundNote.prasara || ''}`;
                document.getElementById('fullContent').value = oldText;
            }

            document.getElementById('modeText').innerText = "ଏଡିଟ୍ ମୋଡ୍ (ପୁରୁଣା ନୋଟ୍ ଅଟୋ-ଲୋଡ୍ ହେଲା)";
            document.getElementById('btnSubmit').style.display = 'none';
            document.getElementById('btnUpdate').style.display = 'block';
            document.getElementById('btnDelete').style.display = 'block';
        } else {
            document.getElementById('noteId').value = '';
            document.getElementById('period').value = '';
            document.getElementById('fullContent').value = '';

            document.getElementById('modeText').innerText = "ନୂତନ ନୋଟ୍ ଅପଲୋଡ଼ ଫର୍ମ";
            document.getElementById('btnSubmit').style.display = 'block';
            document.getElementById('btnUpdate').style.display = 'none';
            document.getElementById('btnDelete').style.display = 'none';
        }
    } catch (error) {
        console.error(error);
    }
}

// 5. ଶିକ୍ଷକଙ୍କ ପାଇଁ Index ପେଜ୍‌ରୁ ଖୋଜିବା
async function searchNote() {
    let searchDate = document.getElementById('searchDate').value;
    let searchClass = document.getElementById('searchClass').value;
    let searchSubject = document.getElementById('searchSubject').value.trim().toLowerCase();
    let resultArea = document.getElementById('resultArea');
    if (!searchDate || !searchClass || !searchSubject) {
        alert("ଦୟା କରି ତାରିଖ, ଶ୍ରେଣୀ ଓ ବିଷୟ ପୂରଣ କରନ୍ତୁ!");
        return;
    }
    resultArea.innerHTML = "<p style='text-align:center;'>ଖୋଜା ଚାଲିଛି...</p>";
    try {
        let response = await fetch(`${baseURL}/notes.json`);
        let data = await response.json();
        if(data) {
            let foundNote = null;
            for (let key in data) {
                let noteSub = data[key].subject ? data[key].subject.toLowerCase() : "";
                if (data[key].date === searchDate && data[key].className === searchClass && noteSub.includes(searchSubject)) {
                    foundNote = data[key];
                    break;
                }
            }
            if (foundNote) {
                let contentToShow = foundNote.fullContent ? foundNote.fullContent : 
                    (`ପାଠ୍ୟ ପ୍ରସଙ୍ଗ: ${foundNote.topic || ''}\nଶିକ୍ଷଣ ଫଳାଫଳ: ${foundNote.outcomes || ''}\nଶିକ୍ଷଣ ସାମଗ୍ରୀ: ${foundNote.tlm || ''}\n\nପଞ୍ଚପଦୀ:\n୧. ଅଧିତି: ${foundNote.adhiti || ''}\n୨. ବୋଧ: ${foundNote.bodha || ''}\n୩. ଅଭ୍ୟାସ: ${foundNote.abhyasa || ''}\n୪. ପ୍ରୟୋଗ: ${foundNote.prayoga || ''}\n୫. ପ୍ରସାର: ${foundNote.prasara || ''}`);

                resultArea.innerHTML = `
                    <div class="note-card">
                        <h3>${foundNote.className} - ${foundNote.subject}</h3>
                        <div class="note-item"><strong>ତାରିଖ:</strong> ${foundNote.date} | <strong>କାଳାଂଶ:</strong> ${foundNote.period}</div>
                        <div class="note-item" style="white-space: pre-wrap; margin-top: 10px; line-height: 1.6; background: #f9f9f9; padding: 12px; border-radius: 5px; border-left: 4px solid #0056b3;">${contentToShow}</div>
                    </div>
                `;
            } else {
                resultArea.innerHTML = `<p style="color:red; text-align:center; margin-top:15px;">କ୍ଷମା କରିବେ, ଏହି ତାରିଖ, ଶ୍ରେଣୀ ଏବଂ ବିଷୟ ପାଇଁ କୌଣସି ନୋଟ୍ ମିଳିଲା ନାହିଁ!</p>`;
            }
        } else {
            resultArea.innerHTML = `<p style="color:red; text-align:center; margin-top:15px;">ଏହି ତାରିଖରେ କୌଣସି ନୋଟ୍ ନାହିଁ।</p>`;
        }
    } catch (error) { 
        resultArea.innerHTML = `<p style="color:red; text-align:center;">ଏରର୍: ${error}</p>`; 
    }
}

function getFormData() {
    return {
        date: document.getElementById('date').value,
        className: document.getElementById('className').value,
        period: document.getElementById('period').value,
        subject: document.getElementById('subject').value,
        fullContent: document.getElementById('fullContent').value
    };
}

window.onload = function() {
    let today = new Date().toISOString().split('T')[0];
    if(document.getElementById('date')) document.getElementById('date').value = today;
    if(document.getElementById('searchDate')) document.getElementById('searchDate').value = today;
    
    if(document.getElementById('date')) document.getElementById('date').addEventListener('change', checkExistingNote);
    if(document.getElementById('className')) document.getElementById('className').addEventListener('change', checkExistingNote);
    if(document.getElementById('subject')) document.getElementById('subject').addEventListener('change', checkExistingNote);
}

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

// Index Page Dropdown
const classSelect = document.getElementById("searchClass");
const subjectSelect = document.getElementById("searchSubject");
if (classSelect && subjectSelect) {
    classSelect.addEventListener("change", function() {
        const selectedClass = this.value;
        subjectSelect.innerHTML = '<option value="">ବହି ବାଛନ୍ତୁ</option>';
        if (selectedClass && classBooks[selectedClass]) {
            classBooks[selectedClass].forEach(function(bookName) {
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

// Admin Panel Main Dropdown
const adminClassSelect = document.getElementById("className");
const adminSubjectSelect = document.getElementById("subject");
if (adminClassSelect && adminSubjectSelect) {
    adminClassSelect.addEventListener("change", function() {
        const selectedClass = this.value;
        adminSubjectSelect.innerHTML = '<option value="">ବହି ବାଛନ୍ତୁ</option>';
        if (selectedClass && classBooks[selectedClass]) {
            classBooks[selectedClass].forEach(function(bookName) {
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
