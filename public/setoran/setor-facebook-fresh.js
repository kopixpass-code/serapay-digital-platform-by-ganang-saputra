let dataHistory = JSON.parse(
localStorage.getItem("setoranHistory")
|| "[]"
);

let rekening=null;
let popupPernahDitutup=false;

let saldo=
Number(
localStorage.getItem("saldo")
||0
);

document.getElementById(
"saldo"
).innerText=
saldo.toLocaleString(
"id-ID"
);

const token=
localStorage.getItem(
"token"
);

if(!token){

window.location.href=
"/index";

throw new Error(
"Belum login"
);

}

loadUser();
renderHistory();
loadRekening();
pilihTipe();
loadWithdrawHistory();

cekStatusAkun();

setInterval(
cekStatusAkun,
5000
);

const tab=
localStorage.getItem(
"tabAktif"
);

if(tab){

const menu=
document
.querySelectorAll(
".menu"
);

if(tab==="home")
nav(tab,menu[0]);

if(tab==="withdraw")
nav(tab,menu[1]);

if(tab==="history")
nav(tab,menu[2]);

}

async function loadUser(){

try{

const token=
localStorage.getItem(
"token"
);

if(!token)return;

const res=
await fetch(
"/api/me",
{
headers:{
authorization:
token
}
});

const data=
await res.json();

if(
!data.success
)return;

saldo=
Number(
data.user.reward||0
);

document
.getElementById(
"saldo"
)
.innerText=
saldo.toLocaleString(
"id-ID"
);

document
.getElementById(
"namaUser"
)
.innerText=
data.user.name;

document
.getElementById(
"avatar"
)
.innerHTML=
`<img src="/css/img/avatar1.png">`;

localStorage.setItem(
"user",
JSON.stringify(
data.user
)
);

}catch(err){

console.log(
err
);

btn.disabled=false;

btn.style.opacity="1";

btnText.innerHTML=
"KIRIM";

toast(
"Gagal kirim"
);

}

}

loadUser();

function pilihTipe(){

const tipe=
document
.getElementById(
"tipeSelect"
)
.value
.toLowerCase();

const raw=
document.getElementById(
"raw"
);

if(
tipe.includes(
"facebook"
)
){

raw.placeholder=
`ridwankamiluj@gaslur.com
https://www.facebook.com/profile.php?id=61588982668811
nandapranoji@bosgb.com
https://www.facebook.com/profile.php?id=61587543675567`;

}

else{

raw.placeholder=
`lufianajamal87@gmail.com
nisyaparyadih76@gmail.com`;

}

previewNomor();

}

async function kirim(){
	const btn=
document.getElementById(
"kirimBtn"
);

const btnText=
document.getElementById(
"btnText"
);

if(
btn.disabled
)return;

btn.disabled=true;

btn.style.opacity=".6";

btnText.innerHTML=
`<span class="spinner"></span>`;

const status=
await fetch(
"/api/status-akun"
);

const json=
await status.json();

if(
json.penuh
){

return toast(
"Maaf akun sedang penuh, coba kembali beberapa saat lagi"
);

}

const tipe=
document
.getElementById(
"tipeSelect"
)
.value;

const password=
document
.getElementById(
"password"
)
.value
.trim();

const raw=
document
.getElementById(
"raw"
)
.value
.trim();

if(!password){

return toast(
"Password kosong"
);

}

if(!raw){

return toast(
"Data kosong"
);

}

const split=
tipe.split("|");

const nama=
split[0];

const harga=
Number(
split[1]
);

const rows=
raw
.split("\n")
.map(x=>x.trim())
.filter(Boolean);

const isFacebook=
nama
.toLowerCase()
.includes(
"facebook"
);

const step=
isFacebook
? 2
: 1;

for(
let i=0;
i<rows.length;
i+=step
){

const emailRow=
rows[i]||"";

const secondRow=
isFacebook
? rows[i+1]||""
: "";

let email="-";
let uid="-";

const em=
emailRow.match(
/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i
);

if(em){

email=
em[0];

}

const uidMatch=
secondRow.match(
/(\d{6,20})/
);

if(uidMatch){

uid=
uidMatch[1];

}

const validUID=
/\d{6,20}/
.test(secondRow);

const validLink=
/facebook\.com|fb\.com/i
.test(secondRow);

if(
isFacebook &&
!(
validUID||
validLink
)
){

toast(
`Data ke-${Math.floor(i/step)+1} tidak valid`
);

continue;

}

try{

await fetch(
"/api/setoran",
{
method:"POST",

headers:{
"Content-Type":
"application/json"
},

body:JSON.stringify({

email,

uid,

password,

tipe:nama,

harga:harga,

userEmail:
JSON.parse(
localStorage.getItem(
"user"
)
)?.email,

time:
Date.now()

})

}
);

}catch(err){

console.log(
err
);

}

saldo+=harga;

}

document
.getElementById(
"saldo"
)
.innerText=
saldo.toLocaleString(
"id-ID"
);

document
.getElementById(
"raw"
)
.value="";

renderHistory();

toast(
"Berhasil dikirim"
);

btn.disabled=false;

btn.style.opacity="1";

btnText.innerHTML=
"KIRIM";

}

async function renderHistory(){

await fetch(
"/api/setoran/sync"
);

const res=
await fetch(
"/api/setoran"
);

const json=
await res.json();

if(
!json.success
){
return;
}

const user=
JSON.parse(
localStorage.getItem(
"user"
)
);

dataHistory=
(json.data||[])
.filter(
x=>
x.EmailUser===
user?.email
);

const hasil=
document.getElementById(
"hasil"
);

hasil.innerHTML="";

document.getElementById(
"total"
).innerText=
"Total Akun : "+
dataHistory.length;

dataHistory.forEach(x=>{

const status=
String(
x.Status || "Pending"
)
.toLowerCase()
.trim();

let cls="pending";

if(status==="on"){
cls="on";
}
else if(
status==="off"
){
cls="off";
}
else if(
status==="tidak valid"
||
status==="invalid"
){
cls="invalid";
}

hasil.innerHTML+=`

<tr>

<td>${x.Email||"-"}</td>

<td>${x.UID||"-"}</td>

<td>${x.Password||"-"}</td>

<td>
<span class="badge ${cls}">
${x.Status||"Pending"}
</span>
</td>

<td>${x.Produk||"-"}</td>

</tr>

`;

});

}

function cari(keyword){

keyword=
keyword
.toLowerCase()
.trim();

const hasil=
document.getElementById(
"hasil"
);

hasil.innerHTML="";

const filter=
dataHistory.filter(x=>{

return (

String(
x.Email||""
)
.toLowerCase()
.includes(keyword)

||

String(
x.Password||""
)
.toLowerCase()
.includes(keyword)

||

String(
x.Status||"Pending"
)
.toLowerCase()
.includes(keyword)

||

String(
x.Produk||""
)
.toLowerCase()
.includes(keyword)

||

String(
x.Nama||""
)
.toLowerCase()
.includes(keyword)

);

});

filter.forEach(x=>{

const status=
String(
x.Status || "Pending"
)
.toLowerCase()
.trim();

let cls="pending";

if(status==="on"){
cls="on";
}
else if(status==="off"){
cls="off";
}
else if(
status==="tidak valid"
||
status==="invalid"
){
cls="invalid";
}

hasil.innerHTML+=`

<tr>

<td>${x.Email||"-"}</td>

<td>-</td>

<td>${x.Password||"-"}</td>

<td>
<span class="badge ${cls}">
${x.Status||"Pending"}
</span>
</td>

<td>${x.Produk||"-"}</td>

</tr>

`;

});

}

function nav(id,el){

localStorage.setItem(
"tabAktif",
id
);

document
.querySelectorAll(".page")
.forEach(x=>

x.classList.remove(
"activePage"
)

);

document
.getElementById(id)
.classList.add(
"activePage"
);

document
.querySelectorAll(
".menu"
)
.forEach(x=>

x.classList.remove(
"active"
)

);

el.classList.add(
"active"
);

}

async function saveRekening(){

const bank=
document.getElementById(
"bank"
).value;

const norek=
document.getElementById(
"norek"
).value;

const nama=
document.getElementById(
"namaRek"
).value;

if(
!bank||
!norek||
!nama
){

return toast(
"Lengkapi data"
);

}

const user=
JSON.parse(
localStorage.getItem(
"user"
)
);

const res=
await fetch(
"/api/rekening",
{
method:"POST",

headers:{
"Content-Type":
"application/json"
},

body:JSON.stringify({

bank,
norek,
nama,

userEmail:
user.email

})

}
);

const data=
await res.json();

if(
!data.success
){

return toast(
"Gagal simpan"
);

}

rekening={

bank,
norek,
nama

};

loadRekening();

}

async function loadRekening(){

const user=
JSON.parse(
localStorage.getItem(
"user"
)
);

if(!user)return;

const res=
await fetch(
"/api/rekening/"
+
user.email
);

const data=
await res.json();

rekening=
data.rekening;

if(!rekening)
return;

rekeningForm.style.display=
"none";

withdrawArea.style.display=
"block";

showBank.innerText=
rekening.bank;

showNorek.innerText=
rekening.norek;

showNama.innerText=
rekening.nama;

}

async function tarikSemua(){

if(saldo<=0){

return toast(
"Saldo kosong"
);

}

try{

const res=
await fetch(
"/api/withdraw",
{
method:"POST",

headers:{
"Content-Type":
"application/json"
},

body:JSON.stringify({

bank:
rekening.bank,

norek:
rekening.norek,

nama:
rekening.nama,

jumlah:
saldo,

userEmail:
JSON.parse(
localStorage.getItem(
"user"
)
)?.email

})

}
);

const hasil=
await res.json();
if(
!hasil.success
){

return toast(

hasil.message ||

"Gagal membuat withdrawal"

);

}

}catch(err){

console.log(err);

return toast(
"Gagal kirim server"
);

}

const tbody=
document.getElementById(
"withdrawHistory"
);

const kosong=
document.getElementById(
"emptyWithdraw"
);

if(kosong){

kosong.remove();

}

tbody.innerHTML+=`
<tr>

<td>
Rp ${saldo.toLocaleString("id-ID")}
</td>

<td>
Menunggu
</td>

</tr>
`;

saldo=0;

localStorage.setItem(
"saldo",
0
);

document
.getElementById(
"saldo"
)
.innerText="0";

document
.getElementById(
"nominal"
)
.value=
"Rp 0";

toast(
"Withdrawal dibuat"
);

}

function previewNomor(){

const raw=
document
.getElementById("raw")
.value
.trim();

const box=
document
.getElementById("previewRaw");

const tipe=
document
.getElementById(
"tipeSelect"
)
.value
.toLowerCase();

if(!raw){

box.style.display="none";
box.innerHTML="";
return;

}

box.style.display="block";

const rows=
raw
.split("\n")
.filter(
x=>x.trim()
);

let hasil="";

if(
tipe.includes("facebook")
){

for(
let i=0,no=1;
i<rows.length;
i+=2,no++
){

hasil+=
`${no}. ${rows[i]||""}
   ${rows[i+1]||""}
`;

}

}

else{

rows.forEach(
(x,i)=>{

hasil+=
`${i+1}. ${x}\n`;

});

}

box.innerText=
hasil;

}
function isiSemuaSaldo(){

document
.getElementById(
"nominal"
)
.value=
saldo;

}

async function kirimWithdraw(){

const nominal=
Number(
document
.getElementById(
"nominal"
)
.value
);

if(
!nominal||
nominal<=0
){

return toast(
"Nominal kosong"
);

}

if(
nominal < 50000
){

return toast(
"Minimal penarikan Rp50.000"
);

}

if(
nominal>saldo
){

return toast(
"Saldo tidak cukup"
);

}

try{

await fetch(
"/api/withdraw",
{
method:"POST",

headers:{
"Content-Type":
"application/json"
},

body:JSON.stringify({

bank:
rekening.bank,

norek:
rekening.norek,

nama:
rekening.nama,

jumlah:
nominal,

userEmail:
JSON.parse(
localStorage.getItem(
"user"
)
)?.email

})

}
);

}catch(err){

return toast(
"Gagal kirim"
);

}

const tbody=
document.getElementById(
"withdrawHistory"
);

document
.getElementById(
"emptyWithdraw"
)
?.remove();

loadWithdrawHistory();

saldo-=nominal;

document
.getElementById(
"saldo"
)
.innerText=
saldo.toLocaleString(
"id-ID"
);

let user=
JSON.parse(
localStorage.getItem(
"user"
)
)||{};

user.reward=saldo;

localStorage.setItem(
"user",
JSON.stringify(user)
);

loadUser();

document
.getElementById(
"nominal"
)
.value="";

toast(
"Withdrawal dibuat"
);

}

function tampilkanPopupPenuh(){
    document.getElementById(
        "popupPenuh"
    ).style.display="flex";
}

function tutupPopup(){

    popupPernahDitutup=true;

    document.getElementById(
        "popupPenuh"
    ).style.display="none";

}

async function cekStatusAkun(){

    try{

        const res=
        await fetch(
            "/api/status-akun"
        );

        const data=
        await res.json();

        const btn=
        document.getElementById(
            "kirimBtn"
        );

        const popup=
        document.getElementById(
            "popupPenuh"
        );

if(data.penuh){

    btn.disabled=true;

    btn.style.opacity=".5";

if(
    popup &&
    !popupPernahDitutup
){
    popup.style.display="flex";
}

            btn.onclick=()=>{

                if(popup){
                    popup.style.display="flex";
                }

                toast(
                    "Maaf akun sedang penuh, coba kembali beberapa saat lagi"
                );

            };

        }
		
else{

    btn.disabled=false;

    btn.style.opacity="1";

    btn.onclick=kirim;

    popupPernahDitutup=false;

    if(popup){
        popup.style.display="none";
    }

}

    }catch(err){

        console.log(err);

    }

}

function toast(text){

const el=
document.getElementById(
"toast"
);

el.innerText=text;

el.classList.add(
"show"
);

clearTimeout(
window.toastTimer
);

window.toastTimer=
setTimeout(()=>{

el.classList.remove(
"show"
);

},2500);

}

async function loadWithdrawHistory(){

try{

const user=
JSON.parse(
localStorage.getItem("user")
);

const res=
await fetch(
"/api/withdraw"
);

const json=
await res.json();

if(!json.success)return;

const tbody=
document.getElementById(
"withdrawHistory"
);

tbody.innerHTML="";

const data=
(json.data||[])
.filter(
x=>
x.EmailUser===
user?.email
);

if(!data.length){

tbody.innerHTML=`

<tr id="emptyWithdraw">

<td colspan="2"
style="
text-align:center;
padding:20px;
color:#999">

Belum ada riwayat penarikan

</td>

</tr>
`;

return;

}

data.forEach(x=>{

let cls="pending";

const status=
String(
x.Status||"Pending"
)
.toLowerCase();

if(
status==="berhasil"
){
cls="on";
}

else if(
status==="ditolak"
){
cls="off";
}

tbody.innerHTML+=`

<tr>

<td>

<div style="
font-weight:700">
Rp ${Number(
x.Jumlah||0
).toLocaleString("id-ID")}
</div>

<div style="
font-size:11px;
color:#999;
margin-top:4px">
${x.Waktu || "-"}
</div>

</td>

<td>

<span class="badge ${cls}">
${x.Status}
</span>

</td>

</tr>

`;

});

}catch(err){

console.log(err);

}

}