# Test progresji: TS RPE 7 → +5 kg (przysiad), RPE 8 → +2,5; ćwiczenie pomocnicze: wszystkie serie na górze zakresu → +krok
from playwright.sync_api import sync_playwright
BASE = 'http://localhost:8765/'
res = []
with sync_playwright() as p:
    b = p.chromium.launch(); ctx = b.new_context(viewport={'width': 393, 'height': 852}, is_mobile=True, has_touch=True)
    pg = ctx.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('dialog', lambda d: d.accept())
    def session(day, ts_kg=None, ts_rpe=None, work=None):
        pg.goto(BASE + '#/'); pg.wait_for_timeout(200)
        pg.click(f'[data-start="{day}"]'); pg.wait_for_timeout(300)
        plan = pg.evaluate("JSON.parse(localStorage.getItem('trening.v1')).current.plan")
        if ts_kg is not None:
            ex = {'A': 'przysiad', 'B': 'martwy', 'C': 'wyciskanie_lezac'}[day]
            pg.fill(f'[data-plan="{ex}"]', str(ts_kg)); pg.wait_for_timeout(100)
            # TS = wiersz z klasą k-TS
            key = pg.get_attribute('.set.k-TS', 'data-row')
            pg.click(f'[data-done="{key}"]'); pg.wait_for_timeout(100)
            pg.click(f'[data-rpe="{ts_rpe}"][data-key="{key}"]'); pg.wait_for_timeout(100)
        if work:
            ex, kg, reps = work
            pg.fill(f'[data-plan="{ex}"]', str(kg))
            card = pg.locator(f'.card:has([data-plan="{ex}"])')
            rows = card.locator('.set.k-W')
            for i in range(rows.count()):
                r = rows.nth(i); key = r.get_attribute('data-row')
                pg.fill(f'[data-k="reps"][data-key="{key}"]', str(reps)); pg.click(f'[data-done="{key}"]'); pg.wait_for_timeout(50)
        pg.click('[data-t="skip"]') if pg.is_visible('#timer') else None
        pg.click('[data-finish]'); pg.wait_for_timeout(200)
        return plan
    session('A', 100, 7, ('wyciskanie_skos', 24, 10))
    session('B', 140, 8)
    session('C', 80, 8)
    planA2 = session('A', 105, 8, ('wyciskanie_skos', 26, 9))
    planB2 = session('B', 142.5, 8)
    planC2 = session('C', 82.5, 9.5)
    planA3 = session('A')
    st = pg.evaluate("JSON.parse(localStorage.getItem('trening.v1'))")
    res.append(('A2 przysiad (oczek. 105 po RPE 7)', planA2.get('przysiad')))
    res.append(('A2 skos (oczek. 26 po 3×10)', planA2.get('wyciskanie_skos')))
    res.append(('B2 martwy (oczek. 142,5 po RPE 8)', planB2.get('martwy')))
    res.append(('C2 wyciskanie (oczek. 82,5 po RPE 8)', planC2.get('wyciskanie_lezac')))
    res.append(('A3 przysiad (oczek. 107,5 po RPE 8)', planA3.get('przysiad')))
    res.append(('A3 skos (oczek. 26 – nie wszystkie 10)', planA3.get('wyciskanie_skos')))
    res.append(('tydzień bieżącej sesji A3 (oczek. 3)', st['sessions'][-1]['week']))
    # C3 po RPE 9.5 → 80
    b.close()
for r in res: print(r)
print(errs or 'brak błędów')
