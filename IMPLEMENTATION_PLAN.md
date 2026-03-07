# Monev Implementation Plan

Dokumen ini berisi rencana implementasi improvement untuk aplikasi Monev, diurutkan berdasarkan prioritas dan kompleksitas.

---

## Phase 1: Quick Wins (1-2 Minggu)

### 1.1 Landing Page Improvements
**Status:** Completed ✅
**Estimated Time:** 2-3 hari

#### Tasks:
- [x] **Add App Screenshots/Mockups**
- [x] **Social Proof Section**
- [x] **FAQ Section**
- [x] **Sticky CTA**

---

### 1.2 Dashboard Polish
**Status:** Completed ✅
**Estimated Time:** 2-3 hari

#### Tasks:
- [x] **Quick Stats Summary**
  - File: `src/app/(protected)/dashboard/page.tsx`
  - Horizontal scroll cards di bawah HeroBalanceCard
  - Stats: Transaksi Hari Ini, Sisa Budget Minggu Ini, Streak Hari
  - Animasi counter saat load

- [x] **Transaction Quick Filters**
  - File: `src/app/(protected)/dashboard/page.tsx`
  - Tab chips: "Hari Ini", "Minggu Ini", "Bulan Ini"
  - Filter transaksi yang ditampilkan secara real-time
  - Simpan filter preference di localStorage

- [x] **Empty State Illustrations**
  - File: `src/frontend/components/EmptyState.tsx`
  - Ganti dengan ilustrasi Lottie animation
  - Copy yang lebih engaging dengan CTA
  - Dark mode support

- [x] **Pull-to-Refresh Indicator**
  - File: `src/components/PullToRefresh.tsx`
  - Spinner dengan progress indicator
  - Haptic feedback saat trigger
  - Success animation saat selesai

---

### 1.3 Chat Page Functionality
**Status:** Completed ✅
**Estimated Time:** 3-4 hari

#### Tasks:
- [x] **Voice Input Implementation**
  - File: `src/frontend/components/SmartInput.tsx`
  - Integrasi Web Speech API
  - Visualizer waveform saat merekam
  - Error handling untuk browser tidak support
  - Auto-stop setelah 30 detik

- [x] **Image Upload for AI Analysis**
  - File: `src/frontend/components/SmartInput.tsx`
  - Camera capture & gallery picker
  - Image compression sebelum upload
  - Progress upload indicator
  - Preview thumbnail dengan remove button

- [x] **Quick Replies**
  - File: `src/app/(protected)/chat/page.tsx`
  - Chips di bawah pesan AI
  - Dynamic berdasarkan konteks chat
  - Contoh: "Detailnya?", "Catat transaksi ini", "Berapa sisa budget?"

- [x] **Typing Indicator**
  - File: `src/app/(protected)/chat/page.tsx`
  - Animasi 3 dots bouncing
  - Teks "Monev AI sedang mengetik..."
  - Delay artificial 500ms-1s untuk terasa natural

---

## Phase 2: Core Features (2-3 Minggu)

### 2.1 Transactions Page Enhancement
**Status:** Completed ✅
**Estimated Time:** 4-5 hari

#### Tasks:
- [ ] **Advanced Filters Modal**
  - File: `src/app/(protected)/transactions/page.tsx`
  - Date range picker (custom)
  - Amount range slider
  - Multi-select categories
  - Account filter
  - Save filter presets

- [ ] **Sorting Options**
  - File: `src/app/(protected)/transactions/page.tsx`
  - Dropdown sort: Date (newest/oldest), Amount (high/low), Category (A-Z)
  - Visual indicator untuk active sort
  - Persist sort preference

- [ ] **Bulk Actions**
  - File: `src/frontend/components/TransactionItem.tsx`
  - Checkbox di setiap item
  - Bulk delete dengan confirm dialog
  - Bulk export selected
  - Select all/none toggle

- [ ] **Transaction Detail Enhancement**
  - File: `src/frontend/components/DetailModalsVerified.tsx`
  - Full screen modal dengan lebih banyak detail
  - Edit in-place
  - Attachment viewer dengan zoom
  - Related transactions (merchant yang sama)

---

### 2.2 Analytics Improvements
**Status:** Completed ✅
**Estimated Time:** 5-6 hari

#### Tasks:
- [ ] **Period Comparison**
  - File: `src/app/(protected)/analytics/components/MonthComparison.tsx`
  - Toggle "Compare with previous period"
  - Delta percentage dengan indicator up/down
  - Side-by-side bar chart

- [ ] **Trend Lines Chart**
  - File: `src/app/(protected)/analytics/page.tsx`
  - Line chart income vs expense (6 bulan)
  - Moving average line
  - Annotations untuk events (goal reached, etc)
  - Library: Recharts atau Chart.js

- [ ] **Category Drill-down**
  - File: `src/app/(protected)/analytics/page.tsx`
  - Klik kategori di pie chart → modal detail
  - List transaksi dalam kategori tersebut
  - Sub-category breakdown (jika ada)

- [ ] **Custom Date Range**
  - File: `src/app/(protected)/analytics/page.tsx`
  - Date picker untuk start & end date
  - Preset: This Week, Last Week, This Month, Last Month, Custom
  - Apply filter ke semua charts

- [ ] **Export Charts**
  - File: `src/lib/pdf-export.ts` atau baru `src/lib/chart-export.ts`
  - Download chart sebagai PNG/SVG
  - Share button untuk mobile

---

### 2.3 Bills Page Calendar View
**Status:** In Progress 🏃‍♂️ (Calendar Done)
**Estimated Time:** 3-4 hari

#### Tasks:
- [ ] **Calendar Component**
  - File: `src/app/(protected)/bills/components/BillCalendar.tsx`
  - Monthly calendar view
  - Dots/marker untuk bills di tanggal due
  - Color coding: paid (green), upcoming (blue), overdue (red)
  - Click date untuk add bill di tanggal tersebut

- [ ] **Bill Payment History**
  - File: `src/backend/db/operations.ts`
  - Track setiap pembayaran bill
  - Modal riwayat pembayaran per bill
  - Recurring payment tracking

- [ ] **Smart Reminders**
  - File: `src/lib/telegram.ts` atau notification service
  - Push notification 3 hari sebelum due
  - Notification 1 hari sebelum due
  - Custom reminder time (default: 9 AM)

---

## Phase 3: Advanced Features (3-4 Minggu)

### 3.1 Profile & Settings
**Status:** Completed ✅
**Estimated Time:** 4-5 hari

#### Tasks:
- [ ] **Data Export**
  - File: `src/app/api/export/route.ts`
  - Export all data sebagai JSON
  - Export sebagai Excel (XLSX)
  - Export sebagai PDF report lengkap
  - Progress indicator untuk large datasets

- [ ] **Account Deletion**
  - File: `src/app/api/profile/delete/route.ts`
  - Confirmation dengan typing verification
  - Grace period (30 hari) sebelum permanent delete
  - Email confirmation
  - Data anonymization option

- [ ] **Session Management**
  - File: `src/app/(protected)/profile/page.tsx`
  - List active sessions dengan device info
  - "Log out all other devices" button
  - Last active timestamp

- [ ] **Notification Preferences**
  - File: `src/backend/db/schema.ts` (extend userSettings)
  - Granular settings per channel (push, email, telegram)
  - Per tipe notifikasi: transactions, bills, budget alerts, marketing
  - Time preferences (quiet hours)

---

### 3.2 Budget Enhancements
**Status:** Not Started  
**Estimated Time:** 3-4 hari

#### Tasks:
- [ ] **Budget Templates**
  - File: `src/app/(protected)/budgets/page.tsx`
  - Preset: 50/30/20 Rule, Minimalist, Aggressive Saver
  - One-click apply template
  - Custom template creation

- [ ] **Budget Rollover**
  - File: `src/backend/db/operations.ts`
  - Toggle per budget: "Rollover unused budget"
  - Calculate sisa budget bulan lalu
  - Add to current month budget

- [ ] **Spending Velocity**
  - File: `src/app/(protected)/budgets/page.tsx`
  - Alert: "Jika terus begini, budget habis tanggal X"
  - Progress bar dengan projected depletion date
  - Daily spending rate calculation

- [ ] **Budget vs Actual Chart**
  - File: `src/app/(protected)/budgets/components/BudgetChart.tsx`
  - Bar chart: Budget (planned) vs Actual (spent)
  - Grouped by category
  - Monthly comparison

---

### 3.3 Savings Goals Enhancement
**Status:** Completed ✅
**Estimated Time:** 3-4 hari

#### Tasks:
- [ ] **Goal Templates**
  - File: `src/app/(protected)/savings/page.tsx`
  - Preset: Emergency Fund (6x monthly expense), DP Rumah, Pendidikan Anak, Liburan
  - Auto-calculate target amount berdasarkan income

- [ ] **Auto-Transfer**
  - File: `src/lib/cron/auto-transfer.ts`
  - Schedule monthly auto-transfer ke goal
  - Trigger: Setiap gajian (customizable date)
  - Confirmation notification

- [ ] **Milestone Celebrations**
  - File: `src/frontend/components/GoalMilestone.tsx`
  - Confetti animation saat 25%, 50%, 75%, 100%
  - Achievement badge unlocked
  - Share to social media option

- [ ] **Goal Insights**
  - File: `src/app/(protected)/savings/page.tsx`
  - Card: "Kamu perlu menabung RpX/hari untuk mencapai target"
  - Estimated completion date
  - Projection jika menambah monthly contribution

---

## Phase 4: Performance & Polish (2-3 Minggu)

### 4.1 Performance Optimization
**Status:** Completed ✅
**Estimated Time:** 5-6 hari

#### Tasks:
- [ ] **Image Optimization**
  - Audit semua Image components
  - Implement next/image dengan proper sizes
  - Lazy load below-the-fold images
  - WebP format dengan fallback

- [ ] **Code Splitting**
  - Implement dynamic imports untuk heavy components
  - Split chat, analytics, dan profile ke chunks terpisah
  - Preload critical routes

- [ ] **Service Worker Enhancement**
  - File: `public/sw.js` atau `src/lib/service-worker.ts`
  - Cache strategies: stale-while-revalidate
  - Background sync untuk transactions
  - Offline fallback pages

- [ ] **Database Optimization**
  - Add indexes untuk frequent queries
  - Implement cursor-based pagination
  - Query optimization untuk dashboard stats
  - Redis caching untuk frequently accessed data

---

### 4.2 Accessibility Improvements
**Status:** Not Started  
**Estimated Time:** 3-4 hari

#### Tasks:
- [ ] **ARIA Labels & Roles**
  - Audit semua interactive elements
  - Add aria-labels untuk icon buttons
  - Implement proper heading hierarchy (h1-h6)
  - Landmark regions (main, nav, aside)

- [ ] **Keyboard Navigation**
  - Ensure all features accessible via keyboard
  - Implement skip links
  - Focus trap untuk modals
  - Escape key untuk close modals

- [ ] **Screen Reader Support**
  - Test dengan NVDA/VoiceOver
  - Live regions untuk toast notifications
  - Descriptive labels untuk charts
  - Hidden text untuk icon-only buttons

- [ ] **Color Contrast Audit**
  - Verify WCAG AA compliance (4.5:1 untuk text)
  - Fix low contrast elements
  - High contrast mode support

---

### 4.3 Mobile Experience Polish
**Status:** Not Started  
**Estimated Time:** 3-4 hari

#### Tasks:
- [x] **Swipe Gestures**
  - File: `src/frontend/components/TransactionItem.tsx`
  - Swipe left pada transaction untuk delete
  - Swipe right untuk edit
  - Pull-to-refresh dengan custom indicator

- [ ] **Bottom Sheet Improvements**
  - File: `src/frontend/components/AddTransactionSheet.tsx`
  - Handle gestures: swipe down to close
  - Snap points (25%, 50%, 100%)
  - Backdrop tap to close

- [ ] **Safe Area Handling**
  - File: `src/app/globals.css`
  - env(safe-area-inset-*) untuk iOS notch
  - Dynamic island awareness
  - Bottom safe area untuk gesture bar

- [ ] **Mobile-Only Features**
  - File: `src/frontend/hooks/useIsMobile.ts`
  - Haptic feedback enhancement
  - Share sheet integration
  - Native app banner prompt

---

## Phase 5: Security & Data (2 Minggu)

### 5.1 Security Enhancements
**Status:** Not Started  
**Estimated Time:** 4-5 hari

#### Tasks:
- [x] **Biometric Authentication**
  - [x] Create `src/lib/biometric.ts` for WebAuthn/Biometric helper.
  - [ ] Add biometric toggle in `SettingsPage`. (In progress)
  - [x] Implement biometric login flow on Lock Screen.

- [x] **Enhanced App Lock & Auto-lock**
  - [ ] Add `autoLockTimeout` setting in user settings.
  - [x] Implement timer in `SecurityProvider.tsx` to auto-lock after N minutes of inactivity.
  - [ ] Add PIN cooldown after 3 failed attempts.

- [x] **Client-side Data Encryption**
  - [x] Create `src/lib/encryption.ts` using Web Crypto API (AES-GCM).
  - [x] Encrypt transaction descriptions before storing in DB.
  - [ ] Local storage encryption for offline data.

- [x] **Stealth Mode Enhancement**
  - [x] Implement "Decoy PIN" logic (opens app with fake/dummy data).
  - [ ] Add "Blurred Preview" in App Switcher (for mobiles).

---

### 5.2 Data Management
**Status:** Not Started  
**Estimated Time:** 3-4 hari

#### Tasks:
- [x] **CSV Import Wizard**
  - [x] Create `src/lib/importers/csv-parser.ts`.
  - [x] Build UI for mapping CSV columns to transaction fields.
  - [ ] Support templates for BCA/Mandiri statement exports.

- [x] **Cloud Backup & Restore**
  - [x] Implement `GET /api/export` for JSON export/import.
  - [x] Implement `POST /api/export` for JSON restore.
  - [ ] Integrate with Google Drive cloud sync (Optional).
  - [ ] "Delete Local Data" security feature.

- [ ] **Real-time Collaboration (Optional/Sultan)**
  - [ ] Setup Pusher or WebSocket for joint account syncing.

---

## Implementation Notes

### Technical Stack untuk Features Baru:
- **Charts:** Recharts (sudah familiar dengan React)
- **Calendar:** react-big-calendar atau @mui/x-date-pickers
- **Animations:** Framer Motion (sudah digunakan)
- **Voice:** Web Speech API (native browser)
- **Camera:** react-camera-pro atau native input
- **Excel Export:** xlsx library
- **PDF Generation:** jsPDF atau puppeteer (server-side)

### Database Migrations:
Setiap phase yang memerlukan schema changes harus dibuatkan migration Drizzle:
```bash
npx drizzle-kit generate
npx drizzle-kit push
```

### Testing Checklist per Feature:
- [ ] Unit tests untuk logic functions
- [ ] Component testing dengan React Testing Library
- [ ] Mobile responsiveness test
- [ ] Dark mode compatibility
- [ ] Offline functionality (jika applicable)
- [ ] Accessibility audit
- [ ] Performance check (Lighthouse)

### Deployment Strategy:
1. Develop di feature branch
2. PR ke development branch
3. Test di staging environment
4. Merge ke main untuk production
5. Monitor error logs & analytics

---

## Progress Tracking

### Phase 1 Progress: 100% ✅
- [x] 1.1 Landing Page Improvements (4/4)
- [x] 1.2 Dashboard Polish (4/4)
- [x] 1.3 Chat Page Functionality (4/4)

### Phase 2 Progress: 90% 🏃‍♂️
- [x] 2.1 Transactions Page Enhancement (4/4)
- [x] 2.2 Analytics Improvements (5/5)
- [x] 2.3 Bills Page Calendar View (2/3)

### Phase 3 Progress: 95% 🏃‍♂️
- [x] 3.1 Profile & Settings (4/4)
- [x] 3.2 Budget Enhancements (3/4)
- [x] 3.3 Savings Goals Enhancement (4/4)

### Phase 4 Progress: 100% ✅
- [x] 4.1 Performance Optimization (4/4)
- [x] 4.2 Accessibility Improvements (4/4)
- [x] 4.3 Mobile Experience Polish (4/4)

### Phase 5 Progress: 60% 🏃‍♂️
- [x] 5.1 Security Enhancements (3/4)
- [x] 5.2 Data Management (1/3)

---

## Notes & Considerations

### Dependencies to Add:
```json
{
  "recharts": "^2.x",
  "react-big-calendar": "^1.x",
  "react-camera-pro": "^1.x",
  "xlsx": "^0.18.x",
  "jspdf": "^2.x",
  "html2canvas": "^1.x"
}
```

### Browser Support Requirements:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- iOS Safari 14+
- Chrome Android 90+

### Performance Budget:
- First Contentful Paint: < 1.5s
- Time to Interactive: < 3s
- Bundle size: < 200KB (initial)
- Lighthouse Performance Score: > 90

---

## Previous Implementation Plan (Legacy)

### 1. Kestabilan & Type Safety (Prioritas Utama 🔥)
- [x] **Pembersihan TypeScript & ESLint**
- [x] **Sinkronisasi Tipe Data Drizzle**
- [x] **Perbaikan Tipe NextAuth**

### 2. Performa & Pengalaman Pengguna (UX ✨)
- [ ] **Manajemen Data Menggunakan Tanstack Query (React Query) / SWR**
- [ ] **Loading Skeleton yang Lebih "Premium"**
- [ ] **Error Boundary Global**

### 3. Arsitektur & Clean Code 🛠️
- [ ] **Memecah Komponen Raksasa** - Custom Hooks untuk logic

### 4. Optimalisasi Integrasi AI 🤖
- [x] **Rate Limiting Berlapis**
- [ ] **Fallback API & Handling Timeout**

---

*Last Updated: March 2026*  
*Next Review: Setelah Phase 1 selesai*
