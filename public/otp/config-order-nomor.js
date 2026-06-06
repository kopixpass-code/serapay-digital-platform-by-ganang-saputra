/* ===========================
   SeraPay OTP
   otp.js
=========================== */

/*
|--------------------------------------------------------------------------
| GANTI URL BACKEND
|--------------------------------------------------------------------------
*/

const API = "/api/otp";

/*
|--------------------------------------------------------------------------
| ELEMENT
|--------------------------------------------------------------------------
*/

const menuBtn = document.getElementById("menuBtn");
const sidebar = document.getElementById("sidebar");
const overlay = document.getElementById("overlay");

const serviceSelect = document.getElementById("serviceSelect");
const countrySelect = document.getElementById("countrySelect");
const operatorSelect = document.getElementById("operatorSelect");
const priceSelect = document.getElementById("priceSelect");

const qtyInput = document.getElementById("qtyInput");
const orderBtn = document.getElementById("orderBtn");

const ordersContainer =document.getElementById("otpOrdersContainer");

const toast =
document.getElementById("toast");
const serviceMap = {};
const countryMap = {};
const operatorMap = {};

function getServiceLogo(code){

return `https://cdn.hero-sms.com/assets/img/service/${code}0.webp`;

}
/*
|--------------------------------------------------------------------------
| DATA
|--------------------------------------------------------------------------
*/

let activeOrders = [];
const pollingIntervals = {};

/*
|--------------------------------------------------------------------------
| MENU MOBILE
|--------------------------------------------------------------------------
*/

menuBtn?.addEventListener("click", () => {

sidebar.classList.add("show");
overlay.classList.add("show");

});

overlay?.addEventListener("click", () => {

sidebar.classList.remove("show");
overlay.classList.remove("show");

});

/*
|--------------------------------------------------------------------------
| TOAST
|--------------------------------------------------------------------------
*/

function showToast(message){

toast.innerHTML = message;

toast.classList.add("show");

setTimeout(()=>{

toast.classList.remove("show");

},3000);

}

async function copyText(text){

try{

await navigator.clipboard.writeText(text);

showToast("📋 Berhasil disalin");

}catch(err){

showToast("Gagal menyalin");

}

}

/*
|--------------------------------------------------------------------------
| API HELPER
|--------------------------------------------------------------------------
*/

async function apiGet(url){

const res = await fetch(url);

if(!res.ok)
throw new Error("Request gagal");

return await res.json();

}

async function apiPost(url,data={}){

const token =
localStorage.getItem("token");

const res = await fetch(url,{

method:"POST",

headers:{
"Content-Type":"application/json",
"Authorization":token
},

body:JSON.stringify(data)

});

const result =
await res.json();

if(!res.ok){

throw new Error(
result.message ||
"Request gagal"
);

}

return result;

}

/*
|--------------------------------------------------------------------------
| LOAD SERVICES
|--------------------------------------------------------------------------
*/

async function loadServices(){

try{

serviceSelect.innerHTML =
`<option>Loading...</option>`;

const data =
await apiGet(`${API}/services`);

serviceSelect.innerHTML = `
<option value="">
Cari aplikasi...
</option>
`;

const limited = data.slice(0,200);

limited.forEach(item=>{

serviceMap[item.code] = {
    name: item.name,
    logo: getServiceLogo(item.code)
};

serviceSelect.innerHTML += `
<option value="${item.code}">
${item.name}
</option>
`;

});

if(serviceSelect.tomselect){
    serviceSelect.tomselect.destroy();
}

new TomSelect("#serviceSelect",{

create:false,
allowEmptyOption:true,
placeholder:"Cari aplikasi...",
maxOptions:100,

render:{

option:function(data,escape){

const logo =
serviceMap[data.value]?.logo ||
"https://cdn.simpleicons.org/appstore";

return `
<div style="
display:flex;
align-items:center;
gap:8px;
">

<img
src="${logo}"
width="20"
height="20"
onerror="this.src='https://cdn.hero-sms.com/assets/img/service/ot0.webp'"
>

<span>
${escape(data.text)}
</span>

</div>
`;

},

item:function(data,escape){

const logo =
serviceMap[data.value]?.logo ||
"https://cdn.simpleicons.org/appstore";

return `
<div style="
display:flex;
align-items:center;
gap:8px;
">

<img
src="${logo}"
width="18"
height="18"
onerror="this.src='https://cdn.hero-sms.com/assets/img/service/ot0.webp'"
>

<span>
${escape(data.text)}
</span>

</div>
`;

}

}

});

}catch(e){

showToast("Gagal load aplikasi");

}

}

/*
|--------------------------------------------------------------------------
| LOAD COUNTRIES
|--------------------------------------------------------------------------
*/

async function loadCountries(){

try{

countrySelect.innerHTML =
`<option>Loading...</option>`;

const data =
await apiGet(`${API}/countries`);

countrySelect.innerHTML = `
<option value="">
Cari negara...
</option>
`;

data.forEach(item=>{

countryMap[item.id] = {
  name:item.name,
  logo:`https://cdn.hero-sms.com/assets/img/country/${item.id}.svg`
};

countrySelect.innerHTML += `
<option value="${item.id}">
${item.name}
</option>
`;

});

if(!countrySelect.tomselect){

new TomSelect("#countrySelect",{

create:false,
allowEmptyOption:true,
placeholder:"Cari negara...",

render:{

option:function(data,escape){

const logo =
countryMap[data.value]?.logo;

return `
<div style="
display:flex;
align-items:center;
gap:8px;
">

<img
src="${logo}"
width="20"
height="15"
>

<span>
${escape(data.text)}
</span>

</div>
`;

},

item:function(data,escape){

const logo =
countryMap[data.value]?.logo;

return `
<div style="
display:flex;
align-items:center;
gap:8px;
">

<img
src="${logo}"
width="20"
height="15"
>

<span>
${escape(data.text)}
</span>

</div>
`;

}

}

});

}

}catch(e){

showToast("Gagal load negara");

}

}

/*
|--------------------------------------------------------------------------
| LOAD PROVIDER
|--------------------------------------------------------------------------
*/

function getOperatorLogo(name){

const map = {

"Telkomsel":"telkomsel.webp",

"Indosat Ooredoo":"indosat.webp",
"indosat":"indosat.webp",

"AXIS (XL Axiata)":"axis.webp",
"axis":"axis.webp",

"Three":"three.webp",
"three":"three.webp",

"Smartfren":"smartfren.webp",
"smartfren":"smartfren.webp",

"byU":"byu.webp",
"byu":"byu.webp",

"XL":"xl.webp",
"xl":"xl.webp",

"Any operator":"any.webp"

};

const file = map[name];

return file
? `/img/operator/${file}`
: `/img/operator/any.webp`;

}

async function loadOperators(){

try{

const country =
countrySelect.value;

const data =
await apiGet(
`${API}/operators?country=${country}`
);

operatorSelect.innerHTML = "";

data.forEach(item=>{

operatorMap[item] = {
  logo:getOperatorLogo(item)
};

operatorSelect.innerHTML += `
<option value="${item}">
${item}
</option>
`;

});

if(operatorSelect.tomselect){
    operatorSelect.tomselect.destroy();
}

new TomSelect("#operatorSelect",{

create:false,

render:{

option:function(data,escape){

const logo =
operatorMap[data.value]?.logo;

return `
<div style="
display:flex;
align-items:center;
gap:8px;
">

${
logo
? `<img
src="${logo}"
width="20"
height="20"
style="object-fit:contain"
onerror="this.src='/img/operator/any.webp'"
>`
: `<div style="
width:20px;
height:20px;
border-radius:50%;
background:#6366f1;
color:#fff;
display:flex;
align-items:center;
justify-content:center;
font-size:11px;
font-weight:700;
">
${data.text.charAt(0)}
</div>`
}

<span>${escape(data.text)}</span>

</div>
`;

},

item:function(data,escape){

const logo =
operatorMap[data.value]?.logo;

return `
<div style="
display:flex;
align-items:center;
gap:8px;
">

${
logo
? `<img
src="${logo}"
width="18"
height="18"
style="object-fit:contain"
onerror="this.src='/img/operator/any.webp'"
>`
: `<div style="
width:18px;
height:18px;
border-radius:50%;
background:#6366f1;
color:#fff;
display:flex;
align-items:center;
justify-content:center;
font-size:10px;
font-weight:700;
">
${data.text.charAt(0)}
</div>`
}

<span>${escape(data.text)}</span>

</div>
`;

}

}

});

}catch(e){

showToast("Gagal load provider");

}

}

/*
|--------------------------------------------------------------------------
| LOAD HARGA
|--------------------------------------------------------------------------
*/

async function loadPrices(){

try{

const country =
countrySelect.value;

const service =
serviceSelect.value;

const data =
await apiGet(
`${API}/prices?country=${country}&service=${service}`
);

priceSelect.innerHTML = "";

data.forEach(item=>{

priceSelect.innerHTML += `
<option value="${item.price}">
Rp ${item.price} • Stok ${Number(item.count).toLocaleString("id-ID")}
</option>
`;

});

}catch(e){

showToast("Gagal load harga");

}

}

/*
|--------------------------------------------------------------------------
| CHANGE
|--------------------------------------------------------------------------
*/

countrySelect?.addEventListener(
"change",
()=>{
loadOperators();
loadPrices();
}
);

serviceSelect?.addEventListener(
"change",
()=>{
loadPrices();
}
);

/*
|--------------------------------------------------------------------------
| ORDER
|--------------------------------------------------------------------------
*/

orderBtn?.addEventListener(
"click",
async ()=>{

try{

orderBtn.disabled = true;

const payload = {
countryName:
countrySelect.options[
countrySelect.selectedIndex
]?.text || "",

countryLogo:
`https://cdn.hero-sms.com/assets/img/country/${countrySelect.value}.svg`,

service:
serviceSelect.value,

serviceName:
serviceSelect.options[
    serviceSelect.selectedIndex
]?.text || serviceSelect.value,

country:
countrySelect.value,

operator:
operatorSelect.value,

qty:
qtyInput.value

};

const result =
await apiPost(
`${API}/order`,
payload
);

result.service =
getServiceName(result.service);

result.logo =
getServiceLogo(payload.service);

result.countryLogo =
payload.countryLogo;

createOrderCard(result);

showToast("✅ Berhasil order");

}catch(e){

showToast(
" " + e.message
);

}

finally{

orderBtn.disabled = false;

}

}
);

/*
|--------------------------------------------------------------------------
| CREATE CARD
|--------------------------------------------------------------------------
*/

function getServiceName(code){

    const option = serviceSelect.querySelector(
        `option[value="${code}"]`
    );

    return option
        ? option.textContent.trim()
        : code;

}

function createOrderCard(order){

const card =
document.createElement("div");

card.className =
"otp-card";

card.dataset.id =
order.activation_id;

card.innerHTML = `

<div class="otp-header">

<div class="otp-app">

<img
src="${order.logo}"
style="
width:22px;
height:22px;
object-fit:contain;
flex-shrink:0;
"
>

<div>
<div style="
display:flex;
align-items:center;
gap:6px;
">

<img
src="${order.countryLogo}"
style="
width:16px;
height:12px;
object-fit:cover;
border-radius:2px;
flex-shrink:0;
"
>

<h4>${order.service}</h4>

</div>

</div>

</div>

<div class="timer"
id="timer-${order.activation_id}">
20:00
</div>

</div>

<div class="phone-number">

<span class="copy-text">
${order.number}
</span>

<button
class="copy-btn"
onclick="copyText('${order.number}')"
title="Salin nomor">

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
disabled
id="done-${order.activation_id}"
onclick="doneOrder('${order.activation_id}')">
Done
</button>

<button
class="btn-resend"
disabled
id="resend-${order.activation_id}"
onclick="resendOrder('${order.activation_id}')">
Resend
</button>

<button
class="btn-cancel"
disabled
id="cancel-${order.activation_id}"
onclick="cancelOrder('${order.activation_id}')">
Batal
</button>

</div>

<div class="waiting"
id="waiting-${order.activation_id}">

<div class="spinner"></div>

<span>
Menunggu pesan masuk...
</span>

</div>

<div class="messages"
id="messages-${order.activation_id}">
</div>



`;

ordersContainer.prepend(card);
const cancelBtn =
document.getElementById(
`cancel-${order.activation_id}`
);

if(cancelBtn){

const elapsed =
1200 - (
order.remaining ?? 1200
);

if(elapsed >= 120){

cancelBtn.disabled = false;

}

}

const container =
document.getElementById(
`messages-${order.activation_id}`
);

/* LOAD HISTORY SMS */

if(order.messages?.length){

    order.messages.forEach(msg=>{

        container.innerHTML += `

        <div class="sms-item">

            <strong>Pesan masuk</strong>

            ${msg.text}

        </div>

        `;

    });

}

/* STATUS WAITING */

if(order.waitingResend){

    document.getElementById(
        `waiting-${order.activation_id}`
    ).style.display = "flex";

}else if(order.messages?.length){

    document.getElementById(
        `waiting-${order.activation_id}`
    ).style.display = "none";

}

if(order.smsReceived){

    const doneBtn =
    document.getElementById(
        `done-${order.activation_id}`
    );

    if(doneBtn){

        doneBtn.disabled = false;

    }

    const resendBtn =
    document.getElementById(
        `resend-${order.activation_id}`
    );

    if(resendBtn){

        resendBtn.disabled =
        order.waitingResend === true;

    }

    if(!order.waitingResend){

        document
        .getElementById(
            `cancel-${order.activation_id}`
        )
        ?.remove();

    }

}

startCountdown(
    order.activation_id,
    order.remaining ?? 1200
);

// polling hanya jika masih menunggu SMS
const waitingEl =
document.getElementById(
    `waiting-${order.activation_id}`
);

if(
    waitingEl &&
    waitingEl.style.display !== "none"
){
    startPolling(
        order.activation_id
    );
}

}

/*
|--------------------------------------------------------------------------
| COUNTDOWN
|--------------------------------------------------------------------------
*/

function startCountdown(id,seconds){

const timer =
document.getElementById(
`timer-${id}`
);

const interval =
setInterval(()=>{

seconds--;
const cancelBtn =
document.getElementById(
`cancel-${id}`
);

if(
cancelBtn &&
seconds <= 1080
){
cancelBtn.disabled = false;
}

let min =
Math.floor(seconds/60);

let sec =
seconds%60;

timer.innerHTML =
`${String(min).padStart(2,"0")}:${String(sec).padStart(2,"0")}`;

if(seconds<=0){

clearInterval(interval);

autoCancel(id);

}

},1000);

}

/*
|--------------------------------------------------------------------------
| POLLING OTP
|--------------------------------------------------------------------------
*/

function startPolling(id){

let knownMessages = [];

pollingIntervals[id] =
setInterval(async()=>{

try{

const result =
await apiGet(
`${API}/sms/${id}`
);

if(!result.messages)
return;

const container =
document.getElementById(
`messages-${id}`
);

result.messages.forEach(msg=>{

if(
knownMessages.includes(
msg.id
)
) return;

knownMessages.push(
msg.id
);

container.innerHTML += `

<div class="sms-item">

<div class="sms-header">

<strong>
Pesan masuk
</strong>

<button
class="copy-btn"
onclick="copyText('${msg.text.replace(/'/g,"\\'")}')">

<svg xmlns="http://www.w3.org/2000/svg"
width="18"
height="18"
viewBox="0 0 24 24"
fill="none"
stroke="currentColor"
stroke-width="2">

<rect x="9" y="9" width="13" height="13" rx="2"/>

<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>

</svg>

</button>

</div>

<div class="sms-text">

<span>
${msg.text}
</span>

<button
class="copy-btn"
onclick="copyText('${msg.text.replace(/'/g,"\\'")}')"
title="Salin OTP">

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

</div>

`;

const waiting =
document.getElementById(
`waiting-${id}`
);

if(waiting){

    waiting.style.display = "none";

}

showToast(
"📩 Pesan baru"
);

const doneBtn =
document.getElementById(
`done-${id}`
);

if(doneBtn){

    doneBtn.disabled = false;

}

const resendBtn =
document.getElementById(
`resend-${id}`
);

if(resendBtn){

    resendBtn.disabled = false;

}

const cancelBtn =
document.getElementById(
`cancel-${id}`
);

if(cancelBtn){

cancelBtn.remove();

}

clearInterval(
    pollingIntervals[id]
);

delete pollingIntervals[id];

});

}catch(e){

console.log(e);

}

},5000);

}

/*
|--------------------------------------------------------------------------
| RESEND
|--------------------------------------------------------------------------
*/

async function resendOrder(id){

try{

const btn =
document.getElementById(
`resend-${id}`
);

btn.disabled = true;

showToast(
"🔄 Request resend..."
);

await apiPost(
`${API}/resend`,
{
activation_id:id
}
);

const waiting =
document.getElementById(
`waiting-${id}`
);

if(waiting){

    waiting.style.display = "flex";

}

setTimeout(()=>{

btn.disabled = false;

},10000);

}catch(e){

showToast(
"Gagal resend"
);

}

}

/*
|--------------------------------------------------------------------------
| DONE
|--------------------------------------------------------------------------
*/

async function doneOrder(id){

const doneBtn =
document.getElementById(
`done-${id}`
);

if(doneBtn?.disabled){

    showToast(
    "Belum ada SMS masuk"
    );

    return;

}

try{

await apiPost(
`${API}/done`,
{
activation_id:id
}
);

showToast(
"Order selesai"
);

const card =
document.querySelector(
`[data-id="${id}"]`
);

card?.remove();

clearInterval(
    pollingIntervals[id]
);

delete pollingIntervals[id];

saveHistory(id);

}catch(e){

showToast(
"Gagal selesai"
);

}

}

/*
|--------------------------------------------------------------------------
| CANCEL
|--------------------------------------------------------------------------
*/

async function cancelOrder(id){

if(
!confirm(
"Batalkan order?"
)
)
return;

try{

await apiPost(
`${API}/cancel`,
{
activation_id:id
}
);

showToast(
"Order dibatalkan"
);

const card =
document.querySelector(
`[data-id="${id}"]`
);

card?.remove();
clearInterval(
    pollingIntervals[id]
);

delete pollingIntervals[id];

}catch(e){

showToast(
"Tunggu 2 menit untuk membatalkan pesanan"
);

}

}

/*
|--------------------------------------------------------------------------
| AUTO CANCEL
|--------------------------------------------------------------------------
*/

async function autoCancel(id){
	
if(!id){
    return;
}

try{

await apiPost(
`${API}/cancel`,
{
activation_id:id
}
);

const card =
document.querySelector(
`[data-id="${id}"]`
);

card?.remove();
clearInterval(
    pollingIntervals[id]
);

delete pollingIntervals[id];

}catch(e){

console.log(e);

}

}

/*
|--------------------------------------------------------------------------
| SAVE HISTORY
|--------------------------------------------------------------------------
*/

async function saveHistory(id){

try{

await apiPost(
`${API}/history/save`,
{
activation_id:id
}
);

}catch(e){

console.log(e);

}

}

async function loadOrders(){

try{

const token =
localStorage.getItem("token");

const res =
await fetch(
"/api/otp/orders",
{
headers:{
Authorization:token
}
}
);

const result =
await res.json();

if(!result.success)
return;

result.data
.sort((a,b)=>
(b.time||0) - (a.time||0)
)
.forEach(order=>{

    const now = Date.now();

    const elapsed =
    Math.floor(
        (now - order.time) / 1000
    );

const remaining =
1200 - elapsed;

if(remaining <= 0){

    if(order.smsReceived){

        doneOrder(
            order.activation_id
        );

    }else{

        autoCancel(
            order.activation_id
        );

    }

    return;
}

createOrderCard({

    activation_id:
    order.activation_id,

    number:
    order.number,

    service:
    order.serviceName ||
    order.service,

    logo:
    serviceMap[order.service]?.logo ||
    "https://cdn.hero-sms.com/assets/img/service/ot0.webp",

    countryLogo:
    `https://cdn.hero-sms.com/assets/img/country/${order.country}.svg`,

    smsReceived:
    order.smsReceived,

    waitingResend:
    order.waitingResend,

    messages:
    order.messages || [],

    remaining

});

});

}catch(err){

console.log(err);

}

}

/*
|--------------------------------------------------------------------------
| INIT
|--------------------------------------------------------------------------
*/

async function init(){

await loadServices();
await loadCountries();
// await loadOperators();
// await loadPrices();
await loadOrders();

}

init();