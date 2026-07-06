import { Metadata } from "next";
import { BookOpen, Target, ListChecks, Scale, Info, CheckCircle2 } from "lucide-react";
import { PublicNavbar } from "@/components/shared/PublicNavbar";
import { Footer } from "@/components/shared/Footer";
import PageBanner from "@/components/shared/PageBanner";

export const metadata: Metadata = {
  title: "Profil — SI-ARUS Kemenag Barito Utara",
  description:
    "Informasi tentang Survei Kepuasan Masyarakat (SKM) Kementerian Agama Kabupaten Barito Utara melalui Sistem Informasi Analisis Rekapitulasi Ulasan Survei (SI-ARUS)",
};

const unsurSKM = [
  {
    no: 1,
    nama: "Persyaratan",
    deskripsi:
      "Syarat yang harus dipenuhi dalam pengurusan suatu jenis pelayanan, baik persyaratan teknis maupun administratif.",
  },
  {
    no: 2,
    nama: "Sistem, Mekanisme & Prosedur",
    deskripsi:
      "Tata cara pelayanan yang dilakukan bagi pemberi dan penerima pelayanan termasuk pengaduan.",
  },
  {
    no: 3,
    nama: "Waktu Penyelesaian",
    deskripsi:
      "Jangka waktu yang diperlukan untuk menyelesaikan seluruh proses pelayanan dari setiap jenis pelayanan.",
  },
  {
    no: 4,
    nama: "Biaya / Tarif",
    deskripsi:
      "Ongkos yang dikenakan kepada penerima layanan dalam mengurus dan/atau memperoleh pelayanan dari penyelenggara yang besarnya ditetapkan berdasarkan kesepakatan antara penyelenggara dan masyarakat.",
  },
  {
    no: 5,
    nama: "Produk Spesifikasi Jenis Pelayanan",
    deskripsi:
      "Hasil pelayanan yang diberikan dan diterima sesuai dengan ketentuan yang ditetapkan. Produk pelayanan ini merupakan hasil dari setiap spesifikasi jenis pelayanan.",
  },
  {
    no: 6,
    nama: "Kompetensi Pelaksana",
    deskripsi:
      "Kemampuan yang harus dimiliki oleh pelaksana meliputi pengetahuan, keahlian, keterampilan, dan pengalaman.",
  },
  {
    no: 7,
    nama: "Perilaku Pelaksana",
    deskripsi: "Sikap petugas dalam memberikan pelayanan.",
  },
  {
    no: 8,
    nama: "Penanganan Pengaduan",
    deskripsi:
      "Saran dan masukan adalah tata cara pelaksanaan penanganan pengaduan dan tindak lanjut.",
  },
  {
    no: 9,
    nama: "Sarana & Prasarana",
    deskripsi:
      "Sarana adalah segala sesuatu yang dapat dipakai sebagai alat dalam mencapai maksud dan tujuan. Prasarana adalah segala sesuatu yang merupakan penunjang utama terselenggaranya suatu proses.",
  },
];

const sasaran = [
  "Mendorong partisipasi masyarakat sebagai pengguna layanan dalam menilai kinerja penyelenggara pelayanan.",
  "Mendorong penyelenggara pelayanan untuk meningkatkan kualitas pelayanan publik.",
  "Mendorong penyelenggara pelayanan menjadi lebih inovatif dalam menyelenggarakan pelayanan publik.",
  "Mengukur kecenderungan tingkat kepuasan masyarakat terhadap pelayanan publik.",
];

export default function ProfilPage() {
  return (
    <>
      <PublicNavbar />
      <main className="min-h-screen bg-gray-50/50 pb-20">
        <PageBanner
          title="Profil SI-ARUS"
          description="Sistem Informasi Analisis Rekapitulasi Ulasan Survei (SI-ARUS) merupakan wadah digital untuk mengukur Indeks Kepuasan Masyarakat pada Kementerian Agama Kabupaten Barito Utara."
          eyebrow="Informasi Pelayanan Publik"
          breadcrumb={[
            { label: "Beranda", href: "/" },
            { label: "Profil SI-ARUS" },
          ]}
        />

        <div className="w-full px-6 sm:px-10 lg:px-16 xl:px-20 py-12 space-y-16">
          {/* Tentang SI-ARUS & Dasar Hukum */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            <div className="lg:col-span-4 flex flex-col justify-center">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 mb-6">
                <Scale className="size-6" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 tracking-tight">
                Landasan Hukum Pelaksanaan SKM
              </h2>
              <p className="text-gray-600 leading-relaxed mb-6">
                Pelaksanaan Survei Kepuasan Masyarakat (SKM) melalui aplikasi SI-ARUS diatur dan berpedoman teguh pada regulasi nasional demi mewujudkan pelayanan prima.
              </p>
              <div className="inline-flex items-center gap-2.5 rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 border border-emerald-100 w-fit">
                <BookOpen className="size-4" />
                PermenPAN-RB No. 14 Tahun 2017
              </div>
            </div>
            
            <div className="lg:col-span-8 bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100/60 leading-relaxed text-gray-700 space-y-4">
              <p>
                Survei Kepuasan Masyarakat dilaksanakan sesuai ketentuan dalam <strong className="text-gray-900">Peraturan Menteri Pendayagunaan Aparatur Negara dan Reformasi Birokrasi Nomor 14 Tahun 2017</strong> tentang Pedoman Penyusunan Survei Kepuasan Masyarakat. Pedoman ini secara resmi menggantikan Permenpanrb No. 16 Tahun 2014.
              </p>
              <p>
                Peraturan sebelumnya dipandang tidak lagi operasional dan memerlukan penjabaran teknis dalam pelaksanaannya, sehingga disesuaikan dengan metode survei yang lebih aplikatif, terdigitalisasi melalui <strong>SI-ARUS</strong>, dan mudah dilaksanakan oleh masyarakat kapan saja dan di mana saja.
              </p>
              <div className="mt-6 flex items-start gap-3 bg-blue-50/50 p-4 rounded-xl border border-blue-100/50">
                <Info className="size-5 text-blue-600 shrink-0 mt-0.5" />
                <p className="text-sm text-blue-900">
                  Dalam Permenpan No. 14 Tahun 2017 disebutkan bahwa SKM ini bertujuan utama untuk mengukur secara kuantitatif maupun kualitatif tingkat kepuasan masyarakat sebagai pengguna layanan demi peningkatan kualitas penyelenggaraan pelayanan publik di lingkungan Kemenag Kab. Barito Utara.
                </p>
              </div>
            </div>
          </section>

          {/* Sasaran */}
          <section>
            <div className="text-center mb-10">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 tracking-tight">Sasaran Penyelenggaraan SKM</h2>
              <p className="text-gray-500 max-w-2xl mx-auto">Tujuan dan target utama mengapa Survei Kepuasan Masyarakat ini penting untuk dilaksanakan secara berkala.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
              {sasaran.map((item, i) => (
                <div key={i} className="group relative bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 hover:border-blue-200">
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity duration-300">
                    <Target className="size-20" />
                  </div>
                  <div className="relative z-10 flex flex-col h-full">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold mb-4">
                      {i + 1}
                    </div>
                    <p className="text-gray-700 text-sm leading-relaxed font-medium">
                      {item}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 9 Unsur SKM */}
          <section>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 tracking-tight">9 Unsur Penilaian</h2>
                <p className="text-gray-500">Unsur-unsur utama yang menjadi indikator evaluasi pelayanan.</p>
              </div>
              <div className="flex items-center gap-2 text-sm font-medium text-emerald-700 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100">
                <ListChecks className="size-4" />
                Standar Penilaian SKM
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {unsurSKM.map((item) => (
                <div
                  key={item.no}
                  className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all duration-300 group"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white font-bold shadow-md shadow-emerald-200/50 group-hover:scale-110 transition-transform duration-300">
                      {item.no}
                    </div>
                    <h3 className="font-bold text-gray-900 text-base leading-snug">
                      {item.nama}
                    </h3>
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {item.deskripsi}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <div className="pt-8 border-t border-gray-200/60 flex items-center justify-center gap-2 text-center text-xs text-gray-400">
            <CheckCircle2 className="size-4" />
            <span>
              Sumber data dan pedoman berdasarkan dokumen resmi Kementerian PAN-RB dan implementasi teknis Kementerian Agama.
            </span>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
