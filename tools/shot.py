import sys, subprocess, time, os
from playwright.sync_api import sync_playwright
url = sys.argv[1]; out = sys.argv[2]; w = int(sys.argv[3]) if len(sys.argv)>3 else 1200
with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={'width': w, 'height': 800})
    msgs=[]
    pg.on('console', lambda m: msgs.append(m.text))
    pg.on('pageerror', lambda e: msgs.append('ERR '+str(e)))
    pg.goto(url); pg.wait_for_timeout(600)
    pg.screenshot(path=out, full_page=True)
    print('\n'.join(msgs[:20]))
    b.close()
