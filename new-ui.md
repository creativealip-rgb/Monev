Tentu, ini adalah draf panduan desain dalam format Markdown yang bisa kamu gunakan langsung sebagai dokumentasi teknis atau acuan (*style guide*) di tim **Antigravity**.

---

# 🚀 UI/UX Design Guideline - Project Antigravity

Dokumen ini berisi standar visual yang diadaptasi dari analisis elemen aplikasi islami modern untuk diterapkan pada pengembangan website Antigravity.

---

## 1. Core Visual Concept

* **Design Style:** Modern Clean, Islamic Aesthetic, Card-Based UI.
* **Emphasis:** Memberikan kesan tenang (*calm*), terorganisir, dan fokus pada konten.
* **Surface:** Menggunakan elevasi melalui bayangan lembut (*soft shadows*) daripada garis tepi (*borders*).

---

## 2. Design Fundamentals

### 📐 Spacing & Radius

| Element | Specification | Utility Class (Tailwind) |
| --- | --- | --- |
| **Border Radius** | Extra Rounded (16px - 24px) | `rounded-2xl` / `rounded-3xl` |
| **Container Padding** | 20px - 32px | `p-5` to `p-8` |
| **Grid Gap** | 12px - 16px | `gap-3` to `gap-4` |

### ✨ Elevation (Shadows)

* **Card Shadow:** `0 4px 20px -1px rgba(0, 0, 0, 0.05)`
* **Active State:** `0 10px 15px -3px rgba(0, 0, 0, 0.1)`

---

## 3. Color Palette

| Usage | Color Name | Hex Code | Preview |
| --- | --- | --- | --- |
| **Primary** | Forest Green | `#0C4A44` | *Main Backgrounds & Buttons* |
| **Secondary** | Lime Accent | `#BEF264` | *Progress & Highlights* |
| **Background** | Ghost White | `#F8FAFC` | *Page Background* |
| **Surface** | Pure White | `#FFFFFF` | *Cards & Modals* |
| **Accent 1** | Amber | `#F59E0B` | *Secondary Actions* |
| **Text Main** | Slate 900 | `#0F172A` | *Headings* |
| **Text Muted** | Slate 500 | `#64748B` | *Labels & Descriptions* |

---

## 4. Typography

* **Primary Font:** `Plus Jakarta Sans` atau `Inter` (Sans-serif).
* **Arabic Font:** `Amiri` atau `IBM Plex Sans Arabic` (Clean Naskh).

### Typography Scale

* **Display (Clock/Big Numbers):** 36pt - 48pt, Bold, Tracking -2%.
* **Heading 1:** 20pt, Semi-Bold.
* **Sub-heading:** 14pt, Medium, Uppercase (for labels).
* **Body:** 14pt - 16pt, Regular.

---

## 5. UI Components Reference

### A. Hero Card (Main Display)

Kartu utama yang menampilkan informasi krusial (seperti waktu sholat atau status utama).

* **Background:** Solid `#0C4A44` atau Linear Gradient.
* **Feature:** Horizontal Progress Bar dengan warna `#BEF264`.
* **Content:** High contrast (teks putih).

### B. Quick Access Grid

Layout menu navigasi cepat dalam bentuk grid.

* **Structure:** Icon di dalam lingkaran berwarna pastel, diikuti label di bawahnya.
* **Interaction:** Scale up 5% saat *hover*.

### C. Segmented Control (Pill Tabs)

Digunakan untuk perpindahan kategori/filter.

* **Shape:** Full rounded (Pill).
* **Active State:** Background solid dengan teks kontras.
* **Inactive State:** Background transparan atau abu-abu sangat muda.

---

## 6. Iconography Standards

* **Style:** Linear / Outline.
* **Stroke Weight:** `1.5px` - `2px`.
* **Corner:** Rounded caps & joins.
* **Container:** Masukkan ikon ke dalam *soft-colored box* untuk membedakan kategori fungsional.

---

## 7. Implementation Snippet (Tailwind CSS)

Contoh kode untuk **Hero Card**:

```html
<div class="bg-[#0C4A44] rounded-[32px] p-8 text-white relative overflow-hidden shadow-lg">
  <div class="flex justify-between items-center mb-6">
    <span class="bg-white/10 px-4 py-1 rounded-full text-xs font-medium">Jakarta</span>
    <span class="text-white/80 text-sm">29 Sya'ban 1447 H</span>
  </div>
  <h3 class="text-lg opacity-80 uppercase tracking-widest font-semibold">Sholat Berikutnya</h3>
  <h1 class="text-5xl font-bold mt-2">Fajr</h1>
  <div class="text-6xl font-black mt-4">07:12:54 <span class="text-sm font-normal opacity-70">lagi</span></div>
  
  <div class="w-full bg-white/10 h-1.5 mt-8 rounded-full">
    <div class="bg-[#BEF264] h-1.5 rounded-full w-1/3"></div>
  </div>
</div>

```

---

> **Note:** Pastikan untuk menjaga konsistensi pada *corner radius*. Jika kartu luar menggunakan `24px`, maka elemen di dalamnya (seperti gambar atau button) sebaiknya menggunakan `12px` - `16px` agar terlihat harmonis secara visual.

---

Apakah kamu ingin saya membuatkan **skema warna lengkap (Tailwind Config)** atau mungkin **struktur folder project** agar sesuai dengan standar modern?