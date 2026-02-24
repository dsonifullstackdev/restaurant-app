# ENTERPRISE REACT NATIVE (EXPO) MARKETPLACE ARCHITECTURE GUIDE

## Multi-Vendor Scalable Marketplace Mobile App

API host: https://ab52-223-181-40-70.ngrok-free.app/websites/soniestore.com
Backend API: Wordpress, woocommerce, dokan for multivendor


------------------------------------------------------------------------

## 🎯 PROJECT OBJECTIVE

Build a production-ready, scalable, multi-vendor marketplace mobile app
using:

-   React Native (Expo latest)
-   TypeScript (strict mode)
-   React Navigation
-   Zustand (state management)
-   Axios (API layer)
-   NativeWind (styling)
-   WordPress REST API (Headless backend)
-   i18next (multi-language support)

This app must be: - Clean architecture - Fully scalable - Maintainable -
No duplicate code - No duplicate API calls - Extendable (Food → Clothing
→ Electronics → etc.) - Enterprise-ready

------------------------------------------------------------------------

## 🧠 CORE ARCHITECTURE RULES

1.  Follow SOLID principles
2.  Strict TypeScript everywhere
3.  No inline styles
4.  No hardcoded strings
5.  No hardcoded URLs
6.  No business logic inside UI components
7.  No direct axios calls inside components
8.  Centralized configuration only
9.  Reusable components only
10. Clean separation of concerns
11. Category-agnostic marketplace architecture
12. Production-level code quality

------------------------------------------------------------------------

## 📁 REQUIRED FOLDER STRUCTURE

    src/
     ├── api/
     │    ├── client.ts
     │    ├── endpoints.ts
     │    └── services/
     │         ├── product.service.ts
     │         ├── vendor.service.ts
     │         └── category.service.ts
     │
     ├── assets/
     ├── components/
     │    ├── common/
     │    ├── product/
     │    └── vendor/
     │
     ├── config/
     │    ├── app.config.ts
     │    ├── env.ts
     │    └── theme.ts
     │
     ├── constants/
     ├── hooks/
     ├── i18n/
     │    ├── index.ts
     │    ├── en.json
     │    └── hi.json
     │
     ├── navigation/
     ├── screens/
     ├── store/
     │    ├── auth.store.ts
     │    ├── cart.store.ts
     │    ├── user.store.ts
     │    └── app.store.ts
     │
     ├── types/
     ├── utils/
     └── App.tsx

------------------------------------------------------------------------

## ⚙️ CENTRALIZED CONFIGURATION

Create: `src/config/app.config.ts`

Must include: - App name - API base URL - Currency - Default language -
Pagination size - Feature flags - Environment detection

Example:

``` ts
export const AppConfig = {
  APP_NAME: "Marketplace",
  API_BASE_URL: "https://example.com/wp-json/",
  DEFAULT_LANGUAGE: "en",
  CURRENCY: "INR",
  PAGE_SIZE: 10,
};
```

No API URL should exist anywhere else in the project.

------------------------------------------------------------------------

## 🌍 MULTI-LANGUAGE SUPPORT

Use: - i18next - react-i18next

Rules: - All UI text must come from translation files - No hardcoded UI
text - Language must be dynamically switchable - Store user language
preference

Files:

    src/i18n/en.json
    src/i18n/hi.json

------------------------------------------------------------------------

## 🌐 API ARCHITECTURE

Centralized Axios client: `src/api/client.ts`

Must include: - Base URL from AppConfig - Request interceptor - Response
interceptor - Error handler - Token injection - Auto logout on 401

Service-based architecture only:

    product.service.ts
    vendor.service.ts
    category.service.ts

Rules: - No axios inside components - No duplicate API logic - No API
logic inside UI

------------------------------------------------------------------------

## 🧠 STATE MANAGEMENT (ZUSTAND)

Rules: - Separate stores by domain - Persist cart using AsyncStorage -
No business logic inside components - Store handles derived logic

Stores: - auth.store.ts - cart.store.ts - user.store.ts - app.store.ts

------------------------------------------------------------------------

## 🎨 THEME SYSTEM

Create: `src/config/theme.ts`

Include: - Colors - Spacing scale - Typography scale - Font sizes -
Border radius - Shadows

Rules: - No hardcoded color values - No hardcoded spacing - Use theme
tokens everywhere

------------------------------------------------------------------------

## 🏗 SCALABLE MARKETPLACE STRUCTURE

Architecture must support: - Food - Grocery - Electronics - Fashion -
Future categories

Generic Structure:

Category\
→ Vendor\
→ Product\
→ Cart (Global)\
→ Checkout

No food-specific logic.

------------------------------------------------------------------------

## 🔐 AUTHENTICATION ARCHITECTURE

JWT-based authentication.

Requirements: - Store token securely - Inject token via Axios
interceptor - Auto logout on 401 - Centralized auth store - No auth
logic inside UI

------------------------------------------------------------------------

## 🖼 PNG DESIGN INTEGRATION RULES

If PNG design is provided:

1.  Convert UI into reusable components
2.  Extract layout primitives
3.  Do not hardcode spacing
4.  Use theme tokens
5.  Create reusable components:
    -   Button
    -   Input
    -   Card
    -   Header
    -   ProductItem
    -   VendorItem

Match: - Spacing - Typography scale - Alignment - Component hierarchy

------------------------------------------------------------------------

## 🚀 PERFORMANCE RULES

Use: - React.memo - useCallback - useMemo - Optimized FlatList -
Pagination-ready architecture

Avoid: - Inline functions - Large monolithic components - Unnecessary
re-renders

------------------------------------------------------------------------

## 🧱 DEVELOPMENT ORDER

1.  Folder structure
2.  AppConfig
3.  Theme system
4.  i18n setup
5.  Axios client with interceptors
6.  Navigation structure
7.  Base reusable components
8.  Home screen foundation

Do not build business logic first. Build clean foundation first.

------------------------------------------------------------------------

## 🧭 LONG-TERM SCALABILITY

Future-ready for: - Delivery partner app - Admin panel - Wallet system -
Push notifications - Real-time order tracking - Microservices migration

Design foundation accordingly.

------------------------------------------------------------------------

## ✅ FINAL INSTRUCTION

Build a production-level scalable foundation first.

Do not generate demo or temporary code.

Everything must be maintainable, clean, and enterprise-ready.
