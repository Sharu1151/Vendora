from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, status, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Any
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt as pyjwt
import stripe
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_SECRET = os.environ['JWT_SECRET']
JWT_ALGO = "HS256"
stripe.api_key = os.environ['STRIPE_SECRET_KEY']
STRIPE_WEBHOOK_SECRET = os.environ.get('STRIPE_WEBHOOK_SECRET', '')
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')

app = FastAPI(title="Mangalore Store API")
api = APIRouter(prefix="/api")
security = HTTPBearer(auto_error=False)


# ---------------- MODELS ----------------
def uid() -> str:
    return str(uuid.uuid4())


def now() -> str:
    return datetime.now(timezone.utc).isoformat()


class RegisterIn(BaseModel):
    email: EmailStr
    password: str
    name: str


class SellerRegisterIn(BaseModel):
    email: EmailStr
    password: str
    name: str
    store_name: str
    phone: str = ""
    description: str = ""


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: str
    email: str
    name: str
    role: str


class SellerProfile(BaseModel):
    id: str = Field(default_factory=uid)
    user_id: str
    store_name: str
    phone: str = ""
    description: str = ""
    logo: Optional[str] = None
    commission_rate: float = 10.0  # platform commission %
    bank_account_name: str = ""
    bank_account_number: str = ""
    bank_ifsc: str = ""
    status: str = "active"  # active | pending | suspended
    created_at: str = Field(default_factory=now)


class SellerProfileUpdate(BaseModel):
    store_name: Optional[str] = None
    phone: Optional[str] = None
    description: Optional[str] = None
    logo: Optional[str] = None
    bank_account_name: Optional[str] = None
    bank_account_number: Optional[str] = None
    bank_ifsc: Optional[str] = None


class Payout(BaseModel):
    id: str = Field(default_factory=uid)
    seller_id: str
    amount: float
    status: str = "pending"  # pending | processing | paid | rejected
    note: str = ""
    created_at: str = Field(default_factory=now)
    paid_at: Optional[str] = None


class ReviewResponseIn(BaseModel):
    response: str


class Category(BaseModel):
    id: str = Field(default_factory=uid)
    name: str
    slug: str
    image: Optional[str] = None
    icon: Optional[str] = None


class Product(BaseModel):
    id: str = Field(default_factory=uid)
    name: str
    slug: str
    description: str = ""
    highlights: List[str] = []
    price: float
    mrp: float
    category_id: str
    category_name: Optional[str] = ""
    brand: Optional[str] = ""
    sku: str
    unit: str = "1 unit"
    stock: int = 100
    images: List[str] = []
    rating: float = 4.5
    review_count: int = 0
    tags: List[str] = []
    is_featured: bool = False
    is_trending: bool = False
    is_flash_sale: bool = False
    seller_id: str = "house"
    seller_store_name: str = "Mangalore Store"
    created_at: str = Field(default_factory=now)


class ProductIn(BaseModel):
    name: str
    slug: Optional[str] = None
    description: str = ""
    highlights: List[str] = []
    price: float
    mrp: float
    category_id: str
    brand: str = ""
    sku: Optional[str] = None
    unit: str = "1 unit"
    stock: int = 100
    images: List[str] = []
    tags: List[str] = []
    is_featured: bool = False
    is_trending: bool = False
    is_flash_sale: bool = False


class CartItem(BaseModel):
    product_id: str
    qty: int = 1


class Address(BaseModel):
    id: str = Field(default_factory=uid)
    name: str
    phone: str
    line1: str
    line2: str = ""
    city: str
    state: str
    pincode: str
    country: str = "India"
    is_default: bool = False


class Coupon(BaseModel):
    id: str = Field(default_factory=uid)
    code: str
    discount_pct: int = 10
    max_discount: float = 100
    min_order: float = 199
    active: bool = True


class Review(BaseModel):
    id: str = Field(default_factory=uid)
    product_id: str
    user_id: str
    user_name: str
    rating: int
    title: str = ""
    body: str = ""
    seller_response: Optional[str] = None
    seller_response_at: Optional[str] = None
    created_at: str = Field(default_factory=now)


class Store(BaseModel):
    id: str = Field(default_factory=uid)
    name: str
    slug: str
    vertical: str = "grocery"
    domain: str = ""
    plan: str = "starter"
    status: str = "active"
    theme: str = "earthy"
    owner_email: str = ""
    created_at: str = Field(default_factory=now)


class CheckoutBody(BaseModel):
    items: List[CartItem]
    address_id: Optional[str] = None
    coupon_code: Optional[str] = None
    origin_url: str


# ---------------- AUTH HELPERS ----------------
def hash_pw(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()


def check_pw(pw: str, h: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode(), h.encode())
    except Exception:
        return False


def make_token(user_id: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(days=30),
    }
    return pyjwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGO)


async def current_user(creds: HTTPAuthorizationCredentials = Depends(security)):
    if not creds:
        raise HTTPException(401, "Not authenticated")
    try:
        data = pyjwt.decode(creds.credentials, JWT_SECRET, algorithms=[JWT_ALGO])
    except Exception:
        raise HTTPException(401, "Invalid token")
    user = await db.users.find_one({"id": data["sub"]}, {"_id": 0})
    if not user:
        raise HTTPException(401, "User not found")
    return user


async def require_admin(user=Depends(current_user)):
    if user["role"] not in ("admin", "super_admin"):
        raise HTTPException(403, "Admin only")
    return user


async def require_super(user=Depends(current_user)):
    if user["role"] != "super_admin":
        raise HTTPException(403, "Super admin only")
    return user


async def require_seller(user=Depends(current_user)):
    if user["role"] not in ("seller", "admin", "super_admin"):
        raise HTTPException(403, "Seller access required")
    return user


# ---------------- AUTH ROUTES ----------------
@api.post("/auth/register")
async def register(body: RegisterIn):
    if await db.users.find_one({"email": body.email.lower()}):
        raise HTTPException(400, "Email already registered")
    user = {
        "id": uid(),
        "email": body.email.lower(),
        "name": body.name,
        "password_hash": hash_pw(body.password),
        "role": "customer",
        "wallet": 0.0,
        "points": 0,
        "status": "active",
        "created_at": now(),
    }
    await db.users.insert_one(user)
    token = make_token(user["id"], user["role"])
    return {"token": token, "user": {"id": user["id"], "email": user["email"], "name": user["name"], "role": user["role"], "wallet": 0.0, "points": 0, "status": "active"}}


@api.post("/auth/seller/register")
async def seller_register(body: SellerRegisterIn):
    if await db.users.find_one({"email": body.email.lower()}):
        raise HTTPException(400, "Email already registered")
    user_id = uid()
    user = {
        "id": user_id,
        "email": body.email.lower(),
        "name": body.name,
        "password_hash": hash_pw(body.password),
        "role": "seller",
        "wallet": 0.0,
        "points": 0,
        "status": "active",
        "created_at": now(),
    }
    await db.users.insert_one(user)
    profile = SellerProfile(
        user_id=user_id,
        store_name=body.store_name,
        phone=body.phone,
        description=body.description,
    ).model_dump()
    await db.seller_profiles.insert_one(profile)
    token = make_token(user_id, "seller")
    return {"token": token, "user": {"id": user_id, "email": user["email"], "name": user["name"], "role": "seller", "wallet": 0.0, "points": 0, "status": "active"}}


@api.post("/auth/login")
async def login(body: LoginIn):
    user = await db.users.find_one({"email": body.email.lower()}, {"_id": 0})
    if not user or not check_pw(body.password, user["password_hash"]):
        raise HTTPException(401, "Invalid credentials")
    token = make_token(user["id"], user["role"])
    return {
        "token": token,
        "user": {
            "id": user["id"],
            "email": user["email"],
            "name": user["name"],
            "role": user["role"],
            "wallet": user.get("wallet", 0.0),
            "points": user.get("points", 0),
            "status": user.get("status", "active")
        }
    }


@api.get("/auth/me")
async def me(user=Depends(current_user)):
    return {
        "id": user["id"],
        "email": user["email"],
        "name": user["name"],
        "role": user["role"],
        "wallet": user.get("wallet", 0.0),
        "points": user.get("points", 0),
        "status": user.get("status", "active")
    }


# ---------------- CATEGORY ROUTES ----------------
@api.get("/categories")
async def list_categories():
    docs = await db.categories.find({}, {"_id": 0}).to_list(200)
    return docs


@api.post("/categories")
async def create_category(cat: Category, _=Depends(require_admin)):
    doc = cat.model_dump()
    await db.categories.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api.delete("/categories/{cid}")
async def delete_category(cid: str, _=Depends(require_admin)):
    await db.categories.delete_one({"id": cid})
    return {"ok": True}


# ---------------- PRODUCT ROUTES ----------------
@api.get("/products")
async def list_products(
    q: Optional[str] = None,
    category_id: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    sort: Optional[str] = None,
    featured: Optional[bool] = None,
    trending: Optional[bool] = None,
    flash: Optional[bool] = None,
    limit: int = 60,
):
    query: dict = {}
    if q:
        query["$or"] = [
            {"name": {"$regex": q, "$options": "i"}},
            {"description": {"$regex": q, "$options": "i"}},
            {"tags": {"$regex": q, "$options": "i"}},
        ]
    if category_id:
        query["category_id"] = category_id
    if min_price is not None or max_price is not None:
        query["price"] = {}
        if min_price is not None:
            query["price"]["$gte"] = min_price
        if max_price is not None:
            query["price"]["$lte"] = max_price
    if featured:
        query["is_featured"] = True
    if trending:
        query["is_trending"] = True
    if flash:
        query["is_flash_sale"] = True
    cursor = db.products.find(query, {"_id": 0}).limit(limit)
    if sort == "price_asc":
        cursor = cursor.sort("price", 1)
    elif sort == "price_desc":
        cursor = cursor.sort("price", -1)
    elif sort == "rating":
        cursor = cursor.sort("rating", -1)
    elif sort == "latest":
        cursor = cursor.sort("created_at", -1)
    return await cursor.to_list(limit)


@api.get("/products/{pid}")
async def get_product(pid: str):
    p = await db.products.find_one({"id": pid}, {"_id": 0})
    if not p:
        raise HTTPException(404, "Not found")
    return p


@api.post("/products")
async def create_product(body: ProductIn, _=Depends(require_admin)):
    cat = await db.categories.find_one({"id": body.category_id}, {"_id": 0})
    prod = Product(
        **body.model_dump(exclude_none=True),
        slug=body.slug or body.name.lower().replace(" ", "-"),
        sku=body.sku or f"SKU-{uid()[:8].upper()}",
        category_name=cat["name"] if cat else "",
    )
    doc = prod.model_dump()
    await db.products.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api.put("/products/{pid}")
async def update_product(pid: str, body: ProductIn, _=Depends(require_admin)):
    update = body.model_dump(exclude_none=True)
    cat = await db.categories.find_one({"id": body.category_id}, {"_id": 0})
    if cat:
        update["category_name"] = cat["name"]
    await db.products.update_one({"id": pid}, {"$set": update})
    return await db.products.find_one({"id": pid}, {"_id": 0})


@api.delete("/products/{pid}")
async def delete_product(pid: str, _=Depends(require_admin)):
    await db.products.delete_one({"id": pid})
    return {"ok": True}


# ---------------- AI DESCRIPTION ----------------
class AIDescBody(BaseModel):
    name: str
    category: str = ""
    tags: List[str] = []


@api.post("/ai/describe")
async def ai_describe(body: AIDescBody, _=Depends(require_admin)):
    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"desc-{uid()}",
        system_message="You are a marketing copywriter for a premium grocery store called Mangalore Store. Write vivid, appetizing product descriptions in 2-3 short sentences plus 4 crisp bullet highlights. Return JSON with keys: description (string), highlights (array of 4 short strings).",
    ).with_model("anthropic", "claude-sonnet-4-6")
    msg = UserMessage(text=f"Product: {body.name}\nCategory: {body.category}\nTags: {', '.join(body.tags)}\n\nReturn only valid JSON.")
    text = ""
    try:
        from emergentintegrations.llm.chat import TextDelta, StreamDone
        async for ev in chat.stream_message(msg):
            if isinstance(ev, TextDelta):
                text += ev.content
            elif isinstance(ev, StreamDone):
                break
    except Exception as e:
        raise HTTPException(500, f"AI error: {e}")
    import json as _json, re
    try:
        m = re.search(r"\{[\s\S]*\}", text)
        data = _json.loads(m.group(0)) if m else {"description": text, "highlights": []}
    except Exception:
        data = {"description": text, "highlights": []}
    return data


# ---------------- CART (server-side, per user) ----------------
@api.get("/cart")
async def get_cart(user=Depends(current_user)):
    cart = await db.carts.find_one({"user_id": user["id"]}, {"_id": 0}) or {"user_id": user["id"], "items": []}
    items_full = []
    for it in cart.get("items", []):
        p = await db.products.find_one({"id": it["product_id"]}, {"_id": 0})
        if p:
            items_full.append({"product": p, "qty": it["qty"]})
    subtotal = sum(x["product"]["price"] * x["qty"] for x in items_full)
    return {"items": items_full, "subtotal": subtotal}


@api.post("/cart/add")
async def cart_add(item: CartItem, user=Depends(current_user)):
    cart = await db.carts.find_one({"user_id": user["id"]}) or {"user_id": user["id"], "items": []}
    items = cart.get("items", [])
    found = False
    for it in items:
        if it["product_id"] == item.product_id:
            it["qty"] += item.qty
            found = True
            break
    if not found:
        items.append({"product_id": item.product_id, "qty": item.qty})
    await db.carts.update_one({"user_id": user["id"]}, {"$set": {"items": items}}, upsert=True)
    return {"ok": True}


@api.post("/cart/update")
async def cart_update(item: CartItem, user=Depends(current_user)):
    cart = await db.carts.find_one({"user_id": user["id"]}) or {"user_id": user["id"], "items": []}
    items = [it for it in cart.get("items", []) if it["product_id"] != item.product_id]
    if item.qty > 0:
        items.append({"product_id": item.product_id, "qty": item.qty})
    await db.carts.update_one({"user_id": user["id"]}, {"$set": {"items": items}}, upsert=True)
    return {"ok": True}


@api.post("/cart/clear")
async def cart_clear(user=Depends(current_user)):
    await db.carts.update_one({"user_id": user["id"]}, {"$set": {"items": []}}, upsert=True)
    return {"ok": True}


# ---------------- WISHLIST ----------------
@api.get("/wishlist")
async def wishlist(user=Depends(current_user)):
    w = await db.wishlists.find_one({"user_id": user["id"]}, {"_id": 0}) or {"items": []}
    prods = []
    for pid in w.get("items", []):
        p = await db.products.find_one({"id": pid}, {"_id": 0})
        if p:
            prods.append(p)
    return prods


@api.post("/wishlist/toggle")
async def wishlist_toggle(body: dict, user=Depends(current_user)):
    pid = body["product_id"]
    w = await db.wishlists.find_one({"user_id": user["id"]}) or {"user_id": user["id"], "items": []}
    items = w.get("items", [])
    if pid in items:
        items.remove(pid)
    else:
        items.append(pid)
    await db.wishlists.update_one({"user_id": user["id"]}, {"$set": {"items": items}}, upsert=True)
    return {"in_wishlist": pid in items}


# ---------------- ADDRESSES ----------------
@api.get("/addresses")
async def list_addresses(user=Depends(current_user)):
    docs = await db.addresses.find({"user_id": user["id"]}, {"_id": 0}).to_list(50)
    return docs


@api.post("/addresses")
async def add_address(addr: Address, user=Depends(current_user)):
    doc = addr.model_dump()
    doc["user_id"] = user["id"]
    if doc.get("is_default"):
        await db.addresses.update_many({"user_id": user["id"]}, {"$set": {"is_default": False}})
    await db.addresses.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api.put("/addresses/{aid}")
async def edit_address(aid: str, addr: Address, user=Depends(current_user)):
    doc = addr.model_dump()
    doc.pop("id", None)
    doc["user_id"] = user["id"]
    if doc.get("is_default"):
        await db.addresses.update_many({"user_id": user["id"]}, {"$set": {"is_default": False}})
    await db.addresses.update_one({"user_id": user["id"], "id": aid}, {"$set": doc})
    return {"id": aid, **doc}


@api.put("/addresses/{aid}/default")
async def set_default_address(aid: str, user=Depends(current_user)):
    await db.addresses.update_many({"user_id": user["id"]}, {"$set": {"is_default": False}})
    await db.addresses.update_one({"user_id": user["id"], "id": aid}, {"$set": {"is_default": True}})
    return {"ok": True}


@api.delete("/addresses/{aid}")
async def del_address(aid: str, user=Depends(current_user)):
    await db.addresses.delete_one({"user_id": user["id"], "id": aid})
    return {"ok": True}


# ---------------- COUPONS ----------------
@api.get("/coupons")
async def list_coupons():
    return await db.coupons.find({"active": True}, {"_id": 0}).to_list(50)


@api.post("/coupons")
async def create_coupon(c: Coupon, _=Depends(require_admin)):
    await db.coupons.insert_one(c.model_dump())
    return c


@api.post("/coupons/apply")
async def apply_coupon(body: dict, user=Depends(current_user)):
    code = body.get("code", "").upper()
    subtotal = float(body.get("subtotal", 0))
    c = await db.coupons.find_one({"code": code, "active": True}, {"_id": 0})
    if not c:
        raise HTTPException(404, "Invalid coupon")
    if subtotal < c["min_order"]:
        raise HTTPException(400, f"Minimum order ₹{c['min_order']}")
    disc = min(subtotal * c["discount_pct"] / 100, c["max_discount"])
    return {"discount": round(disc, 2), "coupon": c}


# ---------------- REVIEWS ----------------
@api.get("/reviews/{pid}")
async def list_reviews(pid: str):
    return await db.reviews.find({"product_id": pid}, {"_id": 0}).sort("created_at", -1).to_list(100)


@api.post("/reviews")
async def add_review(body: dict, user=Depends(current_user)):
    r = Review(
        product_id=body["product_id"],
        user_id=user["id"],
        user_name=user["name"],
        rating=int(body["rating"]),
        title=body.get("title", ""),
        body=body.get("body", ""),
    )
    await db.reviews.insert_one(r.model_dump())
    # update product avg
    revs = await db.reviews.find({"product_id": r.product_id}).to_list(500)
    avg = sum(x["rating"] for x in revs) / len(revs) if revs else 5
    await db.products.update_one({"id": r.product_id}, {"$set": {"rating": round(avg, 1), "review_count": len(revs)}})
    return r.model_dump()


# ---------------- CHECKOUT / PAYMENT ----------------
@api.post("/checkout")
async def checkout(body: CheckoutBody, user=Depends(current_user)):
    # Build validated line items server-side
    line_items = []
    subtotal = 0.0
    products_meta = []
    for it in body.items:
        p = await db.products.find_one({"id": it.product_id}, {"_id": 0})
        if not p:
            raise HTTPException(400, f"Product {it.product_id} not found")
        subtotal += p["price"] * it.qty
        products_meta.append({
            "product_id": p["id"],
            "name": p["name"],
            "price": p["price"],
            "qty": it.qty,
            "seller_id": p.get("seller_id", "house"),
            "seller_store_name": p.get("seller_store_name", "Mangalore Store"),
            "image": (p.get("images") or [None])[0],
            "fulfillment_status": "pending",  # per-item status
        })
        line_items.append({
            "price_data": {
                "currency": "inr",
                "product_data": {"name": p["name"], "images": p["images"][:1] if p["images"] else []},
                "unit_amount": int(round(p["price"] * 100)),
            },
            "quantity": it.qty,
        })

    discount = 0.0
    coupon_code = None
    if body.coupon_code:
        c = await db.coupons.find_one({"code": body.coupon_code.upper(), "active": True}, {"_id": 0})
        if c and subtotal >= c["min_order"]:
            discount = min(subtotal * c["discount_pct"] / 100, c["max_discount"])
            coupon_code = c["code"]

    # Add shipping and apply discount via a coupon in Stripe (simplify: subtract from total using a negative product? Better: add adjust line item)
    if discount > 0:
        line_items.append({
            "price_data": {
                "currency": "inr",
                "product_data": {"name": f"Coupon {coupon_code} discount"},
                "unit_amount": -int(round(discount * 100)),
            },
            "quantity": 1,
        })

    order_id = uid()
    session = stripe.checkout.Session.create(
        line_items=line_items,
        mode="payment",
        success_url=f"{body.origin_url}/payment/success?session_id={{CHECKOUT_SESSION_ID}}",
        cancel_url=f"{body.origin_url}/payment/cancel",
        metadata={"user_id": user["id"], "order_id": order_id},
    )

    order = {
        "id": order_id,
        "user_id": user["id"],
        "user_email": user["email"],
        "user_name": user["name"],
        "items": products_meta,
        "subtotal": round(subtotal, 2),
        "discount": round(discount, 2),
        "coupon_code": coupon_code,
        "total": round(subtotal - discount, 2),
        "currency": "inr",
        "address_id": body.address_id,
        "status": "pending",
        "payment_status": "pending",
        "session_id": session.id,
        "created_at": now(),
        "updated_at": now(),
    }
    await db.orders.insert_one(order)
    await db.payment_transactions.insert_one({
        "session_id": session.id, "order_id": order_id, "user_id": user["id"],
        "amount": order["total"], "currency": "inr",
        "status": "initiated", "payment_status": "pending",
        "created_at": now(), "updated_at": now(),
    })
    return {"checkout_url": session.url, "session_id": session.id, "order_id": order_id}


@api.get("/payments/status/{session_id}")
async def payment_status(session_id: str):
    tx = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
    if not tx:
        raise HTTPException(404, "Not found")
    if tx.get("payment_status") != "paid":
        try:
            s = stripe.checkout.Session.retrieve(session_id)
            if s.payment_status == "paid" or s.status == "complete":
                await db.payment_transactions.update_one(
                    {"session_id": session_id, "payment_status": {"$ne": "paid"}},
                    {"$set": {"status": "completed", "payment_status": "paid",
                              "stripe_payment_intent_id": s.payment_intent, "updated_at": now()}},
                )
                await db.orders.update_one(
                    {"session_id": session_id, "payment_status": {"$ne": "paid"}},
                    {"$set": {"status": "confirmed", "payment_status": "paid", "updated_at": now()}},
                )
                # Clear cart
                await db.carts.update_one({"user_id": tx["user_id"]}, {"$set": {"items": []}}, upsert=True)
                tx = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
        except Exception:
            pass
    return {"session_id": tx["session_id"], "status": tx["status"], "payment_status": tx["payment_status"], "order_id": tx.get("order_id")}


@api.post("/stripe/webhook")
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig = request.headers.get("stripe-signature", "")
    try:
        event = stripe.Webhook.construct_event(payload, sig, STRIPE_WEBHOOK_SECRET)
    except Exception:
        raise HTTPException(400, "Invalid signature")
    obj, t = event["data"]["object"], event["type"]
    if t == "checkout.session.completed":
        await db.payment_transactions.update_one(
            {"session_id": obj["id"], "payment_status": {"$ne": "paid"}},
            {"$set": {"status": "completed", "payment_status": obj.get("payment_status", "paid"),
                      "stripe_payment_intent_id": obj.get("payment_intent"), "updated_at": now()}},
        )
        await db.orders.update_one(
            {"session_id": obj["id"]},
            {"$set": {"status": "confirmed", "payment_status": "paid", "updated_at": now()}},
        )
    return {"status": "ok"}


# ---------------- ORDERS ----------------
@api.get("/orders/mine")
async def my_orders(user=Depends(current_user)):
    return await db.orders.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)


@api.get("/orders/{oid}")
async def get_order(oid: str, user=Depends(current_user)):
    o = await db.orders.find_one({"id": oid}, {"_id": 0})
    if not o:
        raise HTTPException(404, "Not found")
    if o["user_id"] != user["id"] and user["role"] not in ("admin", "super_admin"):
        raise HTTPException(403, "Forbidden")
    return o


@api.get("/admin/orders")
async def admin_orders(_=Depends(require_admin)):
    return await db.orders.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)


@api.put("/admin/orders/{oid}/status")
async def update_order_status(oid: str, body: dict, _=Depends(require_admin)):
    await db.orders.update_one({"id": oid}, {"$set": {"status": body["status"], "updated_at": now()}})
    return {"ok": True}


# ---------------- ADMIN STATS ----------------
@api.get("/admin/stats")
async def admin_stats(_=Depends(require_admin)):
    orders = await db.orders.find({}, {"_id": 0}).to_list(2000)
    paid = [o for o in orders if o.get("payment_status") == "paid"]
    revenue = sum(o["total"] for o in paid)
    return {
        "orders_total": len(orders),
        "orders_paid": len(paid),
        "revenue": round(revenue, 2),
        "customers": await db.users.count_documents({"role": "customer"}),
        "products": await db.products.count_documents({}),
        "recent_orders": orders[:8],
    }


@api.get("/admin/customers")
async def admin_customers(_=Depends(require_admin)):
    return await db.users.find({"role": "customer"}, {"_id": 0, "password_hash": 0}).to_list(500)


# ---------------- SELLER DASHBOARD ----------------
async def _get_seller_id(user: dict) -> str:
    """Returns the seller identifier for the given user.
    For seller role: use their user_id. Admin/super_admin can pass seller_id via query (else house)."""
    return user["id"]


@api.get("/seller/me")
async def seller_me(user=Depends(require_seller)):
    prof = await db.seller_profiles.find_one({"user_id": user["id"]}, {"_id": 0})
    if not prof:
        # Auto-provision for admins acting as seller
        prof = SellerProfile(user_id=user["id"], store_name=user.get("name", "Store")).model_dump()
        await db.seller_profiles.insert_one(prof)
        prof.pop("_id", None)
    return {"user": {"id": user["id"], "email": user["email"], "name": user["name"], "role": user["role"]}, "profile": prof}


@api.put("/seller/me")
async def seller_update_me(body: SellerProfileUpdate, user=Depends(require_seller)):
    updates = {k: v for k, v in body.model_dump(exclude_none=True).items()}
    if updates:
        await db.seller_profiles.update_one({"user_id": user["id"]}, {"$set": updates}, upsert=True)
        # If store_name changed, update all products of this seller
        if "store_name" in updates:
            await db.products.update_many({"seller_id": user["id"]}, {"$set": {"seller_store_name": updates["store_name"]}})
    prof = await db.seller_profiles.find_one({"user_id": user["id"]}, {"_id": 0})
    return prof


@api.get("/seller/stats")
async def seller_stats(user=Depends(require_seller)):
    sid = user["id"]
    products = await db.products.count_documents({"seller_id": sid})
    orders = await db.orders.find({"items.seller_id": sid, "payment_status": "paid"}, {"_id": 0}).to_list(2000)
    revenue = 0.0
    total_items = 0
    for o in orders:
        for it in o.get("items", []):
            if it.get("seller_id") == sid:
                revenue += float(it["price"]) * int(it["qty"])
                total_items += it["qty"]
    prof = await db.seller_profiles.find_one({"user_id": sid}, {"_id": 0}) or {"commission_rate": 10.0}
    commission = revenue * float(prof.get("commission_rate", 10.0)) / 100.0
    payouts = await db.payouts.find({"seller_id": sid}, {"_id": 0}).to_list(500)
    paid_out = sum(float(p["amount"]) for p in payouts if p.get("status") == "paid")
    pending_payout = round(revenue - commission - paid_out, 2)
    return {
        "products": products,
        "orders": len(orders),
        "revenue": round(revenue, 2),
        "commission": round(commission, 2),
        "net_earnings": round(revenue - commission, 2),
        "paid_out": round(paid_out, 2),
        "pending_payout": max(pending_payout, 0.0),
        "items_sold": total_items,
    }


@api.get("/seller/products")
async def seller_list_products(user=Depends(require_seller)):
    return await db.products.find({"seller_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(500)


@api.post("/seller/products")
async def seller_create_product(body: ProductIn, user=Depends(require_seller)):
    cat = await db.categories.find_one({"id": body.category_id}, {"_id": 0})
    prof = await db.seller_profiles.find_one({"user_id": user["id"]}, {"_id": 0})
    prod = Product(
        **body.model_dump(exclude_none=True),
        slug=body.slug or body.name.lower().replace(" ", "-"),
        sku=body.sku or f"SKU-{uid()[:8].upper()}",
        category_name=cat["name"] if cat else "",
        seller_id=user["id"],
        seller_store_name=prof["store_name"] if prof else user["name"],
    )
    doc = prod.model_dump()
    await db.products.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api.put("/seller/products/{pid}")
async def seller_update_product(pid: str, body: ProductIn, user=Depends(require_seller)):
    existing = await db.products.find_one({"id": pid}, {"_id": 0})
    if not existing:
        raise HTTPException(404, "Product not found")
    if existing.get("seller_id") != user["id"] and user["role"] not in ("admin", "super_admin"):
        raise HTTPException(403, "Not your product")
    updates = body.model_dump(exclude_none=True)
    cat = await db.categories.find_one({"id": body.category_id}, {"_id": 0})
    if cat:
        updates["category_name"] = cat["name"]
    await db.products.update_one({"id": pid}, {"$set": updates})
    return await db.products.find_one({"id": pid}, {"_id": 0})


@api.delete("/seller/products/{pid}")
async def seller_delete_product(pid: str, user=Depends(require_seller)):
    existing = await db.products.find_one({"id": pid}, {"_id": 0})
    if not existing:
        raise HTTPException(404, "Product not found")
    if existing.get("seller_id") != user["id"] and user["role"] not in ("admin", "super_admin"):
        raise HTTPException(403, "Not your product")
    await db.products.delete_one({"id": pid})
    return {"ok": True}


@api.get("/seller/orders")
async def seller_orders(user=Depends(require_seller)):
    sid = user["id"]
    orders = await db.orders.find({"items.seller_id": sid}, {"_id": 0}).sort("created_at", -1).to_list(500)
    # Filter each order to only include the seller's items + compute seller-scoped totals
    out = []
    for o in orders:
        my_items = [it for it in o.get("items", []) if it.get("seller_id") == sid]
        if not my_items:
            continue
        my_subtotal = sum(float(it["price"]) * int(it["qty"]) for it in my_items)
        out.append({
            "id": o["id"],
            "user_name": o.get("user_name"),
            "user_email": o.get("user_email"),
            "items": my_items,
            "seller_subtotal": round(my_subtotal, 2),
            "status": o.get("status"),
            "payment_status": o.get("payment_status"),
            "created_at": o.get("created_at"),
            "address_id": o.get("address_id"),
        })
    return out


class ItemStatusIn(BaseModel):
    status: str


@api.put("/seller/orders/{oid}/items/{pid}/status")
async def seller_update_item_status(oid: str, pid: str, body: ItemStatusIn, user=Depends(require_seller)):
    o = await db.orders.find_one({"id": oid}, {"_id": 0})
    if not o:
        raise HTTPException(404, "Order not found")
    items = o.get("items", [])
    found = False
    for it in items:
        if it.get("product_id") == pid and it.get("seller_id") == user["id"]:
            it["fulfillment_status"] = body.status
            found = True
            break
    if not found:
        raise HTTPException(403, "You don't own this line item")
    await db.orders.update_one({"id": oid}, {"$set": {"items": items, "updated_at": now()}})
    return {"ok": True}


@api.get("/seller/earnings")
async def seller_earnings(user=Depends(require_seller)):
    sid = user["id"]
    orders = await db.orders.find({"items.seller_id": sid, "payment_status": "paid"}, {"_id": 0}).sort("created_at", -1).to_list(2000)
    prof = await db.seller_profiles.find_one({"user_id": sid}, {"_id": 0}) or {"commission_rate": 10.0}
    rate = float(prof.get("commission_rate", 10.0))
    ledger = []
    total_gross = 0.0
    total_commission = 0.0
    for o in orders:
        for it in o.get("items", []):
            if it.get("seller_id") == sid:
                gross = float(it["price"]) * int(it["qty"])
                comm = gross * rate / 100.0
                ledger.append({
                    "order_id": o["id"],
                    "product_id": it["product_id"],
                    "product_name": it.get("name"),
                    "qty": it["qty"],
                    "gross": round(gross, 2),
                    "commission": round(comm, 2),
                    "net": round(gross - comm, 2),
                    "date": o.get("created_at"),
                })
                total_gross += gross
                total_commission += comm
    return {
        "commission_rate": rate,
        "total_gross": round(total_gross, 2),
        "total_commission": round(total_commission, 2),
        "total_net": round(total_gross - total_commission, 2),
        "ledger": ledger,
    }


class PayoutRequestIn(BaseModel):
    amount: float
    note: str = ""


@api.get("/seller/payouts")
async def seller_payouts(user=Depends(require_seller)):
    return await db.payouts.find({"seller_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(200)


@api.post("/seller/payouts/request")
async def seller_payout_request(body: PayoutRequestIn, user=Depends(require_seller)):
    if body.amount <= 0:
        raise HTTPException(400, "Amount must be positive")
    stats = await seller_stats(user)
    if body.amount > stats["pending_payout"]:
        raise HTTPException(400, f"Requested amount exceeds pending payout ₹{stats['pending_payout']}")
    payout = Payout(seller_id=user["id"], amount=round(body.amount, 2), note=body.note).model_dump()
    await db.payouts.insert_one(payout)
    payout.pop("_id", None)
    return payout


@api.get("/seller/reviews")
async def seller_reviews(user=Depends(require_seller)):
    # Get all product ids for this seller
    prods = await db.products.find({"seller_id": user["id"]}, {"_id": 0, "id": 1, "name": 1, "images": 1}).to_list(500)
    pid_to_prod = {p["id"]: p for p in prods}
    if not pid_to_prod:
        return []
    reviews = await db.reviews.find({"product_id": {"$in": list(pid_to_prod.keys())}}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    for r in reviews:
        pr = pid_to_prod.get(r["product_id"])
        r["product_name"] = pr.get("name") if pr else ""
        r["product_image"] = (pr.get("images") or [None])[0] if pr else None
    return reviews


@api.post("/seller/reviews/{rid}/respond")
async def seller_review_respond(rid: str, body: ReviewResponseIn, user=Depends(require_seller)):
    rev = await db.reviews.find_one({"id": rid}, {"_id": 0})
    if not rev:
        raise HTTPException(404, "Review not found")
    prod = await db.products.find_one({"id": rev["product_id"]}, {"_id": 0})
    if not prod or (prod.get("seller_id") != user["id"] and user["role"] not in ("admin", "super_admin")):
        raise HTTPException(403, "Not your product's review")
    await db.reviews.update_one({"id": rid}, {"$set": {"seller_response": body.response, "seller_response_at": now()}})
    return await db.reviews.find_one({"id": rid}, {"_id": 0})


# ---------------- SUPER ADMIN ----------------
@api.get("/super/stores")
async def list_stores(_=Depends(require_super)):
    return await db.stores.find({}, {"_id": 0}).to_list(200)


@api.post("/super/stores")
async def create_store(s: Store, _=Depends(require_super)):
    doc = s.model_dump()
    await db.stores.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api.put("/super/stores/{sid}")
async def update_store(sid: str, body: dict, _=Depends(require_super)):
    await db.stores.update_one({"id": sid}, {"$set": body})
    return await db.stores.find_one({"id": sid}, {"_id": 0})


@api.delete("/super/stores/{sid}")
async def delete_store(sid: str, _=Depends(require_super)):
    await db.stores.delete_one({"id": sid})
    return {"ok": True}


@api.get("/super/stats")
async def super_stats(_=Depends(require_super)):
    stores = await db.stores.count_documents({})
    users = await db.users.count_documents({})
    orders = await db.orders.find({"payment_status": "paid"}, {"_id": 0}).to_list(5000)
    return {
        "stores": stores,
        "users": users,
        "platform_revenue": round(sum(o["total"] for o in orders), 2),
        "orders": len(orders),
    }


# ---------------- BANNERS ----------------
@api.get("/banners")
async def list_banners():
    return await db.banners.find({}, {"_id": 0}).to_list(20)


# ---------------- PUBLIC SETTINGS ----------------
@api.get("/settings/store")
async def get_public_store_settings():
    doc = await db.store_settings.find_one({"_id": "singleton"})
    if not doc:
        from admin_ext import StoreSettings
        return StoreSettings().model_dump()
    doc.pop("_id", None)
    return doc


@api.get("/settings/theme")
async def get_public_theme():
    doc = await db.theme_settings.find_one({"_id": "singleton"})
    if not doc:
        from admin_ext import ThemeSettings
        return ThemeSettings().model_dump()
    doc.pop("_id", None)
    return doc


@api.get("/settings/header")
async def get_public_header():
    doc = await db.header_config.find_one({"_id": "singleton"})
    if not doc:
        from admin_ext import HeaderConfig
        return HeaderConfig().model_dump()
    doc.pop("_id", None)
    return doc


@api.get("/settings/footer")
async def get_public_footer():
    doc = await db.footer_config.find_one({"_id": "singleton"})
    if not doc:
        from admin_ext import FooterConfig
        return FooterConfig().model_dump()
    doc.pop("_id", None)
    return doc


@api.get("/homepage")
async def get_public_homepage():
    docs = await db.homepage_sections.find({}, {"_id": 0}).sort("order", 1).to_list(200)
    return docs


@api.get("/")
async def root():
    return {"service": "Mangalore Store API", "status": "ok"}

app.include_router(api)

# ---------------- Enterprise Admin extension ----------------
from admin_ext import admin_router, set_context as _admin_set_ctx, UPLOAD_DIR as _UPLOAD_DIR

_admin_set_ctx(db, require_admin, require_super, current_user, now, uid)
app.include_router(admin_router, dependencies=[Depends(require_admin)])

# Static uploads (served under /api/uploads/* so kubernetes ingress routes correctly)
_UPLOAD_DIR.mkdir(exist_ok=True)
app.mount("/api/uploads", StaticFiles(directory=str(_UPLOAD_DIR)), name="uploads")

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
