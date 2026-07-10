# MarketBeaconPro SEO Automation

## Overview

This repository contains the complete "AI‑Ops" SEO automation pipeline for MarketBeaconPro.com, designed to improve the website's SEO health score from **64/100** to **≥ 80/100** without manual intervention.

## Key Features

- **Automated Metadata Generation**: Unique titles, meta descriptions, and H1s for every page
- **Content Expansion**: Automatic expansion of thin pages to 800‑1,200 words
- **Image Optimization**: Bulk conversion to WebP, lazy‑loading, and cache optimization
- **Core Web Vitals Optimization**: Speed, performance, and mobile‑friendliness improvements
- **Link‑Building Automation**: Prospect identification and outreach email campaigns
- **CI/CD Integration**: Automated testing and deployment with Lighthouse validation
- **Monitoring & Reporting**: Real‑time health checks and failure notifications

## Repository Structure

```
marketbeacon-seo-ops/
├── .github/
│   └── workflows/
│       ├── lhci.yml              # Lighthouse CI validation
│       ├── deploy.yml            # WP‑CLI deployment pipeline
│       └── linkbuilding.yml      # Automated outreach
├── audit/                     # Screaming Frog export
│   └── raw_pages.csv
├── templates/                 # Jinja2 templates
│   ├── title.j2
│   ├── meta.j2
│   ├── h1.j2
│   ├── schema_organization.j2
│   └── schema_website.j2
├── scripts/                   # Automation scripts
│   ├── generate_metadata.py
│   ├── expand_content.py
│   ├── optimize_images.sh
│   ├── lighthouse_ci.sh
│   └── outreach.py
├── docker/                    # Docker configuration
│   ├── Dockerfile
│   └── docker-compose.yml
├── README.md
└── requirements.txt
```

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/yourorg/marketbeacon-seo-ops.git
cd marketbeacon-seo-ops
```

### 2. Setup Environment

```bash
# Create virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Run Initial Crawl

Use Screaming Frog or a Python script to generate `audit/raw_pages.csv`:

```bash
# Example using Screaming Frog CLI
screamingfrog --url https://marketbeaconpro.com --output audit/raw_pages.csv
```

### 4. Generate Metadata

```bash
python scripts/generate_metadata.py
```

This will create JSON files in the `output/` directory with optimized titles, meta descriptions, and H1s.

### 5. Expand Thin Content

```bash
python scripts/expand_content.py
```

This will identify thin pages (<800 words) and expand them using an internal LLM endpoint.

### 6. Optimize Images

```bash
bash scripts/optimize_images.sh
```

This will convert images to WebP, resize, and set proper cache headers.

### 7. Validate with Lighthouse

```bash
bash scripts/lighthouse_ci.sh
```

This will run Lighthouse CI and fail if thresholds are not met.

### 8. Deploy Changes

```bash
# Configure WP-CLI credentials
export WP_CLI_AUTH_TOKEN="your-auth-token"
export WP_CLI_URL="https://your-wordpress-site.com"

# Deploy metadata
for file in output/*.json; do
  post_id=$(basename "$file" .json)
  title=$(jq -r '.title' "$file")
  meta=$(jq -r '.meta' "$file")
  h1=$(jq -r '.h1' "$file")
  
  wp post update "$post_id" \
    --field=post_title="$title" \
    --field=post_content="$h1" \
    --field=meta_description="$meta"
done
```

## CI/CD Integration

### GitHub Actions

The repository includes two main workflows:

1. **Lighthouse CI** (`.github/workflows/lhci.yml`): Validates Core Web Vitals after every push/PR
2. **Deploy SEO Changes** (`.github/workflows/deploy.yml`): Deploys optimized metadata and runs validation

### Local Testing

Run the test suite to ensure everything works correctly:

```bash
pytest tests/ -v
```

## Configuration

### Environment Variables

The following environment variables are required:

- `WP_CLI_AUTH_TOKEN`: WordPress CLI authentication token
- `WP_CLI_URL`: WordPress site URL
- `SENDGRID_API_KEY`: SendGrid API key for outreach
- `LLM_ENDPOINT`: Internal LLM endpoint URL
- `LLM_API_KEY`: API key for the LLM endpoint

### Configuration Files

- `.env.example`: Example environment file with all required variables
- `prospects.csv`: List of potential link‑building prospects
- `email_template.txt`: Template for outreach emails

## Docker Deployment

### Build and Run

```bash
docker-compose up --build
```

### Usage

The Docker container runs the metadata generation script by default. You can override the command:

```bash
docker-compose run seo-automation python scripts/expand_content.py
```

## Monitoring & Alerts

### GitHub Actions Notification

If Lighthouse CI fails, a notification is automatically sent to GitHub Issues with details about the failing URLs and metrics.

### Local Monitoring

```bash
# Check Lighthouse reports
lhci generate-reports

# View logs
tail -f logs/seo-automation.log
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Commit and push
6. Create a Pull Request

## License

This project is licensed under the MIT License.

## Support

For questions or issues, please open an issue in the repository.
