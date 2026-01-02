const Catalog = {
    render: function() {
        const container = document.getElementById('catalog-container');
        container.innerHTML = ""; // Bersihkan dulu

        // Ambil data dari API State
        const data = API.state.masterHarga;
        
        if (data.length === 0) {
            container.innerHTML = "<p>Data sedang dimuat atau kosong...</p>";
            return;
        }

        // Kelompokkan item (Opsional, tapi biar rapi)
        data.forEach(item => {
            const card = document.createElement('div');
            card.className = 'catalog-card'; // Pastikan ada CSS-nya nanti
            card.innerHTML = `
                <div class="cat-icon">🏷️</div>
                <div class="cat-info">
                    <h4>${item.nama}</h4>
                    <p>${item.kategori}</p>
                    <span class="price">${CONFIG.formatRupiah(item.harga)} / ${item.satuan}</span>
                </div>
            `;
            container.appendChild(card);
        });
    }
};