#!/usr/bin/env python3
"""
Test suite for MarketBeaconPro SEO Automation
"""

import pytest
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT / 'scripts'))

from generate_metadata import render_title, render_meta, render_h1, load_templates

# Load templates once for all tests that need them
TEMPLATES = load_templates(str(PROJECT_ROOT / 'templates'))


def strip_html(text):
    """Remove HTML tags from a string."""
    import re as _re
    return _re.sub(r'<[^>]+>', '', text)


def test_title_length():
    """Ensure generated titles are ≤ 60 characters."""
    test_row = {
        'url': 'https://marketbeaconpro.com/services/seo/',
        'title': '',
        'meta': '',
        'h1': '',
        'word_count': 0,
        'content': ''
    }
    title = strip_html(render_title(test_row, TEMPLATES['title']))
    assert len(title) <= 60, f"Title too long: {title} ({len(title)} chars)"


def test_title_contains_city():
    """Ensure title includes city extracted from URL."""
    test_row = {
        'url': 'https://marketbeaconpro.com/services/seattle-seo/',
        'title': '',
        'meta': '',
        'h1': '',
        'word_count': 0,
        'content': ''
    }
    title = render_title(test_row, TEMPLATES['title'])
    assert 'Seattle' in title or 'seattle' in title, f"City not found in title: {title}"


def test_title_contains_brand():
    """Ensure title includes brand name."""
    test_row = {
        'url': 'https://marketbeaconpro.com/services/seo/',
        'title': '',
        'meta': '',
        'h1': '',
        'word_count': 0,
        'content': ''
    }
    title = render_title(test_row, TEMPLATES['title'])
    assert 'MarketBeaconPro' in title, f"Brand missing in title: {title}"


def test_meta_description_length():
    """Ensure meta descriptions are ≤ 160 characters."""
    test_row = {
        'url': 'https://marketbeaconpro.com/services/seo/',
        'title': '',
        'meta': '',
        'h1': '',
        'word_count': 0,
        'content': ''
    }
    meta = render_meta(test_row, TEMPLATES['meta'])
    assert len(meta) <= 160, f"Meta description too long: {meta} ({len(meta)} chars)"
    assert len(meta) >= 120, f"Meta description too short: {meta} ({len(meta)} chars)"


def test_meta_contains_cta():
    """Ensure meta description includes a call to action."""
    test_row = {
        'url': 'https://marketbeaconpro.com/services/seo/',
        'title': '',
        'meta': '',
        'h1': '',
        'word_count': 0,
        'content': ''
    }
    meta = render_meta(test_row, TEMPLATES['meta'])
    assert 'SEO' in meta or 'audit' in meta or 'free' in meta, f"CTA not found in meta: {meta}"


def test_h1_single_per_page():
    """Ensure each page has a single H1."""
    test_row = {
        'url': 'https://marketbeaconpro.com/services/seo/',
        'title': '',
        'meta': '',
        'h1': '',
        'word_count': 0,
        'content': ''
    }
    h1 = render_h1(test_row, TEMPLATES['h1'])
    assert h1.count('<h1>') == 1, f"Multiple H1 tags found: {h1}"


def test_h1_contains_keyword():
    """Ensure H1 includes primary keyword."""
    test_row = {
        'url': 'https://marketbeaconpro.com/services/seo/',
        'title': '',
        'meta': '',
        'h1': '',
        'word_count': 0,
        'content': ''
    }
    h1 = render_h1(test_row, TEMPLATES['h1'])
    assert 'digital marketing' in h1, f"Keyword not found in H1: {h1}"


def test_h1_contains_closing_tag():
    """Ensure H1 is properly closed."""
    test_row = {
        'url': 'https://marketbeaconpro.com/services/seo/',
        'title': '',
        'meta': '',
        'h1': '',
        'word_count': 0,
        'content': ''
    }
    h1 = render_h1(test_row, TEMPLATES['h1'])
    assert '</h1>' in h1, f"H1 missing closing tag: {h1}"


class TestTemplateFiles:
    """Test that all template files exist and are valid."""

    def test_title_template_exists(self):
        assert (PROJECT_ROOT / 'templates' / 'title.j2').exists()

    def test_meta_template_exists(self):
        assert (PROJECT_ROOT / 'templates' / 'meta.j2').exists()

    def test_h1_template_exists(self):
        assert (PROJECT_ROOT / 'templates' / 'h1.j2').exists()

    def test_schema_org_template_exists(self):
        assert (PROJECT_ROOT / 'templates' / 'schema_organization.j2').exists()

    def test_schema_website_template_exists(self):
        assert (PROJECT_ROOT / 'templates' / 'schema_website.j2').exists()

    def test_schema_faq_template_exists(self):
        assert (PROJECT_ROOT / 'templates' / 'schema_faq.j2').exists()


class TestScriptFiles:
    """Test all essential script files exist."""

    def test_generate_metadata_exists(self):
        assert (PROJECT_ROOT / 'scripts' / 'generate_metadata.py').exists()

    def test_expand_content_exists(self):
        assert (PROJECT_ROOT / 'scripts' / 'expand_content.py').exists()

    def test_optimize_images_exists(self):
        assert (PROJECT_ROOT / 'scripts' / 'optimize_images.sh').exists()

    def test_lighthouse_ci_exists(self):
        assert (PROJECT_ROOT / 'scripts' / 'lighthouse_ci.sh').exists()

    def test_outreach_exists(self):
        assert (PROJECT_ROOT / 'scripts' / 'outreach.py').exists()


class TestConfigFiles:
    """Test all configuration files exist."""

    def test_requirements_exists(self):
        assert (PROJECT_ROOT / 'requirements.txt').exists()

    def test_readme_exists(self):
        assert (PROJECT_ROOT / 'README.md').exists()

    def test_dockerfile_exists(self):
        assert (PROJECT_ROOT / 'docker' / 'Dockerfile').exists()

    def test_docker_compose_exists(self):
        assert (PROJECT_ROOT / 'docker-compose.yml').exists()

    def test_gitignore_exists(self):
        assert (PROJECT_ROOT / '.gitignore').exists()

    def test_env_example_exists(self):
        assert (PROJECT_ROOT / '.env.example').exists()

    def test_email_template_exists(self):
        assert (PROJECT_ROOT / 'email_template.txt').exists()


class TestWorkflowFiles:
    """Test all GitHub Actions workflow files exist."""

    def test_lhci_workflow_exists(self):
        assert (PROJECT_ROOT / '.github' / 'workflows' / 'lhci.yml').exists()

    def test_deploy_workflow_exists(self):
        assert (PROJECT_ROOT / '.github' / 'workflows' / 'deploy.yml').exists()


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
