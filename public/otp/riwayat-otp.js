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

let messages = [];

try{
    messages = JSON.parse(
        item.messages || "[]"
    );
}catch{
    messages = [];
}

container.innerHTML += `

<div class="history-card">

<div class="history-header">

<div class="history-service">

<img
src="${item.logo || getServiceLogo(item.service)}"
class="history-app-logo"
onerror="this.src='https://cdn.hero-sms.com/assets/img/service/ot0.webp'"
>

<img
src="${item.country_logo || `https://cdn.hero-sms.com/assets/img/country/${item.country}.svg`}"
class="history-country-logo"
>

<span>
${item.service_name || item.service}
</span>

</div>

<div class="status ${statusClass}">
${item.status}
</div>

</div>

<div class="number-box">

<img
src="${getOperatorLogo(item.operator)}"
class="history-operator-logo"
onerror="this.src='/img/operator/any.webp'"
>

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
${item.country_name || item.country}
</div>
</div>

<div class="row">
<div class="label">Tanggal</div>
<div class="value">
${date}
</div>
</div>

${
messages.map(msg => `

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

function getOperatorLogo(name){

    const n = String(name || "")
        .toLowerCase()
        .trim();

    if(n.includes("telkomsel"))
        return "/img/operator/telkomsel.webp";

    if(n.includes("indosat") || n.includes("im3"))
        return "/img/operator/indosat.webp";

    if(n.includes("axis"))
        return "/img/operator/axis.webp";

    if(
        n.includes("three") ||
        n.includes("tri") ||
        n === "3"
    )
        return "/img/operator/three.webp";

    if(n.includes("smartfren"))
        return "/img/operator/smartfreen.webp";

    if(n.includes("byu"))
        return "/img/operator/byu.webp";

    if(n.includes("xl"))
        return "/img/operator/xl.webp";

    return "/img/operator/any.webp";
}

function getServiceLogo(code){

if(!code){
return "https://cdn.hero-sms.com/assets/img/service/ot0.webp";
}

return `https://cdn.hero-sms.com/assets/img/service/${code}0.webp`;

}