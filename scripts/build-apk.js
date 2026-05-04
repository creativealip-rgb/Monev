import { existsSync, renameSync, mkdirSync, rmSync, cpSync } from 'fs';
import { execSync } from 'child_process';
import path from 'path';

console.log('🚀 [Monev Build] Menyiapkan build statis untuk APK...');

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
    { src: 'src/app/onboarding', bak: '_bak_onboarding' },
    { src: 'src/lib/usage-tracker.ts', bak: '_bak_usage_tracker.ts' },
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

// Clean up generated types that may cause issues
const typesPath = '.next/dev/types';
if (existsSync(typesPath)) {
    try {
        rmSync(typesPath, { recursive: true, force: true });
        console.log('✅ Cleaned generated types');
    } catch (e) {
        console.warn('⚠️ Could not clean types:', e.message);
    }
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
    const javaHome = 'C:\\Program Files\\Eclipse Adoptium\\jdk-25.0.2.10-hotspot';
    const androidHome = 'C:\\Users\\SELULAR TV\\AppData\\Local\\Android\\Sdk';
    
    execSync('cd android && gradlew assembleDebug', {
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