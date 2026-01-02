const API = {
    state: {
        masterHarga: [],
        keranjang: [],
        currentId: null,
        editingIndex: null
    },

    ambilHarga: async function() {
        // ... (Kode ambilHarga biarkan sama seperti sebelumnya) ...
        // ... Cuma copas bagian ini kalau kamu mau ringkas ...
        try {
            const response = await fetch(CONFIG.API_URL + "?action=getHarga", { method: "GET", mode: "cors" });
            const result = await response.json();
            if (result.status === 'success') {
                this.state.masterHarga = result.data;
                Calculator.isiDropdown();
                document.getElementById('status-db').innerText = "✅ Online";
                document.getElementById('status-db').style.color = "green";
            }
        } catch (e) { console.error(e); }
    },

    // 2. Kirim Pesanan (POST)
    simpanTransaksi: async function(dataPayload) {
        try {
            // Masukkan ID Transaksi saat ini ke payload
            // Jika null, biarkan null (nanti server bikin baru)
            dataPayload.idTransaksi = this.state.currentId; 

            const response = await fetch(CONFIG.API_URL, {
                method: 'POST',
                body: JSON.stringify({
                    action: 'simpanTransaksi',
                    ...dataPayload
                })
            });
            return await response.json();
        } catch (error) {
            return { status: 'error', message: 'Koneksi error' };
        }
    },
    // 3. Ambil Riwayat (GET)
    ambilRiwayat: async function() {
        try {
            const response = await fetch(CONFIG.API_URL + "?action=getRiwayat", { method: "GET", mode: "cors" });
            return await response.json();
        } catch (e) { return {status:'error'}; }
    },
    
    ambilTransaksiById: async function(id) {
        try {
            const response = await fetch(CONFIG.API_URL + "?action=getTransaksiById&id=" + id);
            return await response.json();
        } catch (e) {
            return { status: 'error', message: e.toString() };
        }
    }
};