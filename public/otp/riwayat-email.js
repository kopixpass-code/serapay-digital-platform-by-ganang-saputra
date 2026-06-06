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

<div class="number-box">

<div class="number">
${item.pesan || "-"}
</div>

</div>

<div class="row">

<div class="label">
Email
</div>

<div class="value">
${item.userEmail || "-"}
</div>

</div>

<div class="row">

<div class="label">
Harga
</div>

<div class="value">
Rp ${Number(
item.harga || 0
).toLocaleString("id-ID")}
</div>

</div>

<div class="row">

<div class="label">
Order
</div>

<div class="value">
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

<div class="value">
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

<div class="value">
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

(item.userEmail || "")
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