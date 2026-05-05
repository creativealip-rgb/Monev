import { existsSync, renameSync, mkdirSync, rmSync, cpSync, readdirSync, unlinkSync } from 'fs';
import { execSync } from 'child_process';
import path from 'path';
import os from 'os';

// Function to get local IP address
function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return 'localhost';
}

const localIP = getLocalIP();
const defaultApiUrl = `http://${localIP}:3000`;
const apiUrl = process.env.NEXT_PUBLIC_API_URL || defaultApiUrl;

console.log(`🚀 [Monev Build] Menyiapkan build statis untuk APK...`);
console.log(`🔗 [Monev Build] API Target: ${apiUrl}`);

// Define paths
const apiPath = 'src/app/api';
const adminPath = 'src/app/admin';
const bakApiPath = '_bak_api';
const bakAdminPath = '_bak_admin';

// Server-only paths that must be moved for static export
// (Server Actions, auth pages that import them, etc.)
const serverActionPaths = [
    { src: 'src/backend/actions', bak: '_bak_backend_actions' },
    { src: 'src/app/login', bak: '_bak_login' },
    { src: 'src/app/register', bak: '_bak_register' },
];

// Function to safely move a file or directory on Windows
function movePath(from, to) {
    if (!existsSync(from)) {
        console.log(`⚠️ Source not found: ${from}`);
        return false;
    }
    
    try {
        // Remove destination if exists
        if (existsSync(to)) {
            rmSync(to, { recursive: true, force: true });
        }
        
        // Copy instead of rename (more reliable on Windows)
        cpSync(from, to, { recursive: true });
        
        // Remove source
        rmSync(from, { recursive: true, force: true });
        
        console.log(`✅ Moved: ${from} -> ${to}`);
        return true;
    } catch (e) {
        console.warn(`⚠️ Gagal memindahkan ${from}: ${e.message}`);
        return false;
    }
}

// Function to restore a file or directory
function restorePath(from, to) {
    if (!existsSync(from)) {
        console.log(`⚠️ Backup not found: ${from}`);
        return false;
    }
    
    try {
        // Remove destination if exists
        if (existsSync(to)) {
            rmSync(to, { recursive: true, force: true });
        }
        
        // Copy back
        cpSync(from, to, { recursive: true });
        
        // Remove backup
        rmSync(from, { recursive: true, force: true });
        
        console.log(`✅ Restored: ${from} -> ${to}`);
        return true;
    } catch (e) {
        console.error(`❌ Gagal mengembalikan ${from}: ${e.message}`);
        return false;
    }
}

// Clean up .next folder to prevent issues with stale dev types
const dotNextPath = '.next';
if (existsSync(dotNextPath)) {
    try {
        rmSync(dotNextPath, { recursive: true, force: true });
        console.log('✅ Cleaned .next folder');
    } catch (e) {
        console.warn('⚠️ Could not clean .next folder:', e.message);
    }
}

// Clean up out folder
const outPath = 'out';
if (existsSync(outPath)) {
    try {
        rmSync(outPath, { recursive: true, force: true });
        console.log('✅ Cleaned out folder');
    } catch (e) {
        console.warn('⚠️ Could not clean out folder:', e.message);
    }
}

// Prevent recursive bundling: Remove ALL APKs from public/ before building
try {
    const publicFiles = readdirSync('public');
    publicFiles.forEach(file => {
        if (file.endsWith('.apk')) {
            unlinkSync(path.join('public', file));
            console.log(`✅ Removed old APK from public/: ${file}`);
        }
    });
} catch (e) {
    console.warn('⚠️ Could not clean old APKs from public/ folder:', e.message);
}

// Move API and Admin folders
const apiMoved = movePath(apiPath, bakApiPath);
const adminMoved = movePath(adminPath, bakAdminPath);

// Move server action files (static export doesn't support "use server")
const movedActions = [];
for (const { src, bak } of serverActionPaths) {
    const moved = movePath(src, bak);
    movedActions.push({ src, bak, moved });
}

try {
    console.log('🏗️  [Monev Build] Menjalankan Next.js build...');
    
    // Set environment variable and run build (skip TypeScript for static export)
    execSync('npx next build --webpack', {
        stdio: 'inherit',
        env: { 
            ...process.env, 
            IS_APK: 'true',
            NEXT_PUBLIC_IS_APK: 'true',
            NEXT_PUBLIC_API_URL: apiUrl,
            NEXTAUTH_URL: apiUrl,
            NEXT_TYPESCRIPT_CHECK: 'false',
            NEXT_ESLINT_CHECK: 'false',
            SKIP_ENV_VALIDATION: 'true'
        },
        shell: true
    });
    
    console.log('✨ [Monev Build] Build statis selesai!');
    
    // Sync to Capacitor
    console.log('📱 [Monev Build] Sync ke Capacitor Android...');
    execSync('npx cap sync android', {
        stdio: 'inherit',
        shell: true
    });
    
    // Build APK
    console.log('📦 [Monev Build] Building APK...');
    
    // Set JAVA_HOME and ANDROID_HOME for the build
    // - On Linux CI/VPS: use the system Java and Android SDK env when available
    // - On Windows dev machine: override these via env if needed
    const javaHome = process.env.JAVA_HOME || '/usr/lib/jvm/java-21-openjdk-amd64';
    const androidHome = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT || '';

    if (!androidHome) {
        throw new Error('ANDROID_HOME/ANDROID_SDK_ROOT belum diset. Install Android SDK + set env dulu.');
    }
    
    execSync('cd android && (./gradlew assembleDebug || gradlew assembleDebug)', {
        stdio: 'inherit',
        shell: true,
        env: {
            ...process.env,
            JAVA_HOME: javaHome,
            ANDROID_HOME: androidHome,
            ANDROID_SDK_ROOT: androidHome,
            PATH: `${javaHome}\\bin;${androidHome}\\platform-tools;${androidHome}\\tools;${process.env.PATH}`
        }
    });
    
    // Copy APK to public folder
    const apkSource = 'android/app/build/outputs/apk/debug/app-debug.apk';
    const apkDest = 'public/monev-app.apk';
    
    if (existsSync(apkSource)) {
        cpSync(apkSource, apkDest);
        console.log(`✅ APK copied to: ${apkDest}`);
    } else {
        console.warn('⚠️ APK not found at expected location');
    }
    
} catch (error) {
    console.error('❌ [Monev Build] Build gagal!');
    console.error(error.message);
} finally {
    console.log('🧹 [Monev Build] Mengembalikan folder API & Admin...');
    
    // Restore directories
    if (apiMoved) {
        restorePath(bakApiPath, apiPath);
    }
    if (adminMoved) {
        restorePath(bakAdminPath, adminPath);
    }
    
    // Restore server action files
    for (const { src, bak, moved } of movedActions) {
        if (moved) {
            restorePath(bak, src);
        }
    }
}