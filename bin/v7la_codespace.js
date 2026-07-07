const fs = require('fs');

const CYAN = '\x1b[36m';
const RESET = '\x1b[0m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';

console.log(`${CYAN}╔══════════════════════════════════════════════════════════╗${RESET}`);
console.log(`${CYAN}║  V7LA CODESPACES + TAILSCALE (FULL-STACK DEPLOYMENT)     ║${RESET}`);
console.log(`${CYAN}╚══════════════════════════════════════════════════════════╝${RESET}\n`);

console.log(`${YELLOW}⚡ INSTRUKSI LAUNCHING GITHUB CODESPACES ⚡${RESET}\n`);
console.log(`1. Upload seluruh isi folder ${GREEN}lms-platform${RESET} ini ke Repository GitHub pribadi Bapak.`);
console.log(`2. Buka repo tersebut di browser, pergi ke menu ${GREEN}Settings > Secrets and variables > Codespaces${RESET}.`);
console.log(`3. Buat "New secret":`);
console.log(`   - Name :  ${GREEN}TAILSCALE_AUTHKEY${RESET}`);
console.log(`   - Value: ${YELLOW}(Dapatkan dari https://login.tailscale.com/admin/settings/keys dan buat kunci yang Reusable)${RESET}`);
console.log(`4. Kembali ke halaman utama Repository, klik tombol hijau ${GREEN}<> Code${RESET}.`);
console.log(`5. Pindah ke tab ${GREEN}Codespaces${RESET}, lalu klik ${GREEN}Create codespace on main${RESET}.`);
console.log(`\n${CYAN}⚙️ SETELAH CODESPACE TERBUKA DI BROWSER:${RESET}`);
console.log(`Di terminal Codespaces Bapak, jalankan dua perintah sakti ini:`);
console.log(`${GREEN}npm run dev &${RESET}`);
console.log(`${GREEN}sudo tailscale funnel 3000${RESET}`);
console.log(`\nTunggu 3 detik, dan Link HTTPS Publik permanen berakhiran .ts.net akan segera tercetak di layar!`);
console.log(`${CYAN}Selamat menggunakan Hosting Eksklusif 120 Jam/Bulan dari Github! 🚀${RESET}\n`);
