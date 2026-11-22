#!/usr/bin/env python3
"""Plan treningowy dla synów (początkujący, FBW 3×/tydz.) → .xlsx (otwiera się w Numbers).
Opisy ćwiczeń z js/cwiczenia.js (eksport do /tmp/ex.json), rysunki z /tmp/synpng (tools/png_frames.py)."""
import json, math, sys
from openpyxl import Workbook
from openpyxl.drawing.image import Image as XImage
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter
from PIL import Image as PImage

D = json.load(open('/tmp/ex.json'))
EX, MOB = D['EX'], D['MOB']
PNG = '/tmp/synpng'
OUT = sys.argv[1] if len(sys.argv) > 1 else '/tmp/Plan_synowie_FBW.xlsx'

FONT = 'Baskerville'
NAVY = '1F3B5F'
f_txt = Font(name=FONT, size=11)
f_b = Font(name=FONT, size=11, bold=True)
f_h1 = Font(name=FONT, size=16, bold=True, color=NAVY)
f_h2 = Font(name=FONT, size=13, bold=True, color=NAVY)
f_card = Font(name=FONT, size=13, bold=True, color='FFFFFF')
f_small = Font(name=FONT, size=9, italic=True, color='555555')
fill_card = PatternFill('solid', fgColor=NAVY)
fill_lab = PatternFill('solid', fgColor='E9EEF5')
fill_in = PatternFill('solid', fgColor='FFF6CC')
fill_alt = PatternFill('solid', fgColor='F4F2EE')
fill_ex = PatternFill('solid', fgColor='E6F3EA')
thin = Side(style='thin', color='C9C3B8')
box = Border(left=thin, right=thin, top=thin, bottom=thin)
wrap = Alignment(wrap_text=True, vertical='top')
wrapc = Alignment(wrap_text=True, vertical='center', horizontal='center')

PHASES = [
    ('Faza 1 – technika', 'tyg. 1–4', '2 serie × 12–15 powt.', '3–4 powtórzenia w zapasie (RIR 3–4)', '60–90 s'),
    ('Faza 2 – budowa', 'tyg. 5–8', '3 serie × 10–12 powt.', '2–3 powtórzenia w zapasie (RIR 2–3)', '90 s (przysiad, wyciskanie, ściąganie, wiosłowanie, suwnica: 90–120 s)'),
    ('Faza 3 – siła i masa', 'tyg. 9–12', '3 serie × 8–10 powt.', '2 powtórzenia w zapasie (RIR 2)', '2 min ćwiczenia wielostawowe, 90 s pozostałe'),
]

# ćwiczenie: (id, faza1, faza2, faza3, przerwa w fazach, uwaga do progresji)
STD = ('2 × 12–15', '3 × 10–12', '3 × 8–10')
A = [
    ('goblet', *STD, ('60–90 s', '90–120 s', '2 min'), 'Gdy najcięższy dostępny kettlebell/hantel staje się za lekki – przejdźcie na suwnicę albo (pod okiem trenera) na przysiad ze sztangą.'),
    ('wyciskanie_hantli', *STD, ('60–90 s', '90–120 s', '2 min'), None),
    ('sciaganie_drazka', *STD, ('60–90 s', '90–120 s', '2 min'), 'Cel na później: podciąganie na drążku (najpierw z gumą).'),
    ('rdl_hantle', '2 × 12–15', '3 × 10–12', '3 × 10–12', ('60–90 s', '90 s', '90 s'), 'W tym ćwiczeniu zakres zostaje wyższy przez cały plan – priorytetem są proste plecy.'),
    ('uginanie', '2 × 12–15', '2 × 12–15', '3 × 10–12', ('60 s', '60 s', '60–90 s'), None),
    ('plank', '2 × 20–30 s', '3 × 30–40 s', '3 × 40–60 s', ('60 s', '60 s', '60 s'), 'Koniec serii, gdy biodra zaczynają opadać – nawet przed czasem.'),
]
B = [
    ('leg_press', *STD, ('60–90 s', '90–120 s', '2 min'), None),
    ('pompki', '2 × 6–12', '3 × 8–15', '3 × 10–20', ('60–90 s', '90 s', '90 s'), 'Każdą serię kończ 2–3 powtórzenia przed „nie dam rady”. Mniej niż 6 z podłogi → dłonie na ławce. Ponad 20 → stopy na podwyższeniu.'),
    ('wioslowanie_wyciag', *STD, ('60–90 s', '90–120 s', '2 min'), None),
    ('wyciskanie_siedzac', *STD, ('60–90 s', '90 s', '90–120 s'), None),
    ('most_biodrowy', '2 × 12–15 (bez obciążenia)', '3 × 12 (hantel na biodrach)', '3 × 10–12 (cięższy hantel/talerz)', ('60 s', '60–90 s', '90 s'), None),
    ('prostowanie_wyciag', '2 × 12–15', '2 × 12–15', '3 × 10–12', ('60 s', '60 s', '60–90 s'), None),
    ('dead_bug', '2 × 6/stronę', '3 × 8/stronę', '3 × 10/stronę', ('60 s', '60 s', '60 s'), None),
]
FINISH = {
    'A': ('Sprawność na koniec (5–8 min)', 'Rower stacjonarny lub bieżnia: 5 rund – 30 s szybko (oddech mocno przyspiesza, ale da się wydusić krótkie zdanie), 60 s spokojnie.', None),
    'B': ('Sprawność na koniec (5 min)', 'Spacer farmera: 3 × 20 m z dwoma hantlami/kettlebellami, 60–90 s przerwy. Ciężar: taki, żeby przejść cały dystans prosto i bez upuszczenia.', 'farmer'),
}

WARMUP = [
    '5 min rower stacjonarny lub szybki marsz na bieżni – aż zrobi się ciepło.',
    '2 rundy bez przerwy: 10 przysiadów bez obciążenia, 10 krążeń ramion w przód i 10 w tył, 5 wykroków na każdą nogę, 8 pompek z dłońmi na ławce, 10 skłonów-„zawiasów” z rękami na biodrach (biodra w tył, plecy proste).',
    'Przed pierwszym ćwiczeniem siłowym: 1 seria rozgrzewkowa z połową ciężaru × 10 powtórzeń. W kolejnych ćwiczeniach rozgrzewka zwykle nie jest już potrzebna.',
]
CEL_SYN = {'goblet': 'Przysiad z ciężarem trzymanym z przodu: uczy pionowego tułowia i pełnej głębokości. To podstawowy przysiad do nauki techniki – siła całych nóg i pośladków.'}
COOL = ['couch_stretch', 'child_pose', 'hamstring_stretch', 'doorway_pec']


def est_lines(text, width_chars):
    n = 0
    for para in str(text).split('\n'):
        n += max(1, math.ceil(len(para) / max(10, width_chars)))
    return n


def set_h(ws, r, text, width_chars, minh=18):
    ws.row_dimensions[r].height = max(minh, est_lines(text, width_chars) * 15 + 6)


def bullets(lst, num=False):
    return '\n'.join((f'{i}. ' if num else '• ') + x for i, x in enumerate(lst, 1))


def add_img(ws, path, anchor, width_px):
    im = PImage.open(path)
    w, h = im.size
    x = XImage(path)
    x.width = width_px
    x.height = round(h * width_px / w)
    ws.add_image(x, anchor)
    return x.height


# ── arkusz: Plan (zasady) ────────────────────────────────────────────────────
wb = Workbook()
ws = wb.active
ws.title = 'Plan'
ws.sheet_view.showGridLines = False
ws.column_dimensions['A'].width = 26
for c in 'BCDE':
    ws.column_dimensions[c].width = 26
r = 1
ws.cell(r, 1, 'Plan treningowy FBW – synowie (początkujący)').font = f_h1; r += 1
ws.cell(r, 1, 'Cel: sprawność i przyrost masy mięśniowej. 3 treningi w tygodniu, całe ciało na każdym treningu, 12 tygodni.').font = f_txt; r += 2

def para(title, text, merge_to='E', w=125):
    global r
    ws.cell(r, 1, title).font = f_h2; r += 1
    c = ws.cell(r, 1, text); c.font = f_txt; c.alignment = wrap
    ws.merge_cells(f'A{r}:{merge_to}{r}')
    set_h(ws, r, text, w)
    r += 2

para('Bezpieczeństwo – najważniejsze zasady', bullets([
    'Pierwsze tygodnie tylko pod okiem taty albo trenera na siłowni – każda seria. Wytyczne NSCA dla młodzieży wymagają wykwalifikowanego nadzoru, zwłaszcza na początku.',
    'Technika przed ciężarem. Ciężar rośnie dopiero, gdy ruch wygląda dokładnie jak w opisie.',
    'Ból w stawie, kręgosłupie albo ostry ból (inny niż zwykłe zmęczenie i „pieczenie” mięśnia) = przerywamy ćwiczenie i nie wracamy do niego bez konsultacji.',
    'Żadnych serii „do upadku” i prób maksymalnego ciężaru – zawsze zostaje zapas powtórzeń (patrz tabela RIR).',
]))

ws.cell(r, 1, 'Harmonogram tygodnia').font = f_h2; r += 1
t = ('3 dni w tygodniu, nigdy dwa dni pod rząd (np. poniedziałek–środa–piątek). Treningi A i B na zmianę:\n'
     'tydzień 1: A – B – A, tydzień 2: B – A – B, tydzień 3: A – B – A … (w zakładce „Dziennik” kolejność jest już rozpisana).\n'
     'Każdy trening: rozgrzewka 8–10 min → ćwiczenia w podanej kolejności → sprawność 5–8 min → rozciąganie 5 min. Razem ok. 60–70 min.')
c = ws.cell(r, 1, t); c.font = f_txt; c.alignment = wrap; ws.merge_cells(f'A{r}:E{r}'); set_h(ws, r, t, 125); r += 2

ws.cell(r, 1, 'Fazy planu').font = f_h2; r += 1
for j, h in enumerate(['Faza', 'Tygodnie', 'Serie × powtórzenia', 'Zapas powtórzeń', 'Przerwy między seriami']):
    c = ws.cell(r, 1 + j, h); c.font = f_b; c.fill = fill_lab; c.border = box; c.alignment = wrapc
r += 1
for ph in PHASES:
    for j, v in enumerate(ph):
        c = ws.cell(r, 1 + j, v); c.font = f_txt; c.border = box; c.alignment = wrap
    ws.row_dimensions[r].height = 48
    r += 1
c = ws.cell(r, 1, 'Wyjątki (deska, pompki, most biodrowy, dead bug, ćwiczenia na ramiona) mają własne liczby w zakładkach Trening A/B. '
                  'Podstawa: NSCA 2009 – początkujący 1–2 serie × 10–15 powt., 50–70% 1RM, ok. 1 min przerwy; średniozaawansowani 2–3 serie × 8–12 powt., 60–80% 1RM, 1–2 min przerwy; 2–3 treningi w tygodniu w dni nie po sobie.')
c.font = f_small; c.alignment = wrap; ws.merge_cells(f'A{r}:E{r}'); ws.row_dimensions[r].height = 42; r += 2

ws.cell(r, 1, 'Jak zwiększać ciężar').font = f_h2; r += 1
t = bullets([
    'Gdy w KAŻDEJ serii ćwiczenia zrobisz górną granicę powtórzeń (np. 15 przy zakresie 12–15) z dobrą techniką i z zadanym zapasem – na następnym treningu weź najmniejszy możliwy większy ciężar (ok. 5–10% więcej: hantle zwykle +1–2 kg, wyciąg/suwnica +1 płytka).',
    'Po zwiększeniu ciężaru liczba powtórzeń spadnie do dolnej granicy – to normalne. Dobijasz powtórzenia, aż znowu dojdziesz do górnej granicy.',
    'Każdy z was ma swoje ciężary – nie porównujcie się. Zapisujcie każdą serię w zakładce „Dziennik”.',
])
c = ws.cell(r, 1, t); c.font = f_txt; c.alignment = wrap; ws.merge_cells(f'A{r}:E{r}'); set_h(ws, r, t, 125); r += 2

ws.cell(r, 1, 'Zapas powtórzeń (RIR) – jak to ocenić').font = f_h2; r += 1
for j, h in enumerate(['RIR (zapas)', 'Co czujesz pod koniec serii']):
    c = ws.cell(r, 1 + j, h); c.font = f_b; c.fill = fill_lab; c.border = box
ws.merge_cells(f'B{r}:E{r}'); r += 1
for a, b in [('4', 'Lekko. Mógłbyś zrobić jeszcze 4 powtórzenia.'), ('3', 'Średnio. Jeszcze 3 by weszły.'),
             ('2', 'Ciężko, ale ruch nadal równy i czysty. Jeszcze 2 by weszły.'), ('1', 'Bardzo ciężko – jeszcze jedno i koniec. W tym planie tak nie kończymy serii.'),
             ('0', 'Nie dasz rady zrobić ani jednego więcej. W tym planie – nigdy.')]:
    ws.cell(r, 1, a).font = f_b; ws.cell(r, 1).border = box; ws.cell(r, 1).alignment = wrapc
    c = ws.cell(r, 2, b); c.font = f_txt; c.border = box; ws.merge_cells(f'B{r}:E{r}'); r += 1
r += 1

para('Jedzenie i sen – bez tego masy nie będzie', bullets([
    'Mięśnie rosną tylko wtedy, gdy organizm dostaje więcej energii, niż zużywa. Przy bardzo szczupłej sylwetce najczęstszy problem to po prostu za mało jedzenia.',
    'Regularnie: 3 posiłki + 2 przekąski. W każdym posiłku źródło białka (mięso, ryba, jajka, nabiał, rośliny strączkowe) i węglowodanów (pieczywo, kasza, ryż, makaron, ziemniaki, owoce).',
    'Po treningu normalny posiłek (np. obiad) – specjalne odżywki nie są potrzebne.',
    'Sen: zalecenie Amerykańskiej Akademii Medycyny Snu dla nastolatków 13–18 lat to 8–10 godzin na dobę, regularnie.',
    'Suplementy nie są potrzebne. Jeśli masa ciała mimo jedzenia stoi w miejscu przez kilka tygodni – warto pójść do lekarza lub dietetyka.',
    'Mierzcie postępy: masa ciała raz w tygodniu rano, ten sam dzień, przed śniadaniem.',
]))

ws.cell(r, 1, 'Źródła').font = f_h2; r += 1
for s in ['Faigenbaum AD i wsp. Youth resistance training: updated position statement paper from the National Strength and Conditioning Association. J Strength Cond Res 2009;23(5 Suppl):S60–S79 (tab. 1–2).',
          'Lloyd RS i wsp. Position statement on youth resistance training: the 2014 International Consensus. Br J Sports Med 2014;48(7):498–505.',
          'Paruthi S i wsp. Recommended amount of sleep for pediatric populations: AASM consensus statement. J Clin Sleep Med 2016;12(6):785–786.']:
    c = ws.cell(r, 1, s); c.font = f_small; c.alignment = wrap; ws.merge_cells(f'A{r}:E{r}'); ws.row_dimensions[r].height = 28; r += 1
ws.page_setup.orientation = 'portrait'; ws.page_setup.fitToWidth = 1; ws.page_setup.fitToHeight = 0
ws.sheet_properties.pageSetUpPr.fitToPage = True


# ── arkusze: Trening A / B ───────────────────────────────────────────────────
def training_sheet(name, items, fin):
    ws = wb.create_sheet(name)
    ws.sheet_view.showGridLines = False
    ws.column_dimensions['A'].width = 22
    ws.column_dimensions['B'].width = 78
    W = 76
    r = 1
    ws.cell(r, 1, f'{name} – ćwiczenia w tej kolejności').font = f_h1; r += 1
    ws.cell(r, 1, 'Najpierw rozgrzewka (zakładka „Rozgrzewka i rozciąganie”). Rysunek: lewa klatka = pozycja startowa, prawa = końcowa; ciemne kończyny = bliższa strona ciała.').font = f_small
    ws.merge_cells(f'A{r}:B{r}'); r += 2
    for i, (eid, f1, f2, f3, rest, note) in enumerate(items, 1):
        e = EX[eid]
        c = ws.cell(r, 1, f'{i}. {e["name"]}'); c.font = f_card; c.fill = fill_card; c.alignment = Alignment(vertical='center')
        ws.cell(r, 2).fill = fill_card
        ws.merge_cells(f'A{r}:B{r}'); ws.row_dimensions[r].height = 24; r += 1
        hpx = add_img(ws, f'{PNG}/{e["fig"]}.png', f'A{r}', 470)
        ws.merge_cells(f'A{r}:B{r}'); ws.row_dimensions[r].height = hpx * 0.75 + 8; r += 1
        rows = [
            ('Serie × powtórzenia', f'Faza 1 (tyg. 1–4): {f1}\nFaza 2 (tyg. 5–8): {f2}\nFaza 3 (tyg. 9–12): {f3}'),
            ('Przerwa po serii', f'Faza 1: {rest[0]}   ·   Faza 2: {rest[1]}   ·   Faza 3: {rest[2]}'),
            ('Tempo', e.get('tempo', '')),
            ('Po co to ćwiczenie', CEL_SYN.get(eid, e['cel'])),
            ('Sprzęt', e.get('sprzet', '')),
            ('Ustawienie', bullets(e['ustawienie'])),
            ('Wykonanie', bullets(e['wykonanie'], num=True)),
            ('Oddech', e.get('oddech') or 'Wdech i napięcie brzucha przed fazą opuszczania, wydech po minięciu najtrudniejszego punktu ruchu.'),
            ('Najczęstsze błędy', bullets(e['bledy'])),
        ]
        if e.get('uwagi'):
            rows.append(('Uwagi', e['uwagi']))
        if note:
            rows.append(('Progresja / wskazówka', note))
        for lab, txt in rows:
            a = ws.cell(r, 1, lab); a.font = f_b; a.fill = fill_lab; a.alignment = wrap; a.border = box
            b = ws.cell(r, 2, txt); b.font = f_txt; b.alignment = wrap; b.border = box
            set_h(ws, r, txt, W)
            r += 1
        r += 1
    # sprawność
    t, txt, fig = fin
    c = ws.cell(r, 1, t); c.font = f_card; c.fill = fill_card; ws.cell(r, 2).fill = fill_card
    ws.merge_cells(f'A{r}:B{r}'); ws.row_dimensions[r].height = 24; r += 1
    if fig:
        hpx = add_img(ws, f'{PNG}/{fig}.png', f'A{r}', 470); ws.merge_cells(f'A{r}:B{r}'); ws.row_dimensions[r].height = hpx * 0.75 + 8; r += 1
        e = EX[fig]
        for lab, tx in [('Jak', txt), ('Wykonanie', bullets(e['wykonanie'], num=True)), ('Najczęstsze błędy', bullets(e['bledy']))]:
            a = ws.cell(r, 1, lab); a.font = f_b; a.fill = fill_lab; a.alignment = wrap; a.border = box
            b = ws.cell(r, 2, tx); b.font = f_txt; b.alignment = wrap; b.border = box; set_h(ws, r, tx, W); r += 1
    else:
        a = ws.cell(r, 1, 'Jak'); a.font = f_b; a.fill = fill_lab; a.alignment = wrap; a.border = box
        b = ws.cell(r, 2, txt); b.font = f_txt; b.alignment = wrap; b.border = box; set_h(ws, r, txt, W); r += 1
    r += 1
    c = ws.cell(r, 1, 'Na koniec: rozciąganie 5 min (zakładka „Rozgrzewka i rozciąganie”).'); c.font = f_small
    ws.print_options.horizontalCentered = True
    ws.page_setup.orientation = 'portrait'; ws.page_setup.fitToWidth = 1; ws.page_setup.fitToHeight = 0
    ws.sheet_properties.pageSetUpPr.fitToPage = True


training_sheet('Trening A', A, FINISH['A'])
training_sheet('Trening B', B, FINISH['B'])

# ── arkusz: rozgrzewka i rozciąganie ─────────────────────────────────────────
ws = wb.create_sheet('Rozgrzewka i rozciąganie')
ws.sheet_view.showGridLines = False
ws.column_dimensions['A'].width = 22; ws.column_dimensions['B'].width = 78
r = 1
ws.cell(r, 1, 'Rozgrzewka (8–10 min) – przed każdym treningiem').font = f_h1; r += 2
for i, t in enumerate(WARMUP, 1):
    a = ws.cell(r, 1, f'Krok {i}'); a.font = f_b; a.fill = fill_lab; a.border = box; a.alignment = wrap
    b = ws.cell(r, 2, t); b.font = f_txt; b.alignment = wrap; b.border = box; set_h(ws, r, t, 76); r += 1
r += 1
ws.cell(r, 1, 'Rozciąganie (5 min) – po każdym treningu').font = f_h1; r += 1
ws.cell(r, 1, 'Każde ćwiczenie 30 s (na każdą stronę, jeśli dotyczy). Rozciąganie ma być wyraźne, ale bez bólu.').font = f_small; ws.merge_cells(f'A{r}:B{r}'); r += 2
for mid in COOL:
    m = MOB[mid]
    c = ws.cell(r, 1, m['name']); c.font = f_card; c.fill = fill_card; ws.cell(r, 2).fill = fill_card
    ws.merge_cells(f'A{r}:B{r}'); ws.row_dimensions[r].height = 22; r += 1
    if m.get('fig'):
        hpx = add_img(ws, f'{PNG}/{m["fig"]}.png', f'A{r}', 430); ws.merge_cells(f'A{r}:B{r}'); ws.row_dimensions[r].height = hpx * 0.75 + 8; r += 1
    a = ws.cell(r, 1, 'Jak'); a.font = f_b; a.fill = fill_lab; a.border = box; a.alignment = wrap
    b = ws.cell(r, 2, m['opis'] + ' Czas: 30 s' + ('/stronę.' if m.get('sides') == 2 else '.')); b.font = f_txt; b.alignment = wrap; b.border = box
    set_h(ws, r, b.value, 76); r += 2

# ── arkusz: dziennik ────────────────────────────────────────────────────────
ws = wb.create_sheet('Dziennik')
ws.sheet_view.showGridLines = False
widths = [7, 8, 7, 11, 30, 16] + [10] * 6 + [24]
for i, w in enumerate(widths, 1):
    ws.column_dimensions[get_column_letter(i)].width = w
ws.cell(1, 1, 'Dziennik treningów – wpisujcie każdą serię').font = f_h1
leg = ('Legenda: żółte pola wypełniacie sami. W polu serii wpisz ciężar × powtórzenia, np. „12×12” (12 kg, 12 powtórzeń); '
       'przy desce czas, np. „30 s”; przy pompkach same powtórzenia, np. „10”. W wierszach „Syn 1” / „Syn 2” (wiersz 4) wpiszcie swoje imiona. '
       'Wiersz zielony to przykład wypełnienia.')
c = ws.cell(2, 1, leg); c.font = f_small; c.alignment = wrap; ws.merge_cells('A2:M2'); ws.row_dimensions[2].height = 44
hdr = ['Tydz.', 'Sesja', 'Trening', 'Data', 'Ćwiczenie', 'Cel (faza)']
for j, h in enumerate(hdr, 1):
    c = ws.cell(4, j, h); c.font = f_b; c.fill = fill_lab; c.border = box; c.alignment = wrapc
    ws.merge_cells(start_row=4, start_column=j, end_row=5, end_column=j)
for k, nm in enumerate(['Syn 1', 'Syn 2']):
    col = 7 + 3 * k
    c = ws.cell(4, col, nm); c.font = f_b; c.fill = fill_in; c.border = box; c.alignment = wrapc
    ws.merge_cells(start_row=4, start_column=col, end_row=4, end_column=col + 2)
    for s in range(3):
        c = ws.cell(5, col + s, f'Seria {s + 1}'); c.font = f_b; c.fill = fill_lab; c.border = box; c.alignment = wrapc
c = ws.cell(4, 13, 'Uwagi (technika, samopoczucie)'); c.font = f_b; c.fill = fill_lab; c.border = box; c.alignment = wrapc
ws.merge_cells('M4:M5')
ws.freeze_panes = 'A6'
r = 6
# przykład
ex_row = [1, 1, 'A', '01.12', EX['goblet']['name'], '2 × 12–15', '12×15', '12×14', '', '10×15', '10×15', '', 'Przykład wypełnienia']
for j, v in enumerate(ex_row, 1):
    c = ws.cell(r, j, v); c.font = f_txt; c.fill = fill_ex; c.border = box; c.alignment = wrap
r += 1
for w in range(1, 13):
    ph = 0 if w <= 4 else (1 if w <= 8 else 2)
    for s in range(1, 4):
        k = (w - 1) * 3 + (s - 1)
        day = 'A' if k % 2 == 0 else 'B'
        items = A if day == 'A' else B
        shade = fill_alt if k % 2 else None
        for i, it in enumerate(items):
            vals = [w, s, day, '', EX[it[0]]['name'], it[1 + ph]]
            for j, v in enumerate(vals, 1):
                c = ws.cell(r, j, v if (i == 0 or j >= 5) else (v if j in (1, 2, 3) else '')); c.font = f_txt; c.border = box; c.alignment = wrap
                if shade: c.fill = shade
            ws.cell(r, 4).fill = fill_in
            for j in range(7, 14):
                c = ws.cell(r, j, ''); c.fill = fill_in; c.border = box; c.font = f_txt
            r += 1
ws.page_setup.orientation = 'landscape'; ws.page_setup.fitToWidth = 1; ws.page_setup.fitToHeight = 0
ws.sheet_properties.pageSetUpPr.fitToPage = True

wb.save(OUT)
print('zapisano', OUT)
