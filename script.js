// FIELDS
const nameInput = document.getElementById("nameInput");
const phoneInput = document.getElementById("phoneInput");
const contactInput = document.getElementById("contactInput");
const pinInput = document.getElementById("pinInput");

const saveBtn = document.getElementById("saveBtn");
const loginBox = document.getElementById("loginBox");
const homeBox = document.getElementById("homeBox");

const statusEl = document.getElementById("status");
const video = document.getElementById("video");
const preview = document.getElementById("preview");

let mediaStream = null;
let alarmSound = null;
let captureLoop = null;

// ---------------------- AUTO LOGIN -------------------------
window.onload = () => {
    if (localStorage.getItem("sf_name")) {
        loginBox.classList.add("hidden");
        homeBox.classList.remove("hidden");
    }
};

// ---------------------- SAVE & CONTINUE -------------------------
saveBtn.addEventListener("click", () => {
    let nm = nameInput.value.trim();
    let ph = phoneInput.value.trim();
    let cont = contactInput.value.trim();
    let pn = pinInput.value.trim();

    if (!nm || !ph || !cont || !pn) {
        alert("All fields required!");
        return;
    }

    // Store locally
    localStorage.setItem("sf_name", nm);
    localStorage.setItem("sf_phone", ph);
    localStorage.setItem("sf_contacts", cont);
    localStorage.setItem("sf_pin", pn);

    // Store in Firebase REALTIME DB
    firebase.database().ref("users/" + ph).set({
        name: nm,
        phone: ph,
        contacts: cont,
        pin: pn
    });

    loginBox.classList.add("hidden");
    homeBox.classList.remove("hidden");

    alert("Registration Completed!");
});

// ---------------------- SAFE PLACES -------------------------
document.getElementById("placesBtn").onclick = () => {
    window.open("https://www.google.com/maps/search/?api=1&query=police+station+hospital+near+me");
};

// ---------------------- SAFETY CONTACTS -------------------------
document.getElementById("contactsBtn").onclick = () => {
    let old = localStorage.getItem("sf_contacts") || "";
    let updated = prompt("Edit contacts:", old);

    if (updated) {
        localStorage.setItem("sf_contacts", updated);
        alert("Updated!");
    }
};

// ---------------------- ALARM -------------------------
function startAlarm() {
    alarmSound = new Audio("https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3");
    alarmSound.loop = true;
    alarmSound.play().catch(() => {});
}

function stopAlarm() {
    if (alarmSound) {
        alarmSound.pause();
        alarmSound.currentTime = 0;
    }
}

// ---------------------- CAMERA START -------------------------
async function startCamera() {
    try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: "environment" } },
            audio: false
        });
    } catch (e) {
        mediaStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false
        });
    }

    video.srcObject = mediaStream;
    video.setAttribute("playsinline", "");
    video.setAttribute("muted", "");
    
    video.style.display = "block";   /* ✔ IMPORTANT */

    video.play();
}

// ---------------------- CAMERA STOP -------------------------
function stopCamera() {
    if (mediaStream) {
        mediaStream.getTracks().forEach(t => t.stop());
    }
    video.style.display = "none";
    preview.style.display = "none";
}

// ---------------------- CAPTURE FRAME -------------------------
function captureFrame() {
    const canvas = document.createElement("canvas");
    canvas.width = 300;
    canvas.height = 200;
    canvas.getContext("2d").drawImage(video, 0, 0, 300, 200);

    let img = canvas.toDataURL("image/jpeg");
    preview.src = img;
    preview.style.display = "block";

    // Upload to Firebase
    let ph = localStorage.getItem("sf_phone");
    firebase.database().ref("emergency/" + ph).push({
        time: new Date().toISOString(),
        image: img
    });
}

// ---------------------- HELP ME -------------------------
document.getElementById("helpBtn").onclick = async () => {
    startAlarm();
    statusEl.innerText = "Status: Emergency Mode";

    await startCamera();
    captureFrame();

    captureLoop = setInterval(captureFrame, 2000);
};

// ---------------------- CANCEL -------------------------
document.getElementById("cancelBtn").onclick = () => {
    let saved = localStorage.getItem("sf_pin");
    let entered = prompt("Enter PIN:");

    if (saved === entered) {
        stopAlarm();
        stopCamera();
        clearInterval(captureLoop);
        statusEl.innerText = "Status: Idle";
        alert("Emergency Stopped");
    } else {
        alert("Wrong PIN!");
    }
};

// ------- ENTER KEY → NEXT INPUT ---------

nameInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        e.preventDefault();
        phoneInput.focus();
    }
});

phoneInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        e.preventDefault();
        contactInput.focus();
    }
});

contactInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        e.preventDefault();
        pinInput.focus();
    }
});

pinInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        e.preventDefault();
        saveBtn.click();     // Auto Save
    }
});