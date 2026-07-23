'use client';

import React, { useState } from 'react';

export function LandingFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: 'Apa itu GASKAN?',
      a: 'GASKAN (Gerbang Akses Pintar dan Kehadiran) adalah sistem manajemen kehadiran digital yang dikembangkan khusus untuk SMTI Jogja guna memudahkan pencatatan dan pemantauan absensi siswa secara real-time.',
    },
    {
      q: 'Siapa yang bisa menggunakan GASKAN?',
      a: 'GASKAN memiliki tiga role pengguna: Siswa (dapat melihat data kehadiran sendiri), Admin (mengelola seluruh data kehadiran dan laporan), dan Developer (akses penuh termasuk monitoring sistem dan konfigurasi).',
    },
    {
      q: 'Apakah data kehadiran aman?',
      a: 'Ya. Data disimpan di server yang aman dengan sistem autentikasi berlapis. Setiap pengguna hanya dapat mengakses data sesuai role-nya, sehingga privasi dan keamanan data terjaga.',
    },
    {
      q: 'Bagaimana cara login ke GASKAN?',
      a: 'Gunakan NIS (Nomor Induk Siswa) dan password yang diberikan oleh admin sekolah. Jika mengalami masalah login, segera hubungi admin atau guru yang bertanggung jawab.',
    },
    {
      q: 'Apakah GASKAN gratis digunakan?',
      a: 'Ya, GASKAN adalah sistem internal SMTI Jogja yang dikembangkan oleh tim developer siswa sekolah dan tidak dikenakan biaya apapun untuk penggunanya.',
    },
  ];

  return (
    <section id="faq" className="py-24 bg-muted/40">
      <div className="max-w-3xl mx-auto px-4">
        <div className="text-center mb-16 space-y-3">
          <div className="inline-block bg-primary/10 text-primary text-sm font-semibold px-4 py-1.5 rounded-full border border-primary/20 mb-2">
            FAQ
          </div>
          <h2 className="text-3xl md:text-4xl font-bold">
            Pertanyaan <span className="text-primary">Umum</span>
          </h2>
          <p className="opacity-70">Jawaban untuk pertanyaan yang sering ditanyakan tentang GASKAN.</p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <div
                key={i}
                className="bg-card border border-border hover:border-primary/30 rounded-2xl transition-colors duration-200 overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="w-full text-left p-5 font-semibold text-base flex justify-between items-center gap-4 cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <span className={`text-xl transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
                    ↓
                  </span>
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-sm opacity-70 leading-relaxed border-t border-border/50">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
