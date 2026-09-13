# GK Regency - Otel Yönetim & Ciro Takip Sistemi (PMS)
## Claude Code Kurallar, Yol Haritası ve Mimari Kılavuzu

Bu dosya, projenin mimari yapısını, geliştirme adımlarını, test protokollerini ve kodlama kurallarını tanımlar. Claude Code her aşamada bu kurallara uymalıdır.

---

### 1. Sistem Mimarisi ve Teknoloji Yığını
- **Frontend:** React (Vite) + Tailwind CSS + Lucide React (İkonlar)
- **Backend / Veri Katmanı:** Node.js + Express (Hafif yerel API)
- **Kalıcı Depolama:** `data/db.json` (Doğrudan fiziksel dosya)
- **Zaman/Saat:** Tüm tarih ve saat hesaplamaları bilgisayarın yerel sistem saatinden (`new Date()`) alınır.
- **Çalıştırma:** `npm run dev` komutu `concurrently` ile hem frontend'i hem backend'i tek terminalde başlatır.

---

### 2. Veri Şeması (`data/db.json`)
```json
{
  "guests": [
    {
      "id": "uuid-or-timestamp",
      "tcNo": "12345678901",
      "fullName": "Ahmet Yılmaz",
      "phone": "05551234567",
      "roomNumber": "101",
      "checkInDate": "2026-09-01T10:00:00",
      "checkOutDate": "2026-09-04T12:00:00",
      "pricingMode": "nightly", // "nightly" | "total"
      "pricePerNight": 1500,
      "totalPrice": 4500,
      "paymentStatus": "paid", // "paid" | "partial" | "pending"
      "paidAmount": 4500,
      "notes": "Ön cephe, sessiz oda",
      "status": "active", // "active" | "checked_out" | "archived"
      "actualCheckOutDate": null, // Erken/Normal çıkış anının timestamp'i
      "createdAt": "2026-09-01T10:00:00"
    }
  ],
  "archive": []
}
```

---

### 3. İş Mantığı ve Renk / Durum Kuralları
1. **Aktif Misafirler (Normal):** `status === 'active'` ve Çıkış Tarihine > 3 gün olanlar standart arayüz rengiyle listelenir.
2. **Kritik Süre (Kırmızı Vurgulama):** `status === 'active'` ve Kalan gün sayısı $\le$ 3 olanlar kırmızı/amber tonuyla dikkat çekecek şekilde listelenir. "Tarih Uzat" butonu yer alır.
3. **Çıkış Yapanlar (3 Gün Gri Kuralı):** `status === 'checked_out'` durumuna geçen veya çıkış tarihi gelmiş olan kayıtlar, çıkış anından itibaren 3 gün (72 saat) boyunca açık gri tonda "Çıkış Yaptı" rozetiyle ana tabloda tutulur.
4. **Otomatik Arşivleme:** Çıkış anının üzerinden 72 saat geçen kayıtlar ana listeden çıkartılıp otomatik olarak `archive` dizisine taşınır.
5. **Dinamik Fiyat & Ciro Hesaplama:**
   - Gece sayısı = `(checkOutDate - checkInDate)` gün farkı.
   - Gecelik girilirse: `totalPrice = pricePerNight * nights`
   - Toplam girilirse: `pricePerNight = totalPrice / nights`
   - Erken çıkış yapılırsa konaklanan gerçek gün üzerinden yeniden tutar revizyonu önerilir.
   - Toplam Ciro = Tamamlanan ödemeler + Tahsil edilmiş konaklamalar.

---

### 4. Aşamalı Geliştirme Yol Haritası & Test Protokolü

Her faz tamamlandıktan sonra Claude Code duracak, testlerini yapacak ve doğrulamayı raporlayıp bir sonraki faza geçecektir.

#### FAZ 1: Proje Kurulumu ve Dosya Tabanlı Backend API
- [ ] Vite + React + Tailwind CSS kurulumu.
- [ ] Express sunucusu (`server.js`) ve `data/db.json` okuma/yazma API uç noktaları (`/api/guests`, `/api/guests/:id`, `/api/guests/:id/checkout`, `/api/guests/:id/extend`, `/api/archive`, `/api/stats`).
- [ ] `concurrently` ile tek komutla çalıştırma ayarı.
- **Faz 1 Testi:** Sunucu ayağa kaldırılacak, test verisi `db.json`'a yazılıp API'den okunacak.

#### FAZ 2: UI İskeleti, Header ve Otomatik Ciro & İstatistik Paneli
- [ ] Lüks otel temasına uygun modern koyu/açık uyumlu Tailwind teması (`frontend-design`).
- [ ] Header: GK Regency logosu, canlı yerel saat/takvim.
- [ ] Dashboard Finans Kartları: Aktif Doluluk, Aylık Toplam Ciro, Tahmini Kalan Gelir, Bugün Çıkış Yapacaklar.
- **Faz 2 Testi:** Saatin dinamik aktığı ve mockup verilerle kartların doğru hesaplandığı doğrulanacak.

#### FAZ 3: Yeni Misafir Ekleme Modalı ve Dinamik Fiyatlandırma
- [ ] Modal bileşeni: TC No, İsim-Soyisim, Telefon, Oda No, Giriş Tarihi/Saati (otomatik yerel saat), Çıkış Tarihi, Fiyat Modu (Gecelik <-> Toplam senkronizasyonu), Ödeme Durumu, Notlar.
- [ ] Form doğrulama ve API'ye POST isteği atılarak `db.json`'a kayıt.
- **Faz 3 Testi:** Yeni misafir eklenip `db.json` dosyasına yazıldığı ve anında arayüze yansıdığı test edilecek.

#### FAZ 4: Ana Tablo, Renk Kuralları ve Hızlı Aksiyonlar
- [ ] Tablo bileşeni: 3 gün kalanlara Kırmızı vurgu, normal misafirler, filtreleme/arama barı.
- [ ] Erken Çıkış (Check-out) butonu ve Çıkış Yapanlar için 3 gün Gri ton kuralı.
- [ ] "Tarih Uzat" butonu (Modal veya inline tarih güncelleme ile anında ciro revizyonu).
- **Faz 4 Testi:** Kalan günü 3 günden az olan test verisi oluşturulup kırmızı yandığı, çıkış yapılanın griye döndüğü kontrol edilecek.

#### FAZ 5: Geçmiş (Arşiv), Otomatik Temizlik ve Veri Yedekleme
- [ ] 72 saat kuralı ile süresi dolanların `db.json` arşiv dizisine taşınması mekanizması.
- [ ] Geçmiş / Arşiv sekmesi (Arama, detaylı görüntüleme).
- [ ] `db.json` JSON dosyasını dışa aktarma (Export) ve içe aktarma (Import) aracı.
- **Faz 5 Testi:** Süresi dolan kaydın arşive düştüğü ve JSON yedeğinin başarıyla indiği test edilecek.