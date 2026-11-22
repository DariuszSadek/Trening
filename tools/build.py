#!/usr/bin/env python3
"""Po każdej zmianie plików: nowa wersja cache w sw.js i js/version.js (lista plików aplikacji)."""
import hashlib, json, os, re, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VERSION = sys.argv[1] if len(sys.argv) > 1 else None
INCLUDE = ['index.html', 'manifest.webmanifest']
for d in ['css', 'js', 'assets']:
    for base, _, files in os.walk(os.path.join(ROOT, d)):
        for f in sorted(files):
            if f.startswith('.'):
                continue
            INCLUDE.append(os.path.relpath(os.path.join(base, f), ROOT).replace(os.sep, '/'))
INCLUDE = sorted(set(INCLUDE))
vf = os.path.join(ROOT, 'js', 'version.js')
cur = re.search(r"VERSION = '([^']+)'", open(vf).read()).group(1)
ver = VERSION or cur
open(vf, 'w').write(f"/*BUILD:BEGIN*/\nexport const VERSION = '{ver}';\n/*BUILD:END*/\n")
h = hashlib.sha256()
for p in INCLUDE:
    h.update(p.encode()); h.update(open(os.path.join(ROOT, p), 'rb').read())
cache = f"trening-{ver}-{h.hexdigest()[:10]}"
assets = ['./'] + INCLUDE
sw = os.path.join(ROOT, 'sw.js')
s = open(sw).read()
s = re.sub(r"/\*BUILD:BEGIN\*/.*?/\*BUILD:END\*/", "/*BUILD:BEGIN*/\nconst CACHE = '%s';\nconst ASSETS = %s;\n/*BUILD:END*/" % (cache, json.dumps(assets, ensure_ascii=False)), s, flags=re.S)
open(sw, 'w').write(s)
print(cache, len(assets), 'plików')
