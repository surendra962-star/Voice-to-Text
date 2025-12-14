const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;

if (!SpeechRecognition) {
  alert("Speech Recognition not supported. Use Google Chrome.");
}

const recognition = new SpeechRecognition();
recognition.lang = "en-US";
recognition.continuous = true;
recognition.interimResults = true;

const output = document.getElementById("output");
const status = document.getElementById("status");
const container = document.getElementById("voiceBox");
const geoBg = document.getElementById("geoBg");
const confidenceBar = document.getElementById("confidenceBar");

let finalTranscript = "";

/* ================= AUDIO ANALYSER ================= */
let audioCtx, analyser, mic, dataArray, animationId;

async function startAudioListener() {
  audioCtx = new (window.AudioContext || window.webkitSpeechRecognition)();
  analyser = audioCtx.createAnalyser();
  analyser.fftSize = 256;

  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  mic = audioCtx.createMediaStreamSource(stream);
  mic.connect(analyser);

  dataArray = new Uint8Array(analyser.frequencyBinCount);
  animateBySound();
}

function stopAudioListener() {
  if (audioCtx) audioCtx.close();
  cancelAnimationFrame(animationId);
  container.classList.remove("neon");
  geoBg.classList.remove("voice-react");
  container.style.transform = "none";
  confidenceBar.style.width = "0%";
}

/* ================= SOUND REACTIVE ================= */
function animateBySound() {
  analyser.getByteFrequencyData(dataArray);

  const volume =
    dataArray.reduce((a, b) => a + b) / dataArray.length;

  /* 3D movement */
  const tiltX = Math.min(volume / 18, 14);
  const tiltY = Math.min(volume / 25, 10);
  const lift  = Math.min(volume / 8, 20);

  container.style.transform =
    `translateY(-${lift}px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;

  /* Confidence meter */
  const confidence = Math.min(volume * 1.5, 100);
  confidenceBar.style.width = confidence + "%";

  if (confidence > 70) {
    confidenceBar.style.background = "linear-gradient(90deg,#ff4d4d,#ff9900)";
    container.classList.add("neon");
    geoBg.classList.add("voice-react");
  } else if (confidence > 35) {
    confidenceBar.style.background = "linear-gradient(90deg,#ffd700,#00ff99)";
    container.classList.remove("neon");
    geoBg.classList.remove("voice-react");
  } else {
    confidenceBar.style.background = "linear-gradient(90deg,#00bfff,#00ff99)";
    container.classList.remove("neon");
    geoBg.classList.remove("voice-react");
  }

  animationId = requestAnimationFrame(animateBySound);
}

/* ================= BUTTON EVENTS ================= */
document.getElementById("startBtn").onclick = async () => {
  recognition.start();
  status.innerText = "Listening...";
  finalTranscript = "";
  await startAudioListener();
};

document.getElementById("stopBtn").onclick = () => {
  recognition.stop();
  status.innerText = "Stopped";
  stopAudioListener();
};

/* ================= LIVE TRANSCRIPTION ================= */
recognition.onresult = (event) => {
  let interimTranscript = "";

  for (let i = event.resultIndex; i < event.results.length; i++) {
    const transcript = event.results[i][0].transcript;
    if (event.results[i].isFinal) {
      finalTranscript += transcript + " ";
    } else {
      interimTranscript += transcript;
    }
  }
  output.value = finalTranscript + interimTranscript;
};

recognition.onerror = (e) => {
  status.innerText = "Error: " + e.error;
};

recognition.onend = () => {
  status.innerText = "Stopped";
  stopAudioListener();
};
