# Trening

Aplikacja webowa (HTML/CSS/JS, offline) z planem FBW 3 dni dla Dariusza Sadka: karty ćwiczeń z animowanymi sylwetkami i opisami, serie z ciężarami liczonymi z planu, przycisk „Zrobione” uruchamiający zegar przerwy (sygnał przed końcem i na koniec), interwały do kondycji, dziennik i kopia danych w pliku.

Adres: **https://dariuszsadek.github.io/Trening/**

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
- `tools/build.py` – po każdej zmianie: nowa wersja cache `sw.js` i `js/version.js`
- `tools/e2e.py` – test w Chromium z ekranem iPhone 15 (393 × 852)
- `tools/gen_synowie.py` – plik .xlsx z planem dla synów (te same opisy i rysunki)
