/* --- CONFIGURATION & STATE --- */
let examQuestions = { math: [], english: [], chemistry: [] };
let currentSubject = 'math';
let currentIdx = { math: 0, english: 0, chemistry: 0 }; 
let userAnswers = { math: {}, english: {}, chemistry: {} };
let timeLeft = 5400; // 90 Minutes
let securityWarnings = 0;
let finalReport = ""; 
let timerInterval;

/* --- 1. SECURITY SYSTEM --- */
window.onblur = function() {
    securityWarnings++;
    if(securityWarnings >= 3) {
        alert("SECURITY BREACH: Multiple tab switches detected. Auto-submitting...");
        finishExam();
    } else {
        alert(`SECURITY WARNING: You left the exam screen! (${securityWarnings}/3 Warnings)`);
    }
};

/* --- 2. EXAM INITIALIZATION --- */
function startExam() {
    const name = document.getElementById('student-name').value;
    if(!name) return alert("Full Name Required!");

    // Subject configuration counts
    const counts = { math: 40, english: 30, chemistry: 30 };

    // Initialize: Pick random questions for each subject
    for(let sub in examQuestions) {
        if(typeof masterBank !== 'undefined' && masterBank[sub]) {
            let shuffled = [...masterBank[sub]].sort(() => 0.5 - Math.random());
            examQuestions[sub] = shuffled.slice(0, counts[sub]);
        } else {
            console.error(`Subject "${sub}" not found in masterBank!`);
        }
    }

    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('exam-screen').classList.remove('hidden');
    document.getElementById('exam-controls').classList.remove('hidden');

    startTimer();
    renderQuestion();
}

function startTimer() {
    timerInterval = setInterval(() => {
        timeLeft--;
        let m = Math.floor(timeLeft/60), s = timeLeft % 60;
        const box = document.getElementById('timer-box');
        box.innerText = `${m}:${s<10?'0':''}${s}`;
        
        if(timeLeft < 300) box.classList.add('low-time');
        if(timeLeft <= 0) { 
            clearInterval(timerInterval); 
            finishExam(); 
        }
    }, 1000);
}

/* --- 3. CORE NAVIGATION --- */
function switchSubject(sub) {
    currentSubject = sub;
    
    // Update UI Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`tab-${sub}`).classList.add('active');
    
    document.getElementById('subject-tag').innerText = sub.toUpperCase();
    renderQuestion();
}

function renderQuestion() {
    const sub = currentSubject;
    const idx = currentIdx[sub];
    
    if (!examQuestions[sub] || !examQuestions[sub][idx]) return;
    
    const q = examQuestions[sub][idx];

    // Update Meta Data
    document.getElementById('q-number').innerText = `Question ${idx + 1} of ${examQuestions[sub].length}`;
    document.getElementById('q-text').innerText = q.q;
    
    const grid = document.getElementById('options-grid');
    grid.innerHTML = "";
    
    // Render Options
    q.options.forEach(opt => {
        const btn = document.createElement('button');
        btn.innerText = opt;
        // Highlight if already answered
        btn.className = 'option-card' + (userAnswers[sub][idx] === opt ? ' selected' : '');
        btn.onclick = () => { 
            userAnswers[sub][idx] = opt; 
            renderQuestion(); 
        };
        grid.appendChild(btn);
    });

    // Handle Button Visibility
    document.getElementById('prev-btn').style.visibility = (idx === 0) ? "hidden" : "visible";
    
    const isLastOfCurrent = idx === examQuestions[sub].length - 1;
    document.getElementById('next-btn').classList.toggle('hidden', isLastOfCurrent);
    
    // Submit button logic: Only visible on the last question of the last subject
    const isEnd = (sub === 'chemistry' && isLastOfCurrent);
    document.getElementById('submit-btn').classList.toggle('hidden', !isEnd);
}

function navigate(dir) {
    const sub = currentSubject;
    const targetIdx = currentIdx[sub] + dir;
    
    if (targetIdx >= 0 && targetIdx < examQuestions[sub].length) {
        currentIdx[sub] = targetIdx;
        renderQuestion();
    }
}

/* --- 4. SCORING & RESULTS --- */
function finishExam() {
    clearInterval(timerInterval);
    let scores = { math: 0, english: 0, chemistry: 0 };
    
    // Calculate Scores
    for(let sub in scores) {
        examQuestions[sub].forEach((q, i) => { 
            if(userAnswers[sub][i] === q.a) scores[sub]++; 
        });
    }

    const total = scores.math + scores.english + scores.chemistry;
    const max = examQuestions.math.length + examQuestions.english.length + examQuestions.chemistry.length;
    const name = document.getElementById('student-name').value;

    // Update Result UI
    document.getElementById('res-candidate-name').innerText = name;
    document.getElementById('res-math').innerText = `${scores.math}/${examQuestions.math.length}`;
    document.getElementById('res-english').innerText = `${scores.english}/${examQuestions.english.length}`;
    document.getElementById('res-chemistry').innerText = `${scores.chemistry}/${examQuestions.chemistry.length}`;
    document.getElementById('res-total').innerText = `${total}/${max}`;
    document.getElementById('res-percent').innerText = ((total/max)*100).toFixed(1) + "%";

    document.getElementById('result-modal').classList.remove('hidden');

    // Build WhatsApp Report
    finalReport = `*OFFICIAL MOCK RESULT*%0A` +
                  `------------------------------------%0A` +
                  `*Candidate:* ${name}%0A%0A` +
                  `*SUBJECT BREAKDOWN*%0A` +
                  `*Math:* ${scores.math}/${examQuestions.math.length}%0A` +
                  `*English:* ${scores.english}/${examQuestions.english.length}%0A` +
                  `*Chemistry:* ${scores.chemistry}/${examQuestions.chemistry.length}%0A%0A` +
                  `*TOTAL SCORE:* ${total}/${max} (${((total/max)*100).toFixed(1)}%)%0A` +
                  `*Security Violations:* ${securityWarnings}%0A` +
                  `------------------------------------`;
}

function sendToWhatsApp() {
    const phone = "2347082828150";
    window.location.href = `https://wa.me/${phone}?text=${finalReport}`;
}