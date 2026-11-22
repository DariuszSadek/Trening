# Trening

Aplikacja webowa (HTML/CSS/JS, offline) z planem FBW 3 dni dla Dariusza Sadka: karty ćwiczeń z animowanymi sylwetkami i opisami, serie z ciężarami liczonymi z planu, przycisk „Zrobione” uruchamiający zegar przerwy (sygnał przed końcem i na koniec), interwały do kondycji, dziennik i kopia danych w pliku.

Adresy:
- tata: **https://dariuszsadek.github.io/Trening/**
- syn nr 1: **https://dariuszsadek.github.io/Trening/syn1/** (zielona ikona „1”)
- syn nr 2: **https://dariuszsadek.github.io/Trening/syn2/** (bordowa ikona „2”)

Każda aplikacja ma własny service worker, własną pamięć podręczną i własny klucz danych (`trening.v1`, `trening.syn1.v1`, `trening.syn2.v1`) – dane jednej nie mieszają się z drugą, a kopii danych z jednej nie da się wczytać do drugiej.

© 2026 Dariusz Sadek. Wszelkie prawa zastrzeżone. To repozytorium nie udziela żadnej licencji.
(Czcionka Libre Baskerville dołączona na licencji SIL Open Font License 1.1 – `assets/fonts/OFL.txt`; licencja dotyczy wyłącznie czcionki.)

## Prywatność
Aplikacja niczego nie wysyła (CSP w `index.html`: tylko własne pliki). Dziennik treningów jest wyłącznie w pamięci Safari na telefonie; kopia – przycisk „Zapisz kopię” w Ustawieniach.

## Struktura
- `js/plan.js` – plan (dni A/B/C, serie, przerwy, % ciężaru), reguły tygodni T1 i T6
- `js/cwiczenia.js` – opisy ćwiczeń i mobilności
- `js/figs.js` + `js/figure.js` – sylwetki (pozycje kluczowe, kinematyka odwrotna, animacja SVG)
- `js/sound.js` – sygnały (Web Audio, planowane z wyprzedzeniem), blokada wygaszania ekranu
- `js/app.js` – ekrany, zapis, zegar, sugestie ciężarów
- `tools/build.py [wersja_taty] [wersja_synów]` – po każdej zmianie: nowe wersje cache we wszystkich service workerach
- `tools/e2e.py` – test w Chromium z ekranem iPhone 15 (393 × 852)
- `synowie/` – wspólny kod aplikacji synów (`app-syn.js`, plan `plan-syn.js`, szablon service workera); `syn1/`, `syn2/` – osobne instancje (index, manifest, ikony, sw.js)
- `tools/e2e_syn.py` – test aplikacji synów
- `tools/gen_synowie.py` – plik .xlsx z planem dla synów (te same opisy i rysunki)
