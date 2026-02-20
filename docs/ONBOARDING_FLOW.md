# Onboarding Flow Specification - Monev

## Overview

Dokumen ini menjelaskan alur onboarding (pengenalan awal aplikasi) untuk aplikasi Monev - Pencatat Keuangan Pribadi. Onboarding ini dirancang untuk memberikan pengalaman pertama yang menarik dan informatif bagi pengguna baru.

---

## 🎯 Goals

1. **First Impression**: Membangun brand awareness dan kepercayaan
2. **Feature Introduction**: Menjelaskan fitur-fitur utama aplikasi
3. **User Engagement**: Mendorong pengguna untuk membuat akun atau mencoba aplikasi
4. **Personalization**: Setup awal untuk pengalaman yang lebih personal

---

## 📱 User Journey Flow

### Screen 1: Welcome/Splash

**Purpose**: First impression dan brand introduction

**Elements**:
- App logo dengan animasi pulse/float
- App name "Monev" dengan gradient text effect
- Tagline: "Kelola Keuanganmu dengan Cerdas"
- Background: Animated gradient atau abstract shapes
- CTA: Tombol "Mulai" atau swipe indicator

**Animations**:
- Logo: Float animation (up-down subtle)
- Background: Gradient shift atau particle effect
- Text: Fade-in dengan stagger effect

**Navigation**:
- Tap/Click "Mulai" → Screen 2
- Optional: Tombol "Lewati" di kanan atas (skip ke login)

---

### Screen 2: Feature Highlights (Carousel)

**Purpose**: Menjelaskan 4 fitur utama aplikasi dalam carousel

#### Slide 1: Pencatatan Mudah
```
Icon: Receipt atau Wallet
Title: "Catat Transaksi dalam Sekejap"
Description: "Rekam pemasukan dan pengeluaran dengan mudah, kapan saja dan di mana saja"
```

#### Slide 2: Analisis Cerdas
```
Icon: BarChart3 atau TrendingUp
Title: "Analisis Keuangan Otomatis"
Description: "Lihat laporan mingguan dan bulanan untuk mengontrol keuanganmu dengan bijak"
```

#### Slide 3: Tujuan & Tabungan
```
Icon: Target atau PiggyBank
Title: "Wujudkan Tujuan Keuangan"
Description: "Buat target tabungan dan pantau perkembangannya secara real-time"
```

#### Slide 4: Aman & Private
```
Icon: Shield atau Lock
Title: "Data Aman & Terenkripsi"
Description: "Informasi keuanganmu dilindungi dengan enkripsi dan privasi terjamin"
```

**Interactions**:
- Horizontal swipe gesture
- Dot indicators (4 dots) di bagian bawah
- Tombol panah kiri/kanan (optional)
- Auto-advance setiap 5 detik (bisa di-pause)

**Animations**:
- Slide transition: Slide horizontal dengan fade
- Icon: Subtle bounce atau float animation
- Progress dots: Active dot expand/pulse

---

### Screen 3: Quick Setup

**Purpose**: Personalisasi pengalaman pengguna

**Form Fields**:

1. **Pilih Mata Uang**
   - Default: Rupiah (IDR)
   - Options: IDR, USD, EUR, SGD, MYR
   - Component: Dropdown dengan flag icons

2. **Pilih Bahasa**
   - Default: Bahasa Indonesia
   - Options: Indonesia, English
   - Component: Toggle switch atau dropdown

3. **Keamanan (Opsional)**
   - Checkbox: "Aktifkan PIN untuk keamanan"
   - Jika dicentang: Input 6-digit PIN
   - Component: PIN input dengan hidden digits

4. **Notifikasi**
   - Toggle: "Izinkan reminder harian"
   - Subtext: "Kami akan mengingatkanmu mencatat transaksi"
   - Component: Toggle switch

**Validation**:
- Currency dan language harus dipilih
- PIN (jika diaktifkan) harus 6 digit

**Navigation**:
- Tombol "Lanjutkan" → Screen 4
- Tombol "Kembali" → Screen 2

---

### Screen 4: Call-to-Action (Final Screen)

**Purpose**: Konversi pengguna ke action (register/login)

**Layout**:
- Large illustration atau icon celebration
- Headline: "Siap Memulai?"
- Subtext: "Pilih cara untuk mulai menggunakan Monev"

**Primary Actions**:

1. **Buat Akun Baru** (Primary Button)
   - Style: Gradient button (sky-500 to cyan-500)
   - Icon: UserPlus
   - Action: Redirect ke `/register`

2. **Sudah Punya Akun? Login** (Secondary Button)
   - Style: Outline button
   - Icon: LogIn
   - Action: Redirect ke `/login`

**Alternative Actions**:

3. **Coba Tanpa Akun** (Tertiary Link)
   - Style: Text link
   - Subtext: "Data akan tersimpan di perangkat ini"
   - Action: Start guest mode → Redirect ke `/dashboard`
   - Note: Nanti bisa export/register untuk cloud backup

**Social Login** (Optional):
- "Atau login dengan"
- Google button (jika OAuth enabled)
- Apple button (untuk iOS)

---

## 🎨 Design System

### Color Palette

```css
/* Primary Colors */
--primary-sky: #0ea5e9;
--primary-cyan: #06b6d4;
--gradient-primary: linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%);

/* Background */
--bg-gradient: linear-gradient(135deg, #f8fafc 0%, #e0f2fe 50%, #ecfeff 100%);

/* Text */
--text-primary: #0f172a;
--text-secondary: #64748b;
--text-muted: #94a3b8;

/* Semantic */
--success: #10b981;
--warning: #f59e0b;
--error: #ef4444;
```

### Typography

- **Heading**: Inter/SF Pro Display, Bold (700)
- **Body**: Inter/SF Pro Text, Regular (400), Medium (500)
- **Sizes**:
  - Headline: 28-32px
  - Title: 20-24px
  - Body: 16px
  - Caption: 14px
  - Small: 12px

### Components

#### Glass Card
```css
.glass-card {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}
```

#### Primary Button
```css
.btn-primary {
  background: linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%);
  color: white;
  padding: 16px 32px;
  border-radius: 12px;
  font-weight: 600;
  box-shadow: 0 4px 14px rgba(14, 165, 233, 0.4);
  transition: all 0.3s ease;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(14, 165, 233, 0.5);
}
```

#### Progress Dots
```css
.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(148, 163, 184, 0.5);
  transition: all 0.3s ease;
}

.dot.active {
  width: 24px;
  border-radius: 4px;
  background: #0ea5e9;
}
```

---

## ⚡ Animations & Interactions

### Page Transitions

**Enter Animation**:
```
Duration: 600ms
Easing: cubic-bezier(0.16, 1, 0.3, 1)
Effect: Fade in + slide up (20px)
```

**Exit Animation**:
```
Duration: 400ms
Easing: cubic-bezier(0.4, 0, 0.2, 1)
Effect: Fade out + slide left (50px)
```

### Micro-interactions

1. **Button Hover**:
   - Scale: 1.02
   - Shadow increase
   - Duration: 200ms

2. **Input Focus**:
   - Border color: sky-500
   - Ring: 4px sky-500/20
   - Duration: 150ms

3. **Swipe Gesture**:
   - Resistance: 0.7
   - Snap to slide
   - Velocity threshold: 0.5

4. **Success State**:
   - Checkmark animation
   - Confetti effect (optional)
   - Duration: 800ms

---

## 📁 File Structure

```
src/
├── app/
│   ├── onboarding/
│   │   ├── page.tsx                    # Main onboarding page
│   │   ├── layout.tsx                  # Onboarding-specific layout
│   │   ├── components/
│   │   │   ├── WelcomeScreen.tsx       # Screen 1
│   │   │   ├── FeatureCarousel.tsx     # Screen 2
│   │   │   ├── FeatureSlide.tsx        # Individual slide
│   │   │   ├── QuickSetup.tsx          # Screen 3
│   │   │   ├── CTAScreen.tsx           # Screen 4
│   │   │   ├── ProgressDots.tsx        # Navigation dots
│   │   │   ├── OnboardingButton.tsx    # Reusable CTA button
│   │   │   └── OnboardingCard.tsx      # Glass card wrapper
│   │   ├── hooks/
│   │   │   └── useOnboarding.ts        # State & navigation logic
│   │   ├── context/
│   │   │   └── OnboardingContext.tsx   # Global state provider
│   │   └── types/
│   │       └── onboarding.ts           # TypeScript interfaces
│   ├── login/
│   │   └── page.tsx
│   ├── register/
│   │   └── page.tsx
│   └── dashboard/
│       └── page.tsx
├── components/
│   └── ui/                             # Shared UI components
└── lib/
    └── utils.ts
```

---

## 🔧 Technical Implementation

### State Management

```typescript
// hooks/useOnboarding.ts
interface OnboardingState {
  currentScreen: number;
  totalScreens: number;
  formData: {
    currency: string;
    language: string;
    pin: string;
    notifications: boolean;
  };
  isComplete: boolean;
}

// Actions
- nextScreen()
- prevScreen()
- goToScreen(index: number)
- updateFormData(field: string, value: any)
- completeOnboarding()
- skipOnboarding()
```

### Local Storage Keys

```typescript
const STORAGE_KEYS = {
  HAS_SEEN_ONBOARDING: 'monev_onboarding_complete',
  ONBOARDING_DATA: 'monev_onboarding_data',
  GUEST_MODE: 'monev_guest_mode'
};
```

### Route Guard Logic

```typescript
// middleware.ts atau layout check
function checkOnboardingStatus() {
  const hasSeenOnboarding = localStorage.getItem('monev_onboarding_complete');
  
  if (!hasSeenOnboarding && pathname !== '/onboarding') {
    redirect('/onboarding');
  }
  
  if (hasSeenOnboarding && pathname === '/onboarding') {
    redirect('/login');
  }
}
```

---

## 📊 Analytics & Tracking

### Events to Track

1. **onboarding_started**
   - Trigger: User masuk ke screen 1
   - Properties: timestamp, referrer

2. **onboarding_slide_viewed**
   - Trigger: Setiap kali slide feature dilihat
   - Properties: slide_index, slide_name

3. **onboarding_skipped**
   - Trigger: Tombol "Lewati" ditekan
   - Properties: at_screen

4. **onboarding_step_completed**
   - Trigger: Setiap screen selesai
   - Properties: screen_number, duration

5. **onboarding_completed**
   - Trigger: Selesai screen 4
   - Properties: total_duration, chosen_action (register/login/guest)

6. **onboarding_abandoned**
   - Trigger: User keluar dari aplikasi di tengah onboarding
   - Properties: last_screen, time_spent

---

## 🌐 Localization

### Bahasa Indonesia (Default)

```json
{
  "welcome": {
    "title": "Selamat Datang di Monev",
    "subtitle": "Kelola Keuanganmu dengan Cerdas",
    "cta": "Mulai"
  },
  "features": {
    "slide1": {
      "title": "Catat Transaksi dalam Sekejap",
      "description": "Rekam pemasukan dan pengeluaran dengan mudah, kapan saja dan di mana saja"
    },
    "slide2": {
      "title": "Analisis Keuangan Otomatis",
      "description": "Lihat laporan mingguan dan bulanan untuk mengontrol keuanganmu dengan bijak"
    },
    "slide3": {
      "title": "Wujudkan Tujuan Keuangan",
      "description": "Buat target tabungan dan pantau perkembangannya secara real-time"
    },
    "slide4": {
      "title": "Data Aman & Terenkripsi",
      "description": "Informasi keuanganmu dilindungi dengan enkripsi dan privasi terjamin"
    }
  },
  "setup": {
    "title": "Personalisasi Pengalamanmu",
    "currency": "Mata Uang",
    "language": "Bahasa",
    "pin": "PIN Keamanan",
    "notifications": "Izinkan Notifikasi",
    "continue": "Lanjutkan"
  },
  "cta": {
    "title": "Siap Memulai?",
    "register": "Buat Akun Baru",
    "login": "Sudah Punya Akun? Login",
    "guest": "Coba Tanpa Akun"
  },
  "common": {
    "skip": "Lewati",
    "back": "Kembali",
    "next": "Lanjut"
  }
}
```

### English (Alternative)

```json
{
  "welcome": {
    "title": "Welcome to Monev",
    "subtitle": "Manage Your Finances Smartly",
    "cta": "Get Started"
  },
  "features": {
    "slide1": {
      "title": "Record Transactions in Seconds",
      "description": "Track income and expenses easily, anytime and anywhere"
    },
    "slide2": {
      "title": "Smart Financial Analysis",
      "description": "View weekly and monthly reports to manage your finances wisely"
    },
    "slide3": {
      "title": "Achieve Financial Goals",
      "description": "Set savings targets and track progress in real-time"
    },
    "slide4": {
      "title": "Secure & Private",
      "description": "Your financial information is protected with encryption and guaranteed privacy"
    }
  },
  "setup": {
    "title": "Personalize Your Experience",
    "currency": "Currency",
    "language": "Language",
    "pin": "Security PIN",
    "notifications": "Allow Notifications",
    "continue": "Continue"
  },
  "cta": {
    "title": "Ready to Start?",
    "register": "Create New Account",
    "login": "Already Have an Account? Login",
    "guest": "Try Without Account"
  },
  "common": {
    "skip": "Skip",
    "back": "Back",
    "next": "Next"
  }
}
```

---

## 🧪 Testing Checklist

### Functional Testing

- [ ] Onboarding muncul saat pertama kali install
- [ ] Tidak muncul lagi setelah selesai
- [ ] Tombol "Lewati" berfungsi
- [ ] Carousel swipe gesture berfungsi (mobile)
- [ ] Tombol navigasi prev/next berfungsi
- [ ] Form validation pada screen 3
- [ ] Redirect ke login/register/dashboard berfungsi
- [ ] Guest mode menyimpan preferensi

### UI/UX Testing

- [ ] Animasi smooth tanpa lag
- [ ] Responsive di berbagai screen sizes
- [ - Touch targets minimal 44px (mobile)
- [ ] Text readable dan contrast sufficient
- [ ] Loading states ditampilkan dengan baik
- [ ] Error states ditampilkan dengan jelas

### Accessibility Testing

- [ ] Screen reader compatible
- [ ] Keyboard navigation berfungsi
- [ ] ARIA labels tersedia
- [ ] Focus indicators visible
- [ ] Color blind friendly

### Performance Testing

- [ ] First paint < 1.5s
- [ ] Image assets optimized
- [ ] No layout shift saat animasi
- [ ] Smooth 60fps animations

---

## 🚀 Future Enhancements

### Phase 2 (Post-MVP)

1. **Interactive Demo**
   - Mini-tutorial interaktif untuk mencoba fitur
   - Sample data pre-filled

2. **Gamification**
   - Progress bar dengan achievement
   - "Complete profile" rewards

3. **Personalized Content**
   - Onboarding berdasarkan user type (student, worker, business)
   - Different feature highlights

4. **Video Tutorials**
   - Short video explanations
   - Playable within onboarding

5. **Social Proof**
   - Testimonials dari users
   - Stats: "10,000+ users trust Monev"

---

## 📱 Device-Specific Considerations

### iOS

- Safe area insets untuk notch
- Status bar styling
- Haptic feedback pada interactions
- App Store review guidelines compliance

### Android

- Material Design 3 principles
- Navigation bar handling
- Back button behavior
- Play Store guidelines compliance

### Web

- Browser compatibility (Chrome, Safari, Firefox)
- PWA install prompt
- Keyboard shortcuts
- Deep linking support

---

## 📝 Notes

### Design Principles

1. **Simplicity**: Minimal text, visual-first
2. **Progressive Disclosure**: Info bertahap, tidak overwhelming
3. **Delight**: Micro-interactions dan animations
4. **Clarity**: Clear CTAs dan navigation
5. **Accessibility**: Semua users bisa mengakses

### Do's ✅

- Gunakan bahasa yang friendly dan conversational
- Visualisasikan fitur dengan icons/illustrations
- Berikan opsi skip untuk users yang sudah familiar
- Simpan progress jika user keluar di tengah
- Test dengan users nyata

### Don'ts ❌

- Jangan terlalu banyak text
- Jangan paksa users melewati semua slides
- Jangan gunakan jargon teknis
- Jangan lupakan accessibility
- Jangan buat animations terlalu lama/slow

---

## 📚 References & Inspirations

- Apple App Store Onboarding
- Google Material Design Onboarding Patterns
- Duolingo Gamified Onboarding
- Notion's Minimalist First Experience
- Linear's Elegant Onboarding Flow

---

**Version**: 1.0  
**Last Updated**: 2026-02-19  
**Owner**: Monev Development Team
