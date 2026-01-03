const Calculator = {
    // 1. HELPER & UI
    toggleMode: function() {
        const radio = document.querySelector('input[name="modeModel"]:checked');
        const mode = radio ? radio.value : 'FULL'; 
        const g = document.getElementById('areaGordyn');
        const v = document.getElementById('areaVitrace');
        if(!g || !v) return;

        if (mode === 'FULL') { g.style.display = 'block'; v.style.display = 'block'; }
        else if (mode === 'GORDYN') { g.style.display = 'block'; v.style.display = 'none'; }
        else if (mode === 'VITRACE') { g.style.display = 'none'; v.style.display = 'block'; }
    },

    pilihDropdownOtomatis: function(idDropdown, textDicari) {
        const select = document.getElementById(idDropdown);
        if(!select || !textDicari) return;
        for (let i = 0; i < select.options.length; i++) {
            if (select.options[i].text.includes(textDicari)) { select.selectedIndex = i; break; }
        }
    },

    // --- KONTROL MODAL FORM ---
    bukaFormBaru: function() {
        this.resetForm(); 
        document.getElementById('modalInput').style.display = 'flex';
        const btn = document.getElementById('btn-action-item');
        btn.innerHTML = "✅ Tambah ke Daftar";
        btn.style.backgroundColor = "#28a745";
        btn.style.color = "white";
    },

    tutupForm: function() {
        document.getElementById('modalInput').style.display = 'none';
        API.state.editingIndex = null; 
    },

    // 2. FITUR EDIT ITEM (POPUP)
    editItem: function(index) {
        try {
            const item = API.state.keranjang[index];
            if(!item) return;

            API.state.editingIndex = index; 

            document.getElementById('namaJendela').value = item.nama.replace(' (Vitrace Only)', '');
            document.getElementById('lebarJendela').value = item.spek.L;
            document.getElementById('tinggiJendela').value = item.spek.T;

            let mode = 'GORDYN';
            if (item.gordyn && item.gordyn.kain.harga > 0 && item.vitrace) mode = 'FULL';
            else if (item.vitrace && (!item.gordyn || item.gordyn.kain.harga === 0)) mode = 'VITRACE';
            
            const radios = document.getElementsByName('modeModel');
            for(let r of radios) r.checked = (r.value === mode);
            this.toggleMode();

            if (item.gordyn && item.gordyn.kain.harga > 0) {
                document.getElementById('rasioBahan').value = item.gordyn.rasio || 2.5;
                document.getElementById('hargaKain').value = CONFIG.formatInputUang(item.gordyn.kain.hargaPerM.toString());
                this.pilihDropdownOtomatis('pilihRel', item.gordyn.rel.nama);
                this.pilihDropdownOtomatis('pilihRing', item.gordyn.ring.nama);
            }

            if (item.vitrace) {
                const calcRasio = item.vitrace.kain.total / item.spek.L;
                document.getElementById('rasioVitrace').value = isNaN(calcRasio) ? 2.5 : calcRasio.toFixed(1);
                document.getElementById('hargaVitrace').value = CONFIG.formatInputUang(item.vitrace.kain.hargaPerM.toString());
                this.pilihDropdownOtomatis('pilihRelVitrace', item.vitrace.rel.nama);
                this.pilihDropdownOtomatis('pilihRingVitrace', item.vitrace.ring.nama);
            }

            const btn = document.getElementById('btn-action-item');
            btn.innerHTML = "💾 Simpan Perubahan";
            btn.style.backgroundColor = "#ffc107"; 
            btn.style.color = "#000";

            document.getElementById('modalInput').style.display = 'flex';

        } catch (e) {
            alert("Error saat Edit: " + e.message);
        }
    },

    // 3. LOGIC HITUNG & SIMPAN ITEM
    tambahItem: function() {
        try {
            const radio = document.querySelector('input[name="modeModel"]:checked');
            const mode = radio ? radio.value : 'FULL';
            const nama = document.getElementById('namaJendela').value || "Jendela " + (API.state.keranjang.length + 1);
            const L = parseFloat(document.getElementById('lebarJendela').value) || 0;
            const T = parseFloat(document.getElementById('tinggiJendela').value) || 0;
            
            if(L === 0 || T === 0) return alert("Ukuran Lebar & Tinggi harus diisi!");

            let subTotal = 0;
            
            // Hitung Gordyn
            let gordynData = { kain: { harga: 0, total: 0, hargaPerM: 0 }, rel: { nama: "Tidak Pakai", harga: 0, pjg: 0 }, ring: { nama: "Tidak Pakai", harga: 0, qty: 0 } };
            if (mode !== 'VITRACE') {
                const hargaKainInput = document.getElementById('hargaKain').value;
                if(hargaKainInput === "" || hargaKainInput === "0") return alert("Harga Kain Gordyn belum diisi!");
                const rasio = parseFloat(document.getElementById('rasioBahan').value) || 2.5;
                const hargaKain = CONFIG.bersihkanTitik(hargaKainInput);
                const relVal = document.getElementById('pilihRel').value.split('-');
                const ringVal = document.getElementById('pilihRing').value.split('-');

                const pemakaianKain = L * rasio; 
                const totalKain = Math.ceil(pemakaianKain * 10) / 10; 
                const hargaTotalKain = totalKain * hargaKain;
                const pjgRel = L; 
                let hargaRel = parseFloat(relVal[0]) * pjgRel;
                let qtyRing = 0; let hargaRing = 0;
                if (parseFloat(ringVal[0]) > 0) {
                    qtyRing = Math.ceil(pemakaianKain * 10);
                    hargaRing = parseFloat(ringVal[0]) * qtyRing;
                }
                subTotal += (hargaTotalKain + hargaRel + hargaRing);
                gordynData = { rasio: rasio, kain: { harga: hargaTotalKain, total: totalKain, hargaPerM: hargaKain }, rel: { nama: relVal[1], harga: hargaRel, pjg: pjgRel }, ring: { nama: ringVal[1], harga: hargaRing, qty: qtyRing } };
            }

            // Hitung Vitrace
            let vitraceData = null;
            if(mode === 'FULL' || mode === 'VITRACE') {
                const hargaVitInput = document.getElementById('hargaVitrace').value;
                if(hargaVitInput === "" || hargaVitInput === "0") return alert("Harga Kain Vitrace belum diisi!");
                const hVit = CONFIG.bersihkanTitik(hargaVitInput);
                const rVit = parseFloat(document.getElementById('rasioVitrace').value) || 2.5;
                const relVitVal = document.getElementById('pilihRelVitrace').value.split('-');
                const ringVitVal = document.getElementById('pilihRingVitrace').value.split('-');

                const pakaiVit = L * rVit;
                const totVit = Math.ceil(pakaiVit * 10) / 10;
                const hargaTotVit = totVit * hVit;
                const hargaRelVit = parseFloat(relVitVal[0]) * L;
                let qtyRingVit = 0; let hargaRingVit = 0;
                if (parseFloat(ringVitVal[0]) > 0) {
                    qtyRingVit = Math.ceil(pakaiVit * 10);
                    hargaRingVit = parseFloat(ringVitVal[0]) * qtyRingVit;
                }
                subTotal += (hargaTotVit + hargaRelVit + hargaRingVit);
                vitraceData = { kain: { harga: hargaTotVit, total: totVit, hargaPerM: hVit }, rel: { nama: relVitVal[1], harga: hargaRelVit }, ring: { nama: ringVitVal[1], harga: hargaRingVit, qty: qtyRingVit } };
            }

            const isEditing = (API.state.editingIndex !== null && API.state.editingIndex !== undefined);
            const itemBaru = {
                id: isEditing ? API.state.keranjang[API.state.editingIndex].id : Date.now(),
                nama: nama + (mode === 'VITRACE' ? ' (Vitrace Only)' : ''),
                spek: { L: L, T: T },
                gordyn: gordynData,
                vitrace: vitraceData,
                subTotal: subTotal
            };

            if (isEditing) {
                API.state.keranjang[API.state.editingIndex] = itemBaru;
            } else {
                API.state.keranjang.push(itemBaru);
            }

            this.renderKeranjang();
            this.tutupForm(); 
            this.resetForm();

        } catch (e) {
            alert("❌ Gagal Menyimpan: " + e.message);
        }
    },

    resetForm: function() {
        API.state.editingIndex = null; 
        document.getElementById('namaJendela').value = "";
        document.getElementById('lebarJendela').value = "";
        document.getElementById('tinggiJendela').value = "";
        document.getElementById('hargaKain').value = "";
        document.getElementById('hargaVitrace').value = "";
        const radios = document.getElementsByName('modeModel');
        for(let r of radios) { if(r.value === 'FULL') r.checked = true; }
        this.toggleMode(); 
    },

    // 4. RENDER KERANJANG
    renderKeranjang: function() {
        const list = document.getElementById('list-keranjang');
        const totalEl = document.getElementById('grand-total');
        list.innerHTML = "";
        let grandTotal = 0;

        if(API.state.keranjang.length === 0) {
            list.innerHTML = `<div style="text-align:center; padding:40px 20px; color:#999; border:2px dashed #eee; border-radius:10px;"><div style="font-size:30px; margin-bottom:10px;">📭</div>Belum ada item pesanan.<br><small>Klik tombol <strong>(+)</strong> di bawah untuk tambah.</small></div>`;
            totalEl.innerText = "Rp 0";
            return;
        }

        API.state.keranjang.forEach((item, index) => {
            grandTotal += item.subTotal;
            const row = (label, qty, unit, totalPrice) => {
                let unitPrice = qty > 0 ? totalPrice / qty : 0;
                return `<div class="detail-row"><span style="display:flex; flex-direction:column;"><span>${label}</span><span style="color:#999; font-size:10px;">${qty}${unit} x ${CONFIG.formatRupiah(unitPrice)}</span></span><span style="font-weight:500;">${CONFIG.formatRupiah(totalPrice)}</span></div>`;
            };

            let detailContent = "";
            if (item.isSurvey && item.subTotal === 0) {
                detailContent = `<div style="background:#fff3cd; color:#856404; padding:10px; border-radius:4px; text-align:center; font-size:13px;">⚠️ <strong>Data Survey (Draft)</strong><br>Klik tombol <strong>Edit</strong> untuk hitung harga.</div>`;
            } else {
                if(item.gordyn && item.gordyn.kain.harga > 0) {
                    detailContent += `<div style="font-weight:bold; color:#333; font-size:12px; margin-bottom:5px; margin-top:5px;">🅰️ GORDYN</div>`;
                    detailContent += row("Kain", item.gordyn.kain.total, "m", item.gordyn.kain.harga);
                    if(item.gordyn.rel.harga > 0) detailContent += row("Rel " + item.gordyn.rel.nama, item.gordyn.rel.pjg, "m", item.gordyn.rel.harga);
                    if(item.gordyn.ring.qty > 0) detailContent += row("Ring " + item.gordyn.ring.nama, item.gordyn.ring.qty, "pcs", item.gordyn.ring.harga);
                }
                if(item.vitrace && item.vitrace.kain.harga > 0) {
                    detailContent += `<div class="detail-group"><div style="font-weight:bold; color:#28a745; font-size:12px; margin-bottom:5px;">🅱️ VITRACE</div></div>`;
                    detailContent += row("Kain Vit", item.vitrace.kain.total, "m", item.vitrace.kain.harga);
                    if(item.vitrace.rel.harga > 0) detailContent += row("Rel Vit " + item.vitrace.rel.nama, item.spek.L, "m", item.vitrace.rel.harga);
                    if(item.vitrace.ring.qty > 0) detailContent += row("Ring Vit " + item.vitrace.ring.nama, item.vitrace.ring.qty, "pcs", item.vitrace.ring.harga);
                }
            }

            const card = document.createElement('div');
            card.className = 'order-card';
            card.innerHTML = `
                <div class="order-header">
                    <div><div style="font-weight:bold; color:#333;">${index + 1}. ${item.nama}</div><span class="badge-size">L: ${item.spek.L}m x T: ${item.spek.T}m</span></div>
                </div>
                <div class="order-body">${detailContent}</div>
                <div class="order-footer">
                    <div style="font-weight:bold; font-size:16px; color:#2c3e50;">${CONFIG.formatRupiah(item.subTotal)}</div>
                    <div style="display:flex; gap:8px;">
                        <button onclick="Calculator.editItem(${index})" style="background:#ffc107; border:none; padding:6px 12px; border-radius:4px; cursor:pointer; font-size:12px; font-weight:bold; color:#333;">✏️ Edit</button>
                        <button onclick="Calculator.hapusItem(${index})" style="background:#ffebee; border:1px solid #ffcdd2; padding:6px 12px; border-radius:4px; cursor:pointer; font-size:12px; color:#c62828;">🗑️ Hapus</button>
                    </div>
                </div>
            `;
            list.appendChild(card);
        });
        totalEl.innerText = CONFIG.formatRupiah(grandTotal);
    },

    hapusItem: function(index) {
        if(confirm("Yakin ingin menghapus item ini?")) {
            if(API.state.editingIndex === index) { this.tutupForm(); }
            API.state.keranjang.splice(index, 1);
            this.renderKeranjang();
        }
    },

    // 5. FITUR DATABASE & SURVEY (UPDATE HP DISINI)
    bukaModalSurvey: async function() {
        const modal = document.getElementById('modalSurvey');
        const container = document.getElementById('list-survey-container');
        modal.style.display = 'flex';
        
        container.innerHTML = `
            <div style="text-align:center; padding:30px; color:#666;">
                <div style="font-size:30px; margin-bottom:10px; animation:spin 1s infinite linear;">⏳</div>
                Sedang mencari data survey...
            </div>`;

        try {
            const res = await API.ambilRiwayat();
            if(res.status === 'success') {
                
                // --- BAGIAN PERBAIKAN ---
                // Filter hanya yang namanya mengandung kata [SURVEY]
                // Kita tambahkan pengaman: (item.nama || "") agar kalau kosong tidak error
                const dataSurvey = res.data.filter(item => {
                    const rawName = item.nama ? item.nama.toString() : "";
                    return rawName.includes("[SURVEY]");
                });
                // ------------------------

                if(dataSurvey.length === 0) {
                    container.innerHTML = `
                        <div style="text-align:center; padding:30px; border:2px dashed #eee; border-radius:10px; color:#999;">
                            <div style="font-size:40px; margin-bottom:10px;">📭</div>
                            Tidak ada data survey ditemukan.<br>
                            <small>Silakan input data baru di menu "Survey Lapangan".</small>
                        </div>`;
                    return;
                }

                let html = `<div class="survey-list-grid">`;
                
                dataSurvey.forEach(item => {
                    const rawJson = encodeURIComponent(item.itemsJSON);
                    
                    // Bersihkan nama dari tag [SURVEY]
                    // Pakai pengaman .toString() lagi biar aman
                    const rawName = item.nama ? item.nama.toString() : "";
                    const namaClean = rawName.replace("[SURVEY]", "").trim() || "Tanpa Nama";
                    
                    const hp = item.hp || ""; 

                    let itemCount = "Detail Item";
                    try { 
                        const parsed = JSON.parse(item.itemsJSON); 
                        itemCount = parsed.length + " Jendela"; 
                    } catch(e) {}

                    html += `
                        <div class="survey-card" onclick="Calculator.muatSurvey('${item.id}', '${namaClean}', '${rawJson}', '${hp}')">
                            <div class="survey-icon-box">📝</div>
                            <div class="survey-info">
                                <h4>${namaClean}</h4>
                                <div class="survey-meta">
                                    <span>📅 ${item.tanggal}</span> • <span>📦 ${itemCount}</span>
                                </div>
                            </div>
                            <div class="survey-arrow">❯</div>
                        </div>
                    `;
                });
                html += `</div>`;
                container.innerHTML = html;
            } else { container.innerHTML = "<p style='color:red; text-align:center;'>Gagal mengambil data.</p>"; }
        } catch (e) { container.innerHTML = "<p style='color:red; text-align:center;'>Error: " + e.message + "</p>"; }
    },

    muatSurvey: function(id, nama, rawJson, hp = "") {
        if(!confirm(`Load data survey milik ${nama}?`)) return;
        try {
            const items = JSON.parse(decodeURIComponent(rawJson));
            API.state.keranjang = items;
            API.state.currentId = id; 
            document.getElementById('namaPelanggan').value = nama;
            document.getElementById('noHp').value = hp; // ISI KOLOM HP
            document.getElementById('modalSurvey').style.display = 'none';
            this.renderKeranjang();
        } catch (e) { alert("Gagal: " + e.message); }
    },

    simpanDatabase: function() {
        if(API.state.keranjang.length === 0) return alert("Keranjang kosong!");
        const nama = document.getElementById('namaPelanggan').value || "Pelanggan";
        const hp = document.getElementById('noHp').value; // AMBIL INPUT HP

        let total = 0;
        API.state.keranjang.forEach(i => total += i.subTotal);

        if(!confirm(`Simpan transaksi ${nama}?`)) return;

        const btn = document.querySelector('.btn-save');
        let txt = "💾 Simpan"; if(btn) { txt=btn.innerText; btn.innerText="⏳..."; btn.disabled=true; }

        API.simpanTransaksi({ 
            idTransaksi: API.state.currentId || null, 
            namaPelanggan: nama, 
            hpPelanggan: hp, // KIRIM HP KE API
            totalGrand: total, 
            items: API.state.keranjang 
        })
        .then(res => {
            if(btn) { btn.innerText=txt; btn.disabled=false; }
            if(res.status === 'success') {
                alert("✅ Tersimpan!");
                API.state.keranjang = []; API.state.currentId = null;
                document.getElementById('namaPelanggan').value = "";
                document.getElementById('noHp').value = "";
                this.renderKeranjang();
                window.location.href = 'dashboard.html';
            } else { alert("❌ Gagal: " + res.message); }
        }).catch(e => { if(btn) btn.disabled=false; alert("Error: " + e.message); });
    },

    // --- INVOICE GENERATOR ---
    generateInvoice: function(tipe, customData=null, customNama=null, customRow=null, customId=null) {
        // 1. Ambil Data Keranjang (Prioritas: Data Custom dari History -> Data State Sekarang)
        let keranjangAktif = customData ? customData : API.state.keranjang;
        if(!keranjangAktif || keranjangAktif.length === 0) return alert("Data keranjang kosong!");

        // 2. Logika Tampilan Nama & HP
        let namaTampil = "Pelanggan";
        
        if (customNama) {
            // KASUS A: DARI HISTORY (Data Nama dikirim lewat parameter)
            // Kita cek apakah di dalamnya ada separator <br> (artinya ada HP-nya)
            if(customNama.includes('<br>')) {
                // Kita pecah biar bisa kita styling ulang HP-nya jadi kecil & abu-abu
                const parts = customNama.split('<br>');
                namaTampil = `${parts[0]} <br><span style="font-size:12px; font-weight:normal; color:#555;">${parts[1]}</span>`;
            } else {
                namaTampil = customNama;
            }
        } else {
            // KASUS B: DARI KALKULATOR (Ambil langsung dari Input Form)
            const elNama = document.getElementById('namaPelanggan');
            const elHp = document.getElementById('noHp');

            if (elNama) {
                const valNama = elNama.value || "Pelanggan";
                const valHp = elHp ? elHp.value : "";
                
                // Format: Nama Besar, HP Kecil di bawahnya
                namaTampil = valHp ? `${valNama} <br><span style="font-size:12px; font-weight:normal; color:#555;">${valHp}</span>` : valNama;
            }
        }

        // 3. Data Toko (Static)
        const namaToko = "Duta Interior Gordyn"; 
        const alamatToko = "Tangerang, Banten | WA: 0812-3456-7890";
        const logoSrc = "assets/logo.png"; 
        const infoBank = "BCA 123-456-7890 a/n Duta Rifki"; 

        // 4. Metadata Invoice
        let custId = customId || API.state.currentId || "-";
        let invNo = customRow || API.state.currentRow || "DRAFT";
        let grandTotal = 0;

        // 5. Susun HTML
        let html = `
            <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; max-width: 800px; margin: auto; color: #333; line-height: 1.4;">
                <div style="display: flex; align-items: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px;">
                    <img src="${logoSrc}" onerror="this.style.display='none'" style="width: 80px; height: 80px; object-fit: contain; margin-right: 20px;">
                    <div style="flex: 1;">
                        <h2 style="margin: 0; color: #2c3e50; font-size: 24px; font-weight: 800; letter-spacing: 1px;">${namaToko}</h2>
                        <p style="margin: 5px 0 0; font-size: 13px; color: #555;">${alamatToko}</p>
                    </div>
                    <div style="text-align: right;">
                        <h1 style="margin: 0; font-size: 32px; color: #bdc3c7; letter-spacing: 2px;">INVOICE</h1>
                        <p style="margin: 5px 0 0; font-size: 16px; font-weight:bold; color:#2c3e50;">#${invNo}</p>
                        <p style="margin: 2px 0 0; font-size: 12px; color: #7f8c8d;">${CONFIG.getTodayDate()}</p>
                    </div>
                </div>
                <div style="display: flex; justify-content: flex-end; margin-bottom: 30px;">
                    <div style="text-align: right;">
                        <span style="font-size: 10px; color: #95a5a6; letter-spacing: 1px; text-transform: uppercase; font-weight: bold;">TAGIHAN UNTUK (BILL TO):</span>
                        <h3 style="margin: 5px 0 0; font-size: 18px; color: #2c3e50;">${namaTampil}</h3>
                        <p style="margin: 2px 0 0; font-size: 12px; color: #555;">Customer ID: <strong>${custId}</strong></p>
                    </div>
                </div>
                <div style="display: flex; padding-bottom: 10px; border-bottom: 2px solid #2c3e50; font-weight: bold; font-size: 11px; color: #2c3e50; text-transform: uppercase;">
                    <div style="width: 40px; text-align: center;">No</div>
                    <div style="flex: 1; padding-left: 10px;">Deskripsi & Spesifikasi Pekerjaan</div>
                    <div style="width: 150px; text-align: right;">Total (IDR)</div>
                </div>
                <div style="margin-bottom: 30px;">
        `;

        keranjangAktif.forEach((item, index) => {
            grandTotal += item.subTotal;
            
            // Helper function untuk baris item
            const makeRow = (label, qty, unitPrice, totalPrice) => {
                if(totalPrice <= 0) return "";
                // Safety check agar tidak muncul NaN/Infinity
                let safeUnitPrice = (qty > 0) ? totalPrice / qty : 0;
                // Jika unitPrice dikirim spesifik, pakai itu. Jika tidak, hitung manual.
                if(unitPrice && unitPrice > 0) safeUnitPrice = unitPrice;

                return `<div style="display:flex; justify-content:space-between; font-size:11px; color:#555; padding: 2px 0;">
                    <span>${label} <span style="color:#999; font-size:10px;">(${qty} x ${CONFIG.formatRupiah(safeUnitPrice)})</span></span>
                    <span>${CONFIG.formatRupiah(totalPrice)}</span>
                </div>`;
            };

            let detailHtml = "";
            
            // A. GORDYN
            if (item.gordyn && item.gordyn.kain.total > 0) { // Cek total > 0 lebih aman
                let hKainG = item.gordyn.kain.hargaPerM || (item.gordyn.kain.harga / item.gordyn.kain.total);
                detailHtml += makeRow("• Kain Gordyn", item.gordyn.kain.total + "m", hKainG, item.gordyn.kain.harga);
                
                if(item.gordyn.rel.harga > 0) {
                    detailHtml += makeRow(`• Rel ${item.gordyn.rel.nama}`, item.gordyn.rel.pjg + "m", 0, item.gordyn.rel.harga);
                }
                if(item.gordyn.ring.harga > 0) {
                    detailHtml += makeRow(`• Ring ${item.gordyn.ring.nama}`, item.gordyn.ring.qty + "pcs", 0, item.gordyn.ring.harga);
                }
            }

            // B. VITRACE
            if(item.vitrace && item.vitrace.kain.total > 0) {
                detailHtml += `<div style="margin: 6px 0 2px 0; font-weight:bold; font-size:10px; color:#27ae60;">PAKET VITRACE</div>`;
                let hKainV = item.vitrace.kain.hargaPerM || (item.vitrace.kain.harga / item.vitrace.kain.total);
                detailHtml += makeRow("• Kain Vitrace", item.vitrace.kain.total + "m", hKainV, item.vitrace.kain.harga);
                
                if(item.vitrace.rel.harga > 0) {
                    // Asumsi panjang rel vitrace sama dengan panjang jendela (L)
                    let pjgRelV = item.spek.L; 
                    detailHtml += makeRow(`• Rel ${item.vitrace.rel.nama}`, pjgRelV + "m", 0, item.vitrace.rel.harga);
                }
            }

            const svgVisual = `
            <svg width="70" height="60" viewBox="0 0 120 100" style="display:block; margin-top:5px;">
                <rect x="30" y="20" width="70" height="60" style="fill:#ecf0f1;stroke:#bdc3c7;stroke-width:2" />
                <line x1="30" y1="10" x2="100" y2="10" style="stroke:#2c3e50;stroke-width:2" />
                <line x1="30" y1="5" x2="30" y2="15" style="stroke:#2c3e50;stroke-width:2" />
                <line x1="100" y1="5" x2="100" y2="15" style="stroke:#2c3e50;stroke-width:2" />
                <text x="65" y="8" text-anchor="middle" fill="#2c3e50" font-size="12" font-weight="bold">${item.spek.L}m</text>
                <line x1="20" y1="20" x2="20" y2="80" style="stroke:#2c3e50;stroke-width:2" />
                <line x1="15" y1="20" x2="25" y2="20" style="stroke:#2c3e50;stroke-width:2" />
                <line x1="15" y1="80" x2="25" y2="80" style="stroke:#2c3e50;stroke-width:2" />
                <text x="10" y="50" text-anchor="middle" fill="#2c3e50" font-size="12" font-weight="bold" transform="rotate(-90, 10, 50)">${item.spek.T}m</text>
            </svg>`;
            
            html += `
                <div style="display: flex; padding: 15px 0; border-bottom: 1px solid #eee;">
                    <div style="width: 40px; text-align: center; font-size: 11px; color: #7f8c8d; padding-top: 5px;">${index + 1}</div>
                    <div style="flex: 1; padding-left: 10px; display: flex;">
                        <div style="width: 80px; margin-right: 15px;">${svgVisual}</div>
                        <div style="flex: 1;">
                            <strong style="font-size: 14px; color: #2c3e50;">${item.nama}</strong>
                            <div style="margin-top: 8px;">${detailHtml}</div>
                        </div>
                    </div>
                    <div style="width: 150px; text-align: right; font-weight: 600; font-size: 14px; color: #2c3e50; padding-top: 5px;">
                        ${CONFIG.formatRupiah(item.subTotal)}
                    </div>
                </div>`;
        });

        // 6. Footer (Total & Info Pembayaran)
        html += `</div> 
                <div style="display: flex; justify-content: flex-end; margin-top: 10px;">
                    <div style="width: 250px;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 12px; color: #7f8c8d;">
                            <span>Subtotal</span>
                            <span>${CONFIG.formatRupiah(grandTotal)}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; padding: 15px 0; border-top: 2px solid #2c3e50; border-bottom: 2px solid #2c3e50; align-items: center;">
                            <span style="font-weight: bold; color: #2c3e50;">TOTAL</span>
                            <span style="font-size: 20px; font-weight: bold; color: #2c3e50;">${CONFIG.formatRupiah(grandTotal)}</span>
                        </div>
                    </div>
                </div>
                <div style="margin-top: 60px; display: flex; justify-content: space-between; font-size: 11px; color: #7f8c8d;">
                    <div style="width: 60%;">
                        <strong style="color: #2c3e50;">INFORMASI PEMBAYARAN:</strong>
                        <p style="margin: 5px 0;">Silakan transfer pembayaran ke:</p>
                        <p style="margin: 0; color: #2c3e50; font-weight: bold;">${infoBank}</p>
                    </div>
                    <div style="width: 35%; text-align: right; display:flex; flex-direction:column; justify-content:flex-end;">
                        <div style="height: 60px;"></div>
                        <p style="margin: 0; font-weight: bold; color: #2c3e50; text-align:center;">${namaToko}</p>
                    </div>
                </div>
            </div>`;

        // 7. Render & Download
        const areaPrint = document.getElementById('invoice-area');
        areaPrint.innerHTML = html;
        document.body.classList.add('printing'); 
        window.scrollTo(0, 0);

        const btnClass = tipe === 'CUSTOMER' ? '.btn-print' : '.btn-print-owner';
        const btn = document.querySelector(btnClass);
        if(btn) { var oldTxt = btn.innerText; btn.innerText = "⏳ HD PDF..."; btn.disabled = true; }

        // Bersihkan nama file dari karakter HTML (<br>)
        const cleanName = namaTampil.replace(/<[^>]*>/g, ' ').split('(')[0].trim().replace(/\s+/g, '-');

        const opt = {
            margin:       0.4,
            filename:     `INV-${cleanName}.pdf`,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 4, useCORS: true, scrollY: 0 },
            jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
        };

        setTimeout(() => {
            html2pdf().set(opt).from(areaPrint).save()
            .then(() => {
                document.body.classList.remove('printing');
                areaPrint.innerHTML = ""; 
                if(btn) { btn.innerText = oldTxt; btn.disabled = false; }
            })
            .catch(err => {
                alert("Error: " + err);
                document.body.classList.remove('printing');
                if(btn) { btn.innerText = oldTxt; btn.disabled = false; }
            });
        }, 1500);
    }
};