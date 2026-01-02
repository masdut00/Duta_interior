const Calculator = {
    // 1. ISI DROPDOWN
    isiDropdown: function() {
        const data = API.state.masterHarga;
        const selectRel = document.getElementById('pilihRel');
        const selectRelVit = document.getElementById('pilihRelVitrace');
        const selectRing = document.getElementById('pilihRing');

        selectRel.innerHTML = '<option value="0-Tidak Pakai">Tidak Pakai Rel</option>';
        selectRelVit.innerHTML = '<option value="0-Tidak Pakai">Tidak Pakai Rel</option>';
        selectRing.innerHTML = '<option value="0-Tidak Pakai">Tidak Pakai Ring</option>';

        data.forEach(item => {
            const val = `${item.harga}-${item.nama}`; 
            const txt = `${item.nama} (${CONFIG.formatRupiah(item.harga)}/${item.satuan})`;
            
            if (item.kategori.toLowerCase().includes('rel')) {
                selectRel.add(new Option(txt, val));
                selectRelVit.add(new Option(txt, val)); 
            } else if (item.kategori.toLowerCase().includes('ring') || item.kategori.toLowerCase().includes('aksesoris')) {
                selectRing.add(new Option(txt, val));
            }
        });
    },

    toggleVitrace: function() {
        const cek = document.getElementById('cekVitrace').checked;
        document.getElementById('formVitrace').style.display = cek ? "block" : "none";
    },

    // 2. LOGIC SIMPAN (BISA TAMBAH BARU / UPDATE)
    tambahItem: function() {
        // --- AMBIL DATA INPUT ---
        const namaJendela = document.getElementById('namaJendela').value || "Jendela Tanpa Nama";
        const L = parseFloat(document.getElementById('lebarJendela').value) || 0;
        const T = parseFloat(document.getElementById('tinggiJendela').value) || 0;

        if (L === 0 || T === 0) return alert("Harap isi Lebar dan Tinggi!");

        // --- HITUNG CURTAIN ---
        const rasio = parseFloat(document.getElementById('rasioBahan').value) || 2.5;
        const hargaKain = CONFIG.bersihkanTitik(document.getElementById('hargaKain').value);
        
        const totalKain = L * rasio; 
        const biayaKain = totalKain * hargaKain;

        // Rel
        const relData = document.getElementById('pilihRel').value.split('-'); 
        let pjgRel = L + 0.2; 
        const manRel = document.getElementById('manualRel').value;
        if (manRel) pjgRel = parseFloat(manRel);
        const biayaRel = pjgRel * parseFloat(relData[0]);

        // Ring
        const ringData = document.getElementById('pilihRing').value.split('-');
        let jmlRing = Math.ceil(totalKain * 10);
        if (jmlRing % 2 !== 0) jmlRing++; 
        const manRing = document.getElementById('manualRing').value;
        if (manRing) jmlRing = parseFloat(manRing);
        const biayaRing = jmlRing * parseFloat(ringData[0]);

        const subTotalGordyn = biayaKain + biayaRel + biayaRing;

        // --- HITUNG VITRACE ---
        let dataVitrace = null;
        let subTotalVitrace = 0;
        
        if (document.getElementById('cekVitrace').checked) {
            const rasioVit = parseFloat(document.getElementById('rasioVitrace').value) || 2.5;
            const hargaVit = CONFIG.bersihkanTitik(document.getElementById('hargaVitrace').value);
            
            const totalKainVit = L * rasioVit;
            const biayaKainVit = totalKainVit * hargaVit;

            const relVitData = document.getElementById('pilihRelVitrace').value.split('-');
            const biayaRelVit = pjgRel * parseFloat(relVitData[0]); 

            subTotalVitrace = biayaKainVit + biayaRelVit;

            dataVitrace = {
                rasio: rasioVit, // Simpan rasio vitrace juga
                kain: { harga: biayaKainVit, total: totalKainVit, hargaPerM: hargaVit }, // Simpan harga per M
                rel: { nama: relVitData[1], harga: biayaRelVit }
            };
        }

        const subTotalFinal = subTotalGordyn + subTotalVitrace;

        // BENTUK OBJEK ITEM
        const itemObj = {
            id: Date.now(), // ID unik sementara
            nama: namaJendela,
            spek: { L, T },
            gordyn: {
                rasio: rasio,
                kain: { harga: biayaKain, total: totalKain, hargaPerM: hargaKain }, // Simpan harga per M buat edit nanti
                rel: { nama: relData[1], pjg: pjgRel, harga: biayaRel },
                ring: { nama: ringData[1], qty: jmlRing, harga: biayaRing }
            },
            vitrace: dataVitrace,
            subTotal: subTotalFinal
        };

        // --- CEK: INI UPDATE ATAU BARU? ---
        if (API.state.editingIndex !== null) {
            // UPDATE: Timpa item di indeks yang sedang diedit
            API.state.keranjang[API.state.editingIndex] = itemObj;
            API.state.editingIndex = null; // Reset mode edit
            document.getElementById('btn-action-item').innerText = "+ Tambah Jendela Lain";
            document.getElementById('btn-action-item').classList.remove('btn-save');
            document.getElementById('btn-action-item').classList.add('btn-add');
            alert("✅ Item berhasil diperbarui!");
        } else {
            // BARU: Push ke array
            API.state.keranjang.push(itemObj);
        }

        this.renderKeranjang();
        this.resetForm(); 
    },

    // 3. FUNGSI BARU: EDIT ITEM (Load Data ke Form)
    editItem: function(index) {
        const item = API.state.keranjang[index];
        API.state.editingIndex = index; // Set flag kita lagi ngedit nomor sekian

        // Scroll ke atas form
        document.getElementById('view-calculator').scrollIntoView({ behavior: 'smooth' });

        // --- LOAD DATA FORM ---
        document.getElementById('namaJendela').value = item.nama;
        document.getElementById('lebarJendela').value = item.spek.L;
        document.getElementById('tinggiJendela').value = item.spek.T;
        
        // GORDYN
        document.getElementById('rasioBahan').value = item.gordyn.rasio;
        document.getElementById('hargaKain').value = CONFIG.formatInputUang(item.gordyn.kain.hargaPerM.toString());
        
        // Helper: Cari dropdown berdasarkan Nama (karena value bisa beda ID/Harga)
        this.setDropdownByText('pilihRel', item.gordyn.rel.nama);
        this.setDropdownByText('pilihRing', item.gordyn.ring.nama);

        // MANUAL OVERRIDE (Jika ada custom ukuran)
        // Kita bandingkan hitungan default vs simpanan. Kalau beda, berarti manual.
        // Tapi untuk simplenya, kita kosongkan dulu, user input lagi kalau mau custom.
        // Atau: tampilkan nilai terakhir.
        document.getElementById('manualRel').value = item.gordyn.rel.pjg;
        document.getElementById('manualRing').value = item.gordyn.ring.qty;

        // VITRACE
        if (item.vitrace) {
            document.getElementById('cekVitrace').checked = true;
            this.toggleVitrace(); // Munculkan form
            
            document.getElementById('rasioVitrace').value = item.vitrace.rasio;
            document.getElementById('hargaVitrace').value = CONFIG.formatInputUang(item.vitrace.kain.hargaPerM.toString());
            this.setDropdownByText('pilihRelVitrace', item.vitrace.rel.nama);
        } else {
            document.getElementById('cekVitrace').checked = false;
            this.toggleVitrace(); // Sembunyikan form
        }

        // --- UBAH TOMBOL JADI "SIMPAN UPDATE" ---
        const btn = document.getElementById('btn-action-item');
        btn.innerText = "💾 Simpan Perubahan Item";
        btn.classList.remove('btn-add');
        btn.classList.add('btn-save'); // Ganti warna jadi biru/tosca
    },

    // Helper untuk memilih dropdown berdasarkan teks nama barang
    setDropdownByText: function(elementId, textToFind) {
        const select = document.getElementById(elementId);
        for (let i = 0; i < select.options.length; i++) {
            if (select.options[i].text.includes(textToFind)) {
                select.selectedIndex = i;
                return;
            }
        }
        select.selectedIndex = 0; // Default kalau gak ketemu
    },

    renderKeranjang: function() {
        const list = document.getElementById('list-keranjang');
        const totalEl = document.getElementById('grand-total');
        list.innerHTML = "";
        let grandTotal = 0;

        API.state.keranjang.forEach((item, index) => {
            grandTotal += item.subTotal;
            
            let infoVitrace = "";
            if (item.vitrace) {
                infoVitrace = `<br><small style="color:#28a745;">+ Vitrace & Rel ${item.vitrace.rel.nama}</small>`;
            }

            const li = document.createElement('li');
            
            // Tambahkan background kuning tipis kalau item ini lagi diedit
            const isEditing = (index === API.state.editingIndex) ? 'background:#fff3cd;' : '';
            li.style = `border-bottom:1px dashed #ddd; padding:10px 0; display:flex; justify-content:space-between; ${isEditing}`;

            li.innerHTML = `
                <div>
                    <strong>${item.nama}</strong> <small>(${item.spek.L}m x ${item.spek.T}m)</small><br>
                    <small>Gordyn: ${item.gordyn.rel.nama} | Ring ${item.gordyn.ring.qty}</small>
                    ${infoVitrace}
                </div>
                <div style="text-align:right">
                    ${CONFIG.formatRupiah(item.subTotal)} <br>
                    <div style="margin-top:5px;">
                        <button onclick="Calculator.editItem(${index})" style="background:#ffc107; color:#000; padding:4px 8px; font-size:10px; width:auto; border-radius:4px; display:inline-block; margin-right:5px;">✏️ Edit</button>
                        <button onclick="Calculator.hapusItem(${index})" style="background:var(--danger); padding:4px 8px; font-size:10px; width:auto; border-radius:4px; display:inline-block;">Hapus</button>
                    </div>
                </div>
            `;
            list.appendChild(li);
        });

        totalEl.innerText = CONFIG.formatRupiah(grandTotal);
    },

    hapusItem: function(index) {
        // Kalau lagi ngedit item yg mau dihapus, batalkan mode edit dulu
        if(API.state.editingIndex === index) {
            this.resetForm(); 
        }
        API.state.keranjang.splice(index, 1);
        
        // Geser index editing kalau ada item dihapus di atasnya (optional, tapi good practice)
        if(API.state.editingIndex !== null && API.state.editingIndex > index) {
            API.state.editingIndex--;
        }
        
        this.renderKeranjang();
    },

    resetForm: function() {
        document.getElementById('namaJendela').value = "";
        document.getElementById('lebarJendela').value = "";
        document.getElementById('tinggiJendela').value = "";
        
        document.getElementById('rasioBahan').value = "2.5";
        document.getElementById('hargaKain').value = ""; 
        document.getElementById('pilihRel').selectedIndex = 0;
        document.getElementById('pilihRing').selectedIndex = 0;
        
        // Reset Vitrace
        document.getElementById('cekVitrace').checked = false;
        document.getElementById('formVitrace').style.display = "none";
        document.getElementById('hargaVitrace').value = "";
        document.getElementById('pilihRelVitrace').selectedIndex = 0;

        document.getElementById('manualRel').value = "";
        document.getElementById('manualRing').value = "";
        
        // KEMBALIKAN TOMBOL JADI "TAMBAH" (Keluar dari mode edit)
        API.state.editingIndex = null;
        const btn = document.getElementById('btn-action-item');
        btn.innerText = "+ Tambah Jendela Lain";
        btn.classList.add('btn-add');
        btn.classList.remove('btn-save');

        document.getElementById('namaJendela').focus();
    },

    generateInvoice: function(tipe, customData = null, customNama = null, customRow = null, customId = null) {
        // 1. DATA CHECK
        let keranjangAktif = customData ? customData : API.state.keranjang;
        let namaAktif = customNama ? customNama : (document.getElementById('namaPelanggan').value || "Pelanggan");
        
        if(!keranjangAktif || keranjangAktif.length === 0) return alert("Data kosong!");

        // 2. CONFIG
        const namaToko = "DUTA DECOR INTERIOR";
        const alamatToko = "Tangerang, Banten | WA: 0812-3456-7890";
        const logoSrc = "assets/logo.png"; 
        const infoBank = "BCA 123-456-7890 a/n Duta Rifki"; 

        // --- LOGIKA ID & NO INVOICE ---
        // Prioritas ID: Parameter (dari History) -> State (dari Save baru) -> Strip
        let custId = customId || API.state.currentId || "-";
        
        // Prioritas No Inv: Parameter -> State -> DRAFT
        let invNo = customRow || API.state.currentRow || "DRAFT";

        let grandTotal = 0;

        // 3. HTML STRUCTURE
        let html = `
            <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; max-width: 800px; margin: auto; color: #333; line-height: 1.4;">
                
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; border-bottom: 2px solid #eee; padding-bottom: 20px;">
                    <div style="display: flex; align-items: center;">
                        <img src="${logoSrc}" onerror="this.style.display='none'" style="width: 70px; height: 70px; object-fit: contain; margin-right: 15px;">
                        <div>
                            <h3 style="margin: 0; color: #2c3e50; font-size: 20px; font-weight: 800; text-transform: uppercase;">${namaToko}</h3>
                            <p style="margin: 5px 0 0; font-size: 12px; color: #7f8c8d;">${alamatToko}</p>
                        </div>
                    </div>

                    <div style="text-align: right;">
                        <h1 style="margin: 0; font-size: 30px; color: #bdc3c7; letter-spacing: 2px;">INVOICE</h1>
                        <p style="margin: 5px 0 0; font-size: 16px; font-weight:bold; color:#2c3e50;">#${invNo}</p>
                        <p style="margin: 2px 0 0; font-size: 12px; color: #7f8c8d;">${CONFIG.getTodayDate()}</p>
                    </div>
                </div>

                <div style="display: flex; justify-content: flex-end; margin-bottom: 30px;">
                    <div style="text-align: right;">
                        <span style="font-size: 10px; color: #95a5a6; letter-spacing: 1px; text-transform: uppercase; font-weight: bold;">TAGIHAN UNTUK (BILL TO):</span>
                        <h3 style="margin: 5px 0 0; font-size: 18px; color: #2c3e50;">${namaAktif}</h3>
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

        // 4. LOOP ITEMS
        keranjangAktif.forEach((item, index) => {
            grandTotal += item.subTotal;
            
            const makeRow = (label, qty, unitPrice, totalPrice) => {
                if(totalPrice <= 0) return "";
                return `
                <div style="display:flex; justify-content:space-between; font-size:11px; color:#555; padding: 2px 0;">
                    <span>${label} <span style="color:#999; font-size:10px;">(${qty} x ${CONFIG.formatRupiah(unitPrice)})</span></span>
                    <span>${CONFIG.formatRupiah(totalPrice)}</span>
                </div>`;
            };

            let detailHtml = "";
            let hKainG = item.gordyn.kain.hargaPerM || (item.gordyn.kain.harga / item.gordyn.kain.total);
            detailHtml += makeRow("• Kain Gordyn", item.gordyn.kain.total + "m", hKainG, item.gordyn.kain.harga);
            
            if(item.gordyn.rel.harga > 0) {
                let hRelG = item.gordyn.rel.harga / item.gordyn.rel.pjg;
                detailHtml += makeRow(`• Rel ${item.gordyn.rel.nama}`, item.gordyn.rel.pjg + "m", hRelG, item.gordyn.rel.harga);
            }
            if(item.gordyn.ring.harga > 0) {
                let hRing = item.gordyn.ring.harga / item.gordyn.ring.qty;
                detailHtml += makeRow(`• Ring ${item.gordyn.ring.nama}`, item.gordyn.ring.qty + "pcs", hRing, item.gordyn.ring.harga);
            }

            if(item.vitrace) {
                detailHtml += `<div style="margin: 6px 0 2px 0; font-weight:bold; font-size:10px; color:#27ae60;">PAKET VITRACE</div>`;
                let hKainV = item.vitrace.kain.hargaPerM || (item.vitrace.kain.harga / item.vitrace.kain.total);
                detailHtml += makeRow("• Kain Vitrace", item.vitrace.kain.total + "m", hKainV, item.vitrace.kain.harga);
                
                if(item.vitrace.rel.harga > 0) {
                    let pjgRelV = item.gordyn.rel.pjg; 
                    let hRelV = item.vitrace.rel.harga / pjgRelV;
                    detailHtml += makeRow(`• Rel ${item.vitrace.rel.nama}`, pjgRelV + "m", hRelV, item.vitrace.rel.harga);
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
            </svg>
            `;

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
                </div>
            `;
        });

        // 5. FOOTER & TOTAL
        html += `
                </div> 
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
                    <div style="width: 35%; text-align: right;">
                        <p style="margin: 0;">Authorized Signature</p>
                        <div style="height: 60px;"></div>
                        <p style="margin: 0; font-weight: bold; color: #2c3e50;">${namaToko}</p>
                    </div>
                </div>
            </div>
        `;

        // 6. EXECUTE PRINT (HD MODE)
        const areaPrint = document.getElementById('invoice-area');
        areaPrint.innerHTML = html;
        document.body.classList.add('printing'); 
        window.scrollTo(0, 0);

        const btnClass = tipe === 'CUSTOMER' ? '.btn-print' : '.btn-print-owner';
        const btn = document.querySelector(btnClass);
        if(btn) { var oldTxt = btn.innerText; btn.innerText = "⏳ HD PDF..."; btn.disabled = true; }

        const opt = {
            margin:       0.4,
            filename:     `INV-${namaAktif.replace(/\s+/g, '-')}.pdf`,
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
    },

    bersihkanSemua: function() {
        if(confirm("Bersihkan semua data form & keranjang?")) {
            API.state.keranjang = [];
            API.state.currentId = null; 
            document.getElementById('namaPelanggan').value = "";
            this.renderKeranjang();
            this.resetForm();
        }
    }
};