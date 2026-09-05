#!/usr/bin/env python3
"""
DEPRECATED — sitemap-blog.xml is now served live by api/sitemap-blog.js
(Vercel function, rewrite in vercel.json), reading Supabase on every
request. No manual regeneration needed anymore; new articles appear
in the sitemap as soon as they're published.

Kept only as an offline/debug tool to preview the XML a given moment
would produce:
    python3 scripts/generate_sitemap_blog.py
(writes to sitemap-blog.xml locally — do NOT commit that file, it is
no longer served statically and Vercel would shadow the live route)
"""
import json
import urllib.request
from pathlib import Path

SUPABASE_URL = "https://dsokhfvtwidcuckqkdxb.supabase.co"
SUPABASE_KEY = "sb_publishable_aF11Da2IvCuJHohSL4OHsg_TQYcm8Jk"
SITE_ROOT = "https://tr-reflexologie.com"
OUTPUT = Path(__file__).resolve().parent.parent / "sitemap-blog.xml"


def fetch_published_articles():
    url = (
        f"{SUPABASE_URL}/rest/v1/articles_blog"
        "?select=slug,updated_at,published_at&statut=eq.publie&order=published_at.desc"
    )
    req = urllib.request.Request(
        url,
        headers={
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
        },
    )
    with urllib.request.urlopen(req, timeout=15) as resp:
        return json.loads(resp.read().decode("utf-8"))


def build_xml(articles):
    lines = ['<?xml version="1.0" encoding="UTF-8"?>']
    lines.append('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')
    for a in articles:
        slug = a.get("slug")
        if not slug:
            continue
        lastmod = (a.get("updated_at") or a.get("published_at") or "")[:10]
        lines.append("<url>")
        lines.append(f"<loc>{SITE_ROOT}/blog/{slug}</loc>")
        if lastmod:
            lines.append(f"<lastmod>{lastmod}</lastmod>")
        lines.append("<changefreq>monthly</changefreq>")
        lines.append("<priority>0.5</priority>")
        lines.append("</url>")
    lines.append("</urlset>")
    return "\n".join(lines) + "\n"


def main():
    try:
        articles = fetch_published_articles()
    except Exception as exc:
        print(f"Erreur lors de la requête Supabase : {exc}")
        articles = []

    xml = build_xml(articles)
    OUTPUT.write_text(xml, encoding="utf-8")
    print(f"{len(articles)} article(s) publié(s) — sitemap-blog.xml régénéré ({OUTPUT}).")


if __name__ == "__main__":
    main()
