# GK Regency — Otel Yönetim & Ciro Takip Sistemi (PMS)

Yerel çalışan, dosya tabanlı (`data/db.json`) otel konaklama ve ciro takip sistemi.

## Teknolojiler
- **Frontend:** React (Vite) + Tailwind CSS + Lucide React
- **Backend:** Node.js + Express (`server.js`)
- **Depolama:** `data/db.json`

## Çalıştırma
```bash
npm install
npm run dev
```
Bu komut `concurrently` ile hem Express API'yi (`http://localhost:5001`) hem de Vite geliştirme sunucusunu (`http://localhost:5173`) aynı anda başlatır. Frontend, `/api/*` isteklerini Vite proxy üzerinden backend'e yönlendirir.

## API Uç Noktaları
| Metod | Yol | Açıklama |
|---|---|---|
| GET | `/api/guests` | Aktif + çıkış yapmış (arşivlenmemiş) misafirler |
| POST | `/api/guests` | Yeni misafir kaydı oluşturur |
| GET | `/api/guests/:id` | Tek misafir detayı |
| PUT | `/api/guests/:id` | Misafir bilgisi günceller (fiyat alanları yeniden senkronize edilir) |
| DELETE | `/api/guests/:id` | Misafir kaydını siler |
| POST | `/api/guests/:id/checkout` | Çıkış işlemi yapar, erken çıkış fiyat revizyonu önerir |
| POST | `/api/guests/:id/extend` | Çıkış tarihini uzatır, tutarı yeniden hesaplar |
| GET | `/api/archive` | Arşivlenmiş (72 saat kuralı dolmuş) kayıtlar, `?q=` ile arama |
| GET | `/api/stats` | Dashboard istatistikleri |
| GET | `/api/export` | `db.json`'ı indirilebilir yedek olarak döner |
| POST | `/api/import` | Yüklenen bir yedeği doğrulayıp `db.json`'ın üzerine yazar |

## Sayfalar
- `/` — Kontrol Paneli + Aktif Misafirler tablosu (renk kuralları, Tarih Uzat / Erken Çıkış aksiyonları)
- `/arsiv` — Arşiv (arama, satır detay görünümü); üstteki bar Dışa Aktar / İçe Aktar araçlarını içerir

## Veri Kuralları
İş mantığı kuralları için proje kökündeki `CLAUDE.md` dosyasına bakınız.
