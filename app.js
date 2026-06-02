let currentMode = '';
let currentQuestions = [];
let currentQuestionIndex = 0;
let score = 0;
let canAnswer = false;

const startScreen = document.getElementById('start-screen');
const gameScreen = document.getElementById('game-screen');
const questionText = document.getElementById('question-text');
const ansLeftText = document.getElementById('ans-left');
const ansRightText = document.getElementById('ans-right');
const scoreDisplay = document.getElementById('score');
const feedbackDisplay = document.getElementById('feedback');

// ตั้งค่า MediaPipe
const videoElement = document.querySelector('.input_video');
const canvasElement = document.querySelector('.output_canvas');
const canvasCtx = canvasElement.getContext('2d');

const pose = new Pose({locateFile: (file) => {
    return 'https://cdn.jsdelivr.net/npm/@mediapipe/pose/' + file;
}});

pose.setOptions({
    modelComplexity: 1,
    smoothLandmarks: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
});

pose.onResults(onResults);

const camera = new Camera(videoElement, {
    onFrame: async () => {
        await pose.send({image: videoElement});
    },
    width: 800,
    height: 600
});

function startGame(mode) {
    currentMode = mode;
    currentQuestions = [...gameData[mode]];
    currentQuestionIndex = 0;
    score = 0;
    scoreDisplay.innerText = score;
    
    startScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');
    
    camera.start();
    loadQuestion();
}

function loadQuestion() {
    if (currentQuestionIndex >= currentQuestions.length) {
        endGame();
        return;
    }
    
    const qData = currentQuestions[currentQuestionIndex];
    questionText.innerText = qData.q;
    ansLeftText.innerText = qData.left;
    ansRightText.innerText = qData.right;
    
    setTimeout(() => {
        canAnswer = true;
    }, 1500); // หน่วงเวลา 1.5 วินาทีเพื่อป้องกันการตอบซ้ำทันที
}

function submitAnswer(selectedSide) {
    if (!canAnswer) return;
    canAnswer = false;
    
    const qData = currentQuestions[currentQuestionIndex];
    const isCorrect = (selectedSide === qData.ans);
    
    if (isCorrect) {
        score = score + 1;
        scoreDisplay.innerText = score;
        showFeedback("ถูกต้อง!", "#2ecc71");
    } else {
        showFeedback("ผิดจ้า!", "#e74c3c");
    }
    
    currentQuestionIndex = currentQuestionIndex + 1;
    setTimeout(loadQuestion, 2000);
}

function showFeedback(text, color) {
    feedbackDisplay.innerText = text;
    feedbackDisplay.style.color = color;
    feedbackDisplay.classList.remove('hidden');
    
    setTimeout(() => {
        feedbackDisplay.classList.add('hidden');
    }, 1500);
}

function endGame() {
    canAnswer = false;
    camera.stop();
    questionText.innerText = "จบเกม! คุณได้ " + score + " คะแนน";
    ansLeftText.innerText = "";
    ansRightText.innerText = "";
    
    setTimeout(() => {
        gameScreen.classList.add('hidden');
        startScreen.classList.remove('hidden');
    }, 4000);
}

// ระบบตรวจจับท่าทาง (จมูก)
function onResults(results) {
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    
    canvasCtx.translate(canvasElement.width, 0);
    canvasCtx.scale(-1, 1);
    canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

    if (results.poseLandmarks && canAnswer) {
        const nose = results.poseLandmarks[0];
        
        // เนื่องจากภาพถูกสลับซ้ายขวา (Mirror) เหมือนกระจก
        // หากนักเรียนเอียงตัวไปทางซ้ายของตัวเอง ตำแหน่งแกน x จะมีค่ามากกว่า 0.65
        // หากเอียงตัวไปทางขวา ตำแหน่งแกน x จะมีค่าน้อยกว่า 0.35
        
        if (nose.x > 0.65) {
            submitAnswer('left');
        } else if (nose.x < 0.35) {
            submitAnswer('right');
        }
        
        // วาดจุดที่จมูกเพื่อให้นักเรียนสังเกตตัวเองได้ง่ายขึ้น
        canvasCtx.beginPath();
        canvasCtx.arc(nose.x * canvasElement.width, nose.y * canvasElement.height, 15, 0, 2 * Math.PI);
        canvasCtx.fillStyle = "yellow";
        canvasCtx.fill();
    }
    canvasCtx.restore();
}
