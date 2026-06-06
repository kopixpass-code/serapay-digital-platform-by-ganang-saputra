const container =
document.getElementById(
"historyContainer"
);

async function loadHistory(){

try{

const token =
localStorage.getItem("token");

const res =
await fetch(
"/api/otp/history",
{
headers:{
Authorization:token
}
}
);

const result =
await res.json();

if(
!result.success
){
return;
}

if(
!result.data.length
){

container.innerHTML = `

<div class="empty">
Belum ada riwayat OTP
</div>

`;

return;
}

container.innerHTML = "";

result.data
.sort((a,b)=>
(b.time||0) -
(a.time||0)
)
.forEach(item=>{

const date =
new Date(
item.time
).toLocaleString(
"id-ID"
);

let statusClass =
item.status;

container.innerHTML += `

<div class="history-card">

<div class="history-header">

<div class="service-name">
${item.serviceName || item.service}
</div>

<div class="status ${statusClass}">
${item.status}
</div>

</div>

<div class="number-box">

<div class="number">
${item.number}
</div>

</div>

<div class="row">
<div class="label">Harga</div>
<div class="value">
Rp ${Number(item.harga || 0).toLocaleString("id-ID")}
</div>
</div>

<div class="row">
<div class="label">Negara</div>
<div class="value">
${item.country}
</div>
</div>

<div class="row">
<div class="label">Tanggal</div>
<div class="value">
${date}
</div>
</div>

${
(item.messages || [])
.map(msg => `

<div class="sms-history">

<div class="sms-title">
📩 Pesan OTP
</div>

${msg.text}

</div>

`)
.join("")
}

</div>

`;

});

}catch(err){

container.innerHTML = `

<div class="empty">
Gagal memuat data
</div>

`;

console.log(err);

}

}

loadHistory();

document.addEventListener(
"input",
e=>{

if(
e.target.id !==
"searchInput"
)return;

const keyword =
e.target.value
.toLowerCase();

document
.querySelectorAll(
".history-card"
)
.forEach(card=>{

const text =
card.innerText
.toLowerCase();

card.style.display =
text.includes(keyword)
? ""
: "none";

});

}
);