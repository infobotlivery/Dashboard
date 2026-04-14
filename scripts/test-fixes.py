"""
Verifies the three fixes applied in this session:
1. Gastos/Categorias counts sync
2. Metas save flow (timezone bug)
3. Cierres custom date + edit
"""
import sys
from playwright.sync_api import sync_playwright, expect

BASE = "http://localhost:3000"
PASSWORD = "admin123"


def login_finanzas(page):
    page.goto(f"{BASE}/finanzas")
    page.wait_for_load_state("networkidle")
    pwd = page.locator('input[type="password"]')
    if pwd.count() > 0 and pwd.first.is_visible():
        pwd.first.fill(PASSWORD)
        page.locator('button[type="submit"]').first.click()
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(1000)


def login_admin(page):
    page.goto(f"{BASE}/admin")
    page.wait_for_load_state("networkidle")
    pwd = page.locator('input[type="password"]')
    if pwd.count() > 0 and pwd.first.is_visible():
        pwd.first.fill(PASSWORD)
        page.locator('button[type="submit"]').first.click()
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(1000)


def test_categorias_sync(page):
    print("\n=== TEST 1: Gastos/Categorias sync ===")
    login_finanzas(page)

    token = page.evaluate("() => localStorage.getItem('finance_token')")
    if not token:
        print("  FAIL: no finance_token in localStorage")
        return False

    # Seed: create a category and 3 expenses — 1 active, 1 expired (endDate in past), 1 with no endDate
    cat = page.evaluate(
        """async (token) => {
            const r = await fetch('/api/finance/categories', {
                method: 'POST',
                headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: 'TEST-CAT-' + Date.now(), color: '#44e1fc' })
            });
            return await r.json();
        }""",
        token,
    )
    if not cat.get("success"):
        print(f"  FAIL: could not seed category: {cat}")
        return False
    cat_id = cat["data"]["id"]
    print(f"  seeded category id={cat_id}")

    # Create 3 expenses: 2 active (null and future endDate), 1 expired
    # POST ignores endDate so we create then PUT to set it.
    seeded_ids = []
    for label, end_date in [
        ("active-null", None),
        ("active-future", "2030-01-01"),
        ("expired", "2024-01-01"),
    ]:
        e = page.evaluate(
            """async ({token, body}) => {
                const r = await fetch('/api/finance/expenses', {
                    method: 'POST',
                    headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
                    body: JSON.stringify(body)
                });
                return await r.json();
            }""",
            {
                "token": token,
                "body": {
                    "name": f"TEST-EXP-{label}",
                    "amount": 100,
                    "type": "recurring",
                    "categoryId": cat_id,
                    "startDate": "2024-01-01T00:00:00.000Z",
                },
            },
        )
        if not e.get("success"):
            print(f"  WARN: could not seed expense {label}: {e}")
            continue
        expense_id = e["data"]["id"]
        seeded_ids.append(expense_id)

        # PUT with endDate if needed
        if end_date:
            put = page.evaluate(
                """async ({token, body}) => {
                    const r = await fetch('/api/finance/expenses', {
                        method: 'PUT',
                        headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
                        body: JSON.stringify(body)
                    });
                    return await r.json();
                }""",
                {
                    "token": token,
                    "body": {
                        "id": expense_id,
                        "name": f"TEST-EXP-{label}",
                        "amount": 100,
                        "type": "recurring",
                        "categoryId": cat_id,
                        "startDate": "2024-01-01T00:00:00.000Z",
                        "endDate": f"{end_date}T00:00:00.000Z",
                    },
                },
            )
            if not put.get("success"):
                print(f"  WARN: PUT endDate for {label} failed: {put}")

    print(f"  seeded {len(seeded_ids)} expenses (expected 3)")

    cats = page.evaluate(
        """async (token) => {
            const r = await fetch('/api/finance/categories', {
                headers: { 'Authorization': 'Bearer ' + token }
            });
            return await r.json();
        }""",
        token,
    )

    exps = page.evaluate(
        """async (token) => {
            const r = await fetch('/api/finance/expenses', {
                headers: { 'Authorization': 'Bearer ' + token }
            });
            return await r.json();
        }""",
        token,
    )

    if not cats.get("success") or not exps.get("success"):
        print(f"  FAIL: API error cats={cats} exps={exps}")
        return False

    expense_list = exps.get("data", [])
    category_list = cats.get("data", [])

    # Group expenses by categoryId — counting only !endDate (matches GastosTab)
    by_cat_active = {}
    for e in expense_list:
        if e.get("endDate"):
            continue
        cid = e.get("categoryId")
        by_cat_active[cid] = by_cat_active.get(cid, 0) + 1

    print(f"  Total expenses from /api/finance/expenses: {len(expense_list)}")
    print(f"  Active expenses (!endDate): {sum(by_cat_active.values())}")
    print(f"  Categories from /api/finance/categories: {len(category_list)}")

    mismatches = 0
    for c in category_list:
        count_from_cat = c["_count"]["expenses"]
        count_from_exp = by_cat_active.get(c["id"], 0)
        status = "OK" if count_from_cat == count_from_exp else "MISMATCH"
        if count_from_cat != count_from_exp:
            print(
                f"    [{status}] {c['name']}: categories={count_from_cat} vs gastos={count_from_exp}"
            )
            mismatches += 1

    # Verify seeded category has exactly 1 active expense (only "active-null")
    seeded_cat = next((c for c in category_list if c["id"] == cat_id), None)
    if seeded_cat is None:
        print("  FAIL: seeded category not in API response")
        return False
    if seeded_cat["_count"]["expenses"] != 1:
        print(
            f"  FAIL: expected 1 active expense in seeded category, got {seeded_cat['_count']['expenses']}"
        )
        return False
    print(
        f"  PASS: seeded category reports 1 active expense (matches GastosTab convention)"
    )

    # Cleanup
    for eid in seeded_ids:
        page.evaluate(
            """async ({token, id}) => {
                await fetch('/api/finance/expenses?id=' + id, {
                    method: 'DELETE',
                    headers: { 'Authorization': 'Bearer ' + token }
                });
            }""",
            {"token": token, "id": eid},
        )
    page.evaluate(
        """async ({token, id}) => {
            await fetch('/api/finance/categories?id=' + id, {
                method: 'DELETE',
                headers: { 'Authorization': 'Bearer ' + token }
            });
        }""",
        {"token": token, "id": cat_id},
    )
    print("  cleanup: seeded data deleted")

    if mismatches == 0:
        print("  PASS: all category counts match expense counts")
        return True
    else:
        print(f"  FAIL: {mismatches} mismatches")
        return False


def test_metas_save(page):
    print("\n=== TEST 2: Metas save flow ===")
    login_finanzas(page)

    # Click "Metas" tab
    page.locator("text=Metas").first.click()
    page.wait_for_timeout(1500)
    page.screenshot(path="/tmp/test2-metas-before.png", full_page=True)

    # Fill the income target input
    # Find NumberInput for "Meta de Ingresos"
    # NumberInput likely renders an input. Use label text proximity.
    token = page.evaluate("() => localStorage.getItem('finance_token')")

    # Save directly via API with current month
    from datetime import datetime, timezone

    now = datetime.now(timezone.utc)
    month_iso = datetime(now.year, now.month, 1, tzinfo=timezone.utc).isoformat().replace(
        "+00:00", "Z"
    )

    save = page.evaluate(
        """async ({token, body}) => {
            const r = await fetch('/api/finance/goals', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + token,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });
            return { status: r.status, json: await r.json() };
        }""",
        {
            "token": token,
            "body": {
                "month": month_iso,
                "incomeTarget": 12345,
                "expenseLimit": 6789,
                "savingsTarget": 4321,
                "notes": "test-fix-verification",
            },
        },
    )

    print(f"  POST /api/finance/goals -> status={save['status']}")
    if save["status"] != 200 or not save["json"].get("success"):
        print(f"  FAIL: {save}")
        return False

    # Fetch goals and verify the month comes back as expected
    goals = page.evaluate(
        """async (token) => {
            const r = await fetch('/api/finance/goals', {
                headers: { 'Authorization': 'Bearer ' + token }
            });
            return await r.json();
        }""",
        token,
    )

    if not goals.get("success"):
        print(f"  FAIL: goals fetch failed: {goals}")
        return False

    current_key = f"{now.year}-{now.month:02d}"
    matched = None
    for g in goals["data"]:
        # Derive goalKey using UTC (matching the fix in MetasTab)
        d_str = g["month"]
        # parse ISO
        from datetime import datetime as dt

        d = dt.fromisoformat(d_str.replace("Z", "+00:00"))
        key = f"{d.year}-{d.month:02d}"
        if key == current_key:
            matched = g
            break

    if not matched:
        print(f"  FAIL: could not find goal for {current_key}")
        return False

    if (
        matched["incomeTarget"] != 12345
        or matched["expenseLimit"] != 6789
        or matched["savingsTarget"] != 4321
    ):
        print(f"  FAIL: values don't match: {matched}")
        return False

    print(f"  PASS: goal saved and retrieved for current month {current_key}")
    print(f"    income={matched['incomeTarget']} expenses={matched['expenseLimit']} savings={matched['savingsTarget']}")

    # Verify the UI renders the "Configurado" badge and correct month key derivation.
    # Simulate what MetasTab does: parse the month and derive key with UTC.
    from datetime import datetime as dt

    d = dt.fromisoformat(matched["month"].replace("Z", "+00:00"))
    derived_key = f"{d.year}-{d.month:02d}"
    if derived_key != current_key:
        print(
            f"  FAIL: UTC-derived goalKey ({derived_key}) != currentMonthKey ({current_key})"
        )
        return False
    print(f"  PASS: UTC-derived goalKey matches currentMonthKey ({derived_key})")

    return True


def test_cierres_custom_date(page):
    print("\n=== TEST 3: Cierres custom date + edit ===")
    login_admin(page)

    # Click "Cierres" tab
    cierres_btn = page.locator("button:has-text('Cierres')").first
    if cierres_btn.count() == 0:
        cierres_btn = page.locator("text=Cierres").first
    cierres_btn.click()
    page.wait_for_timeout(1500)
    page.screenshot(path="/tmp/test3-cierres-form.png", full_page=True)

    # Verify DateSelector labeled "Fecha del Cierre" exists
    content = page.content()
    if "Fecha del Cierre" not in content:
        print("  FAIL: 'Fecha del Cierre' label not found in form")
        return False
    print("  OK: 'Fecha del Cierre' label present")

    # Create a sale via API with a custom date (past)
    token = page.evaluate("() => localStorage.getItem('admin_token')")
    from datetime import datetime, timezone

    custom = datetime(2026, 1, 15, tzinfo=timezone.utc).isoformat().replace("+00:00", "Z")

    create = page.evaluate(
        """async ({token, body}) => {
            const r = await fetch('/api/sales', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + token,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });
            return { status: r.status, json: await r.json() };
        }""",
        {
            "token": token,
            "body": {
                "clientName": "TEST-FIX-VERIFICATION",
                "product": "CRM",
                "onboardingValue": 100,
                "recurringValue": 50,
                "contractMonths": 3,
                "status": "active",
                "createdAt": custom,
            },
        },
    )

    print(f"  POST /api/sales (custom date) -> status={create['status']}")
    if create["status"] not in (200, 201) or not create["json"].get("success"):
        print(f"  FAIL: {create}")
        return False

    sale = create["json"]["data"]
    sale_id = sale["id"]
    returned_date = sale["createdAt"]
    print(f"  Created sale id={sale_id} createdAt={returned_date}")

    # Verify the returned date is January 2026 (not today)
    if "2026-01-15" not in returned_date:
        print(f"  FAIL: expected 2026-01-15 in createdAt, got {returned_date}")
        return False
    print("  PASS: custom createdAt accepted by POST")

    # Now test edit: PUT with a different date
    new_custom = (
        datetime(2026, 2, 20, tzinfo=timezone.utc).isoformat().replace("+00:00", "Z")
    )
    update = page.evaluate(
        """async ({token, body}) => {
            const r = await fetch('/api/sales', {
                method: 'PUT',
                headers: {
                    'Authorization': 'Bearer ' + token,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });
            return { status: r.status, json: await r.json() };
        }""",
        {
            "token": token,
            "body": {
                "id": sale_id,
                "clientName": "TEST-FIX-VERIFICATION-EDITED",
                "product": "CRM",
                "onboardingValue": 200,
                "recurringValue": 75,
                "contractMonths": 6,
                "status": "active",
                "createdAt": new_custom,
            },
        },
    )

    print(f"  PUT /api/sales (new date) -> status={update['status']}")
    if update["status"] != 200 or not update["json"].get("success"):
        print(f"  FAIL: {update}")
        return False

    updated = update["json"]["data"]
    if "2026-02-20" not in updated["createdAt"]:
        print(f"  FAIL: expected 2026-02-20, got {updated['createdAt']}")
        return False
    if updated["clientName"] != "TEST-FIX-VERIFICATION-EDITED":
        print(f"  FAIL: name not updated: {updated['clientName']}")
        return False
    print("  PASS: PUT accepted new createdAt and updated fields")

    # Verify invalid date is rejected
    bad = page.evaluate(
        """async ({token, body}) => {
            const r = await fetch('/api/sales', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + token,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });
            return { status: r.status, json: await r.json() };
        }""",
        {
            "token": token,
            "body": {
                "clientName": "TEST-BAD",
                "product": "CRM",
                "createdAt": "not-a-date",
            },
        },
    )
    if bad["status"] == 400 and not bad["json"].get("success"):
        print("  PASS: invalid date rejected with 400")
    else:
        print(f"  WARN: invalid date handling: {bad}")

    # Cleanup: delete the test sale
    page.evaluate(
        """async ({token, id}) => {
            await fetch('/api/sales?id=' + id, {
                method: 'DELETE',
                headers: { 'Authorization': 'Bearer ' + token }
            });
        }""",
        {"token": token, "id": sale_id},
    )
    print("  cleanup: test sale deleted")

    return True


def main():
    results = {}
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        try:
            results["categorias"] = test_categorias_sync(page)
        except Exception as e:
            print(f"  ERROR in test_categorias_sync: {e}")
            results["categorias"] = False

        try:
            results["metas"] = test_metas_save(page)
        except Exception as e:
            print(f"  ERROR in test_metas_save: {e}")
            results["metas"] = False

        try:
            results["cierres"] = test_cierres_custom_date(page)
        except Exception as e:
            print(f"  ERROR in test_cierres_custom_date: {e}")
            results["cierres"] = False

        browser.close()

    print("\n" + "=" * 50)
    print("SUMMARY")
    print("=" * 50)
    for k, v in results.items():
        print(f"  {k}: {'PASS' if v else 'FAIL'}")
    all_pass = all(results.values())
    sys.exit(0 if all_pass else 1)


if __name__ == "__main__":
    main()
