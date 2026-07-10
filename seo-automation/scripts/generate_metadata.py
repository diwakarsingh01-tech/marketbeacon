#!/usr/bin/env python3
"""
MarketBeaconPro SEO Metadata Generator
Generates unique titles, meta descriptions, and H1s for all pages using Jinja2 templates.
Outputs JSON files for downstream WP‑CLI deployment.
"""

import json
import jinja2
import pathlib
import pandas as pd
import re
import sys
from datetime import datetime
from urllib.parse import urlparse


def load_templates(templates_dir='templates'):
    """Load Jinja2 templates from the templates directory."""
    tdir = pathlib.Path(templates_dir)
    env = jinja2.Environment(loader=jinja2.FileSystemLoader(tdir))
    return {
        'title': env.get_template('title.j2'),
        'meta': env.get_template('meta.j2'),
        'h1': env.get_template('h1.j2'),
    }


def render_title(row, title_tpl=None):
    """Generate SEO‑optimized title with city inclusion."""
    if title_tpl is None:
        tpl = load_templates()['title']
    else:
        tpl = title_tpl
    path = urlparse(row['url']).path.rstrip('/')
    segs = [s for s in path.split('/') if s]
    city = segs[-1].replace('-', ' ').title() if segs else 'United States'
    return tpl.render(
        city=city,
        brand='MarketBeaconPro',
        primary_keyword='digital marketing services'
    )


def render_meta(row, meta_tpl=None):
    """Generate compelling meta description (150‑160 chars)."""
    if meta_tpl is None:
        tpl = load_templates()['meta']
    else:
        tpl = meta_tpl
    return tpl.render(
        primary_keyword='digital marketing services',
        cta='Get a free SEO audit today',
        brand='MarketBeaconPro'
    )


def render_h1(row, h1_tpl=None):
    """Generate single, keyword‑focused H1."""
    if h1_tpl is None:
        tpl = load_templates()['h1']
    else:
        tpl = h1_tpl
    return tpl.render(
        primary_keyword='digital marketing services',
        brand='MarketBeaconPro'
    )


def process_pages(df, templates, output_dir='output'):
    """Process all pages and generate metadata JSON files."""
    out = pathlib.Path(output_dir)
    out.mkdir(exist_ok=True)
    count = 0
    for _, row in df.iterrows():
        new_title = render_title(row, templates['title'])
        new_meta = render_meta(row, templates['meta'])
        new_h1 = render_h1(row, templates['h1'])
        safe_filename = re.sub(r'[^a-zA-Z0-9]', '_', row['url'])
        data = {
            'url': row['url'],
            'title': new_title,
            'meta': new_meta,
            'h1': new_h1,
            'timestamp': datetime.utcnow().isoformat()
        }
        with open(out / f"{safe_filename}.json", 'w') as f:
            json.dump(data, f, indent=2)
        print(f"✅ Generated metadata for {row['url']}")
        count += 1
    return count


def main(csv_path='audit/raw_pages.csv', templates_dir='templates', output_dir='output'):
    """Main entry point."""
    df = pd.read_csv(csv_path)
    templates = load_templates(templates_dir)
    count = process_pages(df, templates, output_dir)
    print(f"✅ Metadata generation complete: {count} pages processed")
    return count


if __name__ == '__main__':
    csv_path = sys.argv[1] if len(sys.argv) > 1 else 'audit/raw_pages.csv'
    main(csv_path)
