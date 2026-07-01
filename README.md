# FutureBlink Shopify Assignment: Storefront Announcement App

A full-stack Shopify App built using React Router and MongoDB to manage dynamic storefront announcement banners with an edit audit history.

## 🔄 Revert Task Details & Submission

This section documents the fixes implemented in response to the feedback received:

### 1. Fixed Production Auth Redirect Flow
* **Issue:** The app was failing during the OAuth redirect flow on production (Render).
* **Resolution:** 
  * Updated [auth.$.jsx](file:///Users/anujsolania/Desktop/futureblink-shopify-app-assignment/app/routes/auth.$.jsx) to handle incoming requests on the wildcard auth route by authenticating the admin and redirecting to `/app` with the correct query parameters (`shop`, `host`, etc.).
  * Updated [shopify.app.futureblink-announcement-app.toml](file:///Users/anujsolania/Desktop/futureblink-shopify-app-assignment/shopify.app.futureblink-announcement-app.toml) to map the production `application_url` and `redirect_urls` pointing to the Render deployment: `https://futureblink-shopify-app-assignment.onrender.com`.
* **Code Commit:** [bc0de51ed4038898b2ff25c89ac4f81d334e30e1](https://github.com/anujsolania/futureblink-shopify-app-assignment/commit/bc0de51ed4038898b2ff25c89ac4f81d334e30e1)

### 2. Fixed Dashboard Save Button Action
* **Issue:** Dashboard form submission or primary button was misconfigured.
* **Resolution:** 
  * Updated the button in [app._index.jsx](file:///Users/anujsolania/Desktop/futureblink-shopify-app-assignment/app/routes/app._index.jsx) to correctly use `variant="primary"` for proper Shopify Polaris rendering, ensuring the action is dispatched correctly.
* **Code Commit:** [9fdd8b81d9bcd18d18b26d8badeabc13aee0a96f](https://github.com/anujsolania/futureblink-shopify-app-assignment/commit/9fdd8b81d9bcd18d18b26d8badeabc13aee0a96f)

---

## 🚀 Deployed App Submission Links
* **Live App URL:** [https://futureblink-shopify-app-assignment.onrender.com](https://futureblink-shopify-app-assignment.onrender.com)
* **GitHub Repository:** [https://github.com/anujsolania/futureblink-shopify-app-assignment](https://github.com/anujsolania/futureblink-shopify-app-assignment)

---

## 🛠️ App Architecture & Features

### 1. Merchant Admin Dashboard
* **Route:** `/app` (`app/routes/app._index.jsx`)
* **Features:**
  * **Announcement Editor:** A text-field form to change the globally displayed storefront announcement text.
  * **Live Storefront Preview:** Recreates the appearance of the live storefront banner dynamically using the active state.
  * **MongoDB Audit Logs:** Fetches and displays the 10 most recent updates showing when the announcement was modified and what text was set.

### 2. Storefront App Block Extension
* **Location:** `extensions/storefront-announcement`
* **Features:**
  * Targets the `body` element of the Shopify online store.
  * Dynamically queries the Shopify Metafield `shop.metafields.my_app.announcement` using Liquid.
  * Fully styled top-pinned header banner with dynamic merchant-customizable settings (Background Color, Text Color) configured in the Shopify Theme Editor.

### 3. Backend & Data Integration
* **Shopify Metafields:** Used for fast storefront reading. Bypasses app server load by directly checking shop-level metafield values in Liquid.
* **MongoDB (Atlas):** Persistent storage of history logs. Uses a Mongoose model schema (`Announcement`) to record every change.

---

## 💻 Local Development Setup

1. **Install Dependencies:**
   ```bash
   npm install
   ```
2. **Environment Variables (`.env`):**
   Add your `MONGODB_URI` and connection details to the `.env` file.
3. **Database Migration:**
   ```bash
   npx prisma generate
   npx prisma migrate deploy
   ```
4. **Start Development Server:**
   ```bash
   npm run dev
   ```
