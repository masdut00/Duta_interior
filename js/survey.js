const Survey = {
    isSaved: false, // Penanda status penyimpanan

    // 1. TAMBAH BARIS (TAMPILAN BARU)
    tambahBaris: function() {
        const tbody = document.getElementById('survey-body');
        const rowId = Date.now(); 
        
        const tr = document.createElement('tr');
        tr.id = `row-${rowId}`;
        tr.innerHTML = `
            <td style="padding: 5px;">
                <input type="text" class="input-ruang" placeholder="Ruang..." style="width:100%; padding:8px; box-sizing:border-box;">
            </td>
            <td style="padding: 5px; width: 70px;">
                <input type="number" class="input-lebar" placeholder="0.00" step="0.01" style="width:100%; padding:8px; text-align:center; box-sizing:border-box;">
            </td>
            <td style="padding: 5px; width: 70px;">
                <input type="number" class="input-tinggi" placeholder="0.00" step="0.01" style="width:100%; padding:8px; text-align:center; box-sizing:border-box;">
            </td>
            <td style="padding: 5px; width: 40px; text-align:center; vertical-align:middle;">
                <button onclick="Survey.hapusBaris('${rowId}')" class="btn-del-mini" title="Hapus Baris">🗑️</button>
            </td>
        `;
        tbody.appendChild(tr);
        
        // Auto focus ke input nama ruang yang baru dibuat
        setTimeout(() => {
            tr.querySelector('.input-ruang').focus();
        }, 100);
    },

    // 2. HAPUS BARIS (DENGAN KONFIRMASI)
    hapusBaris: function(id) {
        // Cek barisnya dulu
        const row = document.getElementById(`row-${id}`);
        const namaRuang = row.querySelector('.input-ruang').value;
        
        // Jika sudah ada isinya, tanya dulu. Kalau kosong langsung hapus.
        if (namaRuang && !confirm(`Yakin ingin menghapus baris "${namaRuang}"?`)) {
            return; // Batal hapus
        }

        if(row) row.remove();
    },

    // 3. PENGAMAN KELUAR HALAMAN
    cekKeluar: function() {
        const nama = document.getElementById('namaPelanggan').value;
        const rows = document.querySelectorAll('#survey-body tr');
        
        // Cek apakah user sudah mengetik sesuatu?
        let isDirty = false;
        if (nama) isDirty = true;
        
        // Cek isi tabel satu per satu
        rows.forEach(row => {
            if(row.querySelector('.input-ruang').value) isDirty = true;
        });

        // JIKA SUDAH KETIK TAPI BELUM SIMPAN
        if (isDirty && !this.isSaved) {
            // Kita pakai bahasa Indonesia yang JELAS disini
            const pesan = "⚠️ PERINGATAN: DATA BELUM DISIMPAN!\n\n" +
                          "Jika Anda kembali ke Menu Utama sekarang, seluruh data ukuran yang sudah Anda ketik akan HILANG PERMANEN.\n\n" +
                          "Saran: Klik 'Batal' lalu tekan tombol 'Simpan Data Survey' dulu.\n\n" +
                          "Apakah Anda tetap ingin keluar dan membuang data ini?";

            if(confirm(pesan)) {
                window.location.href = 'dashboard.html'; // User nekat keluar
            }
        } else {
            // Aman (belum ngetik apa2 atau sudah save)
            window.location.href = 'dashboard.html';
        }
    },

    // 4. SIMPAN DATA
    simpanSurvey: async function() {
        const nama = document.getElementById('namaPelanggan').value;
        const hp = document.getElementById('noHp').value; 
        
        if(!nama) return alert("Nama Pelanggan wajib diisi!");

        const rows = document.querySelectorAll('#survey-body tr');
        if(rows.length === 0) return alert("Belum ada ukuran yang diinput!");

        let itemsSurvey = [];
        let valid = true;

        rows.forEach(row => {
            const ruang = row.querySelector('.input-ruang').value;
            const L = parseFloat(row.querySelector('.input-lebar').value) || 0;
            const T = parseFloat(row.querySelector('.input-tinggi').value) || 0;

            if(!ruang && L === 0 && T === 0) return; 

            if(!ruang || L === 0 || T === 0) {
                valid = false;
            }

            itemsSurvey.push({
                id: Date.now() + Math.random(), 
                nama: ruang,
                spek: { L: L, T: T },
                gordyn: { kain: {harga:0, total:0}, rel: {harga:0}, ring: {harga:0} },
                vitrace: null,
                subTotal: 0, 
                isSurvey: true 
            });
        });

        if(!valid) return alert("Pastikan semua baris yang diisi memiliki Nama Ruang, Lebar, dan Tinggi!");
        if(itemsSurvey.length === 0) return alert("Mohon isi minimal satu data jendela.");

        const btn = document.getElementById('btn-save-survey');
        const txtAsli = btn.innerText;
        btn.innerText = "⏳ Menyimpan...";
        btn.disabled = true;

        try {
            // --- KIRIM KE API ---
            const res = await API.simpanTransaksi({
                idTransaksi: null,
                
                // PERUBAHAN DISINI:
                // Cukup kirim "[SURVEY] " + nama saja. JANGAN tempel HP lagi.
                namaPelanggan: "[SURVEY] " + nama, 
                
                // HP dikirim lewat jalur khusus ini
                hpPelanggan: hp,
                
                totalGrand: 0, 
                items: itemsSurvey
            });

            if(res.status === 'success') {
                this.isSaved = true; 
                alert("✅ Data Survey Tersimpan!");
                window.location.href = 'dashboard.html'; 
            } else {
                throw new Error(res.message);
            }

        } catch (error) {
            alert("❌ Gagal Menyimpan: " + error.message);
            btn.innerText = txtAsli;
            btn.disabled = false;
        }
    }
};