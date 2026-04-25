# Discipline Panel

Bu proje Next.js + Supabase tabanlı bir alışkanlık takip uygulaması. Frontend deploy'u ile kullanıcı verisini birbirinden ayırmak için kalıcı veri kaynağı olarak Supabase kullanılır; Vercel deploy sadece uygulama kodunu yayınlar.

## Environment Variables

Önce örnek dosyayı kopyala:

```bash
cp .env.local.example .env.local
```

Gerekli değişkenler:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

`NEXT_PUBLIC_SUPABASE_URL` ve `NEXT_PUBLIC_SUPABASE_ANON_KEY` değerlerini Supabase `Project Settings > API` ekranından alabilirsin. `NEXT_PUBLIC_APP_URL` ise production Vercel domain'in olmalı; metadata ve paylaşım linkleri için kullanılır.

## Persistence Audit

Kod tabanına göre veri durumu:

| Veri alanı | Durum | Not |
| --- | --- | --- |
| `auth.users` | Kalıcı / Supabase | Supabase Auth tarafından tutuluyor. |
| `profiles` | Kalıcı / Supabase | `ensureProfileForAuthUser` ile oluşturuluyor, login/discovery akışında kullanılıyor. |
| `habits` | Kalıcı / Supabase | Oluşturma, güncelleme, arşivleme, silme ve streak durumu Supabase üzerinden. |
| `partner_requests` | Kalıcı / Supabase | İstek gönderme/yanıtlama Supabase üzerinden. |
| `partnerships` | Kalıcı / Supabase | Aktif partner ilişkisi Supabase üzerinden. |
| `shared_habits` | Kalıcı / Supabase | Ortak alışkanlık üst kaydı Supabase'te. |
| `shared_habit_members` | Kalıcı / Supabase | Ortak alışkanlık üyelikleri Supabase'te. |
| `shared_habit_logs` | Kalıcı / Supabase | Günlük ortak alışkanlık logları Supabase'te. |
| `weight_profiles` | Kalıcı / Supabase | Bu repo içinde migration ve repository eklendi. |
| `weight_entries` | Kalıcı / Supabase | Bu repo içinde migration ve repository eklendi. |
| `mockHabits`, `mockSocialGraph` | Geçici ama runtime dışı | Repo içinde duruyor ama aktif uygulama akışında kullanılmıyor. |
| Eski kilo localStorage verisi | Geçici / local | Uygulama artık önce Supabase'i kullanır; eski local veri varsa güvenli şekilde import edip yedek anahtara taşır. |

## Weight Migration

Kilo verisini kalıcı hale getiren migration dosyası:

`supabase/migrations/20260424_add_weight_tracking.sql`

Bu migration:

- `weight_profiles` tablosunu oluşturur
- `weight_entries` tablosunu oluşturur
- RLS policy'lerini ekler
- kullanıcı sadece kendi kilo verisini okuyup yazabilir
- mevcut kullanıcı verisine dokunmadan `if not exists` yaklaşımıyla çalışır

Güvenli uygulama sırası:

1. Production veritabanında migration'ı uygula.
2. Vercel'e environment variables ekle.
3. Yeni deploy al.
4. Kullanıcı tekrar giriş yaptığında varsa eski local kilo verisi Supabase'e import edilir.

Bu yaklaşım frontend deploy'u ile veritabanını ayırır; yeni deploy aldığında kullanıcı verisi kaybolmaz.

## Vercel Deploy Checklist

1. Vercel project oluştur ve repo'yu bağla.
2. Root directory olarak bu proje klasörünü seç.
3. Environment variables olarak yukarıdaki 3 değişkeni ekle.
4. Supabase `Authentication > URL Configuration` altında:
   `Site URL` production Vercel URL olsun.
   Preview ve production domain'lerini `Redirect URLs` listesine ekle.
5. Production deploy öncesi lokal doğrulama çalıştır:

```bash
npm run lint
npm run build
```

## Local Development

```bash
npm install
npm run dev
```

## Notes

- Kullanıcı adı ile giriş akışı artık RPC fonksiyonu yoksa doğrudan `profiles` tablosuna fallback yapar.
- Sosyal veri modeli zaten Supabase'e bağlıydı; bu güncelleme kritik eksik parça olan kilo verisini de kalıcı hale getirir.
- Migration'lar non-destructive tutuldu; mevcut production verisini silen agresif bir schema değişikliği yapılmadı.
