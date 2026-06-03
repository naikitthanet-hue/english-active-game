let questions = [...scienceData];
let currentIdx = 0;
let score = 0;
let active = false;
let controlMode = 'mouse';
let cameraStarted = false;
let pose = null;
let camera = null;

const video = document.querySelector('.input_video');
const canvas = document.querySelector('.output_canvas');
const ctx = canvas.getContext('2d');

function initCameraSystem() {
    if (pose && camera) return true;
    
    try {
        if (typeof Pose === 'undefined' || typeof Camera === 'undefined') {
            alert('ระบบกำลังโหลดส่วนประกอบ AI จากอินเทอร์เน็ต กรุณารอ 5-10 วินาทีแล้วลองกดอีกครั้ง หรือเลือกโหมดเมาส์เพื่อเล่นได้ทันทีครับ');
            return false;
        }

        pose = new Pose({locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`});
        pose.setOptions({ modelComplexity: 1, minDetectionConfidence: 0.5 });
        pose.onResults(onResults);

        camera = new Camera(video, { 
            onFrame: async () => {
                if (controlMode === 'camera' && pose) {
                    await pose.send({image: video});
                }
            }, 
            width: 800, height: 600 
        });
        return true;
    } catch (error) {
        console.error('Camera init error:', error);
        return false;
    }
}

function selectMode(mode) {
    controlMode = mode;
    
    const hintText = document.getElementById('control-hint');
    const leftCard = document.getElementById('ans-left');
    const rightCard = document.getElementById('ans-right');
    
    // ลบหน้าจอ exit เก่าออกถ้ามี
    const oldExit = document.getElementById('exit-screen');
    if (oldExit) oldExit.remove();
    
    if (mode === 'camera') {
        const isReady = initCameraSystem();
        if (!isReady) return; 

        hintText.innerText = "🎥 โหมดกล้อง: ยกมือขึ้นในฝั่งคำตอบที่ต้องการเลือก";
        leftCard.classList.remove('clickable');
        rightCard.classList.remove('clickable');
        
        document.getElementById('start-screen').classList.add('hidden');
        document.getElementById('game-screen').classList.remove('hidden');
        document.getElementById('bg-music').play();
        
        if (!cameraStarted && camera) {
            camera.start();
            cameraStarted = true;
        }
    } else {
        hintText.innerText = "🖱️ โหมดเมาส์: ใช้เมาส์คลิกกล่องคำตอบที่ถูกต้องได้เลย";
        leftCard.classList.add('clickable');
        rightCard.classList.add('clickable');
        
        document.getElementById('start-screen').classList.add('hidden');
        document.getElementById('game-screen').classList.remove('hidden');
        document.getElementById('bg-music').play();
        
        if (cameraStarted && camera) {
            camera.stop();
            cameraStarted = false;
        }
    }
    initGame();
}

function showInstructions() {
    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('instruction-screen').classList.remove('hidden');
}

function showMainMenu() {
    document.getElementById('instruction-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.add('hidden');
    document.getElementById('summary-screen').classList.add('hidden');
    
    const oldExit = document.getElementById('exit-screen');
    if (oldExit) oldExit.remove();
    
    document.getElementById('start-screen').classList.remove('hidden');
    document.getElementById('bg-music').pause();
    document.getElementById('bg-music').currentTime = 0;
    if (cameraStarted && camera) {
        camera.stop();
        cameraStarted = false;
    }
}

function initGame() {
    currentIdx = 0;
    score = 0;
    document.getElementById('score').innerText = score;
    loadNext();
}

function restartGame() {
    document.getElementById('summary-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');
    selectMode(controlMode);
}

function loadNext() {
    if(currentIdx >= questions.length) {
        endGame();
        return;
    }
    const q = questions[currentIdx];
    document.getElementById('question-text').innerText = q.q;
    document.getElementById('ans-left').innerText = q.left;
    document.getElementById('ans-right').innerText = q.right;
    setTimeout(() => { active = true; }, 1200);
}

function handleMouseClick(side) {
    if (controlMode === 'mouse') {
        checkAnswer(side);
    }
}

function checkAnswer(side) {
    if(!active) return;
    active = false;
    const q = questions[currentIdx];
    const isCorrect = (side === q.ans);
    
    const fb = document.getElementById('feedback');
    if(isCorrect) {
        score++;
        document.getElementById('score').innerText = score;
        document.getElementById('correct-sound').play();
        fb.innerHTML = "✔️ ถูกต้อง! 🎉"; 
        fb.style.backgroundColor = "#2ecc71";
        fb.style.color = "white";
    } else {
        document.getElementById('wrong-sound').play();
        fb.innerHTML = "❌ ผิดจ้า! 😅"; 
        fb.style.backgroundColor = "#e74c3c";
        fb.style.color = "white";
    }
    
    fb.classList.remove('hidden');
    currentIdx++;
    setTimeout(() => { 
        fb.classList.add('hidden'); 
        loadNext(); 
    }, 2000);
}

function endGame() {
    active = false;
    document.getElementById('game-screen').classList.add('hidden');
    document.getElementById('summary-screen').classList.remove('hidden');
    document.getElementById('final-score-text').innerText = score;
    
    const emojiDiv = document.getElementById('summary-emoji');
    if (score >= 8) {
        emojiDiv.innerText = "🏆 ยอดเยี่ยมที่สุดเลย! เก่งมากๆ ครับ";
    } else if (score >= 5) {
        emojiDiv.innerText = "👍 เก่งมากจ้า พยายามอีกนิดน้า";
    } else {
        emojiDiv.innerText = "📚 สู้ๆ ลองกลับไปทบทวนดูอีกครั้งนะเด็กๆ";
    }
}

function exitProgram() {
    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.add('hidden');
    document.getElementById('summary-screen').classList.add('hidden');
    document.getElementById('instruction-screen').classList.add('hidden');
    
    const oldExit = document.getElementById('exit-screen');
    if (oldExit) oldExit.remove();
    
    const exitScreen = document.createElement('div');
    exitScreen.id = 'exit-screen';
    exitScreen.className = 'screen';
    exitScreen.innerHTML = `
        <div class="intro-box" style="border-color: #ff7675; box-shadow: 0 15px 0 #ff7675;">
            <h1>🚪 ปิดระบบการเรียนรู้เรียบร้อยแล้ว</h1>
            <p style="font-size: 20px; margin: 20px 0; color: #555;">ขอบคุณเด็กๆ ทุกคนที่เข้ามาร่วมสนุกและเรียนรู้วิทยาศาตร์ ป.3 ในวันนี้ครับ</p>
            <p style="font-weight: bold; color: #2c3e50;">โรงเรียนวิวัฒน์วิทยา</p>
            <button onclick="location.reload()" class="btn-start" style="background-color: #2ecc71; box-shadow: 0 6px 0 #27ae60; margin-top: 15px;">🔄 กลับเข้าสู่หน้าหลักอีกครั้ง</button>
        </div>
    `;
    document.body.appendChild(exitScreen);
    
    document.getElementById('bg-music').pause();
    document.getElementById('bg-music').currentTime = 0;
    if (cameraStarted && camera) {
        camera.stop();
        cameraStarted = false;
    }
}

function onResults(res) {
    ctx.save();
    ctx.clearRect(0, 0, 800, 600);
    
    if (controlMode === 'camera') {
        // เปิด Mirror Mode เพื่อให้เหมือนกระจกเงาจากมุมมองคนเล่น ไม่สลับฝั่งแล้วครับ
        ctx.translate(800, 0); 
        ctx.scale(-1, 1); 
        ctx.drawImage(res.image, 0, 0, 800, 600);

        if (res.poseLandmarks && active) {
            const leftWrist = res.poseLandmarks[15];
            const rightWrist = res.poseLandmarks[16];
            
            // ตรวจสอบโซนซ้าย-ขวาบนจอภาพกระจกเงาอย่างสมบูรณ์
            // พิกัด x ของ MediaPipe จากกล้องดิบจะตรงกันข้ามเมื่อทำ Mirror
            if ((leftWrist.x > 0.65 && leftWrist.y < 0.6) || (rightWrist.x > 0.65 && rightWrist.y < 0.6)) {
                checkAnswer('left');
            }
            else if ((leftWrist.x < 0.35 && leftWrist.y < 0.6) || (rightWrist.x < 0.35 && rightWrist.y < 0.6)) {
                checkAnswer('right');
            }

            // วาดจุดแสดงตำแหน่งมือทั้งสองข้าง
            if (leftWrist.y < 0.6) {
                ctx.beginPath(); ctx.arc(leftWrist.x * 800, leftWrist.y * 600, 15, 0, 2 * Math.PI);
                ctx.fillStyle = "#3498db"; ctx.fill(); ctx.strokeStyle = "white"; ctx.stroke();
            }
            if (rightWrist.y < 0.6) {
                ctx.beginPath(); ctx.arc(rightWrist.x * 800, rightWrist.y * 600, 15, 0, 2 * Math.PI);
                ctx.fillStyle = "#e67e22"; ctx.fill(); ctx.strokeStyle = "white"; ctx.stroke();
            }
        }
    }
    ctx.restore();
}
