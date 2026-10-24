#!/usr/bin/env python3
"""Instala APENAS NO COMPUTADOR DO USUÁRIO a sua própria cópia Jersey M54.

Uso:
  python tools/instalar-fonte-local.py "Jersey M54.ttf"
  python tools/instalar-fonte-local.py "Jersey-M54.zip"

Licença: autor proíbe hospedar a fonte na Internet fora dos portais autorizados.
Não publique assets/fonts/JerseyM54.ttf em seu domínio nem compartilhe o site
com o arquivo incluído sem autorização expressa do titular dos direitos.
"""
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def main():
    if len(sys.argv) != 2:
        raise SystemExit('Uso: python tools/instalar-fonte-local.py "Jersey M54.ttf"')
    src = Path(sys.argv[1])
    if not src.is_file():
        raise SystemExit(f'Arquivo não encontrado: {src}')
    if src.suffix.lower() == '.zip':
        with zipfile.ZipFile(src) as archive:
            matches = [item for item in archive.infolist()
                       if Path(item.filename).name.casefold().replace(' ', '') == 'jerseym54.ttf'
                       and not item.is_dir() and 1000 < item.file_size < 2_000_000]
            if len(matches) != 1:
                raise SystemExit('O ZIP precisa conter uma cópia válida de Jersey M54.ttf.')
            data = archive.read(matches[0])
    elif src.suffix.lower() == '.ttf' and 1000 < src.stat().st_size < 2_000_000:
        data = src.read_bytes()
    else:
        raise SystemExit('Aceita somente Jersey M54.ttf ou ZIP original contendo Jersey M54.ttf.')
    if data[:4] not in (b'\x00\x01\x00\x00', b'OTTO'):
        raise SystemExit('Arquivo TTF inválido.')
    dest = ROOT / 'assets' / 'fonts' / 'JerseyM54.ttf'
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_bytes(data)
    print(f'Instalada para testes LOCAIS: {dest.relative_to(ROOT)}')
    print('IMPORTANTE: remova este arquivo antes de hospedar/publicar o site.')


if __name__ == '__main__':
    main()
