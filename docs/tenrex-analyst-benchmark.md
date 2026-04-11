# Tenrex Analyst-Grade Benchmark

Gunakan dokumen ini untuk mengevaluasi apakah jawaban Tenrex sudah terasa seperti briefing analis, bukan sekadar rangkuman data.

## File Acuan

- Prompt suite: `src/lib/chat/benchmark-suite.js`
- Prompt builder: `src/lib/chat/request-profile.js`

## Cara Pakai

1. Jalankan aplikasi lokal.
2. Ambil prompt dari `TENREX_BENCHMARK_SUITE`.
3. Uji minimal 1 prompt dari setiap kategori.
4. Nilai tiap jawaban memakai 6 dimensi rubrik.
5. Catat pola kegagalan, lalu iterasi prompt/style rules sebelum menguji ulang.

## Rubrik Nilai

Beri skor 1-5 untuk setiap dimensi:

- `Answer First`: apakah jawaban inti muncul di 1-2 kalimat pertama?
- `Relevance`: apakah hanya bagian yang relevan yang ditampilkan?
- `Signal Density`: apakah metrik, level, catalyst, atau implikasi yang dipilih benar-benar penting?
- `Structure`: apakah jawaban mudah dipindai dan proporsional terhadap pertanyaannya?
- `Judgment`: apakah Tenrex menyintesis data menjadi view, trade-off, atau implikasi?
- `Tone`: apakah terdengar seperti analis pasar, bukan chatbot umum?

## Ambang Lulus

- Strong pass: `24/30` atau lebih
- Analyst-grade minimum:
  - `Answer First >= 4`
  - `Relevance >= 4`
  - `Judgment >= 4`
  - `Tone >= 4`

## Red Flags Umum

- Jawaban membuka dengan filler seperti "Berikut analisisnya".
- Terlalu banyak section untuk pertanyaan sederhana.
- Raw dump headline atau indikator tanpa interpretasi.
- Tidak mengambil posisi saat pertanyaan membutuhkan judgment.
- Menyebut banyak data, tetapi tidak memberi implikasi.
- Kesimpulan hanya mengulang isi sebelumnya.

## Pola Iterasi yang Disarankan

Kalau `Answer First` lemah:
- Perketat aturan pembuka di system prompt.

Kalau `Relevance` lemah:
- Kurangi kecenderungan model membuat section default.

Kalau `Signal Density` lemah:
- Rapikan tool output agar lebih terstruktur dan lebih sedikit noise.

Kalau `Judgment` lemah:
- Tambah instruksi bahwa model harus memberi view, trade-off, atau implication.

Kalau `Tone` lemah:
- Perketat analyst-style rules dan larang filler chatbot.

## Benchmark Loop

- Putaran 1: uji semua kategori
- Putaran 2: fokus ke kategori dengan skor terendah
- Putaran 3: uji ulang pertanyaan singkat, comparison, outlook, dan explainer
- Final check: pastikan jawaban sederhana tetap pendek, jawaban kompleks tetap tajam
