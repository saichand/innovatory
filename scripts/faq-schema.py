#!/usr/bin/env python3
"""
Regenerate the FAQPage JSON-LD in scratchd/index.html from the FAQ markup.

Google requires the structured data to match what a visitor actually sees, so
this reads the <details> blocks rather than keeping a second hand-written copy
that drifts the first time a question is reworded. Run it after editing the FAQ.

    python3 scripts/faq-schema.py
"""

import html
import json
import pathlib
import re
import sys

PAGE = pathlib.Path(__file__).resolve().parent.parent / "scratchd" / "index.html"
START = "  <!-- FAQ structured data: regenerate with scripts/faq-schema.py -->\n"
END = "  <!-- end FAQ structured data -->"


def text_of(fragment: str) -> str:
    """Visible text of an HTML fragment, with entities and odd spaces normalised."""
    s = re.sub(r"<[^>]+>", "", fragment)
    s = html.unescape(s)
    s = s.replace(" ", " ").replace("‑", "-")
    return re.sub(r"\s+", " ", s).strip()


def main() -> None:
    page = PAGE.read_text(encoding="utf-8")

    faq = re.search(r'<section[^>]*id="faq".*?</section>', page, re.S)
    if not faq:
        sys.exit("No FAQ section found.")

    entries = []
    for block in re.findall(r"<details>(.*?)</details>", faq.group(0), re.S):
        summary = re.search(r"<summary>(.*?)</summary>", block, re.S)
        if not summary:
            continue
        body = block[summary.end():]
        answer = " ".join(text_of(p) for p in re.findall(r"<p>(.*?)</p>", body, re.S))
        if not answer:
            continue
        entries.append({
            "@type": "Question",
            "name": text_of(summary.group(1)),
            "acceptedAnswer": {"@type": "Answer", "text": answer},
        })

    if not entries:
        sys.exit("Found the FAQ section but no question and answer pairs.")

    schema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": entries,
    }
    payload = json.dumps(schema, indent=2, ensure_ascii=False)
    payload = "\n".join("  " + line for line in payload.splitlines())
    block = (START + '  <script type="application/ld+json">\n'
             + payload + "\n  </script>\n" + END)

    if START in page:
        page = re.sub(re.escape(START) + r".*?" + re.escape(END), block, page, flags=re.S)
    else:
        page = page.replace("</head>", block + "\n</head>", 1)

    PAGE.write_text(page, encoding="utf-8")
    print(f"Wrote FAQPage schema with {len(entries)} questions:")
    for e in entries:
        print("  -", e["name"])


if __name__ == "__main__":
    main()
