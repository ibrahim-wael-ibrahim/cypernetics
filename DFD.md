# Data Flow Diagram (DFD) - Cypernetics Store

This document models data movement for the current implementation across customer and admin flows.

## 1) Scope and System Boundary

**System**: Cypernetics Store (Next.js app + API routes + Prisma/SQLite)

**Primary Actors**
- Customer (guest or authenticated)
- Admin

**External/Supporting Components**
- Browser / Frontend UI (pages, forms, cart sheet)
- Local Storage (JWT token + persisted guest cart/auth state)
- File System for product images (`public/uploads/products`)

**Core Data Stores**
- `D1 Users` (`User`)
- `D2 Products` (`Product`)
- `D3 Carts` (`Cart`)
- `D4 CartItems` (`CartItem`)
- `D5 Orders` (`Order`)
- `D6 OrderItems` (`OrderItem`)
- `D7 Shipping` (`Shipping`)
- `D8 ProductImages` (uploaded image files on disk)

---

## 2) Context Diagram

```mermaid
flowchart LR
    C[Customer]
    A[Admin]
    S((Cypernetics Store System))

    C -->|Request: Register/Login/Browse Products/Add to Cart/Checkout| S
    S -->|Response: Auth token/Product catalog/Cart status/Order confirmation| C

    A -->|Request: Login/Create-Read-Update-Delete Products/List-Update-Cancel Orders| S
    S -->|Response: Auth token/Product records/Order records/Status result| A
```

### Context Notes
- **Customer**: Registers, logs in, browses products, manages cart, places orders, views order history.
- **Admin**: Logs in with admin role, manages product inventory (CRUD), manages orders (view/update status/cancel with stock restock).
- Both actors use JWT-based authentication and communicate via REST APIs.

---

## 3) Level 0 DFD

### Level 0 Processes
- `P1` Authentication & Session
- `P2` Product Catalog & Product Details
- `P3` Cart Management (Guest + Authenticated)
- `P4` Checkout & Order Lifecycle
- `P5` Admin Product Management
- `P6` Admin Order Management

```mermaid
flowchart LR
    C[Customer]
    A[Admin]
    B[(Browser + Local Storage)]
    F[(D8 ProductImages)]

    D1[(D1 Users)]
    D2[(D2 Products)]
    D3[(D3 Carts)]
    D4[(D4 CartItems)]
    D5[(D5 Orders)]
    D6[(D6 OrderItems)]
    D7[(D7 Shipping)]

    P1((P1 Auth & Session))
    P2((P2 Product Catalog))
    P3((P3 Cart Management))
    P4((P4 Checkout & Orders))
    P5((P5 Admin Product Mgmt))
    P6((P6 Admin Order Mgmt))

    C -->|Request| P1
    P1 -->|Response| C
    C -->|Request| P2
    P2 -->|Response| C
    C -->|Request| P3
    P3 -->|Response| C
    C -->|Request| P4
    P4 -->|Response| C

    A -->|Request| P1
    P1 -->|Response| A
    A -->|Request| P5
    P5 -->|Response| A
    A -->|Request| P6
    P6 -->|Response| A

    P1 -->|Request: read/write user auth data| D1
    D1 -->|Response: user/auth records| P1
    P1 -->|Request: set/read session state| B
    B -->|Response: token/local state| P1

    P2 -->|Request: query products| D2
    D2 -->|Response: product list/detail| P2

    P3 -->|Request: read/write local cart state| B
    B -->|Response: local cart payload| P3
    P3 -->|Request: read/write cart| D3
    D3 -->|Response: cart data| P3
    P3 -->|Request: read/write cart items| D4
    D4 -->|Response: cart item data| P3
    P3 -->|Request: stock/product validation| D2
    D2 -->|Response: product/stock data| P3

    P4 -->|Request: read/clear checkout cart| D3
    D3 -->|Response: cart state| P4
    P4 -->|Request: read/clear checkout items| D4
    D4 -->|Response: item state| P4
    P4 -->|Request: validate/decrement stock| D2
    D2 -->|Response: stock/product data| P4
    P4 -->|Request: create/read order| D5
    D5 -->|Response: order records| P4
    P4 -->|Request: create/read order items| D6
    D6 -->|Response: order item records| P4
    P4 -->|Request: create/read shipping| D7
    D7 -->|Response: shipping records| P4

    P5 -->|Request: create/update/delete products| D2
    D2 -->|Response: product write/read result| P5
    P5 -->|Request: upload/delete image files| F
    F -->|Response: file path/status| P5

    P6 -->|Request: list/update orders| D5
    D5 -->|Response: order data| P6
    P6 -->|Request: read order items| D6
    D6 -->|Response: order item data| P6
    P6 -->|Request: restock on cancel| D2
    D2 -->|Response: updated stock| P6
    P6 -->|Request: read shipping details| D7
    D7 -->|Response: shipping data| P6
```

---

## 4) Level 1 DFD (Process Decomposition)

## P1 - Authentication & Session

```mermaid
flowchart TD
    U[User/Admin] -->|Request| P11((P1.1 Register))
    P11 -->|Response| U
    U -->|Request| P12((P1.2 Login))
    P12 -->|Response| U
    U -->|Request| P13((P1.3 Verify Current User))
    P13 -->|Response| U
    U -->|Request| P14((P1.4 Logout))
    P14 -->|Response| U

    P11 -->|Request: create customer user| D1[(Users)]
    D1 -->|Response: created user| P11
    P12 -->|Request: find user for credential check| D1
    D1 -->|Response: user + password hash| P12
    P13 -->|Request: fetch current user profile| D1
    D1 -->|Response: user profile| P13

    P11 -->|Request: store issued token| B[(Browser Local Storage)]
    B -->|Response: token stored| P11
    P12 -->|Request: store issued token| B
    B -->|Response: token stored| P12
    P13 -->|Request: read token| B
    B -->|Response: token value| P13
    P14 -->|Request: clear token| B
    B -->|Response: token removed| P14
```

**Behavior**
- `P1.1 Register`: validate input, ensure unique email, hash password, create `customer`, issue JWT.
- `P1.2 Login`: verify credentials, issue JWT with role.
- `P1.3 Verify Current User`: validate token, fetch user profile.
- `P1.4 Logout`: client-side token removal; API endpoint returns success message.

## P2 - Product Catalog & Product Details

```mermaid
flowchart TD
    C[Customer/Admin UI] -->|Request| P21((P2.1 List/Filter Products))
    P21 -->|Response| C
    C -->|Request| P22((P2.2 View Product Details))
    P22 -->|Response| C
    C -->|Request| P23((P2.3 View Related Products by Category))
    P23 -->|Response| C

    P21 -->|Request: list/filter query| D2[(Products)]
    D2 -->|Response: filtered product set| P21
    P22 -->|Request: product by id| D2
    D2 -->|Response: product detail| P22
    P23 -->|Request: products by category| D2
    D2 -->|Response: related products| P23
```

**Behavior**
- `P2.1` supports search, category, price range, sort, pagination.
- `P2.2` fetches a single product by id.
- `P2.3` fetches products in same category (frontend trims to related list).

## P3 - Cart Management (Guest + Authenticated)

```mermaid
flowchart TD
    C[Customer] -->|Request| P31((P3.1 Guest Cart Local Operations))
    P31 -->|Response| C
    C -->|Request| P32((P3.2 Auth Cart CRUD via API))
    P32 -->|Response| C
    C -->|Request| P33((P3.3 Sync Local Cart After Login))
    P33 -->|Response| C

    P31 -->|Request: save/update/remove guest cart| B[(Browser Local Storage)]
    B -->|Response: persisted guest cart| P31

    P32 -->|Request: read/create user cart| D3[(Carts)]
    D3 -->|Response: cart record| P32
    P32 -->|Request: read/write cart items| D4[(CartItems)]
    D4 -->|Response: cart item records| P32
    P32 -->|Request: product + stock validation| D2[(Products/Stock)]
    D2 -->|Response: stock/product state| P32

    P33 -->|Request: read local cart items| B
    B -->|Response: local cart payload| P33
    P33 -->|Request: get/create server cart| D3
    D3 -->|Response: server cart| P33
    P33 -->|Request: merge/write cart items| D4
    D4 -->|Response: merged item state| P33
    P33 -->|Request: validate stock during merge| D2
    D2 -->|Response: available stock| P33
```

**Behavior**
- `P3.1 Guest cart`: add/update/remove/clear in Zustand persisted storage.
- `P3.2 Auth cart`: token-protected API (`GET/POST /api/cart`, `PUT/DELETE /api/cart/items/[id]`, `DELETE /api/cart`) with stock checks.
- `P3.3 Sync`: on login, merge local items into API cart; failed sync items remain local.

## P4 - Checkout & Order Lifecycle

```mermaid
flowchart TD
    C[Customer] -->|Request| P41((P4.1 Load Checkout Cart))
    P41 -->|Response| C
    C -->|Request| P42((P4.2 Validate Shipping + Order Request))
    P42 -->|Response| C
    C -->|Request| P43((P4.3 Create Order Transaction))
    P43 -->|Response| C
    C -->|Request| P44((P4.4 Show Thanks + Order Access))
    P44 -->|Response| C
    C -->|Request| P45((P4.5 View Order History/Detail))
    P45 -->|Response| C

    P41 -->|Request: load customer cart| D3[(Carts)]
    D3 -->|Response: cart header| P41
    P41 -->|Request: load cart items| D4[(CartItems)]
    D4 -->|Response: cart items| P41
    P41 -->|Request: load product snapshot/stock| D2[(Products)]
    D2 -->|Response: product + stock data| P41

    P42 -->|Request: validate item stock| D2
    D2 -->|Response: stock validation result| P42

    P43 -->|Request: create order| D5[(Orders)]
    D5 -->|Response: order id/status| P43
    P43 -->|Request: create order items| D6[(OrderItems)]
    D6 -->|Response: order item records| P43
    P43 -->|Request: create shipping data| D7[(Shipping)]
    D7 -->|Response: shipping record| P43
    P43 -->|Request: decrement product stock| D2
    D2 -->|Response: updated stock| P43
    P43 -->|Request: clear user cart| D3
    D3 -->|Response: cart clear status| P43
    P43 -->|Request: clear cart items| D4
    D4 -->|Response: item clear status| P43

    P45 -->|Request: read orders| D5
    D5 -->|Response: order history/detail| P45
    P45 -->|Request: read order items| D6
    D6 -->|Response: order items| P45
    P45 -->|Request: read shipping info| D7
    D7 -->|Response: shipping details| P45
```

**Behavior**
- `P4.1` loads authenticated cart.
- `P4.2` validates shipping payload and item quantities.
- `P4.3` transaction: create order + order items + shipping, decrement product stock, clear user cart.
- `P4.4` redirects to thank-you page and order details path.
- `P4.5` customer account/history and single-order view (owner or admin allowed for detail endpoint).

## P5 - Admin Product Management

```mermaid
flowchart TD
    A[Admin] -->|Request| P51((P5.1 List/Search Products))
    P51 -->|Response| A
    A -->|Request| P52((P5.2 Create Product + Upload Image))
    P52 -->|Response| A
    A -->|Request| P53((P5.3 Update Product + Replace/Remove Image))
    P53 -->|Response| A
    A -->|Request| P54((P5.4 Delete Product))
    P54 -->|Response| A

    P51 -->|Request: list/filter products| D2[(Products)]
    D2 -->|Response: product list| P51
    P52 -->|Request: create product row| D2
    D2 -->|Response: created product| P52
    P53 -->|Request: update product row| D2
    D2 -->|Response: updated product| P53
    P54 -->|Request: delete product row| D2
    D2 -->|Response: delete status| P54

    P52 -->|Request: upload file| F[(Product Image Files)]
    F -->|Response: file path| P52
    P53 -->|Request: replace/remove file| F
    F -->|Response: file operation status| P53
    P54 -->|Request: remove linked file| F
    F -->|Response: file delete status| P54

    P54 -->|Request: check order references| D6[(OrderItems check before delete)]
    D6 -->|Response: can/cannot delete| P54
```

**Behavior**
- Admin role required.
- Create/Update supports multipart form and image validation (type/size).
- Delete blocked if product has historical `OrderItem` references.

## P6 - Admin Order Management

```mermaid
flowchart TD
    A[Admin] -->|Request| P61((P6.1 List/Filter Orders))
    P61 -->|Response| A
    A -->|Request| P62((P6.2 View Order Detail in Admin UI))
    P62 -->|Response| A
    A -->|Request| P63((P6.3 Update Order Status))
    P63 -->|Response| A
    A -->|Request| P64((P6.4 Cancel Order + Restock))
    P64 -->|Response| A

    P61 -->|Request: query orders| D5[(Orders)]
    D5 -->|Response: order list| P61
    P61 -->|Request: load items for list/detail| D6[(OrderItems)]
    D6 -->|Response: order items| P61
    P61 -->|Request: load shipping for list/detail| D7[(Shipping)]
    D7 -->|Response: shipping data| P61

    P62 -->|Request: load order record| D5
    D5 -->|Response: order detail| P62
    P62 -->|Request: load order items| D6
    D6 -->|Response: item detail| P62
    P62 -->|Request: load shipping detail| D7
    D7 -->|Response: shipping detail| P62

    P63 -->|Request: update order status| D5
    D5 -->|Response: updated status| P63

    P64 -->|Request: read/update cancel state| D5
    D5 -->|Response: cancel transition result| P64
    P64 -->|Request: read cancelled order items| D6
    D6 -->|Response: items to restock| P64
    P64 -->|Request: increment stock on cancel| D2[(Products stock increment)]
    D2 -->|Response: updated stock state| P64
```

**Behavior**
- `P6.1` supports pagination/filter/search.
- `P6.3` updates status among allowed values.
- `P6.4` if transitioning to `cancelled` (from non-cancelled), restore stock in transaction.

---

## 5) End-to-End Process Plan (User)

## U1 Guest Shopping Path
1. Browse products and product details.
2. Add/update/remove items in guest cart (local storage).
3. Open cart/cart sheet and review totals.
4. If proceeding to checkout, user must login.

## U2 Registration/Login Path
1. Submit register or login form.
2. Backend validates + authenticates user.
3. JWT is stored in local storage.
4. Auth store is hydrated with role/user profile.
5. If local cart exists, sync it into API cart.

## U3 Authenticated Cart Path
1. Fetch cart from `/api/cart`.
2. Add/update/remove items via cart APIs.
3. Enforce stock constraints on every write.
4. Persist cart server-side (`Cart`, `CartItem`).

## U4 Checkout + Order Placement Path
1. Load checkout cart and shipping form.
2. Submit shipping + item list.
3. Server validates stock and shipping fields.
4. Transaction creates `Order`, `OrderItem`, `Shipping`.
5. Product stock is decremented.
6. User cart is cleared.
7. User is redirected to thank-you page.

## U5 Post-Purchase Path
1. View order history on account page.
2. View order detail by id.
3. Access is restricted to order owner (or admin).

---

## 6) End-to-End Process Plan (Admin)

## A1 Admin Access Path
1. Login as admin.
2. JWT role claim + admin checks protect admin APIs.
3. Admin layout redirects non-admin users away from admin UI.

## A2 Product Management Path
1. Open product management list with filters/search.
2. Create product (optional image upload).
3. Update product metadata and image.
4. Remove image when needed.
5. Delete product if no linked `OrderItem` history.

## A3 Order Management Path
1. Open orders list with status/search filters.
2. Inspect order details (customer, shipping, items).
3. Update order status lifecycle.
4. If status changed to cancelled, system restores stock quantities.

---

## 7) Authorization and Data Integrity Rules

- JWT bearer token required for cart/order APIs.
- Admin-only routes use role validation (`admin`).
- Cart item writes validate product existence and stock.
- Order creation and stock/cart updates are atomic in transaction.
- Order cancellation restock is atomic in transaction.
- Product delete protection prevents deleting products that exist in order history.

---

## 8) Implementation Anchors (Main Evidence)

- Auth APIs: `src/app/api/auth/*`
- Cart APIs: `src/app/api/cart/*`
- Orders APIs: `src/app/api/orders/*`
- Admin orders API: `src/app/api/admin/orders/route.js`
- Product APIs (public + admin writes): `src/app/api/products/*`
- Role/token checks: `src/lib/middleware.js`, `src/lib/auth.js`
- Guest/auth cart + sync: `src/stores/cart-store.js`, `src/lib/cart-client.js`, `src/components/layout/Navbar.jsx`
- Checkout + account/order pages: `src/app/checkout/page.jsx`, `src/app/account/page.jsx`, `src/app/orders/[id]/page.jsx`, `src/app/thanks/page.jsx`
- Admin pages: `src/app/admin/*`
- Data model: `prisma/schema.prisma`
