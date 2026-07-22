"use client";

import { BookOpen, Target, ListChecks, Scale, Info, CheckCircle2, ShieldCheck } from "lucide-react";
import { PublicNavbar } from "@/components/shared/PublicNavbar";
import { Footer } from "@/components/shared/Footer";
import PageBanner from "@/components/shared/PageBanner";
import { useI18n } from "@/components/shared/I18nProvider";

const unsurSKM_ID = [
  { no: 1, nama: "Persyaratan", deskripsi: "Syarat yang harus dipenuhi dalam pengurusan suatu jenis pelayanan, baik persyaratan teknis maupun administratif." },
  { no: 2, nama: "Sistem, Mekanisme & Prosedur", deskripsi: "Tata cara pelayanan yang dilakukan bagi pemberi dan penerima pelayanan termasuk pengaduan." },
  { no: 3, nama: "Waktu Penyelesaian", deskripsi: "Jangka waktu yang diperlukan untuk menyelesaikan seluruh proses pelayanan dari setiap jenis pelayanan." },
  { no: 4, nama: "Biaya / Tarif", deskripsi: "Ongkos yang dikenakan kepada penerima layanan dalam mengurus dan/atau memperoleh pelayanan dari penyelenggara." },
  { no: 5, nama: "Produk Spesifikasi Jenis Pelayanan", deskripsi: "Hasil pelayanan yang diberikan dan diterima sesuai dengan ketentuan yang ditetapkan." },
  { no: 6, nama: "Kompetensi Pelaksana", deskripsi: "Kemampuan yang harus dimiliki oleh pelaksana meliputi pengetahuan, keahlian, keterampilan, dan pengalaman." },
  { no: 7, nama: "Perilaku Pelaksana", deskripsi: "Sikap dan perilaku petugas dalam memberikan pelayanan kepada masyarakat." },
  { no: 8, nama: "Penanganan Pengaduan", deskripsi: "Saran dan masukan adalah tata cara pelaksanaan penanganan pengaduan dan tindak lanjut." },
  { no: 9, nama: "Sarana & Prasarana", deskripsi: "Sarana dan prasarana penunjang utama terselenggaranya suatu proses pelayanan yang nyaman." },
];

const unsurSKM_EN = [
  { no: 1, nama: "Requirements", deskripsi: "Technical and administrative requirements to be fulfilled by service applicants." },
  { no: 2, nama: "System, Mechanism & Procedures", deskripsi: "Service workflow and procedures for providers and recipients, including complaint channels." },
  { no: 3, nama: "Completion Time", deskripsi: "Total duration required to complete the entire service process from start to finish." },
  { no: 4, nama: "Fees & Tariffs", deskripsi: "Official charges incurred by service recipients based on established regulations." },
  { no: 5, nama: "Service Product Specifications", deskripsi: "The final output or service product delivered according to official standards." },
  { no: 6, nama: "Officer Competence", deskripsi: "Knowledge, expertise, skills, and experience possessed by service officers." },
  { no: 7, nama: "Officer Conduct & Behavior", deskripsi: "Attitude, politeness, and professionalism of officers in delivering service." },
  { no: 8, nama: "Handling of Complaints & Feedback", deskripsi: "Procedures and responsiveness in handling public complaints, suggestions, and follow-ups." },
  { no: 9, nama: "Facilities & Infrastructure", deskripsi: "Physical and digital infrastructure supporting comfortable and accessible service delivery." },
];

const unsurIPAK_ID = [
  { no: 1, nama: "Diskriminasi Pelayanan", deskripsi: "Ada tidaknya perlakuan berbeda atau ketidakadilan oleh petugas dalam memberikan pelayanan publik." },
  { no: 2, nama: "Pungutan Liar (Pungli)", deskripsi: "Ada tidaknya permintaan biaya tambahan atau pungutan tidak resmi di luar ketentuan tarif pelayanan yang ditetapkan." },
  { no: 3, nama: "Pemberian Imbalan / Gratifikasi", deskripsi: "Ada tidaknya permintaan imbalan, uang ucapan terima kasih, atau hadiah/gratifikasi dalam pengurusan layanan." },
  { no: 4, nama: "Percaloan / Perantara Tidak Resmi", deskripsi: "Ada tidaknya praktek calo atau keterlibatan perantara tidak resmi untuk mempercepat proses pelayanan." },
  { no: 5, nama: "Praktek Suap / Korupsi", deskripsi: "Ada tidaknya indikasi atau praktek suap, pemerasan, dan penyalahgunaan wewenang dalam proses pelayanan publik." },
];

const unsurIPAK_EN = [
  { no: 1, nama: "Service Discrimination", deskripsi: "Presence or absence of differential or unfair treatment by officers during service delivery." },
  { no: 2, nama: "Illegal Levies (Pungli)", deskripsi: "Presence or absence of unofficial fee requests outside designated official tariffs." },
  { no: 3, nama: "Gratification & Tip Demands", deskripsi: "Presence or absence of demands for tips, gifts, or gratification in service processing." },
  { no: 4, nama: "Unauthorized Brokers", deskripsi: "Presence or absence of broker involvement or illegal third-party intermediaries." },
  { no: 5, nama: "Bribery & Corruption Practices", deskripsi: "Presence or absence of bribery, extortion, or abuse of authority in public services." },
];

const sasaran_ID = [
  "Mendorong partisipasi masyarakat sebagai pengguna layanan dalam menilai kinerja penyelenggara pelayanan.",
  "Mendorong penyelenggara pelayanan untuk meningkatkan kualitas pelayanan publik.",
  "Mendorong penyelenggara pelayanan menjadi lebih inovatif dalam menyelenggarakan pelayanan publik.",
  "Mengukur kecenderungan tingkat kepuasan masyarakat terhadap pelayanan publik.",
];

const sasaran_EN = [
  "Encourage public participation as service users in evaluating provider performance.",
  "Motivate service providers to continuously elevate public service standards.",
  "Foster innovation among service providers in delivering public services.",
  "Measure public satisfaction trends and public perception over time.",
];

export default function ProfilPage() {
  const { locale, t } = useI18n();

  const isEn = locale === 'en';
  const unsurSKM = isEn ? unsurSKM_EN : unsurSKM_ID;
  const unsurIPAK = isEn ? unsurIPAK_EN : unsurIPAK_ID;
  const sasaran = isEn ? sasaran_EN : sasaran_ID;

  return (
    <>
      <PublicNavbar />
      <main className="min-h-screen bg-gray-50/50 pb-12">
        <PageBanner
          title={isEn ? "About SI-ARUS" : "Tentang SI-ARUS"}
          description={
            isEn
              ? "The Survey Review Recapitulation Analysis Information System (SI-ARUS) is a digital platform to measure the Public Satisfaction Index at the Ministry of Religious Affairs of Barito Utara Regency."
              : "Sistem Informasi Analisis Rekapitulasi Ulasan Survei (SI-ARUS) merupakan wadah digital untuk mengukur Indeks Kepuasan Masyarakat pada Kementerian Agama Kabupaten Barito Utara."
          }
          eyebrow={isEn ? "Public Service Information" : "Informasi Pelayanan Publik"}
          breadcrumb={[
            { label: t('nav.home'), href: "/" },
            { label: isEn ? "About SI-ARUS" : "Tentang SI-ARUS" },
          ]}
        />

        <div className="w-full px-6 sm:px-10 lg:px-16 xl:px-20 pt-10 pb-4 space-y-16">
          {/* Tentang SI-ARUS & Dasar Hukum */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            <div className="lg:col-span-4 flex flex-col justify-center">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 mb-6">
                <Scale className="size-6" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 tracking-tight">
                {isEn ? "About SI-ARUS" : "Tentang SI-ARUS"}
              </h2>
              <p className="text-gray-600 text-base leading-relaxed mb-6">
                {isEn
                  ? "SI-ARUS (Survey Review Recapitulation Analysis Information System) was developed to provide transparency and digital processing of Public Satisfaction Survey (SKM) data within the Ministry of Religious Affairs of Barito Utara Regency."
                  : "SI-ARUS (Sistem Informasi Analisis Rekapitulasi Ulasan Survei) dikembangkan untuk memberikan transparansi dan kemudahan pengolahan data Survei Kepuasan Masyarakat (SKM) secara digital di lingkungan Kementerian Agama Kabupaten Barito Utara."}
              </p>
              <div className="flex items-center gap-3 text-sm font-semibold text-emerald-700 bg-emerald-50/80 p-4 rounded-2xl border border-emerald-100">
                <Info className="size-5 shrink-0" />
                <span>{isEn ? "Based on PermenPAN-RB No. 14 Year 2017" : "Berdasarkan PermenPAN-RB No. 14 Tahun 2017"}</span>
              </div>
            </div>

            <div className="lg:col-span-8 bg-white p-8 sm:p-10 rounded-3xl border border-gray-100 shadow-sm space-y-6">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <BookOpen className="size-5 text-emerald-600" />
                {isEn ? "Legal Framework for SKM Implementation" : "Dasar Hukum Pelaksanaan SKM"}
              </h3>
              <ul className="space-y-4 text-gray-600 text-sm leading-relaxed">
                <li className="flex items-start gap-3">
                  <span className="flex size-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold shrink-0 mt-0.5">1</span>
                  <span>
                    {isEn ? (
                      <><strong>Law No. 25 Year 2009</strong> concerning Public Services, mandating all public service providers to evaluate performance periodically.</>
                    ) : (
                      <><strong>Undang-Undang Nomor 25 Tahun 2009</strong> tentang Pelayanan Publik yang mewajibkan setiap penyelenggara pelayanan publik melakukan evaluasi kinerja secara berkala.</>
                    )}
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex size-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold shrink-0 mt-0.5">2</span>
                  <span>
                    {isEn ? (
                      <><strong>Ministerial Regulation PAN-RB No. 14 Year 2017</strong> regarding Guidelines for Compiling Public Satisfaction Surveys for Public Service Units.</>
                    ) : (
                      <><strong>Peraturan Menteri PAN-RB Nomor 14 Tahun 2017</strong> tentang Pedoman Penyusunan Survei Kepuasan Masyarakat Unit Penyelenggara Pelayanan Publik.</>
                    )}
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex size-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold shrink-0 mt-0.5">3</span>
                  <span>
                    {isEn ? (
                      <><strong>Ministerial Regulation of Religious Affairs No. 16 Year 2010</strong> concerning Management of Public Information Services.</>
                    ) : (
                      <><strong>Peraturan Menteri Agama Nomor 16 Tahun 2010</strong> tentang Pengelolaan Pelayanan Informasi Publik di Lingkungan Kementerian Agama.</>
                    )}
                  </span>
                </li>
              </ul>
              <p className="text-xs text-gray-500 pt-4 border-t border-gray-100 leading-relaxed">
                {isEn
                  ? "Permenpan No. 14 Year 2017 states that SKM aims to measure public satisfaction both quantitatively and qualitatively to continuously enhance public service quality in Kemenag Barito Utara."
                  : "Dalam Permenpan No. 14 Tahun 2017 disebutkan bahwa SKM ini bertujuan utama untuk mengukur secara kuantitatif maupun kualitatif tingkat kepuasan masyarakat sebagai pengguna layanan demi peningkatan kualitas penyelenggaraan pelayanan publik di lingkungan Kemenag Kab. Barito Utara."}
              </p>
            </div>
          </section>

          {/* Sasaran */}
          <section>
            <div className="text-center mb-10">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 tracking-tight">
                {isEn ? "Objectives of SKM Implementation" : "Sasaran Penyelenggaraan SKM"}
              </h2>
              <p className="text-gray-500 max-w-2xl mx-auto">
                {isEn
                  ? "Key goals and targets explaining why the Public Satisfaction Survey is conducted periodically."
                  : "Tujuan dan target utama mengapa Survei Kepuasan Masyarakat ini penting untuk dilaksanakan secara berkala."}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
              {sasaran.map((item, i) => (
                <div key={i} className="group relative bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 hover:border-emerald-200">
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity duration-300">
                    <Target className="size-20" />
                  </div>
                  <div className="relative z-10 flex flex-col h-full">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 font-bold mb-4">
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

          {/* 9 Unsur SKM / IPKP */}
          <section>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4 border-b border-gray-200/80 pb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">IPKP</span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-2 tracking-tight">
                  {isEn ? "9 Assessment Elements of IPKP" : "9 Unsur Penilaian IPKP"}
                </h2>
                <p className="text-gray-500 text-sm mt-1">
                  {isEn
                    ? "Evaluation indicators for the Service Quality Perception Index (PermenPAN-RB No. 14/2017)."
                    : "Indikator evaluasi Indeks Persepsi Kualitas Pelayanan Publik (PermenPAN-RB No. 14/2017)."}
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm font-medium text-emerald-700 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100 shrink-0">
                <ListChecks className="size-4" />
                <span>{isEn ? "9 Indicator Elements" : "9 Unsur Indikator"}</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {unsurSKM.map((item) => (
                <div
                  key={item.no}
                  className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all duration-300 group"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white font-bold shadow-md shadow-emerald-200/50 group-hover:scale-110 transition-transform duration-300">
                      U{item.no}
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

          {/* 5 Unsur IPAK (Anti Korupsi) */}
          <section>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4 border-b border-gray-200/80 pb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-3 py-1 rounded-full border border-teal-100">IPAK</span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-2 tracking-tight">
                  {isEn ? "5 Assessment Elements of IPAK" : "5 Unsur Penilaian IPAK"}
                </h2>
                <p className="text-gray-500 text-sm mt-1">
                  {isEn
                    ? "Evaluation indicators for the Anti-Corruption Perception Index (WBK/WBBM Integrity Zone)."
                    : "Indikator evaluasi Indeks Persepsi Anti Korupsi (Zona Integritas WBK/WBBM)."}
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm font-medium text-teal-800 bg-teal-50 px-4 py-2 rounded-full border border-teal-100 shrink-0">
                <ShieldCheck className="size-4 text-teal-600" />
                <span>{isEn ? "5 Anti-Corruption Elements" : "5 Unsur Anti Korupsi"}</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {unsurIPAK.map((item) => (
                <div
                  key={item.no}
                  className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-teal-200 transition-all duration-300 group"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-600 to-cyan-700 text-white font-bold shadow-md shadow-teal-200/50 group-hover:scale-110 transition-transform duration-300">
                      A{item.no}
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
              {isEn
                ? "Data sources and guidelines are based on official documents from the Ministry of PAN-RB and technical implementations of the Ministry of Religious Affairs."
                : "Sumber data dan pedoman berdasarkan dokumen resmi Kementerian PAN-RB dan implementasi teknis Kementerian Agama."}
            </span>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
