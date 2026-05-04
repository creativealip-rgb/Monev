# Implementasi Plan: monev.app Web → PWA/App dengan Push Notification

**Produk:** monev.app  
**Tujuan:** Mengubah web app pencatatan uang menjadi pengalaman seperti aplikasi mobile, dengan kemampuan mengirim push notification ke user yang mengaktifkan notifikasi.  
**Rekomendasi utama:** Mulai dari **PWA + Web Push / Firebase Cloud Messaging Web**, lalu lanjut ke **Capacitor** jika perlu masuk Play Store/App Store.

---

## 1. Kesimpulan Rekomendasi

Jalur tercepat dan paling aman secara effort:

```text
Phase 1: Web app → PWA installable
Phase 2: Tambah push notification via FCM Web / Web Push
Phase 3: Bungkus dengan Capacitor untuk Android/iOS jika perlu store
```

Jangan langsung rewrite ke Flutter / React Native kecuali ada kebutuhan native berat seperti akses device yang kompleks, performa grafis tinggi, atau UI yang benar-benar ingin dibuat ulang.

Untuk monev.app, karena basisnya sudah web, pendekatan paling cepat adalah:

- **PWA dulu** agar user bisa install dari browser.
- **Push notification via FCM Web** agar notifikasi bisa jalan untuk user yang memberi permission.
- **Backend menyimpan token/subscription per user/device.**
- **Capacitor belakangan** untuk distribusi Play Store/App Store.

---

## 2. Target MVP

MVP yang realistis:

1. User bisa install monev.app ke home screen.
2. User bisa mengaktifkan notifikasi.
3. Backend menyimpan token/subscription user.
4. Server bisa kirim notifikasi:
   - pengingat catat transaksi,
   - budget hampir habis,
   - tagihan jatuh tempo,
   - reminder harian/mingguan.
5. Notifikasi saat diklik membuka halaman relevan di monev.app.
6. User bisa mematikan notifikasi dari setting akun.

---

## 3. Estimasi Waktu

| Milestone | Estimasi |
|---|---:|
| Audit web app dan responsif mobile | 0.5–1 hari |
| Tambah PWA manifest, icon, service worker | 1 hari |
| Implementasi FCM/Web Push frontend | 1–2 hari |
| Endpoint backend simpan token/subscription | 1 hari |
| Job/trigger pengiriman notifikasi | 1–2 hari |
| QA Android Chrome | 0.5–1 hari |
| QA iOS Safari/Home Screen | 0.5–1 hari |
| Hardening privacy, unsubscribe, retry | 1 hari |
| Total MVP | 5–10 hari kerja |

Jika lanjut Capacitor:

| Milestone | Estimasi |
|---|---:|
| Setup Capacitor Android | 1–2 hari |
| Push native Android via FCM | 1–2 hari |
| Build internal testing Play Console | 1 hari |
| Setup iOS + APNs + TestFlight | 2–4 hari |
| Store assets + privacy form | 1–2 hari |
| Total tambahan | 6–12 hari kerja |

---

## 4. Arsitektur yang Disarankan

### 4.1 Phase 1: PWA

```text
Browser / PWA
  ├─ manifest.json
  ├─ service-worker.js
  ├─ Push API / FCM Web
  └─ UI setting notifikasi

Backend monev.app
  ├─ Auth user
  ├─ Push subscription/token table
  ├─ Notification trigger
  └─ Push sender service

Provider Push
  ├─ Firebase Cloud Messaging
  └─ Web Push Service browser
```

### 4.2 Phase 2: Capacitor

```text
Capacitor App
  ├─ WebView berisi monev.app
  ├─ Capacitor Push Notifications plugin
  ├─ Android: FCM
  └─ iOS: APNs via Firebase/Capacitor

Backend tetap sama
  ├─ Simpan token native
  ├─ Simpan platform: web/android/ios
  └─ Kirim via FCM Admin SDK
```

---

## 5. Pilihan Teknologi Push

Ada 2 opsi utama.

### Opsi A — FCM Web

**Direkomendasikan untuk monev.app.**

Kelebihan:

- Bisa dipakai untuk web/PWA.
- Nanti mudah lanjut ke Android/iOS native.
- Satu provider utama: Firebase Cloud Messaging.
- Ada Firebase Admin SDK untuk kirim dari backend.
- Cocok untuk MVP.

Kekurangan:

- Perlu setup Firebase project.
- iOS Web Push punya behavior khusus; biasanya user perlu install PWA ke Home Screen.
- Tetap perlu service worker.

### Opsi B — Web Push VAPID langsung

Kelebihan:

- Lebih standar web.
- Tidak terlalu bergantung ke Firebase.
- Bisa pakai library `web-push` di Node.js.

Kekurangan:

- Kalau nanti masuk native app, tetap perlu FCM/APNs.
- Perlu handle subscription dan error sendiri.
- Lebih manual.

### Rekomendasi final

Gunakan:

```text
PWA MVP: Firebase Cloud Messaging Web
Native wrapper: Capacitor Push Notifications + Firebase Cloud Messaging
Backend: Firebase Admin SDK atau HTTP v1 API
```

---

## 6. Data Model Backend

Buat tabel baru, misalnya `push_subscriptions` atau `notification_devices`.

Contoh schema:

```sql
CREATE TABLE notification_devices (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  platform VARCHAR(20) NOT NULL, -- web, android, ios
  provider VARCHAR(30) NOT NULL, -- fcm, web_push
  token TEXT,
  subscription_json JSONB,
  user_agent TEXT,
  device_name VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  last_seen_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notification_devices_user_id
ON notification_devices(user_id);

CREATE INDEX idx_notification_devices_active
ON notification_devices(is_active);
```

Jika memakai FCM Web, biasanya cukup simpan `token`.

Jika memakai Web Push VAPID langsung, simpan `subscription_json` seperti:

```json
{
  "endpoint": "https://fcm.googleapis.com/fcm/send/...",
  "keys": {
    "p256dh": "...",
    "auth": "..."
  }
}
```

---

## 7. Endpoint Backend yang Dibutuhkan

### 7.1 Register device/token

```http
POST /api/notification-devices
Authorization: Bearer <token/session>
Content-Type: application/json
```

Body untuk FCM:

```json
{
  "platform": "web",
  "provider": "fcm",
  "token": "fcm_device_token",
  "userAgent": "Mozilla/5.0 ..."
}
```

Response:

```json
{
  "success": true,
  "deviceId": 123
}
```

### 7.2 Unregister device/token

```http
DELETE /api/notification-devices/:id
Authorization: Bearer <token/session>
```

Atau by token:

```http
POST /api/notification-devices/unregister
Authorization: Bearer <token/session>
Content-Type: application/json
```

```json
{
  "token": "fcm_device_token"
}
```

### 7.3 Update notification preference

```http
PATCH /api/me/notification-preferences
Authorization: Bearer <token/session>
Content-Type: application/json
```

```json
{
  "dailyReminder": true,
  "dailyReminderTime": "20:00",
  "budgetAlert": true,
  "billReminder": true,
  "marketing": false
}
```

### 7.4 Internal send notification

Endpoint internal/admin/cron:

```http
POST /internal/notifications/send
X-Internal-Token: <secret>
Content-Type: application/json
```

```json
{
  "userId": 1,
  "type": "daily_reminder",
  "title": "Monev",
  "body": "Jangan lupa catat transaksi hari ini.",
  "url": "/transactions/new"
}
```

---

## 8. Frontend PWA Implementation

### 8.1 Tambah `manifest.json`

File:

```text
/public/manifest.json
```

Contoh:

```json
{
  "name": "Monev",
  "short_name": "Monev",
  "description": "Aplikasi pencatatan uang pribadi",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#111827",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    },
    {
      "src": "/icons/maskable-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ]
}
```

Tambahkan di HTML:

```html
<link rel="manifest" href="/manifest.json" />
<meta name="theme-color" content="#111827" />
<link rel="apple-touch-icon" href="/icons/icon-192.png" />
```

---

### 8.2 Service Worker

Jika memakai Firebase Messaging Web, buat:

```text
/public/firebase-messaging-sw.js
```

Contoh dasar:

```js
importScripts("https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification?.title || "Monev";
  const notificationOptions = {
    body: payload.notification?.body || "Ada pengingat dari Monev.",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    data: {
      url: payload.data?.url || "/"
    }
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = event.notification.data?.url || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }

      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});
```

---

### 8.3 Request Permission dan Ambil FCM Token

Install dependency:

```bash
npm install firebase
```

Contoh file:

```ts
// src/lib/notification.ts
import { initializeApp } from "firebase/app";
import { getMessaging, getToken, isSupported } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);

export async function enablePushNotification() {
  const supported = await isSupported();

  if (!supported) {
    throw new Error("Browser tidak mendukung push notification.");
  }

  if (!("serviceWorker" in navigator)) {
    throw new Error("Service Worker tidak tersedia.");
  }

  const permission = await Notification.requestPermission();

  if (permission !== "granted") {
    throw new Error("User tidak mengizinkan notifikasi.");
  }

  const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");

  const messaging = getMessaging(app);

  const token = await getToken(messaging, {
    vapidKey: "YOUR_WEB_PUSH_CERTIFICATE_KEY_PAIR",
    serviceWorkerRegistration: registration
  });

  if (!token) {
    throw new Error("Gagal mendapatkan FCM token.");
  }

  await fetch("/api/notification-devices", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    credentials: "include",
    body: JSON.stringify({
      platform: "web",
      provider: "fcm",
      token,
      userAgent: navigator.userAgent
    })
  });

  return token;
}
```

---

### 8.4 UI Setting Notifikasi

Tambahkan di halaman setting user:

```tsx
<button onClick={enablePushNotification}>
  Aktifkan Notifikasi
</button>
```

Copywriting yang disarankan:

```text
Aktifkan notifikasi agar Monev bisa mengingatkan kamu mencatat transaksi, budget hampir habis, atau tagihan yang akan jatuh tempo.
```

Jangan langsung minta permission saat halaman pertama dibuka. Lebih baik:

1. Tampilkan penjelasan manfaat.
2. User klik tombol.
3. Baru panggil `Notification.requestPermission()`.

---

## 9. Backend Push Sender

### 9.1 Firebase Admin SDK

Install:

```bash
npm install firebase-admin
```

Contoh setup:

```ts
// src/lib/firebaseAdmin.ts
import admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n")
    })
  });
}

export const firebaseAdmin = admin;
```

### 9.2 Function Kirim Notifikasi

```ts
// src/lib/sendPush.ts
import { firebaseAdmin } from "./firebaseAdmin";

type SendPushInput = {
  token: string;
  title: string;
  body: string;
  url?: string;
};

export async function sendPushNotification(input: SendPushInput) {
  return firebaseAdmin.messaging().send({
    token: input.token,
    notification: {
      title: input.title,
      body: input.body
    },
    data: {
      url: input.url || "/"
    },
    webpush: {
      notification: {
        icon: "/icons/icon-192.png",
        badge: "/icons/icon-192.png"
      },
      fcmOptions: {
        link: input.url || "/"
      }
    }
  });
}
```

### 9.3 Handle Token Invalid

Saat kirim gagal karena token invalid, nonaktifkan token di database.

Pseudo-code:

```ts
try {
  await sendPushNotification({
    token: device.token,
    title: "Monev",
    body: "Jangan lupa catat transaksi hari ini.",
    url: "/transactions/new"
  });
} catch (error: any) {
  const code = error?.code;

  if (
    code === "messaging/registration-token-not-registered" ||
    code === "messaging/invalid-registration-token"
  ) {
    await db.notificationDevice.update({
      where: { id: device.id },
      data: { isActive: false }
    });
  }

  throw error;
}
```

---

## 10. Trigger Notifikasi untuk monev.app

Prioritaskan notifikasi yang benar-benar membantu, bukan spam.

### 10.1 Daily reminder

Kirim jika user mengaktifkan reminder.

```text
Title: Monev
Body: Jangan lupa catat transaksi hari ini.
URL: /transactions/new
```

### 10.2 Budget alert

Kirim jika kategori sudah melewati threshold.

```text
Title: Monev
Body: Budget kamu hampir mencapai batas bulan ini.
URL: /budgets
```

Hindari menulis angka sensitif di lock screen, misalnya:

```text
Kurang aman:
Budget makan tinggal Rp42.000.

Lebih aman:
Budget salah satu kategori hampir mencapai batas.
```

### 10.3 Bill reminder

```text
Title: Monev
Body: Ada tagihan yang perlu dicek.
URL: /bills
```

### 10.4 Weekly summary

```text
Title: Ringkasan Monev
Body: Ringkasan mingguan kamu sudah siap.
URL: /reports/weekly
```

---

## 11. Cron / Scheduler

Gunakan salah satu:

- cron server sendiri,
- queue worker,
- serverless scheduler,
- database cron,
- GitHub Actions untuk MVP sederhana,
- Cloud Scheduler jika di Google Cloud,
- Vercel Cron jika deploy di Vercel,
- Supabase Cron jika pakai Supabase.

Contoh cron harian:

```text
Setiap hari jam 20:00 WIB:
1. Ambil user yang mengaktifkan daily reminder.
2. Filter timezone user.
3. Ambil device aktif user.
4. Kirim notifikasi.
5. Log hasil.
```

Tambahkan tabel log:

```sql
CREATE TABLE notification_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  device_id BIGINT,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  status VARCHAR(20) NOT NULL, -- sent, failed
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 12. Privacy dan Security

Karena monev.app berisi data keuangan, notifikasi harus hati-hati.

### 12.1 Jangan tampilkan data sensitif

Hindari:

```text
Saldo kamu tinggal Rp50.000.
Pengeluaran rokok bulan ini Rp800.000.
Gaji masuk Rp12.000.000.
```

Gunakan:

```text
Ada update penting di Monev.
Budget kamu hampir mencapai batas.
Ada transaksi yang perlu dicek.
```

### 12.2 Permission harus jelas

Sebelum request permission, jelaskan:

- Notifikasi digunakan untuk reminder dan alert finansial.
- User bisa mematikan kapan saja.
- Tidak semua data keuangan akan tampil di lock screen.

### 12.3 User control

Wajib ada setting:

- Aktif/nonaktif notifikasi.
- Jenis notifikasi:
  - daily reminder,
  - budget alert,
  - bill reminder,
  - weekly summary,
  - marketing/promo.
- Jam reminder.
- Tombol hapus device.

### 12.4 Simpan token dengan aman

- Token tidak perlu dienkripsi seperti password, tapi tetap data sensitif.
- Jangan expose token ke user lain.
- Token harus dikaitkan dengan user login.
- Hapus/nonaktifkan token saat logout jika user memilih logout dari device.

---

## 13. iOS Notes

Untuk PWA di iOS:

- Web Push bisa jalan untuk web app yang ditambahkan ke Home Screen.
- Jangan mengandalkan push dari Safari tab biasa untuk semua skenario.
- Berikan instruksi install khusus iPhone:
  1. Buka monev.app di Safari.
  2. Tap Share.
  3. Tap Add to Home Screen.
  4. Buka dari icon Monev di Home Screen.
  5. Aktifkan notifikasi.

Copywriting:

```text
Untuk menerima notifikasi di iPhone, tambahkan Monev ke Home Screen terlebih dahulu, lalu aktifkan notifikasi dari aplikasi Monev.
```

---

## 14. Android Notes

Untuk Android:

- Chrome/Edge lebih mulus untuk PWA.
- User bisa install PWA langsung.
- Notifikasi web umumnya lebih stabil dibanding iOS PWA.
- Jika masuk Play Store, Capacitor + FCM native akan terasa lebih “app beneran”.

---

## 15. Capacitor Implementation Plan

Gunakan Capacitor setelah MVP PWA berjalan.

### 15.1 Install Capacitor

```bash
npm install @capacitor/core @capacitor/cli
npx cap init Monev app.monev
```

### 15.2 Tambah Android/iOS

```bash
npm install @capacitor/android @capacitor/ios
npx cap add android
npx cap add ios
```

### 15.3 Build web lalu sync

```bash
npm run build
npx cap sync
```

### 15.4 Install push notification plugin

```bash
npm install @capacitor/push-notifications
npx cap sync
```

### 15.5 Register push native

```ts
import { PushNotifications } from "@capacitor/push-notifications";

export async function registerNativePush() {
  const permission = await PushNotifications.requestPermissions();

  if (permission.receive !== "granted") {
    throw new Error("User tidak mengizinkan notifikasi.");
  }

  await PushNotifications.register();

  PushNotifications.addListener("registration", async (token) => {
    await fetch("/api/notification-devices", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      credentials: "include",
      body: JSON.stringify({
        platform: "android", 
        provider: "fcm",
        token: token.value
      })
    });
  });

  PushNotifications.addListener("registrationError", (error) => {
    console.error("Push registration error", error);
  });

  PushNotifications.addListener("pushNotificationReceived", (notification) => {
    console.log("Push received", notification);
  });

  PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
    const url = action.notification.data?.url || "/";
    window.location.href = url;
  });
}
```

Untuk iOS, perlu:

- Apple Developer Account,
- APNs key/certificate,
- konfigurasi Firebase untuk iOS,
- `GoogleService-Info.plist`,
- enable Push Notifications capability di Xcode.

Untuk Android, perlu:

- `google-services.json`,
- konfigurasi Gradle sesuai dokumentasi Firebase/Capacitor.

---

## 16. App Store / Play Store Notes

### 16.1 Risiko App Store

Apple bisa menolak aplikasi yang hanya “website dibungkus WebView” tanpa fungsi app yang cukup.

Agar lebih aman:

- Pastikan UI mobile terasa rapi.
- Tambahkan native capability yang relevan, misalnya:
  - push notification,
  - biometric unlock,
  - local notification,
  - offline cache,
  - share/export report.
- Jangan hanya tampilkan halaman web tanpa value tambahan.

### 16.2 Play Store

Untuk Android, wrapper PWA biasanya lebih mudah diterima daripada App Store, tapi tetap harus:

- target SDK sesuai requirement terbaru,
- privacy policy,
- data safety form,
- app icon, screenshot, description,
- test account jika fitur butuh login.

### 16.3 Akun developer

- Google Play Console: biaya sekali daftar.
- Apple Developer Program: biaya tahunan.

---

## 17. Checklist PWA

- [ ] Website sudah HTTPS.
- [ ] Mobile responsive sudah nyaman.
- [ ] `manifest.json` tersedia.
- [ ] Icon 192x192 tersedia.
- [ ] Icon 512x512 tersedia.
- [ ] Maskable icon tersedia.
- [ ] `display: standalone`.
- [ ] `theme_color` dan `background_color` diset.
- [ ] Service worker aktif.
- [ ] App bisa di-install di Android Chrome.
- [ ] Instruksi Add to Home Screen untuk iPhone.
- [ ] Offline fallback minimal.
- [ ] Lighthouse PWA check lulus.

---

## 18. Checklist Push Notification

- [ ] Firebase project dibuat.
- [ ] Web app Firebase dibuat.
- [ ] VAPID key dibuat.
- [ ] `firebase-messaging-sw.js` tersedia.
- [ ] Permission hanya diminta setelah user klik tombol.
- [ ] Token berhasil didapat.
- [ ] Token disimpan di backend.
- [ ] Token dikaitkan ke user login.
- [ ] Backend bisa kirim test notification.
- [ ] Klik notifikasi membuka URL yang tepat.
- [ ] Token invalid dinonaktifkan otomatis.
- [ ] User bisa disable notifikasi.
- [ ] Isi notif tidak menampilkan data keuangan sensitif.
- [ ] Ada log pengiriman notifikasi.

---

## 19. Checklist Backend

- [ ] Tabel `notification_devices`.
- [ ] Tabel `notification_preferences`.
- [ ] Tabel `notification_logs`.
- [ ] Endpoint register token.
- [ ] Endpoint unregister token.
- [ ] Endpoint update preference.
- [ ] Worker/cron daily reminder.
- [ ] Worker/cron budget alert.
- [ ] Worker/cron bill reminder.
- [ ] Retry handling.
- [ ] Invalid token pruning.
- [ ] Rate limiting.
- [ ] Internal endpoint dilindungi secret.
- [ ] Audit log untuk notifikasi penting.

---

## 20. Checklist Capacitor

- [ ] Capacitor initialized.
- [ ] Android project dibuat.
- [ ] iOS project dibuat.
- [ ] App ID final ditentukan.
- [ ] Firebase Android app dibuat.
- [ ] Firebase iOS app dibuat.
- [ ] `google-services.json` masuk project Android.
- [ ] `GoogleService-Info.plist` masuk project iOS.
- [ ] Push notification plugin diinstall.
- [ ] Permission flow diuji.
- [ ] Native token terkirim ke backend.
- [ ] Deep link dari notifikasi jalan.
- [ ] Build release Android berhasil.
- [ ] TestFlight build berhasil.
- [ ] Privacy policy siap.
- [ ] Store screenshots siap.
- [ ] Demo account siap.

---

## 21. Prioritas Implementasi

### Sprint 1 — PWA Installable

Output:

- monev.app bisa di-install.
- Icon dan splash basic.
- UI mobile dicek.

Task:

1. Tambah manifest.
2. Tambah icon.
3. Tambah service worker.
4. Tambah install prompt.
5. QA Android dan iOS.

### Sprint 2 — Push Notification MVP

Output:

- User bisa mengaktifkan notifikasi.
- Backend bisa kirim test notification.

Task:

1. Setup Firebase.
2. Implement FCM Web.
3. Buat endpoint token.
4. Simpan token di DB.
5. Buat function kirim push.
6. Buat halaman setting notification.
7. QA foreground/background.

### Sprint 3 — Notification Use Cases

Output:

- Reminder dan alert pertama berjalan.

Task:

1. Daily reminder.
2. Bill reminder.
3. Budget threshold alert.
4. Notification logs.
5. Preference user.
6. Prune token invalid.

### Sprint 4 — Capacitor Android

Output:

- APK/AAB Android internal testing.

Task:

1. Setup Capacitor.
2. Setup Android.
3. Setup FCM native.
4. Register token native.
5. Deep link notification.
6. Upload internal testing Play Console.

### Sprint 5 — iOS/TestFlight

Output:

- Build TestFlight.

Task:

1. Setup Apple Developer.
2. Setup APNs/Firebase iOS.
3. Build iOS via Xcode.
4. Test push iOS.
5. Submit TestFlight.

---

## 22. Risiko dan Mitigasi

| Risiko | Dampak | Mitigasi |
|---|---|---|
| iOS PWA push tidak semulus Android | User iPhone bingung | Beri instruksi Add to Home Screen |
| User menolak permission | Tidak bisa kirim notif | Jelaskan manfaat sebelum request |
| Token invalid | Banyak gagal kirim | Prune token otomatis |
| Notifikasi dianggap spam | User disable notif | Kirim hanya notif penting |
| Data keuangan bocor di lock screen | Risiko privasi | Isi notif dibuat generic |
| App Store menolak wrapper | Rilis iOS tertunda | Tambah native value: push, biometric, offline |
| Backend cron salah timezone | Reminder jam salah | Simpan timezone user |
| Banyak device per user | Duplikasi notif | Simpan device unik dan dedup token |

---

## 23. Definisi Done

### PWA Done

- User Android bisa install monev.app.
- User iPhone punya instruksi install Home Screen.
- App tampil standalone.
- Tidak ada layout utama yang rusak di mobile.

### Push Done

- User bisa klik “Aktifkan Notifikasi”.
- Permission muncul setelah user action.
- Token tersimpan di backend.
- Admin/server bisa kirim test push.
- Klik notif membuka halaman benar.
- User bisa disable notifikasi.
- Token invalid dinonaktifkan otomatis.

### Capacitor Done

- Android build bisa diuji internal.
- iOS build bisa diuji TestFlight.
- Push native berjalan.
- Login/session tetap aman.
- Store metadata siap.

---

## 24. Rekomendasi Final Eksekusi

Mulai dari ini:

```text
Minggu 1:
- Jadikan monev.app PWA installable.
- Setup Firebase Cloud Messaging Web.
- Tambah tombol Aktifkan Notifikasi.
- Simpan token user di backend.
- Kirim test notification.

Minggu 2:
- Tambah reminder harian.
- Tambah budget alert.
- Tambah bill reminder.
- Tambah preference notifikasi.
- QA Android/iOS.

Setelah stabil:
- Bungkus dengan Capacitor untuk Android.
- Lanjut iOS/TestFlight jika user iPhone signifikan.
```

Prioritas implementasi paling cepat:

```text
1. PWA
2. FCM Web
3. Backend token storage
4. Reminder/alert
5. Capacitor Android
6. Capacitor iOS
```

---

## 25. Catatan untuk Developer

Hal yang perlu dicek sebelum mulai coding:

1. Framework frontend monev.app sekarang apa?
   - Next.js, React, Vue, Laravel Blade, atau lainnya.
2. Backend pakai apa?
   - Node.js, Laravel, Rails, Django, Go, dll.
3. Auth pakai cookie session atau JWT?
4. Deploy di mana?
   - Vercel, VPS, Cloudflare, Supabase, Railway, dll.
5. Database apa?
   - PostgreSQL, MySQL, MongoDB, Supabase, dll.
6. Apakah user sudah punya timezone?
7. Apakah sudah ada fitur budget/tagihan?
8. Apakah sudah ada privacy policy?

Kalau belum ada timezone, minimal default ke:

```text
Asia/Jakarta
```

---

## 26. Contoh Notification Copy

### Aman

```text
Monev
Jangan lupa catat transaksi hari ini.
```

```text
Monev
Ada budget yang perlu kamu cek.
```

```text
Monev
Ada tagihan yang mendekati jatuh tempo.
```

```text
Monev
Ringkasan mingguan kamu sudah siap.
```

### Hindari

```text
Saldo kamu tinggal Rp120.000.
```

```text
Pengeluaran makan kamu sudah Rp2.350.000.
```

```text
Tagihan kartu kredit Rp8.900.000 jatuh tempo besok.
```

Alasannya: isi lock screen bisa terlihat orang lain.

---

## 27. Final Decision

Untuk monev.app, keputusan teknis yang paling masuk akal:

```text
Gunakan PWA + Firebase Cloud Messaging Web sebagai MVP.
Setelah push dan UX terbukti jalan, bungkus dengan Capacitor untuk rilis Android/iOS.
```

Ini adalah jalur tercepat, minim rewrite, dan tetap memberi jalan ke aplikasi mobile sungguhan.
