const CONFIG = {
    // GANTI DENGAN URL APPS SCRIPT KAMU SENDIRI
    // Pastikan berakhiran /exec
    API_URL: "https://script.google.com/macros/s/AKfycbx_7BHuXokFjTURriNc2u5nFVvyuT67eZRiyRdZVQU_bC3HZMEb8XwyQLKkMsWRsdrcLA/exec", 
    
    PIN_ACCESS: "1234", // Password masuk
    
    // 1. Helper: Format Angka ke Rupiah (Rp 100.000) - Untuk Tampilan
    formatRupiah: function(angka) {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(angka);
    },

    // 2. Helper: Format Input saat diketik (Auto Titik: 200.000)
    formatInputUang: function(angka) {
        if (!angka) return "";
        var number_string = angka.replace(/[^,\d]/g, '').toString(),
            split = number_string.split(','),
            sisa = split[0].length % 3,
            rupiah = split[0].substr(0, sisa),
            ribuan = split[0].substr(sisa).match(/\d{3}/gi);

        if (ribuan) {
            separator = sisa ? '.' : '';
            rupiah += separator + ribuan.join('.');
        }
        return split[1] != undefined ? rupiah + ',' + split[1] : rupiah;
    },

    // 3. Helper: Bersihkan Titik (Agar bisa dihitung matematika)
    bersihkanTitik: function(str) {
        if (!str) return 0;
        // Hapus semua titik, lalu ubah jadi angka float
        return parseFloat(str.replace(/\./g, ''));
    },

    // 4. Helper: Format Tanggal Hari Ini (DD/MM/YYYY) -- INI YANG HILANG TADI
    getTodayDate: function() {
        const d = new Date();
        const tgl = d.getDate().toString().padStart(2, '0');
        const bln = (d.getMonth() + 1).toString().padStart(2, '0'); // Jan = 0, jadi +1
        const thn = d.getFullYear();
        return `${tgl}/${bln}/${thn}`;
    }
};