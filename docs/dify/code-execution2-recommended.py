import json


CATALOG = [
    {
        "product_name": "ブラシンフロアブル",
        "target_crop": "稲",
        "target_issue": "いもち病",
        "target_issue_type": "disease",
        "dosage_l_per_10a": 0.1,
        "dilution_ratio": "1000倍",
        "source_url": "https://example.local/agri/rice-blast-01",
    },
    {
        "product_name": "オリゼメート粒剤",
        "target_crop": "稲",
        "target_issue": "いもち病",
        "target_issue_type": "disease",
        "dosage_l_per_10a": 3.0,
        "dilution_ratio": "粒剤",
        "source_url": "https://example.local/agri/rice-blast-02",
    },
    {
        "product_name": "スタークル顆粒水溶剤",
        "target_crop": "野菜類",
        "target_issue": "アブラムシ類",
        "target_issue_type": "pest",
        "dosage_l_per_10a": 0.05,
        "dilution_ratio": "2000倍",
        "source_url": "https://example.local/agri/aphid-01",
    },
    {
        "product_name": "アファーム乳剤",
        "target_crop": "野菜類",
        "target_issue": "ハモグリバエ類",
        "target_issue_type": "pest",
        "dosage_l_per_10a": 0.05,
        "dilution_ratio": "2000倍",
        "source_url": "https://example.local/agri/leafminer-01",
    },
    {
        "product_name": "プレバソンフロアブル5",
        "target_crop": "野菜類",
        "target_issue": "ヨトウムシ類",
        "target_issue_type": "pest",
        "dosage_l_per_10a": 0.02,
        "dilution_ratio": "4000倍",
        "source_url": "https://example.local/agri/armyworm-01",
    },
    {
        "product_name": "スタークル粒剤",
        "target_crop": "稲",
        "target_issue": "イネミズゾウムシ類",
        "target_issue_type": "pest",
        "dosage_l_per_10a": 3.0,
        "dilution_ratio": "粒剤",
        "source_url": "https://example.local/agri/rice-weevil-01",
    },
    {
        "product_name": "リドミルゴールドMZ",
        "target_crop": "野菜類",
        "target_issue": "べと病",
        "target_issue_type": "disease",
        "dosage_l_per_10a": 0.25,
        "dilution_ratio": "1000倍",
        "source_url": "https://example.local/agri/downy-mildew-01",
    },
    {
        "product_name": "トリフミン水和剤",
        "target_crop": "野菜類",
        "target_issue": "うどんこ病",
        "target_issue_type": "disease",
        "dosage_l_per_10a": 0.033,
        "dilution_ratio": "3000倍",
        "source_url": "https://example.local/agri/powdery-mildew-01",
    },
]


def normalize_text(value):
    if value is None:
        return ""
    if isinstance(value, (dict, list)):
        return json.dumps(value, ensure_ascii=False)
    return str(value)


def parse_agri_context(raw_text):
    try:
        return json.loads(raw_text)
    except Exception:
        return {}


def extract_json_objects(text):
    if not text:
        return []

    objects = []
    stack = 0
    start = None

    for i, ch in enumerate(text):
        if ch == "{":
            if stack == 0:
                start = i
            stack += 1
        elif ch == "}":
            if stack > 0:
                stack -= 1
                if stack == 0 and start is not None:
                    chunk = text[start : i + 1]
                    try:
                        objects.append(json.loads(chunk))
                    except Exception:
                        pass
                    start = None
    return objects


def normalize_crop(value):
    text = normalize_text(value).strip()
    if not text:
        return ""
    if text in ("稲", "水稲", "イネ"):
        return "稲"
    if text in ("野菜", "野菜類", "複合作物"):
        return "野菜類"
    if text in ("果樹", "果樹類"):
        return "果樹類"
    return text


def normalize_issue(value):
    text = normalize_text(value).strip()
    if not text or text in ("なし", "—"):
        return ""
    text = text.replace(" ", "")
    if text in ("イモチ病", "いもち病"):
        return "いもち病"
    if text in ("ベト病", "べと病"):
        return "べと病"
    if text in ("ウドンコ病", "うどんこ病"):
        return "うどんこ病"
    if text.endswith("類"):
        return text
    if "病" in text:
        return text
    return f"{text}類"


def issue_aliases(issue):
    normalized = normalize_issue(issue)
    if not normalized:
        return []
    aliases = {normalized, normalized.replace("類", ""), normalized.replace("い", "イ")}
    if normalized == "いもち病":
        aliases.update({"イモチ病", "イネいもち病", "稲いもち病"})
    if normalized == "アブラムシ類":
        aliases.update({"アブラムシ", "アブラムシ類"})
    if normalized == "ヨトウムシ類":
        aliases.update({"ヨトウムシ", "ヨトウムシ類"})
    if normalized == "ハモグリバエ類":
        aliases.update({"ハモグリバエ", "ハモグリバエ類"})
    if normalized == "イネミズゾウムシ類":
        aliases.update({"イネミズゾウムシ", "イネミズゾウムシ類"})
    return [alias for alias in aliases if alias]


def crop_aliases(crop):
    normalized = normalize_crop(crop)
    if not normalized:
        return []
    aliases = {normalized}
    if normalized == "稲":
        aliases.update({"稲", "水稲", "イネ"})
    if normalized == "野菜類":
        aliases.update({"野菜", "野菜類"})
    if normalized == "果樹類":
        aliases.update({"果樹", "果樹類"})
    return [alias for alias in aliases if alias]


def flatten_text(value):
    if value is None:
        return ""
    if isinstance(value, str):
        return value
    if isinstance(value, dict):
        parts = []
        for v in value.values():
            text = flatten_text(v)
            if text:
                parts.append(text)
        return " ".join(parts)
    if isinstance(value, list):
        parts = [flatten_text(v) for v in value]
        return " ".join(part for part in parts if part)
    return str(value)


def extract_search_records(value):
    if value is None:
        return []
    if isinstance(value, list):
        records = []
        for item in value:
            records.extend(extract_search_records(item))
        return records
    if isinstance(value, dict):
        return [value]
    text = normalize_text(value)
    return extract_json_objects(text)


def parse_catalog_fields(record):
    if not isinstance(record, dict):
        return {}

    content = (
        record.get("content")
        or record.get("text")
        or record.get("page_content")
        or record.get("snippet")
        or record.get("answer")
        or ""
    )
    text = flatten_text(record) if not content else normalize_text(content)

    item = {
        "product_name": record.get("product_name") or record.get("title") or record.get("name") or "",
        "pest_name": record.get("pest_name") or record.get("target_issue") or record.get("disease_name") or "",
        "crop_name": record.get("crop_name") or record.get("target_crop") or "",
        "dosage_l_per_10a": record.get("dosage_l_per_10a") or "",
        "dilution_ratio": record.get("dilution_ratio") or "",
        "source_url": record.get("source_url") or record.get("url") or "",
        "label_or_source_name": record.get("label_or_source_name") or record.get("source_name") or "",
        "_text": text,
    }

    if not item["product_name"] and text:
        for line in [part.strip() for part in text.splitlines() if part.strip()]:
            if line.startswith("- "):
                line = line[2:].strip()
            if not item["product_name"] and "http" not in line:
                item["product_name"] = line.split(":", 1)[0].strip()
                break

    return item


def matches_context(item, target_crop, target_issue, target_issue_type):
    text = normalize_text(item.get("_text"))
    crop_hits = any(alias in text for alias in crop_aliases(target_crop))
    issue_hits = any(alias in text for alias in issue_aliases(target_issue))

    item_crop = normalize_crop(item.get("crop_name"))
    item_issue = normalize_issue(item.get("pest_name") or item.get("target_issue") or item.get("disease_name"))
    item_issue_type = normalize_text(item.get("target_issue_type")).strip()

    if item_crop and item_issue:
        return (
            normalize_crop(target_crop) == item_crop
            and normalize_issue(target_issue) == item_issue
            and (not target_issue_type or target_issue_type == item_issue_type)
        )

    return crop_hits and issue_hits


def dedupe_products(items):
    seen = set()
    deduped = []
    for item in items:
        key = (item.get("product_name"), item.get("source_url"), item.get("dilution_ratio"))
        if key in seen:
            continue
        seen.add(key)
        deduped.append(item)
    return deduped


def fallback_catalog_match(target_crop, target_issue, target_issue_type):
    crop_norm = normalize_crop(target_crop)
    issue_norm = normalize_issue(target_issue)
    results = []

    for row in CATALOG:
        if crop_norm and normalize_crop(row["target_crop"]) != crop_norm:
            continue
        if issue_norm and normalize_issue(row["target_issue"]) != issue_norm:
            continue
        if target_issue_type and row["target_issue_type"] != target_issue_type:
            continue
        results.append(
            {
                "product_name": row["product_name"],
                "pest_name": row["target_issue"],
                "crop_name": row["target_crop"],
                "dosage_l_per_10a": row["dosage_l_per_10a"],
                "dilution_ratio": row["dilution_ratio"],
                "source_url": row["source_url"],
                "label_or_source_name": "",
            }
        )

    return results


def main(arg1=None, arg2=None, arg3=None):
    raw_results = normalize_text(arg1) + "\n" + normalize_text(arg2)
    agri_context = parse_agri_context(arg3)

    field = agri_context.get("field", {})
    field_name = field.get("field_name", "")
    area_ha = field.get("area_ha", None)

    target_crop = agri_context.get("target_crop") or field.get("crop_type", "")
    target_issue = (
        agri_context.get("target_issue")
        or agri_context.get("target_pest")
        or field.get("suspected_pest", "")
    )
    target_issue_type = agri_context.get("target_issue_type") or ""

    context_candidates = agri_context.get("pesticide_candidates") or []
    if isinstance(context_candidates, list) and context_candidates:
        matched = []
        for item in context_candidates:
            if not isinstance(item, dict):
                continue
            product_name = normalize_text(item.get("product_name")).strip()
            if not product_name:
                continue
            matched.append(
                {
                    "product_name": product_name,
                    "pest_name": normalize_text(item.get("pest_name")).strip(),
                    "crop_name": normalize_text(item.get("crop_name")).strip(),
                    "dosage_l_per_10a": item.get("dosage_l_per_10a", ""),
                    "dilution_ratio": normalize_text(item.get("dilution_ratio")).strip(),
                    "source_url": normalize_text(item.get("source_url")).strip(),
                    "label_or_source_name": normalize_text(item.get("label_or_source_name")).strip(),
                }
            )
    else:
        matched = []

    search_records = extract_search_records(raw_results)
    if not matched:
        for record in search_records:
            item = parse_catalog_fields(record)
            if not item.get("product_name"):
                continue
            if matches_context(item, target_crop, target_issue, target_issue_type):
                matched.append(
                    {
                        "product_name": item.get("product_name", ""),
                        "pest_name": item.get("pest_name", ""),
                        "crop_name": item.get("crop_name", ""),
                        "dosage_l_per_10a": item.get("dosage_l_per_10a", ""),
                        "dilution_ratio": item.get("dilution_ratio", ""),
                        "source_url": item.get("source_url", ""),
                        "label_or_source_name": item.get("label_or_source_name", ""),
                    }
                )

    if not matched:
        matched = fallback_catalog_match(target_crop, target_issue, target_issue_type)

    matched = dedupe_products(matched)[:5]

    return {
        "result": json.dumps(
            {
                "field_name": field_name,
                "area_ha": area_ha,
                "crop_type": normalize_crop(target_crop),
                "suspected_pest": normalize_issue(target_issue),
                "matched_products": matched,
            },
            ensure_ascii=False,
        )
    }
