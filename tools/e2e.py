import sys, json
from playwright.sync_api import sync_playwright
BASE = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8765/'
OUT = '/tmp/shots/'
errs = []
with sync_playwright() as p:
    b = p.chromium.launch()
    ctx = b.new_context(viewport={'width': 393, 'height': 852}, device_scale_factor=2, is_mobile=True, has_touch=True,
                        user_agent='Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1')
    pg = ctx.new_page()
    pg.on('console', lambda m: errs.append(m.type + ': ' + m.text) if m.type in ('error', 'warning') else None)
    pg.on('pageerror', lambda e: errs.append('PAGEERROR ' + str(e)))
    pg.goto(BASE); pg.wait_for_timeout(500)
    pg.screenshot(path=OUT + '01_home.png')
    pg.click('[data-start="A"]'); pg.wait_for_timeout(600)
    pg.screenshot(path=OUT + '02_workout_top.png')
    # plan TS
    pg.fill('[data-plan="przysiad"]', '100'); pg.wait_for_timeout(200)
    pg.locator('[data-block="0"]').scroll_into_view_if_needed(); pg.wait_for_timeout(300)
    pg.screenshot(path=OUT + '03_squat_card.png')
    pg.click('[data-done="0.0"]'); pg.wait_for_timeout(1200)
    pg.screenshot(path=OUT + '04_after_done.png')
    # TS row done + rpe
    pg.click('[data-done="0.4"]'); pg.wait_for_timeout(300)
    pg.locator('[data-row="0.4"]').scroll_into_view_if_needed()
    pg.click('[data-rpe="8"][data-key="0.4"]'); pg.wait_for_timeout(300)
    pg.screenshot(path=OUT + '05_ts_rpe.png')
    # dialog
    pg.click('.ex-more[data-open="przysiad"]'); pg.wait_for_timeout(900)
    pg.screenshot(path=OUT + '06_dialog.png')
    pg.click('[data-close]'); pg.wait_for_timeout(200)
    # superset card
    pg.locator('[data-block="4"]').scroll_into_view_if_needed(); pg.wait_for_timeout(400)
    pg.screenshot(path=OUT + '07_superset.png')
    # conditioning start
    pg.locator('[data-seq="cond"]').scroll_into_view_if_needed(); pg.click('[data-seq="cond"]'); pg.wait_for_timeout(1500)
    pg.screenshot(path=OUT + '08_cond.png')
    pg.click('[data-t="skip"]')
    # finish
    pg.on('dialog', lambda d: d.accept())
    pg.click('[data-finish]'); pg.wait_for_timeout(600)
    pg.screenshot(path=OUT + '09_history.png')
    pg.goto(BASE + '#/'); pg.wait_for_timeout(300)
    pg.click('[data-start="B"]'); pg.wait_for_timeout(500)
    pg.screenshot(path=OUT + '10_dayB.png', full_page=True)
    st = pg.evaluate("JSON.parse(localStorage.getItem('trening.v1'))")
    print('sessions', len(st['sessions']), 'log keys', list(st['sessions'][0]['log'].keys())[:5], 'plan B', st['current']['plan'])
    b.close()
print('\n'.join(errs) or 'brak błędów konsoli')
