/* OAV-2026 TEST SYSTEM */
const oavDb=firebase.firestore();
let currentTestId=null,currentSubject=null,testQuestions=[],studentAnswers={},timerInterval=null,testDurationSeconds=1800;

document.addEventListener("DOMContentLoaded",()=>{
 if(document.getElementById("regSection")){
  if(localStorage.getItem("oav_student_mobile")){
   document.getElementById("regSection").style.display="none";
   document.getElementById("dashboardSection").style.display="block";
  }
  restoreRegisteredStudent();
 }
 if(document.getElementById("questionBox"))initializeTestPage();
 if(document.getElementById("resScore"))loadResultPage();
});

async function restoreRegisteredStudent(){
 const mobile=localStorage.getItem("oav_student_mobile");if(!mobile)return;
 try{
  const d=await oavDb.collection("oav_students").doc(mobile).get();
  if(!d.exists){localStorage.removeItem("oav_student_mobile");return}
  const s=d.data();
  document.getElementById("regSection").style.display="none";
  document.getElementById("dashboardSection").style.display="block";
  setText("welcomeMsg","Welcome, "+(s.name||"Student")+"!");
  setText("studentMeta",(s.school||"")+" • "+(s.city||""));
  loadAvailableTests();
 }catch(e){console.error(e)}
}

async function registerStudent(e){
 e.preventDefault();
 const name=document.getElementById("regName").value.trim(),
 school=document.getElementById("regSchool").value.trim(),
 city=document.getElementById("regCity").value.trim(),
 mobile=document.getElementById("regMobile").value.trim();
 if(!name||!school||!city||!mobile)return alert("Please fill all details.");
 if(!/^[0-9]{10}$/.test(mobile))return alert("Please enter a valid 10-digit mobile number.");
 try{
  await oavDb.collection("oav_students").doc(mobile).set(
   {name,school,city,mobile,registeredAt:firebase.firestore.FieldValue.serverTimestamp()},{merge:true}
  );
  localStorage.setItem("oav_student_mobile",mobile);
  document.getElementById("regSection").style.display="none";
  document.getElementById("dashboardSection").style.display="block";
  setText("welcomeMsg","Welcome, "+name+"!");
  setText("studentMeta",school+" • "+city);
  document.getElementById("studentRegForm").reset();
  alert("Registration successful!");
  loadAvailableTests();
 }catch(e){console.error(e);alert("Registration failed. Please check your connection.")}
}

async function loadAvailableTests(){
 const c=document.getElementById("testsListContainer");if(!c)return;
 try{
  const snap=await oavDb.collection("oav_tests").get();
  if(snap.empty){c.innerHTML='<p style="text-align:center;color:#777">No practice tests available yet.</p>';return}
  c.innerHTML="";
  snap.forEach(d=>{
   const x=d.data(),id=d.id,name=x.testName||"OAV Practice Test",
   subjects=x.subjects||["Mathematics","EVS","English"];
   let b=subjects.map(s=>`<a href="oav-test.html?test=${encodeURIComponent(id)}&subject=${encodeURIComponent(s)}" style="display:inline-block;margin:5px;padding:10px 15px;background:#0044cc;color:white;text-decoration:none;border-radius:6px;font-weight:bold">${escapeHTML(s)}</a>`).join("");
   c.innerHTML+=`<div style="background:#f8f9fa;border:1px solid #ddd;border-radius:8px;padding:15px;margin-bottom:15px"><h4 style="margin:0 0 8px;color:#0044cc">${escapeHTML(name)}</h4><p style="margin:5px 0 10px;color:#666">30 Marks • 30 Minutes</p><div>${b}</div></div>`;
  });
 }catch(e){console.error(e);c.innerHTML='<p style="text-align:center;color:red">Unable to load practice tests.</p>'}
}

async function loadQuestionsFromJSON(testId,subject){
 const file=`oav-data/${encodeURIComponent(testId)}-${encodeURIComponent(subject)}.json`;
 const r=await fetch(file);
 if(!r.ok)throw Error("Question file not found: "+file);

 const data=await r.json();
 if(!Array.isArray(data)||!data.length)
  throw Error("Invalid or empty question format.");

 const questions=[];

 data.forEach(item=>{
  if(Array.isArray(item.questions)){
   item.questions.forEach(q=>{
    questions.push({...q,passage:item.passage||""});
   });
  }else{
   questions.push(item);
  }
 });

 if(!questions.length)throw Error("No questions found.");
 return questions;
}

async function initializeTestPage(){
 const p=new URLSearchParams(location.search);
 currentTestId=p.get("test");currentSubject=p.get("subject");
 const mobile=localStorage.getItem("oav_student_mobile");
 if(!mobile){alert("Please register first.");location.href="oav-2026.html";return}
 if(!currentTestId||!currentSubject)return showStatus("Invalid test information.");
 try{
  const a=await oavDb.collection("oav_attempts").where("studentMobile","==",mobile).where("testId","==",currentTestId).where("subject","==",currentSubject).limit(1).get();
  if(!a.empty){
   const q=document.getElementById("questionBox"),t=document.getElementById("timerDisplay");
   if(q)q.style.display="none";if(t)t.style.display="none";
   return showStatus(`<div class="already-attempted"><h3>⚠️ You have already attempted this test.</h3><p>You can attempt each subject only once.</p><a href="oav-result.html?test=${encodeURIComponent(currentTestId)}&subject=${encodeURIComponent(currentSubject)}">View Result →</a></div>`);
  }
  const td=await oavDb.collection("oav_tests").doc(currentTestId).get();
  if(td.exists){
   const x=td.data();testDurationSeconds=(x.duration||30)*60;
   setText("lblTestName","Test: "+(x.testName||"OAV Practice Test"));
  }
  setText("lblSubject","Subject: "+currentSubject);setText("lblTotalMarks","Marks: 30");
  testQuestions=(await loadQuestionsFromJSON(currentTestId,currentSubject)).slice(0,30);
  if(!testQuestions.length)throw Error("No questions found.");
  const st=document.getElementById("testStatusMsg"),qb=document.getElementById("questionBox");
  if(st)st.style.display="none";if(qb)qb.style.display="block";
  startTimer();renderQuestion();
 }catch(e){console.error(e);showStatus("Error loading test: "+e.message)}
}

function showStatus(m){
 const e=document.getElementById("testStatusMsg");if(e){e.innerHTML=m;e.style.display="block"}
}

function startTimer(){
 let r=testDurationSeconds,t=document.getElementById("timeRemaining");if(!t)return;
 clearInterval(timerInterval);
 timerInterval=setInterval(()=>{
  t.innerText=String(Math.floor(r/60)).padStart(2,"0")+":"+String(r%60).padStart(2,"0");
  if(r<=0){clearInterval(timerInterval);submitTest(true);return}r--;
 },1000);
}

/* Passage + Question support */
function renderQuestion(){
 const title=document.getElementById("qNumberTitle"),
 box=document.getElementById("optionsContainer");if(!box)return;
 setText("qNumberTitle","All Questions ("+testQuestions.length+")");
 const old=document.getElementById("qText");if(old)old.innerHTML="";
 box.innerHTML="";

 let lastPassage="";
 testQuestions.forEach((q,i)=>{
  const d=document.createElement("div");d.className="all-question";

  if(q.passage&&q.passage!==lastPassage){
   const p=document.createElement("div");
   p.className="passage-box";
   p.innerHTML="<strong>📖 Passage</strong><br>"+escapeHTML(q.passage);
   d.appendChild(p);lastPassage=q.passage;
  }

  const qt=document.createElement("div");qt.className="all-question-title";
  qt.innerHTML="<strong>Question "+(i+1)+".</strong> "+escapeHTML(q.question||"");
  d.appendChild(qt);

  [["A",q.optionA],["B",q.optionB],["C",q.optionC],["D",q.optionD]].forEach(o=>{
   const l=document.createElement("label");l.className="option-label";
   l.innerHTML=`<input type="radio" name="question_${i}" value="${o[0]}"><span><b>${o[0]}.</b> ${escapeHTML(o[1]||"")}</span>`;
   const r=l.querySelector("input");r.checked=studentAnswers[i]===o[0];
   r.addEventListener("change",()=>studentAnswers[i]=o[0]);
   d.appendChild(l);
  });
  box.appendChild(d);
 });
 const prev=document.getElementById("btnPrev"),next=document.getElementById("btnNext"),sub=document.getElementById("btnSubmitTest");
 if(prev)prev.style.display="none";if(next)next.style.display="none";if(sub)sub.style.display="inline-block";
}

function confirmSubmitTest(){
 const n=Object.keys(studentAnswers).length;
 if(confirm(`You answered ${n} of ${testQuestions.length} questions.\n\nSubmit test?`)){
  clearInterval(timerInterval);submitTest(false);
 }
}

async function submitTest(autoSubmit){
 const mobile=localStorage.getItem("oav_student_mobile");if(!mobile)return alert("Student information not found.");
 try{
  const sd=await oavDb.collection("oav_students").doc(mobile).get(),
  s=sd.exists?sd.data():{name:"Student",school:"N/A",city:"N/A"};
  let correct=0;
  testQuestions.forEach((q,i)=>{
   if(String(studentAnswers[i]||"").toUpperCase().trim()===String(q.correctAnswer||"").toUpperCase().trim())correct++;
  });
  const total=testQuestions.length,wrong=total-correct,percentage=total?Math.round(correct/total*100):0;

  await oavDb.collection("oav_attempts").add({
   studentMobile:mobile,testId:currentTestId,subject:currentSubject,attempted:true,
   submittedAt:firebase.firestore.FieldValue.serverTimestamp()
  });

  await oavDb.collection("oav_results").add({
   studentMobile:mobile,studentName:s.name,school:s.school,city:s.city,
   testId:currentTestId,subject:currentSubject,score:correct,totalMarks:total,
   percentage,correct,wrong,studentAnswers,
   createdAt:firebase.firestore.FieldValue.serverTimestamp()
  });

  location.href=`oav-result.html?test=${encodeURIComponent(currentTestId)}&subject=${encodeURIComponent(currentSubject)}`;
 }catch(e){console.error(e);alert("Submit error: "+e.message)}
}

async function loadResultPage(){
 const p=new URLSearchParams(location.search),testId=p.get("test"),subject=p.get("subject"),mobile=localStorage.getItem("oav_student_mobile");
 if(!testId||!subject||!mobile)return;
 try{
  const r=await oavDb.collection("oav_results").where("studentMobile","==",mobile).where("testId","==",testId).where("subject","==",subject).limit(1).get();
  if(r.empty)return;
  const d=r.docs[0].data();
  setText("resScore",`${d.score} / ${d.totalMarks}`);
  setText("resPercentage",`${d.percentage}%`);
  setText("resCorrectWrong",`${d.correct} / ${d.wrong}`);
  setText("resSubject",subject);
  renderQuestionReview((await loadQuestionsFromJSON(testId,subject)).slice(0,30),d.studentAnswers||{});
 }catch(e){
  console.error(e);
  const x=document.getElementById("reviewContainer");
  if(x)x.innerHTML='<p style="text-align:center;color:red;padding:20px">Unable to load result.</p>';
 }
}

function renderQuestionReview(qs,ans){
 const box=document.getElementById("reviewContainer");if(!box)return;
 box.innerHTML="";
 qs.forEach((q,i)=>{
  const c=String(q.correctAnswer||"").toUpperCase().trim(),s=String(ans[i]||"").toUpperCase().trim(),ok=s===c;
  let o="";
  [["A",q.optionA],["B",q.optionB],["C",q.optionC],["D",q.optionD]].forEach(x=>{
   let cl="review-option",mark="";
   if(x[0]===c){cl+=" review-correct";mark='<span class="correct-mark">✅ Correct Answer</span>'}
   if(x[0]===s&&x[0]!==c){cl+=" review-wrong";mark='<span class="wrong-mark">❌ Your Answer</span>'}
   o+=`<div class="${cl}"><div class="review-option-letter">${x[0]}</div><div class="review-option-text">${escapeHTML(x[1]||"")}${mark}</div></div>`;
  });
  const result=ok?'<div class="answer-correct">✅ Correct Answer Selected</div>':!s?'<div class="answer-not-answered">⚪ Not Answered</div>':'<div class="answer-wrong">❌ Wrong Answer</div>';
  const ex=q.explanation||q.solution||q.answerExplanation||"No explanation available.";
  box.innerHTML+=`<div class="review-question-card">${q.passage?`<div class="passage-box"><strong>📖 Passage</strong><br>${escapeHTML(q.passage)}</div>`:""}<div class="review-question-title">Q${i+1}. ${escapeHTML(q.question||"")}</div><div class="review-options-grid">${o}</div>${result}<div class="solution-box"><div class="solution-title">💡 Solution</div><div>${escapeHTML(ex)}</div></div></div>`;
 });
}

function setText(id,v){const e=document.getElementById(id);if(e)e.innerText=v}
function escapeHTML(v){return String(v??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;")}

function changeUser(){
 localStorage.removeItem("oav_student_mobile");
 const r=document.getElementById("regSection"),d=document.getElementById("dashboardSection");
 if(r)r.style.display="block";if(d)d.style.display="none";
 ["regName","regSchool","regCity","regMobile"].forEach(id=>{const e=document.getElementById(id);if(e)e.value=""});
}
