// SOURCE KODE MEMILIKI BATASAN AKSES DAN LISENSI SILAHKAN HUBUNGI TELEGRAM @papadarmo

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

// SOURCE KODE MEMILIKI BATASAN AKSES DAN LISENSI SILAHKAN HUBUNGI TELEGRAM @papadarmo

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

// SOURCE KODE MEMILIKI BATASAN AKSES DAN LISENSI SILAHKAN HUBUNGI TELEGRAM @papadarmo
