#!/usr/bin/env python3
"""Po każdej zmianie plików: nowe wersje cache w sw.js (tata) i brunon/sw.js, tymon/sw.js (synowie).
Użycie: python3 tools/build.py [wersja_taty] [wersja_synów]"""
import hashlib, json, os, re, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def files_in(*dirs):
    out = []
    for d in dirs:
        for base, _, files in os.walk(os.path.join(ROOT, d)):
            for f in sorted(files):
                if not f.startswith('.'):
                    out.append(os.path.relpath(os.path.join(base, f), ROOT).replace(os.sep, '/'))
    return out

def set_version(vf, ver):
    cur = re.search(r"VERSION = '([^']+)'", open(vf).read()).group(1)
    ver = ver or cur
    open(vf, 'w').write(f"/*BUILD:BEGIN*/\nexport const VERSION = '{ver}';\n/*BUILD:END*/\n")
    return ver

def digest(paths):
    h = hashlib.sha256()
    for p in paths:
        h.update(p.encode()); h.update(open(os.path.join(ROOT, p), 'rb').read())
    return h.hexdigest()[:10]

def write_sw(path, src, block):
    s = open(src).read()
    s = re.sub(r"/\*BUILD:BEGIN\*/.*?/\*BUILD:END\*/", block, s, flags=re.S)
    open(path, 'w').write(s)

# ── tata ──
vt = set_version(os.path.join(ROOT, 'js', 'version.js'), sys.argv[1] if len(sys.argv) > 1 else None)
dad = sorted(set(['index.html', 'manifest.webmanifest'] + files_in('css', 'js', 'assets')))
cache = f"trening-{vt}-{digest(dad)}"
write_sw(os.path.join(ROOT, 'sw.js'), os.path.join(ROOT, 'sw.js'),
         "/*BUILD:BEGIN*/\nconst CACHE = '%s';\nconst ASSETS = %s;\n/*BUILD:END*/" % (cache, json.dumps(['./'] + dad, ensure_ascii=False)))
print('tata:', cache, len(dad) + 1, 'plików')

# ── synowie ──
vs = set_version(os.path.join(ROOT, 'synowie', 'version.js'), sys.argv[2] if len(sys.argv) > 2 else None)
shared = ['css/app.css', 'synowie/syn.css', 'synowie/app-syn.js', 'synowie/plan-syn.js', 'synowie/version.js',
          'js/cwiczenia.js', 'js/figs.js', 'js/figure.js', 'js/sound.js'] + files_in('assets/fonts')
for n in ('brunon', 'tymon'):
    own = [f'{n}/{f}' for f in ('index.html', 'manifest.webmanifest', 'icon-180.png', 'icon-192.png', 'icon-512.png')]
    allp = own + shared
    cache = f"{n}-{vs}-{digest(allp + ['synowie/sw-template.js'])}"
    rel = ['./'] + [p[len(n) + 1:] for p in own] + ['../' + p for p in shared]
    write_sw(os.path.join(ROOT, n, 'sw.js'), os.path.join(ROOT, 'synowie', 'sw-template.js'),
             "/*BUILD:BEGIN*/\nconst CACHE = '%s';\nconst PREFIX = '%s-';\nconst ASSETS = %s;\n/*BUILD:END*/" % (cache, n, json.dumps(rel, ensure_ascii=False)))
    print(f'{n}:', cache, len(rel), 'plików')
