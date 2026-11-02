import os

import pytest
from playwright.sync_api import Page, expect

BASE_URL = os.getenv("MONEYTRACKER_BASE_URL", "http://127.0.0.1:8080")


@pytest.mark.parametrize("width,height", [(390, 844), (768, 1024), (1365, 900)])
def test_money_tracker_renders_without_horizontal_overflow(page: Page, width: int, height: int) -> None:
    page.set_viewport_size({"width": width, "height": height})
    page.goto(BASE_URL, wait_until="domcontentloaded")
    expect(page.locator("body")).to_be_visible()
    page.wait_for_timeout(500)
    dimensions = page.evaluate("""() => ({viewport: document.documentElement.clientWidth, page: document.documentElement.scrollWidth})""")
    assert dimensions["page"] <= dimensions["viewport"] + 1, f"Horizontal overflow: {dimensions}"


def test_pwa_manifest_is_available(page: Page) -> None:
    page.goto(BASE_URL, wait_until="domcontentloaded")
    manifest = page.locator('link[rel="manifest"]')
    expect(manifest).to_have_count(1)
    href = manifest.get_attribute("href")
    assert href
    response = page.request.get(f"{BASE_URL.rstrip('/')}/{href.lstrip('/')}")
    assert response.ok, f"Manifest returned HTTP {response.status}"
    payload = response.json()
    assert payload.get("name") or payload.get("short_name")
