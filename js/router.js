const Router = {
    to: function(viewName) {
        document.querySelectorAll('.view').forEach(el => el.style.display = 'none');
        
        const target = document.getElementById('view-' + viewName);
        if (target) {
            target.style.display = 'block';
            
            // --- UPDATE BAGIAN INI ---
            if (viewName === 'catalog') Catalog.render();
            if (viewName === 'calculator') Calculator.resetForm();
            if (viewName === 'history') History.render(); // Tambahan Baru
            // -------------------------
        }
    }
};

const Auth = {
    login: function() {
        const input = document.getElementById('pinInput').value;
        if (input === CONFIG.PIN_ACCESS) {
            Router.to('dashboard');
            API.ambilHarga(); // Load data di background
        } else {
            alert("PIN Salah!");
        }
    },
    logout: function() {
        document.getElementById('pinInput').value = "";
        Router.to('login');
    }
};