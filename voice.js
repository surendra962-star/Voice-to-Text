const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;

if (!SpeechRecognition) {
  alert("Speech Recognition not supported. Use Chrome.");
}

/* ================= SPEECH RECOGNITION ================= */
const recognition = new SpeechRecognition();
recognition.lang = "en-US";
recognition.continuous = true;
recognition.interimResults = true;

/* ================= ELEMENTS ================= */
const output = document.getElementById("output");
const status = document.getElementById("status");
const container = document.getElementById("voiceBox");
const geoBg = document.getElementById("geoBg");
const confidenceBar = document.getElementById("confidenceBar");
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");

let finalTranscript = "";
let micAllowed = false;

/* ================= AUDIO ANALYSER ================= */
let audioCtx, analyser, mic, dataArray, animationId;

async function startAudioListener() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    micAllowed = true;

    audioCtx = new AudioContext();
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;

    mic = audioCtx.createMediaStreamSource(stream);
    mic.connect(analyser);

    dataArray = new Uint8Array(analyser.frequencyBinCount);

    status.innerText = "Listening...";
    animateBySound();
  } catch {
    status.innerText = "Microphone permission denied";
  }
}

function stopAudioListener() {
  micAllowed = false;
  if (audioCtx) audioCtx.close();
  cancelAnimationFrame(animationId);

  container.classList.remove("neon");
  geoBg.classList.remove("voice-react");
  container.style.transform = "none";
  confidenceBar.style.width = "0%";
}

/* ================= SOUND REACTIVE ================= */
function animateBySound() {
  if (!micAllowed) return;

  analyser.getByteFrequencyData(dataArray);
  const volume =
    dataArray.reduce((a,b)=>a+b) / dataArray.length;

  /* Movement */
  container.style.transform =
    `translateY(-${volume/12}px) rotateX(${volume/25}deg)`;

  /* Confidence */
  const confidence = Math.min(volume * 1.5, 100);
  confidenceBar.style.width = confidence + "%";

  /* 🔥 GLOW ONLY WHEN SPEAKING */
  if (volume > 35) {
    container.classList.add("neon");
    geoBg.classList.add("voice-react");
  } else {
    container.classList.remove("neon");
    geoBg.classList.remove("voice-react");
  }

  animationId = requestAnimationFrame(animateBySound);
}

/* ================= BUTTON EVENTS ================= */
startBtn.onclick = async () => {
  finalTranscript = "";
  output.value = "";
  recognition.start();
  await startAudioListener();
};

stopBtn.onclick = () => {
  recognition.stop();
};

/* ================= TRANSCRIPTION ================= */
recognition.onresult = (event) => {
  let interim = "";
  for (let i = event.resultIndex; i < event.results.length; i++) {
    const text = event.results[i][0].transcript;
    if (event.results[i].isFinal) finalTranscript += text + " ";
    else interim += text;
  }
  output.value = finalTranscript + interim;
};

/* ================= AUTO STOP ================= */
recognition.onend = () => {
  status.innerText = "Stopped";
  stopAudioListener();
};

recognition.onerror = (e) => {
  status.innerText = "Error: " + e.error;
};
