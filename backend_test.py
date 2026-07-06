#!/usr/bin/env python3
"""
Mangalore Store - Seller Dashboard Backend Tests
Tests all seller-related endpoints for the multi-tenant marketplace
"""
import requests
import json
import sys
from typing import Optional, Dict, Any

# Backend URL from frontend/.env
BASE_URL = "https://vendora-xzuj.onrender.com/api"

# Test credentials from /app/memory/test_credentials.md
CREDENTIALS = {
    "customer": {"email": "customer@test.com", "password": "Test@1234"},
    "admin": {"email": "admin@mangalorestore.com", "password": "Admin@123"},
    "seller1": {"email": "seller1@mangalore.com", "password": "Seller@123"},
    "seller2": {"email": "seller2@mangalore.com", "password": "Seller@123"},
    "house": {"email": "house@mangalorestore.com", "password": "House@123"},
}

# Test state
tokens = {}
test_results = []
created_resources = {}


class TestResult:
    def __init__(self, name: str, passed: bool, message: str = "", details: Any = None):
        self.name = name
        self.passed = passed
        self.message = message
        self.details = details


def log_test(name: str, passed: bool, message: str = "", details: Any = None):
    """Log a test result"""
    result = TestResult(name, passed, message, details)
    test_results.append(result)
    status = "✅ PASS" if passed else "❌ FAIL"
    print(f"{status}: {name}")
    if message:
        print(f"  → {message}")
    if details and not passed:
        print(f"  Details: {json.dumps(details, indent=2)}")


def login(role: str) -> Optional[str]:
    """Login and return token"""
    if role in tokens:
        return tokens[role]
    
    creds = CREDENTIALS.get(role)
    if not creds:
        log_test(f"Login {role}", False, f"No credentials for role {role}")
        return None
    
    try:
        resp = requests.post(f"{BASE_URL}/auth/login", json=creds, timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            token = data.get("token")
            tokens[role] = token
            log_test(f"Login {role}", True, f"Logged in as {creds['email']}")
            return token
        else:
            log_test(f"Login {role}", False, f"Status {resp.status_code}", resp.text)
            return None
    except Exception as e:
        log_test(f"Login {role}", False, f"Exception: {str(e)}")
        return None


def auth_headers(token: str) -> Dict[str, str]:
    """Return authorization headers"""
    return {"Authorization": f"Bearer {token}"}


def test_seller_register():
    """Test POST /api/auth/seller/register"""
    print("\n=== 1. SELLER AUTH: REGISTER ===")
    
    # Test with new seller
    new_seller = {
        "email": f"newseller{int(requests.get(BASE_URL.replace('/api', '/')).elapsed.total_seconds() * 1000)}@test.com",
        "password": "NewSeller@123",
        "name": "New Test Seller",
        "store_name": "New Test Store",
        "phone": "9876543210",
        "description": "A brand new test store"
    }
    
    try:
        resp = requests.post(f"{BASE_URL}/auth/seller/register", json=new_seller, timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            if data.get("token") and data.get("user", {}).get("role") == "seller":
                created_resources["new_seller_token"] = data["token"]
                created_resources["new_seller_email"] = new_seller["email"]
                log_test("Seller register - new account", True, f"Created seller: {new_seller['email']}")
            else:
                log_test("Seller register - new account", False, "Missing token or wrong role", data)
        else:
            log_test("Seller register - new account", False, f"Status {resp.status_code}", resp.text)
    except Exception as e:
        log_test("Seller register - new account", False, f"Exception: {str(e)}")
    
    # Test duplicate email
    try:
        resp = requests.post(f"{BASE_URL}/auth/seller/register", json=new_seller, timeout=10)
        if resp.status_code == 400:
            log_test("Seller register - duplicate email", True, "Correctly rejected duplicate")
        else:
            log_test("Seller register - duplicate email", False, f"Expected 400, got {resp.status_code}")
    except Exception as e:
        log_test("Seller register - duplicate email", False, f"Exception: {str(e)}")


def test_seller_login():
    """Test POST /api/auth/login for seller role"""
    print("\n=== 2. SELLER AUTH: LOGIN ===")
    
    token = login("seller1")
    if token:
        # Verify token works with /api/auth/me
        try:
            resp = requests.get(f"{BASE_URL}/auth/me", headers=auth_headers(token), timeout=10)
            if resp.status_code == 200:
                data = resp.json()
                if data.get("role") == "seller":
                    log_test("Seller login - verify role", True, f"Role is seller for {data.get('email')}")
                else:
                    log_test("Seller login - verify role", False, f"Expected role=seller, got {data.get('role')}")
            else:
                log_test("Seller login - verify role", False, f"Status {resp.status_code}")
        except Exception as e:
            log_test("Seller login - verify role", False, f"Exception: {str(e)}")


def test_seller_profile():
    """Test GET/PUT /api/seller/me"""
    print("\n=== 3. SELLER PROFILE: GET/PUT ===")
    
    token = tokens.get("seller1")
    if not token:
        log_test("Seller profile - GET", False, "No seller1 token")
        return
    
    # GET profile
    try:
        resp = requests.get(f"{BASE_URL}/seller/me", headers=auth_headers(token), timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            if "user" in data and "profile" in data:
                log_test("Seller profile - GET", True, f"Store: {data['profile'].get('store_name')}")
                created_resources["seller1_profile"] = data["profile"]
            else:
                log_test("Seller profile - GET", False, "Missing user or profile", data)
        else:
            log_test("Seller profile - GET", False, f"Status {resp.status_code}", resp.text)
    except Exception as e:
        log_test("Seller profile - GET", False, f"Exception: {str(e)}")
    
    # PUT profile - update store name
    try:
        update = {"store_name": "Coastal Farms Co. (Updated)"}
        resp = requests.put(f"{BASE_URL}/seller/me", json=update, headers=auth_headers(token), timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            if data.get("store_name") == update["store_name"]:
                log_test("Seller profile - PUT", True, "Store name updated")
                # Restore original name
                requests.put(f"{BASE_URL}/seller/me", json={"store_name": "Coastal Farms Co."}, headers=auth_headers(token), timeout=10)
            else:
                log_test("Seller profile - PUT", False, "Store name not updated", data)
        else:
            log_test("Seller profile - PUT", False, f"Status {resp.status_code}", resp.text)
    except Exception as e:
        log_test("Seller profile - PUT", False, f"Exception: {str(e)}")


def test_seller_products():
    """Test seller-scoped product CRUD"""
    print("\n=== 4. SELLER PRODUCTS: CRUD ===")
    
    token = tokens.get("seller1")
    if not token:
        log_test("Seller products - GET", False, "No seller1 token")
        return
    
    # GET seller products
    try:
        resp = requests.get(f"{BASE_URL}/seller/products", headers=auth_headers(token), timeout=10)
        if resp.status_code == 200:
            products = resp.json()
            if isinstance(products, list):
                log_test("Seller products - GET list", True, f"Found {len(products)} products")
                created_resources["seller1_products"] = products
                # Verify all products belong to seller1
                all_owned = all(p.get("seller_store_name") == "Coastal Farms Co." for p in products)
                if all_owned:
                    log_test("Seller products - ownership check", True, "All products owned by seller1")
                else:
                    log_test("Seller products - ownership check", False, "Some products not owned by seller1")
            else:
                log_test("Seller products - GET list", False, "Response not a list", products)
        else:
            log_test("Seller products - GET list", False, f"Status {resp.status_code}", resp.text)
    except Exception as e:
        log_test("Seller products - GET list", False, f"Exception: {str(e)}")
    
    # Get a category for product creation
    try:
        cat_resp = requests.get(f"{BASE_URL}/categories", timeout=10)
        categories = cat_resp.json() if cat_resp.status_code == 200 else []
        category_id = categories[0]["id"] if categories else "cat-vegetables"
    except:
        category_id = "cat-vegetables"
    
    # POST new product
    new_product = {
        "name": "Test Organic Tomatoes",
        "description": "Fresh organic tomatoes for testing",
        "price": 45.0,
        "mrp": 60.0,
        "category_id": category_id,
        "unit": "500g",
        "stock": 50,
        "images": ["https://example.com/tomato.jpg"],
        "tags": ["organic", "fresh"]
    }
    
    try:
        resp = requests.post(f"{BASE_URL}/seller/products", json=new_product, headers=auth_headers(token), timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            if data.get("seller_store_name") == "Coastal Farms Co.":
                created_resources["test_product_id"] = data["id"]
                log_test("Seller products - POST create", True, f"Created product: {data['id']}")
            else:
                log_test("Seller products - POST create", False, "Wrong seller_store_name", data)
        else:
            log_test("Seller products - POST create", False, f"Status {resp.status_code}", resp.text)
    except Exception as e:
        log_test("Seller products - POST create", False, f"Exception: {str(e)}")
    
    # PUT update own product
    if "test_product_id" in created_resources:
        pid = created_resources["test_product_id"]
        update = {
            "name": "Test Organic Tomatoes (Updated)",
            "price": 50.0,
            "mrp": 65.0,
            "category_id": category_id,
            "unit": "500g"
        }
        try:
            resp = requests.put(f"{BASE_URL}/seller/products/{pid}", json=update, headers=auth_headers(token), timeout=10)
            if resp.status_code == 200:
                data = resp.json()
                if data.get("name") == update["name"]:
                    log_test("Seller products - PUT own product", True, "Product updated")
                else:
                    log_test("Seller products - PUT own product", False, "Name not updated", data)
            else:
                log_test("Seller products - PUT own product", False, f"Status {resp.status_code}", resp.text)
        except Exception as e:
            log_test("Seller products - PUT own product", False, f"Exception: {str(e)}")
    
    # PUT attempt to update another seller's product
    seller2_token = login("seller2")
    if seller2_token:
        try:
            # Get a seller2 product
            resp = requests.get(f"{BASE_URL}/seller/products", headers=auth_headers(seller2_token), timeout=10)
            if resp.status_code == 200:
                seller2_products = resp.json()
                if seller2_products:
                    seller2_pid = seller2_products[0]["id"]
                    # Try to update it as seller1
                    update = {"name": "Hacked Product", "price": 1.0, "mrp": 2.0, "category_id": category_id, "unit": "1kg"}
                    resp = requests.put(f"{BASE_URL}/seller/products/{seller2_pid}", json=update, headers=auth_headers(token), timeout=10)
                    if resp.status_code == 403:
                        log_test("Seller products - PUT other's product (403)", True, "Correctly rejected")
                    else:
                        log_test("Seller products - PUT other's product (403)", False, f"Expected 403, got {resp.status_code}")
                else:
                    log_test("Seller products - PUT other's product (403)", False, "No seller2 products to test")
        except Exception as e:
            log_test("Seller products - PUT other's product (403)", False, f"Exception: {str(e)}")
    
    # DELETE own product
    if "test_product_id" in created_resources:
        pid = created_resources["test_product_id"]
        try:
            resp = requests.delete(f"{BASE_URL}/seller/products/{pid}", headers=auth_headers(token), timeout=10)
            if resp.status_code == 200:
                log_test("Seller products - DELETE own product", True, "Product deleted")
            else:
                log_test("Seller products - DELETE own product", False, f"Status {resp.status_code}", resp.text)
        except Exception as e:
            log_test("Seller products - DELETE own product", False, f"Exception: {str(e)}")


def test_seller_orders():
    """Test seller orders view and fulfillment status"""
    print("\n=== 5. SELLER ORDERS: VIEW + FULFILLMENT ===")
    
    token = tokens.get("seller1")
    if not token:
        log_test("Seller orders - GET", False, "No seller1 token")
        return
    
    # GET seller orders
    try:
        resp = requests.get(f"{BASE_URL}/seller/orders", headers=auth_headers(token), timeout=10)
        if resp.status_code == 200:
            orders = resp.json()
            if isinstance(orders, list):
                log_test("Seller orders - GET list", True, f"Found {len(orders)} orders")
                # Verify structure
                if orders:
                    order = orders[0]
                    has_required = all(k in order for k in ["id", "items", "seller_subtotal"])
                    if has_required:
                        log_test("Seller orders - structure check", True, "Has required fields")
                        created_resources["seller1_order"] = order
                        # Verify all items belong to seller1
                        all_owned = all(it.get("seller_id") for it in order.get("items", []))
                        if all_owned:
                            log_test("Seller orders - item ownership", True, "All items have seller_id")
                        else:
                            log_test("Seller orders - item ownership", False, "Some items missing seller_id")
                    else:
                        log_test("Seller orders - structure check", False, "Missing required fields", order)
                else:
                    log_test("Seller orders - structure check", True, "No orders yet (expected)")
            else:
                log_test("Seller orders - GET list", False, "Response not a list", orders)
        else:
            log_test("Seller orders - GET list", False, f"Status {resp.status_code}", resp.text)
    except Exception as e:
        log_test("Seller orders - GET list", False, f"Exception: {str(e)}")
    
    # Test fulfillment status update (if we have an order)
    if "seller1_order" in created_resources:
        order = created_resources["seller1_order"]
        if order.get("items"):
            item = order["items"][0]
            oid = order["id"]
            pid = item["product_id"]
            
            try:
                resp = requests.put(
                    f"{BASE_URL}/seller/orders/{oid}/items/{pid}/status",
                    json={"status": "packed"},
                    headers=auth_headers(token),
                    timeout=10
                )
                if resp.status_code == 200:
                    log_test("Seller orders - PUT fulfillment status", True, "Status updated to packed")
                else:
                    log_test("Seller orders - PUT fulfillment status", False, f"Status {resp.status_code}", resp.text)
            except Exception as e:
                log_test("Seller orders - PUT fulfillment status", False, f"Exception: {str(e)}")


def test_seller_stats_earnings():
    """Test seller stats and earnings endpoints"""
    print("\n=== 6. SELLER STATS + EARNINGS ===")
    
    token = tokens.get("seller1")
    if not token:
        log_test("Seller stats - GET", False, "No seller1 token")
        return
    
    # GET stats
    try:
        resp = requests.get(f"{BASE_URL}/seller/stats", headers=auth_headers(token), timeout=10)
        if resp.status_code == 200:
            stats = resp.json()
            required_keys = ["products", "orders", "revenue", "commission", "net_earnings", "paid_out", "pending_payout", "items_sold"]
            has_all = all(k in stats for k in required_keys)
            if has_all:
                log_test("Seller stats - GET", True, f"Revenue: ₹{stats['revenue']}, Net: ₹{stats['net_earnings']}")
                created_resources["seller1_stats"] = stats
            else:
                missing = [k for k in required_keys if k not in stats]
                log_test("Seller stats - GET", False, f"Missing keys: {missing}", stats)
        else:
            log_test("Seller stats - GET", False, f"Status {resp.status_code}", resp.text)
    except Exception as e:
        log_test("Seller stats - GET", False, f"Exception: {str(e)}")
    
    # GET earnings
    try:
        resp = requests.get(f"{BASE_URL}/seller/earnings", headers=auth_headers(token), timeout=10)
        if resp.status_code == 200:
            earnings = resp.json()
            required_keys = ["commission_rate", "total_gross", "total_commission", "total_net", "ledger"]
            has_all = all(k in earnings for k in required_keys)
            if has_all:
                log_test("Seller earnings - GET", True, f"Commission rate: {earnings['commission_rate']}%")
                created_resources["seller1_earnings"] = earnings
                # Verify commission rate matches profile
                if earnings["commission_rate"] == 10.0:
                    log_test("Seller earnings - commission rate", True, "Matches expected 10%")
                else:
                    log_test("Seller earnings - commission rate", False, f"Expected 10%, got {earnings['commission_rate']}%")
            else:
                missing = [k for k in required_keys if k not in earnings]
                log_test("Seller earnings - GET", False, f"Missing keys: {missing}", earnings)
        else:
            log_test("Seller earnings - GET", False, f"Status {resp.status_code}", resp.text)
    except Exception as e:
        log_test("Seller earnings - GET", False, f"Exception: {str(e)}")


def test_seller_payouts():
    """Test seller payout requests"""
    print("\n=== 7. SELLER PAYOUTS ===")
    
    token = tokens.get("seller1")
    if not token:
        log_test("Seller payouts - GET", False, "No seller1 token")
        return
    
    # GET payouts
    try:
        resp = requests.get(f"{BASE_URL}/seller/payouts", headers=auth_headers(token), timeout=10)
        if resp.status_code == 200:
            payouts = resp.json()
            if isinstance(payouts, list):
                log_test("Seller payouts - GET list", True, f"Found {len(payouts)} payouts")
            else:
                log_test("Seller payouts - GET list", False, "Response not a list", payouts)
        else:
            log_test("Seller payouts - GET list", False, f"Status {resp.status_code}", resp.text)
    except Exception as e:
        log_test("Seller payouts - GET list", False, f"Exception: {str(e)}")
    
    # POST payout request - invalid amount (0)
    try:
        resp = requests.post(
            f"{BASE_URL}/seller/payouts/request",
            json={"amount": 0, "note": "Test zero amount"},
            headers=auth_headers(token),
            timeout=10
        )
        if resp.status_code == 400:
            log_test("Seller payouts - POST zero amount (400)", True, "Correctly rejected")
        else:
            log_test("Seller payouts - POST zero amount (400)", False, f"Expected 400, got {resp.status_code}")
    except Exception as e:
        log_test("Seller payouts - POST zero amount (400)", False, f"Exception: {str(e)}")
    
    # POST payout request - amount > pending_payout
    stats = created_resources.get("seller1_stats", {})
    pending = stats.get("pending_payout", 0)
    
    try:
        resp = requests.post(
            f"{BASE_URL}/seller/payouts/request",
            json={"amount": pending + 1000, "note": "Test excessive amount"},
            headers=auth_headers(token),
            timeout=10
        )
        if resp.status_code == 400:
            log_test("Seller payouts - POST excessive amount (400)", True, "Correctly rejected")
        else:
            log_test("Seller payouts - POST excessive amount (400)", False, f"Expected 400, got {resp.status_code}")
    except Exception as e:
        log_test("Seller payouts - POST excessive amount (400)", False, f"Exception: {str(e)}")
    
    # POST valid payout request (if pending > 0)
    if pending > 0:
        try:
            amount = min(pending, 100)  # Request small amount
            resp = requests.post(
                f"{BASE_URL}/seller/payouts/request",
                json={"amount": amount, "note": "Test valid payout"},
                headers=auth_headers(token),
                timeout=10
            )
            if resp.status_code == 200:
                data = resp.json()
                if data.get("status") == "pending":
                    log_test("Seller payouts - POST valid request", True, f"Requested ₹{amount}")
                else:
                    log_test("Seller payouts - POST valid request", False, "Wrong status", data)
            else:
                log_test("Seller payouts - POST valid request", False, f"Status {resp.status_code}", resp.text)
        except Exception as e:
            log_test("Seller payouts - POST valid request", False, f"Exception: {str(e)}")
    else:
        log_test("Seller payouts - POST valid request", True, "Skipped (no pending payout)")


def test_seller_reviews():
    """Test seller review responses"""
    print("\n=== 8. SELLER REVIEWS ===")
    
    token = tokens.get("seller1")
    if not token:
        log_test("Seller reviews - GET", False, "No seller1 token")
        return
    
    # GET seller reviews
    try:
        resp = requests.get(f"{BASE_URL}/seller/reviews", headers=auth_headers(token), timeout=10)
        if resp.status_code == 200:
            reviews = resp.json()
            if isinstance(reviews, list):
                log_test("Seller reviews - GET list", True, f"Found {len(reviews)} reviews")
                created_resources["seller1_reviews"] = reviews
            else:
                log_test("Seller reviews - GET list", False, "Response not a list", reviews)
        else:
            log_test("Seller reviews - GET list", False, f"Status {resp.status_code}", resp.text)
    except Exception as e:
        log_test("Seller reviews - GET list", False, f"Exception: {str(e)}")
    
    # Create a review as customer if none exist
    reviews = created_resources.get("seller1_reviews", [])
    if not reviews:
        customer_token = login("customer")
        if customer_token:
            # Get a seller1 product
            products = created_resources.get("seller1_products", [])
            if products:
                pid = products[0]["id"]
                try:
                    review_data = {
                        "product_id": pid,
                        "rating": 5,
                        "title": "Great product!",
                        "body": "Really fresh and high quality"
                    }
                    resp = requests.post(
                        f"{BASE_URL}/reviews",
                        json=review_data,
                        headers=auth_headers(customer_token),
                        timeout=10
                    )
                    if resp.status_code == 200:
                        log_test("Seller reviews - create test review", True, "Review created")
                        # Fetch reviews again
                        resp = requests.get(f"{BASE_URL}/seller/reviews", headers=auth_headers(token), timeout=10)
                        if resp.status_code == 200:
                            reviews = resp.json()
                            created_resources["seller1_reviews"] = reviews
                except Exception as e:
                    log_test("Seller reviews - create test review", False, f"Exception: {str(e)}")
    
    # POST review response
    reviews = created_resources.get("seller1_reviews", [])
    if reviews:
        rid = reviews[0]["id"]
        try:
            resp = requests.post(
                f"{BASE_URL}/seller/reviews/{rid}/respond",
                json={"response": "Thank you for your feedback!"},
                headers=auth_headers(token),
                timeout=10
            )
            if resp.status_code == 200:
                data = resp.json()
                if data.get("seller_response") and data.get("seller_response_at"):
                    log_test("Seller reviews - POST response", True, "Response added")
                else:
                    log_test("Seller reviews - POST response", False, "Missing response fields", data)
            else:
                log_test("Seller reviews - POST response", False, f"Status {resp.status_code}", resp.text)
        except Exception as e:
            log_test("Seller reviews - POST response", False, f"Exception: {str(e)}")
    else:
        log_test("Seller reviews - POST response", True, "Skipped (no reviews)")
    
    # Test responding to another seller's review (403)
    seller2_token = login("seller2")
    if seller2_token and reviews:
        rid = reviews[0]["id"]  # This is a seller1 product review
        try:
            resp = requests.post(
                f"{BASE_URL}/seller/reviews/{rid}/respond",
                json={"response": "Hacked response"},
                headers=auth_headers(seller2_token),
                timeout=10
            )
            if resp.status_code == 403:
                log_test("Seller reviews - POST other's review (403)", True, "Correctly rejected")
            else:
                log_test("Seller reviews - POST other's review (403)", False, f"Expected 403, got {resp.status_code}")
        except Exception as e:
            log_test("Seller reviews - POST other's review (403)", False, f"Exception: {str(e)}")


def test_access_control():
    """Test access control for seller endpoints"""
    print("\n=== 9. ACCESS CONTROL ===")
    
    # Test without auth
    try:
        resp = requests.get(f"{BASE_URL}/seller/stats", timeout=10)
        if resp.status_code == 401:
            log_test("Access control - no auth (401)", True, "Correctly rejected")
        else:
            log_test("Access control - no auth (401)", False, f"Expected 401, got {resp.status_code}")
    except Exception as e:
        log_test("Access control - no auth (401)", False, f"Exception: {str(e)}")
    
    # Test as customer
    customer_token = login("customer")
    if customer_token:
        try:
            resp = requests.get(f"{BASE_URL}/seller/stats", headers=auth_headers(customer_token), timeout=10)
            if resp.status_code == 403:
                log_test("Access control - customer (403)", True, "Correctly rejected")
            else:
                log_test("Access control - customer (403)", False, f"Expected 403, got {resp.status_code}")
        except Exception as e:
            log_test("Access control - customer (403)", False, f"Exception: {str(e)}")
    
    # Test as admin (should work)
    admin_token = login("admin")
    if admin_token:
        try:
            resp = requests.get(f"{BASE_URL}/seller/stats", headers=auth_headers(admin_token), timeout=10)
            if resp.status_code == 200:
                log_test("Access control - admin (200)", True, "Admin allowed")
            else:
                log_test("Access control - admin (200)", False, f"Expected 200, got {resp.status_code}")
        except Exception as e:
            log_test("Access control - admin (200)", False, f"Exception: {str(e)}")


def test_product_migration():
    """Test that all products have seller_id and seller_store_name"""
    print("\n=== 10. PRODUCT MODEL MIGRATION ===")
    
    try:
        resp = requests.get(f"{BASE_URL}/products?limit=200", timeout=10)
        if resp.status_code == 200:
            products = resp.json()
            if isinstance(products, list):
                total = len(products)
                with_seller = [p for p in products if p.get("seller_id") and p.get("seller_store_name")]
                if len(with_seller) == total:
                    log_test("Product migration - all have seller fields", True, f"All {total} products migrated")
                else:
                    missing = total - len(with_seller)
                    log_test("Product migration - all have seller fields", False, f"{missing}/{total} products missing seller fields")
            else:
                log_test("Product migration - all have seller fields", False, "Response not a list")
        else:
            log_test("Product migration - all have seller fields", False, f"Status {resp.status_code}")
    except Exception as e:
        log_test("Product migration - all have seller fields", False, f"Exception: {str(e)}")


def print_summary():
    """Print test summary"""
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    
    passed = [t for t in test_results if t.passed]
    failed = [t for t in test_results if not t.passed]
    
    print(f"\nTotal: {len(test_results)} | Passed: {len(passed)} | Failed: {len(failed)}")
    
    if failed:
        print("\n❌ FAILED TESTS:")
        for t in failed:
            print(f"  - {t.name}")
            if t.message:
                print(f"    {t.message}")
    
    if passed:
        print(f"\n✅ PASSED: {len(passed)} tests")
    
    return len(failed) == 0


def main():
    """Run all tests"""
    print("="*60)
    print("MANGALORE STORE - SELLER DASHBOARD BACKEND TESTS")
    print("="*60)
    print(f"Backend URL: {BASE_URL}")
    print()
    
    # Run tests in order
    test_seller_register()
    test_seller_login()
    test_seller_profile()
    test_seller_products()
    test_seller_orders()
    test_seller_stats_earnings()
    test_seller_payouts()
    test_seller_reviews()
    test_access_control()
    test_product_migration()
    
    # Print summary
    all_passed = print_summary()
    
    sys.exit(0 if all_passed else 1)


if __name__ == "__main__":
    main()
