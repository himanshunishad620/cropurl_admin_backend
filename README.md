# 🔐 CropURL Admin Backend

The **CropURL Admin Backend** is the server-side API for CropURL, a full-stack URL shortener and QR code analytics platform.

It provides secure REST APIs for authentication, user management, URL and QR code management, analytics, and other administrative operations.

## 🚀 Features

- 🔐 JWT-based authentication and authorization
- 👤 User management
- 🔗 Short URL management
- 📱 QR code management
- 📊 Analytics and engagement data
- 👥 Visitor and unique visitor tracking
- 🌍 Location-based analytics
- 🌐 Browser and operating system tracking
- 📈 Daily clicks and scans tracking
- 📧 Email verification and password reset
- 🔒 Protected admin routes
- 🌐 RESTful API architecture

## 🛠️ Tech Stack

- **Node.js**
- **Express.js**
- **MongoDB**
- **Mongoose**
- **JWT**
- **Bcrypt**
- **Resend**

## 💻 Installation

Clone the repository:

```bash
git clone https://github.com/himanshunishad620/cropurl_admin_backend.git
cd cropurl_admin_backend
```

Install dependencies:

```bash
npm install
```

Create your `.env` file and add the required configuration.

```env
MONGODB_URI=<your_mongodb_connection_string>
JWT_SECRET=<your_jwt_secret>
NODE_ENV=development
CLIENT_URL=<your_frontend_url>
CLICK_URL=<your_click_tracking_backend_url>
RESEND_API_KEY=<your_resend_api_key>

```

Start the development server:

```bash
npm start
```

The API will be available at:

```text
http://localhost:5000
```

## ⚙️ Environment Variables

Create a `.env` file in the root directory and configure the required environment variables:

> ⚠️ Never commit your `.env` file or expose sensitive credentials in the repository.

## ⚠️ Dependency

This project requires the **Click & Scan Management Backend** for click and QR scan tracking.

**Repository:** https://github.com/himanshunishad620/cropurl_user_backend

## 🔌 API

The backend exposes REST APIs for:

| Module         | Description                                       |
| -------------- | ------------------------------------------------- |
| Authentication | Registration, login, verification, password reset |
| Users          | User profile and account management               |
| URLs           | Create, update, delete and manage short URLs      |
| QR Codes       | Generate and manage QR codes                      |
| Analytics      | Clicks, scans, visitors and engagement data       |
| Admin          | Administrative operations and management          |

## 🏗️ Architecture

The backend follows a modular architecture separating:

**Routes → Controllers → Services/Utilities → Models → MongoDB**

Middleware is used for authentication, authorization, request processing, and error handling.

## 🔗 Related Project

**CropURL** — Full-stack URL shortener and QR analytics platform.

Live application: **https://cropurl.in**

## 📌 Purpose

This backend was developed as part of CropURL to provide a secure and scalable API layer for URL shortening, QR code management, authentication, and analytics.

## 👨‍💻 Author

**Himanshu Nishad**
