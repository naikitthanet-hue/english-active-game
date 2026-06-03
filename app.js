let questions = [...scienceData];
let currentIdx = 0;
let score = 0;
let active = false;

const video = document.querySelector('.input_video');
const canvas = document.querySelector('.output_canvas');
const ctx = canvas.getContext('2d');

const pose = new Pose({locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`});
pose.setOptions({ modelComplexity: 1, minDetectionConfidence: 0.5 });
pose.onResults(onResults);

const camera = new Camera(video, { onFrame: async () => await pose.send({image: video}), width: 800, height: 600 });

function startGame() {
    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');
    document.getElementById('bg-music').play();
    camera.start();
    loadNext();
}

function loadNext() {
    if(currentIdx >= questions.length) {
        document.getElementById('question-text').innerText = "เก่งมาก! จบการเรียนรู้แล้วครับ ✨";
        active = false;
        return;
    }
    const q = questions[currentIdx];
    document.getElementById('question-text').innerText = q.q;
    document.getElementById('ans-left').innerText = q.left;
    document.getElementById('ans-right').innerText = q.right;
    setTimeout(() => { active = true; }, 1500);
}

function answer(side) {
    if(!active) return;
    active = false;
    const q = questions[currentIdx];
    const isCorrect = (side === q.ans);
    
    const fb = document.getElementById('feedback');
    if(isCorrect) {
        score++;
        document.getElementById('score').innerText = score;
        document.getElementById('correct-sound').play();
        fb.innerText = "ถูกต้อง! 🎉"; fb.style.color = "#2ecc71";
    } else {
        fb.innerText = "ลองใหม่นะ 😅"; fb.style.color = "#e74c3c";
    }
    
    fb.classList.remove('hidden');
    currentIdx++;
    setTimeout(() => { fb.classList.add('hidden'); loadNext(); }, 2000);
}

function onResults(res) {
    ctx.save();
    ctx.clearRect(0, 0, 800, 600);
    ctx.translate(800, 0); ctx.scale(-1, 1); // MIRROR EFFECT
    ctx.drawImage(res.image, 0, 0, 800, 600);

    if (res.poseLandmarks && active) {
        const nose = res.poseLandmarks[0];
        if (nose.x < 0.35) answer('left');
        else if (nose.x > 0.65) answer('right');

        ctx.beginPath();
        ctx.arc(nose.x * 800, nose.y * 600, 12, 0, 2*Math.PI);
        ctx.fillStyle = "yellow"; ctx.fill();
    }
    ctx.restore();
}
