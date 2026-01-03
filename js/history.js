const History = {
    state: {
        dataAsli: [],      // Data mentah dari server
        dataFiltered: [],  // Data hasil pencarian
        currentPage: 1,    // Halaman saat ini
        itemsPerPage: 10   // Batas item per halaman (Biar ringan)
    },

    // 1. INISIALISASI
    init: async function() {
        const container = document.getElementById('history-container');
        
        try {
            const res = await API.ambilRiwayat();
            
            if(res.status === 'success' && Array.isArray(res.data)) {
                // Simpan data & Balik urutan (Terbaru diatas)
                this.state.dataAsli = res.data.reverse(); 
                this.state.dataFiltered = this.state.dataAsli; // Awalnya tampilkan semua
                
                // Render Halaman Pertama
                this.renderManager(); 
            } else {
                container.innerHTML = `<div style="text-align:center; padding:20px; color:red;">Gagal mengambil data riwayat.</div>`;
            }

        } catch (e) {
            console.error(e);
            container.innerHTML = `<div style="text-align:center; padding:20px; color:red;">Error koneksi: ${e.message}</div>`;
        }
    },

    // 2. FITUR PENCARIAN & FILTER
    filterData: function() {
        const keyword = document.getElementById('searchHistory').value.toLowerCase();
        
        // Filter dari data asli
        this.state.dataFiltered = this.state.dataAsli.filter(item => {
            const nama = item.nama.toLowerCase();
            const tgl = item.tanggal.toLowerCase();
            return nama.includes(keyword) || tgl.includes(keyword);
        });

        // Reset ke Halaman 1 setiap kali mencari
        this.state.currentPage = 1;
        this.renderManager();
    },

    // 3. MANAGER HALAMAN (LOGIKA PAGINATION)
    renderManager: function() {
        // Hitung potong data dari index mana ke mana
        const start = (this.state.currentPage - 1) * this.state.itemsPerPage;
        const end = start + this.state.itemsPerPage;
        
        // Ambil potongan data (misal: data ke 1-10)
        const dataPage = this.state.dataFiltered.slice(start, end);

        // Render List & Tombol Navigasi
        this.renderList(dataPage);
        this.renderPaginationControls();
    },

    // 4. RENDER KARTU RIWAYAT
    renderList: function(data) {
        const container = document.getElementById('history-container');
        container.innerHTML = "";

        if(data.length === 0) {
            container.innerHTML = `
                <div style="text-align:center; padding:40px; color:#999; border:2px dashed #eee; border-radius:10px;">
                    <div style="font-size:30px; margin-bottom:10px;">📂</div>
                    Tidak ada riwayat ditemukan.
                </div>`;
            return;
        }

        data.forEach(item => {
            // --- BAGIAN PERBAIKAN ---
            // Kita paksa ubah nama jadi String (Teks), kalau kosong jadi teks kosong ""
            const rawName = item.nama ? item.nama.toString() : ""; 
            
            const isSurvey = rawName.includes("[SURVEY]");
            const namaDisplay = rawName.replace("[SURVEY]", "").trim() || "Tanpa Nama"; // Default jika kosong
            // ------------------------

            const badge = isSurvey 
                ? `<span class="status-badge survey">📝 DRAFT SURVEY</span>` 
                : `<span class="status-badge done">✅ INVOICE SELESAI</span>`;
            
            const hp = item.hp ? item.hp.toString() : ""; // Amanin HP juga

            let ringkasanBarang = "-";
            let safeJSON = "";
            try {
                const items = JSON.parse(item.itemsJSON);
                const namaBarang = items.map(i => i.nama.split(' (')[0]); 
                ringkasanBarang = namaBarang.slice(0, 2).join(", ");
                if(items.length > 2) ringkasanBarang += `, +${items.length - 2} lainnya`;
                
                safeJSON = encodeURIComponent(item.itemsJSON);
            } catch(e) { ringkasanBarang = "Detail error / Data Lama"; }

            const card = document.createElement('div');
            card.className = 'card';
            card.style.borderLeft = isSurvey ? "5px solid #ffc107" : "5px solid #28a745";
            
            // Perhatikan: Kita pakai rawName untuk ID tombol edit/print agar aman
            card.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:10px;">
                    <div>
                        <div style="font-size:12px; color:#999; margin-bottom:4px;">${item.tanggal}</div>
                        <h3 style="margin:0; font-size:16px; border:none; padding:0;">${namaDisplay}</h3>
                        ${hp ? `<div style="font-size:12px; color:#666; margin-top:2px;">📞 ${hp}</div>` : ''}
                    </div>
                    ${badge}
                </div>
                <div style="background:#f8f9fa; padding:10px; border-radius:8px; font-size:13px; color:#555; margin-bottom:10px;">
                    📦 <strong>Item:</strong> ${ringkasanBarang}
                </div>
                <div style="display:flex; justify-content:space-between; align-items:center; font-weight:bold; font-size:16px; color:#333;">
                    <span>Total:</span>
                    <span>${CONFIG.formatRupiah(item.total)}</span>
                </div>
                <div class="history-actions">
                    <button onclick="Calculator.generateInvoice('CUSTOMER', JSON.parse(decodeURIComponent('${safeJSON}')), '${namaDisplay}<br>${hp}', '${item.id}', '${item.id}')" 
                        style="background:#17a2b8; color:white; font-size:12px; padding:8px;">
                        🖨️ Print
                    </button>
                    
                    <button onclick="History.editTransaksi('${item.id}', '${namaDisplay}', '${hp}', '${safeJSON}')" 
                        style="background:#ffc107; color:#333; font-size:12px; padding:8px;">
                        ✏️ Edit
                    </button>
                </div>
            `;
            container.appendChild(card);
        });
    },

    // 5. RENDER TOMBOL NEXT / PREV
    renderPaginationControls: function() {
        const container = document.getElementById('history-container');
        const totalPages = Math.ceil(this.state.dataFiltered.length / this.state.itemsPerPage);

        // Jika halamannya cuma 1, sembunyikan navigasi
        if (totalPages <= 1) return;

        const nav = document.createElement('div');
        nav.className = 'pagination-container';
        
        // Tombol PREV (Ikon Panah Kiri)
        const btnPrev = document.createElement('button');
        btnPrev.className = 'page-btn';
        btnPrev.innerHTML = "❮"; // Panah Kiri
        btnPrev.disabled = this.state.currentPage === 1;
        btnPrev.onclick = () => {
            if(this.state.currentPage > 1) {
                this.state.currentPage--;
                this.renderManager();
                document.querySelector('.content-container').scrollIntoView({behavior: 'smooth'});
            }
        };

        // Info Halaman (Chip Style)
        const info = document.createElement('span');
        info.className = 'page-info';
        info.innerText = `${this.state.currentPage} / ${totalPages}`;

        // Tombol NEXT (Ikon Panah Kanan)
        const btnNext = document.createElement('button');
        btnNext.className = 'page-btn';
        btnNext.innerHTML = "❯"; // Panah Kanan
        btnNext.disabled = this.state.currentPage === totalPages;
        btnNext.onclick = () => {
            if(this.state.currentPage < totalPages) {
                this.state.currentPage++;
                this.renderManager();
                document.querySelector('.content-container').scrollIntoView({behavior: 'smooth'});
            }
        };

        nav.appendChild(btnPrev);
        nav.appendChild(info);
        nav.appendChild(btnNext);
        
        container.appendChild(nav);
    },

    // 6. ACTION EDIT
    editTransaksi: function(id, nama, hp, rawJson) {
        if(!confirm(`Edit transaksi milik ${nama}?\nData saat ini di kalkulator akan ditimpa.`)) return;
        
        localStorage.setItem('edit_trx_id', id);
        localStorage.setItem('edit_trx_nama', nama);
        localStorage.setItem('edit_trx_hp', hp); // SIMPAN HP
        localStorage.setItem('edit_trx_data', rawJson);
        
        window.location.href = 'calculator.html';
    }
};