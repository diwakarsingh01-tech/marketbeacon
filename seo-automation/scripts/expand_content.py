#!/usr/bin/env python3
"""
MarketBeaconPro Content Expander
Identifies thin pages (<800 words) and expands them using an internal LLM endpoint.
Generates markdown files for human review and automated publishing.
"""

import requests
import pathlib
import json
import time
from datetime import datetime

# Configuration
THIN_LIMIT = 800
LLM_ENDPOINT = "https://internal-llm.company.com/v1/generate"
API_KEY = "your-llm-api-key"
HEADERS = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

def get_word_count(text):
    """Crude word count - replace with proper library if needed."""
    return len(text.split())

def call_llm(prompt, context):
    """Call internal LLM endpoint with retry logic."""
    payload = {
        "model": "gpt-4",
        "messages": [
            {"role": "system", "content": "You are an expert SEO content writer for MarketBeaconPro. Write comprehensive, keyword‑rich content that ranks well and converts visitors."},
            {"role": "user", "content": f"Context: {context}\n\nPrompt: {prompt}"}
        ],
        "temperature": 0.7,
        "max_tokens": 2000
    }
    
    for attempt in range(3):
        try:
            response = requests.post(LLM_ENDPOINT, headers=HEADERS, json=payload, timeout=30)
            response.raise_for_status()
            return response.json()["choices"][0]["message"]["content"]
        except Exception as e:
            print(f"LLM call attempt {attempt + 1} failed: {e}")
            if attempt == 2:
                raise
            time.sleep(2 ** attempt)
    
    return None

def expand_page(url):
    """Expand content for a single URL."""
    print(f"🔄 Expanding content for {url}")
    
    # Fetch current content (placeholder - implement based on your CMS)
    current_content = fetch_current_content(url)
    word_count = get_word_count(current_content)
    
    if word_count >= THIN_LIMIT:
        print(f"✅ {url} already meets word count ({word_count})")
        return
    
    # Generate content outline
    context = f"URL: {url}, current content: {current_content[:500]}..."
    prompt = f"""
    Write a comprehensive {THIN_LIMIT}-word SEO‑optimized article for this service page:
    
    Primary keyword: digital marketing services
    Secondary keywords: SEO, PPC, social media marketing, content marketing, analytics
    Include:
    - Introduction (150-200 words)
    - 3-4 sections (each 200-250 words) with H2 headings
    - A case study snippet
    - Clear call-to-action
    
    Tone: professional, friendly, data‑driven.
    Make it unique and valuable for the target audience.
    """
    
    # Get LLM expansion
    expanded_content = call_llm(prompt, context)
    
    # Save as markdown for review
    content_dir = pathlib.Path('content')
    content_dir.mkdir(exist_ok=True)
    
    safe_filename = pathlib.Path(url).name.replace('/', '_')
    markdown_file = content_dir / f"{safe_filename}.md"
    
    with open(markdown_file, 'w') as f:
        f.write(f"# {url}\n\n{expanded_content}\n\n---\n*Generated on {datetime.utcnow().isoformat()}*\n")
    
    print(f"📝 Saved expanded content to {markdown_file}")

def fetch_current_content(url):
    """
    Fetch current page content from your CMS.
    Implement based on your setup (WordPress REST API, headless CMS, etc.)
    """
    # Placeholder - implement based on your CMS
    return "Current content placeholder"

if __name__ == "__main__":
    # Process thin pages
    thin_pages = pathlib.Path('audit/thin_pages.txt').read_text().splitlines()
    
    for url in thin_pages:
        try:
            expand_page(url.strip())
        except Exception as e:
            print(f"❌ Failed to expand {url}: {e}")
            continue
    
    print("✅ Content expansion complete")