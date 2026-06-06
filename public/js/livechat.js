const socket = io("/", {
  transports: ["websocket", "polling"],
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000
});

const startBox = document.getElementById("startBox");
const chatBox = document.getElementById("chatBox");
const messagesEl = document.getElementById("messages");
const input = document.getElementById("chatInput");
const fileInput = document.getElementById("fileInput");

let userData = {
  name: "",
  email: ""
};

// ================= SOUND =================
function playNotif() {

  const audio = new Audio("/img/chat.mp3");

  audio.volume = 1;

  audio.play().catch(err => {
    console.log("Sound error:", err);
  });

}

// ================= LOAD LOCAL =================
window.addEventListener("load", async () => {

  try {

    // ================= CEK TOKEN LOGIN =================
    const token = localStorage.getItem("token");

    // ================= JIKA LOGIN =================
    if (token) {

      const res = await fetch("/api/me", {
        headers: {
          Authorization: token
        }
      });

      const data = await res.json();

      if (data.success) {

        userData = {
          name: data.user.name,
          email: data.user.email
        };

        localStorage.setItem(
          "livechat_user",
          JSON.stringify(userData)
        );

        // auto start chat
        await fetch("/api/livechat/start", {
          method: "POST",
          headers: {
            "Content-Type":"application/json"
          },
          body: JSON.stringify(userData)
        });

        startBox.style.display = "none";
        chatBox.style.display = "flex";

        connectSocket();

        await loadMessages();

        return;
      }

    }

    // ================= FALLBACK GUEST =================
    const saved = localStorage.getItem("livechat_user");

    if (!saved) {

      // tampilkan form input guest
      startBox.style.display = "flex";

      return;
    }

    userData = JSON.parse(saved);

    if (!userData.email) {

      startBox.style.display = "flex";

      return;
    }

    startBox.style.display = "none";
    chatBox.style.display = "flex";

    connectSocket();

    await loadMessages();

  } catch(err) {

    console.log(err);

    startBox.style.display = "flex";

  }

});

// ================= START CHAT =================
async function startChat() {

  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim().toLowerCase();

  if (!name || !email) {
    return alert("Lengkapi data");
  }

  userData = { name, email };

  localStorage.setItem(
    "livechat_user",
    JSON.stringify(userData)
  );

  const res = await fetch("/api/livechat/start", {
    method: "POST",
    headers: {
      "Content-Type":"application/json"
    },
    body: JSON.stringify(userData)
  });

  const data = await res.json();

  if (!data.success) {
    return alert("Gagal memulai chat");
  }

  startBox.style.display = "none";
  chatBox.style.display = "flex";

  connectSocket();

  await loadMessages();

}

// ================= SOCKET =================
function connectSocket() {

  socket.emit("joinUser", userData.email);

  socket.on("connect", () => {

    socket.emit("joinUser", userData.email);

  });

  socket.on("socketReady", () => {

    updateStatus(true);

  });

  socket.on("disconnect", () => {

    updateStatus(false);

  });
  
  socket.io.on("reconnect", () => {

  console.log("RECONNECTED");

  socket.emit(
    "joinUser",
    userData.email
  );

  loadMessages();

});

// ================= REALTIME MESSAGE =================
socket.on("livechatNewMessage", (msg) => {

  // cegah duplicate id
  if (
    msg.id &&
    document.querySelector(
      `[data-id="${msg.id}"]`
    )
  ) {
    return;
  }

  addMessage(msg, false);

  // notif suara jika admin
// notif suara jika admin
if (msg.sender === "admin") {

  playNotif();

}

});

// ADMIN REPLY
socket.on("livechatReply", (msg) => {

  addMessage(msg, false);

  // suara notif
playNotif();

});

}

// ================= LOAD HISTORY =================
async function loadMessages() {

  try {

    const res = await fetch(
      `/api/livechat/messages?email=${encodeURIComponent(userData.email)}`
    );

    const data = await res.json();

    if (!data.success) return;

    messagesEl.innerHTML = "";

    data.messages.forEach(msg => {

      addMessage(msg, true);

    });

    // FORCE SCROLL BAWAH
    forceBottom();

  } catch(err) {

    console.log(err);

  }

}

// ================= SEND MESSAGE =================
async function sendMessage() {

  const text = input.value.trim();

  // kosong
  if (!text) return;

  // reset input
  input.value = "";

  try {

    const res = await fetch(
      "/api/livechat/send",
      {
        method: "POST",
        headers: {
          "Content-Type":"application/json"
        },
        body: JSON.stringify({
          name: userData.name,
          email: userData.email,
          message: text
        })
      }
    );

    const data = await res.json();

    // gagal
    if (!data.success) {

      alert("Gagal kirim");

    }

    // TIDAK addMessage disini
    // karena socket realtime
    // yang akan render otomatis

  } catch(err) {

    console.log(err);

    alert("Terjadi kesalahan");

  }

}

// ================= UPLOAD FILE =================
fileInput.addEventListener("change", async () => {

  const file = fileInput.files[0];

  if (!file) return;

  // RESET INPUT
  fileInput.value = "";

  // ================= BUBBLE LOADING =================
  const loadingId = "upload-" + Date.now();

  const loadingDiv = document.createElement("div");

  loadingDiv.classList.add(
    "msg",
    "user-msg"
  );

  loadingDiv.id = loadingId;

  loadingDiv.innerHTML = `
    <div class="upload-loading">
      <div class="upload-spinner"></div>
      <div class="upload-text">
        Mengupload...
      </div>
    </div>
  `;

  messagesEl.appendChild(loadingDiv);

  scrollBottom();

  // ================= FORM =================
  const form = new FormData();

  form.append("file", file);
  form.append("name", userData.name);
  form.append("email", userData.email);

  try {

    const res = await fetch(
      "/api/livechat/upload",
      {
        method: "POST",
        body: form
      }
    );

    const data = await res.json();

    // HAPUS LOADING
    document
      .getElementById(loadingId)
      ?.remove();

    if (!data.success) {

      return alert("Upload gagal");

    }
	
	// ================= TAMPILKAN FILE LANGSUNG =================

  } catch(err) {

    document
      .getElementById(loadingId)
      ?.remove();

    console.log(err);

    alert("Upload gagal");

  }

});

// ================= ADD MESSAGE =================
function addMessage(msg, skipScroll=false) {

  const div = document.createElement("div");
div.dataset.id = msg.id || "";
  div.classList.add("msg");

  const isUser = msg.sender === "user";

  div.classList.add(
    isUser
      ? "user-msg"
      : "admin-msg"
  );

  let html = "";

  // TEXT
  if (msg.message || msg.text) {

    html += `
      <div>
        ${escapeHtml(msg.message || msg.text)}
      </div>
    `;

  }

  // FILE
  if (msg.fileUrl) {

    const ext = msg.fileUrl
      .split(".")
      .pop()
      .toLowerCase();

    const isImage = [
      "jpg",
      "jpeg",
      "png",
      "gif",
      "webp"
    ].includes(ext);

if (isImage) {

  html += `
    <img 
      src="${msg.fileUrl}?t=${Date.now()}"
      onclick="window.open('${msg.fileUrl}')"
      onload="scrollBottom()"
    >
  `;

}

else {

      html += `
        <a href="${msg.fileUrl}" target="_blank">
          📎 Download File
        </a>
      `;

    }

  }

  // TIME
  html += `
    <div style="
      font-size:11px;
      opacity:.7;
      margin-top:4px;
      text-align:right;
    ">
      ${formatTime(msg.time)}
      ${isUser ? "✓" : ""}
    </div>
  `;

  div.innerHTML = html;

  messagesEl.appendChild(div);

  if (!skipScroll) {
    scrollBottom();
  }

}

// ================= FORMAT JAM =================
function formatTime(time) {

  const d = new Date(time);

  return d.toLocaleTimeString("id-ID", {
    hour:"2-digit",
    minute:"2-digit"
  });

}

// ================= ESCAPE HTML =================
function escapeHtml(text="") {

  return text
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;");

}

// ================= AUTO SCROLL =================
function scrollBottom() {

  setTimeout(() => {

    messagesEl.scrollTop =
      messagesEl.scrollHeight;

  }, 50);

}

// ================= FORCE BOTTOM =================
function forceBottom() {

  let total = 0;

  const interval = setInterval(() => {

    messagesEl.scrollTop =
      messagesEl.scrollHeight;

    total++;

    // stop setelah beberapa kali
    if (total >= 15) {

      clearInterval(interval);

    }

  }, 120);

}

// ================= STATUS =================
function updateStatus(online) {

  const p = document.querySelector(".header-info p");

  if (!p) return;

  p.innerText = online
    ? "Online"
    : "Offline";

}

// ================= END CHAT =================
async function endChat() {

  if (!confirm("Akhiri live chat?")) return;

  try {

    // optional: beri tahu server chat selesai
    await fetch("/api/livechat/end", {
      method: "POST",
      headers: {
        "Content-Type":"application/json"
      },
      body: JSON.stringify({
        email: userData.email
      })
    });

  } catch(err) {

    console.log(err);

  }

  // disconnect socket
  socket.disconnect();

  // JANGAN hapus token login
  // hanya keluar dari halaman chat

  location.href = "/home.html";

}

// ================= KEEP ALIVE =================
setInterval(() => {

  if (socket.connected) {

    socket.emit("pingUser");

  }

}, 15000);

window.startChat = startChat;
window.sendMessage = sendMessage;
window.endChat = endChat;
