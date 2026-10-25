#!/usr/bin/env python3
"""Import trophies the developer has rights to use from an FM trophy pack.

Usage:
  python tools/import-fm-trophies.py ~/Downloads/trophies.zip --map tools/fm-trophy-ids.json
  python tools/import-fm-trophies.py ~/Downloads/trophies/ --map tools/fm-trophy-ids.json

Mapping JSON: {"Copa do Brasil": "123456", "UEFA Champions League": "98765"}
Keys are game competition names; values are FM numeric image IDs or relative PNG filenames.
This tool never downloads copyrighted assets and never assumes a legal permission.
"""
import argparse
import json
import re
import shutil
import zipfile
from pathlib import Path
from collections import defaultdict

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'assets/trophies/fm'
OUTPUT_JS = ROOT / 'js/fm-trophy-map.js'
VALID_EXT = ('.png','.webp')

def file_list(source):
    if source.is_dir():
        yield from ((p.relative_to(source).as_posix(), p.read_bytes()) for p in source.rglob('*') if p.is_file() and p.suffix.lower() in VALID_EXT)
    elif zipfile.is_zipfile(source):
        with zipfile.ZipFile(source) as z:
            for n in z.namelist():
                if n.lower().endswith(VALID_EXT) and not n.endswith('/'):
                    yield n, z.read(n)
    else: raise ValueError('Informe uma pasta ou ZIP válido do megapack.')

def main():
    p=argparse.ArgumentParser(description='Importar troféus de um pack FM disponível legalmente.')
    p.add_argument('source',type=Path)
    p.add_argument('--map', type=Path, default=ROOT/'tools/fm-trophy-ids.json')
    args=p.parse_args()
    mapping=json.loads(args.map.read_text(encoding='utf8'))
    if not isinstance(mapping,dict): raise ValueError('O mapa precisa ser um objeto JSON nome: id')
    # Store only requested images in repository; no full-pack import.
    requested={str(v).strip().lower() for v in mapping.values() if str(v).strip()}
    matches=defaultdict(list)
    for name,data in file_list(args.source):
        basename=Path(name).name.lower()
        stem=Path(basename).stem
        rel=name.replace('\\','/').lower()
        for identity in requested:
            if basename==identity or stem==identity or rel.endswith('/'+identity):
                matches[identity].append((name,data))
    OUT.mkdir(parents=True,exist_ok=True)
    resolved={};missing=[];ambiguous=[]
    for competition,identity in mapping.items():
        identity=str(identity).strip().lower()
        if not identity: missing.append(competition);continue
        pool=matches.get(identity,[])
        if len(pool)!=1:
            (ambiguous if len(pool)>1 else missing).append(competition)
            continue
        original,contents=pool[0]
        if not contents or len(contents)>8_000_000: ambiguous.append(competition);continue
        ext=Path(original).suffix.lower()
        slug=re.sub(r'[^a-z0-9-]+','-',competition.casefold().encode('ascii','ignore').decode()).strip('-')
        if not slug: slug='trofeu'
        filename=f'{slug}-{re.sub(r"[^a-z0-9]", "", identity)[:24]}{ext}'
        (OUT/filename).write_bytes(contents)
        resolved[competition]=f'assets/trophies/fm/{filename}'
        resolved[competition.lower()]=resolved[competition]
    OUTPUT_JS.write_text('/* Acervo importado do pack FM fornecido pelo titular. */\nwindow.BTL_FM_TROPHIES = '+json.dumps(resolved,ensure_ascii=False,indent=2)+';\n',encoding='utf8')
    print(json.dumps({'competitions_imported':len(resolved)//2,'missing':missing,'ambiguous':ambiguous,'output':str(OUTPUT_JS)},ensure_ascii=False,indent=2))

if __name__=='__main__': main()
