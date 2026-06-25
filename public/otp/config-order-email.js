/* ===========================
   SeraPay Email OTP
   config-order-email.js
=========================== */

const EMAIL_API =
"/api";

const EMAIL_MARKUP = 500;

const emailSite =
document.getElementById("emailSite");

const emailDomain =
document.getElementById("emailDomain");

const emailPrice =
document.getElementById("emailPrice");

const orderEmailBtn =
document.getElementById("orderEmailBtn");

const emailContainer =
document.getElementById(
"emailOrdersContainer"
);

let emailDomains = [];

/* ==========================
   SOUND NOTIFIKASI EMAIL
========================== */

const emailSound = new Audio("/img/otp.mp3");

emailSound.preload = "auto";

function playEmailSound(){

    const audio = new Audio("/img/otp.mp3");

    audio.volume = 1;

    audio.play().catch(()=>{});

}

document.addEventListener("click", () => {

    const audio = new Audio("/img/otp.mp3");

    audio.play()
    .then(() => {

        audio.pause();
        audio.currentTime = 0;

    })
    .catch(() => {});

}, { once:true });

/*
|--------------------------------------------------------------------------
| TOAST
|--------------------------------------------------------------------------
*/

function emailToast(message){

    const toast =
    document.getElementById("toast");

    if(!toast){
        alert(message);
        return;
    }

    toast.innerHTML = message;

    toast.classList.add("show");

    setTimeout(()=>{

        toast.classList.remove("show");

    },3000);

}

/*
|--------------------------------------------------------------------------
| FORMAT RUPIAH
|--------------------------------------------------------------------------
*/

function formatRupiah(value){

    return "Rp " +
    Number(value)
    .toLocaleString("id-ID");

}

/*
|--------------------------------------------------------------------------
| LOAD DOMAIN EMAIL
|--------------------------------------------------------------------------
*/

function formatStock(count){

    if(count >= 1000000){

        return (
            count / 1000000
        ).toFixed(1) + "jt";

    }

    if(count >= 1000){

        return (
            count / 1000
        ).toFixed(1) + "rb";

    }

    return count;

}

async function loadEmailDomains(){

    const site =
    emailSite.value.trim();

    if(!site){

        emailDomain.innerHTML =
        `<option>Pilih URL terlebih dahulu</option>`;

        emailPrice.value = "";

        return;
    }

    try{

        emailDomain.innerHTML =
        `<option>Loading...</option>`;

const response =
await fetch(
    `${EMAIL_API}/email/domains?site=${encodeURIComponent(site)}`
);

        const result =
        await response.json();

        emailDomains =
        result.data || [];

        emailDomain.innerHTML = "";

        if(emailDomains.length === 0){

            emailDomain.innerHTML =
            `<option>Tidak tersedia</option>`;

            emailPrice.value = "-";

            return;

        }

emailDomains.forEach(
(item,index)=>{

const stok =
Number(item.count)
.toLocaleString("id-ID");

emailDomain.innerHTML += `
<option value="${index}">
${item.name} • Stok ${stok}
</option>
`;

});

        updateEmailPrice();

    }catch(error){

        console.error(error);

        emailDomain.innerHTML =
        `<option>Gagal load</option>`;

        emailToast(
        "Gagal load domain email");

    }

}

/*
|--------------------------------------------------------------------------
| UPDATE HARGA
|--------------------------------------------------------------------------
*/

function updateEmailPrice(){

    const selected =
    emailDomains[emailDomain.value];

    if(!selected){

        emailPrice.value = "";

        return;

    }

const hargaRupiah =
Math.ceil(
(selected.cost * 16500) + 500
);

emailPrice.value =
formatRupiah(hargaRupiah);

}

/*
|--------------------------------------------------------------------------
| ORDER EMAIL
|--------------------------------------------------------------------------
*/

async function orderEmail(){

    const site =
    emailSite.value.trim();

    const selected =
    emailDomains[emailDomain.value];

    if(!site){

        emailToast(
        "Masukan URL tujuan");

        return;

    }

    if(!selected){

        emailToast(
        "Pilih domain email");

        return;

    }

    try{

        orderEmailBtn.disabled = true;

        orderEmailBtn.innerHTML =
        "PROCESSING...";

const response =
await fetch(
    `${EMAIL_API}/email/order`,
    {
        method:"POST",

headers:{
    "Content-Type":"application/json",
    "Authorization":
    localStorage.getItem("token")
},

        body:JSON.stringify({

            site:site,

            domain:selected.name

        })

    }
);

const result =
await response.json();

if(!result.data){

    throw new Error(
    result.details ||
    "Order gagal");

}

createEmailCard(
result.data
);

if(result.saldo !== undefined){

document.getElementById(
"userSaldo"
).innerHTML =
formatRupiah(
result.saldo
);

}

emailToast(
"✅ Email berhasil dibuat");

    }catch(error){

        console.error(error);

        emailToast(
        " " +
        error.message);

    }finally{

        orderEmailBtn.disabled = false;

        orderEmailBtn.innerHTML =
        "ORDER EMAIL";

    }

}

/*
|--------------------------------------------------------------------------
| CARD EMAIL
|--------------------------------------------------------------------------
*/

function createEmailCard (data,prependCard = true){

const card =
document.createElement("div");

card.className =
"otp-card";

card.dataset.email =
data.id;

const elapsed =
Math.floor(
(Date.now() - (data.time || Date.now())) / 1000
);

const canCancel =
elapsed >= 120;

card.innerHTML = `

<div class="otp-header">

<div>

<h4>${data.site || "Email OTP"}</h4>

</div>

<div
class="timer"
id="email-timer-${data.id}">
20:00
</div>

</div>

<div class="phone-number">

<span class="email-text">
${data.email || "-"}
</span>

<button
class="copy-btn"
onclick="copyText('${data.email || ""}')"
title="Salin Email">

<svg xmlns="http://www.w3.org/2000/svg"
width="16"
height="16"
viewBox="0 0 24 24"
fill="none"
stroke="currentColor"
stroke-width="2">

<rect x="9" y="9" width="13" height="13" rx="2"/>
<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>

</svg>

</button>

</div>

<div class="action-buttons">

<button
class="btn-done"
${data.code ? "" : "disabled"}
id="email-reorder-${data.id}"
onclick="reorderEmail('${data.id}')">

Reorder

</button>

${data.code ? `

<button
class="btn-success"
onclick="doneEmail('${data.id}')">

Done

</button>

` : ""}

${(data.otpReceived || data.code) ? "" : `

<button
class="btn-cancel"
id="cancel-${data.id}"
${canCancel ? "" : "disabled"}
onclick="cancelEmail('${data.id}',this)">

Batal

</button>

`}

</div>

<div
class="waiting"
id="email-waiting-${data.id}">

<div class="spinner"></div>

<span>
Menunggu email masuk...
</span>

</div>

<div
class="messages"
id="email-messages-${data.id}">
</div>

`;

if(prependCard){

    emailContainer.prepend(card);

}else{

    emailContainer.appendChild(card);

}

if(data.otpReceived || data.code){

const waiting =
document.getElementById(
`email-waiting-${data.id}`
);

if(waiting){
waiting.style.display = "none";
}

const messages =
document.getElementById(
`email-messages-${data.id}`
);

/* SIMPAN HTML EMAIL */

if(data.message){
emailContents[data.id] =
data.message;
}

messages.style.display = "block";
messages.innerHTML = `

<div class="otp-result">

<div class="otp-code">
${data.code || "-"}
</div>

${data.message ? `

<button
class="email-badge"
onclick="viewEmailContent('${data.id}')"
title="Lihat Pesan">

<svg
xmlns="http://www.w3.org/2000/svg"
viewBox="0 0 24 24"
fill="none">

<path
d="M2 6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2h-4.586l-2.707 2.707a1 1 0 0 1-1.414 0L8.586 19H4a2 2 0 0 1-2-2V6zm18 0H4v11h5a1 1 0 0 1 .707.293L12 19.586l2.293-2.293A1 1 0 0 1 15 17h5V6z"
fill="currentColor"/>

<path
d="M13.5 11.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm4 0a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm-8 0a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z"
fill="currentColor"/>

</svg>

</button>

` : ""}

</div>

`;

/* HENTIKAN POLLING */

if(emailPolling[data.id]){

clearInterval(
emailPolling[data.id]
);

delete emailPolling[data.id];

}

return;

}

startEmailCountdown(
data.id,
data.remaining || 1200
);

startEmailPolling(
data.id
);

}

/*
|--------------------------------------------------------------------------
| CHECK STATUS EMAIL
|--------------------------------------------------------------------------
*/

async function checkEmailStatus(id){

    try{

const response =
await fetch(
`${EMAIL_API}/email/check/${id}`
);

const result =
await response.json();

alert(

    "Email : " +
    (result.email || "-") +

    "\n\nKode : " +

    (result.code || "Belum ada")

);

    }catch(error){

        emailToast(
        "Gagal cek email");

    }

}

/*
|--------------------------------------------------------------------------
| CANCEL EMAIL
|--------------------------------------------------------------------------
*/

async function cancelEmail(
id,
button
){

    if(
    !confirm(
    "Batalkan email ini?"
    )
    ) return;

    try{

const response =
await fetch(
`${EMAIL_API}/email/cancel/${id}`,
{
method:"POST",
headers:{
Authorization:
localStorage.getItem("token")
}
}
);

const result =
await response.json();

if(!response.ok){

throw new Error(
result.message ||
"Gagal membatalkan"
);

}

button
.closest(".otp-card")
?.remove();

if(result.saldo !== undefined){

document.getElementById(
"userSaldo"
).innerHTML =
formatRupiah(
result.saldo
);

}

emailToast(
"Email dibatalkan");

    }catch(error){

        emailToast(
        "Gagal membatalkan");

    }

}

function startEmailPolling(id){
	
	if(emailPolling[id]){
    clearInterval(emailPolling[id]);
}

emailPolling[id] = setInterval(async()=>{

try{

const response =
await fetch(
`${EMAIL_API}/email/check/${id}`
);

const result =
await response.json();

console.log(
"EMAIL POLLING:",
id,
result
);

if(!result.code && !result.message){
    return;
}

const waiting =
document.getElementById(
`email-waiting-${id}`
);

if(waiting){
waiting.style.display = "none";
}

const reorderBtn =
document.getElementById(
`email-reorder-${id}`
);

if(reorderBtn){
reorderBtn.disabled = false;
}

const actions =
document.querySelector(
`[data-email="${id}"] .action-buttons`
);

if(
actions &&
!actions.querySelector(".btn-success")
){
    actions.insertAdjacentHTML(
        "beforeend",
        `
        <button
        class="btn-success"
        onclick="doneEmail('${id}')">
        Done
        </button>
        `
    );
}

const cancelBtn =
document.getElementById(
`cancel-${id}`
);

if(cancelBtn){
cancelBtn.remove();
}

const messages =
document.getElementById(
`email-messages-${id}`
);

/* SIMPAN HTML EMAIL */

if(result.message){

emailContents[id] =
result.message;

}

messages.style.display = "block";
messages.innerHTML = `

<div class="otp-result">

<div class="otp-code">
${result.code || "-"}
</div>

${result.message ? `

<button
class="email-badge"
onclick="viewEmailContent('${id}')"
title="Lihat Pesan">

<svg
xmlns="http://www.w3.org/2000/svg"
viewBox="0 0 24 24"
fill="none">

<path
d="M2 6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2h-4.586l-2.707 2.707a1 1 0 0 1-1.414 0L8.586 19H4a2 2 0 0 1-2-2V6zm18 0H4v11h5a1 1 0 0 1 .707.293L12 19.586l2.293-2.293A1 1 0 0 1 15 17h5V6z"
fill="currentColor"/>

<path
d="M13.5 11.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm4 0a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm-8 0a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z"
fill="currentColor"/>

</svg>

</button>

` : ""}

</div>

`;

if(emailPolling[id]){

    clearInterval(emailPolling[id]);
    delete emailPolling[id];

}

if(emailCountdowns[id]){

    clearInterval(emailCountdowns[id]);
    delete emailCountdowns[id];

}

playEmailSound();

if(
    "Notification" in window &&
    Notification.permission === "granted"
){
    new Notification(
        "SeraPay Email OTP",
        {
            body:`Kode OTP: ${result.code}`,
            icon:"/img/logo.png"
        }
    );
}

emailToast("Email masuk");

}catch(err){

console.log(err);

}

},5000);

}

function startEmailCountdown(id,seconds=1200){

const timer =
document.getElementById(
`email-timer-${id}`
);

emailCountdowns[id] =
setInterval(()=>{

seconds--;

if(seconds <= 1080){

const cancelBtn =
document.getElementById(
`cancel-${id}`
);

if(cancelBtn){

cancelBtn.disabled = false;

}

}

const min =
Math.floor(seconds/60);

const sec =
seconds%60;

if(timer){

timer.innerHTML =
`${String(min).padStart(2,"0")}:${String(sec).padStart(2,"0")}`;

}

if(seconds <= 0){

clearInterval(
emailCountdowns[id]
);

delete emailCountdowns[id];

cancelEmailAuto(id);

}

},1000);

}

async function cancelEmailAuto(id){

try{

const response =
await fetch(
`${EMAIL_API}/email/cancel/${id}`,
{
method:"POST",
headers:{
Authorization:
localStorage.getItem("token")
}
}
);

if(!response.ok){

console.log(
"AUTO CANCEL GAGAL:",
id
);

return;

}

if(emailPolling[id]){

clearInterval(
emailPolling[id]
);

delete emailPolling[id];

}

if(emailCountdowns[id]){

clearInterval(
emailCountdowns[id]
);

delete emailCountdowns[id];

}

document
.querySelector(
`[data-email="${id}"]`
)
?.remove();

}catch(err){

console.log(err);

}

}

async function reorderEmail(id){
	
	const btn =
document.getElementById(
`email-reorder-${id}`
);

if(btn){
    btn.disabled = true;
}

try{

const response =
await fetch(
`${EMAIL_API}/email/reorder/${id}`,
{
method:"POST",
headers:{
Authorization:
localStorage.getItem("token")
}
}
);

const result =
await response.json();

if(!response.ok){

throw new Error(
result.message ||
"Reorder gagal"
);

}

/* HAPUS CARD LAMA */

if(emailPolling[id]){

clearInterval(
emailPolling[id]
);

delete emailPolling[id];

}

if(emailCountdowns[id]){

clearInterval(
emailCountdowns[id]
);

delete emailCountdowns[id];

}

document
.querySelector(
`[data-email="${id}"]`
)
?.remove();

/* BUAT CARD BARU */

createEmailCard(
result.data
);

if(result.saldo !== undefined){

document.getElementById(
"userSaldo"
).innerHTML =
formatRupiah(
result.saldo
);

}

emailToast(
"✅ Reorder berhasil"
);

}catch(err){

if(btn){
    btn.disabled = false;
    btn.textContent = "Reorder";
}

emailToast(
err.message
);

}

}

async function doneEmail(id){

try{

const response =
await fetch(
`${EMAIL_API}/email/done/${id}`,
{
method:"POST",
headers:{
Authorization:
localStorage.getItem("token")
}
}
);

const result =
await response.json();

if(!response.ok){

throw new Error(
result.message ||
"Gagal menyelesaikan email"
);

}

}catch(err){

emailToast(err.message);
return;

}

if(emailPolling[id]){

clearInterval(
emailPolling[id]
);

delete emailPolling[id];

}

if(emailCountdowns[id]){

clearInterval(
emailCountdowns[id]
);

delete emailCountdowns[id];

}

document
.querySelector(
`[data-email="${id}"]`
)
?.remove();

emailToast(
"✅ Email selesai"
);

}

async function loadEmailOrders(){

try{

const response =
await fetch(
`${EMAIL_API}/email/orders`,
{
headers:{
Authorization:
localStorage.getItem("token")
}
}
);

const result =
await response.json();

if(!result.success){
return;
}

result.data.forEach(order=>{

const elapsed =
Math.floor(
(
Date.now() -
Number(order.created_at)
) / 1000
);

const remaining =
1200 - elapsed;

if(remaining <= 0){
    return;
}

createEmailCard({

...order,

message:
order.message,

time:
order.created_at,

otpReceived:
order.otpReceived ||
!!order.code,

remaining

}, false);

});

}catch(err){

console.log(
"LOAD EMAIL ORDERS ERROR:",
err
);

}

}

function viewEmailContent(id){

const html =
emailContents[id];

if(!html){

emailToast(
"Konten email tidak ditemukan"
);

return;

}

document.getElementById(
"emailModalBody"
).innerHTML = html;

document.getElementById(
"emailModal"
).style.display =
"flex";

}

function closeEmailModal(){

document.getElementById(
"emailModal"
).style.display =
"none";

}

/*
|--------------------------------------------------------------------------
| EVENT
|--------------------------------------------------------------------------
*/
const emailPolling = {};
const emailCountdowns = {};
const emailContents = {};

emailSite?.addEventListener(
"blur",
loadEmailDomains
);

emailDomain?.addEventListener(
"change",
updateEmailPrice
);

orderEmailBtn?.addEventListener(
"click",
orderEmail
);

if(
    "Notification" in window &&
    Notification.permission === "default"
){

    Notification.requestPermission();

}

loadEmailOrders();
