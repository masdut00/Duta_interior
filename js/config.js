const CONFIG = {
    // URL API (Ganti sesuai punya kamu jika berubah)
    API_URL: "https://script.google.com/macros/s/AKfycbx_7BHuXokFjTURriNc2u5nFVvyuT67eZRiyRdZVQU_bC3HZMEb8XwyQLKkMsWRsdrcLA/exec", 
    
    PIN_ACCESS: "1234", 

    // --- SISTEM AUTHENTICATION BARU (Fase 1) ---
    checkAuth: function() {
        // Cek apakah ada 'tiket' login di browser
        const isLogin = localStorage.getItem('duta_login');
        
        // Cek nama file saat ini
        const path = window.location.pathname;
        const page = path.split("/").pop();

        // Jika BELUM login, dan BUKAN di halaman login -> Tendang ke login.html
        if (!isLogin && page !== 'login.html') {
            window.location.href = 'login.html';
        }
        
        // Jika SUDAH login, tapi malah buka login.html -> Lempar ke dashboard.html
        if (isLogin && (page === 'login.html' || page === '')) {
            window.location.href = 'dashboard.html';
        }
    },

    loginSuccess: function() {
        localStorage.setItem('duta_login', 'true'); // Simpan tiket
        window.location.href = 'dashboard.html';
    },

    logout: function() {
        if(confirm("Yakin ingin keluar aplikasi?")) {
            localStorage.removeItem('duta_login'); // Robek tiket
            window.location.href = 'login.html';
        }
    },
    // -------------------------------------------

    // Helper Format Rupiah
    formatRupiah: function(angka) {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(angka);
    },

    // Helper Format Input
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

    // Helper Bersihkan Titik
    bersihkanTitik: function(str) {
        if (!str) return 0;
        return parseFloat(str.toString().replace(/\./g, ''));
    },

    // Helper Tanggal
    getTodayDate: function() {
        const d = new Date();
        const tgl = d.getDate().toString().padStart(2, '0');
        const bln = (d.getMonth() + 1).toString().padStart(2, '0'); 
        const thn = d.getFullYear();
        return `${tgl}/${bln}/${thn}`;
    }
};