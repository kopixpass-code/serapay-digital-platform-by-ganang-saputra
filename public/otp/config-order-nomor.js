/* ===========================
   SeraPay OTP
   otp.js
=========================== */

const API = "/api/otp";

const menuBtn = document.getElementById("menuBtn");
const sidebar = document.getElementById("sidebar");
const overlay = document.getElementById("overlay");

const serviceSelect = document.getElementById("serviceSelect");
const countrySelect = document.getElementById("countrySelect");
const operatorSelect = document.getElementById("operatorSelect");
const durationSelect = document.getElementById("durationSelect");
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

/* ==========================
   SOUND NOTIFIKASI OTP
========================== */

const otpSound = new Audio("/img/otp.mp3");

otpSound.preload = "auto";

function playOtpSound(){

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

/* =========================
   UPDATE SALDO
========================= */

function updateSaldoView(saldo){

const saldoEl =
document.getElementById(
"userSaldo"
);

if(!saldoEl) return;

saldoEl.innerHTML =
"Rp " +
Number(saldo || 0)
.toLocaleString("id-ID");

}

function toggleSms(id){

const box =
document.getElementById(`messages-${id}`);

const arrow =
document.getElementById(`sms-arrow-${id}`);

if(!box || !arrow) return;

arrow.classList.add("loading");

setTimeout(()=>{

    arrow.classList.remove("loading");

    if(box.style.display === "none"){

        box.style.display = "block";
        arrow.classList.add("open");

    }else{

        box.style.display = "none";
        arrow.classList.remove("open");

    }

},300);

}

async function copyText(text){

try{

await navigator.clipboard.writeText(text);

showToast("disalin");

}catch(err){

showToast("Gagal menyalin");

}

}

function extractLink(text){

const match =
String(text).match(
/https?:\/\/[^\s]+/i
);

return match
? match[0]
: null;

}

function renderSmsText(text){

return String(text).replace(
    /(https?:\/\/[^\s]+)/gi,
    '<br><a href="$1" target="_blank" class="sms-link">$1</a>'
);

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

    onItemAdd:function(){
        this.blur();
        document.activeElement?.blur();
    },

render:{

option:function(data,escape){

const logo =
serviceMap[data.value]?.logo ||
"/img/operator/googleplay.webp";

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
"/img/operator/googleplay.webp";

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

        let indonesiaId = "";

        data.forEach(item=>{

            countryMap[item.id] = {
                name:item.name,
                logo:`https://cdn.hero-sms.com/assets/img/country/${item.id}.svg`
            };

            if(
                item.name &&
                item.name.toLowerCase() === "indonesia"
            ){
                indonesiaId = item.id;
            }

            countrySelect.innerHTML += `
            <option value="${item.id}">
                ${item.name}
            </option>
            `;

        });

        if(countrySelect.tomselect){
            countrySelect.tomselect.destroy();
        }

        const ts = new TomSelect("#countrySelect",{

            create:false,
            allowEmptyOption:true,
            placeholder:"Cari negara...",
			    onItemAdd:function(){
        this.blur();
        document.activeElement?.blur();
    },

            render:{

                option:function(data,escape){

                    const logo =
                    countryMap[data.value]?.logo || "";

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
                            height="15"
                            style="object-fit:cover;border-radius:2px"
                            onerror="this.style.display='none'"
                        >`
                        : ""
                        }

                        <span>
                            ${escape(data.text)}
                        </span>

                    </div>
                    `;
                },

                item:function(data,escape){

                    const logo =
                    countryMap[data.value]?.logo || "";

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
                            height="15"
                            style="object-fit:cover;border-radius:2px"
                            onerror="this.style.display='none'"
                        >`
                        : ""
                        }

                        <span>
                            ${escape(data.text)}
                        </span>

                    </div>
                    `;
                }

            }

        });

        // Set Indonesia sebagai default
        if(indonesiaId){
            ts.setValue(String(indonesiaId));
        }

        // Trigger load data terkait Indonesia
        loadOperators();
        loadPrices();

    }catch(e){

        console.error(e);
        showToast("Gagal load negara");

    }

}

/*
|--------------------------------------------------------------------------
| LOAD PROVIDER
|--------------------------------------------------------------------------
*/

function getOperatorLogo(name){

    const n = String(name || "")
        .toLowerCase()
        .trim();

    if(n.includes("telkomsel"))
        return "/img/operator/telkomsel.webp";

    if(n.includes("indosat"))
        return "/img/operator/indosat.webp";

    if(n.includes("axis"))
        return "/img/operator/axis.webp";

    if(n.includes("three") || n.includes("3"))
        return "/img/operator/three.webp";

    if(n.includes("smartfren"))
        return "/img/operator/smartfreen.webp";

    if(n.includes("byu"))
        return "/img/operator/byu.webp";

    if(n === "xl" || n.includes("xl "))
        return "/img/operator/xl.webp";

    return "/img/operator/any.webp";
}

async function loadOperators(){

try{

    const country =
    countrySelect.value;

    // reset select
    operatorSelect.innerHTML = `
    <option value="">
        Loading...
    </option>
    `;

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

    onItemAdd:function(){
        this.blur();
        document.activeElement?.blur();
    },

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

const duration =
durationSelect.value;

const data =
await apiGet(
`${API}/prices?country=${country}&service=${service}&duration=${duration}`
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

    // hapus TomSelect provider lama
    if(operatorSelect.tomselect){
        operatorSelect.tomselect.destroy();
    }

    operatorSelect.innerHTML = `
    <option value="">
        Pilih provider...
    </option>
    `;

    priceSelect.innerHTML = `
    <option value="">
        Pilih harga...
    </option>
    `;

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

durationSelect?.addEventListener(
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

duration:
durationSelect.value,

qty:
qtyInput.value

};

const result =
await apiPost(
`${API}/order`,
payload
);

updateSaldoView(
result.saldo
);

result.service =
getServiceName(result.service);

result.logo =
getServiceLogo(payload.service);

result.countryLogo =
payload.countryLogo;

result.duration =
payload.duration;

createOrderCard(result, true);

showToast("Berhasil order");

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

function updateSmsCount(id){

const count =
document.querySelectorAll(
`#messages-${id} .sms-item`
).length;

const el =
document.getElementById(
`sms-count-${id}`
);

if(el){

    el.innerHTML =
    `(${count})`;

}

}

function createOrderCard(order, prepend = false){

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
${order.duration == "2" ? "24:00:00" : "20:00"}
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

${
order.duration == "2"
?
`
<button
class="btn-extend"
id="extend-${order.activation_id}"
onclick="extendOrder('${order.activation_id}')"
style="
${order.duration == "2" && order.smsReceived ? "" : "display:none;"}
">
Perpanjang
</button>
`
:
""
}

${
order.duration == "2"
?
`
<button
class="btn-warning-rental"
id="warning-${order.activation_id}"
onclick="showRentalWarning()"
title="Peringatan Rental"
style="display:none;">

<svg
viewBox="-0.5 0.5 42 42"
width="18"
height="18">

<path
fill="currentColor"
d="M18.295,3.895L1.203,34.555C-0.219,37.146,0.385,39.5,4.228,39.5H36.77c3.854,0,4.447-2.354,3.025-4.945L22.35,3.914C21.996,3.223,21.482,2.49,20.393,2.5C19.233,2.521,18.658,3.203,18.295,3.895z M18.5,13.5h4v14h-4V13.5z M18.5,30.5h4v4h-4V30.5z"/>

</svg>

</button>
`
:
""
}

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
onclick="showCancelModal('${order.activation_id}')">
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

<!-- SMS TERBARU -->
<div
class="latest-sms"
id="latest-sms-${order.activation_id}"
style="display:none;">
</div>

<!-- RIWAYAT -->
<div class="sms-wrapper">

<button
class="sms-toggle"
onclick="toggleSms('${order.activation_id}')">

    <span class="sms-left">

        📩 Riwayat Pesan

        <span
        id="sms-count-${order.activation_id}"
        class="sms-count">
            (0)
        </span>

    </span>

    <span
    id="sms-arrow-${order.activation_id}"
    class="sms-arrow">

        <svg
        class="arrow-icon"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none">

            <path
            d="M7 10L12 15L17 10"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"/>

        </svg>

        <svg
        class="loading-icon"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none">

            <path
            d="M12 3a9 9 0 1 0 9 9"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"/>

        </svg>

    </span>

</button>

<div
class="messages"
id="messages-${order.activation_id}"
style="display:none;">
</div>

</div>



`;

if(prepend){
    ordersContainer.prepend(card);
}else{
    ordersContainer.appendChild(card);
}

const cancelBtn =
document.getElementById(
`cancel-${order.activation_id}`
);

if(cancelBtn){

const elapsed =
order.elapsed || 0;

if(order.duration == "2"){

    if(elapsed >= 120 && elapsed <= 1200){

        cancelBtn.disabled = false;
        cancelBtn.style.display = "inline-flex";

    }else{

        cancelBtn.style.display = "none";

    }

}

}

const container =
document.getElementById(
`messages-${order.activation_id}`
);

/* LOAD HISTORY SMS */

if(order.messages?.length){

    const messages =
    [...order.messages].reverse();
	
	const latestBox =
document.getElementById(
`latest-sms-${order.activation_id}`
);

const latestMessage =
messages[0];

if(latestBox && latestMessage){

latestBox.style.display = "block";

latestBox.innerHTML = `
<div class="sms-title">

    <span>Pesan Baru</span>

    <svg
    class="sms-badge-new"
    viewBox="0 0 36 36"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true">

        <path
        fill="#ec4899"
        d="M34.11,24.49l-3.92-6.62,3.88-6.35A1,1,0,0,0,33.22,10H2a2,2,0,0,0-2,2V24a2,2,0,0,0,2,2H33.25A1,1,0,0,0,34.11,24.49Zm-23.6-3.31H9.39L6.13,16.84v4.35H5V15H6.13l3.27,4.35V15h1.12ZM16.84,16H13.31v1.49h3.2v1h-3.2v1.61h3.53v1H12.18V15h4.65Zm8.29,5.16H24l-1.55-4.59L20.9,21.18H19.78l-2-6.18H19l1.32,4.43L21.84,15h1.22l1.46,4.43L25.85,15h1.23Z"/>
    </svg>

</div>

<div class="latest-sms-body">

<div class="sms-content">
    ${renderSmsText(latestMessage.text)}
</div>

    <button
    class="copy-btn"
onclick="copyText('${
    String(
        extractLink(latestMessage?.text) ||
        latestMessage?.text ||
        ""
    )
    .replace(/\\/g,"\\\\")
    .replace(/'/g,"\\'")
    .replace(/\n/g," ")
}')"
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
`;

}

    messages.forEach(msg=>{

    if(!msg || !msg.text){
        return;
    }

        container.innerHTML += `

<div class="sms-item">

<div class="sms-header">

<strong>
Kotak masuk
</strong>



</div>

<div class="sms-text">

    <div class="sms-message">
        ${renderSmsText(msg.text)}
    </div>

    <button
    class="copy-btn"
onclick="copyText('${
    String(
        extractLink(latestMessage?.text) ||
        latestMessage?.text ||
        ""
    )
    .replace(/\\/g,"\\\\")
    .replace(/'/g,"\\'")
    .replace(/\n/g," ")
}')"
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

    });
	
	    updateSmsCount(
        order.activation_id
    );

}

/* STATUS WAITING */

if(order.waitingResend){

    document.getElementById(
        `waiting-${order.activation_id}`
    ).style.display = "flex";
	
	const latestBox =
document.getElementById(
`latest-sms-${order.activation_id}`
);

if(latestBox){
    latestBox.style.display = "none";
}

    document
    .getElementById(
        `cancel-${order.activation_id}`
    )
    ?.remove();

}else if(order.messages?.length){

    document.getElementById(
        `waiting-${order.activation_id}`
    ).style.display = "none";

}

if(order.smsReceived){
	
const warningBtn =
document.getElementById(
`warning-${order.activation_id}`
);

if(warningBtn){

    warningBtn.remove();

}

    const doneBtn =
    document.getElementById(
        `done-${order.activation_id}`
    );
	
	const extendBtn =
document.getElementById(
`extend-${order.activation_id}`
);

if(extendBtn){

    extendBtn.style.display = "inline-flex";

}

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

const defaultSeconds =
order.duration == "2"
? 86400
: 1200;

startCountdown(
    order.activation_id,
    order.remaining ?? defaultSeconds,
    order.duration
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

function startCountdown(id,seconds,duration){

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

if(cancelBtn){

    if(duration == "2"){

        const elapsed =
        86400 - seconds;

        if(elapsed >= 120 && elapsed <= 1200){

            cancelBtn.style.display =
            "inline-flex";

            cancelBtn.disabled = false;

        }else{

            cancelBtn.style.display =
            "none";

        }

    }else{

        if(seconds <= 1080){

            cancelBtn.disabled = false;

        }

    }

}

const h =
Math.floor(seconds / 3600);

const m =
Math.floor((seconds % 3600) / 60);

const s =
seconds % 60;

timer.innerHTML =
`${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;

const warningBtn =
document.getElementById(
`warning-${id}`
);

if(
warningBtn &&
duration == "2"
){

    const waitingEl =
    document.getElementById(
    `waiting-${id}`
    );

    /* jika sms sudah masuk jangan tampilkan warning */

    if(
        !waitingEl ||
        waitingEl.style.display === "none"
    ){

        warningBtn.remove();

    }else{

        const elapsed =
        86400 - seconds;

        if(
            elapsed >= 120 &&
            elapsed <= 1200
        ){

            warningBtn.style.display =
            "inline-flex";

        }else{

            warningBtn.style.display =
            "none";

        }

    }

}

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

const waiting =
document.getElementById(
`waiting-${id}`
);

if(
    !waiting ||
    waiting.style.display === "none"
){
    return;
}

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

container
.querySelectorAll(".sms-badge-new")
.forEach(el=>el.remove());

container.insertAdjacentHTML(
"afterbegin",
`

<div class="sms-item">

    <div class="sms-header" style="
        display:flex;
        align-items:center;
        gap:8px;
    ">

        <strong>
            KOTAK MASUK
        </strong>

<svg
class="sms-badge-new"
viewBox="0 0 36 36"
xmlns="http://www.w3.org/2000/svg"
aria-hidden="true"
>

<path
fill="#ec4899"
d="M34.11,24.49l-3.92-6.62,3.88-6.35A1,1,0,0,0,33.22,10H2a2,2,0,0,0-2,2V24a2,2,0,0,0,2,2H33.25A1,1,0,0,0,34.11,24.49Zm-23.6-3.31H9.39L6.13,16.84v4.35H5V15H6.13l3.27,4.35V15h1.12ZM16.84,16H13.31v1.49h3.2v1h-3.2v1.61h3.53v1H12.18V15h4.65Zm8.29,5.16H24l-1.55-4.59L20.9,21.18H19.78l-2-6.18H19l1.32,4.43L21.84,15h1.22l1.46,4.43L25.85,15h1.23Z"
/>

</svg>

    </div>

<div class="sms-text">

    <div class="sms-message">
        ${renderSmsText(msg.text)}
    </div>

    <button
    class="copy-btn"
onclick="copyText('${
    String(
        extractLink(msg?.text) ||
        msg?.text ||
        ""
    )
    .replace(/\\/g,"\\\\")
    .replace(/'/g,"\\'")
    .replace(/\n/g," ")
}')"
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

`
);

const latestBox =
document.getElementById(
`latest-sms-${id}`
);

if(latestBox){

    latestBox.style.display = "block";

latestBox.innerHTML = `
<div class="sms-title">

    <span>Pesan Baru</span>

    <svg
    class="sms-badge-new"
    viewBox="0 0 36 36"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true">

        <path
        fill="#ec4899"
        d="M34.11,24.49l-3.92-6.62,3.88-6.35A1,1,0,0,0,33.22,10H2a2,2,0,0,0-2,2V24a2,2,0,0,0,2,2H33.25A1,1,0,0,0,34.11,24.49Zm-23.6-3.31H9.39L6.13,16.84v4.35H5V15H6.13l3.27,4.35V15h1.12ZM16.84,16H13.31v1.49h3.2v1h-3.2v1.61h3.53v1H12.18V15h4.65Zm8.29,5.16H24l-1.55-4.59L20.9,21.18H19.78l-2-6.18H19l1.32,4.43L21.84,15h1.22l1.46,4.43L25.85,15h1.23Z"/>
    </svg>

</div>

<div class="latest-sms-body">

<div class="sms-content">
    ${renderSmsText(msg.text)}
</div>

<button
class="copy-btn"
onclick="copyText('${
    String(
        extractLink(msg?.text) ||
        msg?.text ||
        ""
    )
    .replace(/\\/g,"\\\\")
    .replace(/'/g,"\\'")
    .replace(/\n/g," ")
}')"
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
`;
}

updateSmsCount(id);

const waiting =
document.getElementById(
`waiting-${id}`
);

if(waiting){
    waiting.style.display = "none";
}

const resendBtn =
document.getElementById(
`resend-${id}`
);

if(resendBtn){
    resendBtn.disabled = false;
}

clearInterval(
    pollingIntervals[id]
);

delete pollingIntervals[id];

playOtpSound();

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

/* =========================
   TAMPILKAN PERPANJANG
========================= */

const extendBtn =
document.getElementById(
`extend-${id}`
);

if(extendBtn){

    extendBtn.style.display =
    "inline-flex";

}

/* =========================
   HIDE WARNING RENTAL
========================= */

const warningBtn =
document.getElementById(
`warning-${id}`
);

if(warningBtn){

    warningBtn.remove();

}

/* =========================
   HAPUS BATAL
========================= */

const cancelBtn =
document.getElementById(
`cancel-${id}`
);

if(cancelBtn){

    cancelBtn.remove();

}

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

const latestBox =
document.getElementById(
`latest-sms-${id}`
);

if(latestBox){

    latestBox.style.display = "none";
    latestBox.innerHTML = "";

}

const resendBtn =
document.getElementById(
`resend-${id}`
);

if(resendBtn){
    resendBtn.disabled = true;
}

if(!pollingIntervals[id]){
    startPolling(id);
}

}catch(e){

showToast(
"Gagal resend"
);

}

}

async function extendOrder(id){

try{

showToast("Memperpanjang nomor...");

const result = await apiPost(
`${API}/extend`,
{
activation_id:id
}
);

updateSaldoView(
result.saldo
);

showToast(
result.message ||
"Nomor berhasil diperpanjang"
);

showToast(
result.message ||
"Nomor berhasil diperpanjang"
);

const timer =
document.getElementById(
`timer-${id}`
);

if(timer){

timer.innerHTML =
"24:00:00";

}

}catch(e){

showToast(
e.message ||
"Gagal memperpanjang nomor"
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

const extendBtn =
document.getElementById(
`extend-${id}`
);

if(extendBtn){

    extendBtn.style.display = "inline-flex";

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

async function cancelOrder(id, confirmed=false){

if(!confirmed)
return;

try{

const result =
await apiPost(
`${API}/cancel`,
{
activation_id:id
}
);

updateSaldoView(
result.saldo
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

async function rentalExpired(id){

try{

    await apiPost(
        "/api/otp/rental-expired",
        {
            activation_id:id
        }
    );

    const card =
    document.querySelector(
        `[data-id="${id}"]`
    );

    card?.remove();

}catch(err){

    console.log(err);

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

result.data.forEach(order=>{

    const now = Date.now();

    const elapsed =
    Math.floor(
        (now - order.time) / 1000
    );

const maxTime =
order.duration == "2"
? 86400
: 1200;

const remaining =
maxTime - elapsed;

if(remaining <= 0){

    if(order.duration == "2"){

        if(order.smsReceived){

            doneOrder(
                order.activation_id
            );

        }else{

            rentalExpired(
                order.activation_id
            );

        }

    }else{

        if(order.smsReceived){

            doneOrder(
                order.activation_id
            );

        }else{

            autoCancel(
                order.activation_id
            );

        }

    }

    return; // atau continue
}

createOrderCard({

    activation_id:
    order.activation_id,

    duration:
    order.duration || "1",

    elapsed,

    lastNewMessageId:
    order.last_new_message_id,

    number:
    order.phone_number,

    service:
    order.service_name ||
    order.service,

    logo:
    serviceMap[order.service]?.logo ||
    "https://cdn.hero-sms.com/assets/img/service/ot0.webp",

    countryLogo:
    `https://cdn.hero-sms.com/assets/img/country/${order.country}.svg`,

    smsReceived:
    !!order.sms_received,

    waitingResend:
    !!order.waiting_resend,

    messages: (() => {
        try{
            return JSON.parse(
                order.messages || "[]"
            );
        }catch{
            return [];
        }
    })(),

    remaining

});

});

}catch(err){

console.log(err);

}

}

/* =========================
   CANCEL MODAL
========================= */

let cancelOrderId = null;

function showCancelModal(id){

    cancelOrderId = id;

    document
    .getElementById("cancelModal")
    ?.classList.add("show");

}

function initCancelModal(){

    const modalNo =
    document.getElementById(
        "modalNo"
    );

    const modalYes =
    document.getElementById(
        "modalYes"
    );

    if(modalNo){

        modalNo.addEventListener(
        "click",
        ()=>{

            document
            .getElementById(
                "cancelModal"
            )
            ?.classList.remove(
                "show"
            );

            cancelOrderId = null;

        });

    }

    if(modalYes){

        modalYes.addEventListener(
        "click",
        ()=>{

            document
            .getElementById(
                "cancelModal"
            )
            ?.classList.remove(
                "show"
            );

            if(cancelOrderId){

                cancelOrder(
                    cancelOrderId,
                    true
                );

            }

        });

    }

}

function showRentalWarning(){

document
.getElementById(
"rentalWarningModal"
)
.classList.add("show");

}

function closeRentalWarning(){

document
.getElementById(
"rentalWarningModal"
)
.classList.remove("show");

}

/*
|--------------------------------------------------------------------------
| INIT
|--------------------------------------------------------------------------
*/

async function init(){

await loadServices();
await loadCountries();
await loadOrders();

initCancelModal();

}

init();