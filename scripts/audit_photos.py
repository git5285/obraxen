#!/usr/bin/env python3
"""Audita lotes de fotos sin modificar los originales.

Genera métricas JSON y hojas de contacto para revisión humana. Está pensado para
material de obra: la calidad técnica ordena candidatos, pero nunca sustituye la
comprobación visual del contenido y la secuencia antes/durante/después.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import math
from collections import defaultdict
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageOps, ImageStat


IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".heic"}
THUMBNAIL_SIZE = (224, 168)
CONTACT_COLUMNS = 5
CONTACT_ROWS = 5
CONTACT_MARGIN = 18
LABEL_HEIGHT = 52


def dhash(image: Image.Image, hash_size: int = 8) -> str:
    gray = image.convert("L").resize((hash_size + 1, hash_size), Image.Resampling.LANCZOS)
    pixels = np.asarray(gray, dtype=np.int16)
    bits = pixels[:, 1:] > pixels[:, :-1]
    value = 0
    for bit in bits.flatten():
        value = (value << 1) | int(bit)
    return f"{value:0{hash_size * hash_size // 4}x}"


def hamming(left: str, right: str) -> int:
    return (int(left, 16) ^ int(right, 16)).bit_count()


def sharpness_score(gray: np.ndarray) -> float:
    # Varianza de un Laplaciano discreto, suficiente para ordenar un mismo lote.
    small = gray.astype(np.float32)
    lap = (
        -4 * small[1:-1, 1:-1]
        + small[:-2, 1:-1]
        + small[2:, 1:-1]
        + small[1:-1, :-2]
        + small[1:-1, 2:]
    )
    return float(np.var(lap))


def extract_exif(image: Image.Image) -> dict:
    exif = image.getexif()
    gps = exif.get_ifd(0x8825) if 0x8825 in exif else {}
    return {
        "date_time_original": str(exif.get(36867, "")) or None,
        "camera_make": str(exif.get(271, "")) or None,
        "camera_model": str(exif.get(272, "")) or None,
        "orientation": exif.get(274),
        "gps_present": bool(gps),
    }


def analyse_image(path: Path, root: Path) -> dict:
    with Image.open(path) as source:
        exif = extract_exif(source)
        oriented = ImageOps.exif_transpose(source).convert("RGB")
        width, height = oriented.size
        preview = oriented.copy()
        preview.thumbnail((960, 960), Image.Resampling.LANCZOS)
        gray_image = preview.convert("L")
        gray = np.asarray(gray_image, dtype=np.uint8)
        stats = ImageStat.Stat(gray_image)
        luminance = float(stats.mean[0])
        contrast = float(stats.stddev[0])
        sharpness = sharpness_score(gray)
        black_clip = float(np.mean(gray <= 5))
        white_clip = float(np.mean(gray >= 250))
        relative = path.relative_to(root)
        flags = []
        if min(width, height) < 1080:
            flags.append("resolucion_baja")
        if luminance < 52:
            flags.append("oscura")
        elif luminance > 210:
            flags.append("sobreexpuesta")
        if contrast < 28:
            flags.append("contraste_bajo")
        if black_clip > 0.18:
            flags.append("sombras_recortadas")
        if white_clip > 0.12:
            flags.append("luces_recortadas")
        if sharpness < 45:
            flags.append("posible_desenfoque")
        if exif["gps_present"]:
            flags.append("gps_exif")
        aspect = width / height if height else 0
        technical_score = (
            min(max(width, height) / 4000, 1) * 18
            + max(0, 28 - abs(luminance - 125) / 4)
            + min(contrast / 2.5, 18)
            + min(math.log1p(max(sharpness, 0)) * 4, 25)
            + (11 if 1.2 <= aspect <= 2.0 else 4)
            - len(flags) * 4
        )
        return {
            "case": relative.parts[0],
            "path": str(path),
            "relative_path": str(relative),
            "filename": path.name,
            "bytes": path.stat().st_size,
            "width": width,
            "height": height,
            "aspect": round(aspect, 3),
            "orientation": "horizontal" if aspect > 1.08 else "vertical" if aspect < 0.92 else "cuadrada",
            "luminance": round(luminance, 2),
            "contrast": round(contrast, 2),
            "sharpness": round(sharpness, 2),
            "black_clip": round(black_clip, 4),
            "white_clip": round(white_clip, 4),
            "dhash": dhash(preview),
            "sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
            "technical_score": round(technical_score, 2),
            "flags": flags,
            "exif": exif,
        }


def duplicate_groups(records: list[dict]) -> list[list[int]]:
    # Une copias exactas y encuadres casi idénticos (distancia dHash <= 3).
    parent = list(range(len(records)))

    def find(value: int) -> int:
        while parent[value] != value:
            parent[value] = parent[parent[value]]
            value = parent[value]
        return value

    def union(left: int, right: int) -> None:
        left_root, right_root = find(left), find(right)
        if left_root != right_root:
            parent[right_root] = left_root

    exact: dict[str, int] = {}
    for index, record in enumerate(records):
        if record["sha256"] in exact:
            union(index, exact[record["sha256"]])
        else:
            exact[record["sha256"]] = index
    for left in range(len(records)):
        for right in range(left + 1, len(records)):
            if records[left]["case"] != records[right]["case"]:
                continue
            if hamming(records[left]["dhash"], records[right]["dhash"]) <= 3:
                union(left, right)
    grouped: dict[int, list[int]] = defaultdict(list)
    for index in range(len(records)):
        grouped[find(index)].append(index)
    return [indices for indices in grouped.values() if len(indices) > 1]


def make_contact_sheets(records: list[dict], output: Path) -> list[str]:
    output.mkdir(parents=True, exist_ok=True)
    font = ImageFont.load_default(size=13)
    small_font = ImageFont.load_default(size=11)
    files = []
    per_sheet = CONTACT_COLUMNS * CONTACT_ROWS
    for case in sorted({record["case"] for record in records}):
        case_records = sorted(
            (record for record in records if record["case"] == case),
            key=lambda record: record["filename"],
        )
        for page_index, start in enumerate(range(0, len(case_records), per_sheet), start=1):
            batch = case_records[start : start + per_sheet]
            cell_width = THUMBNAIL_SIZE[0]
            cell_height = THUMBNAIL_SIZE[1] + LABEL_HEIGHT
            sheet = Image.new(
                "RGB",
                (
                    CONTACT_MARGIN * 2 + CONTACT_COLUMNS * cell_width,
                    CONTACT_MARGIN * 2 + 34 + CONTACT_ROWS * cell_height,
                ),
                "#f4f4f2",
            )
            draw = ImageDraw.Draw(sheet)
            draw.text(
                (CONTACT_MARGIN, 10),
                f"{case.upper()} · hoja {page_index} · fotos {start + 1}-{start + len(batch)} de {len(case_records)}",
                fill="#171717",
                font=font,
            )
            for offset, record in enumerate(batch):
                row, column = divmod(offset, CONTACT_COLUMNS)
                x = CONTACT_MARGIN + column * cell_width
                y = CONTACT_MARGIN + 34 + row * cell_height
                with Image.open(record["path"]) as source:
                    thumb = ImageOps.fit(
                        ImageOps.exif_transpose(source).convert("RGB"),
                        THUMBNAIL_SIZE,
                        method=Image.Resampling.LANCZOS,
                    )
                sheet.paste(thumb, (x, y))
                draw.rectangle((x, y, x + cell_width - 1, y + THUMBNAIL_SIZE[1] - 1), outline="#b7b7b2")
                flags = ",".join(record["flags"][:2]) or "ok"
                draw.text((x + 4, y + THUMBNAIL_SIZE[1] + 4), record["filename"], fill="#171717", font=small_font)
                draw.text(
                    (x + 4, y + THUMBNAIL_SIZE[1] + 20),
                    f"{record['width']}x{record['height']} · {record['technical_score']:.0f} · {flags}",
                    fill="#5d5d58",
                    font=small_font,
                )
            filename = output / f"{case}-{page_index:02d}.jpg"
            sheet.save(filename, quality=88, optimize=True)
            files.append(str(filename))
    return files


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("root", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    paths = sorted(
        path
        for path in args.root.rglob("*")
        if path.is_file() and path.suffix.lower() in IMAGE_EXTENSIONS
    )
    records = []
    failures = []
    for path in paths:
        try:
            records.append(analyse_image(path, args.root))
        except Exception as error:  # noqa: BLE001 - el informe debe continuar
            failures.append({"path": str(path), "error": str(error)})
    groups = duplicate_groups(records)
    for group_id, indices in enumerate(groups, start=1):
        for index in indices:
            records[index]["duplicate_group"] = group_id
    sheets = make_contact_sheets(records, args.output / "contact-sheets")
    counts = defaultdict(int)
    flagged = defaultdict(int)
    gps = defaultdict(int)
    orientations = defaultdict(lambda: defaultdict(int))
    for record in records:
        counts[record["case"]] += 1
        orientations[record["case"]][record["orientation"]] += 1
        if record["flags"]:
            flagged[record["case"]] += 1
        if record["exif"]["gps_present"]:
            gps[record["case"]] += 1
    summary = {
        "total": len(records),
        "counts": dict(sorted(counts.items())),
        "flagged": dict(sorted(flagged.items())),
        "gps": dict(sorted(gps.items())),
        "orientations": {case: dict(values) for case, values in sorted(orientations.items())},
        "duplicate_groups": len(groups),
        "duplicate_images": sum(len(group) for group in groups),
        "failures": failures,
        "contact_sheets": sheets,
    }
    args.output.mkdir(parents=True, exist_ok=True)
    (args.output / "audit.json").write_text(json.dumps(records, ensure_ascii=False, indent=2), encoding="utf-8")
    (args.output / "summary.json").write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(summary, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
