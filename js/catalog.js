const Catalog = {
    state: {
        dataAsli: [],        
        filterKategori: 'Semua',
        filterSearch: ''
    },

    // 1. INISIALISASI (Dipanggil saat halaman load)
    init: function() {
        // Ambil data dari API (prioritas hargaRaw karena itu Array murni)
        const rawData = API.state.hargaRaw || API.state.harga;

        // Validasi: Pastikan datanya Array
        if (!Array.isArray(rawData)) {
            console.warn("Data Catalog bukan Array, set ke kosong.");
            this.state.dataAsli = []; // Set kosong biar gak error
            
            // Tampilkan pesan error di layar
            document.getElementById('catalog-container').innerHTML = 
                '<p style="text-align:center; padding:20px; color:red;">Gagal memuat format data.</p>';
            return; // STOP DISINI
        }

        this.state.dataAsli = rawData;
        this.renderCategoryButtons();
        this.renderList(this.state.dataAsli);
    },

    // 2. RENDER TOMBOL KATEGORI OTOMATIS
    renderCategoryButtons: function() {
        const catContainer = document.getElementById('categoryButtons');
        if(!catContainer) return;

        // Reset isi (sisakan tombol Semua)
        catContainer.innerHTML = `<button class="cat-btn active" onclick="Catalog.setCategory('Semua', this)">Semua</button>`;
        
        // Cari unik kategori dari data (Filter biar gak ada null/undefined)
        const unikKategori = [...new Set(this.state.dataAsli.map(item => item.kategori).filter(k => k))];

        unikKategori.forEach(kat => {
            const btn = document.createElement('button');
            btn.className = 'cat-btn';
            // Ubah jadi Title Case biar rapi (opsional, misal "rel" jadi "Rel")
            btn.innerText = kat.charAt(0).toUpperCase() + kat.slice(1);
            btn.onclick = (e) => this.setCategory(kat, e.target);
            catContainer.appendChild(btn);
        });
    },

    // 3. FUNGSI FILTER UTAMA
    filterData: function() {
        const keyword = document.getElementById('searchInput').value.toLowerCase();
        this.state.filterSearch = keyword;

        const hasilFilter = this.state.dataAsli.filter(item => {
            // Cek Kategori
            const matchKat = (this.state.filterKategori === 'Semua') || (item.kategori === this.state.filterKategori);
            
            // Cek Search (Nama)
            const namaBarang = item.nama ? item.nama.toLowerCase() : '';
            const matchSearch = namaBarang.includes(this.state.filterSearch);

            return matchKat && matchSearch;
        });

        this.renderList(hasilFilter);
    },

    // 4. ACTION SAAT KLIK KATEGORI
    setCategory: function(kategori, btnElement) {
        this.state.filterKategori = kategori;
        
        // Ubah warna tombol aktif
        document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
        btnElement.classList.add('active');

        this.filterData();
    },

    // 5. FITUR POPUP GAMBAR (LIGHTBOX)
    previewImage: function(src) {
        const lightbox = document.getElementById('imageLightbox');
        const img = document.getElementById('imgPreview');
        if(lightbox && img) {
            img.src = src;
            lightbox.style.display = 'flex';
        }
    },

    tutupPreview: function() {
        const lightbox = document.getElementById('imageLightbox');
        if(lightbox) lightbox.style.display = 'none';
    },

    // 6. RENDER DAFTAR BARANG (TAMPILAN KARTU GAMBAR)
    renderList: function(data) {
        const container = document.getElementById('catalog-container');
        if(!container) return;
        
        if (data.length === 0) {
            container.innerHTML = '<div style="text-align:center; padding:20px; grid-column:1/-1; color:#999;">Barang tidak ditemukan.</div>';
            return;
        }

        let html = "";
        data.forEach(item => {
            // Logika Gambar:
            // Cek properti 'gambar' atau 'image', fallback ke placeholder
            const imgSrc = item.gambar || item.image || 'https://via.placeholder.com/300x300?text=No+Image';

            html += `
                <div class="catalog-card">
                    <div class="catalog-img-wrapper" onclick="Catalog.previewImage('${imgSrc}')">
                        <img src="${imgSrc}" class="catalog-img" alt="${item.nama}" onerror="this.src='https://via.placeholder.com/300x300?text=Error'">
                    </div>
                    
                    <div class="catalog-info">
                        <h4 class="catalog-name">${item.nama}</h4>
                        <span class="catalog-price">${CONFIG.formatRupiah(item.harga)}</span>
                        <small style="color:#999; font-size:11px; margin-top:2px;">/${item.satuan || 'unit'}</small>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    }
};