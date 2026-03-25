# 🛍️ EVENT MERCHANDISE STORE

## Vision: Events Can Sell Physical Products

### Use Cases:

**1. Artist Merch:**
- Sukali concert → Sell Sukali hoodies, t-shirts
- Likkle Bangi show → Sell branded caps, posters
- DJ night → Sell mix tapes, vinyl

**2. Event Swag:**
- Festival → Sell festival merch (limited edition)
- Brunch event → Sell branded mugs, tote bags
- Conference → Sell notebooks, pens

**3. Drink Packages:**
- Pre-order drink vouchers
- Bottle service packages
- VIP drink bundles

**4. Experience Add-ons:**
- Meet & greet packages
- Photo sessions
- Backstage passes
- After-party access

**5. Food Pre-orders:**
- Brunch platters
- Birthday cakes
- Snack packs
- Catering packages

---

## How It Works:

### **For Event Organizers:**

**Step 1: Enable Merch Store**
```
Event Settings → Merchandise
[✓] Enable merchandise sales for this event
```

**Step 2: Add Products**
```
Add Product:
- Product name: "Sukali Tour T-Shirt"
- Description: "Limited edition concert merch"
- Images: [upload 3-5 photos]
- Variants:
  * Size: S, M, L, XL
  * Color: Black, White, Pink
- Price: UGX 35,000
- Stock: 100 units
- Delivery: Pickup at event / Ship after event
```

**Step 3: Organize Products**
```
Categories:
- Apparel (t-shirts, hoodies)
- Accessories (caps, bags)
- Drinks (pre-order packages)
- Food (catering)
- Experiences (meet & greet)
```

**Step 4: Launch**
```
Merch appears on event page
Buyers can add to cart with tickets
Revenue tracked separately
```

---

## User Experience:

### **Event Page with Merch:**

```
┌──────────────────────────────────────┐
│ Sukali Live Concert                  │
│ June 15, 2024 • Sky Lounge           │
│                                      │
│ [Get Tickets] [View Merch Store]    │
└──────────────────────────────────────┘

Merch Store Tab:
┌──────────────────────────────────────┐
│ 🛍️ Concert Merchandise              │
│                                      │
│ ┌─────────┐  ┌─────────┐            │
│ │[T-SHIRT]│  │[HOODIE] │            │
│ │ UGX 35K │  │ UGX 65K │            │
│ └─────────┘  └─────────┘            │
│                                      │
│ ┌─────────┐  ┌─────────┐            │
│ │[VIP PKG]│  │[POSTER] │            │
│ │ UGX 150K│  │ UGX 15K │            │
│ └─────────┘  └─────────┘            │
│                                      │
│ [Add to Cart]                        │
└──────────────────────────────────────┘
```

### **Combined Checkout:**

```
Your Cart:
├─ 2x VIP Tickets (UGX 100K each) = UGX 200K
├─ 1x Tour T-Shirt (Size: M) = UGX 35K
├─ 1x VIP Drink Package = UGX 50K
└─ Total: UGX 285K

Delivery:
├─ Tickets: Digital (instant)
├─ T-Shirt: Pickup at event
└─ Drink Package: Redeem at event

[Proceed to Payment]
```

---

## Product Types:

### **1. Physical Merch (Pickup/Ship)**
- Apparel (t-shirts, hoodies, caps)
- Accessories (bags, posters, stickers)
- Physical media (vinyl, CDs, books)

**Fulfillment:**
- Pickup at event (default)
- Ship after event (+UGX 5,000)
- Pre-event delivery (premium)

### **2. Digital Products**
- Mix tapes (download)
- Exclusive photos
- Video recordings
- Digital artwork

**Fulfillment:**
- Instant download after purchase
- Email delivery
- WhatsApp delivery

### **3. Consumables (Food/Drink)**
- Pre-order drink vouchers
- Bottle service packages
- Food platters
- Birthday cakes

**Fulfillment:**
- Redeem at event
- QR code verification
- Table delivery

### **4. Experiences**
- Meet & greet
- Backstage access
- Photo sessions
- Private performances

**Fulfillment:**
- Schedule at event
- Limited slots
- VIP only

---

## Database Schema:

```sql
-- Products table
CREATE TABLE products (
  id UUID PRIMARY KEY,
  event_id UUID REFERENCES events(id),
  organizer_id UUID REFERENCES users(id),
  
  -- Product details
  name TEXT NOT NULL,
  description TEXT,
  images TEXT[], -- array of image URLs
  
  -- Categorization
  category TEXT, -- apparel, accessories, food, drink, experience
  type TEXT, -- physical, digital, consumable, experience
  
  -- Pricing
  price DECIMAL NOT NULL,
  currency TEXT DEFAULT 'UGX',
  
  -- Inventory
  stock_quantity INTEGER,
  unlimited_stock BOOLEAN DEFAULT FALSE,
  sold_count INTEGER DEFAULT 0,
  
  -- Variants (sizes, colors, etc.)
  variants JSONB, -- [{size: 'M', color: 'Black', sku: '001'}]
  
  -- Fulfillment
  fulfillment_type TEXT, -- pickup, ship, digital, redeem
  fulfillment_details JSONB,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product orders
CREATE TABLE product_orders (
  id UUID PRIMARY KEY,
  product_id UUID REFERENCES products(id),
  user_id UUID REFERENCES users(id),
  transaction_id UUID REFERENCES transactions(id),
  
  -- Order details
  quantity INTEGER NOT NULL,
  variant_selected JSONB, -- {size: 'M', color: 'Black'}
  unit_price DECIMAL,
  total_price DECIMAL,
  
  -- Fulfillment tracking
  fulfillment_status TEXT, -- pending, ready, completed, cancelled
  fulfillment_method TEXT,
  pickup_code TEXT, -- QR code for pickup
  
  -- Delivery (if applicable)
  delivery_address TEXT,
  delivery_status TEXT,
  tracking_number TEXT,
  
  -- Redemption (for consumables)
  redeemed BOOLEAN DEFAULT FALSE,
  redeemed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Features:

### **For Organizers:**

✅ **Easy Setup**
- Add products in 2 minutes
- Upload multiple images
- Set variants (sizes, colors)
- Manage inventory

✅ **Revenue Tracking**
- Merch sales vs ticket sales
- Top-selling products
- Profit margins
- Inventory alerts

✅ **Fulfillment Tools**
- QR code scanner (verify pickups)
- Print packing slips
- Track deliveries
- Bulk redemption

✅ **Marketing**
- Featured products
- Bundle with tickets
- Limited edition badges
- Pre-order campaigns

### **For Attendees:**

✅ **One-Stop Shop**
- Buy tickets + merch together
- Single checkout
- Combined payment
- Unified order history

✅ **Easy Pickup**
- QR code for pickup
- Fast collection at event
- No cash needed
- Digital receipts

✅ **Product Discovery**
- Browse event merch
- Filter by category
- See stock levels
- Save for later

---

## Revenue Model:

**Platform Commission:**
- Physical merch: 5% of sale
- Digital products: 3% of sale
- Experiences: 10% of sale
- Or: UGX 2,000 flat fee per product sold

**Organizer Benefits:**
- Additional revenue stream (30-50% margins)
- Brand building
- Fan engagement
- Zero upfront cost

**Example:**
```
Sukali Concert:
- 500 attendees
- 200 buy t-shirts @ UGX 35K = UGX 7M
- 100 buy hoodies @ UGX 65K = UGX 6.5M
- Total merch revenue: UGX 13.5M
- Platform commission (5%): UGX 675K
- Organizer keeps: UGX 12.8M
```

---

## Fulfillment Options:

### **1. Pickup at Event (Default)**
- QR code on order confirmation
- Scan at merch booth
- Instant verification
- Prevents fraud

### **2. Ship After Event**
- +UGX 5,000 shipping fee
- Collect delivery address
- Partner with delivery services
- Track shipment

### **3. Digital Delivery**
- Instant download link
- Email/WhatsApp
- No shipping needed
- Automated

### **4. Redeem at Event**
- For consumables (food/drink)
- QR code verification
- Track redemptions
- Prevent double-use

---

## Integration with Existing Features:

### **Bundles:**
```
VIP Experience Package:
- 1 VIP ticket (UGX 100K)
- 1 Tour T-shirt (UGX 35K)
- 1 Drink package (UGX 50K)
Total: UGX 185K (save UGX 15K!)
```

### **Promotions:**
```
Campaign: "Buy 2 tickets → 20% off merch"
Campaign: "First 50 buyers get free poster"
Campaign: "Spend UGX 200K → Free t-shirt"
```

### **Loyalty:**
```
Gold Members: 15% off all merch
Attend 5 events: Free merch item
Birthday month: Buy 1 get 1 free
```

---

## Phase 1 (Week 3): Basic Merch
- Add products to events
- Simple checkout
- Pickup at event
- Basic inventory

## Phase 2 (Week 4): Advanced
- Product variants
- Digital products
- Shipping integration
- QR code fulfillment

## Phase 3 (Month 2): Premium
- Merch bundles
- Pre-orders
- Limited editions
- Print-on-demand

---

## Real-World Examples:

**Sukali Concert:**
- Tour t-shirts
- Signed posters
- Meet & greet packages
- Exclusive vinyl

**Likkle Bangi Show:**
- Branded caps
- Sticker packs
- Drink vouchers
- Backstage passes

**Sunday Brunch:**
- Bottomless mimosa vouchers
- Brunch platters (pre-order)
- Recipe books
- Cooking classes

**Corporate Event:**
- Branded notebooks
- Conference tote bags
- Workshop materials
- Lunch vouchers

---

**This turns events into full e-commerce experiences!** 🛍️

Artists/promoters get:
- Additional revenue
- Brand merchandise
- Fan engagement
- Zero inventory risk (print-on-demand option)

Attendees get:
- Convenient shopping
- Exclusive merch
- Support artists
- Collectibles

**We become the Shopify of events.** 🚀
