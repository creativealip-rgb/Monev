import { renameSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import path from 'path';

const paths = [
    { from: 'src/app/api', to: './_bak_api' },
    { from: 'src/app/admin', to: './_bak_admin' }
];

console.log('🚀 [Monev Build] Menyiapkan build statis untuk APK...');

// Backup current directories
paths.forEach(({ from, to }) => {
    if (existsSync(from)) {
        try {
            renameSync(from, to);
            console.log(`✅ Hidden: ${from} -> ${to}`);
        } catch (e) {
            console.warn(`⚠️ Gagal menyembunyikan ${from}: ${e.message}`);
        }
    }
});

try {
    console.log('🏗️  [Monev Build] Menjalankan Next.js build...');

    // Set environment variable and run build
    execSync('npx next build --webpack', {
        stdio: 'inherit',
        env: { ...process.env, IS_APK: 'true' },
        shell: true
    });

    console.log('✨ [Monev Build] Build statis selesai!');

} catch (error) {
    console.error('❌ [Monev Build] Build gagal!');
} finally {
    console.log('🧹 [Monev Build] Mengembalikan folder API & Admin...');

    // Restore directories
    paths.forEach(({ from, to }) => {
        if (existsSync(to)) {
            try {
                renameSync(to, from);
                console.log(`✅ Restored: ${to} -> ${from}`);
            } catch (e) {
                console.error(`❌ Gagal mengembalikan ${to}: ${e.message}`);
            }
        }
    });
}
