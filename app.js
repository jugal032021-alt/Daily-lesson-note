const baseURL = "https://daily-lesson-note-default-rtdb.asia-southeast1.firebasedatabase.app";

// 1. ନୂଆ ନୋଟ୍ ସେଭ୍ କରିବା (Save)
async function saveNote() {
  let note = getFormData();
  if (!note.date || !note.className || !note.subject) {
    alert("ଦୟା କରି ତାରିଖ, ଶ୍ରେଣୀ ଏବଂ ବିଷୟ ପୂରଣ କରନ୍ତୁ!");
    return;
  }
  try {
    const user = firebase.auth().currentUser;
    if (!user) { alert("ଦୟାକରି ଆଡମିନ୍ ଲଗଇନ୍ କରନ୍ତୁ!"); return; }
    const token = await user.getIdToken();

    let response = await fetch(`${baseURL}/notes.json?auth=${token}`, {
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

// 2. ଏଡିଟ୍ କରିବା ପାଇଁ ପୁରୁଣା ନୋଟ୍ ଖୋଜିବା (Fetch for Edit)
async function fetchNoteForEdit() {
  let sDate = document.getElementById('searchEditDate').value;
  let sClass = document.getElementById('searchEditClass').value;
  let sSub = document.getElementById('searchEditSubject').value;
  if (!sDate || !sClass || !sSub) {
    alert("ଦୟା କରି ତାରିଖ, ଶ୍ରେଣୀ ଏବଂ ବିଷୟ ସବୁକିଛି ବାଛନ୍ତୁ!");
    return;
  }
  try {
    let response = await fetch(`${baseURL}/notes.json?orderBy="date"&equalTo="${sDate}"`);
    let data = await response.json();
    let foundId = null;
    let foundNote = null;
    if(data) {
      for (let key in data) {
        if (data[key].className === sClass && data[key].subject === sSub) {
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

      const adminSubjectSelect = document.getElementById("subject");
      adminSubjectSelect.innerHTML = '<option value=""> </option>';
      if (foundNote.className && classBooks[foundNote.className]) {
        classBooks[foundNote.className].forEach(function(bookName) {
          const option = document.createElement("option");
          option.value = bookName;
          option.textContent = bookName;
          if (bookName === foundNote.subject) { option.selected = true; }
          adminSubjectSelect.appendChild(option);
        });
      }
      document.getElementById('subject').value = foundNote.subject;
      document.getElementById('period').value = foundNote.period || '';
      document.getElementById('topic').value = foundNote.topic || '';
      document.getElementById('outcomes').value = foundNote.outcomes || '';
      document.getElementById('tlm').value = foundNote.tlm || '';
      document.getElementById('adhiti').value = foundNote.adhiti || '';
      document.getElementById('bodha').value = foundNote.bodha || '';
      document.getElementById('abhyasa').value = foundNote.abhyasa || '';
      document.getElementById('prayoga').value = foundNote.prayoga || '';
      document.getElementById('prasara').value = foundNote.prasara || '';

      document.getElementById('modeText').innerText = "ଏଡିଟ୍ ମୋଡ୍ (Edit Mode)";
      document.getElementById('btnSubmit').style.display = 'none';
      document.getElementById('btnUpdate').style.display = 'block';
      document.getElementById('btnDelete').style.display = 'block';
      alert("ନୋଟ୍ ମିଳିଗଲା! ତଳକୁ ଯାଇ ଏଡିଟ୍ କରନ୍ତୁ");
    } else {
      alert("କ୍ଷମା କରିବେ, ଏହି ତାରିଖ, ଶ୍ରେଣୀ ଏବଂ ବିଷୟ ପାଇଁ କୌଣସି ନୋଟ୍ ମିଳିଲା ନାହିଁ!");
    }
  } catch (error) {
    alert("ଏରର୍: " + error);
  }
}

// 3. ସୁଧାରିବା ପରେ ଅପଡେଟ୍ କରିବା (Update)
async function updateNote() {
  let noteId = document.getElementById('noteId').value;
  let updatedNote = getFormData();
  try {
    const user = firebase.auth().currentUser;
    if (!user) { alert("ଦୟାକରି ଆଡମିନ୍ ଲଗଇନ୍ କରନ୍ତୁ!"); return; }
    const token = await user.getIdToken();

    let response = await fetch(`${baseURL}/notes/${noteId}.json?auth=${token}`, {
      method: 'PUT',
      body: JSON.stringify(updatedNote),
      headers: { 'Content-Type': 'application/json' }
    });
    if (response.ok) {
      alert("ନୋଟ୍ ସଫଳତାର ସହ ଅପଡେଟ୍ ହୋଇଗଲା!");
      window.location.reload();
    } else {
      alert("ଅପଡେଟ୍ କରିବାରେ ଅସୁବିଧା ହେଲା!");
    }
  } catch (error) {
    alert("ଏରର୍: " + error);
  }
}

// 4. ନୋଟ୍ କୁ ଡିଲିଟ୍ କରିବା (Delete)
async function deleteNote() {
  let noteId = document.getElementById('noteId').value;
  let confirmDelete = confirm("ଆପଣ ନିଶ୍ଚିତ ଭାବରେ ଏହି ନୋଟ୍ କୁ ଡିଲିଟ୍ କରିବାକୁ ଚାହୁଁଛନ୍ତି କି?");
  if (confirmDelete) {
    try {
      const user = firebase.auth().currentUser;
      if (!user) { alert("ଦୟାକରି ଆଡମିନ୍ ଲଗଇନ୍ କରନ୍ତୁ!"); return; }
      const token = await user.getIdToken();

      let response = await fetch(`${baseURL}/notes/${noteId}.json?auth=${token}`, {
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
        let response = await fetch(`${baseURL}/notes.json?orderBy="date"&equalTo="${searchDate}"`);
        let data = await response.json();
        if(data) {
            let foundNote = null;
            for (let key in data) {
                let noteSub = data[key].subject ? data[key].subject.toLowerCase() : "";
                if (data[key].className === searchClass && noteSub.includes(searchSubject)) {
                    foundNote = data[key];
                    break;
                }
            }
            if (foundNote) {
                resultArea.innerHTML = `
                    <div class="note-card">
                        <h3>${foundNote.className} - ${foundNote.subject}</h3>
                        <div class="note-item"><strong>ତାରିଖ:</strong> ${foundNote.date} | <strong>କାଳାଂଶ:</strong> ${foundNote.period}</div>
                        <div class="note-item"><strong>ପାଠ୍ୟ ପ୍ରସଙ୍ଗ (Topic):</strong> ${foundNote.topic}</div>
                        <div class="note-item"><strong>ଶିକ୍ଷଣ ଫଳାଫଳ:</strong> ${foundNote.outcomes}</div>
                        <div class="note-item"><strong>ଶିକ୍ଷଣ ସାମଗ୍ରୀ (TLM):</strong> ${foundNote.tlm}</div>
                        <h4 style="color:#0056b3; border-bottom: 1px dashed #ccc; margin-top:10px;">ପଞ୍ଚପଦୀ :</h4>
                        <div class="note-item"><strong>୧. ଅଧିତି:</strong> ${foundNote.adhiti}</div>
                        <div class="note-item"><strong>୨. ବୋଧ:</strong> ${foundNote.bodha}</div>
                        <div class="note-item"><strong>୩. ଅଭ୍ୟାସ:</strong> ${foundNote.abhyasa}</div>
                        <div class="note-item"><strong>୪. ପ୍ରୟୋଗ:</strong> ${foundNote.prayoga}</div>
                        <div class="note-item"><strong>୫. ପ୍ରସାର:</strong> ${foundNote.prasara}</div>
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

// Admin Panel Dropdown
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
    });
}

// Admin Panel Search Edit Dropdown
const searchEditClass = document.getElementById("searchEditClass");
const searchEditSubject = document.getElementById("searchEditSubject");
if (searchEditClass && searchEditSubject) {
    searchEditClass.addEventListener("change", function() {
        const selectedClass = this.value;
        searchEditSubject.innerHTML = '<option value="">ବିଷୟ ବାଛନ୍ତୁ</option>';
        if (selectedClass && classBooks[selectedClass]) {
            classBooks[selectedClass].forEach(function(bookName) {
                const option = document.createElement("option");
                option.value = bookName;
                option.textContent = bookName;
                searchEditSubject.appendChild(option);
            });
        } else {
            searchEditSubject.innerHTML = '<option value="">ପ୍ରଥମେ ଶ୍ରେଣୀ ବାଛନ୍ତୁ</option>';
        }
    });
}
