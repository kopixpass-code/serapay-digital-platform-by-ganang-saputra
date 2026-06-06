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
result.data);

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

function createEmailCard(data){

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

${data.otpReceived ? "" : `

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

emailContainer.prepend(card);
if(data.otpReceived || data.code){

const waiting =
document.getElementById(
`email-waiting-${data.id}`
);

if(waiting){
waiting.style.display = "none";
}

const timer =
document.getElementById(
`email-timer-${data.id}`
);

if(timer){
timer.innerHTML = "DONE";
}

const messages =
document.getElementById(
`email-messages-${data.id}`
);

messages.innerHTML = `
<div class="sms-item">
<strong>Kode OTP</strong>
<br>
${data.code}
</div>
`;

/* PASTIKAN TIDAK ADA POLLING */

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

        emailToast(
        "Email dibatalkan");

    }catch(error){

        emailToast(
        "Gagal membatalkan");

    }

}

function startEmailPolling(id){

emailPolling[id] = setInterval(async()=>{

try{

const response =
await fetch(
`${EMAIL_API}/email/check/${id}`
);

const result =
await response.json();

if(!result.code) return;

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

const messages =
document.getElementById(
`email-messages-${id}`
);

messages.innerHTML = `

<div class="sms-item">

<strong>Kode OTP</strong>

<br>

${result.code}

</div>

`;

emailToast("📩 Email masuk");

clearInterval(
emailPolling[id]
);

delete emailPolling[id];

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

emailToast(
"✅ Reorder berhasil"
);

}catch(err){

emailToast(
" " +
err.message
);

}

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
(Date.now() - order.time) / 1000
);

const remaining =
1200 - elapsed;

if(remaining <= 0){

cancelEmailAuto(
order.id
);

return;

}

createEmailCard({

...order,

otpReceived:
order.otpReceived ||
!!order.code,

remaining

});

});

}catch(err){

console.log(
"LOAD EMAIL ORDERS ERROR:",
err
);

}

}

/*
|--------------------------------------------------------------------------
| EVENT
|--------------------------------------------------------------------------
*/
const emailPolling = {};
const emailCountdowns = {};

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

loadEmailOrders();