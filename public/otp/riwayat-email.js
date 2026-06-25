const API = "/api/email/history";

const historyContainer =
document.getElementById(
"historyContainer"
);

const searchInput =
document.getElementById(
"searchInput"
);

let allHistory = [];

async function loadHistory(){

try{

const res =
await fetch(API,{
headers:{
Authorization:
localStorage.getItem("token")
}
});

const result =
await res.json();

if(!result.success){

historyContainer.innerHTML = `
<div class="empty">
Gagal memuat data
</div>
`;

return;

}

allHistory =
result.data || [];

renderHistory(
allHistory
);

}catch(err){

historyContainer.innerHTML = `
<div class="empty">
Gagal memuat data
</div>
`;

}

}

function formatDate(time){

if(!time) return "-";

return new Date(time)
.toLocaleString(
"id-ID"
);

}

function renderHistory(data){

if(!data.length){

historyContainer.innerHTML = `
<div class="empty">
Belum ada riwayat email OTP
</div>
`;

return;

}

historyContainer.innerHTML = "";

data
.sort((a,b)=>
(b.time||0) -
(a.time||0)
)
.forEach(item=>{

const status =
(item.status || "active")
.toLowerCase();

historyContainer.innerHTML += `

<div class="history-card">

<div class="history-header">

<div class="service-name">
${item.service || "-"}
</div>

<div class="status ${status}">
${status}
</div>

</div>

<div class="row">

<div class="label">
Email
</div>

<div class="value email-value">

<span class="email-text">
${item.email || "-"}
</span>

${
item.email
?
`
<button
class="copy-btn"
onclick="copyEmail('${item.email}')"
type="button"
>

<svg
xmlns="http://www.w3.org/2000/svg"
width="18"
height="18"
viewBox="0 0 24 24"
fill="none"
stroke="currentColor"
stroke-width="2"
stroke-linecap="round"
stroke-linejoin="round"
>
<rect
x="9"
y="9"
width="13"
height="13"
rx="2"
ry="2"
></rect>
<path
d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
></path>
</svg>

</button>
`
:
""
}

</div>

</div>

<div class="row">

<div class="label">
Harga
</div>

<div class="value value-light">
Rp ${Number(
item.harga || 0
).toLocaleString("id-ID")}
</div>

</div>

<div class="row">

<div class="label">
Order
</div>

<div class="value value-light">
${formatDate(
item.time
)}
</div>

</div>

${
item.doneTime
?
`
<div class="row">

<div class="label">
Selesai
</div>

<div class="value value-light">
${formatDate(
item.doneTime
)}
</div>

</div>
`
:
""
}

${
item.cancelTime
?
`
<div class="row">

<div class="label">
Batal
</div>

<div class="value value-light">
${formatDate(
item.cancelTime
)}
</div>

</div>
`
:
""
}

${
item.pesan
?
`
<div class="sms-history">

<div class="sms-title">
Kode OTP
</div>

${item.pesan}

</div>
`
:
""
}

</div>

`;

});

}

async function copyEmail(email){

try{

await navigator.clipboard.writeText(email);

showToast("Email berhasil disalin");

}catch{

const input =
document.createElement("textarea");

input.value = email;

document.body.appendChild(input);

input.select();

document.execCommand("copy");

input.remove();

showToast("Email berhasil disalin");

}

}

let toastTimer;

function showToast(text){

const toast =
document.getElementById("toast");

toast.textContent = text;

toast.classList.add("show");

clearTimeout(toastTimer);

toastTimer = setTimeout(()=>{

toast.classList.remove("show");

},2000);

}

searchInput.addEventListener(
"input",
()=>{

const keyword =
searchInput.value
.toLowerCase()
.trim();

const filtered =
allHistory.filter(item=>{

return (
(item.service || "")
.toLowerCase()
.includes(keyword)

||

(item.pesan || "")
.toLowerCase()
.includes(keyword)

||

(item.email || "")
.toLowerCase()
.includes(keyword)

);

});

renderHistory(
filtered
);

}
);

loadHistory();
