"""
Pytest configuration for MarketBeaconPro SEO Automation tests.
"""

import os


def pytest_configure(config):
    """Configure pytest for the project."""
    config.addinivalue_line(
        "markers", "integration: integration tests that require external services"
    )
    config.addinivalue_line(
        "markers", "unit: unit tests that test individual functions"
    )
    # Ensure necessary directories exist
    for d in ["audit", "output", "content", "templates", "static"]:
        os.makedirs(d, exist_ok=True)
