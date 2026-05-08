# Dokumentacja panelu YouTube Manager

Ten dokument opisuje najważniejsze funkcje aplikacji, skróty, konfigurację oraz aktualny workflow pracy z kanałami, filmami, napisami i analizą AI.

## 1. Uruchomienie lokalne

1. Zainstaluj zależności:

```bash
npm install
```

2. Uruchom tryb developerski:

```bash
npm run dev
```

3. Panel domyślnie działa na porcie skonfigurowanym w `nuxt.config.ts` (aktualnie `3322`).

## 2. Zmienne środowiskowe

Najważniejsze zmienne:

- `PANEL_AUTH_USERNAME`, `PANEL_AUTH_PASSWORD` – logowanie Basic Auth do panelu
- `YOUTUBE_API_KEY` – klucz YouTube API
- `OPENAI_API_KEY` – klucz OpenAI
- `OPENAI_ALLOWED_ASSISTANT_IDS` – whitelist assistantów (lista po przecinku)
- `OPENAI_MAX_TRANSCRIPT_CHARS` – limit długości transkryptu do analizy
- `TURBOSCRIBE_API_BASE`, `TURBOSCRIBE_API_TOKEN` – pobieranie transkrypcji z TurboScribe
- `YOUTUBE_API_DAILY_QUOTA` – dzienny limit quota YouTube (do dashboardu)
- `PUSH_VAPID_SUBJECT`, `PUSH_VAPID_PUBLIC_KEY`, `PUSH_VAPID_PRIVATE_KEY` – konfiguracja Web Push

## 3. UI/UX (styl Search Console Dark)

W aplikacji działa spójny design system oparty o klasy `panel-*`:

- `panel-card`, `panel-card-soft` – karty i kontenery sekcji
- `panel-input` – inputy, selecty, textarea
- `panel-btn-primary`, `panel-btn-secondary` – akcje główne/poboczne
- `panel-table`, `panel-table-sticky` – tabele ze sticky nagłówkami
- `empty-state`, `skeleton-line` – stany pustych danych i ładowania

Dostępny jest przełącznik gęstości tabel:

- `Wygodna` / `Kompaktowa`
- ustawienie jest zapisywane w localStorage (`useUiPrefs`)

## 4. Skróty klawiaturowe

### Globalne

- `Ctrl/Cmd + K` – otwórz / zamknij Command Palette
- `g` + `d` – Dashboard
- `g` + `c` – Channels
- `g` + `v` – Videos
- `g` + `n` – Captions
- `g` + `s` – Settings

### Kontekstowe

- `/` na `Videos` i `Captions` ustawia focus na wyszukiwarce

## 5. Command Palette

Command Palette obsługuje:

- nawigację między widokami
- przełączanie gęstości tabel
- odświeżenie aktualnej strony

Akcje kontekstowe na `/videos`:

- `Videos: Sprawdz nowe filmy`
- `Videos: Reset filtrow`
- `Videos: Pobierz napisy dla zaznaczonych`

## 6. Strony i workflow

## Dashboard (`/`)

- Statystyki kanałów/filmów/AI
- Sekcja quota YouTube API z procentowym wykorzystaniem
- Szacun kosztów API uwzględnia interwały i okna godzinowe kanałów

## Channels (`/channels`)

- Dodawanie/edycja kanału
- Interwał sprawdzania (ms/s/min/h w edycji)
- Opcjonalne okno godzinowe (`check_from_hour`, `check_to_hour`)
- Widok kart/listy + szybkie filtry statusu

## Videos (`/videos`)

- Sprawdzanie nowych filmów
- Rozbudowane filtry (szukaj/kanał/napisy/AI/sortowanie)
- Wybór wielu filmów i akcje batch:
  - pobieranie napisów
  - analiza AI
- Status przycisku „Napisy” (pobieranie/gotowe/błąd)

## Captions (`/captions`)

- Lista filmów z napisami
- Edytor fullscreen
- Zamiana nazw speakerów
- Zapis transkryptu do bazy
- Kopiowanie transkryptu z metadanymi (autor, videoId, timestamps)

## Settings (`/settings`)

- Backup bazy
- Restore bazy z walidacją
- Toggle automatycznego sprawdzania nowych filmów
- Logi operacyjne

## 7. Automatyczne sprawdzanie filmów

Scheduler działa po stronie serwera:

- uruchamiany co minutę
- bierze pod uwagę:
  - aktywność kanału
  - `check_interval`
  - `last_check`
  - okno godzinowe kanału

Ustawienie auto-check jest trwałe (zapisywane w `app_settings`).

## 8. Bezpieczeństwo

- Panel chroniony Basic Auth (`server/middleware/basic-auth.ts`)
- Klucz API kanału nie jest zwracany przez endpointy listujące kanały
- Upload bazy ma limity rozmiaru i walidację rozszerzeń
- Analiza AI ma whitelist assistantów i limit długości transkryptu

## 9. Transkrypcje i AI

- Pobieranie transkryptów odbywa się przez TurboScribe (start + polling statusu)
- Po pobraniu transkrypt jest zapisywany do tabeli `videos.captions`
- Analiza AI korzysta z OpenAI i zapisuje wynik do `videos.response`

## 10. Dodatkowe uwagi

- Lokalny plik roboczy `temp.txt` nie jest częścią aplikacji produkcyjnej.
- Jeśli uruchamiasz build na Coolify i występuje problem z kompilacją `better-sqlite3`, ustaw Node 22 na etapie builda (`NIXPACKS_NODE_VERSION=22`, Buildtime).
