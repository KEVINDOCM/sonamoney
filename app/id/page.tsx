import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Aplikasi Pengeluaran Terbaik Indonesia 2025 | SonaMoney",
  description:
    "Catat pengeluaran harian dalam Rupiah. Gratis selamanya. Kurs real-time USD→IDR. Bisa offline. Tidak perlu kartu kredit. 10,000+ pengguna Indonesia.",
  keywords: [
    "aplikasi pengeluaran",
    "catat pengeluaran",
    "aplikasi keuangan indonesia",
    "budget app indonesia",
    "pengeluaran harian",
    "manajemen keuangan pribadi",
  ],
  openGraph: {
    title: "Aplikasi Pengeluaran Terbaik Indonesia 2025 | SonaMoney",
    description:
      "Catat pengeluaran harian dalam Rupiah. Gratis selamanya, kurs real-time, bisa offline.",
    url: "https://sona-money.vercel.app/id",
    locale: "id_ID",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "https://sona-money.vercel.app/id",
    languages: {
      "en-US": "https://sona-money.vercel.app",
      "id-ID": "https://sona-money.vercel.app/id",
    },
  },
}

export default function IndonesiaPage() {
  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      {/* Hero Section */}
      <section className="px-4 py-16 lg:py-24">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#00B9A7]/10 rounded-full mb-6">
            <span className="text-lg">🇮🇩</span>
            <span className="text-sm font-medium text-[#00B9A7]">
              #1 Aplikasi Keuangan di Indonesia
            </span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-extrabold text-[#1A1A2E] mb-6">
            Catat Pengeluaran Harian{" "}
            <span className="text-[#00B9A7]">dalam Rupiah</span>
          </h1>
          <p className="text-lg lg:text-xl text-[#6B7280] mb-8 max-w-2xl mx-auto">
            Gratis selamanya. Kurs real-time USD → IDR. Bisa offline. Tidak
            perlu kartu kredit. Dipercaya 10,000+ pengguna Indonesia.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center px-8 py-4 bg-[#00B9A7] text-white font-semibold rounded-full hover:bg-[#0099A0] transition-colors shadow-lg shadow-[#00B9A7]/25"
            >
              Daftar Gratis →
            </Link>
            <Link
              href="/features/currency"
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-[#1A1A2E] font-semibold rounded-full border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              Lihat Fitur Multi-Mata Uang
            </Link>
          </div>
        </div>
      </section>

      {/* Section 1: Why Indonesians Choose SonaMoney */}
      <section className="px-4 py-16 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl lg:text-4xl font-bold text-[#1A1A2E] text-center mb-12">
            Kenapa Warga Indonesia Memilih SonaMoney
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-[#F5F7FA]">
              <div className="w-12 h-12 bg-[#00B9A7]/10 rounded-xl flex items-center justify-center mb-4">
                <span className="text-2xl">💱</span>
              </div>
              <h3 className="text-lg font-bold text-[#1A1A2E] mb-2">
                Kurs Real-Time USD → IDR
              </h3>
              <p className="text-[#6B7280]">
                Otomatis konversi pengeluaran dalam dolar ke Rupiah dengan kurs
                terkini. Cocok untuk yang sering belanja online internasional.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-[#F5F7FA]">
              <div className="w-12 h-12 bg-[#00B9A7]/10 rounded-xl flex items-center justify-center mb-4">
                <span className="text-2xl">📴</span>
              </div>
              <h3 className="text-lg font-bold text-[#1A1A2E] mb-2">
                Bisa Offline
              </h3>
              <p className="text-[#6B7280]">
                Catat pengeluaran meski tanpa internet. Data tersimpan lokal,
                sinkron otomatis saat online. Sempurna untuk daerah dengan sinyal
                terbatas.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-[#F5F7FA]">
              <div className="w-12 h-12 bg-[#00B9A7]/10 rounded-xl flex items-center justify-center mb-4">
                <span className="text-2xl">🛒</span>
              </div>
              <h3 className="text-lg font-bold text-[#1A1A2E] mb-2">
                Kategori Khas Indonesia
              </h3>
              <p className="text-[#6B7280]">
                Sudah ada kategori: Kos/Kost, GoJek/Grab, Indomaret, Warung,
                Pulsa, THR, dan gaji ke-13.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Real-Time Exchange */}
      <section className="px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold text-[#1A1A2E] mb-6">
                Kurs Real-Time USD → IDR Built-In
              </h2>
              <p className="text-lg text-[#6B7280] mb-6">
                Belanja di Amazon, App Store, atau Netflix? SonaMoney otomatis
                konversi ke Rupiah dengan kurs Bank Indonesia yang selalu
                terupdate.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <span className="w-6 h-6 bg-[#00B9A7] text-white rounded-full flex items-center justify-center text-sm">✓</span>
                  <span className="text-[#6B7280]">
                    Kurs BI (Bank Indonesia) terkini
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-6 h-6 bg-[#00B9A7] text-white rounded-full flex items-center justify-center text-sm">✓</span>
                  <span className="text-[#6B7280]">
                    Update setiap 4 jam
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-6 h-6 bg-[#00B9A7] text-white rounded-full flex items-center justify-center text-sm">✓</span>
                  <span className="text-[#6B7280]">
                    Riwayat kurs untuk laporan keuangan
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-6 h-6 bg-[#00B9A7] text-white rounded-full flex items-center justify-center text-sm">✓</span>
                  <span className="text-[#6B7280]">
                    Dukungan EUR, GBP, SGD, JPY, AUD
                  </span>
                </li>
              </ul>
              <Link
                href="/features/currency"
                className="inline-flex items-center mt-8 text-[#00B9A7] font-semibold hover:underline"
              >
                Pelajari fitur multi-mata uang →
              </Link>
            </div>
            <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100">
              <div className="space-y-4">
                <div className="p-4 bg-[#F5F7FA] rounded-xl">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-[#6B7280]">Netflix Subscription</span>
                    <span className="text-sm text-[#6B7280]">USD 15.49</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#1A1A2E] font-medium">= Rp 248.000</span>
                    <span className="text-xs text-[#00B9A7]">kurs 16.012</span>
                  </div>
                </div>
                <div className="p-4 bg-[#F5F7FA] rounded-xl">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-[#6B7280]">App Store Purchase</span>
                    <span className="text-sm text-[#6B7280]">USD 4.99</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#1A1A2E] font-medium">= Rp 79.900</span>
                    <span className="text-xs text-[#00B9A7]">kurs 16.012</span>
                  </div>
                </div>
                <div className="p-4 bg-[#E6F7F6] rounded-xl border border-[#00B9A7]/20">
                  <div className="flex justify-between items-center">
                    <span className="text-[#1A1A2E] font-bold">Total Pengeluaran USD</span>
                    <span className="text-[#00B9A7] font-bold">= Rp 327.900</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: Local Categories */}
      <section className="px-4 py-16 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl lg:text-4xl font-bold text-[#1A1A2E] text-center mb-12">
            Kategori Pengeluaran untuk Gaya Hidup Indonesia
          </h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 bg-[#F5F7FA] rounded-xl text-center">
              <span className="text-2xl mb-2 block">🏠</span>
              <span className="font-medium text-[#1A1A2E]">Kos/Kost</span>
            </div>
            <div className="p-4 bg-[#F5F7FA] rounded-xl text-center">
              <span className="text-2xl mb-2 block">🛵</span>
              <span className="font-medium text-[#1A1A2E]">GoJek/Grab</span>
            </div>
            <div className="p-4 bg-[#F5F7FA] rounded-xl text-center">
              <span className="text-2xl mb-2 block">🏪</span>
              <span className="font-medium text-[#1A1A2E]">Indomaret/Alfamart</span>
            </div>
            <div className="p-4 bg-[#F5F7FA] rounded-xl text-center">
              <span className="text-2xl mb-2 block">🍜</span>
              <span className="font-medium text-[#1A1A2E]">Warung/Kantin</span>
            </div>
            <div className="p-4 bg-[#F5F7FA] rounded-xl text-center">
              <span className="text-2xl mb-2 block">📱</span>
              <span className="font-medium text-[#1A1A2E]">Pulsa/Data</span>
            </div>
            <div className="p-4 bg-[#F5F7FA] rounded-xl text-center">
              <span className="text-2xl mb-2 block">🎁</span>
              <span className="font-medium text-[#1A1A2E]">THR/Gaji ke-13</span>
            </div>
          </div>

          <p className="text-center text-[#6B7280] mt-8">
            Semua kategori sudah dalam bahasa Indonesia. Bisa custom sesuai
            kebutuhan Anda.
          </p>
        </div>
      </section>

      {/* Section 4: Offline Mode */}
      <section className="px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-[#1A1A2E] mb-6">
            Bisa Offline — Tetap Bekerja Tanpa Internet
          </h2>
          <p className="text-lg text-[#6B7280] mb-8 max-w-2xl mx-auto">
            Di pesawat, di daerah terpencil, atau saat sinyal hilang? SonaMoney
            tetap mencatat. Sinkron otomatis saat kembali online.
          </p>

          <div className="grid sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <div className="p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-[#00B9A7]/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">✏️</span>
              </div>
              <h3 className="font-bold text-[#1A1A2E] mb-2">Catat Offline</h3>
              <p className="text-sm text-[#6B7280]">
                Tambah pengeluaran kapan saja, data tersimpan lokal
              </p>
            </div>
            <div className="p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-[#00B9A7]/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="font-bold text-[#1A1A2E] mb-2">Lihat Laporan</h3>
              <p className="text-sm text-[#6B7280]">
                Grafik dan statistik tetap tersedia offline
              </p>
            </div>
            <div className="p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-[#00B9A7]/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🔄</span>
              </div>
              <h3 className="font-bold text-[#1A1A2E] mb-2">Sinkron Otomatis</h3>
              <p className="text-sm text-[#6B7280]">
                Data sinkron saat online, tanpa duplikat
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 5: CTA */}
      <section className="px-4 py-16 bg-[#00B9A7]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Daftar Gratis — Tidak Perlu Kartu Kredit
          </h2>
          <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
            Bergabung dengan 10,000+ pengguna Indonesia yang sudah mengontrol
            keuangan mereka. Gratis selamanya.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center justify-center px-8 py-4 bg-white text-[#00B9A7] font-bold rounded-full hover:bg-gray-100 transition-colors shadow-lg"
          >
            Daftar Sekarang →
          </Link>
          <p className="text-sm text-white/60 mt-4">
            Upgrade ke Premium untuk fitur analitik lanjutan
          </p>
        </div>
      </section>

      {/* Internal Links */}
      <section className="px-4 py-12 bg-[#F5F7FA] border-t border-gray-200">
        <div className="max-w-4xl mx-auto">
          <p className="text-sm text-[#6B7280] text-center">
            Lihat juga:{" "}
            <Link
              href="/features/currency"
              className="text-[#00B9A7] hover:underline"
            >
              multi-currency support
            </Link>{" "}
            •{" "}
            <Link
              href="/guides/budgeting-tips"
              className="text-[#00B9A7] hover:underline"
            >
              cara mengatur uang
            </Link>{" "}
            •{" "}
            <Link href="/signup" className="text-[#00B9A7] hover:underline">
              daftar sekarang
            </Link>
          </p>
        </div>
      </section>
    </div>
  )
}
