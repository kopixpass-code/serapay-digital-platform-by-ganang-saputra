const socket = io();

const sidebar = document.getElementById("sidebar");
const menuBtn = document.getElementById("menuBtn");
const searchInput = document.getElementById("searchInput");
const tableHead = document.getElementById("tableHead");
const tableBody = document.getElementById("tableBody");

let currentTable = null;
let currentRows = [];

socket.on("table-update", (table) => {

    // kalau admin sedang membuka tabel yang sama
    if (currentTable === table) {

        loadTable(table);

    }

});

socket.on("stats-update", () => {

    loadHome();

});

menuBtn.onclick = () => {
sidebar.classList.toggle("show");
};

const configs = {


users: [
    "id",
    "name",
    "email",
    "phone",
    "saldo",
    "reward",
    "created_at"
],

topup: [
    "id",
    "reference_id",
    "user_email",
    "nominal",
    "status",
    "created_at"
],

rekening: [
    "id",
    "email_user",
    "bank",
    "norek",
    "nama",
    "created_at"
],

history: [
    "id",
    "user_id",
    "type",
    "status",
    "qty",
    "created_at"
],

facebook_fresh: [
    "id",
    "email",
    "uid",
    "password",
    "status",
    "created_at"
],

gaslur: [
    "id",
    "email",
    "status",
    "created_at"
],

gmail: [
    "id",
    "email",
    "password",
    "status",
    "created_at"
],

gmail_bekas: [
    "id",
    "email",
    "password",
    "status",
    "created_at"
],

autoresponder: [
    "id",
    "user_email",
    "url",
    "username",
    "apikey",
    "status",
    "created_at"
],

data_wd: [
    "id",
    "nama",
    "email_user",
    "bank",
    "nomor_rekening",
    "nama_rekening",
    "jumlah",
    "status",
    "waktu",
    "created_at"
],

otp_orders: [
    "id",
    "user_email",
    "activation_id",
    "phone_number",
    "duration",
    "service",
    "service_name",
    "country",
    "country_name",
    "country_logo",
    "operator",
    "harga",
    "sms_received",
    "waiting_resend",
    "extended",
    "extend_time",
    "extend_price",
    "last_new_message_id",
    "messages",
    "time",
    "created_at"
],

otp_history: [
    "id",
    "activation_id",
    "duration",
    "user_email",
    "service",
    "service_name",
    "country",
    "country_name",
    "country_logo",
    "operator",
    "number",
    "harga",
    "status",
    "messages",
    "sms_received",
    "time",
    "cancel_time",
    "done_time",
    "expired_time",
    "created_at"
],

email_orders: [
    "id",
    "user_email",
    "email",
    "site",
    "domain",
    "harga",
    "otp_received",
    "code",
    "created_at",
    "message"
],

email_history: [
    "id",
    "activation_id",
    "user_email",
    "service",
    "pesan",
    "harga",
    "status",
    "otp_received",
    "created_at",
    "cancel_time",
    "reorder_time"
],

setoran_facebook_fresh: [
    "id",
    "transaksi_id",
    "email",
    "uid",
    "password",
    "status_akun",
    "produk",
    "nama",
    "email_user",
    "harga",
    "waktu",
    "sudah_diproses"
],

setoran_gmail_fresh: [
    "id",
    "transaksi_id",
    "email",
    "password",
    "status_akun",
    "produk",
    "nama",
    "email_user",
    "harga",
    "waktu",
    "sudah_diproses"
],

setoran_gmail_bekas: [
    "id",
    "transaksi_id",
    "email",
    "password",
    "status_akun",
    "produk",
    "nama",
    "email_user",
    "harga",
    "waktu",
    "sudah_diproses"
],

refund: [
    "id",
    "user_email",
    "order_id",
    "alasan",
    "nominal",
    "status",
    "time",
    "created_at"
],


};

document.querySelectorAll(".menu").forEach(btn => {


btn.onclick = () => {

    document.querySelectorAll(".menu")
        .forEach(m => m.classList.remove("active"));

    btn.classList.add("active");

    const table = btn.dataset.table;

    // Simpan menu terakhir
    localStorage.setItem("activeMenu", table);

    if (table === "home") {
        loadHome();
        return;
    }

    loadTable(table);
};


});

async function loadHome() {


tableHead.innerHTML = "";
tableBody.innerHTML = "";

try {

    const res = await fetch("/api/admin/stats");
    const stats = await res.json();

    document.getElementById("totalUser").innerText =
        stats.totalUser || 0;

    document.getElementById("totalTopup").innerText =
        stats.totalTopup || 0;

    document.getElementById("totalSaldo").innerText =
        formatRupiah(stats.totalSaldo || 0);

} catch (err) {

    console.error(err);

}


}

async function loadTable(name) {


currentTable = name;

try {

    const res =
        await fetch(`/api/admin/${name}`);

    const rows =
        await res.json();

    currentRows = rows;

    renderTable(name, rows);

    updateStats(rows);

} catch (err) {

    console.error(err);

    tableBody.innerHTML =
        `<tr>
            <td colspan="99">
                Gagal memuat data
            </td>
        </tr>`;
}


}

function renderTable(name, rows) {

    const columns = configs[name];

    let header = `
    <tr>
        <th>
            <input type="checkbox" id="checkAll">
        </th>
    `;

    columns.forEach(col => {

        header += `
        <th
            onclick="sortTable('${col}')"
            style="cursor:pointer">

            ${col} ▲▼

        </th>
        `;

    });

    header += "<th>Aksi</th></tr>";

    tableHead.innerHTML = header;

    tableBody.innerHTML = rows.map(row => {

        // ==========================
        // TOMBOL SESUAI MENU
        // ==========================

        let aksi = `
            <button
                class="deleteBtn"
                onclick="deleteRow('${name}','${row.id}')">
                Hapus
            </button>
        `;

        // ===== TOPUP =====
        if (name === "topup") {

            aksi = `
                <button
                    class="ok"
                    onclick="approveTopup('${row.user_email}','${row.created_at}')">
                    ✔ Konfirmasi
                </button>

                <button
                    class="no"
                    onclick="rejectTopup('${row.user_email}','${row.created_at}')">
                    ✖ Tolak
                </button>
            `;

        }

// ===== REFUND =====
else if (name === "refund") {
	console.log(row);

    aksi = `
        <button
            class="ok"
            onclick="approveRefund('${row.user_email}','${row.order_id}')">
            ✔ Setuju
        </button>

        <button
            class="no"
            onclick="rejectRefund('${row.user_email}','${row.order_id}')">
            ✖ Tolak
        </button>
    `;

}
        return `

        <tr>

            <td>

                <input
                    type="checkbox"
                    class="rowCheck"
                    value="${row.id}">

            </td>

            ${columns.map(col => `

                <td
                    class="editable"
                    data-table="${name}"
                    data-id="${row.id}"
                    data-column="${col}"
                    ondblclick="editCell(this)">

                    ${row[col] ?? ""}

                </td>

            `).join("")}

            <td>

                ${aksi}

            </td>

        </tr>

        `;

    }).join("");

}

searchInput.addEventListener("input", () => {


const keyword =
    searchInput.value.toLowerCase();

const filtered =
    currentRows.filter(row => {

        return Object.values(row)
            .join(" ")
            .toLowerCase()
            .includes(keyword);

    });

renderTable(currentTable, filtered);


});

function updateStats(rows) {


const totalData =
    rows.length;

const totalSaldo =
    rows.reduce((sum, row) => {

        return sum +
            Number(row.saldo || 0);

    }, 0);

const totalNominal =
    rows.reduce((sum, row) => {

        return sum +
            Number(row.nominal || 0);

    }, 0);

const totalUserElm =
    document.getElementById("totalUser");

const totalTopupElm =
    document.getElementById("totalTopup");

const totalSaldoElm =
    document.getElementById("totalSaldo");

if (totalUserElm)
    totalUserElm.innerText = totalData;

if (totalTopupElm)
    totalTopupElm.innerText =
    formatRupiah(totalNominal);

if (totalSaldoElm)
    totalSaldoElm.innerText =
    formatRupiah(totalSaldo);


}

async function editRow(table, id) {


alert(
    `Fitur edit ${table} ID ${id}`
);


}

async function deleteRow(table, id) {


const yes =
    confirm(
        `Hapus data ${id}?`
    );

if (!yes) return;

try {

    const res =
        await fetch(
            `/api/admin/${table}/${id}`,
            {
                method: "DELETE"
            }
        );

    const result =
        await res.json();

    if (result.success) {

        loadTable(table);

    } else {

        alert(
            result.message ||
            "Gagal menghapus"
        );

    }

} catch (err) {

    console.error(err);

    alert(
        "Terjadi kesalahan"
    );

}


}

function formatRupiah(value) {


return new Intl.NumberFormat(
    "id-ID",
    {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0
    }
).format(value);


}

function editCell(td){

    if(td.querySelector("input")) return;

    const oldValue = td.innerText.trim();

    const input = document.createElement("input");

    input.value = oldValue;

    input.style.width = "100%";

    td.innerHTML = "";

    td.appendChild(input);

    input.focus();

    input.select();

    async function save(){

        const value = input.value;

        td.innerHTML = value;

        if(value === oldValue) return;

        try{

            const res = await fetch(

                `/api/admin/${td.dataset.table}/${td.dataset.id}`,

                {

                    method:"PUT",

                    headers:{
                        "Content-Type":"application/json"
                    },

                    body:JSON.stringify({

                        [td.dataset.column]:value

                    })

                }

            );

            const result = await res.json();

            if(!result.success){

                alert("Gagal menyimpan");

                td.innerHTML = oldValue;

            }

        }catch(err){

            console.log(err);

            td.innerHTML = oldValue;

        }

    }

    input.onblur = save;

    input.onkeydown = function(e){

        if(e.key==="Enter"){

            input.blur();

        }

        if(e.key==="Escape"){

            td.innerHTML = oldValue;

        }

    }

}

let sortColumn=null;
let sortAsc=true;

function sortTable(column){

sortAsc =
sortColumn===column
? !sortAsc
: true;

sortColumn=column;

currentRows.sort((a,b)=>{

let x=a[column];
let y=b[column];

if(!isNaN(x)&&!isNaN(y)){

x=Number(x);
y=Number(y);

}

if(x>y)
return sortAsc?1:-1;

if(x<y)
return sortAsc?-1:1;

return 0;

});

renderTable(currentTable,currentRows);

}

document.addEventListener("click",e=>{

if(e.target.id==="checkAll"){

document
.querySelectorAll(".rowCheck")
.forEach(c=>{

c.checked=e.target.checked;

});

}

});

// ================= REFUND =================

async function approveRefund(user_email, order_id){
    try {
        const res = await fetch("/api/admin/refund/approve", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            // Menyamakan key JSON dengan backend lama (email dan orderId)
            body: JSON.stringify({
                email: user_email,
                orderId: order_id
            })
        });

        const result = await res.json();

        if (result.success) {
            alert("Refund berhasil disetujui");
            loadTable("refund"); // Refresh tabel refund di dashboard
        } else {
            alert(result.message || "Refund gagal");
        }
    } catch (err) {
        console.error("Approve Refund Error:", err);
        alert("Terjadi kesalahan");
    }
}

async function rejectRefund(user_email, order_id){
    try {
        const res = await fetch("/api/admin/refund/reject", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            // Menyamakan key JSON dengan backend lama (email dan orderId)
            body: JSON.stringify({
                email: user_email,
                orderId: order_id
            })
        });

        const result = await res.json();

        if (result.success) {
            alert("Refund ditolak");
            loadTable("refund"); // Refresh tabel refund di dashboard
        } else {
            alert(result.message || "Gagal menolak refund");
        }
    } catch (err) {
        console.error("Reject Refund Error:", err);
        alert("Terjadi kesalahan");
    }
}


// ================= TOPUP =================

async function approveTopup(user_email, created_at){
    try {
        const res = await fetch("/api/admin/topup/approve", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            // Menyamakan key JSON dengan backend lama (email dan time numerik)
            body: JSON.stringify({
                email: user_email,
                time: Number(created_at)
            })
        });

        const result = await res.json();

        if (result.success) {
            alert("Topup berhasil dikonfirmasi");
            loadTable("topup"); // Refresh tabel topup di dashboard
        } else {
            alert(result.message || "Gagal approve");
        }
    } catch (err) {
        console.error("Approve Topup Error:", err);
        alert("Terjadi kesalahan");
    }
}

async function rejectTopup(user_email, created_at){
    try {
        const res = await fetch("/api/admin/topup/reject", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            // Menyamakan key JSON dengan backend lama (email dan time numerik)
            body: JSON.stringify({
                email: user_email,
                time: Number(created_at)
            })
        });

        const result = await res.json();

        if (result.success) {
            alert("Topup ditolak");
            loadTable("topup"); // Refresh tabel topup di dashboard
        } else {
            alert(result.message || "Gagal menolak");
        }
    } catch (err) {
        console.error("Reject Topup Error:", err);
        alert("Terjadi kesalahan");
    }
}

window.onload = () => {

    const lastMenu =
        localStorage.getItem("activeMenu") || "home";

    const btn =
        document.querySelector(
            `.menu[data-table="${lastMenu}"]`
        );

    if (btn) {
        btn.click(); // otomatis membuka menu terakhir
    } else {
        loadHome();
    }

};