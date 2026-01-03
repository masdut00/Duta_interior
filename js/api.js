const API = {
    // STATE (Data Sementara)
    state: {
        harga: { kain: 0, vitrace: 0, rel: [], ring: [] }, 
        hargaRaw: [], // Simpan data mentah
        keranjang: [],
        currentId: null,
        currentRow: null,
        editingIndex: null
    },

    // 1. AMBIL HARGA (VERSI ANTI-GLITCH)
    ambilHarga: async function() {
        const elStatus = document.getElementById('status-db');
        if(elStatus) elStatus.innerText = "Connecting..."; 

        try {
            const response = await fetch(CONFIG.API_URL + "?action=getHarga");
            const res = await response.json();
            
            if (res.status === 'success') {
                const allData = res.data;
                this.state.hargaRaw = allData; // Simpan backup

                // --- LOGIKA PEMISAH DATA (LEBIH KUAT) ---
                
                // Helper: Cek teks aman (Hapus spasi, jadikan huruf kecil semua)
                const isMatch = (text, keyword) => {
                    if(!text) return false;
                    return String(text).toLowerCase().includes(keyword.toLowerCase());
                };

                // 1. Cari Harga Kain (Cari yang mengandung kata 'kain' DAN 'gordyn')
                const itemKain = allData.find(i => isMatch(i.kategori, 'kain') && isMatch(i.kategori, 'gordyn'));
                this.state.harga.kain = itemKain ? itemKain.harga : 0;

                // 2. Cari Harga Vitrace
                const itemVitrace = allData.find(i => isMatch(i.kategori, 'vitrace'));
                this.state.harga.vitrace = itemVitrace ? itemVitrace.harga : 0;

                // 3. Filter Rel & Ring (Gunakan fungsi isMatch biar tidak peduli huruf besar/kecil)
                this.state.harga.rel = allData.filter(i => isMatch(i.kategori, 'rel'));
                this.state.harga.ring = allData.filter(i => isMatch(i.kategori, 'ring'));
                
                // ---------------------------------------

                console.log("Data Loader:", {
                    Raw: allData.length,
                    Rel: this.state.harga.rel.length,
                    Ring: this.state.harga.ring.length
                });
                
                // Isi Dropdown (Hanya jika ada datanya)
                this.isiOptions('pilihRel', this.state.harga.rel);
                this.isiOptions('pilihRing', this.state.harga.ring);
                this.isiOptions('pilihRelVitrace', this.state.harga.rel);
                this.isiOptions('pilihRingVitrace', this.state.harga.ring);

                if(elStatus) {
                    elStatus.innerText = "Ready";
                    elStatus.style.color = "lightgreen";
                }
            }
        } catch (error) {
            console.error("Gagal ambil harga:", error);
            if(elStatus) {
                elStatus.innerText = "Offline";
                elStatus.style.color = "red";
            }
        }
    },

    // 2. HELPER ISI DROPDOWN
    isiOptions: function(elementId, dataArray) {
        const select = document.getElementById(elementId);
        if (!select) return; // Elemen tidak ada? Skip.

        // Simpan nilai yang sedang dipilih user (biar gak kereset tiba-tiba)
        const currentValue = select.value;

        // Kosongkan dan isi opsi default
        select.innerHTML = '<option value="0-Tidak Pakai">Tidak Pakai / Model Plisket</option>';
        
        if(dataArray && dataArray.length > 0) {
            dataArray.forEach(item => {
                // Value: Harga-Nama (Contoh: 75000-Rel Rolet Gold)
                const val = `${item.harga}-${item.nama}`; 
                const text = `${item.nama} (+${CONFIG.formatRupiah(item.harga)})`;
                
                const opt = document.createElement('option');
                opt.value = val;
                opt.innerText = text;
                select.appendChild(opt);
            });
        } else {
            // Jika data kosong, kasih opsi loading/kosong
            const opt = document.createElement('option');
            opt.innerText = "(Data Kosong)";
            select.appendChild(opt);
        }

        // Kembalikan nilai user jika nilai tersebut masih valid ada di daftar baru
        // (Mencegah dropdown lompat ke atas sendiri saat data direfresh)
        if(currentValue && currentValue !== "0-Tidak Pakai") {
            // Cek apakah value lama masih ada di opsi baru?
            const exists = Array.from(select.options).some(o => o.value === currentValue);
            if(exists) select.value = currentValue;
        }
    },

    // 3. SIMPAN TRANSAKSI
    simpanTransaksi: async function(dataTransaksi) {
        // Siapkan logika status otomatis
        const total = dataTransaksi.totalGrand || 0;
        const dp = dataTransaksi.dp || 0;
        let status = "BELUM LUNAS";
        
        // Logika sederhana: Jika DP >= Total, berarti Lunas. Jika DP 0, Belum.
        // Nanti bisa kita perhalus lagi.
        if (dp >= total) status = "LUNAS";
        else if (dp > 0) status = "DP / CICIL";

        const payload = {
            action: "simpanTransaksi",
            id: dataTransaksi.idTransaksi,
            tanggal: CONFIG.getTodayDate(),
            nama: dataTransaksi.namaPelanggan,
            hp: dataTransaksi.hpPelanggan,
            total: total,
            items: JSON.stringify(dataTransaksi.items),
            
            // --- DATA BARU ---
            dp: dp,
            statusBayar: status,
            deadline: dataTransaksi.deadline || "-", // Tanggal Pasang
            statusKerja: "ANTRIAN" // Default status kerja saat baru masuk
        };

        const response = await fetch(CONFIG.API_URL, {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        return await response.json();
    },

    // 4. AMBIL RIWAYAT
    ambilRiwayat: async function() {
        const response = await fetch(CONFIG.API_URL + "?action=getRiwayat");
        return await response.json();
    }
};