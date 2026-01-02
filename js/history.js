const History = {
    allData: [],      // Menyimpan semua data mentah dari server
    currentPage: 1,   // Halaman aktif
    itemsPerPage: 10, // Batas per halaman

    render: async function() {
        const container = document.getElementById('history-container');
        container.innerHTML = '<p style="text-align:center; margin-top:20px;">Memuat data...</p>';

        // Ambil data dari API
        const response = await API.ambilRiwayat();
        
        if (response.status === 'success' && response.data.length > 0) {
            this.allData = response.data; // Simpan ke variable global object ini
            this.currentPage = 1;         // Reset ke halaman 1
            this.renderPage();            // Tampilkan halaman 1
        } else {
            container.innerHTML = '<div style="text-align:center; padding:30px; color:#999;">Belum ada riwayat.</div>';
        }
    },

    // FUNGSI RENDER HALAMAN TERTENTU
    renderPage: function() {
        const container = document.getElementById('history-container');
        container.innerHTML = ""; // Bersihkan dulu
        
        // Logic Potong Array (Pagination)
        const start = (this.currentPage - 1) * this.itemsPerPage;
        const end = start + this.itemsPerPage;
        const dataPage = this.allData.slice(start, end);

        // Render Card
        dataPage.forEach(trx => {
            const detailHtml = trx.ringkasan ? trx.ringkasan.replace(/\n/g, '<br>') : '-';
            const rawData = encodeURIComponent(trx.itemsJSON);

            const card = document.createElement('div');
            card.className = 'history-card';
            card.innerHTML = `
                <div class="hist-header">
                    <span class="hist-date">${trx.tanggal}</span>
                    <span class="hist-total">${trx.total}</span>
                </div>
                <h4 class="hist-name">${trx.nama}</h4>
                
                <div class="hist-detail">
                    ${detailHtml}
                </div>
                
                <div style="margin-top:10px; display:flex; gap:10px;">
                    <button onclick="History.editTransaksi('${trx.id}', '${trx.nama}', '${rawData}')" 
                            style="flex:1; background:#ffc107; color:black; font-size:13px;">
                        ✏️ Edit
                    </button>
                    
                    <button onclick="History.cetakInvoiceServer('${trx.id}')" 
                            style="flex:1; background:#007bff; color:white; border:none; padding:8px; border-radius:4px; font-weight:bold; cursor:pointer;">
                        🖨️ Cetak Invoice
                    </button>
                </div>
            `;
            container.appendChild(card);
        });

        // RENDER TOMBOL PAGINATION (Next/Prev)
        this.renderPaginationControls(container);
    },

    renderPaginationControls: function(container) {
        const totalPages = Math.ceil(this.allData.length / this.itemsPerPage);
        
        if (totalPages > 1) {
            const nav = document.createElement('div');
            nav.className = 'pagination-container';
            nav.innerHTML = `
                <button onclick="History.gantiHalaman(-1)" ${this.currentPage === 1 ? 'disabled' : ''}>⬅ Prev</button>
                <span style="align-self:center; color:#666;">Hal ${this.currentPage} / ${totalPages}</span>
                <button onclick="History.gantiHalaman(1)" ${this.currentPage === totalPages ? 'disabled' : ''}>Next ➡</button>
            `;
            container.appendChild(nav);
        }
    },

    gantiHalaman: function(arah) {
        this.currentPage += arah;
        this.renderPage();
        // Scroll ke atas otomatis biar enak
        document.getElementById('view-history').scrollIntoView({ behavior: 'smooth' });
    },

    editTransaksi: function(id, nama, rawJson) {
        const items = JSON.parse(decodeURIComponent(rawJson));
        API.state.keranjang = items;
        API.state.currentId = id;
        document.getElementById('namaPelanggan').value = nama;
        Calculator.renderKeranjang();
        Router.to('calculator');
        alert("Data dimuat untuk diedit!");
    },

    // FUNGSI BARU: AMBIL DATA DARI GSHEET -> PRINT PDF
    cetakInvoiceServer: async function(id) {
        if(!confirm("Cetak Invoice untuk Transaksi ini?")) return;

        const btn = event.target;
        const txt = btn.innerText;
        btn.innerText = "⏳ Loading...";
        btn.disabled = true;

        const res = await API.ambilTransaksiById(id);
        
        if (res.status === 'success') {
            const dataItems = JSON.parse(res.data.itemsJSON);
            const namaCust = res.data.namaPelanggan;
            const noBaris = res.data.noBaris; // Ambil No Baris
            const idTrx = res.data.id;        // Ambil ID Transaksi

            // Panggil Calculator dengan 5 Parameter
            Calculator.generateInvoice('CUSTOMER', dataItems, namaCust, noBaris, idTrx);
        } else {
            alert("Gagal mengambil data: " + res.message);
        }

        btn.innerText = txt;
        btn.disabled = false;
    }
};