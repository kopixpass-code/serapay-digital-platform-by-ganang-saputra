require("dotenv").config();

const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const db = pool;

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

async function getOtpHistory(userEmail = null) {

    let sql =
    `SELECT *
     FROM otp_history`;

    const params = [];

    if (userEmail) {

        sql +=
        ` WHERE user_email=?`;

        params.push(userEmail);

    }

    sql +=
    ` ORDER BY time DESC`;

    const [rows] =
    await pool.execute(
        sql,
        params
    );

    return rows;

}

async function addOtpHistory(data) {

    await pool.execute(
        `INSERT INTO otp_history (
            activation_id,
            duration,
            user_email,
            service,
            service_name,
            country,
            country_name,
            country_logo,
            operator,
            number,
            harga,
            status,
            messages,
            sms_received,
            time
        )
        VALUES (
            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
        )`,
        [
            data.activation_id,
            data.duration,
            data.user_email,
            data.service,
            data.service_name,
            data.country,
            data.country_name,
            data.country_logo,
            data.operator,
            data.number,
            data.harga,
            data.status,
            JSON.stringify(
                data.messages || []
            ),
            data.sms_received ? 1 : 0,
            data.time
        ]
    );

}

async function updateOtpHistory(
    activationId,
    updateData
) {

    const fields = [];
    const values = [];

    Object.keys(updateData)
    .forEach(key => {

        fields.push(
            `${key}=?`
        );

        values.push(
            updateData[key]
        );

    });

    values.push(
        activationId
    );

    await pool.execute(
        `UPDATE otp_history
         SET ${fields.join(", ")}
         WHERE activation_id=?`,
        values
    );

}

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

const tipe =
String(
req.body.tipe || ""
)
.toLowerCase()
.trim();

const users =
getUsers();

const user =
users.find(
u =>
u.email ===
req.body.userEmail
);

if(!user){

return res.json({
success:false,
message:"User tidak ditemukan"
});

}

const transaksiId =
Date.now();

let table = "";

if(
tipe ===
"facebook fresh"
){

table =
"setoran_facebook_fresh";

}
else if(
tipe ===
"gmail fresh"
){

table =
"setoran_gmail_fresh";

}
else if(
tipe ===
"gmail bekas"
){

table =
"setoran_gmail_bekas";

}
else{

return res.json({
success:false,
message:"tipe tidak dikenal"
});

}

const row = {

ID:
transaksiId,

Nama:
user.name || "-",

Email:
req.body.email || "-",

UID:
req.body.uid || "-",

Password:
req.body.password || "-",

Status:"",

Produk:
req.body.tipe || "-",

EmailUser:
req.body.userEmail || "",

Harga:
Number(
req.body.harga || 0
),

Waktu:
new Date()

};

if(
table ===
"setoran_facebook_fresh"
){

await pool.execute(
`
INSERT INTO setoran_facebook_fresh
(
transaksi_id,
email,
uid,
password,
status_akun,
produk,
nama,
email_user,
harga,
waktu,
sudah_diproses
)
VALUES
(
?,?,?,?,?,?,?,?,?,
NOW(),
0
)
`,
[
transaksiId,
row.Email,
row.UID,
row.Password,
"",
"Facebook Fresh",
row.Nama,
row.EmailUser,
row.Harga
]
);

}
else{

await pool.execute(
`
INSERT INTO ${table}
(
transaksi_id,
email,
password,
status_akun,
produk,
nama,
email_user,
harga,
waktu,
sudah_diproses
)
VALUES
(
?,?,?,?,?,?,?,
?,
NOW(),
0
)
`,
[
transaksiId,
row.Email,
row.Password,
"",
row.Produk,
row.Nama,
row.EmailUser,
row.Harga
]
);

}

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
async(req,res)=>{

try{

const tables=[

"setoran_facebook_fresh",

"setoran_gmail_fresh",

"setoran_gmail_bekas"

];

for(const table of tables){

const [rows]=await pool.execute(
`
SELECT
id,
email_user,
harga
FROM ${table}
WHERE
LOWER(status_akun)='on'
AND sudah_diproses=0
`
);

for(const item of rows){

await pool.execute(
`
UPDATE users
SET reward =
COALESCE(reward,0) + ?
WHERE email=?
`,
[
Number(item.harga||0),
item.email_user
]
);

await pool.execute(
`
UPDATE ${table}
SET sudah_diproses=1
WHERE id=?
`,
[
item.id
]
);

}

}

return res.json({
success:true
});

}catch(err){

console.log(
"SYNC:",
err
);

return res.json({
success:false,
message:err.message
});

}

});

app.get(
"/api/setoran",
async(req,res)=>{

try{

const [facebook] =
await pool.execute(
`
SELECT
transaksi_id AS ID,
email AS Email,
uid AS UID,
password AS Password,
status_akun AS Status,
produk AS Produk,
nama AS Nama,
email_user AS EmailUser,
harga AS Harga,
waktu AS Waktu
FROM setoran_facebook_fresh
`
);

const [gmailFresh] =
await pool.execute(
`
SELECT
transaksi_id AS ID,
email AS Email,
password AS Password,
status_akun AS Status,
produk AS Produk,
nama AS Nama,
email_user AS EmailUser,
harga AS Harga,
waktu AS Waktu
FROM setoran_gmail_fresh
`
);

const [gmailBekas] =
await pool.execute(
`
SELECT
transaksi_id AS ID,
email AS Email,
password AS Password,
status_akun AS Status,
produk AS Produk,
nama AS Nama,
email_user AS EmailUser,
harga AS Harga,
waktu AS Waktu
FROM setoran_gmail_bekas
`
);

const semua = [

...facebook,

...gmailFresh,

...gmailBekas

];

semua.sort(
(a,b)=>
Number(b.ID) -
Number(a.ID)
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
async(req,res)=>{

try{

const [users] =
await pool.execute(
`
SELECT *
FROM users
WHERE email=?
LIMIT 1
`,
[
req.body.userEmail
]
);

if(!users.length){

return res.json({
success:false,
message:
"User tidak ditemukan"
});

}

const user =
users[0];

const jumlah =
Number(
req.body.jumlah || 0
);

if(
jumlah < 10000
){

return res.json({
success:false,
message:
"Minimal penarikan Rp50.000"
});

}

if(
jumlah <= 0
){

return res.json({
success:false,
message:
"Nominal tidak valid"
});

}

if(
Number(
user.reward || 0
)
<
jumlah
){

return res.json({
success:false,
message:
"Saldo tidak cukup"
});

}

const [cekWd] =
await pool.execute(
`
SELECT id
FROM data_wd
WHERE
email_user=?
AND DATE(waktu)=CURDATE()
LIMIT 1
`,
[
req.body.userEmail
]
);

if(
cekWd.length
){

return res.json({
success:false,
message:
"Anda hanya bisa menarik saldo 1x sehari, coba lagi besok"
});

}

await pool.execute(
`
UPDATE users
SET reward =
reward - ?
WHERE email=?
`,
[
jumlah,
req.body.userEmail
]
);

const wdData = {

ID:
Date.now(),

Nama:
user.name || "-",

EmailUser:
req.body.userEmail,

Bank:
req.body.bank,

NomorRekening:
req.body.norek,

NamaRekening:
req.body.nama,

Jumlah:
jumlah,

Status:
"Pending"

};

await pool.execute(
`
INSERT INTO data_wd
(
id,
nama,
email_user,
bank,
nomor_rekening,
nama_rekening,
jumlah,
status,
waktu
)
VALUES
(
?,?,?,?,?,?,?,
'Pending',
NOW()
)
`,
[
wdData.ID,
wdData.Nama,
wdData.EmailUser,
wdData.Bank,
wdData.NomorRekening,
wdData.NamaRekening,
wdData.Jumlah
]
);

await kirimWithdrawTelegram(
wdData
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
success:false,
message:
err.message
});

}

});

app.post(
"/api/rekening",
async(req,res)=>{

try{

await pool.execute(
`
INSERT INTO rekening
(
email_user,
bank,
norek,
nama
)
VALUES
(
?,?,?,?
)
ON DUPLICATE KEY UPDATE
bank=VALUES(bank),
norek=VALUES(norek),
nama=VALUES(nama)
`,
[
req.body.userEmail,
req.body.bank,
req.body.norek,
req.body.nama
]
);

return res.json({
success:true
});

}catch(err){

console.log(
"REKENING:",
err
);

return res.json({
success:false
});

}

});

app.get(
"/api/rekening/:email",
async(req,res)=>{

try{

const [rows] =
await pool.execute(
`
SELECT
bank,
norek,
nama
FROM rekening
WHERE email_user=?
LIMIT 1
`,
[
req.params.email
]
);

return res.json({

success:true,

rekening:
rows.length
?
rows[0]
:
null

});

}catch(err){

console.log(
"GET REKENING:",
err
);

return res.json({

success:false,

rekening:null

});

}

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
async(req,res)=>{

try{

const [rows] =
await pool.execute(
`
SELECT
id,
nama,
email_user,
bank,
nomor_rekening,
nama_rekening,
jumlah,
status,
waktu
FROM data_wd
ORDER BY waktu DESC
`
);

return res.json({

success:true,

data:rows

});

}catch(err){

console.log(
"GET WD:",
err
);

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

app.get("/api/produk", async (req, res) => {

  try {

    const [[gmail]] =
      await pool.query(`
        SELECT COUNT(*) stok
        FROM gmail
        WHERE status='tersedia'
      `);

    const [[gmailBekas]] =
      await pool.query(`
        SELECT COUNT(*) stok
        FROM gmail_bekas
        WHERE status='tersedia'
      `);

    const [[backup]] =
      await pool.query(`
        SELECT COUNT(*) stok
        FROM gaslur
        WHERE status='tersedia'
      `);

    const [[fb]] =
      await pool.query(`
        SELECT COUNT(*) stok
        FROM facebook_fresh
        WHERE status='tersedia'
      `);

    res.json({
      produk: [
        {
          nama: "gmail fresh",
          harga: 4500,
          stok: gmail.stok
        },
        {
          nama: "gmail bekas",
          harga: 1500,
          stok: gmailBekas.stok
        },
        {
          nama: "email custom",
          harga: 1000,
          stok: backup.stok
        },
        {
          nama: "facebook fresh",
          harga: 3300,
          stok: fb.stok
        }
      ]
    });

  } catch (err) {

    console.log(err);

    res.json({
      produk: []
    });

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

const [users] = await pool.query(
  "SELECT * FROM users WHERE email=?",
  [userKey]
);

if (!users.length) {
  throw new Error("User tidak ditemukan");
}

const user = users[0];
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

if (Number(user.saldo) < totalHarga) {
  throw new Error("Saldo tidak cukup");
}

let hasil = [];

if (
  produk === "gmail" ||
  produk === "gmail fresh"
) {

  const [tersedia] = await pool.query(
    `
    SELECT *
    FROM gmail
    WHERE status='tersedia'
    LIMIT ?
    `,
    [qty]
  );

  if (tersedia.length < qty) {
    throw new Error(
      "Stok Gmail tidak cukup"
    );
  }

  const ids = [];

  for (const item of tersedia) {

    ids.push(item.id);

    hasil.push({
      email: item.email,
      pass: item.password
    });

  }

  await pool.query(
    `
    UPDATE gmail
    SET
      status='terjual',
      sold_at=?
    WHERE id IN (?)
    `,
    [
      Date.now(),
      ids
    ]
  );

}

else if (
  produk === "gmail bekas"
) {

  const [tersedia] = await pool.query(
    `
    SELECT *
    FROM gmail_bekas
    WHERE status='tersedia'
    LIMIT ?
    `,
    [qty]
  );

  if (tersedia.length < qty) {
    throw new Error(
      "Stok Gmail Bekas tidak cukup"
    );
  }

  const ids = [];

  for (const item of tersedia) {

    ids.push(item.id);

    hasil.push({
      email: item.email,
      pass: item.password
    });

  }

  await pool.query(
    `
    UPDATE gmail_bekas
    SET
      status='terjual',
      sold_at=?
    WHERE id IN (?)
    `,
    [
      Date.now(),
      ids
    ]
  );

}

else if (
  produk === "backup" ||
  produk === "email pengganti" ||
  produk === "email custom"
) {

  const [tersedia] = await pool.query(
    `
    SELECT *
    FROM gaslur
    WHERE status='tersedia'
    LIMIT ?
    `,
    [qty]
  );

  if (tersedia.length < qty) {
    throw new Error(
      "Stok Backup tidak cukup"
    );
  }

  const ids = [];

  for (const item of tersedia) {

    ids.push(item.id);

    hasil.push({
      email: item.email,
      pass: "-",
      backup: []
    });

  }

  await pool.query(
    `
    UPDATE gaslur
    SET
      status='terjual',
      sold_at=?
    WHERE id IN (?)
    `,
    [
      Date.now(),
      ids
    ]
  );

}

else if (
  produk === "facebook" ||
  produk === "facebook fresh"
) {

  const [tersedia] = await pool.query(
    `
    SELECT *
    FROM facebook_fresh
    WHERE status='tersedia'
    LIMIT ?
    `,
    [qty]
  );

  if (tersedia.length < qty) {
    throw new Error(
      "Stok Facebook tidak cukup"
    );
  }

  const ids = [];

  for (const item of tersedia) {

    ids.push(item.id);

    hasil.push({
      email: (item.email || "").trim(),
      pass: (item.password || "").trim()
    });

  }

  await pool.query(
    `
    UPDATE facebook_fresh
    SET
      status='terjual',
      sold_at=?
    WHERE id IN (?)
    `,
    [
      Date.now(),
      ids
    ]
  );

}

if (isNaN(totalHarga)) {
  throw new Error(
    "Total harga tidak valid (produk salah)"
  );
}

const saldoBaru =
  Number(user.saldo) - totalHarga;

await pool.query(
  "UPDATE users SET saldo=? WHERE id=?",
  [
    saldoBaru,
    user.id
  ]
);

const batchId =
  crypto.randomUUID();

let createdOrders = [];

for (const item of hasil) {

  const orderId =
    crypto.randomUUID();

  await pool.query(
    `
    INSERT INTO history
    (
      id,
      batch_id,
      user_id,
      type,
      qty,
      status,
      data,
      created_at
    )
    VALUES
    (?,?,?,?,?,?,?,?)
    `,
    [
      orderId,
      batchId,
      user.id,
      produk,
      1,
      "active",
      JSON.stringify([item]),
      Date.now()
    ]
  );

  createdOrders.push({
    id: orderId,
    type: produk,
    email: item.email
  });

}

io.to(userKey).emit(
  "orderUpdate",
  {
    type: "new_order"
  }
);

return res.json({
  success: true,
  saldo: saldoBaru,
  orders: createdOrders
});

  } catch (error) {

    return res.json({
      success: false,
      message:
        error.message ||
        "Terjadi kesalahan sistem"
    });

  } finally {

    locks.delete(userKey);

  }

});

app.post(
    "/api/autoresponder/order",
    authMiddleware,
    async (req, res) => {

        try {

            const qty =
                Number(req.body.qty) || 0;

            const hari =
                Number(req.body.expired) || 0;

            const link =
                req.body.shortlink || "";

            const hargaMap = {
                3: 5000,
                7: 10000,
                30: 25000,
                365: 200000
            };

            if (
                !hargaMap[hari]
            ) {

                return res.json({
                    success: false,
                    message: "Masa aktif tidak valid"
                });

            }

            if (
                qty < 1
            ) {

                return res.json({
                    success: false,
                    message: "Qty tidak valid"
                });

            }

            const total =
                hargaMap[hari] * qty;

            const [userRows] =
                await pool.execute(
                    `
                    SELECT *
                    FROM users
                    WHERE email=?
                    LIMIT 1
                    `,
                    [
                        req.user.email
                    ]
                );

            const user =
                userRows[0];

            if (!user) {

                return res.json({
                    success: false,
                    message: "User tidak ditemukan"
                });

            }

            if (
                req.body.metode !== "qris" &&
                Number(user.saldo) < total
            ) {

                return res.json({
                    success: false,
                    message: "Saldo tidak cukup"
                });

            }

            if (
                req.body.metode !== "qris"
            ) {

                await pool.execute(
                    `
                    UPDATE users
                    SET saldo = saldo - ?
                    WHERE email = ?
                    `,
                    [
                        total,
                        req.user.email
                    ]
                );

            }

            const now =
                Date.now();

            for (
                let i = 0;
                i < qty;
                i++
            ) {

                const id =
                    "AI" +
                    now +
                    "_" +
                    i;

                const username =
                    "serapay.id" +
                    Math.floor(
                        10000 +
                        Math.random() * 90000
                    );

                const password =
                    "serapay.id_" +
                    Math.floor(
                        100000 +
                        Math.random() * 900000
                    );

                const apikey =
                    "serapay-" +
                    Math.floor(
                        100000 +
                        Math.random() * 900000
                    );

                const expiredAt =
                    now +
                    (
                        hari *
                        86400000
                    );

                await pool.execute(
                    `
                    INSERT INTO autoresponder
                    (
                        id,
                        user_email,
                        url,
                        username,
                        password,
                        apikey,
                        status,
                        shortlink,
                        expired_at
                    )
                    VALUES
                    (
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?
                    )
                    `,
                    [
                        id,
                        req.user.email,
                        "https://gaslur.site/api",
                        username,
                        password,
                        apikey,
                        "belum digunakan",
                        link,
                        expiredAt
                    ]
                );

            }

            return res.json({
                success: true,
                message: "Order berhasil dibuat"
            });

        } catch (err) {

            console.error(
                "AUTORESPONDER ORDER ERROR:",
                err
            );

            return res.json({
                success: false,
                message: "Terjadi kesalahan server"
            });

        }

    }
);

app.get(
    "/api/autoresponder",
    authMiddleware,
    async (req, res) => {

        try {

            const [data] =
                await pool.execute(
                    `
                    SELECT *
                    FROM autoresponder
                    WHERE user_email=?
                    ORDER BY created_at DESC
                    `,
                    [
                        req.user.email
                    ]
                );

            return res.json({

                success: true,

                data

            });

        } catch (err) {

            console.log(err);

            return res.json({

                success: false,

                data: []

            });

        }

    }
);

app.post(
    "/api/autoresponder/extend",
    authMiddleware,
    async (req, res) => {

        try {

            const hari =
                Number(req.body.hari);

            const hargaMap = {
                3: 5000,
                7: 10000,
                30: 25000,
                365: 200000
            };

            if (!hargaMap[hari]) {

                return res.json({
                    success: false,
                    message: "Masa aktif tidak valid"
                });

            }

            const [userRows] =
                await pool.execute(
                    `
                    SELECT *
                    FROM users
                    WHERE email=?
                    LIMIT 1
                    `,
                    [req.user.email]
                );

            const user =
                userRows[0];

            if (!user) {

                return res.json({
                    success: false,
                    message: "User tidak ditemukan"
                });

            }

            const [licenseRows] =
                await pool.execute(
                    `
                    SELECT *
                    FROM autoresponder
                    WHERE id=?
                    AND user_email=?
                    LIMIT 1
                    `,
                    [
                        req.body.id,
                        req.user.email
                    ]
                );

            const item =
                licenseRows[0];

            if (!item) {

                return res.json({
                    success: false,
                    message: "Lisensi tidak ditemukan"
                });

            }

            const harga =
                hargaMap[hari];

            if (
                req.body.metode !== "qris"
            ) {

                if (
                    Number(user.saldo) < harga
                ) {

                    return res.json({
                        success: false,
                        message: "Saldo tidak cukup"
                    });

                }

                await pool.execute(
                    `
                    UPDATE users
                    SET saldo = saldo - ?
                    WHERE email = ?
                    `,
                    [
                        harga,
                        req.user.email
                    ]
                );
				
await pool.execute(
  `INSERT INTO otp_history
  (
    activation_id,
    duration,
    user_email,
    service,
    service_name,
    country,
    country_name,
    country_logo,
    operator,
    number,
    harga,
    status,
    messages,
    sms_received,
    time
  )
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  [
    parts[1],
    duration || "1",
    req.user.email,
    service,
    req.body.serviceName || service,
    country,
    req.body.countryName || country,
    req.body.countryLogo || "",
    operator,
    parts[2],
    hargaJual,
    "active",
    JSON.stringify([]),
    0,
    Date.now()
  ]
);

            }

            const sekarang =
                Date.now();

            let expiredAt =
                Number(item.expired_at) || 0;

            if (
                expiredAt <= sekarang
            ) {

                expiredAt =
                    sekarang +
                    (
                        hari *
                        86400000
                    );

            } else {

                expiredAt +=
                    (
                        hari *
                        86400000
                    );

            }

            await pool.execute(
                `
                UPDATE autoresponder
                SET expired_at=?
                WHERE id=?
                `,
                [
                    expiredAt,
                    item.id
                ]
            );

            return res.json({
                success: true,
                expiredAt
            });

        } catch (err) {

            console.error(
                "AUTORESPONDER EXTEND ERROR:",
                err
            );

            return res.json({
                success: false,
                message: "Terjadi kesalahan server"
            });

        }

    }
);

let session = {};

if (
    fs.existsSync(
        "session.json"
    )
) {

    session =
        JSON.parse(
            fs.readFileSync(
                "session.json",
                "utf8"
            )
        );

}

function saveSession() {

    fs.writeFileSync(
        "session.json",
        JSON.stringify(
            session,
            null,
            2
        )
    );

}

app.post(
    "/api",
    async (req, res) => {

        try {

            console.log(
                JSON.stringify(
                    req.body,
                    null,
                    2
                )
            );

            /* BASIC AUTH */

            const authHeader =
                req.headers.authorization || "";

            let username = "";
            let password = "";

            if (
                authHeader.startsWith(
                    "Basic "
                )
            ) {

                const decoded =
                    Buffer.from(
                        authHeader.replace(
                            "Basic ",
                            ""
                        ),
                        "base64"
                    ).toString();

                [
                    username,
                    password
                ] =
                    decoded.split(":");

            }

            /* FALLBACK BODY */

            username =
                username ||
                req.body.username ||
                "";

            password =
                password ||
                req.body.password ||
                "";

            /* CEK LISENSI */

            const [rows] =
                await pool.execute(
                    `
                    SELECT *
                    FROM autoresponder
                    WHERE username=?
                    AND password=?
                    AND apikey=?
                    LIMIT 1
                    `,
                    [
                        username,
                        password,
                        req.headers[
                            "x-api-key"
                        ]
                    ]
                );

            const lisensi =
                rows[0];

            if (!lisensi) {

                return res.json({

                    replies: [
                        {
                            message:
                                "Lisensi tidak valid"
                        }
                    ]

                });

            }

            /* CEK EXPIRED */

            if (
                Date.now() >
                Number(
                    lisensi.expired_at
                )
            ) {

                return res.json({

                    replies: [
                        {
                            message:
                                "Lisensi sudah expired"
                        }
                    ]

                });

            }

            /* UPDATE STATUS */

            if (
                lisensi.status !==
                "sudah digunakan"
            ) {

                await pool.execute(
                    `
                    UPDATE autoresponder
                    SET status='sudah digunakan'
                    WHERE id=?
                    `,
                    [
                        lisensi.id
                    ]
                );

            }

            /* DATA PESAN */

            const sender =
                req.body.query?.sender ||
                "User";

            const pesan =
                req.body.query?.message ||
                "";

            const userId =
                req.body.query?.sender_id ||
                sender;

            if (
                !session[userId]
            ) {

                session[userId] = {

                    count: 0,
                    linkSent: false,
                    asked: false

                };

            }

            session[userId].count++;

            saveSession();

            const state =
                session[userId];

            const link =
                lisensi.shortlink || "";

            /* PROMPT */

            const prompt = `
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
    state.count < 3
        ? "Only normal conversation. No invite. No profile."
        : state.count === 3 &&
          !state.linkSent
        ? "If conversation feels natural show curiosity."
        : "Continue naturally."
}
`;

            const hasil =
                await axios.post(
                    "http://127.0.0.1:11434/api/generate",
                    {
                        model: "qwen2.5:3b",
                        prompt,
                        stream: false,
                        keep_alive: "30m"
                    }
                );

            let balasan =
                hasil.data.response.trim();

            const lihat =
                /udah|sudah|lihat|buka|cek/i
                .test(pesan);

            if (lihat) {

                balasan =
                    "hehe gimana, cocok nggak sama yang kamu bayangin? 😄";

            }

            else if (
                state.count >= 3 &&
                !state.linkSent &&
                link
            ) {

                const promoPrompt = `
Message:
${pesan}

Reply ONLY in sender language.

Create ONE short natural sentence.

Examples:

Indonesia:
kalau penasaran sama aku 😄

English:
if you're curious about me 😄

Arabic:
إذا حاب تعرفني أكثر 😄

No quotes.
`;

                const promo =
                    await axios.post(
                        "http://127.0.0.1:11434/api/generate",
                        {
                            model: "qwen2.5:3b",
                            prompt: promoPrompt,
                            stream: false
                        }
                    );

                balasan +=
                    "\n\n" +
                    promo.data.response.trim() +
                    "\n" +
                    link;

                state.linkSent =
                    true;

                saveSession();

            }

            else if (
                state.linkSent &&
                !state.asked
            ) {

                const askPrompt = `
Message:
${pesan}

Reply ONLY in sender language.

Create ONE short sentence asking:

have you seen my profile yet?

No quotes.
`;

                const ask =
                    await axios.post(
                        "http://127.0.0.1:11434/api/generate",
                        {
                            model: "qwen2.5:3b",
                            prompt: askPrompt,
                            stream: false
                        }
                    );

                balasan +=
                    "\n\n" +
                    ask.data.response.trim();

                state.asked =
                    true;

                saveSession();

            }

            return res.json({

                replies: [
                    {
                        message:
                            balasan
                    }
                ]

            });

        } catch (err) {

            console.error(
                "AUTORESPONDER API ERROR:",
                err
            );

            return res.json({

                replies: [
                    {
                        message:
                            "AI sedang sibuk"
                    }
                ]

            });

        }

    }
);

app.post("/api/login", async (req, res) => {
  try {

    const { email, password } = req.body;

    const [rows] = await pool.query(
      "SELECT * FROM users WHERE email=?",
      [email.toLowerCase().trim()]
    );

    if (rows.length === 0) {
      return res.json({
        success: false,
        message: "User tidak ditemukan"
      });
    }

    const user = rows[0];

    const match = await bcrypt.compare(
      password,
      user.password
    );

    if (!match) {
      return res.json({
        success: false,
        message: "Password salah"
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email
      },
      SECRET,
      {
        expiresIn: "100d"
      }
    );

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

  } catch (err) {

    console.error(err);

    res.status(500).json({
      success: false,
      message: "Server error"
    });

  }
});

app.post("/api/register", async (req, res) => {
  try {

    const { name, email, phone, password } = req.body;

    if (!name || !email || !phone || !password) {
      return res.json({
        success: false,
        message: "Data tidak lengkap"
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanPhone = phone.trim();

    const [emailRows] = await pool.query(
      "SELECT id FROM users WHERE email=?",
      [cleanEmail]
    );

    if (emailRows.length) {
      return res.json({
        success: false,
        message: "Email sudah digunakan"
      });
    }

    const [phoneRows] = await pool.query(
      "SELECT id FROM users WHERE phone=?",
      [cleanPhone]
    );

    if (phoneRows.length) {
      return res.json({
        success: false,
        message: "Nomor HP sudah digunakan"
      });
    }

const hash = await bcrypt.hash(password, 10);

const userId =
  "USR" + Date.now();

await pool.query(
  `INSERT INTO users
  (id,name,email,phone,password,saldo,reward)
  VALUES (?,?,?,?,?,?,?)`,
  [
    userId,
    name,
    cleanEmail,
    cleanPhone,
    hash,
    0,
    0
  ]
);

const token = jwt.sign(
  {
    id: userId,
    email: cleanEmail
  },
  SECRET,
  {
    expiresIn: "100d"
  }
);

return res.json({
  success: true,
  token,
  user: {
    id: userId,
    name,
    email: cleanEmail,
    phone: cleanPhone,
    saldo: 0
  }
});

  } catch (err) {

    console.error("REGISTER ERROR:", err);

    res.status(500).json({
      success: false,
      message: err.message
    });

  }
});

app.post("/api/lupa/check", async (req, res) => {
  const { email } = req.body;

  try {

    const [rows] = await pool.query(
      "SELECT id FROM users WHERE email=?",
      [email]
    );

    if (rows.length === 0) {
      return res.json({
        success: false
      });
    }

    res.json({
      success: true
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      success: false
    });

  }
});

app.post("/api/lupa/reset", async (req, res) => {
  const { email, password } = req.body;

  try {

    const hash = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      "UPDATE users SET password=? WHERE email=?",
      [hash, email]
    );

    if (result.affectedRows === 0) {
      return res.json({
        success: false
      });
    }

    res.json({
      success: true
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      success: false
    });

  }
});

/* =========================
   GET CATATAN
========================= */

app.get(
"/api/catatan",
authMiddleware,
async (req,res)=>{

try{

const [rows] = await db.query(
`
SELECT notes
FROM catatan
WHERE email = ?
LIMIT 1
`,
[
req.user.email
]
);

let notes = {};

if(
rows.length &&
rows[0].notes
){

try{

notes =
JSON.parse(
rows[0].notes
);

}catch{

notes = {};

}

}

res.json({

success:true,
notes

});

}catch(err){

console.error(err);

res.status(500).json({

success:false,
message:"Server error"

});

}

});


/* =========================
   SIMPAN CATATAN
========================= */

app.post(
"/api/catatan",
authMiddleware,
async (req,res)=>{

try{

const notes =
req.body.notes || {};

await db.query(
`
INSERT INTO catatan
(
email,
notes
)
VALUES
(
?,
?
)
ON DUPLICATE KEY UPDATE
notes = VALUES(notes)
`,
[
req.user.email,
JSON.stringify(notes)
]
);

res.json({

success:true

});

}catch(err){

console.error(err);

res.status(500).json({

success:false,
message:"Server error"

});

}

});

/* =========================
   SHARE NOTE
========================= */

app.post(
"/api/share-note",
authMiddleware,
async (req,res)=>{

try{

const [users] =
await db.query(
`
SELECT id,email
FROM users
WHERE email = ?
LIMIT 1
`,
[
req.user.email
]
);

if(!users.length){

return res.json({

success:false

});

}

const user =
users[0];

const noteName =
req.body.noteName;

const slug =
noteName
.toLowerCase()
.replace(/[^a-z0-9]+/g,"-")
.replace(/^-|-$/g,"");

const url =
`https://gaslur.site/catatan/${user.id}/${slug}`;

res.json({

success:true,
url

});

}catch(err){

console.error(err);

res.status(500).json({

success:false

});

}

});


app.get(
"/catatan/:userid/:slug",
async (req,res)=>{

try{

const [users] =
await db.query(
`SELECT id,email
FROM users
WHERE id = ?
LIMIT 1`,
[
req.params.userid
]
);

if(!users.length){

return res.send(
"Catatan tidak ditemukan"
);

}

const user =
users[0];

const [catatanRows] =
await db.query(
`SELECT notes
FROM catatan
WHERE email = ?
LIMIT 1`,
[
user.email
]
);

if(!catatanRows.length){

return res.send(
"Catatan tidak ditemukan"
);

}

let notes = {};

try{

notes =
JSON.parse(
catatanRows[0].notes || "{}"
);

}catch{

notes = {};

}

const normalize = (str) =>
  str.toLowerCase().replace(/[^a-z0-9]/g, "-");

const note =
Object.keys(notes).find(name => {
  return normalize(name) === normalize(req.params.slug);
});

if(!note){
  return res.send("Catatan tidak ditemukan");
}

const noteData = notes[note];

if(!noteData){
  return res.send("Catatan tidak ditemukan");
}



if(noteData.type === "autorekap"){

return res.send(`
<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${note}</title>

<style>

body{
background:linear-gradient(135deg,#fff7fb,#ffe4f1);
padding:8px;
font-family:Poppins,sans-serif;
margin:0;
}

.main{
background:#fff;
border-radius:16px;
padding:15px;
border:1px solid #ffd4ea;
}

.filter-text{
cursor:pointer;
color:#ec4899;
font-size:13px;
font-weight:600;
}

.table-wrap{
overflow:auto;
max-height:65vh;
border:1px solid #ffd4ea;
border-radius:10px;
}

table{
width:100%;
border-collapse:collapse;
}

th,td{
border:1px solid #ffd4ea;
padding:6px;
font-size:13px;
white-space:nowrap;
}

th{
background:#fff0f7;
color:#be185d;
position:sticky;
top:0;
}

.rekap-summary{
margin-top:15px;
background:#fff5fa;
padding:15px;
border-radius:12px;
font-weight:600;
color:#ec4899;
}

.nav-warna{
display:flex;
justify-content:flex-end;
align-items:center;
gap:15px;
margin-top:10px;
font-weight:700;
color:#ec4899;
}

.nav-btn{
cursor:pointer;
user-select:none;
}

.nav-btn:hover{
opacity:.8;
}

</style>
</head>

<body>

<div class="main">

<h2 style="color:#ec4899">
📊 ${note}
</h2>

<div id="hasilRekap"></div>

</div>

<script>

let data = ${JSON.stringify(noteData.data || [])};

let selectedColor = '';
let activeFilterColor = '';
let warnaList = [];
let warnaIndex = 0;

function setColor(color){
selectedColor = color;
}

function warnaiBaris(index){

if(!selectedColor){
alert('Pilih warna terlebih dahulu');
return;
}

data[index].warna = selectedColor;
render();
}

function filterColor(){

warnaList = [
...new Set(
data
.map(x => x.warna)
.filter(Boolean)
)
];

if(!warnaList.length){
alert('Belum ada warna yang dipilih');
return;
}

warnaIndex = 0;
activeFilterColor = warnaList[0];

render();
}

function resetFilterColor(){

activeFilterColor = '';
warnaIndex = 0;

render();
}

function nextWarna(){

if(!warnaList.length) return;

warnaIndex++;

if(warnaIndex >= warnaList.length){
warnaIndex = 0;
}

activeFilterColor = warnaList[warnaIndex];

render();
}

function prevWarna(){

if(!warnaList.length) return;

warnaIndex--;

if(warnaIndex < 0){
warnaIndex = warnaList.length - 1;
}

activeFilterColor = warnaList[warnaIndex];

render();
}

function render(){

let total = 0;
let totalBersih = 0;

let html = '';

html += '<div style="display:flex;gap:8px;margin-bottom:15px;">';

html += '<button onclick="setColor(\\'#fff9c4\\')">🟨</button>';
html += '<button onclick="setColor(\\'#dbeafe\\')">🟦</button>';
html += '<button onclick="setColor(\\'#dcfce7\\')">🟩</button>';
html += '<button onclick="setColor(\\'#fce7f3\\')">🩷</button>';

html += '<span class="filter-text" onclick="filterColor()">🎨 Sortir</span>';
html += '<span class="filter-text" onclick="resetFilterColor()">👁️ Lihat Semua</span>';

html += '</div>';

html += '<div class="table-wrap">';
html += '<table>';

html += '<thead>';
html += '<tr>';
html += '<th>Username</th>';
html += '<th>No Pesanan</th>';
html += '<th>Nominal</th>';
html += '<th>Hasil Bersih</th>';
html += '</tr>';
html += '</thead>';

html += '<tbody>';

data.forEach((row,index)=>{

if(
activeFilterColor &&
row.warna !== activeFilterColor
){
return;
}

const nominal =
parseInt(
String(row.nominal || 0)
.replace(/\\./g,'')
) || 0;

const hasil =
Math.floor(nominal * 0.9);

total += nominal;
totalBersih += hasil;

html += '<tr onclick="warnaiBaris('+index+')" style="background:'+(row.warna || '')+';cursor:pointer;">';
html += '<td>'+ (row.username || '') +'</td>';
html += '<td>'+ (row.pesanan || '') +'</td>';
html += '<td>'+ (row.nominal || 0) +'</td>';
html += '<td>'+ hasil.toLocaleString('id-ID') +'</td>';
html += '</tr>';

});

html += '</tbody>';
html += '</table>';
html += '</div>';

if(activeFilterColor){

html += '<div class="nav-warna">';
html += '<span class="nav-btn" onclick="prevWarna()">⬅ Back</span>';
html += '<span>'+(warnaIndex+1)+' / '+warnaList.length+'</span>';
html += '<span class="nav-btn" onclick="nextWarna()">Lanjut ➡</span>';
html += '</div>';

}

const jumlahPesanan =
data.filter(x =>
!activeFilterColor ||
x.warna === activeFilterColor
).length;

html += '<div class="rekap-summary">';
html += '📦 Total Pesanan : '+jumlahPesanan+'<br>';
html += '💰 Total Penghasilan : Rp '+total.toLocaleString('id-ID')+'<br>';
html += '✅ Total Bersih : Rp '+totalBersih.toLocaleString('id-ID');

if(activeFilterColor){

html += '<br><br>';
html += '🎨 Warna Aktif : ';
html += '<span style="display:inline-block;width:14px;height:14px;border-radius:50%;background:'+activeFilterColor+';border:1px solid #ccc;vertical-align:middle;margin-left:5px;"></span>';

}

html += '</div>';

document.getElementById('hasilRekap').innerHTML = html;

}

render();

</script>

</body>
</html>
`);

}


/* =========================
HALAMAN TRANSAKSI
========================= */

if(noteData.type === "transaksi"){

let rows = "";

(noteData.data || [])
.forEach(row=>{

if(
!row.username ||
!String(row.username).trim()
){
return;
}

let color="#9ca3af";

if(row.status==="Dikemas"){
color="#3b82f6";
}

if(row.status==="Dikirim"){
color="#2563eb";
}

if(row.status==="Selesai"){
color="#22c55e";
}

if(row.status==="Dibatalkan"){
color="#ef4444";
}

if(row.status==="Menunggu Remit Otomatis"){
color="#f59e0b";
}

rows += `

<tr>
<td>${row.username || "-"}</td>
<td>
<span
style="
background:${color};
color:#fff;
padding:6px 12px;
border-radius:999px;
font-size:12px;
font-weight:600;
display:inline-block;
">
${row.status}
</span>
</td>
</tr>
`;

});

return res.send(`

<!DOCTYPE html>

<html lang="id">
<head>

<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">

<title>${note}</title>

<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">

<style>

*{
margin:0;
padding:0;
box-sizing:border-box;
font-family:'Inter',sans-serif;
}

body{

background:
linear-gradient(
180deg,
#fff7fb,
#ffffff
);

padding:20px;
min-height:100vh;

}

.container{
max-width:900px;
margin:auto;
}

.card{

background:#fff;

border:1px solid #f3d4e5;

border-radius:24px;

overflow:hidden;

box-shadow:
0 10px 35px rgba(236,72,153,.08);

}

.header{

padding:28px;

background:
linear-gradient(
135deg,
#ec4899,
#db2777
);

color:#fff;

}

.header h1{

font-size:24px;
font-weight:700;

word-break:break-word;

}

.header p{

margin-top:6px;
opacity:.9;

}

.content{
padding:24px;
}

.table-wrap{
overflow-x:auto;
}

table{
width:100%;
border-collapse:collapse;
}

th{

background:#fafafa;

color:#6b7280;

padding:14px;

text-align:left;

font-size:13px;

border-bottom:1px solid #eee;

}

td{

padding:14px;

border-bottom:1px solid #f3f4f6;

font-size:14px;

}

tr:hover{
background:#fafafa;
}

.footer{

padding:16px;

text-align:center;

font-size:12px;

color:#9ca3af;

border-top:1px solid #f3f4f6;

}

@media(max-width:768px){

body{
padding:10px;
}

.header{
padding:20px;
}

.header h1{
font-size:18px;
}

.content{
padding:14px;
}

th,
td{
padding:10px;
font-size:12px;
}

}

@media(prefers-color-scheme:dark){

body{
background:#0f172a;
}

.card{
background:#111827;
border-color:#1f2937;
}

th{
background:#1f2937;
color:#d1d5db;
border-bottom-color:#374151;
}

td{
color:#f3f4f6;
border-bottom-color:#1f2937;
}

tr:hover{
background:#1f2937;
}

.footer{
border-top-color:#1f2937;
}

}

</style>

</head>

<body>

<div class="container">

<div class="card">

<div class="header">
<h1>📦 ${note}</h1>
<p>Data transaksi yang dibagikan</p>
</div>

<div class="content">

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

<div class="footer">
Dibagikan melalui SeraPay
</div>

</div>

</div>

</body>
</html>
`);

}

/* =========================
HALAMAN CATATAN
========================= */

return res.send(`

<!DOCTYPE html>

<html lang="id">
<head>

<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">

<title>${note}</title>

<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">

<style>

*{
margin:0;
padding:0;
box-sizing:border-box;
font-family:'Inter',sans-serif;
}

body{

background:
linear-gradient(
180deg,
#fff7fb,
#ffffff
);

padding:20px;
min-height:100vh;

}

.container{
max-width:900px;
margin:auto;
}

.card{

background:#fff;

border:1px solid #f3d4e5;

border-radius:24px;

overflow:hidden;

box-shadow:
0 10px 35px rgba(236,72,153,.08);

}

.header{

padding:28px;

background:
linear-gradient(
135deg,
#ec4899,
#db2777
);

color:#fff;

}

.header h1{

font-size:24px;
font-weight:700;

word-break:break-word;

}

.header p{

margin-top:6px;
opacity:.9;

}

.content{

padding:28px;

font-size:15px;

line-height:1.9;

color:#374151;

word-break:break-word;

}

.footer{

padding:16px;

text-align:center;

font-size:12px;

color:#9ca3af;

border-top:1px solid #f3f4f6;

}

@media(max-width:768px){

body{
padding:10px;
}

.header{
padding:20px;
}

.header h1{
font-size:18px;
}

.content{
padding:18px;
font-size:14px;
}

}

@media(prefers-color-scheme:dark){

body{
background:#0f172a;
}

.card{
background:#111827;
border-color:#1f2937;
}

.content{
color:#f3f4f6;
}

.footer{
border-top-color:#1f2937;
}

}

</style>

</head>

<body>

<div class="container">

<div class="card">

<div class="header">
<h1>📝 ${note}</h1>
<p>Catatan yang dibagikan</p>
</div>

<div class="content">
${noteData.content || ""}
</div>

<div class="footer">
Dibagikan melalui Gaslur
</div>

</div>

</div>

</body>
</html>
`);

}catch(err){

console.error(err);

res.status(500).send(
"Server error"
);

}

});


app.get("/api/me", authMiddleware, async (req, res) => {

  try {

    if (!req.user?.email) {
      return res.json({
        success: false
      });
    }

    const [rows] = await pool.query(
      `SELECT
        id,
        name,
        email,
        saldo,
        reward
      FROM users
      WHERE email=?`,
      [req.user.email]
    );

    if (rows.length === 0) {
      return res.json({
        success: false
      });
    }

    const user = rows[0];

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        saldo: Number(user.saldo || 0),
        reward: Number(user.reward || 0)
      }
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      success: false
    });

  }

});

app.get("/api/riwayat", authMiddleware, async (req, res) => {

  const [users] = await pool.query(
    "SELECT id FROM users WHERE email=?",
    [req.user.email]
  );

  if (!users.length) {
    return res.json({
      success: false
    });
  }

  const userId = users[0].id;

  const [history] = await pool.query(
    `SELECT *
     FROM history
     WHERE user_id=?
     ORDER BY created_at DESC`,
    [userId]
  );

  res.json({
    success: true,
    history: history.map(h => ({
      ...h,
      data: JSON.parse(h.data || "[]")
    }))
  });

});

app.get("/api/active-orders", authMiddleware, async (req, res) => {

  const [users] = await pool.query(
    "SELECT id FROM users WHERE email=?",
    [req.user.email]
  );

  if (!users.length) {
    return res.json({
      success: false
    });
  }

  const userId = users[0].id;

  const [history] = await pool.query(
    `SELECT *
     FROM history
     WHERE user_id=?
     AND status IN (
       'active',
       'pending_refund',
       'refunded',
       'refund_rejected'
     )
     ORDER BY created_at DESC`,
    [userId]
  );

  const data = history.map(h => ({
    ...h,
    data: JSON.parse(h.data || "[]")
  }));

  res.json({
    success: true,
    data
  });

});

app.post("/api/order/done", authMiddleware, async (req, res) => {

  try {

    const { orderId } = req.body;

const [users] = await pool.query(
  "SELECT id FROM users WHERE email=?",
  [req.user.email]
);

if (!users.length) {
  return res.json({
    success:false
  });
}

const userId = users[0].id;

const [result] = await pool.query(
  `UPDATE history
   SET status='done'
   WHERE id=?
   AND user_id=?`,
  [
    orderId,
    userId
  ]
);

    if (result.affectedRows === 0) {
      return res.json({
        success: false,
        message: "Order tidak ditemukan"
      });
    }

    io.to(req.user.email).emit(
      "orderUpdate",
      {
        type: "done"
      }
    );

    res.json({
      success: true
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      success: false
    });

  }

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

    const [rows] = await pool.execute(
      "SELECT * FROM users WHERE email=? LIMIT 1",
      [req.user.email]
    );

    if (!rows.length) {
      return res.json({
        success: false,
        message: "User tidak ditemukan"
      });
    }

    const user = rows[0];

    const referenceId = "TOPUP-" + Date.now();

    const body = {
      product: ["Topup Saldo"],
      qty: ["1"],
      price: [String(nominal)],
      amount: String(nominal),
      returnUrl: "https://gaslur.site/success",
      cancelUrl: "https://gaslur.site/cancel",
      notifyUrl: "https://gaslur.site/api/ipaymu/callback",
      referenceId,
      buyerName: user.name,
      buyerPhone: user.phone,
      buyerEmail: user.email,
      paymentMethod: "qris"
    };

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
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "va": IPAYMU_VA,
          "signature": signature,
          "timestamp": timestamp
        }
      }
    );

    console.log(
      "IPAYMU:",
      JSON.stringify(
        response.data,
        null,
        2
      )
    );

    const now = Date.now();

    const qrUrl =
      response.data?.Data?.qrContent ||
      response.data?.Data?.QrString ||
      response.data?.Data?.qrString ||
      "";

const totalBayar = Number(
  response.data?.Data?.Total ||
  response.data?.Data?.total ||
  nominal
);

await pool.execute(
  `INSERT INTO topup
  (
    reference_id,
    user_email,
    nominal,
    qr_url,
    status,
    time,
    expired_at
  )
  VALUES (?, ?, ?, ?, ?, ?, ?)`,
  [
    referenceId,
    user.email,
    totalBayar,
    qrUrl,
    "waiting_payment",
    now,
    now + (24 * 60 * 60 * 1000)
  ]
);

    return res.json({
      success: true,
      payment: response.data?.Data || response.data
    });

  } catch (err) {

    console.log(
      "IPAYMU ERROR:",
      err.response?.data || err.message
    );

    return res.json({
      success: false,
      message:
        err.response?.data?.Message ||
        "Internet error, coba lagi"
    });

  }
});

app.post("/api/ipaymu/callback", async (req, res) => {

  try {

    const rawBody = req.rawBodyBuffer.toString();

    const timestamp = req.headers["x-timestamp"];
    const externalId = req.headers["x-external-id"];
    const receivedSignature = req.headers["x-signature"];

    const stringToSign =
      `${timestamp}:${externalId}:${rawBody}`;

    const calculatedSignature = crypto
      .createHmac("sha256", IPAYMU_API_KEY)
      .update(stringToSign)
      .digest("hex");

    console.log("========== CALLBACK ==========");
    console.log("SIGNATURE IPAYMU:", receivedSignature);
    console.log("SIGNATURE KITA:", calculatedSignature);

    const isSandbox =
      process.env.NODE_ENV !== "production";

    if (calculatedSignature !== receivedSignature) {

      if (!isSandbox) {
        return res
          .status(400)
          .send("Invalid Signature");
      }

    } else {

      console.log("✅ SIGNATURE VALID");

    }

    const data = req.body;

    const referenceId =
      data.reference_id ||
      data.sid;

    const [rows] = await pool.execute(
      `SELECT *
       FROM topup
       WHERE reference_id=?
       LIMIT 1`,
      [referenceId]
    );

    if (!rows.length) {

      console.log(
        "⚠️ TOPUP TIDAK DITEMUKAN:",
        referenceId
      );

      return res.status(200).send("OK");
    }

    const trx = rows[0];

    const statusCode =
      Number(data.status_code);

    if (statusCode === 1) {

const amount = Number(
  data.paid_off ||
  trx.nominal ||
  0
);

      // Anti saldo dobel
      const [updateResult] = await pool.execute(
        `UPDATE topup
         SET status='success'
         WHERE reference_id=?
         AND status!='success'`,
        [referenceId]
      );

      if (updateResult.affectedRows === 0) {

        console.log(
          "⚠️ SUDAH DIPROSES:",
          referenceId
        );

        return res.status(200).send("OK");
      }

      await pool.execute(
        `UPDATE users
         SET saldo = saldo + ?
         WHERE email=?`,
        [
          amount,
          trx.user_email
        ]
      );

      console.log(
        "💰 SALDO MASUK:",
        amount
      );

    }

    else if (statusCode === 0) {

      await pool.execute(
        `UPDATE topup
         SET status='pending'
         WHERE reference_id=?`,
        [referenceId]
      );

      console.log(
        "⏳ MASIH PENDING:",
        referenceId
      );

    }

    else if (statusCode === -2) {

      await pool.execute(
        `UPDATE topup
         SET status='expired'
         WHERE reference_id=?`,
        [referenceId]
      );

      console.log(
        "⌛ EXPIRED:",
        referenceId
      );

    }

    else {

      await pool.execute(
        `UPDATE topup
         SET status='failed'
         WHERE reference_id=?`,
        [referenceId]
      );

      console.log(
        "❌ TRANSAKSI GAGAL:",
        referenceId
      );

    }

    return res
      .status(200)
      .send("OK");

  } catch (err) {

    console.log(
      "❌ ERROR:",
      err.message
    );

    return res
      .status(500)
      .send("Server Error");

  }

});

app.get("/api/topup", authMiddleware, async (req, res) => {

  try {

    const now = Date.now();

    // auto expire transaksi yang lewat waktu
    await pool.execute(
      `UPDATE topup
       SET status='expired'
       WHERE status='waiting_payment'
       AND expired_at IS NOT NULL
       AND expired_at < ?`,
      [now]
    );

    const [rows] = await pool.execute(
      `SELECT *
       FROM topup
       WHERE user_email=?
       ORDER BY time DESC`,
      [req.user.email]
    );

    return res.json({
      success: true,
      data: rows
    });

  } catch (err) {

    console.error(err);

    return res.json({
      success: false,
      message: "Server Error"
    });

  }

});

app.get(
  "/api/topup/active",
  authMiddleware,
  async (req, res) => {

    try {

      const now = Date.now();

      const [rows] = await pool.execute(
        `SELECT *
         FROM topup
         WHERE user_email=?
         AND status='waiting_payment'
         AND expired_at > ?
         ORDER BY time DESC
         LIMIT 1`,
        [
          req.user.email,
          now
        ]
      );

      if (!rows.length) {

        return res.json({
          success: false
        });

      }

      return res.json({

        success: true,

        data: rows[0]

      });

    } catch (err) {

      console.error(err);

      return res.json({
        success: false,
        message: "Server Error"
      });

    }

  }
);

app.post(
  "/api/topup/cancel",
  authMiddleware,
  async (req, res) => {

    try {

      const { referenceId } = req.body;

      if (!referenceId) {

        return res.json({
          success: false
        });

      }

      const [rows] = await pool.execute(
        `SELECT *
         FROM topup
         WHERE reference_id=?
         AND user_email=?
         LIMIT 1`,
        [
          referenceId,
          req.user.email
        ]
      );

      if (!rows.length) {

        return res.json({
          success: false
        });

      }

      const trx = rows[0];

      if (
        trx.status !== "waiting_payment"
      ) {

        return res.json({
          success: false
        });

      }

      await pool.execute(
        `UPDATE topup
         SET status='cancelled'
         WHERE reference_id=?
         AND user_email=?`,
        [
          referenceId,
          req.user.email
        ]
      );

      return res.json({
        success: true
      });

    } catch (err) {

      console.error(err);

      return res.json({
        success: false,
        message: "Server Error"
      });

    }

  }
);

app.post("/api/ganti-password", authMiddleware, async (req, res) => {
  const { passwordLama, passwordBaru } = req.body;

  if (!passwordLama || !passwordBaru) {
    return res.json({
      success: false,
      message: "Data tidak lengkap"
    });
  }

  try {

    const [rows] = await pool.query(
      "SELECT password FROM users WHERE email=?",
      [req.user.email]
    );

    if (rows.length === 0) {
      return res.json({
        success: false,
        message: "User tidak ditemukan"
      });
    }

    const user = rows[0];

    const match = await bcrypt.compare(
      passwordLama,
      user.password
    );

    if (!match) {
      return res.json({
        success: false,
        message: "Password lama salah"
      });
    }

    const hash = await bcrypt.hash(
      passwordBaru,
      10
    );

    await pool.query(
      "UPDATE users SET password=? WHERE email=?",
      [
        hash,
        req.user.email
      ]
    );

    res.json({
      success: true,
      message: "Password berhasil diubah"
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server"
    });

  }
});

app.get("/api/admin/data", async (req, res) => {

  try {

    const [topups] = await pool.query(`
      SELECT
        id,
        user_email,
        nominal,
        status,
        time
      FROM topup
    `);

    const [refunds] = await pool.query(`
      SELECT
        id,
        user_email,
        order_id,
        alasan,
        nominal,
        status,
        time
      FROM refund
    `);

    const result = [];

    topups.forEach(t => {
      result.push({
        type: "topup",
        email: t.user_email,
        id: t.id,
        nominal: t.nominal,
        status: t.status,
        time: t.time
      });
    });

    refunds.forEach(r => {
      result.push({
        type: "refund",
        email: r.user_email,
        id: r.id,
        alasan: r.alasan || "-",
        orderId: r.order_id,
        nominal: r.nominal,
        status: r.status,
        time: r.time
      });
    });

    result.sort(
      (a, b) =>
        Number(b.time || 0) -
        Number(a.time || 0)
    );

    res.json({
      success: true,
      data: result
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      success: false,
      message: "Server error"
    });

  }

});

app.post("/api/admin/refund/approve", async (req, res) => {

  try {

    const { email, orderId } = req.body;

    const [refundRows] = await pool.execute(
      `SELECT *
       FROM refund
       WHERE user_email=?
       AND order_id=?
       LIMIT 1`,
      [email, orderId]
    );

    if (!refundRows.length) {
      return res.json({
        success: false,
        message: "Refund tidak ditemukan"
      });
    }

    const trx = refundRows[0];

    if (trx.status !== "pending") {
      return res.json({
        success: false,
        message: "Refund sudah diproses"
      });
    }

    const [users] = await pool.execute(
      `SELECT id
       FROM users
       WHERE email=?
       LIMIT 1`,
      [email]
    );

    if (!users.length) {
      return res.json({
        success: false,
        message: "User tidak ditemukan"
      });
    }

    const userId = users[0].id;

    // approve refund
    await pool.execute(
      `UPDATE refund
       SET status='approved'
       WHERE id=?`,
      [trx.id]
    );

    // tambah saldo user
    await pool.execute(
      `UPDATE users
       SET saldo = saldo + ?
       WHERE email=?`,
      [
        Number(trx.nominal),
        email
      ]
    );

    // update status order
    await pool.execute(
      `UPDATE history
       SET status='refunded'
       WHERE id=? AND user_id=?`,
      [
        orderId,
        userId
      ]
    );

    io.to(email).emit(
      "orderUpdate",
      {
        type: "refund_approved",
        orderId
      }
    );

    res.json({
      success: true
    });

  } catch (err) {

    console.error(
      "REFUND APPROVE ERROR:",
      err
    );

    res.status(500).json({
      success: false
    });

  }

});

app.post("/api/admin/refund/reject", async (req, res) => {

  try {

    const { email, orderId } = req.body;

    const [refundRows] = await pool.execute(
      `SELECT *
       FROM refund
       WHERE user_email=?
       AND order_id=?
       LIMIT 1`,
      [email, orderId]
    );

    if (!refundRows.length) {
      return res.json({
        success: false,
        message: "Refund tidak ditemukan"
      });
    }

    const trx = refundRows[0];

    if (trx.status !== "pending") {
      return res.json({
        success: false,
        message: "Refund sudah diproses"
      });
    }

    const [users] = await pool.execute(
      `SELECT id
       FROM users
       WHERE email=?
       LIMIT 1`,
      [email]
    );

    if (!users.length) {
      return res.json({
        success: false,
        message: "User tidak ditemukan"
      });
    }

    const userId = users[0].id;

    // update refund
    await pool.execute(
      `UPDATE refund
       SET status='rejected'
       WHERE id=?`,
      [trx.id]
    );

    // update status order
    await pool.execute(
      `UPDATE history
       SET status='refund_rejected'
       WHERE id=? AND user_id=?`,
      [
        orderId,
        userId
      ]
    );

    io.to(email).emit(
      "orderUpdate",
      {
        type: "refund_rejected",
        orderId
      }
    );

    res.json({
      success: true
    });

  } catch (err) {

    console.error(
      "REFUND REJECT ERROR:",
      err
    );

    res.status(500).json({
      success: false
    });

  }

});

app.post("/api/refund", authMiddleware, async (req, res) => {

  try {

    const { id, orderId, nominal, alasan } = req.body;

    if (!orderId) {
      return res.json({
        success: false,
        message: "Order ID tidak valid"
      });
    }

    if (!nominal || Number(nominal) <= 0) {
      return res.json({
        success: false,
        message: "Nominal refund tidak valid"
      });
    }

    const [users] = await pool.execute(
      `SELECT id, email
       FROM users
       WHERE email=?`,
      [req.user.email]
    );

    if (!users.length) {
      return res.json({
        success: false,
        message: "User tidak ditemukan"
      });
    }

    const userId = users[0].id;

    const [historyRows] = await pool.execute(
      `SELECT id
       FROM history
       WHERE id=? AND user_id=?
       LIMIT 1`,
      [orderId, userId]
    );

    if (!historyRows.length) {
      return res.json({
        success: false,
        message: "Order tidak ditemukan"
      });
    }

    const [existingRefund] = await pool.execute(
      `SELECT id
       FROM refund
       WHERE user_email=?
       AND order_id=?
       AND status='pending'
       LIMIT 1`,
      [req.user.email, orderId]
    );

    if (existingRefund.length) {
      return res.json({
        success: false,
        message: "Refund sudah diajukan"
      });
    }

    await pool.execute(
      `INSERT INTO refund
      (
        id,
        user_email,
        order_id,
        alasan,
        nominal,
        status,
        time
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        req.user.email,
        orderId,
        alasan || "-",
        Number(nominal),
        "pending",
        Date.now()
      ]
    );

    await pool.execute(
      `UPDATE history
       SET status='pending_refund'
       WHERE id=? AND user_id=?`,
      [orderId, userId]
    );

    io.to(req.user.email).emit("orderUpdate", {
      type: "refund_pending",
      orderId
    });

    res.json({
      success: true,
      message: "Refund berhasil diajukan"
    });

  } catch (err) {

    console.error("REFUND ERROR:", err);

    res.status(500).json({
      success: false,
      message: "Server error"
    });

  }

});

app.get("/api/refund", authMiddleware, async (req, res) => {

  try {

    const [rows] = await pool.execute(
      `SELECT *
       FROM refund
       WHERE user_email=?
       ORDER BY time DESC`,
      [req.user.email]
    );

    res.json({
      success: true,
      data: rows
    });

  } catch (err) {

    console.error("GET REFUND ERROR:", err);

    res.status(500).json({
      success: false,
      message: "Server error"
    });

  }

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

app.get("/api/livechat/history", async (req, res) => {

  try {

    const { email } = req.query;

    if (!email) {
      return res.json({
        success: false
      });
    }

    const [rows] = await pool.query(
      `SELECT
        id,
        sender,
        text,
        file_url AS fileUrl,
        status,
        time
      FROM livechat_messages
      WHERE user_email = ?
      ORDER BY time ASC`,
      [email]
    );

    res.json({
      success: true,
      data: rows
    });

  } catch (err) {

    console.error(err);

    res.json({
      success: false,
      data: []
    });

  }

});

app.get("/api/livechat/messages", async (req, res) => {

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

    const [rows] = await pool.query(
      `
      SELECT
        id,
        sender,
        text,
        file_url,
        status,
        time
      FROM livechat_messages
      WHERE LOWER(user_email) = ?
      ORDER BY time ASC
      `,
      [email]
    );

    const chats = rows.map(msg => ({

      id: msg.id,

      sender:
        msg.sender || "admin",

      text:
        msg.text || "",

      fileUrl:
        msg.file_url || null,

      status:
        msg.status || "sent",

      time:
        Number(msg.time) || Date.now()

    }));

    return res.json({
      success: true,
      messages: chats
    });

  } catch (err) {

    console.error(
      "Livechat messages error:",
      err
    );

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

require("dotenv").config();

const TelegramBot =
require("node-telegram-bot-api");

const BOT_TOKEN =
process.env.BOT_TOKEN;

const CHAT_ID =
process.env.CHAT_ID;

const bot =
new TelegramBot(
BOT_TOKEN,
{
polling:true
}
);

const SETOR_BOT_TOKEN =
process.env.SETOR_BOT_TOKEN;

const SETOR_CHAT_ID =
process.env.SETOR_CHAT_ID;

const setorBot =
new TelegramBot(
SETOR_BOT_TOKEN,
{
polling:true
}
);

const WD_BOT_TOKEN =
process.env.WD_BOT_TOKEN;

const WD_CHAT_ID =
process.env.WD_CHAT_ID;

const wdBot =
new TelegramBot(
WD_BOT_TOKEN,
{
polling:true
}
);

let restockSession = {};
let depositSession = {};

async function kirimSetoranTelegram(
data,
tipe
){

try{

const nama =
data.nama ||
data.Nama ||
"-";

const emailUser =
data.email_user ||
data.EmailUser ||
"-";

const email =
data.email ||
data.Email ||
"-";

const password =
data.password ||
data.Password ||
"-";

const uid =
data.uid ||
data.UID ||
"-";

const harga =
Number(
data.harga ??
data.Harga ??
0
);

const id =
data.transaksi_id ||
data.ID ||
data.id ||
Date.now();

const text =
`📥 SETORAN BARU

Produk : ${tipe}

Nama : ${nama}

Email User :
${emailUser}

Email :
${email}

Password :
${password}

UID :
${uid}

Harga :
Rp${harga.toLocaleString("id-ID")}

ID :
${id}`;

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
`setor_on_${id}_${tipe}`
},
{
text:"❌ TIDAK VALID",
callback_data:
`setor_invalid_${id}_${tipe}`
}
],

[
{
text:"⏸ OFF",
callback_data:
`setor_off_${id}_${tipe}`
}
]

]
}
}
);

}catch(err){

console.log(
"SETOR TELEGRAM:",
err
);

}

}

async function kirimWithdrawTelegram(
data
){

try{

const id =
data.id ||
data.ID;

const nama =
data.nama ||
data.Nama ||
"-";

const emailUser =
data.email_user ||
data.EmailUser ||
"-";

const bank =
data.bank ||
data.Bank ||
"-";

const norek =
data.nomor_rekening ||
data.NomorRekening ||
"-";

const namaRekening =
data.nama_rekening ||
data.NamaRekening ||
"-";

const jumlah =
Number(
data.jumlah ??
data.Jumlah ??
0
);

const text =
`💸 WITHDRAW BARU

Nama :
${nama}

Email :
${emailUser}

Nominal :
Rp${jumlah.toLocaleString("id-ID")}

Bank :
${bank}

No Rekening :
${norek}

Atas Nama :
${namaRekening}

ID :
${id}`;

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
`wd_masuk_${id}`
},
{
text:"❌ Tolak",
callback_data:
`wd_tolak_${id}`
}
]

]
}
}
);

}catch(err){

console.log(
"WD TELEGRAM:",
err
);

}

}

bot.on("callback_query", async (query) => {

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

const nominal =
  Number(
    value.replace("dep_", "")
  );

const [rows] = await pool.execute(
  `
  SELECT *
  FROM users
  WHERE email = ?
  LIMIT 1
  `,
  [
    depositSession[chatId].data.email
  ]
);

if (!rows.length) {
  return;
}

const user = rows[0];

const saldoBaru =
  Number(user.saldo || 0) +
  nominal;

await pool.execute(
  `
  UPDATE users
  SET saldo = saldo + ?
  WHERE email = ?
  `,
  [
    nominal,
    user.email
  ]
);

io.to(user.email).emit(
  "saldoUpdate",
  {
    saldo: saldoBaru
  }
);

await bot.answerCallbackQuery(
  query.id
);

await bot.editMessageText(
  `✅ Deposit berhasil

Email: ${user.email}
Nominal: Rp${nominal.toLocaleString("id-ID")}
Saldo: Rp${saldoBaru.toLocaleString("id-ID")}`,
  {
    chat_id: chatId,
    message_id: query.message.message_id
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

const callbackData =
query.data;

if(
!callbackData.startsWith(
"setor_"
)
){
return;
}

const pecah =
callbackData.split("_");

const status =
pecah[1];

const transaksiId =
pecah[2];

const tipe =
pecah
.slice(3)
.join(" ")
.toLowerCase();

let table = "";

if(
tipe ===
"facebook fresh"
){

table =
"setoran_facebook_fresh";

}
else if(
tipe ===
"gmail fresh"
){

table =
"setoran_gmail_fresh";

}
else if(
tipe ===
"gmail bekas"
){

table =
"setoran_gmail_bekas";

}
else{

return setorBot.answerCallbackQuery(
query.id,
{
text:
"Tipe tidak dikenal"
}
);

}

const [rows] =
await pool.execute(
`
SELECT *
FROM ${table}
WHERE transaksi_id=?
LIMIT 1
`,
[
transaksiId
]
);

if(
!rows.length
){

return setorBot.answerCallbackQuery(
query.id,
{
text:
"ID tidak ditemukan"
}
);

}

const item =
rows[0];

let statusBaru = "";

if(
status === "on"
){
statusBaru = "on";
}
else if(
status === "off"
){
statusBaru = "off";
}
else if(
status === "invalid"
){
statusBaru = "tidak valid";
}
else{

return setorBot.answerCallbackQuery(
query.id,
{
text:
"Status tidak valid"
}
);

}

await pool.execute(
`
UPDATE ${table}
SET status_akun=?
WHERE transaksi_id=?
`,
[
statusBaru,
transaksiId
]
);

// =======================
// MASUKKAN KE STOK PRODUK
// =======================

if(statusBaru === "on"){

  let stokTable = "";

  if(table === "setoran_facebook_fresh"){
    stokTable = "facebook_fresh";
  }

  else if(table === "setoran_gmail_fresh"){
    stokTable = "gmail";
  }

  else if(table === "setoran_gmail_bekas"){
    stokTable = "gmail_bekas";
  }

  await pool.execute(
    `
    INSERT INTO ${stokTable}
    (
      email,
      password,
      status,
      sold_at
    )
    VALUES
    (
      ?,
      ?,
      'tersedia',
      NULL
    )
    `,
    [
      item.email,
      item.password
    ]
  );

}

await setorBot.answerCallbackQuery(
query.id,
{
text:
"Berhasil diubah"
}
);

await setorBot.editMessageText(

`✅ STATUS UPDATE

Produk :
${tipe}

Status :
${statusBaru}

Email :
${item.email}

ID :
${item.transaksi_id}`,

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

try{

await setorBot.answerCallbackQuery(
query.id,
{
text:
"Terjadi kesalahan"
}
);

}catch{}

}

});



wdBot.on(
"callback_query",
async(query)=>{

try{

const data =
query.data;

if(
!data.startsWith(
"wd_"
)
){
return;
}

const pecah =
data.split("_");

const aksi =
pecah[1];

const id =
pecah[2];

const [rows] =
await pool.execute(
`
SELECT *
FROM data_wd
WHERE id=?
LIMIT 1
`,
[
id
]
);

if(
!rows.length
){

return wdBot.answerCallbackQuery(
query.id,
{
text:
"Withdraw tidak ditemukan"
}
);

}

const item =
rows[0];

let statusBaru = "";

if(
aksi === "masuk"
){

statusBaru =
"Berhasil";

}
else if(
aksi === "tolak"
){

statusBaru =
"Ditolak";

}
else{

return wdBot.answerCallbackQuery(
query.id,
{
text:
"Aksi tidak valid"
}
);

}

await pool.execute(
`
UPDATE data_wd
SET status=?
WHERE id=?
`,
[
statusBaru,
id
]
);

await wdBot.editMessageText(

`💸 WITHDRAW UPDATE

Status :
${statusBaru}

Nama :
${item.nama}

Email :
${item.email_user}

Nominal :
Rp${Number(
item.jumlah
).toLocaleString("id-ID")}

Bank :
${item.bank}

Rekening :
${item.nomor_rekening}`,

{
chat_id:
query.message.chat.id,

message_id:
query.message.message_id
}

);

await wdBot.answerCallbackQuery(
query.id,
{
text:
"Berhasil diubah"
}
);

}catch(err){

console.log(
"WD CALLBACK:",
err
);

try{

await wdBot.answerCallbackQuery(
query.id,
{
text:
"Terjadi kesalahan"
}
);

}catch{}

}

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

app.post("/api/livechat/start", async (req, res) => {

  const { name, email } = req.body;

  try {

    const cleanEmail = String(email || "")
      .trim()
      .toLowerCase();

    if (!cleanEmail) {

      return res.json({
        success: false,
        message: "Email kosong"
      });

    }

    await axios.post(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
      {
        chat_id: CHAT_ID,
        text:
`🟢 LIVECHAT BARU

Nama: ${name}
Email: ${cleanEmail}

User memulai chat`
      }
    );

    return res.json({
      success: true
    });

  } catch (err) {

    console.log(
      "LIVECHAT START ERROR:",
      err
    );

    return res.json({
      success: false
    });

  }

});

app.post("/api/livechat/send", async (req, res) => {

  const { name, email, message } = req.body;

  try {

    const cleanEmail = String(email || "")
      .trim()
      .toLowerCase();

    if (
      !cleanEmail ||
      !message
    ) {

      return res.json({
        success: false
      });

    }

    const newMessage = {
      sender: "user",
      text: message,
      fileUrl: null,
      status: "sent",
      time: Date.now()
    };

    const [result] = await pool.execute(
      `
      INSERT INTO livechat_messages
      (
        user_email,
        sender,
        text,
        file_url,
        status,
        time
      )
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        cleanEmail,
        "user",
        message,
        null,
        "sent",
        newMessage.time
      ]
    );

    newMessage.id = result.insertId;

    io.to(cleanEmail).emit(
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
Email: ${cleanEmail}

${message}`
      }
    );

    return res.json({
      success: true,
      messageData: newMessage
    });

  } catch (err) {

    console.log(
      "LIVECHAT SEND ERROR:",
      err
    );

    return res.json({
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

const [result] = await pool.execute(
  `
  INSERT INTO livechat_messages
  (
    user_email,
    sender,
    text,
    file_url,
    status,
    time
  )
  VALUES (?, ?, ?, ?, ?, ?)
  `,
  [
    email.toLowerCase(),
    "user",
    "",
    newMsg.fileUrl,
    "sent",
    newMsg.time
  ]
);

newMsg.id = result.insertId;


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

const emails = [
  ...new Set(
    text
      .split("\n")
      .map(e => e.trim().toLowerCase())
      .filter(Boolean)
  )
];

const fileName =
  session.data.file;

const passwordStok =
  session.data.password;

let berhasil = 0;

try {

  if (fileName === "gmail") {

    const values = emails.map(email => [
      email,
      passwordStok,
      "tersedia"
    ]);

    const [result] = await pool.query(
      `
      INSERT IGNORE INTO gmail
      (
        email,
        password,
        status
      )
      VALUES ?
      `,
      [values]
    );

    berhasil = result.affectedRows;

  }

  else if (fileName === "gmail bekas") {

    const values = emails.map(email => [
      email,
      passwordStok,
      "tersedia"
    ]);

    const [result] = await pool.query(
      `
      INSERT IGNORE INTO gmail_bekas
      (
        email,
        password,
        status
      )
      VALUES ?
      `,
      [values]
    );

    berhasil = result.affectedRows;

  }

  else if (fileName === "fb") {

    const values = emails.map(email => [
      email,
      passwordStok,
      "tersedia"
    ]);

    const [result] = await pool.query(
      `
      INSERT IGNORE INTO facebook_fresh
      (
        email,
        password,
        status
      )
      VALUES ?
      `,
      [values]
    );

    berhasil = result.affectedRows;

  }

  else if (fileName === "gaslur") {

    const values = emails.map(email => [
      email,
      "tersedia"
    ]);

    const [result] = await pool.query(
      `
      INSERT IGNORE INTO gaslur
      (
        email,
        status
      )
      VALUES ?
      `,
      [values]
    );

    berhasil = result.affectedRows;

  }

} catch (err) {

  console.log("RESTOCK ERROR:", err);

  return bot.sendMessage(
    chatId,
    `❌ Gagal restock\n\n${err.message}`
  );

}

const duplikat =
  emails.length - berhasil;

delete restockSession[chatId];

return bot.sendMessage(
  chatId,
  `✅ Restock selesai

Kategori: ${fileName}
Dikirim: ${emails.length}
Masuk: ${berhasil}
Duplikat: ${duplikat}`
);

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

const [rows] = await pool.execute(
  `
  SELECT *
  FROM users
  WHERE email = ?
  LIMIT 1
  `,
  [email]
);

if (!rows.length) {

  return bot.sendMessage(
    chatId,
    "❌ User tidak ditemukan"
  );

}

const user = rows[0];

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

if (
  deposit.step === 2 &&
  deposit.custom
) {

  const nominal = Number(
    text.replace(/\D/g, "")
  );

  if (
    !nominal ||
    nominal <= 0
  ) {

    return bot.sendMessage(
      chatId,
      "❌ Nominal tidak valid"
    );

  }

  const [rows] = await pool.execute(
    `
    SELECT *
    FROM users
    WHERE email = ?
    LIMIT 1
    `,
    [
      deposit.data.email
    ]
  );

  if (!rows.length) {

    delete depositSession[chatId];

    return bot.sendMessage(
      chatId,
      "❌ User hilang"
    );

  }

  const user = rows[0];

  const saldoBaru =
    Number(user.saldo || 0) +
    nominal;

  await pool.execute(
    `
    UPDATE users
    SET saldo = saldo + ?
    WHERE email = ?
    `,
    [
      nominal,
      user.email
    ]
  );

  io.to(user.email).emit(
    "saldoUpdate",
    {
      saldo: saldoBaru
    }
  );

  await bot.sendMessage(
    chatId,
    `✅ Deposit berhasil

Email: ${user.email}
Nominal: Rp${nominal.toLocaleString("id-ID")}
Saldo sekarang: Rp${saldoBaru.toLocaleString("id-ID")}`
  );

  delete depositSession[chatId];

  return;

}

}

const replyText =
  msg.text || msg.caption || "";

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

const [result] = await pool.execute(
  `
  INSERT INTO livechat_messages
  (
    user_email,
    sender,
    text,
    file_url,
    status,
    time
  )
  VALUES (?, ?, ?, ?, ?, ?)
  `,
  [
    email.toLowerCase(),
    "admin",
    newMessage.message || "",
    newMessage.fileUrl || null,
    "sent",
    newMessage.time
  ]
);

newMessage.id = result.insertId;

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

const duration =
req.query.duration || "1";

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

let harga =
Math.ceil(
Number(data[c][s].cost) *
USD_RATE
) + PROFIT;

if(duration == "2"){
    harga += 1000;
}

prices.push({
    price: harga,
    count: data[c][s].count || 0
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
operator,
duration
} = req.body;

// ================= USER =================

const [rows] = await pool.execute(
  "SELECT * FROM users WHERE email=? LIMIT 1",
  [req.user.email]
);

if (!rows.length) {
  return res.status(401).json({
    success: false,
    message: "User tidak ditemukan"
  });
}

const user = rows[0];

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

// Tambahan untuk rental 1 hari
if(String(duration) === "2"){
    hargaJual += 1000;
}

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

const heroParams = {
api_key: process.env.HEROSMS_API_KEY,
service,
country,
operator
};

if (String(duration) === "2") {

    heroParams.action = "getRentNumber";
    heroParams.duration = 24;

} else {

    heroParams.action = "getNumber";

}

const { data } = await axios.get(
HEROSMS_API,
{
    params: heroParams
}
);

// ================= BERHASIL =================

if(
(typeof data === "string" &&
data.startsWith("ACCESS_NUMBER"))
||
(typeof data === "object" &&
data.activationId)
){

let parts;

if(typeof data === "string"){

    parts = data.split(":");

}else{

    parts = [
        "",
        data.activationId,
        data.phoneNumber
    ];

}

/* ================= POTONG SALDO ================= */

const saldoBaru =
  Number(user.saldo || 0) -
  Number(hargaJual);

await pool.execute(
  `UPDATE users
   SET saldo=?
   WHERE email=?`,
  [
    saldoBaru,
    req.user.email
  ]
);

/* ================= SIMPAN HISTORY ================= */

await pool.execute(
  `INSERT INTO otp_history
  (
    activation_id,
    duration,
    user_email,
    service,
    service_name,
    country,
    country_name,
    country_logo,
    operator,
    number,
    harga,
    status,
    messages,
    sms_received,
    time
  )
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  [
    parts[1],
    duration || "1",
    req.user.email,
    service,
    req.body.serviceName || service,
    country,
    req.body.countryName || country,
    req.body.countryLogo || "",
    operator,
    parts[2],
    hargaJual,
    "active",
    JSON.stringify([]),
    0,
    Date.now()
  ]
);

/* SIMPAN ORDER */

await pool.execute(
  `INSERT INTO otp_orders
  (
    user_email,
    activation_id,
    phone_number,
    duration,
    service,
    service_name,
    country,
    country_name,
    country_logo,
    operator,
    harga,
    sms_received,
    waiting_resend,
    messages,
    time
  )
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  [
    req.user.email,
    parts[1],
    parts[2],
    duration || "1",
    service,
    req.body.serviceName || service,
    country,
    req.body.countryName || country,
    req.body.countryLogo || "",
    operator,
    hargaJual,
    0,
    0,
    JSON.stringify([]),
    Date.now()
  ]
);

// ambil saldo terbaru setelah transaksi
const [saldoRows] = await pool.execute(
  "SELECT saldo FROM users WHERE email=? LIMIT 1",
  [req.user.email]
);

return res.json({

  success: true,

  activation_id: parts[1],

  number: parts[2],

  service,

  logo: "/css/img/avatar5.png",

  saldo: saldoBaru

});

}

// ================= GAGAL =================

let errorMessage;

if (typeof data === "string") {
    errorMessage = data.trim();
} else if (data?.title) {
    errorMessage = data.title;
} else if (data?.message) {
    errorMessage = data.message;
} else {
    errorMessage = JSON.stringify(data);
}

const errorMap = {
    NO_NUMBERS: "Stok habis",
    NO_BALANCE: "L01",
    BAD_KEY: "API Key tidak valid",
    ERROR_SQL: "F00"
};

for (const [key, value] of Object.entries(errorMap)) {
    if (errorMessage.includes(key)) {
        errorMessage = value;
        break;
    }
}

return res.status(400).json({
    success: false,
    message: errorMessage
});

} catch (err) {

    const apiError = err.response?.data;

    console.log(
        "ORDER ERROR:",
        apiError || err.message || err
    );

    const errorMap = {
        NO_NUMBERS: "Stok habis",
        NO_BALANCE: "L01",
        BAD_KEY: "API Key tidak valid",
        ERROR_SQL: "F00"
    };

    let errorMessage;

    if (typeof apiError === "string") {
        errorMessage = apiError;
    } else if (apiError?.title) {
        errorMessage = apiError.title;
    } else if (apiError?.message) {
        errorMessage = apiError.message;
    } else {
        errorMessage = err.message;
    }

    for (const [key, value] of Object.entries(errorMap)) {
        if (errorMessage.includes(key)) {
            errorMessage = value;
            break;
        }
    }

    return res.status(400).json({
        success: false,
        message: errorMessage
    });

}

});


app.get(
  "/api/otp/orders",
  authMiddleware,
  async (req, res) => {

    try {

      const [rows] = await pool.execute(
        `SELECT *
         FROM otp_orders
         WHERE user_email=?
         ORDER BY time DESC`,
        [req.user.email]
      );

      return res.json({
        success: true,
        data: rows
      });

    } catch (err) {

      console.error(err);

      return res.status(500).json({
        success: false,
        message: "Server Error"
      });

    }

  }
);

const lastSmsByActivation = {};

/* CHECK SMS */

app.get("/api/otp/sms/:id", async (req, res) => {

  try {

    const id = req.params.id;

    const { data } = await axios.get(
      HEROSMS_API,
      {
        params: {
          api_key:
            process.env.HEROSMS_API_KEY,
          action: "getStatus",
          id
        }
      }
    );

    const messages = [];

    if (
      typeof data === "string" &&
      data.startsWith("STATUS_OK")
    ) {

      const smsText = data
        .replace("STATUS_OK:", "")
        .trim();

      if (
        lastSmsByActivation[id] !== smsText
      ) {

        lastSmsByActivation[id] =
          smsText;

        const smsData = {
          id: Date.now(),
          text: smsText
        };

        // ambil order OTP
        const [orders] =
          await pool.execute(
            `SELECT *
             FROM otp_orders
             WHERE activation_id=?
             LIMIT 1`,
            [id]
          );

if (orders.length) {

  const order = orders[0];

  let orderMessages = [];

  try {

    orderMessages =
      JSON.parse(
        order.messages || "[]"
      );

  } catch {

    orderMessages = [];

  }

  const exists =
    orderMessages.find(
      m => m.text === smsText
    );

  if (!exists) {

    orderMessages.push(
      smsData
    );

    await pool.execute(
      `UPDATE otp_orders
       SET
         sms_received=1,
         waiting_resend=0,
         last_new_message_id=?,
         messages=?
       WHERE activation_id=?`,
      [
        smsData.id,
        JSON.stringify(orderMessages),
        id
      ]
    );

    const [historyRows] =
      await pool.execute(
        `SELECT messages
         FROM otp_history
         WHERE activation_id=?
         LIMIT 1`,
        [id]
      );

    if (historyRows.length) {

      let historyMessages = [];

      try {

        historyMessages =
          JSON.parse(
            historyRows[0].messages ||
            "[]"
          );

      } catch {

        historyMessages = [];

      }

      const historyExists =
        historyMessages.find(
          m => m.text === smsText
        );

      if (!historyExists) {

        historyMessages.push(
          smsData
        );

      }

      await pool.execute(
        `UPDATE otp_history
         SET
           messages=?,
           sms_received=1
         WHERE activation_id=?`,
        [
          JSON.stringify(
            historyMessages
          ),
          id
        ]
      );

    }

  }

}

        messages.push({
          id: smsText,
          text: smsText
        });

      }

    }

    return res.json({
      messages
    });

  } catch (err) {

    console.error(err);

    return res.json({
      messages: []
    });

  }

});

/* RESEND SMS */

app.post("/api/otp/resend", async (req, res) => {

  try {

    await axios.get(
      HEROSMS_API,
      {
        params: {
          api_key:
            process.env.HEROSMS_API_KEY,

          action: "setStatus",

          id:
            req.body.activation_id,

          status: 3
        }
      }
    );

    await pool.execute(
      `UPDATE otp_orders
       SET waiting_resend=1
       WHERE activation_id=?`,
      [
        req.body.activation_id
      ]
    );

    return res.json({
      success: true
    });

  } catch (err) {

    console.error(err);

    return res.status(500).json({
      success: false
    });

  }

});

/* EXTEND RENT */

app.post(
"/api/otp/extend",
authMiddleware,
async (req,res)=>{

try{

const activationId =
req.body.activation_id;

if(!activationId){

return res.status(400).json({
success:false,
message:"Activation ID kosong"
});

}

/* ================= USER ================= */

const [userRows] = await pool.execute(
  `SELECT *
   FROM users
   WHERE email=?
   LIMIT 1`,
  [req.user.email]
);

if (!userRows.length) {

  return res.status(401).json({
    success: false,
    message: "User tidak ditemukan"
  });

}

const user = userRows[0];

/* ================= ORDER ================= */

const [orderRows] = await pool.execute(
  `SELECT *
   FROM otp_orders
   WHERE activation_id=?
   AND user_email=?
   LIMIT 1`,
  [
    activationId,
    req.user.email
  ]
);

if (!orderRows.length) {

  return res.status(404).json({
    success: false,
    message: "Order tidak ditemukan"
  });

}

const order = orderRows[0];

/* ================= HITUNG BIAYA EXTEND ================= */

/*
Contoh:
harga order awal = 4.000
extend = 4.000 + 1.000
= 5.000
*/

const extendPrice =
Number(order.harga || 0) + 500;

/* ================= CEK SALDO ================= */

if (
  Number(user.saldo || 0) < extendPrice
) {

  return res.status(400).json({
    success: false,
    message:
      `Saldo tidak cukup. Minimal Rp${extendPrice.toLocaleString("id-ID")}`
  });

}

/* ================= PROLONG HEROSMS ================= */

const { data } = await axios.post(
  HEROSMS_API,
  null,
  {
    params: {
      api_key:
        process.env.HEROSMS_API_KEY,

      action: "prolong",

      id: activationId,

      duration: 24
    }
  }
);

/* ================= BERHASIL ================= */

if (
  String(data)
    .toUpperCase()
    .includes("ACCESS")
  ||
  String(data)
    .toUpperCase()
    .includes("SUCCESS")
) {

  const saldoBaru =
    Number(user.saldo || 0)
    -
    extendPrice;

  // potong saldo user
  await pool.execute(
    `UPDATE users
     SET saldo=?
     WHERE email=?`,
    [
      saldoBaru,
      req.user.email
    ]
  );

  // simpan status extend order
  await pool.execute(
    `UPDATE otp_orders
     SET
       extended=1,
       extend_time=?,
       extend_price=?
     WHERE activation_id=?`,
    [
      Date.now(),
      extendPrice,
      activationId
    ]
  );

  return res.json({
    success: true,
    message:
      `Nomor berhasil diperpanjang 24 jam. Saldo terpotong Rp${extendPrice.toLocaleString("id-ID")}`,
    saldo: saldoBaru
  });

}

/* ================= GAGAL ================= */

return res.status(400).json({
  success: false,
  message: String(data)
});

} catch (err) {

  console.log(
    "EXTEND ERROR:",
    err.response?.data || err.message
  );

  return res.status(500).json({
    success: false,
    message:
      err.response?.data ||
      err.message
  });

}

});

app.post(
  "/api/otp/rental-expired",
  async (req, res) => {

    try {

      const activationId =
        req.body.activation_id;

      if (!activationId) {

        return res.status(400).json({
          success: false,
          message: "Activation ID kosong"
        });

      }

      /* UPDATE HISTORY */

      await pool.execute(
        `UPDATE otp_history
         SET
           status=?,
           expired_time=?
         WHERE activation_id=?`,
        [
          "expired",
          Date.now(),
          activationId
        ]
      );

      /* HAPUS ORDER AKTIF */

      await pool.execute(
        `DELETE FROM otp_orders
         WHERE activation_id=?`,
        [activationId]
      );

      return res.json({
        success: true
      });

    } catch (err) {

      console.error(
        "RENTAL EXPIRED ERROR:",
        err
      );

      return res.status(500).json({
        success: false,
        message: err.message
      });

    }

  }
);

/* DONE */

app.post(
  "/api/otp/done",
  async (req, res) => {

    try {

      const activationId =
        req.body.activation_id;

      if (!activationId) {

        return res.status(400).json({
          success: false,
          message: "Activation ID kosong"
        });

      }

      /* UPDATE STATUS HEROSMS */

      await axios.get(
        HEROSMS_API,
        {
          params: {
            api_key:
              process.env.HEROSMS_API_KEY,

            action: "setStatus",

            id: activationId,

            status: 6
          }
        }
      );

      /* AMBIL DATA ORDER */

      const [rows] =
        await pool.execute(
          `SELECT
             messages,
             sms_received
           FROM otp_orders
           WHERE activation_id=?
           LIMIT 1`,
          [activationId]
        );

      /* UPDATE HISTORY */

      if (rows.length) {

        await pool.execute(
          `UPDATE otp_history
           SET
             messages=?,
             sms_received=?,
             status='done',
             done_time=?
           WHERE activation_id=?`,
          [
            rows[0].messages || "[]",
            rows[0].sms_received || 0,
            Date.now(),
            activationId
          ]
        );

      } else {

        await pool.execute(
          `UPDATE otp_history
           SET
             status='done',
             done_time=?
           WHERE activation_id=?`,
          [
            Date.now(),
            activationId
          ]
        );

      }

      /* HAPUS ORDER AKTIF */

      await pool.execute(
        `DELETE FROM otp_orders
         WHERE activation_id=?`,
        [activationId]
      );

      return res.json({
        success: true
      });

    } catch (err) {

      console.error(
        "OTP DONE ERROR:",
        err.response?.data || err
      );

      return res.status(500).json({
        success: false,
        message:
          err.response?.data ||
          err.message
      });

    }

  }
);

/* CANCEL */

app.post("/api/otp/cancel", async (req, res) => {

  try {

    const activationId =
      req.body.activation_id;

    if (!activationId) {

      return res.json({
        success: false,
        message: "Activation ID kosong"
      });

    }

    let response;

    try {

      response = await axios.get(
        HEROSMS_API,
        {
          params: {
            api_key:
              process.env.HEROSMS_API_KEY,
            action: "setStatus",
            id: activationId,
            status: 8
          }
        }
      );

    } catch (err) {

      if (
        err.response?.status === 409
      ) {

        return res.json({
          success: true
        });

      }

      throw err;

    }

/* ================= UPDATE HISTORY MYSQL ================= */

const [historyOrderRows] =
  await pool.execute(
    `SELECT
       messages,
       sms_received
     FROM otp_orders
     WHERE activation_id=?
     LIMIT 1`,
    [activationId]
  );

if (historyOrderRows.length) {

  await pool.execute(
    `UPDATE otp_history
     SET
       messages=?,
       sms_received=?,
       status='done',
       done_time=?
     WHERE activation_id=?`,
    [
      historyOrderRows[0].messages || "[]",
      historyOrderRows[0].sms_received || 0,
      Date.now(),
      activationId
    ]
  );

} else {

  await pool.execute(
    `UPDATE otp_history
     SET
       status='done',
       done_time=?
     WHERE activation_id=?`,
    [
      Date.now(),
      activationId
    ]
  );

}

    /* ================= ORDER MYSQL ================= */

    const [orderRows] =
      await pool.execute(
        `SELECT *
         FROM otp_orders
         WHERE activation_id=?
         LIMIT 1`,
        [activationId]
      );

    const order =
      orderRows[0];

    if (
      order &&
      String(order.duration) === "2"
    ) {

      const elapsed =
        Math.floor(
          (
            Date.now() -
            Number(order.time || 0)
          ) / 1000
        );

      if (elapsed > 1200) {

        return res.status(400).json({
          success: false,
          message:
            "Masa pembatalan telah berakhir"
        });

      }

    }

let saldoTerbaru = 0;

/* ================= AMBIL HISTORY ================= */

const [historyRows] =
  await pool.execute(
    `SELECT *
     FROM otp_history
     WHERE activation_id=?
     LIMIT 1`,
    [activationId]
  );

if (historyRows.length) {

  const historyItem =
    historyRows[0];

  /* REFUND HANYA SEKALI */

  if (
    historyItem.status !== "cancel"
  ) {

    const [userRows] =
      await pool.execute(
        `SELECT saldo
         FROM users
         WHERE email=?
         LIMIT 1`,
        [historyItem.user_email]
      );

    if (userRows.length) {

      saldoTerbaru =
        Number(
          userRows[0].saldo || 0
        )
        +
        Number(
          historyItem.harga || 0
        );

      await pool.execute(
        `UPDATE users
         SET saldo=?
         WHERE email=?`,
        [
          saldoTerbaru,
          historyItem.user_email
        ]
      );

    }

  }

  /* UPDATE HISTORY */

  await pool.execute(
    `UPDATE otp_history
     SET
       status='cancel',
       cancel_time=?
     WHERE activation_id=?`,
    [
      Date.now(),
      activationId
    ]
  );

}

/* ================= HAPUS ORDER AKTIF ================= */

await pool.execute(
  `DELETE FROM otp_orders
   WHERE activation_id=?`,
  [activationId]
);

/* ================= SALDO TERBARU ================= */

if (historyRows.length) {

  const [saldoRows] =
    await pool.execute(
      `SELECT saldo
       FROM users
       WHERE email=?
       LIMIT 1`,
      [
        historyRows[0]
          .user_email
      ]
    );

  saldoTerbaru =
    saldoRows[0]?.saldo || 0;

}

return res.json({

  success: true,

  saldo: saldoTerbaru

});

} catch (err) {

  console.error(err);

  return res.status(500).json({

    success: false,

    message:
      err.message,

    data:
      err.response?.data

  });

}

});

app.get(
  "/api/otp/history",
  authMiddleware,
  async (req, res) => {

    try {

      const [rows] = await pool.execute(
        `SELECT *
         FROM otp_history
         WHERE user_email=?
         ORDER BY time DESC`,
        [req.user.email]
      );

      return res.json({
        success: true,
        data: rows
      });

    } catch (err) {

      console.error(err);

      return res.status(500).json({
        success: false,
        message: "Server Error"
      });

    }

  }
);

app.post(
  "/api/otp/history/save",
  (req, res) => {

    return res.json({
      success: true
    });

  }
);



/* ==========================================
   HEROSMS OTP EMAIL
========================================== */
const EMAIL_API =
"https://hero-sms.com/api/v1";

app.post(
"/api/email/order",
authMiddleware,
async (req,res)=>{

try{

const { site, domain } =
req.body;

if(!site || !domain){

return res.status(400).json({
success:false,
message:"site dan domain wajib diisi"
});

}

/* USER */

const [users] =
await pool.execute(
`
SELECT email,saldo
FROM users
WHERE email=?
LIMIT 1
`,
[
req.user.email
]
);

if(!users.length){

return res.status(404).json({
success:false,
message:"User tidak ditemukan"
});

}

const user =
users[0];

/* DOMAIN */

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

/* HARGA */

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

/* ORDER KE HEROSMS */

const { data } =
await axios.post(
`${EMAIL_API}/emails`,
{
site,
domain
},
{
headers:{
Authorization:
`ApiKey ${process.env.HEROSMS_API_KEY}`,
Accept:"application/json"
}
}
);

/* POTONG SALDO */

await pool.execute(
`
UPDATE users
SET saldo = saldo - ?
WHERE email = ?
`,
[
hargaJual,
user.email
]
);

/* SIMPAN ORDER AKTIF */

await pool.execute(
`
INSERT INTO email_orders
(
id,
user_email,
email,
site,
domain,
harga,
otp_received,
code,
created_at
)
VALUES
(?,?,?,?,?,?,?,?,?)
`,
[
String(data.data.id),
user.email,
data.data.email,
site,
domain,
hargaJual,
0,
null,
Date.now()
]
);

/* SIMPAN HISTORY */

await pool.execute(
`
INSERT INTO email_history
(
activation_id,
user_email,
service,
pesan,
harga,
status,
otp_received,
created_at
)
VALUES
(?,?,?,?,?,?,?,?)
`,
[
String(data.data.id),
user.email,
site,
null,
hargaJual,
"active",
0,
Date.now()
]
);

/* AMBIL SALDO TERBARU */

const [[saldoBaru]] =
await pool.execute(
`
SELECT saldo
FROM users
WHERE email=?
`,
[
user.email
]
);

res.json({
success:true,
data:data.data,
saldo:saldoBaru.saldo
});

}catch(err){

console.error(
"EMAIL ORDER ERROR:"
);

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

app.get(
"/api/email/check/:id",
async (req, res) => {

try {

const id =
req.params.id;

const { data } =
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

/* CARI OTP */

let otp =
data.data?.value || null;

/* JIKA VALUE KOSONG,
   AMBIL DARI HTML EMAIL */

if(
!otp &&
data.data?.message
){

/* PRIORITAS:
   OTP DI DALAM TAG <b> */

const boldMatch =
data.data.message.match(
/<b[^>]*>(\d{4,8})<\/b>/i
);

if(
boldMatch &&
boldMatch[1]
){
otp =
boldMatch[1];
}

/* FALLBACK:
   ANGKA 4-8 DIGIT */

if(!otp){

const numberMatch =
data.data.message.match(
/\b\d{4,8}\b/
);

if(
numberMatch &&
numberMatch[0]
){
otp =
numberMatch[0];
}

}

}

/* JIKA OTP SUDAH MASUK */

if(otp){

await pool.execute(
`
UPDATE email_orders
SET
otp_received = 1,
code = ?,
message = ?
WHERE id = ?
`,
[
otp,
data.data?.message || null,
String(id)
]
);

await pool.execute(
`
UPDATE email_history
SET
pesan = ?,
otp_received = 1
WHERE activation_id = ?
`,
[
otp,
String(id)
]
);

}

/* RESPONSE */

res.json({

success:true,

status:
data.data?.status || null,

code:
otp,

email:
data.data?.email || null,

message:
data.data?.message || null,

data

});

}catch(err){

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
"/api/email/cancel/:id",
authMiddleware,
async (req, res) => {

let conn;

try {

conn = await pool.getConnection();

await conn.beginTransaction();

const id = String(req.params.id);

/* CEK ORDER + LOCK */

const [orders] =
await conn.execute(
`
SELECT *
FROM email_orders
WHERE id = ?
AND user_email = ?
LIMIT 1
FOR UPDATE
`,
[
id,
req.user.email
]
);

if (!orders.length) {

await conn.rollback();

return res.status(404).json({
success:false,
message:"Order tidak ditemukan"
});

}

const order = orders[0];

/* CEK WAKTU */

const elapsed =
Math.floor(
(Date.now() -
Number(order.created_at)
) / 1000
);

if (elapsed < 120) {

await conn.rollback();

return res.status(400).json({
success:false,
message:
`Tunggu ${120 - elapsed} detik lagi untuk membatalkan`
});

}

/* SUDAH DAPAT OTP */

if (order.otp_received) {

await conn.rollback();

return res.status(400).json({
success:false,
message:
"Email sudah menerima OTP dan tidak dapat dibatalkan"
});

}

/* CANCEL KE HEROSMS */

let heroResponse;

try {

heroResponse =
await axios.delete(
`${EMAIL_API}/emails/${id}`,
{
headers:{
Authorization:
`ApiKey ${process.env.HEROSMS_API_KEY}`,
Accept:"application/json"
},
timeout:15000
}
);

} catch (heroErr) {

await conn.rollback();

console.error(
"HEROSMS DELETE ERROR:",
heroErr.response?.data ||
heroErr.message
);

return res.status(500).json({
success:false,
message:
heroErr.response?.data?.message ||
"Gagal membatalkan email di HeroSMS"
});

}

console.log(
"HEROSMS DELETE RESPONSE:",
JSON.stringify(
heroResponse.data,
null,
2
)
);

/* CEK RESPONSE API */

if (
heroResponse.data &&
heroResponse.data.success === false
) {

await conn.rollback();

return res.status(400).json({
success:false,
message:
heroResponse.data.message ||
"Gagal membatalkan email di HeroSMS"
});

}

/* UPDATE HISTORY */

await conn.execute(
`
UPDATE email_history
SET
status = 'cancel',
cancel_time = ?
WHERE activation_id = ?
`,
[
Date.now(),
id
]
);

/* REFUND SALDO */

await conn.execute(
`
UPDATE users
SET saldo = saldo + ?
WHERE email = ?
`,
[
Number(order.harga || 0),
order.user_email
]
);

/* HAPUS ORDER */

await conn.execute(
`
DELETE FROM email_orders
WHERE id = ?
AND user_email = ?
`,
[
id,
order.user_email
]
);

await conn.commit();

/* AMBIL SALDO TERBARU */

const [[saldoBaru]] =
await pool.execute(
`
SELECT saldo
FROM users
WHERE email = ?
`,
[
order.user_email
]
);

return res.json({
success:true,
message:"Order berhasil dibatalkan",
saldo:saldoBaru.saldo
});

} catch (err) {

if (conn) {

try {
await conn.rollback();
} catch (_) {}

}

console.error(
"CANCEL ERROR:",
err.response?.data ||
err.message ||
err
);

return res.status(500).json({
success:false,
error:
err.response?.data ||
err.message ||
"Terjadi kesalahan"
});

} finally {

if (conn) {
conn.release();
}

}

});

app.post(
"/api/email/done/:id",
authMiddleware,
async (req, res) => {

let conn;

try {

conn = await pool.getConnection();

await conn.beginTransaction();

const id = String(req.params.id);

/* CEK ORDER */

const [orders] =
await conn.execute(
`
SELECT *
FROM email_orders
WHERE id = ?
AND user_email = ?
LIMIT 1
FOR UPDATE
`,
[
id,
req.user.email
]
);

if (!orders.length) {

await conn.rollback();

return res.status(404).json({
success:false,
message:"Order tidak ditemukan"
});

}

const order = orders[0];

/* SELESAIKAN DI HEROSMS */

let heroResponse;

try {

heroResponse =
await axios.delete(
`${EMAIL_API}/emails/${id}`,
{
headers:{
Authorization:
`ApiKey ${process.env.HEROSMS_API_KEY}`,
Accept:"application/json"
},
timeout:15000
}
);

} catch (heroErr) {

await conn.rollback();

console.error(
"HEROSMS DONE ERROR:",
heroErr.response?.data ||
heroErr.message
);

return res.status(500).json({
success:false,
message:
heroErr.response?.data?.message ||
"Gagal menyelesaikan email di HeroSMS"
});

}

/* UPDATE HISTORY */

await conn.execute(
`
UPDATE email_history
SET status = 'done'
WHERE activation_id = ?
`,
[
id
]
);

/* HAPUS ORDER AKTIF */

await conn.execute(
`
DELETE FROM email_orders
WHERE id = ?
AND user_email = ?
`,
[
id,
order.user_email
]
);

await conn.commit();

return res.json({
success:true,
message:"Email selesai"
});

} catch (err) {

if (conn) {

try {
await conn.rollback();
} catch (_) {}

}

console.error(
"DONE ERROR:",
err.response?.data ||
err.message ||
err
);

return res.status(500).json({
success:false,
error:
err.response?.data ||
err.message ||
"Terjadi kesalahan"
});

} finally {

if (conn) {
conn.release();
}

}

});

app.post("/api/email/reorder/:id", authMiddleware, async (req, res) => {

try {

const oldId = req.params.id;

const [[user]] = await pool.execute(
`SELECT email,saldo FROM users WHERE email=? LIMIT 1`,
[req.user.email]
);

if (!user) {
return res.status(404).json({
success: false,
message: "User tidak ditemukan"
});
}

const [orders] = await pool.execute(
`SELECT * FROM email_orders WHERE id=? AND user_email=? LIMIT 1`,
[
String(oldId),
user.email
]
);

if (!orders.length) {
return res.status(404).json({
success: false,
message: "Order tidak ditemukan"
});
}

const oldOrder = orders[0];

await pool.execute(
`UPDATE email_history
SET status='reorder',
reorder_time=?
WHERE activation_id=?`,
[
Date.now(),
String(oldId)
]
);

const hargaJual =
Number(oldOrder.harga || 0);

if (
hargaJual > 0 &&
Number(user.saldo || 0) < hargaJual
) {

return res.status(400).json({
success: false,
message: `Saldo tidak cukup. Minimal Rp${hargaJual.toLocaleString("id-ID")}`
});

}

const { data } = await axios.post(
`${EMAIL_API}/emails/${oldId}/reorder`,
{},
{
headers: {
Authorization:
`ApiKey ${process.env.HEROSMS_API_KEY}`,
Accept: "application/json"
}
}
);

if (hargaJual > 0) {

await pool.execute(
`UPDATE users
SET saldo = saldo - ?
WHERE email = ?`,
[
hargaJual,
user.email
]
);

}

const newOrder = {

id: data.data.id,

email: data.data.email,

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

await pool.execute(
`INSERT INTO email_orders
(
id,
user_email,
email,
site,
domain,
harga,
otp_received,
code,
created_at
)
VALUES
(?,?,?,?,?,?,?,?,?)`,
[
String(data.data.id),
user.email,
data.data.email,
newOrder.site,
newOrder.domain,
hargaJual,
0,
null,
Date.now()
]
);

await pool.execute(
`DELETE FROM email_orders
WHERE id=?`,
[
String(oldId)
]
);

await pool.execute(
`INSERT INTO email_history
(
activation_id,
user_email,
service,
pesan,
harga,
status,
otp_received,
created_at
)
VALUES
(?,?,?,?,?,?,?,?)`,
[
String(data.data.id),
user.email,
newOrder.site,
null,
hargaJual,
"active",
0,
Date.now()
]
);

const [[saldoBaru]] =
await pool.execute(
`SELECT saldo
FROM users
WHERE email=?`,
[
user.email
]
);

res.json({

success:true,

data:newOrder,

saldo:
saldoBaru.saldo,

message:
"Reorder berhasil"

});

} catch (err) {

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

app.get("/api/email/orders", authMiddleware, async (req, res) => {

try {

const [rows] = await pool.execute(
`SELECT *
FROM email_orders
WHERE user_email = ?
ORDER BY created_at DESC`,
[
req.user.email
]
);

res.json({
success: true,
data: rows
});

} catch (err) {

console.error(err);

res.status(500).json({
success: false,
error: err.message
});

}

});

app.get("/api/email/history", authMiddleware, async (req, res) => {

try {

const [rows] = await pool.execute(
`
SELECT
h.activation_id,
o.email,
h.service,
h.pesan,
h.harga,
h.status,
h.created_at AS time,
h.cancel_time AS cancelTime,
h.reorder_time AS reorderTime
FROM email_history h
LEFT JOIN email_orders o
ON o.id = h.activation_id
WHERE h.user_email = ?
ORDER BY h.created_at DESC
`,
[req.user.email]
);

res.json({
success: true,
data: rows
});

} catch (err) {

console.error(err);

res.status(500).json({
success: false,
error: err.message
});

}

});

app.get("/api/email/domains", async (req, res) => {

try {

const site =
req.query.site ||
"telegram.com";

const { data } =
await axios.get(
`${EMAIL_API}/emails/domains`,
{
params: { site },
headers: {
Authorization:
`ApiKey ${process.env.HEROSMS_API_KEY}`,
Accept: "application/json"
}
}
);

res.json({
success: true,
data: data.data || data
});

} catch (err) {

res.status(500).json({
success: false,
error:
err.response?.data ||
err.message
});

}

});

app.post("/api/email/test", (req, res) => {

res.json({
success: true
});

});

// ================= START SERVER =================
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server jalan di http://0.0.0.0:${PORT}`);
}); 
