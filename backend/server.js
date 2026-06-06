require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const axios = require("axios");

function generateSignature(body, apiKey, va) {
  const jsonBody = JSON.stringify(body);
  const bodyHash = crypto
    .createHash("sha256")
    .update(jsonBody)
    .digest("hex");
  const stringToSign = `POST:${va}:${bodyHash}:${apiKey}`;

  return crypto
    .createHmac("sha256", apiKey)
    .update(stringToSign)
    .digest("hex");
}

function getOtpHistory(){

    try{

        return JSON.parse(
            fs.readFileSync(
                "./database/otp-history.json",
                "utf8"
            )
        );

    }catch{

        return [];

    }

}

function saveOtpHistory(data){

    fs.writeFileSync(
        "./database/otp-history.json",
        JSON.stringify(data,null,2)
    );

}

const EMAIL_HISTORY_FILE =
path.join(
__dirname,
"database",
"otp-email.json"
);

function getEmailHistory(){

try{

if(!fs.existsSync(
EMAIL_HISTORY_FILE
)){
return [];
}

return JSON.parse(
fs.readFileSync(
EMAIL_HISTORY_FILE,
"utf8"
)
);

}catch{

return [];

}

}

function saveEmailHistory(data){

fs.writeFileSync(
EMAIL_HISTORY_FILE,
JSON.stringify(
data,
null,
2
)
);

}

const multer = require("multer");
const FormData = require("form-data");
const { google } = require("googleapis");

function normalizeEmail(email = "") {
  email = email.toLowerCase().replace(/"/g, "").trim();

  const match = email.match(/<(.+)>/);
  return match ? match[1].trim() : email;
}

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },

  // UBAH INI
  transports: ["websocket", "polling"],

  pingTimeout: 120000,
  pingInterval: 25000,
  connectTimeout: 60000,

  allowEIO3: true,

  connectionStateRecovery: {
    maxDisconnectionDuration: 120000,
    skipMiddlewares: true
  }
});

const PORT = process.env.PORT || 3000;
const IPAYMU_API_KEY = process.env.IPAYMU_API_KEY;
const IPAYMU_VA = process.env.IPAYMU_VA;
const IPAYMU_URL = "https://my.ipaymu.com/api/v2/payment/direct";
const SECRET = process.env.JWT_SECRET || "fallback_secret_change_me";
let akunPenuh=false;
console.log("API KEY:", IPAYMU_API_KEY);
console.log("VA:", IPAYMU_VA);

app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBodyBuffer = buf;
    }
  })
);

require("./api-shopee-monitor")(app);

const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URI
);
const gmailPath = path.join(__dirname, "data/gmail.xlsx");
const gmailBekasPath = path.join(__dirname, "data/gmail bekas.xlsx");
const gaslurPath = path.join(__dirname, "data/gaslur.xlsx");
const fbPath = path.join(__dirname, "data/fb.xlsx");
const refundPath = path.join(__dirname, "data/refund.xlsx");
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});
const upload = multer({ storage });
app.use("/uploads", express.static("uploads"));

app.use("/admin", express.static("C:/serapay/admin"));
const dbPath = path.join(__dirname, "data/pelanggan.json");
const catatanPath =
path.join(
  __dirname,
  "data/catatan.json"
);

function getCatatan(){

  try{

    if(!fs.existsSync(catatanPath)){

      fs.writeFileSync(
        catatanPath,
        "[]"
      );

      return [];
    }

    const raw =
    fs.readFileSync(
      catatanPath,
      "utf8"
    );

    if(!raw.trim()){
      return [];
    }

    return JSON.parse(raw);

  }catch(err){

    console.log(
      "CATATAN ERROR:",
      err.message
    );

    return [];
  }

}


function saveCatatan(data){

  fs.writeFileSync(
    catatanPath,
    JSON.stringify(
      data,
      null,
      2
    )
  );
}
const aiPath=
path.join(
__dirname,
"data/autoresponder.json"
);

function getAI(){

if(
!fs.existsSync(aiPath)
){

fs.writeFileSync(
aiPath,
"[]"
);

return [];

}

return JSON.parse(
fs.readFileSync(
aiPath,
"utf8"
)
);

}

function saveAI(data){

fs.writeFileSync(
aiPath,
JSON.stringify(
data,
null,
2
)
);

}
function getUsers() {
  if (!fs.existsSync(dbPath)) return [];
  return JSON.parse(fs.readFileSync(dbPath));
}

function saveUsers(data) {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

function saveRefundToExcel(dataRefund) {
  let existingData = [];
  if (fs.existsSync(refundPath)) {
    const wb = XLSX.readFile(refundPath);
    const sheet = wb.Sheets[wb.SheetNames[0]];
    existingData = XLSX.utils.sheet_to_json(sheet);
  }
  existingData.push(dataRefund);
  const newSheet = XLSX.utils.json_to_sheet(existingData);
  const newWb = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    newWb,
    newSheet,
    "Refund"
  );

  XLSX.writeFile(newWb, refundPath);
}

function authMiddleware(req, res, next) {
  const token = req.headers.authorization;

  if (!token) return res.status(401).json({ success: false });

  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch {
    return res.status(401).json({ success: false });
  }
}

const publicPath = path.join(__dirname, "../public");

app.use((req, res, next) => {
  if (req.path.endsWith(".html")) {
    const cleanUrl = req.path.replace(/\.html$/, "");
    return res.redirect(301, cleanUrl);
  }
  next();
});

app.use(express.static(publicPath, {
  extensions: ["html"]
}));

const setoranDir = path.join(
  __dirname,
  "../public/setoran"
);

if(!fs.existsSync(setoranDir)){

  fs.mkdirSync(
    setoranDir,
    { recursive:true }
  );

}

const setoranPath = path.join(
  setoranDir,
  "data-setoran.json"
);

const wdPath = path.join(
  setoranDir,
  "data-wd.json"
);

function bacaJson(file){

try{

if(
!fs.existsSync(file)
){

fs.writeFileSync(
file,
"[]",
"utf8"
);

return [];

}

const raw=
fs.readFileSync(
file,
"utf8"
);

if(
!raw.trim()
){

return [];

}

return JSON.parse(raw);

}catch(err){

console.log(
"JSON ERROR:",
err.message
);

return [];

}

}

function simpanJson(
file,
data
){

try{

fs.writeFileSync(
file,
JSON.stringify(
data,
null,
2
)
);

}catch(err){

console.log(
"SAVE ERROR:",
err.message
);

}

}

app.post(
"/api/setoran",
async(req,res)=>{

try{

const tipe=
String(
req.body.tipe||""
)
.toLowerCase()
.trim();

let fileName="";

if(
tipe==="facebook fresh"
){

fileName=
"setoran-facebook-fresh.xlsx";

}
else if(
tipe==="gmail fresh"
){

fileName=
"setoran-gmail-fresh.xlsx";

}
else if(
tipe==="gmail bekas"
){

fileName=
"setoran-gmail-bekas.xlsx";

}
else{

return res.json({
success:false,
message:"tipe tidak dikenal"
});

}

const excelPath=
path.join(
setoranDir,
fileName
);

let data=[];
if(
fs.existsSync(
excelPath
)
){

const wb=
XLSX.readFile(
excelPath
);

const sheet=
wb.Sheets[
wb.SheetNames[0]
];

data=
XLSX.utils.sheet_to_json(
sheet
);

}

const users=
getUsers();

const user=
users.find(
u=>
u.email===
req.body.userEmail
);

const row={

ID:
Date.now(),

Nama:
user?.name || "-",

Email:
req.body.email || "-",

Password:
req.body.password || "-",

Status:"",

EmailUser:
req.body.userEmail || "",

Harga:
Number(
req.body.harga||0
),

Waktu:
new Date()
.toLocaleString(
"id-ID"
)

};

if(
tipe==="facebook fresh"
){

row.UID=
req.body.uid || "-";

data.unshift({

Email:
row.Email,

UID:
row.UID,

Password:
row.Password,

Status:
row.Status,

Produk:
"Facebook Fresh",

ID:
row.ID,

Nama:
row.Nama,

EmailUser:
row.EmailUser,

Harga:
row.Harga,

Waktu:
row.Waktu

});

}

else{

data.unshift({

Email:
row.Email,

Password:
row.Password,

Status:
row.Status,

Produk:
req.body.tipe || "-",

ID:
row.ID,

Nama:
row.Nama,

EmailUser:
row.EmailUser,

Harga:
row.Harga,

Waktu:
row.Waktu

});

}

const wb=
XLSX.utils.book_new();

const sheet=
XLSX.utils.json_to_sheet(
data
);

XLSX.utils.book_append_sheet(
wb,
sheet,
"Setoran"
);

XLSX.writeFile(
wb,
excelPath
);

await kirimSetoranTelegram(
row,
req.body.tipe
);

return res.json({
success:true
});

}catch(err){

console.log(
"SETOR:",
err
);

return res.json({
success:false,
message:
err.message
});

}

});


app.get(
"/api/setoran/sync",
(req,res)=>{

try{

const files=[

"setoran-facebook-fresh.xlsx",

"setoran-gmail-fresh.xlsx",

"setoran-gmail-bekas.xlsx"

];

let users=
getUsers();

files.forEach(file=>{

const excelPath=
path.join(
setoranDir,
file
);

if(
!fs.existsSync(
excelPath
)
)return;

const wb=
XLSX.readFile(
excelPath
);

const sheet=
wb.Sheets[
wb.SheetNames[0]
];

let data=
XLSX.utils.sheet_to_json(
sheet
);

let berubah=false;

data.forEach(item=>{

const status=
String(
item.Status||""
)
.toLowerCase()
.trim();

if(
status!=="on"
)return;

if(
item.sudahDiproses
)return;

const user=
users.find(
u=>
u.email===
item.EmailUser
);

if(!user)
return;

user.reward=
Number(
user.reward||0
)+
Number(
item.Harga||0
);

item.sudahDiproses=true;

berubah=true;

});

if(berubah){

const newSheet=
XLSX.utils.json_to_sheet(
data
);

wb.Sheets[
wb.SheetNames[0]
]=newSheet;

XLSX.writeFile(
wb,
excelPath
);

}

});

saveUsers(
users
);

res.json({
success:true
});

}catch(err){

console.log(
"SYNC:",
err
);

res.json({
success:false
});

}

});

app.get(
"/api/setoran",
(req,res)=>{

try{

const files=[

"setoran-facebook-fresh.xlsx",

"setoran-gmail-fresh.xlsx",

"setoran-gmail-bekas.xlsx"

];

let semua=[];

files.forEach(file=>{

const excelPath=
path.join(
setoranDir,
file
);

if(
!fs.existsSync(
excelPath
)
){
return;
}

const wb=
XLSX.readFile(
excelPath
);

const sheet=
wb.Sheets[
wb.SheetNames[0]
];

const data=
XLSX.utils.sheet_to_json(
sheet
);

semua.push(
...data
);

});

semua.sort(
(a,b)=>
Number(
b.ID||0
)-
Number(
a.ID||0
)
);

return res.json({

success:true,

data:semua

});

}catch(err){

console.log(
"GET SETOR:",
err
);

return res.json({

success:false,

data:[]

});

}

});

app.post(
"/api/withdraw",
(req,res)=>{

try{

console.log(
"WITHDRAW:",
req.body
);

const users=
getUsers();

const user=
users.find(
u=>
u.email===
req.body.userEmail
);

if(!user){

return res.json({
success:false,
message:"User tidak ditemukan"
});

}

const jumlah=
Number(
req.body.jumlah||0
);

if(
jumlah < 50000
){

return res.json({
success:false,
message:
"Minimal penarikan Rp50.000"
});

}

if(
jumlah<=0
){

return res.json({
success:false,
message:"Nominal tidak valid"
});

}

if(
Number(user.reward||0)
<
jumlah
){

return res.json({
success:false,
message:"Saldo tidak cukup"
});

}

let data=
bacaJson(wdPath);

const wdTerakhir=
data.find(
x=>
x.EmailUser===
req.body.userEmail
);

if(wdTerakhir){

const sekarang=
new Date();

const terakhir=
new Date(
wdTerakhir.Waktu
);

const hariSekarang=
sekarang.toDateString();
const hariTerakhir=
terakhir.toDateString();
if(
hariSekarang===
hariTerakhir
){

return res.json({
success:false,
message:
"Anda hanya bisa menarik saldo 1x sehari, coba lagi setelah jam 00:00"
});
}
}

user.reward=
Number(
user.reward||0
)
-
jumlah;

saveUsers(
users
);

data.unshift({

ID:
Date.now(),

Nama:
user?.name || "-",

EmailUser:
req.body.userEmail || "-",

Bank:
req.body.bank || "-",

NomorRekening:
req.body.norek || "-",

NamaRekening:
req.body.nama || "-",

Jumlah:
jumlah,

Status:
"Pending",

Waktu:
new Date()
.toLocaleString(
"id-ID"
)

});

simpanJson(
wdPath,
data
);

kirimWithdrawTelegram(
data[0]
);

const excelPath=
path.join(
setoranDir,
"withdraw.xlsx"
);

const wb=
XLSX.utils.book_new();
const sheet=
XLSX.utils.json_to_sheet(
data
);
XLSX.utils.book_append_sheet(
wb,
sheet,
"Withdraw"
);
XLSX.writeFile(
wb,
excelPath
);
return res.json({
success:true
});

}catch(err){
console.log(
"WITHDRAW ERROR:",
err
);

return res.json({
success:false
});
}
});

app.post(
"/api/rekening",
(req,res)=>{
const users=
getUsers();
const user=
users.find(
u=>
u.email===
req.body.userEmail
);

if(!user){
return res.json({
success:false
});
}
user.rekening={
bank:req.body.bank,
norek:req.body.norek,
nama:req.body.nama
};
saveUsers(users);
res.json({
success:true
});
});

app.get(
"/api/rekening/:email",
(req,res)=>{
const users=
getUsers();
const user=
users.find(
u=>
u.email===
req.params.email
);
res.json({
success:true,
rekening:
user?.rekening||null
});
});

app.get(
"/api/status-akun",
(req,res)=>{
res.json({
success:true,
penuh:
akunPenuh
});
});

app.get(
"/api/withdraw",
(req,res)=>{
try{
const data=
bacaJson(
wdPath
);
return res.json({
success:true,
data
});

}catch{
return res.json({
success:false,
data:[]
});
}
});

app.get("/", (req, res) => {
  res.redirect("/login");
});

app.get("/auth/google", (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: ["https://www.googleapis.com/auth/gmail.readonly"]
  });

  res.redirect(url);
});

app.get("/oauth2callback", async (req, res) => {
  try {
    const code = req.query.code;

    const { tokens } = await oauth2Client.getToken(code);
oauth2Client.setCredentials(tokens);
fs.writeFileSync("token.json", JSON.stringify(tokens, null, 2));

    res.send("✅ Gmail berhasil dihubungkan!");
  } catch (err) {
    console.log(err);
    res.send("❌ Gagal login Google");
  }
});

const locks = new Set();
app.get("/api/produk", (req, res) => {
  try {
    const gmailWb = XLSX.readFile(gmailPath);
    const gaslurWb = XLSX.readFile(gaslurPath);
	const fbWb = XLSX.readFile(fbPath);
    const gmailData = XLSX.utils.sheet_to_json(gmailWb.Sheets[gmailWb.SheetNames[0]]);
	const gmailBekasWb = XLSX.readFile(gmailBekasPath);
const gmailBekasData = XLSX.utils.sheet_to_json(
  gmailBekasWb.Sheets[gmailBekasWb.SheetNames[0]]
);
const gmailBekasStok = gmailBekasData.filter(
  d => (d.statusGmail || "").toLowerCase() !== "terjual"
).length;
    const gaslurData = XLSX.utils.sheet_to_json(gaslurWb.Sheets[gaslurWb.SheetNames[0]]);
	const fbData = XLSX.utils.sheet_to_json(fbWb.Sheets[fbWb.SheetNames[0]]);
    const gmailStok = gmailData.filter(
      d => (d.statusGmail || "").toLowerCase() !== "terjual"
    ).length;

    const backupStok = gaslurData.filter(
      d => (d.Status || "").toLowerCase() !== "terjual"
    ).length;
	
	const fbStok = fbData.filter(
  d => (d.statusEmail || "").toLowerCase() !== "terjual"
).length;

    res.json({
      produk: [
        {
          nama: "gmail fresh",
          harga: 4500,
          stok: gmailStok
        },
		{
  nama: "gmail bekas",
  harga: 1500,
  stok: gmailBekasStok
},
        {
          nama: "email custom",
          harga: 1000,
          stok: backupStok
        },
{
  nama: "facebook fresh",
  harga: 3300,
  stok: fbStok
},
      ]
    });

  } catch (err) {
    console.log(err);
    res.json({ produk: [] });
  }
});

app.post("/api/order", authMiddleware, async (req, res) => {
  const userKey = req.user.email;

  if (locks.has(userKey)) {
    return res.json({
      success: false,
      message: "Masih memproses order sebelumnya"
    });
  }

  locks.add(userKey);

  try {
    const { produk, jumlah } = req.body;
    const qty = Number(jumlah);

    if (!produk || !qty || qty <= 0) {
      throw new Error("Data tidak lengkap atau jumlah tidak valid");
    }

    const users = getUsers();
    const userIndex = users.findIndex(u => u.email === userKey);
    if (userIndex === -1) throw new Error("User tidak ditemukan");
const produkKey = produk.toLowerCase().trim();
const hargaList = {
  "gmail": 4500,
  "gmail fresh": 4500,

  "gmail bekas": 1500,

  "email custom": 1000,
  "email pengganti": 1000,
  "backup": 1000,

  "facebook": 3300,
  "facebook fresh": 3300,
};

if (hargaList[produkKey] === undefined) {
  throw new Error("Produk " + produkKey + " tidak tersedia di daftar harga");
}

const totalHarga = hargaList[produkKey] * qty;

    if (users[userIndex].saldo < totalHarga) {
      throw new Error("Saldo tidak cukup");
    }

let hasil = [];

let wbG, wbGB, wbB, wbF;
let sheetG, sheetGB, sheetB, sheetF;

let gmailData = [];
let gmailBekasData = [];
let backupData = [];
let fbData = [];
if (
  produk === "gmail" ||
  produk === "gmail fresh"
) {

  wbG = XLSX.readFile(gmailPath);

  sheetG =
    wbG.Sheets[wbG.SheetNames[0]];

  gmailData =
    XLSX.utils.sheet_to_json(sheetG);

}

if (produk === "gmail bekas") {

  wbGB = XLSX.readFile(gmailBekasPath);

  sheetGB =
    wbGB.Sheets[wbGB.SheetNames[0]];

  gmailBekasData =
    XLSX.utils.sheet_to_json(sheetGB);

}

if (
  produk === "facebook" ||
  produk === "facebook fresh"
) {

  wbF = XLSX.readFile(fbPath);

  sheetF =
    wbF.Sheets[wbF.SheetNames[0]];

  fbData =
    XLSX.utils.sheet_to_json(sheetF);

  fbData = fbData.map(row => {

    const newRow = {};

    Object.keys(row).forEach(key => {
      newRow[key.trim()] = row[key];
    });

    return newRow;

  });

}

if (
  produk === "backup" ||
  produk === "email pengganti" ||
  produk === "email custom"
) {

  wbB = XLSX.readFile(gaslurPath);

  sheetB =
    wbB.Sheets[wbB.SheetNames[0]];

  backupData =
    XLSX.utils.sheet_to_json(sheetB);

}

if (
  produk === "gmail" ||
  produk === "gmail fresh"
) {

  let gmailBekasWorkbook;
  let gmailBekasSheet;
  let gmailBekasIsi = [];

  if (fs.existsSync(gmailBekasPath)) {

    gmailBekasWorkbook =
      XLSX.readFile(gmailBekasPath);

    gmailBekasSheet =
      gmailBekasWorkbook.Sheets[
        gmailBekasWorkbook.SheetNames[0]
      ];

    gmailBekasIsi =
      XLSX.utils.sheet_to_json(
        gmailBekasSheet
      );

  }

  const tersedia = gmailData.filter(
    d =>
      (d.statusGmail || "")
      .toLowerCase() !== "terjual"
  );

  if (tersedia.length < qty) {
    throw new Error(
      "Stok Gmail tidak cukup"
    );
  }

  for (let i = 0; i < qty; i++) {

    const item = tersedia[i];

    item.statusGmail = "terjual";

gmailBekasIsi.push({
  Gmail: item.Gmail,
  Password: item.Password,
  statusGmail: "terjual"
});

    hasil.push({
      email: item.Gmail,
      pass: item.Password
    });

  }

  const newBekasSheet =
    XLSX.utils.json_to_sheet(
      gmailBekasIsi
    );

  gmailBekasWorkbook.Sheets[
    gmailBekasWorkbook.SheetNames[0]
  ] = newBekasSheet;

  XLSX.writeFile(
    gmailBekasWorkbook,
    gmailBekasPath
  );

}

else if (produk === "gmail bekas") {

  const tersedia =
    gmailBekasData.filter(
      d =>
        (d.statusGmail || "")
        .toLowerCase() !== "terjual"
    );

  if (tersedia.length < qty) {

    throw new Error(
      "Stok Gmail Bekas tidak cukup"
    );

  }

  for (let i = 0; i < qty; i++) {

    const item = tersedia[i];

    item.statusGmail = "terjual";

    hasil.push({
      email: item.Gmail,
      pass: item.Password
    });

  }

}

else if (
  produk === "backup" ||
  produk === "email pengganti" ||
  produk === "email custom"
) {

  const tersedia =
    backupData.filter(
      d =>
        (d.Status || "")
        .toLowerCase() !== "terjual"
    );

  if (tersedia.length < qty) {

    throw new Error(
      "Stok Backup tidak cukup"
    );

  }

  for (let i = 0; i < qty; i++) {

    const item = tersedia[i];

    item.Status = "terjual";

    hasil.push({
      email:
        item["Email Pengganti"],
      pass: "-",
      backup: []
    });

  }

}

else if (
  produk === "facebook" ||
  produk === "facebook fresh"
) {

  const tersedia = fbData.filter(
    d =>
      (d.statusEmail || "")
      .toLowerCase() !== "terjual"
  );

  if (tersedia.length < qty) {

    throw new Error(
      "Stok Facebook tidak cukup"
    );

  }

  for (let i = 0; i < qty; i++) {

    const item = tersedia[i];

    item.statusEmail = "terjual";

    hasil.push({
      email:
        (
          item.Email ||
          item["Email "] ||
          ""
        ).trim(),

      pass:
        (
          item.Password ||
          item["Password "] ||
          ""
        ).trim()
    });

  }

}

if (wbG) {

  const newSheetG =
    XLSX.utils.json_to_sheet(
      gmailData
    );

  wbG.Sheets[
    wbG.SheetNames[0]
  ] = newSheetG;

  XLSX.writeFile(
    wbG,
    gmailPath
  );

}

if (wbGB) {

  const newSheetGB =
    XLSX.utils.json_to_sheet(
      gmailBekasData
    );

  wbGB.Sheets[
    wbGB.SheetNames[0]
  ] = newSheetGB;

  XLSX.writeFile(
    wbGB,
    gmailBekasPath
  );

}

if (wbB) {

  const newSheetB =
    XLSX.utils.json_to_sheet(
      backupData
    );

  wbB.Sheets[
    wbB.SheetNames[0]
  ] = newSheetB;

  XLSX.writeFile(
    wbB,
    gaslurPath
  );

}

if (wbF) {

  const newSheetF =
    XLSX.utils.json_to_sheet(
      fbData
    );

  wbF.Sheets[
    wbF.SheetNames[0]
  ] = newSheetF;

  XLSX.writeFile(
    wbF,
    fbPath
  );

}

    if (isNaN(totalHarga)) {
  throw new Error("Total harga tidak valid (produk salah)");
}

users[userIndex].saldo -= totalHarga;

if (!users[userIndex].history) {
  users[userIndex].history = [];
}

const batchId = crypto.randomUUID();
let createdOrders = [];

hasil.forEach(item => {
  const orderId = crypto.randomUUID();

  const newOrder = {
    id: orderId,
	batchId,
    type: produk,
    qty: 1,
    data: [item], 
    status: "active",
    time: Date.now()
  };

  users[userIndex].history.push(newOrder);
  createdOrders.push(newOrder);
});

saveUsers(users);

io.to(userKey).emit("orderUpdate", {
  type: "new_order"
});

return res.json({
  success: true,
  saldo: users[userIndex].saldo,
  orders: createdOrders
});

  } catch (error) {
    return res.json({
      success: false,
      message: error.message || "Terjadi kesalahan sistem"
    });
  } finally {
    locks.delete(userKey);
  }
});

app.post("/api/order/get", authMiddleware, async (req, res) => {
  try {
    const { orderId } = req.body;

    const users = getUsers();
    const user = users.find(u => u.email === req.user.email);

    if (!user) {
      return res.json({ success: false });
    }

    const order = (user.history || []).find(
      o => String(o.id) === String(orderId)
    );

    if (!order) {
      return res.json({
        success: false,
        message: "Order tidak ditemukan"
      });
    }

    await checkOrderById(req.user.email, orderId);

    res.json({ success: true });

  } catch (err) {
    res.json({
      success: false,
      message: err.message
    });
  }
});

app.post(
"/api/autoresponder/order",
authMiddleware,
(req,res)=>{

try{

let data=
getAI();

const qty=
Number(
req.body.qty
);

const hari=
Number(
req.body.expired
);

const hargaMap={

3:5000,
7:10000,
30:25000,
365:200000

};

const total=
(
hargaMap[hari]||0
)
*
qty;

const link=
req.body.shortlink;

const users=
getUsers();

const user=
users.find(
u=>
u.email===
req.user.email
);

if(
user.saldo<
total
){

return res.json({

success:false,
message:
"Saldo tidak cukup"

});

}

if(
req.body.metode!=="qris"
){

user.saldo-=
total;

saveUsers(
users
);

}

saveUsers(
users
);

for(
let i=0;
i<qty;
i++
){

data.push({

user:
req.user.email,

id:
"AI"+
Date.now()+i,

url:
"https://gaslur.site/api",

username:
"serapay.id"+
Math.floor(
Math.random()*99999
),

password:
"serapay.id_"+
Math.floor(
Math.random()*999999
),

apikey:
"serapay-"+
Math.floor(
Math.random()*999999
),

status:
"belum digunakan",

shortlink:
link,

expiredAt:
Date.now()+
(
(req.body.expired||30)
*
24*
60*
60*
1000
)

});

}

saveAI(data);

res.json({
success:true
});

}catch(err){

console.log(err);

res.json({
success:false
});

}

});

app.get(
"/api/autoresponder",
authMiddleware,
(req,res)=>{

let data=
getAI();

data=
data.filter(
x=>
x.user===
req.user.email
);

res.json({

success:true,

data

});

});

app.post(
"/api/autoresponder/extend",
authMiddleware,
(req,res)=>{

try{

const users=
getUsers();

const user=
users.find(
u=>
u.email===
req.user.email
);

if(!user){

return res.json({
success:false
});

}

let data=
getAI();

const item=
data.find(
x=>
x.id===
req.body.id
&&
x.user===
req.user.email
);

if(!item){

return res.json({

success:false,
message:
"Lisensi tidak ditemukan"

});

}

const hari=
Number(
req.body.hari
);

const hargaMap={

3:5000,
7:10000,
30:25000,
365:200000

};

const harga=
hargaMap[hari];

if(
req.body.metode!=="qris"
){

if(
user.saldo<
harga
){

return res.json({

success:false,

message:
"Saldo tidak cukup"

});

}

user.saldo-=harga;

saveUsers(
users
);

}

const sekarang=
Date.now();

if(
item.expiredAt<
sekarang
){

item.expiredAt=
sekarang+
(
hari*
86400000
);

}else{

item.expiredAt+=
(
hari*
86400000
);

}

saveAI(
data
);

return res.json({
success:true
});

}catch(err){

res.json({
success:false
});

}

});

let session={};

if(fs.existsSync("session.json")){

session=
JSON.parse(
fs.readFileSync(
"session.json")
);

}

function saveSession(){

fs.writeFileSync(
"session.json",
JSON.stringify(
session,
null,
2
));

}

app.post(
"/api",
async(req,res)=>{
	
	console.log(
JSON.stringify(
req.body,
null,
2
));

let data=getAI();

/* ambil Basic Auth dari AutoResponder */

const authHeader=
req.headers.authorization||"";

let username="";
let password="";

if(
authHeader.startsWith(
"Basic "
)
){

const decoded=
Buffer.from(

authHeader.replace(
"Basic ",
""
),

"base64"

).toString();

[username,password]=
decoded.split(":");

}

/* fallback jika dikirim body */

username=
username ||
req.body.username ||
"";

password=
password ||
req.body.password ||
"";

/* cek lisensi */

const lisensi=
data.find(
x=>

x.username===username

&&

x.password===password

&&

x.apikey===
req.headers[
"x-api-key"
]

);

if(!lisensi){

return res.json({

replies:[
{
message:
"Lisensi tidak valid"
}
]

});

}

if(
lisensi.status!==
"sudah digunakan"
){

lisensi.status=
"sudah digunakan";

saveAI(data);

}

/* PESAN DARI AUTORESPONDER */

const sender=
req.body.query?.sender||"User";

const pesan=
req.body.query?.message||"";

const userId=
req.body.query?.sender_id
||
sender;

if(!session[userId]){

session[userId]={

count:0,

linkSent:false,

asked:false

};

}

session[userId].count++;

saveSession();

/* SHORTLINK */

const link=
lisensi.shortlink||"";

try{

const state=
session[userId];

const prompt=`

Detect ONLY the language from Message.

Reply ONLY in that language.

Rules:

- Never mix languages
- Never translate
- Max 2 short sentences
- Casual human chat
- Never formal
- Never mention AI

Character:

You are Rina,
35 years old woman.

Warm and friendly.

Sender:
${sender}

Message:
${pesan}

Extra instruction:

${
state.count<3

?

"Only normal conversation. No invite. No profile."

:

state.count===3
&&
!state.linkSent

?

"If conversation feels natural show curiosity."

:

"Continue naturally."

}

`;

const hasil =
await axios.post(
"http://127.0.0.1:11434/api/generate",
{
model:"qwen2.5:3b",
prompt,
stream:false,
keep_alive:"30m"
}
);

/* FORMAT BALAS */

let balasan=
hasil.data.response.trim();

const lihat=
/udah|sudah|lihat|buka|cek/i
.test(pesan);

if(lihat){

balasan=
"hehe gimana, cocok nggak sama yang kamu bayangin? 😄";

}

else if(

state.count>=3

&&

!state.linkSent

&&

link

){

const promoPrompt=`

Message:
${pesan}

Reply ONLY in sender language.

Create ONE short natural sentence.

Examples:
Indonesia:
"kalau penasaran sama aku 😄"

English:
"if you're curious about me 😄"

Arabic:
"إذا حاب تعرفني أكثر 😄"

No quotes.
`;

const promo=
await axios.post(
"http://127.0.0.1:11434/api/generate",
{
model:"qwen2.5:3b",
prompt:promoPrompt,
stream:false
}
);

balasan+=
"\n\n"+
promo.data.response.trim()+
"\n"+
link;

state.linkSent=true;

saveSession();

}

else if(

state.linkSent

&&

!state.asked

){

const askPrompt=`

Message:
${pesan}

Reply ONLY in sender language.

Create ONE short sentence asking:

"have you seen my profile yet?"

No quotes.
`;

const ask=
await axios.post(
"http://127.0.0.1:11434/api/generate",
{
model:"qwen2.5:3b",
prompt:askPrompt,
stream:false
}
);

balasan+=
"\n\n"+
ask.data.response.trim();

state.asked=true;

saveSession();

}

/* BALAS KE AUTORESPONDER */

return res.json({

replies:[

{
message: balasan
}

]

});

}catch(err){

console.log(err);

return res.json({

replies:[

{
message:
"AI sedang sibuk"
}

]

});

}

});

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  let users = getUsers();
  const user = users.find(u => u.email === email);

  if (!user) {
    return res.json({ success: false, message: "User tidak ditemukan" });
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    return res.json({ success: false, message: "Password salah" });
  }

  const token = jwt.sign({
  id: user.id,
  email: user.email
}, SECRET, { expiresIn: "1d" });

  res.json({
    success: true,
    token,
    user: {
      name: user.name,
      email: user.email,
      phone: user.phone,
      saldo: user.saldo
    }
  });
});

app.post("/api/register", async (req, res) => {
  const { name, email, phone, password } = req.body;

  if (!name || !email || !phone || !password) {
    return res.json({ success: false, message: "Data tidak lengkap" });
  }

  let users = getUsers();

  const cleanEmail = email.toLowerCase().trim();
  const cleanPhone = phone.trim();
  const emailExist = users.find(u => u.email === cleanEmail);
  if (emailExist) {
    return res.json({
      success: false,
      message: "Email sudah digunakan"
    });
  }

  const phoneExist = users.find(u => u.phone === cleanPhone);
  if (phoneExist) {
    return res.json({
      success: false,
      message: "Nomor HP sudah digunakan"
    });
  }

  const hash = await bcrypt.hash(password, 10);

users.push({

id:Date.now(),
name,
email:cleanEmail,
phone:cleanPhone,
password:hash,

saldo:0,

reward:0,

history:[]

});

  saveUsers(users);

  return res.json({
    success: true,
    message: "Registrasi berhasil"
  });
});

app.post("/api/lupa/check", (req, res) => {
  const { email } = req.body;
  let users = getUsers();

  const user = users.find(u => u.email === email);
  if (!user) {
    return res.json({ success: false });
  }

  res.json({ success: true });
});

app.post("/api/lupa/reset", async (req, res) => {
  const { email, password } = req.body;
  let users = getUsers();

  const index = users.findIndex(u => u.email === email);
  if (index === -1) {
    return res.json({ success: false });
  }

  const hash = await bcrypt.hash(password, 10);
  users[index].password = hash;

  saveUsers(users);

  res.json({ success: true });
});

app.get(
"/api/catatan",
authMiddleware,
(req,res)=>{

  const data =
  getCatatan();

  const userData =
  data.find(
    x=>x.email===req.user.email
  );

  res.json({

    success:true,

    notes:
    userData?.notes || {}

  });

});

app.post(
"/api/catatan",
authMiddleware,
(req,res)=>{

  const data =
  getCatatan();

  let userData =
  data.find(
    x=>x.email===req.user.email
  );

  if(!userData){

    userData={
      email:req.user.email,
      notes:{}
    };

    data.push(userData);
  }

  userData.notes =
  req.body.notes || {};

  saveCatatan(data);

  res.json({
    success:true
  });

});

app.post(
"/api/share-note",
authMiddleware,
(req,res)=>{

    const users =
    getUsers();

    const user =
    users.find(
        x=>x.email===req.user.email
    );

    if(!user){

        return res.json({
            success:false
        });

    }

    const noteName =
    req.body.noteName;

    const slug =
    noteName
    .toLowerCase()
    .replace(/\s+/g,"-");

const url =
`https://gaslur.site/catatan/${user.id}/${slug}`;

    res.json({
        success:true,
        url
    });

});

app.get("/catatan/:userid/:slug",(req,res)=>{

    const data =
    getCatatan();

    const users =
    getUsers();

    const user =
    users.find(
        x=>
        String(x.id)===
        String(req.params.userid)
    );

    if(!user){

        return res.send(
            "Catatan tidak ditemukan"
        );

    }

    const catatanUser =
    data.find(
        x=>x.email===user.email
    );

    if(!catatanUser){

        return res.send(
            "Catatan tidak ditemukan"
        );

    }

    const note =
    Object.keys(
        catatanUser.notes||{}
    ).find(name=>{

        const slug =
        name
        .toLowerCase()
        .replace(/\s+/g,"-");

        return slug===
        req.params.slug;

    });

    if(!note){

        return res.send(
            "Catatan tidak ditemukan"
        );

    }

const noteData =
catatanUser.notes[note];

if(noteData.type === "transaksi"){

let rows="";

noteData.data.forEach(row=>{

let color="#9ca3af";

if(row.status==="Dikemas")
color="#3b82f6";

if(row.status==="Dikirim")
color="#2563eb";

if(row.status==="Selesai")
color="#22c55e";

if(row.status==="Dibatalkan")
color="#ef4444";

if(row.status==="Menunggu Remit Otomatis")
color="#f59e0b";

rows += `
<tr>
<td>${row.username||""}</td>
<td>
<span
style="
background:${color};
color:#fff;
padding:2px 8px;
border-radius:6px;
font-size:11px;
font-weight:600;
">
${row.status}
</span>
</td>
</tr>
`;

});

return res.send(`
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>${note}</title>

<style>

*{
box-sizing:border-box;
margin:0;
padding:0;
font-family:Poppins,sans-serif;
}

body{
background:#fff7fb;
padding:8px;
max-width:700px;
margin:auto;
}

.card{
    background:#fff;
    border:1px solid #ffd4ea;
    border-radius:16px;
    padding:12px;
    width:100%;
    overflow:hidden;

    box-shadow:
    0 4px 15px rgba(236,72,153,.08);
}

@media(max-width:768px){

    body{
        padding:6px;
    }

    .card{
        padding:10px;
        border-radius:12px;
    }

    h1{
        font-size:16px;
    }

    th,td{
        font-size:11px;
        padding:6px;
    }

}

h1{
color:#ec4899;
font-size:18px;
margin-bottom:12px;
word-break:break-word;
}

.table-wrap{
overflow-x:auto;
-webkit-overflow-scrolling:touch;
}

table{
width:100%;
border-collapse:collapse;
min-width:450px;
}

th,td{
border:1px solid #ffd4ea;
padding:8px;
font-size:12px;
white-space:nowrap;
}

th{
background:#fff0f7;
color:#be185d;
}

@media(max-width:768px){

body{
padding:6px;
}

.card{
padding:10px;
border-radius:12px;
}

h1{
font-size:16px;
}

th,td{
font-size:11px;
padding:6px;
}

}

</style>

</head>

<body>

<div class="card">

<h1>📦 ${note}</h1>

<div class="table-wrap">

<table>

<thead>
<tr>
<th>Username</th>
<th>Status</th>
</tr>
</thead>

<tbody>
${rows}
</tbody>

</table>

</div>

</div>

</body>
</html>
`);

}
else{

return res.send(`
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">

<style>

body{
background:#fff7fb;
padding:20px;
font-family:Poppins,sans-serif;
}

.card{
background:#fff;
border:1px solid #ffd4ea;
border-radius:16px;
padding:20px;
min-height:500px;
}

h1{
color:#ec4899;
margin-bottom:15px;
}

</style>

</head>

<body>

<div class="card">

<h1>📝 ${note}</h1>

<div>
${noteData.content||""}
</div>

</div>

</body>
</html>
`);

}

});

app.get("/api/me", authMiddleware, (req, res) => {
  let users = getUsers();

  if(!req.user?.email){
  return res.json({ success:false });
}

const user = users.find(u => u.email === req.user.email);

  if (!user) {
    return res.json({ success: false });
  }

  res.json({
    success: true,
user: {
  id: user.id,
  name: user.name,
  email: user.email,
  saldo:
  Number(
    user.saldo||0
  ),

  reward:
  Number(
    user.reward||0
  )
}
  });
});

app.get("/api/riwayat", authMiddleware, (req, res) => {
  const users = getUsers();
  const user = users.find(u => u.email === req.user.email);

  if (!user) {
    return res.json({ success: false });
  }

  res.json({
    success: true,
    history: user.history || []
  });
});

app.get("/api/active-orders", authMiddleware, (req, res) => {
  const users = getUsers();

  const user = users.find(
    u => u.email === req.user.email
  );

  if (!user) {
    return res.json({
      success: false
    });
  }

  const activeOrders = (user.history || []).filter(
    x =>
      x.status === "active" ||
      x.status === "pending_refund" ||
      x.status === "refunded" ||
      x.status === "refund_rejected"
  );

  res.json({
    success: true,
    data: activeOrders
  });
});

app.post("/api/order/done", authMiddleware, (req, res) => {
  const { orderId } = req.body;

  const users = getUsers();
  const user = users.find(
    u => u.email === req.user.email
  );

  if (!user) {
    return res.json({ success:false });
  }

  const order = user.history.find(
    x => String(x.id) === String(orderId)
  );

  if (!order) {
    return res.json({
      success:false,
      message:"Order tidak ditemukan"
    });
  }

  order.status = "done";

  saveUsers(users);
io.to(user.email).emit("orderUpdate", {
  type: "done"
});
  res.json({
    success:true
  });
});

app.post("/api/topup/create", authMiddleware, async (req, res) => {
  try {
    const { nominal } = req.body;
    if (!nominal || isNaN(nominal) || Number(nominal) < 1000) {
      return res.json({
        success: false,
        message: "Nominal tidak valid"
      });
    }

    const users = getUsers();
    const user = users.find(u => u.email === req.user.email);

    if (!user) {
      return res.json({
        success: false,
        message: "User tidak ditemukan"
      });
    }

const referenceId = "TOPUP-" + Date.now();
const body = {
  product: ["Topup Saldo"],
  qty: ["1"],
  price: [String(nominal)],
  amount: String(nominal),
  returnUrl: "https://gaslur.site/success",
  cancelUrl: "https://gaslur.site/cancel",
  notifyUrl: "https://gaslur.site/api/ipaymu/callback",
  referenceId: referenceId,
  buyerName: user.name,
  buyerPhone: user.phone,
  buyerEmail: user.email,
  paymentMethod: "qris"
};

const method = "POST";
const endpoint = "/api/v2/payment/direct";
const timestamp = new Date().toISOString();

const signature = generateSignature(
  body,
  IPAYMU_API_KEY,
  IPAYMU_VA
);

console.log("TIMESTAMP:", timestamp);
console.log("BODY:", JSON.stringify(body));
console.log("SIGNATURE:", signature);

const response = await axios.post(
  IPAYMU_URL,
  body,
{
  headers:{
    "Content-Type":"application/json",
    "Accept":"application/json",
    "va":IPAYMU_VA,
    "signature":signature,
    "timestamp":timestamp
  }
});

console.log(
 "IPAYMU:",
 JSON.stringify(
   response.data,
   null,
   2
 )
);

if(!user.topup){
   user.topup=[];
}

const now=Date.now();

user.topup.push({

   referenceId,

   nominal:Number(
      nominal
   ),

   qrUrl:
      response.data?.Data?.qrContent ||
      response.data?.Data?.QrString ||
      response.data?.Data?.qrString ||
      "",

   status:
      "waiting_payment",

   time:now,

   expiredAt:
      now + (24 * 60 * 60 * 1000)

});

saveUsers(users);

return res.json({
 success:true,
 payment:
 response.data?.Data
});

    saveUsers(users);

    return res.json({
      success: true,
      payment: response.data?.Data || response.data
    });

  } catch (err) {
    console.log("IPAYMU ERROR:", err.response?.data || err.message);

    return res.json({
      success: false,
      message: err.response?.data?.Message || "Gagal create payment"
    });
  }
});

app.post("/api/ipaymu/callback", (req, res) => {
  try {
    const rawBody = req.rawBodyBuffer.toString();

    const timestamp = req.headers["x-timestamp"];
    const externalId = req.headers["x-external-id"];
    const receivedSignature = req.headers["x-signature"];

    const apiKey = IPAYMU_API_KEY;

    const stringToSign = `${timestamp}:${externalId}:${rawBody}`;

    const calculatedSignature = crypto
      .createHmac("sha256", apiKey)
      .update(stringToSign)
      .digest("hex");

    console.log("========== CALLBACK ==========");
    console.log("SIGNATURE IPAYMU:", receivedSignature);
    console.log("SIGNATURE KITA:", calculatedSignature);

    const isSandbox = process.env.NODE_ENV !== "production"; 

    if (calculatedSignature !== receivedSignature) {
      if (isSandbox) {
      } else {
        return res.status(400).send("Invalid Signature");
      }
    } else {
      console.log("✅ SIGNATURE VALID");
    }

const data = req.body;
const users = getUsers();

for (let user of users) {
  const trx = (user.topup || []).find(t =>
    t.referenceId === data.reference_id ||
    t.referenceId === data.sid
  );

  if (trx) {

if (Number(data.status_code) === 1) {

  if (trx.status === "success") {
    console.log("⚠️ SUDAH DIPROSES");
    return res.status(200).send("OK");
  }

  trx.status = "success";

  const amount = Number(
    data.amount ||
    data.paid_off ||
    data.total ||
    0
  );

  user.saldo += amount;

  console.log("💰 SALDO MASUK BOLO:", amount);
}

else if (Number(data.status_code) === 0) {
  trx.status = "pending";
  console.log("⏳ MASIH PENDING:", trx.referenceId);
}

else if (Number(data.status_code) === -2) {
  trx.status = "expired";
}

else {
  trx.status = "failed";
  console.log("❌ TRANSAKSI GAGAL:", trx.referenceId);
}

saveUsers(users);
break;
  }
}

    return res.status(200).send("OK");

  } catch (err) {
    console.log("❌ ERROR:", err.message);
    return res.status(500).send("Server Error");
  }
});

app.get("/api/topup", authMiddleware, (req, res) => {
  const users = getUsers();
  const user = users.find(u => u.email === req.user.email);

  if (!user) {
    return res.json({ success: false });
  }

  const now = Date.now();

  // pastikan array ada
  if (!user.topup) user.topup = [];

  // update status expired otomatis
  user.topup.forEach(t => {
    if (
      t.status === "waiting_payment" &&
      t.expiredAt &&
      now > t.expiredAt
    ) {
      t.status = "expired";
    }
  });

  saveUsers(users);

  return res.json({
    success: true,
    data: user.topup
  });
});

app.get(
"/api/topup/active",
authMiddleware,
(req,res)=>{

 const users=
 getUsers();

 const user=
 users.find(
   u=>u.email===
   req.user.email
 );

 if(!user){

   return res.json({
      success:false
   });

 }

 const now=
 Date.now();

 const trx=
 (user.topup||[])
 .find(x=>

   x.status===
   "waiting_payment"

   &&

   x.expiredAt>
   now

 );

 if(!trx){

   return res.json({
      success:false
   });

 }

 res.json({

   success:true,

   data:trx

 });

});

app.post(
"/api/topup/cancel",
authMiddleware,
(req,res)=>{

const {referenceId}=req.body;

const users=
getUsers();

const user=
users.find(
u=>
u.email===
req.user.email
);

if(!user){

return res.json({
success:false
});

}

const trx=
(user.topup||[])
.find(
x=>
x.referenceId===
referenceId
);

if(!trx){

return res.json({
success:false
});

}

if(
trx.status!==
"waiting_payment"
){

return res.json({
success:false
});

}

trx.status=
"cancelled";

saveUsers(users);

res.json({
success:true
});

});

app.post("/api/ganti-password", authMiddleware, async (req, res) => {
  const { passwordLama, passwordBaru } = req.body;

  if (!passwordLama || !passwordBaru) {
    return res.json({ success: false, message: "Data tidak lengkap" });
  }
  const users = getUsers();
  const index = users.findIndex(u => u.email === req.user.email);
  if (index === -1) {
    return res.json({ success: false, message: "User tidak ditemukan" });
  }
  const user = users[index];
  const match = await bcrypt.compare(passwordLama, user.password);
  if (!match) {
    return res.json({ success: false, message: "Password lama salah" });
  }
  const hash = await bcrypt.hash(passwordBaru, 10);
  users[index].password = hash;
  saveUsers(users);
  res.json({ success: true, message: "Password berhasil diubah" });
});

app.get("/api/admin/data", (req, res) => {
  const users = getUsers();

  let result = [];

  users.forEach(u => {

    (u.topup || []).forEach(t => {
      result.push({
        type: "topup",
        email: u.email,
        id: u.id,
        nominal: t.uniqueNominal || t.nominal,
        status: t.status,
        time: t.time
      });
    });


(u.refund || []).forEach(r => {
  result.push({
    type: "refund",
    email: u.email,
    id: r.id,
    alasan: r.alasan || "-",
    orderId: r.orderId,
    nominal: r.nominal,
    status: r.status,
    time: r.time
  });
});

  });

  res.json({ success: true, data: result });
});
app.post("/api/admin/topup/approve", (req, res) => {
  const { email, time } = req.body;

  const users = getUsers();
  const user = users.find(u => u.email === email);

  if (!user) {
    return res.json({ success: false });
  }

  const trx = user.topup.find(
    t => Number(t.time) === Number(time)
  );

  if (!trx) {
    return res.json({
      success: false,
      message: "Transaksi tidak ditemukan"
    });
  }

  if (trx.status !== "pending") {
    return res.json({
      success:false,
      message:"Sudah diproses"
    });
  }

  const nominal = Number(
    trx.uniqueNominal || trx.nominal || 0
  );

  user.saldo += nominal;
  trx.status = "success";

  saveUsers(users);

  res.json({
    success: true,
    saldo: user.saldo
  });
});

app.post("/api/admin/topup/reject", (req, res) => {
  const { email, time } = req.body;
  const users = getUsers();
  const user = users.find(u => u.email === email);
  if (!user) {
    return res.json({ success: false });
  }

  const trx = user.topup.find(
    t => Number(t.time) === Number(time)
  );

  if (!trx) {
    return res.json({ success: false });
  }

  if (trx.status !== "pending") {
    return res.json({
      success:false,
      message:"Sudah diproses"
    });
  }

  trx.status = "failed";

  saveUsers(users);

  res.json({ success: true });
});

app.post("/api/admin/refund/approve", (req, res) => {
  const { email, orderId } = req.body;

  const users = getUsers();
  const user = users.find(u => u.email === email);

  if (!user) {
    return res.json({ success: false });
  }

  const trx = user.refund.find(r => r.orderId === orderId);

  if (!trx || trx.status !== "pending") {
    return res.json({ success: false });
  }

  user.saldo += Number(trx.nominal);

  trx.status = "approved";

saveRefundToExcel({
  user_email: email,
  produk_email: trx.id,
  order_id: trx.orderId,
  nominal: trx.nominal,
  reason: trx.alasan,
  status: trx.status,
  waktu_refund: new Date().toLocaleString("id-ID")
});
  
  const order = user.history.find(
  x => String(x.id) === String(orderId)
);

if(order){
  order.status = "refunded";
}

  saveUsers(users);
io.to(user.email).emit("orderUpdate", {
  type: "refund_approved"
});
  res.json({
    success: true
  });
});
app.post("/api/admin/refund/reject", (req, res) => {
  const { email, orderId } = req.body;

  const users = getUsers();
  const user = users.find(u => u.email === email);

  if (!user) return res.json({ success: false });

  const trx = user.refund.find(r => r.orderId === orderId);

  if (!trx) {
    return res.json({ success: false });
  }

  trx.status = "rejected";
  
  const order = user.history.find(
  x => String(x.id) === String(orderId)
);

if(order){
  order.status = "refund_rejected";
}

  saveUsers(users);
io.to(user.email).emit("orderUpdate", {
  type: "refund_rejected"
});
  res.json({ success: true });
});

app.post("/api/refund", authMiddleware, (req,res)=>{

  const { id, orderId, nominal, alasan } = req.body;

  const users = getUsers();
  const user = users.find(u => u.email === req.user.email);

  if (!user) {
    return res.json({ success:false });
  }

  if (!nominal || nominal <= 0) {
    return res.json({
      success:false,
      message:"Nominal refund tidak valid"
    });
  }

  if (!user.refund) {
    user.refund = [];
  }
  
  const existingRefund = user.refund.find(
  r => r.orderId === orderId && r.status === "pending"
);

if(existingRefund){
  return res.json({
    success:false,
    message:"Refund sudah diajukan"
  });
}

user.refund.push({
  id,
  orderId,
  alasan: alasan || "-",
  nominal: Number(nominal),
  status: "pending",
  time: Date.now()
});

const order = user.history.find(
  x => String(x.id) === String(orderId)
);

if(order){
  order.status = "pending_refund";
}

  saveUsers(users);
  io.to(user.email).emit("orderUpdate", {
  type: "refund_pending"
});

  res.json({ success:true });
});

app.get("/api/refund", authMiddleware, (req,res)=>{

  const users = getUsers();
  const user = users.find(u => u.email === req.user.email);

  if (!user) return res.json({ success:false });

  res.json({
    success: true,
    data: user.refund || []
  });

});

app.get("/livechat", (req,res)=>{
  sendPage(res,"livechat.html");
});

app.get("/test-telegram", async (req,res)=>{
  try{
    const result = await axios.get(
      `https://api.telegram.org/bot${BOT_TOKEN}/getMe`
    )

    res.json(result.data)

  }catch(err){
    res.json(
      err.response?.data || {
        error: err.message
      }
    )
  }
})

async function getEmails() {

  if (!fs.existsSync("token.json")) {
    throw new Error("Google belum login");
  }

  const token = JSON.parse(fs.readFileSync("token.json"));
  oauth2Client.setCredentials(token);

  const gmail = google.gmail({
    version: "v1",
    auth: oauth2Client
  });

  const list = await gmail.users.messages.list({
    userId: "me",
    maxResults: 10,
    labelIds: ["INBOX"]
  });

  if (!list.data.messages) return [];

  const hasil = await Promise.all(
    list.data.messages.map(async (msg) => {

      const detail = await gmail.users.messages.get({
        userId: "me",
        id: msg.id,
        format: "full"
      });

      const headers = detail.data.payload.headers;

      const subject = headers.find(h => h.name === "Subject")?.value;
      const from = headers.find(h => h.name === "From")?.value;
      const to = headers.find(h => h.name === "To")?.value;
      const deliveredTo = headers.find(h => h.name === "Delivered-To")?.value;

      return {
        id: msg.id,
        internalDate: Number(detail.data.internalDate),
        subject,
        from,
        to,
        deliveredTo,
        snippet: detail.data.snippet
      };
    })
  );

  hasil.sort((a, b) => b.internalDate - a.internalDate);

  return hasil;
}

app.get("/api/gmail", async (req, res) => {
  try {
    const now = Date.now();

    if (
      gmailCache.length &&
      now - gmailCacheTime < 15000
    ) {
      return res.json({
        success: true,
        data: gmailCache,
        cached: true
      });
    }

    const emails = await getEmails();

    gmailCache = emails;
    gmailCacheTime = now;

    const users = getUsers();

    for (const mail of emails) {
      const match = matchEmailToOrders(mail);

      if (!match) continue;

      const user = users.find(
        u => u.email === match.email
      );

      if (!user || !user.history) {
        continue;
      }

      const orderExist = user.history.find(
        x => String(x.id) === String(match.orderId)
      );

      if (!orderExist) {
        continue;
      }

      if (!mail.from && !mail.to) {
        continue;
      }

      io.to(match.email).emit("gmailUpdate", {
        email: mail.from,
        subject: mail.subject,
        snippet: mail.snippet,
        match
      });
    }

    return res.json({
      success: true,
      data: emails,
      cached: false
    });

  } catch (err) {
    console.log("❌ GMAIL ERROR:", err.message);

    if (gmailCache.length) {
      return res.json({
        success: true,
        data: gmailCache,
        cached: true,
        fallback: true
      });
    }

    return res.json({
      success: false,
      error: err.message
    });
  }
});

app.post("/api/gmail/check", authMiddleware, async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.json({
        success: false,
        message: "orderId kosong"
      });
    }

    await checkOrderById(req.user.email, orderId);

    return res.json({
      success: true
    });

  } catch (err) {
    console.log("GMAIL CHECK ERROR:", err.message);

    return res.json({
      success: false,
      message: err.message
    });
  }
});

function matchEmailToOrders(email) {
  const users = getUsers();
  const fromEmail = normalizeEmail(email?.from || "");
  const toEmail = normalizeEmail(email?.to || email?.deliveredTo || "");

  if (!fromEmail && !toEmail) return null;

  let bestMatch = null;

  for (const user of users) {

    const orders = user.history || [];

    for (const order of orders) {

      const dataList = Array.isArray(order.data) ? order.data : [];

      for (const target of dataList) {

        const possibleEmails = [
          target?.email,
          target?.Email,
          target?.Gmail,
          target?.gmail,
          target?.["Email Pengganti"],
          target?.email_pengganti,
          target?.backupEmail
        ];

        for (const rawEmail of possibleEmails) {

          const cleanTarget = normalizeEmail(rawEmail);

          if (!cleanTarget) continue;

          if (cleanTarget === fromEmail || cleanTarget === toEmail) {

            const currentMatch = {
              email: user.email,
              orderId: order.id,
              product: order.type,
              time: order.time || 0
            };

            if (!bestMatch || currentMatch.time > bestMatch.time) {
              bestMatch = currentMatch;
            }

            break;
          }
        }
      }
    }
  }

  return bestMatch;
}

function matchLatestOrderForUser(emailData, userEmail) {
  const users = getUsers();

  const user = users.find(u => u.email === userEmail);
  if (!user) return null;

  const fromEmail = normalizeEmail(emailData?.from || "");
  const toEmail = normalizeEmail(
    emailData?.to || emailData?.deliveredTo || ""
  );

  if (!fromEmail && !toEmail) return null;

  const orders = [...(user.history || [])]
    .sort((a, b) => (b.time || 0) - (a.time || 0));

  for (const order of orders) {
    const dataList = Array.isArray(order.data) ? order.data : [];

    for (const target of dataList) {
      const possibleEmails = [
        target?.email,
        target?.Email,
        target?.Gmail,
        target?.gmail,
        target?.["Email Pengganti"],
        target?.email_pengganti,
        target?.backupEmail
      ];

      for (const rawEmail of possibleEmails) {
        const cleanTarget = normalizeEmail(rawEmail);

        if (!cleanTarget) continue;

        if (
          cleanTarget === fromEmail ||
          cleanTarget === toEmail
        ) {
          return {
            email: user.email,
            orderId: order.id,
            product: order.type,
            time: order.time || 0
          };
        }
      }
    }
  }

  return null;
}

async function checkOrderById(userEmail, orderId) {
  try {
    if (!fs.existsSync("token.json")) return;

    const token = JSON.parse(fs.readFileSync("token.json"));
    oauth2Client.setCredentials(token);

    const gmail = google.gmail({
      version: "v1",
      auth: oauth2Client
    });

    const users = getUsers();
    const user = users.find(u => u.email === userEmail);

    if (!user) return;

    const order = (user.history || []).find(
      o =>
        String(o.id) === String(orderId) &&
        o.status === "active"
    );

    if (!order) return;

    const targetEmail =
      order?.data?.[0]?.email ||
      order?.data?.[0]?.Email ||
      order?.data?.[0]?.Gmail ||
      order?.data?.[0]?.gmail;

    if (!targetEmail) return;

    const cleanTarget = normalizeEmail(targetEmail);

    const list = await gmail.users.messages.list({
      userId: "me",
      maxResults: 1,
      q: `newer_than:2d (from:${cleanTarget} OR to:${cleanTarget})`
    });

    if (!list.data.messages?.length) return;

    const msgId = list.data.messages[0].id;

    const detail = await gmail.users.messages.get({
      userId: "me",
      id: msgId,
      format: "full"
    });

    const headers = detail.data.payload.headers;

    const subject =
      headers.find(h => h.name === "Subject")?.value || "";

    const from =
      headers.find(h => h.name === "From")?.value || "";

    io.to(userEmail).emit("gmailUpdate", {
      email: from,
      subject,
      snippet: detail.data.snippet,
      match: {
        email: userEmail,
        orderId: order.id,
        product: order.type,
        time: order.time
      }
    });

  } catch (err) {
  }
}

async function checkLatestOrderForUser(userEmail) {
  try {
    if (!fs.existsSync("token.json")) return;

    const token = JSON.parse(fs.readFileSync("token.json"));
    oauth2Client.setCredentials(token);

    const gmail = google.gmail({
      version: "v1",
      auth: oauth2Client
    });

    const users = getUsers();
    const user = users.find(u => u.email === userEmail);

    if (!user) return;

    const latestOrder = [...(user.history || [])]
      .filter(o => o.status === "active")
      .sort((a, b) => (b.time || 0) - (a.time || 0))[0];

    if (!latestOrder) return;

    const targetEmail =
      latestOrder?.data?.[0]?.email ||
      latestOrder?.data?.[0]?.Email ||
      latestOrder?.data?.[0]?.Gmail ||
      latestOrder?.data?.[0]?.gmail;

    if (!targetEmail) return;

    const cleanTarget = normalizeEmail(targetEmail);

    const list = await gmail.users.messages.list({
      userId: "me",
      maxResults: 1,
      q: `newer_than:2d (from:${cleanTarget} OR to:${cleanTarget})`
    });

    if (!list.data.messages?.length) return;

    const msgId = list.data.messages[0].id;

    if (sentGmailIds.has(msgId)) return;

    const detail = await gmail.users.messages.get({
      userId: "me",
      id: msgId,
      format: "full"
    });

    const headers = detail.data.payload.headers;

    const subject = headers.find(h => h.name === "Subject")?.value || "";
    const from = headers.find(h => h.name === "From")?.value || "";
    const to = headers.find(h => h.name === "To")?.value || "";
    const deliveredTo =
      headers.find(h => h.name === "Delivered-To")?.value || "";

    io.to(userEmail).emit("gmailUpdate", {
      email: from,
      subject,
      snippet: detail.data.snippet,
      match: {
        email: userEmail,
        orderId: latestOrder.id,
        product: latestOrder.type,
        time: latestOrder.time
      }
    });

    sentGmailIds.add(msgId);

  } catch (err) {

  }
}

app.get("/api/livechat/history", (req, res) => {
  const { email } = req.query;

  if (!email) {
    return res.json({ success: false });
  }

  const session = liveChatSessions[email];
  const chats = session?.chats || [];

  res.json({
    success: true,
    data: chats
  });
});

app.get("/api/livechat/messages", (req, res) => {

try {

const email = (
  req.query.email || ""
).trim().toLowerCase();

if (!email) {

  return res.json({
    success: false,
    messages: []
  });
}

const filePath = path.join(
  __dirname,
  "data/livechat.json"
);

if (!fs.existsSync(filePath)) {

  return res.json({
    success: true,
    messages: []
  });
}

const raw = fs.readFileSync(
  filePath,
  "utf8"
);

if (!raw.trim()) {

  return res.json({
    success: true,
    messages: []
  });
}

let rooms = {};

try {

  rooms = JSON.parse(raw);

} catch (parseErr) {

  return res.json({
    success: false,
    messages: []
  });
}

const room = rooms[email];

if (!room) {

  return res.json({
    success: true,
    messages: []
  });
}

let chats = Array.isArray(room.chats)
  ? room.chats
  : [];

chats = chats.map(msg => ({

  id:
    msg.id ||
    Date.now(),

  sender:
    msg.sender || "admin",
  text:
    msg.text ||
    msg.message ||
    "",

  fileUrl:
    msg.fileUrl || null,

  status:
    msg.status || "sent",

  time:
    Number(msg.time) ||
    Date.now()

}));

chats.sort(
  (a, b) =>
    Number(a.time) -
    Number(b.time)
);

return res.json({
  success: true,
  messages: chats
});

} catch (err) {

return res.json({
  success: false,
  messages: []
});

}
});

io.on("connection", (socket) => {
  socket.isAlive = true;
  socket.lastPing = Date.now();
  socket.on("joinUser", (email) => {

    try {

      if (!email) {
        return socket.emit("socketError", {
          success: false,
          message: "Email kosong"
        });
      }

      const cleanEmail = String(email)
        .trim()
        .toLowerCase();

      if (
        socket.userEmail &&
        socket.userEmail !== cleanEmail
      ) {

        socket.leave(socket.userEmail);
      }

      socket.userEmail = cleanEmail;
      socket.join(cleanEmail);
      socket.isAlive = true;
      socket.lastPing = Date.now();
      socket.emit("socketReady", {
        success: true,
        room: cleanEmail,
        socketId: socket.id,
        time: Date.now()
      });

      io.to(cleanEmail).emit("userOnline", {
        email: cleanEmail,
        socketId: socket.id
      });

    } catch (err) {

      socket.emit("socketError", {
        success: false,
        message: err.message
      });
    }
  });

  socket.on("pingUser", () => {

    socket.isAlive = true;
    socket.lastPing = Date.now();

    socket.emit("pongUser", {
      success: true,
      time: Date.now()
    });
  });

  socket.on("forceRejoin", () => {

    try {

      if (!socket.userEmail) {
        return;
      }

      socket.join(socket.userEmail);

      socket.isAlive = true;
      socket.lastPing = Date.now();

      socket.emit("socketReady", {
        success: true,
        room: socket.userEmail,
        socketId: socket.id,
        rejoined: true
      });

    } catch (err) {

    }
  });

  socket.on("leaveUser", () => {

    try {

      if (!socket.userEmail) return;

      socket.leave(socket.userEmail);

    } catch (err) {

    }
  });

  socket.on("error", (err) => {

  });

  socket.on("disconnect", (reason) => {
    if (
      reason === "transport close" ||
      reason === "ping timeout"
    ) {

    }
    socket.isAlive = false;
  });

});

let gmailCache = [];
let isChecking = false;
let sentGmailIds = new Set();
let gmailCacheTime = 0;

setInterval(() => {
  sentGmailIds.clear();
}, 60 * 60 * 1000);

const TelegramBot = require("node-telegram-bot-api");
const BOT_TOKEN = "8776977350:AAFLQYgvtsKqCMqpsXGov786q2ZormAK2rI";
const CHAT_ID = "1475046378";
const bot = new TelegramBot(BOT_TOKEN, {
  polling: true
});

const SETOR_BOT_TOKEN =
"8984548393:AAFTD-QSsyiEmniLHyAsKX1XqCaFi9NYz68";
const setorBot =
new TelegramBot(
SETOR_BOT_TOKEN,
{
polling:true
}
);
const SETOR_CHAT_ID =
"1475046378";
const WD_BOT_TOKEN =
"8899505360:AAH8mUOvngNOembfmt9HFjs-dCYebbMoHOs";
const WD_CHAT_ID =
"1475046378";
const wdBot =
new TelegramBot(
WD_BOT_TOKEN,
{
polling:true
});
let restockSession = {};
let depositSession = {};

async function kirimSetoranTelegram(
data,
tipe
){

try{

let text=
`📥 SETORAN BARU

Produk : ${tipe}
Nama : ${data.Nama}

Email User:
${data.EmailUser}

Email :
${data.Email}

Password :
${data.Password}

UID :
${data.UID||"-"}

Harga :
Rp${Number(
data.Harga
).toLocaleString("id-ID")}

ID:
${data.ID}
`;

await setorBot.sendMessage(
SETOR_CHAT_ID,
text,
{
reply_markup:{
inline_keyboard:[

[
{
text:"✅ ON",
callback_data:
`setor_on_${data.ID}_${tipe}`
},

{
text:"❌ TIDAK VALID",
callback_data:
`setor_invalid_${data.ID}_${tipe}`
}
],

[
{
text:"⏸ OFF",
callback_data:
`setor_off_${data.ID}_${tipe}`
}
]

]
}
}
);

}catch(err){

console.log(err);

}

}

async function kirimWithdrawTelegram(
data
){

try{

let text=
`💸 WITHDRAW BARU

Nama:
${data.Nama}

Email:
${data.EmailUser}

Withdraw:
Rp${Number(
data.Jumlah
).toLocaleString("id-ID")}

Rekening:
${data.Bank}

${data.NomorRekening}
`;

await wdBot.sendMessage(
WD_CHAT_ID,
text,
{
reply_markup:{
inline_keyboard:[

[
{
text:"✅ Masuk",
callback_data:
`wd_masuk_${data.ID}`
},

{
text:"❌ Tolak",
callback_data:
`wd_tolak_${data.ID}`
}
]

]
}
}
);

}catch(err){

console.log(err);

}

}

bot.on("callback_query",(query)=>{

const chatId=query.message.chat.id;

if(query.data.startsWith("restock_")){

if(!restockSession[chatId]){
 return;
}

const map={

restock_gmail:"gmail",
restock_gmail_bekas:"gmail bekas",
restock_fb:"fb",
restock_gaslur:"gaslur"

};

const file=map[query.data];
restockSession[chatId].data.file=file;
restockSession[chatId].step=2;
bot.answerCallbackQuery(query.id);
return bot.editMessageText(
`✅ Dipilih: ${file}

🔐 Masukkan password:`,
{
chat_id:chatId,
message_id:query.message.message_id
}
);

}

if(query.data.startsWith("dep_")){
if(!depositSession[chatId]){
 return;
}
const value=query.data;
if(value==="dep_custom"){
depositSession[chatId].custom=true;
bot.answerCallbackQuery(query.id);
return bot.editMessageText(
"✍ Masukkan nominal custom:",
{
chat_id:chatId,
message_id:query.message.message_id
}
);

}

const nominal=
Number(
value.replace("dep_","")
);

const users=getUsers();

const user=users.find(
u=>u.email===
depositSession[chatId].data.email
);

if(!user){
return;
}

user.saldo+=nominal;

saveUsers(users);

bot.answerCallbackQuery(query.id);

bot.editMessageText(
`✅ Deposit berhasil

Email: ${user.email}
Nominal: Rp${nominal.toLocaleString("id-ID")}
Saldo: Rp${user.saldo.toLocaleString("id-ID")}`,
{
chat_id:chatId,
message_id:query.message.message_id
}
);

delete depositSession[chatId];

return;

}

});

setorBot.on(
"callback_query",
async(query)=>{

try{

const data=query.data;

if(
!data.startsWith(
"setor_"
)
)return;

const pecah=
data.split("_");

const status=
pecah[1];

const id=
pecah[2];

const tipe=
pecah
.slice(3)
.join(" ")
.toLowerCase();

let file="";

if(
tipe==="facebook fresh"
){

file=
"setoran-facebook-fresh.xlsx";

}

else if(
tipe==="gmail fresh"
){

file=
"setoran-gmail-fresh.xlsx";

}

else if(
tipe==="gmail bekas"
){

file=
"setoran-gmail-bekas.xlsx";

}

const excelPath=
path.join(
setoranDir,
file
);

if(
!fs.existsSync(
excelPath
)
){

return setorBot.answerCallbackQuery(
query.id,
{
text:
"File tidak ada"
}
);

}

const wb=
XLSX.readFile(
excelPath
);

const sheet=
wb.Sheets[
wb.SheetNames[0]
];

let dataExcel=
XLSX.utils.sheet_to_json(
sheet
);

const item=
dataExcel.find(
x=>
String(x.ID)
===
String(id)
);

if(!item){

return setorBot.answerCallbackQuery(
query.id,
{
text:
"ID tidak ditemukan"
}
);

}

if(
status==="on"
){
item.Status="on";
}

if(
status==="off"
){
item.Status="off";
}

if(
status==="invalid"
){
item.Status=
"tidak valid";
}

wb.Sheets[
wb.SheetNames[0]
]=
XLSX.utils.json_to_sheet(
dataExcel
);

XLSX.writeFile(
wb,
excelPath
);

await setorBot.answerCallbackQuery(
query.id,
{
text:
"Berhasil diubah"
}
);

await setorBot.editMessageText(

`✅ STATUS UPDATE

Status:
${item.Status}

Email:
${item.Email}

ID:
${item.ID}`,

{

chat_id:
query.message.chat.id,

message_id:
query.message.message_id

}

);

}catch(err){

console.log(
"SETOR CALLBACK:",
err
);

}

});



wdBot.on(
"callback_query",
(query)=>{

const data=
query.data;

if(
!data.startsWith(
"wd_"
)
)return;

const pecah=
data.split("_");

const aksi=
pecah[1];

const id=
pecah[2];

let wd=
bacaJson(
wdPath
);

const item=
wd.find(
x=>
String(x.ID)
===
String(id)
);

if(!item)
return;

if(
aksi==="masuk"
){

item.Status=
"Berhasil";

}

if(
aksi==="tolak"
){

item.Status=
"Ditolak";

}

simpanJson(
wdPath,
wd
);

wdBot.editMessageText(

`Status:
${item.Status}

Nama:
${item.Nama}

WD:
Rp${Number(
item.Jumlah
).toLocaleString("id-ID")}`,

{
chat_id:
query.message.chat.id,

message_id:
query.message.message_id
}

);

wdBot.answerCallbackQuery(
query.id
);

});

bot.onText(/\/restock/, (msg) => {
  const chatId = msg.chat.id;

  restockSession[chatId] = {
    step: 1,
    data: {}
  };

bot.sendMessage(
  chatId,
  "📦 Pilih kategori restock:",
  {
    reply_markup: {
      inline_keyboard: [

        [
          {
            text:"📧 Gmail Fresh",
            callback_data:"restock_gmail"
          }
        ],

        [
          {
            text:"♻️ Gmail Bekas",
            callback_data:"restock_gmail_bekas"
          }
        ],

        [
          {
            text:"📘 Facebook",
            callback_data:"restock_fb"
          }
        ],

        [
          {
            text:"📦 Email Custom",
            callback_data:"restock_gaslur"
          }
        ]

      ]
    }
  }
);
});

bot.onText(/\/deposit/, (msg) => {

  const chatId = msg.chat.id;

  depositSession[chatId] = {
    step: 1,
    data: {}
  };

  bot.sendMessage(
    chatId,
    "💰 Masukkan email user:"
  );

});

setorBot.onText(
/\/stop/,
(msg)=>{

akunPenuh=true;

setorBot.sendMessage(
msg.chat.id,
"⛔ Setoran OFF"
);

});

setorBot.onText(
/\/start/,
(msg)=>{

akunPenuh=false;

setorBot.sendMessage(
msg.chat.id,
"✅ Setoran ON"
);

});

const livechatPath = path.join(
  __dirname,
  "data/livechat.json"
);

if (!fs.existsSync(livechatPath)) {

  // buat file default {}
  fs.writeFileSync(
    livechatPath,
    JSON.stringify({}, null, 2)
  );

}

function loadLiveChat() {

  try {

    const raw = fs.readFileSync(
      livechatPath,
      "utf8"
    );

    if (!raw.trim()) {
      return {};
    }

    const parsed = JSON.parse(raw);

    if (
      typeof parsed !== "object" ||
      Array.isArray(parsed)
    ) {

      return {};
    }

    return parsed;

  } catch (err) {

    fs.writeFileSync(
      livechatPath,
      JSON.stringify({}, null, 2)
    );

    return {};
  }
}

function saveLiveChat(data) {

  try {

    fs.writeFileSync(
      livechatPath,
      JSON.stringify(data, null, 2)
    );

  } catch (err) {

  }
}

let liveChatSessions = loadLiveChat();

setInterval(() => {

  try {

    const now = Date.now();
    const MAX_AGE =
      24 * 60 * 60 * 1000;

    let changed = false;
    Object.keys(liveChatSessions)
      .forEach(email => {

        const room =
          liveChatSessions[email];

        if (!room?.chats) return;
        room.chats =
          room.chats.filter(msg => {

            const keep =
              now - Number(msg.time || 0)
              < MAX_AGE;
            if (!keep && msg.fileUrl) {

              try {

                const filePath =
                  path.join(
                    __dirname,
                    msg.fileUrl
                  );

                if (
                  fs.existsSync(filePath)
                ) {

                  fs.unlinkSync(filePath);

                }

              } catch(err) {

                console.log(
                  "Gagal hapus file:",
                  err.message
                );

              }

            }

            return keep;

          });

        if (room.chats.length <= 0) {

          delete liveChatSessions[email];

        }

        changed = true;

      });

    if (changed) {

      saveLiveChat(
        liveChatSessions
      );

      console.log(
        "🧹 Livechat cleanup selesai"
      );

    }

  } catch(err) {

    console.log(
      "CLEANUP ERROR:",
      err.message
    );

  }

},

60 * 60 * 1000);

app.post("/api/livechat/start", async (req, res) => {

  const { name, email } = req.body;

  try {

    // init session
    if (!liveChatSessions[email]) {

      liveChatSessions[email] = {
        name,
        email,
        chats: []
      };

      saveLiveChat(liveChatSessions);
    }

    await axios.post(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
      {
        chat_id: CHAT_ID,
        text:
`🟢 LIVECHAT BARU

Nama: ${name}
Email: ${email}

User memulai chat`
      }
    );

    res.json({
      success: true
    });

  } catch (err) {

    res.json({
      success: false
    });
  }
});

app.post("/api/livechat/send", async (req, res) => {

  const { name, email, message } = req.body;

  try {

    if (!liveChatSessions[email]) {

      liveChatSessions[email] = {
        name,
        email,
        chats: []
      };

    }

    const newMessage = {
      id: Date.now(),
      sender: "user",
      message,
      time: Date.now()
    };

    liveChatSessions[email].chats.push(newMessage);

    saveLiveChat(liveChatSessions);

    io.to(email).emit(
      "livechatNewMessage",
      newMessage
    );

    await axios.post(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
      {
        chat_id: CHAT_ID,
        text:
`💬 PESAN LIVECHAT

Nama: ${name}
Email: ${email}

${message}`
      }
    );

    res.json({
      success: true
    });

  } catch (err) {

    res.json({
      success: false
    });

  }

});

app.post("/api/livechat/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.json({
        success: false,
        message: "File tidak ditemukan"
      });
    }

    const { name, email } = req.body;

    // init session
    if (!liveChatSessions[email]) {
      liveChatSessions[email] = {
        name,
        email,
        chats: []
      };
    }

    const filePath = path.join(__dirname, "uploads", req.file.filename);

    const form = new FormData();
    form.append("chat_id", CHAT_ID);
    form.append(
      "caption",
      `📷 FILE LIVECHAT\n\nNama: ${name}\nEmail: ${email}`
    );
    form.append("photo", fs.createReadStream(filePath));

    await axios.post(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`,
      form,
      { headers: form.getHeaders() }
    );

const newMsg = {
  id: Date.now(),
  sender: "user",
  message: "",
  fileUrl: "/uploads/" + req.file.filename,
  time: Date.now()
};

liveChatSessions[email].chats.push(newMsg);
saveLiveChat(liveChatSessions);
io.to(email).emit("livechatNewMessage", newMsg);

return res.json({
  success: true,
  id: newMsg.id,
  time: newMsg.time,
  fileUrl: newMsg.fileUrl
});

  } catch (err) {

    console.log("UPLOAD ERROR:", err);

    return res.json({
      success: false,
      message: err.message || "Upload gagal"
    });

  }
});

async function downloadTelegramFile(fileId, fileName) {
  const file = await bot.getFile(fileId);

  const fileUrl =
    `https://api.telegram.org/file/bot${BOT_TOKEN}/${file.file_path}`;

  const savePath = path.join(
    __dirname,
    "uploads",
    fileName
  );

  const response = await axios({
    url: fileUrl,
    method: "GET",
    responseType: "stream"
  });

  const writer = fs.createWriteStream(savePath);

  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on("finish", () => resolve(savePath));
    writer.on("error", reject);
  });
}

bot.on("message", async (msg) => {

  const chatId = msg.chat.id;
  const text = msg.text || msg.caption || "";
  const session = restockSession[chatId];
  const deposit = depositSession[chatId];
  if (session) {
    if (
   session.step===1 &&
   msg.text
) {

const mapFile = {
 "1":"gmail",
 "2":"fb",
 "3":"gaslur",
 "4":"gmail bekas",

 gmail:"gmail",
 fb:"fb",
 gaslur:"gaslur",
 "gmail bekas":"gmail bekas"
};

      const selected = mapFile[text.trim().toLowerCase()];

      if (!selected) {
        return bot.sendMessage(
          chatId,
          "❌ Pilihan tidak valid"
        );
      }

      session.data.file = selected;
      session.step = 2;

      return bot.sendMessage(
        chatId,
        "🔐 Masukkan password:"
      );
    }

    if (session.step === 2) {

      if (!text || text.startsWith("/")) {
        return bot.sendMessage(
          chatId,
          "❌ Password tidak valid"
        );
      }

      session.data.password = text.trim();
      session.step = 3;

      return bot.sendMessage(
        chatId,
        "📩 Masukkan email (pisahkan ENTER):"
      );
    }

    if (session.step === 3) {

      const emails = text
        .split("\n")
        .map(e => e.trim())
        .filter(Boolean);

      const fileName = session.data.file;

      const filePath = path.join(
        __dirname,
        `data/${fileName}.xlsx`
      );

      const passwordStok = session.data.password;

      if (!fs.existsSync(filePath)) {

        delete restockSession[chatId];

        return bot.sendMessage(
          chatId,
          "❌ File tidak ditemukan"
        );
      }

      const wb = XLSX.readFile(filePath);

      const sheet =
        wb.Sheets[wb.SheetNames[0]];

      let data =
        XLSX.utils.sheet_to_json(sheet);

      const newRows = emails.map(email => {

if (
 fileName === "gmail" ||
 fileName === "gmail bekas"
){
 return {
   Gmail: email,
   Password: passwordStok,
   statusGmail: ""
 };
}

        if (fileName === "fb") {
          return {
            Email: email,
            Password: passwordStok,
            statusEmail: ""
          };
        }

        if (fileName === "gaslur") {
          return {
            "Email Pengganti": email,
            Status: ""
          };
        }

      });

      data = [...data, ...newRows];

      const newSheet =
        XLSX.utils.json_to_sheet(data);

      wb.Sheets[wb.SheetNames[0]] =
        newSheet;

      XLSX.writeFile(wb, filePath);

      delete restockSession[chatId];

      return bot.sendMessage(
        chatId,
        `✅ Restock berhasil!\nFile: ${fileName}\nTotal: ${emails.length}`
      );
    }

    return;
  }
  
if (deposit) {
  if (deposit.step === 1) {

    const email = text.trim().toLowerCase();

    const users = getUsers();

    const user = users.find(
      u => u.email === email
    );

    if (!user) {

      return bot.sendMessage(
        chatId,
        "❌ User tidak ditemukan"
      );

    }

deposit.data.email = email;
deposit.step = 2;

return bot.sendMessage(
  chatId,
  "💰 Pilih nominal deposit:",
  {
    reply_markup:{
      inline_keyboard:[

        [
          {
            text:"💵 10K",
            callback_data:"dep_10000"
          },
          {
            text:"💵 20K",
            callback_data:"dep_20000"
          }
        ],

        [
          {
            text:"💵 50K",
            callback_data:"dep_50000"
          },
          {
            text:"💵 100K",
            callback_data:"dep_100000"
          }
        ],

        [
          {
            text:"✍ Custom",
            callback_data:"dep_custom"
          }
        ]

      ]
    }
  }
);

  }

  if(
deposit.step===2 &&
deposit.custom
){
    const nominal = Number(
      text.replace(/\D/g, "")
    );

    if (!nominal || nominal <= 0) {

      return bot.sendMessage(
        chatId,
        "❌ Nominal tidak valid"
      );

    }

    const users = getUsers();

    const user = users.find(
      u => u.email === deposit.data.email
    );

    if (!user) {

      delete depositSession[chatId];

      return bot.sendMessage(
        chatId,
        "❌ User hilang"
      );

    }

    user.saldo =
      Number(user.saldo || 0) +
      nominal;
    if (!user.topup) {
      user.topup = [];
    }

    user.topup.push({
      referenceId:
        "BONUS-" + Date.now(),
      nominal,
      status: "success",
      time: Date.now(),
      bonus: true
    });

    saveUsers(users);
    io.to(user.email).emit(
      "saldoUpdate",
      {
        saldo: user.saldo
      }
    );

    bot.sendMessage(
      chatId,
      `✅ Deposit berhasil

Email: ${user.email}
Nominal: Rp${nominal.toLocaleString("id-ID")}
Saldo sekarang: Rp${user.saldo.toLocaleString("id-ID")}`
    );

    delete depositSession[chatId];

    return;

  }

}

  const replyText =
    msg.text || msg.caption;

  if (!replyText) return;
  if (!msg.reply_to_message) return;

  const originalMessage =
    msg.reply_to_message.text ||
    msg.reply_to_message.caption;

  if (!originalMessage) return;

  const emailMatch =
    originalMessage.match(
      /Email:\s(.+?)(\n|$)/i
    );

  if (!emailMatch) {

    return;
  }

  const email =
    emailMatch[1].trim();

  if (!liveChatSessions[email]) {

    liveChatSessions[email] = {
      name: "-",
      email,
      chats: []
    };
  }

  const messageId = Date.now();

let newMessage = {
  id: messageId,
  sender: "admin",
  message: replyText || "",
  time: Date.now()
};

if (msg.photo && msg.photo.length > 0) {

  const photo = msg.photo[msg.photo.length - 1];

  const fileName =
    Date.now() + ".jpg";

  await downloadTelegramFile(
    photo.file_id,
    fileName
  );

  newMessage.fileUrl =
    "/uploads/" + fileName;
}

if (msg.document) {

  const ext = path.extname(
    msg.document.file_name || ""
  );

  const fileName =
    Date.now() + ext;

  await downloadTelegramFile(
    msg.document.file_id,
    fileName
  );

  newMessage.fileUrl =
    "/uploads/" + fileName;
}

liveChatSessions[email].chats.push(newMessage);
  saveLiveChat(liveChatSessions);

io.to(email).emit(
  "livechatNewMessage",
  newMessage
);

  io.to(email).emit("messageRead", {
    email
  });
  
});

setInterval(()=>{

const users=
getUsers();

let changed=
false;

users.forEach(user=>{

user.topup=
(user.topup||[])
.filter(t=>{

if(

t.status===
"waiting_payment"

&&

Date.now()>
t.expiredAt

){

changed=true;

return false;

}

return true;

});

});

if(changed){

saveUsers(
users
);

}

},10000);


// ================= curl ip =================
const { exec } = require("child_process");

app.get("/api/server-ip", (req, res) => {
    exec("curl -4 ifconfig.me", (error, stdout) => {
        if (error) {
            return res.status(500).json({
                success: false,
                error: error.message
            });
        }

        res.json({
            success: true,
            ip: stdout.trim()
        });
    });
});


/* ==========================================
   HEROSMS OTP API
========================================== */

const HEROSMS_API =
"https://hero-sms.com/stubs/handler_api.php";

let USD_RATE = 16500;

async function updateUsdRate(){

try{

const { data } =
await axios.get(
"https://open.er-api.com/v6/latest/USD"
);

if(data?.rates?.IDR){

USD_RATE =
Number(data.rates.IDR);

console.log(
"USD/IDR UPDATE:",
USD_RATE
);

}

}catch(err){

console.log(
"GAGAL UPDATE USD RATE:",
err.message
);

}

}

// load pertama kali
updateUsdRate();

// update tiap 1 jam
setInterval(
updateUsdRate,
60 * 60 * 1000
);


/* SERVICES */

app.get("/api/otp/services", async (req,res)=>{

try{

const response = await axios.get(
HEROSMS_API,
{
params:{
api_key:process.env.HEROSMS_API_KEY,
action:"getServicesList"
}
}
);

res.json(
response.data.services || []
);

}catch(err){

res.status(500).json({
message:err.message,
response:err.response?.data
});

}

});

/* COUNTRIES */

app.get("/api/otp/countries", async (req,res)=>{

try{

const { data } =
await axios.get(
HEROSMS_API,
{
params:{
api_key:
process.env.HEROSMS_API_KEY,
action:"getCountries"
}
}
);

const countries=[];

Object.keys(data).forEach(id=>{

countries.push({

id,

name:
data[id]?.eng ||
data[id]?.name ||
id

});

});

res.json(countries);

}catch(err){

res.status(500).json([]);

}

});

/* OPERATORS */

app.get("/api/otp/operators", async (req,res)=>{

try{

const country = req.query.country;

const { data } = await axios.get(
HEROSMS_API,
{
params:{
api_key:process.env.HEROSMS_API_KEY,
action:"getOperators",
country
}
}
);

res.json(
data.countryOperators?.[country] || []
);

}catch(err){

res.status(500).json([]);

}

});

app.get("/api/otp/offers", async (req,res)=>{

try{

const service = req.query.service;
const country = req.query.country;
const response = await axios.get(
"https://hero-sms.com/api/v1/activations/offers",
{
headers:{
Authorization:
process.env.HEROSMS_API_KEY
},
params:{
services:service,
countries:country
}
}
);

const map =
response.data.data?.[service]?.[country]?.map || {};

const offers = [];

Object.entries(map)
.forEach(([price,count])=>{

offers.push({
price:Number(price),
count
});

});

res.json(offers);

}catch(err){

res.status(500).json({
message: err.message,
data: err.response?.data
});

}

});

/* PRICES */

app.get("/api/otp/prices", async (req,res)=>{

try{

const country =
req.query.country;

const service =
req.query.service;

const { data } =
await axios.get(
HEROSMS_API,
{
params:{
api_key:
process.env.HEROSMS_API_KEY,

action:"getPrices",

country,

service
}
}
);

const prices=[];

Object.keys(data).forEach(c=>{

Object.keys(data[c])
.forEach(s=>{

const PROFIT = 500;

prices.push({

price:
Math.ceil(
Number(data[c][s].cost) *
USD_RATE
) + PROFIT,

count:
data[c][s].count || 0

});

});

});

res.json(prices);

}catch(err){

res.status(500).json([]);

}

});

/* ORDER NUMBER */

app.post(
"/api/otp/order",
authMiddleware,
async (req,res)=>{

try{

const {
service,
country,
operator
} = req.body;

// ================= USER =================

const users = getUsers();

const user =
users.find(
u => u.email === req.user.email
);

if(!user){

return res.status(401).json({
success:false,
message:"User tidak ditemukan"
});

}

// ================= AMBIL HARGA =================

const hargaResponse =
await axios.get(
HEROSMS_API,
{
params:{
api_key:
process.env.HEROSMS_API_KEY,

action:"getPrices",

country,

service
}
}
);

let hargaJual = 2500;

Object.keys(
hargaResponse.data
).forEach(c=>{

Object.keys(
hargaResponse.data[c]
).forEach(s=>{

hargaJual =
Math.ceil(
Number(
hargaResponse.data[c][s].cost
) * USD_RATE
) + 500;

});

});

// ================= CEK SALDO =================

if(
Number(user.saldo || 0)
<
hargaJual
){

return res.status(400).json({

success:false,

message:
`Saldo tidak cukup. Minimal Rp${hargaJual.toLocaleString("id-ID")}`

});

}

// ================= ORDER HEROSMS =================

const { data } =
await axios.get(
HEROSMS_API,
{
params:{
api_key:
process.env.HEROSMS_API_KEY,

action:"getNumber",

service,

country,

operator
}
}
);

// ================= BERHASIL =================

if(
typeof data === "string" &&
data.startsWith(
"ACCESS_NUMBER"
)
){

const parts =
data.split(":");

// POTONG SALDO
user.saldo =
Number(user.saldo || 0)
-
hargaJual;

const history =
getOtpHistory();

history.unshift({

  id: parts[1],

  activation_id: parts[1],

  userEmail:
  user.email,

  service,

  serviceName:
  req.body.serviceName || service,

  country,

  number:
  parts[2],

  harga:
  hargaJual,

  status:
  "active",

  time:
  Date.now()

});

saveOtpHistory(
  history
);



// SIMPAN ORDER
if(!user.otpOrders){
user.otpOrders = [];
}

user.otpOrders.unshift({

    activation_id: parts[1],

    number: parts[2],

    service,

    serviceName:
        req.body.serviceName || service,

    country,

    harga: hargaJual,

    time: Date.now(),

    smsReceived: false,

    waitingResend: false,

    messages: []

});

saveUsers(users);

return res.json({

success:true,

activation_id:
parts[1],

number:
parts[2],

service,

logo:
"/css/img/avatar5.png",

saldo:
user.saldo

});

}

// ================= GAGAL =================

return res.status(400).json({

success:false,

message:data

});

}catch(err){

return res.status(500).json({

success:false,

message:"Terjadi kesalahan server"

});

}

});

app.get(
"/api/otp/orders",
authMiddleware,
(req,res)=>{

const users = getUsers();

const user =
users.find(
u => u.email === req.user.email
);

res.json({
success:true,
data:user?.otpOrders || []
});

});



const lastSmsByActivation = {};

/* CHECK SMS */

app.get("/api/otp/sms/:id", async (req,res)=>{

try{

const id =
req.params.id;

const { data } =
await axios.get(
HEROSMS_API,
{
params:{
api_key:
process.env.HEROSMS_API_KEY,

action:"getStatus",

id
}
}
);

const messages=[];

if(
typeof data === "string" &&
data.startsWith(
"STATUS_OK"
)
){

const smsText =
data.replace(
"STATUS_OK:",
""
).trim();

if(
lastSmsByActivation[id] !== smsText
){

lastSmsByActivation[id] =
smsText;

/* SIMPAN STATUS SUDAH ADA SMS */

const users = getUsers();

users.forEach(user=>{

    if(!user.otpOrders) return;

    const order =
    user.otpOrders.find(
        x => x.activation_id === id
    );

if(order){

    order.smsReceived = true;

    order.waitingResend = false;

    order.messages =
    order.messages || [];

    if(
        !order.messages.find(
            m => m.text === smsText
        )
    ){

        const smsData = {
            id: Date.now(),
            text: smsText
        };

        order.messages.push(
            smsData
        );

        // SIMPAN KE HISTORY JUGA
        const history =
        getOtpHistory();

        const historyItem =
        history.find(
            h =>
            h.activation_id === id
        );

        if(historyItem){

            historyItem.messages =
            historyItem.messages || [];

            historyItem.messages.push(
                smsData
            );

            historyItem.smsReceived =
            true;

            saveOtpHistory(
                history
            );

        }

    }

}

});

saveUsers(users);

messages.push({

id:smsText,

text:smsText

});

}
}

res.json({
messages
});

}catch(err){

res.json({
messages:[]
});

}

});

/* RESEND SMS */

app.post("/api/otp/resend", async (req,res)=>{

try{

    await axios.get(
    HEROSMS_API,
    {
    params:{
    api_key:
    process.env.HEROSMS_API_KEY,

    action:"setStatus",

    id:
    req.body.activation_id,

    status:3
    }
    }
    );

    const users = getUsers();

    users.forEach(user=>{

        if(!user.otpOrders) return;

        const order =
        user.otpOrders.find(
            x =>
            x.activation_id ===
            req.body.activation_id
        );

        if(order){

            order.waitingResend = true;

        }

    });

    saveUsers(users);

    res.json({
        success:true
    });

}catch(err){

    res.status(500)
    .json({
        success:false
    });

}

});

/* DONE */

app.post("/api/otp/done", async (req,res)=>{

try{

await axios.get(
HEROSMS_API,
{
params:{
api_key:
process.env.HEROSMS_API_KEY,

action:"setStatus",

id:
req.body.activation_id,

status:6
}
}
);

const history =
getOtpHistory();

const item =
history.find(
x =>
x.activation_id ===
req.body.activation_id
);

if(item){

    const users =
    getUsers();

    const order =
    users
    .flatMap(
        u => u.otpOrders || []
    )
    .find(
        x =>
        x.activation_id ===
        req.body.activation_id
    );

    if(order){

        item.messages =
        order.messages || [];

        item.smsReceived =
        order.smsReceived;

    }

    item.status =
    "done";

    item.doneTime =
    Date.now();

    saveOtpHistory(history);

    users.forEach(user=>{

        if(!user.otpOrders)
        return;

        user.otpOrders =
        user.otpOrders.filter(
            x =>
            x.activation_id !==
            req.body.activation_id
        );

    });

    saveUsers(users);

}

res.json({
success:true
});

}catch(err){

res.status(500)
.json({
success:false
});

}

});

/* CANCEL */

app.post("/api/otp/cancel", async (req,res)=>{

try{
const activationId =
req.body.activation_id;

if(!activationId){

    return res.json({
        success:false,
        message:"Activation ID kosong"
    });

}

let response;

try{

response = await axios.get(
HEROSMS_API,
{
params:{
api_key:
process.env.HEROSMS_API_KEY,
action:"setStatus",
id:activationId,
status:8
}
}
);

}catch(err){

if(
err.response?.status === 409
){

return res.json({
success:true
});

}

throw err;

}

/* UPDATE HISTORY */

const history =
getOtpHistory();

const item =
history.find(
x =>
x.activation_id ===
req.body.activation_id
);

const users =
getUsers();

if(item){

    const order =
    users
    .flatMap(
        u => u.otpOrders || []
    )
    .find(
        x =>
        x.activation_id ===
        req.body.activation_id
    );

    if(order){

        item.messages =
        order.messages || [];

        item.smsReceived =
        order.smsReceived;

    }

    item.status =
    "cancel";

    item.cancelTime =
    Date.now();

    saveOtpHistory(history);

}

/* HAPUS DARI ORDER AKTIF */

users.forEach(user=>{

    if(!user.otpOrders)
    return;

    user.otpOrders =
    user.otpOrders.filter(
        x =>
        x.activation_id !==
        req.body.activation_id
    );

});

saveUsers(users);

res.json({
success:true
});

}catch(err){


res.status(500).json({
    success:false,
    message: err.message,
    data: err.response?.data
});

}

});

app.get(
"/api/otp/history",
authMiddleware,
(req,res)=>{

    const history =
    getOtpHistory();

    const data =
    history.filter(
        x =>
        x.userEmail ===
        req.user.email
    );

    res.json({
        success:true,
        data
    });

});

/* HISTORY SAVE */

app.post(
"/api/otp/history/save",
(req,res)=>{

res.json({
success:true
});

});

/* ==========================================
   HEROSMS OTP EMAIL
========================================== */

const EMAIL_API =
"https://hero-sms.com/api/v1";


app.post("/api/email/order",authMiddleware,async (req,res)=>{
  try {

    const { site, domain } = req.body;

    if (!site || !domain) {
      return res.status(400).json({
        success: false,
        message: "site dan domain wajib diisi"
      });
    }
	
const users = getUsers();

const user =
users.find(
u => u.email === req.user.email
);

if(!user){

return res.status(404).json({
success:false,
message:"User tidak ditemukan"
});

}

const selectedDomain =
await axios.get(
`${EMAIL_API}/emails/domains`,
{
params:{ site },
headers:{
Authorization:
`ApiKey ${process.env.HEROSMS_API_KEY}`,
Accept:"application/json"
}
}
);

const domains =
selectedDomain.data?.data || [];

const domainData =
domains.find(
x => x.name === domain
);

if(!domainData){

return res.status(400).json({
success:false,
message:"Domain tidak ditemukan"
});

}

const hargaJual =
Math.ceil(
(Number(domainData.cost) * USD_RATE)
+ 500
);

if(
Number(user.saldo || 0)
<
hargaJual
){

return res.status(400).json({

success:false,

message:
`Saldo tidak cukup. Minimal Rp${hargaJual.toLocaleString("id-ID")}`

});

}

    const { data } = await axios.post(
      `${EMAIL_API}/emails`,
      {
        site,
        domain
      },
      {
        headers: {
          Authorization: `ApiKey ${process.env.HEROSMS_API_KEY}`,
          Accept: "application/json"
        }
      }
    );


if(!user.emailOrders){
user.emailOrders = [];
}

user.saldo =
Number(user.saldo || 0)
-
hargaJual;
user.emailOrders.unshift({
	

id:data.data.id,

email:data.data.email,

site,
domain,

harga:hargaJual,

time:Date.now(),

otpReceived:false,

code:null

});

const emailHistory =
getEmailHistory();

emailHistory.unshift({

id:data.data.id,

activation_id:
data.data.id,

userEmail:
user.email,

service:
site,

pesan:null,

harga:
hargaJual,

status:
"active",

time:
Date.now()

});

saveEmailHistory(
emailHistory
);

saveUsers(users);

    res.json({
      success: true,
      data: data.data
    });

  } catch (err) {

    console.error("EMAIL ORDER ERROR:");
    console.error(err.response?.data || err);

    res.status(500).json({
      success: false,
      error: err.response?.data || err.message
    });

  }
});

app.get("/api/email/check/:id", async (req, res) => {
  try {

    const id = req.params.id;

const { data } = await axios.get(
  `${EMAIL_API}/emails/${id}`,
  {
    headers: {
      Authorization: `ApiKey ${process.env.HEROSMS_API_KEY}`,
      Accept: "application/json"
    }
  }
);

if(data.data?.value){

const users =
getUsers();

users.forEach(user=>{

    if(!user.emailOrders)
    return;

    const order =
    user.emailOrders.find(
        x => x.id === id
    );

    if(order){

        order.otpReceived = true;

order.code =
data.data.value;

const history =
getEmailHistory();

const item =
history.find(
x =>
String(x.activation_id)
===
String(id)
);

if(item){

item.pesan =
data.data.value;

item.otpReceived =
true;

saveEmailHistory(
history
);

}

    }

});

saveUsers(users);

}

res.json({
  success: true,

  status:
  data.data?.status || null,

  code:
  data.data?.value || null,

  email:
  data.data?.email || null,

  message:
  data.data?.message || null,

  data
});

  } catch (err) {

    console.error(err.response?.data || err);

    res.status(500).json({
      success: false,
      error: err.response?.data || err.message
    });

  }
});

app.post(
"/api/email/cancel/:id",
authMiddleware,
async (req, res) => {

try {

const id =
req.params.id;

/* CEK ORDER */

const users =
getUsers();

const user =
users.find(
u => u.email === req.user.email
);

if(!user){

return res.status(404).json({
success:false,
message:"User tidak ditemukan"
});

}

const order =
(user.emailOrders || [])
.find(
x => String(x.id) === String(id)
);

if(!order){

return res.status(404).json({
success:false,
message:"Order tidak ditemukan"
});

}

const elapsed =
Math.floor(
(Date.now() - order.time) / 1000
);

if(elapsed < 120){

return res.status(400).json({

success:false,

message:
`Tunggu ${120 - elapsed} detik lagi untuk membatalkan`

});

}

/* JIKA SUDAH PERNAH DAPAT OTP */

if(order.otpReceived){

return res.status(400).json({

success:false,

message:
"Email sudah menerima OTP dan tidak dapat dibatalkan"

});

}

/* CANCEL KE HERO SMS */

const response =
await axios.delete(
`${EMAIL_API}/emails/${id}`,
{
headers:{
Authorization:
`ApiKey ${process.env.HEROSMS_API_KEY}`,
Accept:"application/json"
}
}
);

if(!response){

return res.status(500).json({
success:false,
message:"Gagal cancel ke HeroSMS"
});

}

try{

await axios.get(
`${EMAIL_API}/emails/${id}`,
{
headers:{
Authorization:
`ApiKey ${process.env.HEROSMS_API_KEY}`,
Accept:"application/json"
}
}
);

}catch(checkErr){

}

const history =
getEmailHistory();

const item =
history.find(
x =>
String(x.activation_id)
===
String(id)
);

if(item){

item.status =
"cancel";

item.cancelTime =
Date.now();

saveEmailHistory(
history
);

}

/* HAPUS DARI ORDER AKTIF */

user.emailOrders =
user.emailOrders.filter(
x => String(x.id) !== String(id)
);

saveUsers(users);

res.json({

success:true,

message:
"Order dibatalkan"

});

} catch (err) {

console.error(
err.response?.data || err
);

res.status(500).json({

success:false,

error:
err.response?.data ||
err.message

});

}

});

app.post(
"/api/email/reorder/:id",
authMiddleware,
async (req,res)=>{

try{

const oldId =
req.params.id;

const users =
getUsers();

const user =
users.find(
u => u.email === req.user.email
);

if(!user){

return res.status(404).json({
success:false,
message:"User tidak ditemukan"
});

}

const oldOrder =
(user.emailOrders || [])
.find(
x => String(x.id) === String(oldId)
);

if(!oldOrder){

return res.status(404).json({
success:false,
message:"Order tidak ditemukan"
});

}

const history =
getEmailHistory();

const oldItem =
history.find(
x =>
String(x.activation_id)
===
String(oldId)
);

if(oldItem){

oldItem.status =
"reorder";

oldItem.reorderTime =
Date.now();

saveEmailHistory(
history
);

}

/* HARGA ORDER LAMA */

const hargaJual =
Number(oldOrder.harga || 0);

if(
hargaJual > 0 &&
Number(user.saldo || 0) < hargaJual
){

return res.status(400).json({

success:false,

message:
`Saldo tidak cukup. Minimal Rp${hargaJual.toLocaleString("id-ID")}`

});

}

/* REORDER KE HEROSMS */

const { data } =
await axios.post(
`${EMAIL_API}/emails/${oldId}/reorder`,
{},
{
headers:{
Authorization:
`ApiKey ${process.env.HEROSMS_API_KEY}`,
Accept:"application/json"
}
}
);

/* POTONG SALDO SERAPAY */

if(hargaJual > 0){

user.saldo =
Number(user.saldo || 0)
-
hargaJual;

}

/* ORDER BARU */

const newOrder = {

id:
data.data.id,

email:
data.data.email,

site:
data.data.site ||
oldOrder.site,

domain:
oldOrder.domain,

harga:
hargaJual,

time:
Date.now(),

otpReceived:false,

code:null

};

/* TAMBAH ORDER BARU */

user.emailOrders.unshift(
newOrder
);

/* HAPUS ORDER LAMA */

user.emailOrders =
user.emailOrders.filter(
x => String(x.id) !== String(oldId)
);

const emailHistory =
getEmailHistory();

emailHistory.unshift({

id:
data.data.id,

activation_id:
data.data.id,

userEmail:
user.email,

service:
newOrder.site,

pesan:null,

harga:
hargaJual,

status:
"active",

time:
Date.now()

});

saveEmailHistory(
emailHistory
);

saveUsers(users);

res.json({

success:true,

data:newOrder,

saldo:user.saldo,

message:
"Reorder berhasil"

});

}catch(err){

console.error(
err.response?.data || err
);

res.status(500).json({

success:false,

message:
err.response?.data?.message ||
err.message

});

}

});

app.get(
"/api/email/orders",
authMiddleware,
(req,res)=>{

const users =
getUsers();

const user =
users.find(
u => u.email === req.user.email
);

res.json({

success:true,

data:
user?.emailOrders || []

});

});

app.get(
"/api/email/history",
authMiddleware,
(req,res)=>{

const history =
getEmailHistory();

res.json({

success:true,

data:
history.filter(
x =>
x.userEmail ===
req.user.email
)

});

});

app.get("/api/email/domains", async (req, res) => {
  try {

    const site = req.query.site || "telegram.com";

    const { data } = await axios.get(
      `${EMAIL_API}/emails/domains`,
      {
        params:{ site },
headers:{
  Authorization:`ApiKey ${process.env.HEROSMS_API_KEY}`,
  Accept:"application/json"
}
      }
    );

    res.json({
      success:true,
      data:data.data || data
    });

  } catch(err){

    res.status(500).json({
      success:false,
      error:err.response?.data || err.message
    });
  }
});


app.post(
"/api/email/test",
(req,res)=>{

res.json({
success:true
});

});

// ================= START SERVER =================
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server jalan di http://0.0.0.0:${PORT}`);
}); 