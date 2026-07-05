"""Seed initial data for Mangalore Store."""
import asyncio
import os
from pathlib import Path
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
import uuid
import bcrypt
from datetime import datetime, timezone

load_dotenv(Path(__file__).parent / ".env")
client = AsyncIOMotorClient(os.environ["MONGO_URL"])
db = client[os.environ["DB_NAME"]]

def uid(): return str(uuid.uuid4())
def now(): return datetime.now(timezone.utc).isoformat()
def hp(p): return bcrypt.hashpw(p.encode(), bcrypt.gensalt()).decode()

CATEGORIES = [
    {"name": "Fresh Vegetables", "slug": "vegetables", "icon": "Carrot", "image": "https://images.unsplash.com/photo-1566385101042-1a0aa0c1268c?w=600&q=80"},
    {"name": "Fresh Fruits", "slug": "fruits", "icon": "Apple", "image": "https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=600&q=80"},
    {"name": "Dairy & Eggs", "slug": "dairy", "icon": "Milk", "image": "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&q=80"},
    {"name": "Spices & Masalas", "slug": "spices", "icon": "Flame", "image": "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600&q=80"},
    {"name": "Rice & Grains", "slug": "grains", "icon": "Wheat", "image": "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&q=80"},
    {"name": "Snacks", "slug": "snacks", "icon": "Cookie", "image": "https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=600&q=80"},
    {"name": "Beverages", "slug": "beverages", "icon": "Coffee", "image": "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=600&q=80"},
    {"name": "Bakery", "slug": "bakery", "icon": "Croissant", "image": "https://images.unsplash.com/photo-1608198093002-ad4e005484ec?w=600&q=80"},
]

PRODUCTS_TEMPLATE = [
    ("vegetables", [
        ("Organic Tomatoes", 45, 60, "1 kg", "https://images.unsplash.com/photo-1546470427-e5ac89b9a2d0?w=600&q=80", True, True, False),
        ("Fresh Spinach", 30, 40, "500 g bunch", "https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=600&q=80", False, True, True),
        ("Green Capsicum", 60, 80, "500 g", "https://images.unsplash.com/photo-1594282486552-05b4d80fbb9f?w=600&q=80", False, False, False),
        ("Baby Potatoes", 55, 70, "1 kg", "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600&q=80", True, False, False),
        ("Red Onions", 35, 45, "1 kg", "https://images.unsplash.com/photo-1580201092675-a0a6a6cafbb1?w=600&q=80", False, False, False),
        ("Fresh Carrots", 40, 55, "500 g", "https://images.unsplash.com/photo-1445282768818-728615cc910a?w=600&q=80", False, True, False),
    ]),
    ("fruits", [
        ("Kashmiri Apples", 180, 220, "1 kg", "https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=600&q=80", True, True, True),
        ("Alphonso Mangoes", 550, 700, "6 pieces", "https://images.unsplash.com/photo-1553279768-865429fa0078?w=600&q=80", True, True, False),
        ("Ripe Bananas", 55, 70, "1 dozen", "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=600&q=80", False, False, False),
        ("Seedless Grapes", 120, 150, "500 g", "https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=600&q=80", False, True, False),
        ("Sweet Oranges", 90, 120, "1 kg", "https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?w=600&q=80", False, False, True),
    ]),
    ("dairy", [
        ("Farm Fresh Milk", 60, 68, "1 litre", "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=600&q=80", True, False, False),
        ("Amul Butter", 55, 60, "100 g", "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=600&q=80", False, True, False),
        ("Greek Yogurt", 89, 110, "400 g", "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&q=80", False, False, False),
        ("Farm Eggs", 84, 96, "12 pieces", "https://images.unsplash.com/photo-1518569656558-1f25e69d93d7?w=600&q=80", True, True, True),
        ("Paneer", 95, 120, "200 g", "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=600&q=80", False, False, False),
    ]),
    ("spices", [
        ("Turmeric Powder", 65, 85, "200 g", "https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=600&q=80", True, False, False),
        ("Kashmiri Chilli", 145, 180, "200 g", "https://images.unsplash.com/photo-1583663538852-8b47c8bd8ec3?w=600&q=80", False, True, False),
        ("Cumin Seeds", 95, 120, "100 g", "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600&q=80", False, False, False),
        ("Garam Masala", 110, 145, "100 g", "https://images.unsplash.com/photo-1598515213692-5f252f75d785?w=600&q=80", True, True, True),
    ]),
    ("grains", [
        ("Basmati Rice", 320, 400, "5 kg", "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&q=80", True, True, False),
        ("Whole Wheat Atta", 280, 340, "5 kg", "https://images.unsplash.com/photo-1568254183919-78a4f43a2877?w=600&q=80", False, False, False),
        ("Toor Dal", 165, 195, "1 kg", "https://images.unsplash.com/photo-1596797038530-2c107229654b?w=600&q=80", False, True, True),
        ("Quinoa", 380, 450, "500 g", "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&q=80", True, False, False),
    ]),
    ("snacks", [
        ("Mixed Namkeen", 95, 120, "400 g", "https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=600&q=80", False, True, False),
        ("Roasted Almonds", 550, 650, "500 g", "https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=600&q=80", True, True, True),
        ("Dark Chocolate", 220, 275, "150 g", "https://images.unsplash.com/photo-1548907040-4d42bea0d155?w=600&q=80", False, False, False),
    ]),
    ("beverages", [
        ("Assam Black Tea", 245, 300, "500 g", "https://images.unsplash.com/photo-1594631252845-29fc4cc8cde9?w=600&q=80", True, True, False),
        ("Filter Coffee", 320, 400, "500 g", "https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=600&q=80", False, False, False),
        ("Cold Pressed Juice", 149, 180, "1 litre", "https://images.unsplash.com/photo-1622597467836-f3285f2131b8?w=600&q=80", False, True, False),
    ]),
    ("bakery", [
        ("Sourdough Loaf", 180, 220, "500 g", "https://images.unsplash.com/photo-1608198093002-ad4e005484ec?w=600&q=80", True, True, True),
        ("Multigrain Bread", 65, 80, "400 g", "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&q=80", False, False, False),
        ("Butter Croissants", 145, 175, "4 pieces", "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600&q=80", True, False, False),
    ]),
]

async def seed():
    # Reset
    await db.categories.delete_many({})
    await db.products.delete_many({})
    await db.stores.delete_many({})
    await db.coupons.delete_many({})
    await db.banners.delete_many({})
    await db.seller_profiles.delete_many({})
    await db.payouts.delete_many({})
    # Keep users so re-seeding doesn't break credentials
    slug_to_id = {}
    for c in CATEGORIES:
        c2 = {"id": uid(), **c}
        slug_to_id[c["slug"]] = (c2["id"], c["name"])
        await db.categories.insert_one(c2)

    # Users (upsert) - includes sellers
    demo_accounts = [
        ("admin@mangalorestore.com", "Store Admin", "admin", "Admin@123"),
        ("super@emergent.com", "Super Admin", "super_admin", "Super@123"),
        ("customer@test.com", "Priya Shetty", "customer", "Test@1234"),
        ("house@mangalorestore.com", "Mangalore Store (House)", "seller", "House@123"),
        ("seller1@mangalore.com", "Ravi Kamath", "seller", "Seller@123"),
        ("seller2@mangalore.com", "Anjali Rao", "seller", "Seller@123"),
    ]
    email_to_id = {}
    for email, name, role, pw in demo_accounts:
        existing = await db.users.find_one({"email": email})
        if existing:
            email_to_id[email] = existing["id"]
            # Ensure role is up-to-date (in case of previous seed)
            await db.users.update_one({"email": email}, {"$set": {"role": role, "name": name}})
        else:
            uid_ = uid()
            email_to_id[email] = uid_
            await db.users.insert_one({
                "id": uid_, "email": email, "name": name, "role": role,
                "password_hash": hp(pw), "created_at": now(),
            })

    # Seller profiles (idempotent upsert)
    seller_profiles = [
        {
            "user_email": "house@mangalorestore.com",
            "store_name": "Mangalore Store (House)",
            "phone": "+91 98450 00000",
            "description": "Official Mangalore Store house brand — everyday essentials sourced directly.",
            "logo": "https://images.unsplash.com/photo-1566385101042-1a0aa0c1268c?w=200&q=80",
            "commission_rate": 0.0,
        },
        {
            "user_email": "seller1@mangalore.com",
            "store_name": "Coastal Farms Co.",
            "phone": "+91 98450 12345",
            "description": "A family-run collective of Dakshina Kannada farmers bringing you seasonal vegetables & fruits.",
            "logo": "https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=200&q=80",
            "commission_rate": 10.0,
        },
        {
            "user_email": "seller2@mangalore.com",
            "store_name": "Konkan Spices & Masalas",
            "phone": "+91 98450 67890",
            "description": "Traditional stone-ground spices from the Konkan coast, no preservatives, no fillers.",
            "logo": "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=200&q=80",
            "commission_rate": 12.0,
        },
    ]
    email_to_seller_meta = {}
    for sp in seller_profiles:
        uid_ = email_to_id[sp["user_email"]]
        prof = {
            "id": uid(),
            "user_id": uid_,
            "store_name": sp["store_name"],
            "phone": sp["phone"],
            "description": sp["description"],
            "logo": sp["logo"],
            "commission_rate": sp["commission_rate"],
            "bank_account_name": sp["store_name"],
            "bank_account_number": "XXXX-XXXX-1234",
            "bank_ifsc": "HDFC0001234",
            "status": "active",
            "created_at": now(),
        }
        await db.seller_profiles.insert_one(prof)
        email_to_seller_meta[sp["user_email"]] = (uid_, sp["store_name"])

    # Assign sellers to product slugs
    # Vegetables & fruits -> Coastal Farms, spices -> Konkan Spices, others -> House
    slug_to_seller_email = {
        "vegetables": "seller1@mangalore.com",
        "fruits": "seller1@mangalore.com",
        "spices": "seller2@mangalore.com",
        "dairy": "house@mangalorestore.com",
        "grains": "house@mangalorestore.com",
        "snacks": "house@mangalorestore.com",
        "beverages": "house@mangalorestore.com",
        "bakery": "house@mangalorestore.com",
    }

    for slug, prods in PRODUCTS_TEMPLATE:
        cid, cname = slug_to_id[slug]
        seller_email = slug_to_seller_email.get(slug, "house@mangalorestore.com")
        seller_user_id, seller_store_name = email_to_seller_meta[seller_email]
        for name, price, mrp, unit, img, featured, trending, flash in prods:
            p = {
                "id": uid(),
                "name": name,
                "slug": name.lower().replace(" ", "-"),
                "description": f"Premium {name.lower()} sourced fresh from local farms. Perfect for your everyday kitchen essentials.",
                "highlights": ["Farm fresh", "Hand-picked quality", "Delivered chilled", "Best price guaranteed"],
                "price": float(price),
                "mrp": float(mrp),
                "category_id": cid,
                "category_name": cname,
                "brand": "Mangalore Fresh",
                "sku": f"SKU-{uid()[:8].upper()}",
                "unit": unit,
                "stock": 100,
                "images": [img],
                "rating": 4.5,
                "review_count": 24,
                "tags": [slug, name.split()[0].lower()],
                "is_featured": featured,
                "is_trending": trending,
                "is_flash_sale": flash,
                "seller_id": seller_user_id,
                "seller_store_name": seller_store_name,
                "created_at": now(),
            }
            await db.products.insert_one(p)

    # Coupons
    coupons = [
        {"id": uid(), "code": "FRESH10", "discount_pct": 10, "max_discount": 200, "min_order": 299, "active": True},
        {"id": uid(), "code": "MANGALORE20", "discount_pct": 20, "max_discount": 500, "min_order": 999, "active": True},
        {"id": uid(), "code": "WELCOME50", "discount_pct": 15, "max_discount": 150, "min_order": 199, "active": True},
    ]
    for c in coupons:
        await db.coupons.insert_one(c)

    # Migrate any orders lacking seller_id on items: attribute to house seller
    house_seller_id, house_store_name = email_to_seller_meta["house@mangalorestore.com"]
    async for o in db.orders.find({}):
        changed = False
        for it in o.get("items", []):
            if "seller_id" not in it or not it.get("seller_id"):
                # Lookup product to find current seller
                pr = await db.products.find_one({"id": it.get("product_id")}, {"_id": 0})
                it["seller_id"] = pr.get("seller_id") if pr else house_seller_id
                it["seller_store_name"] = pr.get("seller_store_name") if pr else house_store_name
                it.setdefault("fulfillment_status", "pending")
                changed = True
        if changed:
            await db.orders.update_one({"id": o["id"]}, {"$set": {"items": o["items"]}})

    # Stores (multi-tenant demo)
    stores = [
        {"id": uid(), "name": "Mangalore Store", "slug": "mangalore-store", "vertical": "grocery", "domain": "mangalorestore.com", "plan": "enterprise", "status": "active", "theme": "earthy", "owner_email": "admin@mangalorestore.com", "created_at": now()},
        {"id": uid(), "name": "Bombay Fashion Hub", "slug": "bombay-fashion", "vertical": "fashion", "domain": "bombayfashion.in", "plan": "growth", "status": "active", "theme": "modern", "owner_email": "owner@bombayfashion.in", "created_at": now()},
        {"id": uid(), "name": "Delhi Pharma Direct", "slug": "delhi-pharma", "vertical": "pharmacy", "domain": "delhipharma.com", "plan": "starter", "status": "trial", "theme": "clinical", "owner_email": "hello@delhipharma.com", "created_at": now()},
    ]
    for s in stores:
        await db.stores.insert_one(s)

    # Banners
    await db.banners.insert_many([
        {"id": uid(), "title": "Farm-Fresh Groceries in 30 Minutes", "subtitle": "Sourced daily from local Mangalore farmers", "image": "https://images.unsplash.com/photo-1566385101042-1a0aa0c1268c?w=1600&q=80", "cta": "Shop Now", "link": "/products"},
    ])

    print("Seed complete.")

if __name__ == "__main__":
    asyncio.run(seed())
