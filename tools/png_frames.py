import sys, os
from playwright.sync_api import sync_playwright
ids = sys.argv[1].split(','); out = sys.argv[2]
os.makedirs(out, exist_ok=True)
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 900, 'height': 600}, device_scale_factor=2)
    pg.goto('http://localhost:8765/tools/frames.html?ids=' + ','.join(ids)); pg.wait_for_timeout(500)
    for i in ids:
        el = pg.query_selector('#f-' + i)
        if el: el.screenshot(path=f'{out}/{i}.png')
    b.close()
print('ok')
