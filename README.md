<div align="center">

<img src="public/logo-navbar.svg" alt="SonaMoney Logo" width="220" />

# 💰 SonaMoney

**Modern Web-Based Financial Management Solution**

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?logo=supabase)](https://supabase.io/)
[![License](https://img.shields.io/badge/License-ISC-green.svg)](LICENSE)

[Features](#-features) • [Tech Stack](#-tech-stack) • [Getting Started](#-getting-started) • [Development](#-development) • [Security](#-security)

</div>

---

## 📋 Overview

SonaMoney is a comprehensive financial tracking solution built with modern web technologies. It empowers users to manage transactions, monitor budgets, analyze spending patterns, and achieve their financial goals through an intuitive, responsive interface.

> **🎯 Design Philosophy**: Built with data integrity and server-side validation at its core, SonaMoney ensures a stable and secure system that users can trust with their financial information.

---

## ✨ Features

### 🎯 Core Functionality

| Feature | Description | Status |
|---------|-------------|--------|
| 🔐 **User Authentication** | Secure authentication powered by Supabase Auth with session management | ✅ Active |
| 💸 **Transaction Management** | Add, edit, categorize, and track income and expenses with ease | ✅ Active |
| 📊 **Dashboard Analytics** | Visual insights into spending patterns with interactive charts | ✅ Active |
| 🎯 **Budget Planning** | Set and monitor budgets with progress tracking and alerts | ✅ Active |
| 🏦 **Account Management** | Multi-account support for organizing different financial sources | ✅ Active |
| 💳 **Debt Tracking** | Monitor liabilities and repayment progress | ✅ Active |
| 📅 **Calendar View** | Visualize transactions on a calendar for temporal awareness | ✅ Active |
| 📷 **Receipt Scanning** | AI-powered receipt scanning for automated expense entry | ✅ Active |
| 📤 **Data Export** | Export financial data to Excel and PDF formats | ✅ Active |

### 🚀 Additional Capabilities

- 🌍 **Multi-currency Support** — Handle transactions in different currencies
- 🌙 **Dark Mode** — Comfortable viewing in any lighting condition
- 📱 **Responsive Design** — Seamless experience across desktop and mobile devices
- 🤖 **AI Assistant** — Integrated chat support for financial queries

---

## 🛠️ Tech Stack

<div align="center">

| Category | Technology | Purpose |
|:--------:|:----------:|:--------|
| ⚡ **Framework** | [![Next.js](https://img.shields.io/badge/Next.js-000000?logo=next.js&logoColor=white)](https://nextjs.org/) | React framework with App Router |
| 📘 **Language** | [![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/) | Type-safe development |
| 🎨 **Styling** | [![Tailwind CSS](https://img.shields.io/badge/Tailwind-06B6D4?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/) | Utility-first CSS framework |
| 🗄️ **Backend** | [![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?logo=supabase&logoColor=white)](https://supabase.io/) | PostgreSQL database & Auth |
| ✅ **Validation** | [![Zod](https://img.shields.io/badge/Zod-3E67B1?logo=zod&logoColor=white)](https://zod.dev/) | Schema validation |
| 🗃️ **State** | [![Zustand](https://img.shields.io/badge/Zustand-433E38?logo=react&logoColor=white)](https://github.com/pmndrs/zustand) | Lightweight state management |
| 📋 **Forms** | [![React Hook Form](https://img.shields.io/badge/React_Hook_Form-EC5990?logo=react&logoColor=white)](https://react-hook-form.com/) | Performant form handling |
| 📈 **Charts** | [![Recharts](https://img.shields.io/badge/Recharts-22A6B3?logo=recharts&logoColor=white)](https://recharts.org/) | Composable charting library |
| 🤖 **AI** | [![Google AI](https://img.shields.io/badge/Gemini_AI-4285F4?logo=google&logoColor=white)](https://ai.google.dev/) | Intelligent features |
| 🧪 **Testing** | [![Vitest](https://img.shields.io/badge/Vitest-6E9F18?logo=vitest&logoColor=white)](https://vitest.dev/) | Unit testing framework |

</div>

---

## 🏗️ Architecture & Robustness

SonaMoney is engineered with enterprise-grade principles:

> **🔒 Data Integrity**: All database operations enforce referential integrity through PostgreSQL constraints and triggers. Migrations are versioned and reproducible.

> **✅ Server-Side Validation**: Every API endpoint validates incoming requests using Zod schemas before processing, preventing malformed data from reaching the database.

> **🛡️ Security-First Design**: HMAC-SHA256 request signing, IDOR prevention mechanisms, and input sanitization are implemented throughout the application.

> **📘 Type Safety**: Comprehensive TypeScript coverage ensures compile-time error detection and improved developer experience.

---

## 🚀 Getting Started

### 📋 Prerequisites

- **Node.js** 18.x or higher
- **npm** or **yarn** package manager
- **Supabase** account (free tier available)
- **Google AI Studio** account (for receipt scanning)

### ⚡ Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/kevindocm/sonamoney.git
cd sonamoney

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env.local
```

### 🔧 Environment Configuration

Edit `.env.local` with your credentials:

| Variable | Source | Required |
|----------|--------|:--------:|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project Settings → API | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Project Settings → API | ✅ |
| `GEMINI_API_KEY` | [Google AI Studio](https://makersuite.google.com/app/apikey) | ✅ |
| `NEXT_PUBLIC_REQUEST_SECRET` | Generate: `openssl rand -base64 32` | ✅ |

### 🗄️ Database Setup

Run the migration files in `supabase/migrations/` through the Supabase SQL Editor in order.

---

## 💻 Development

### 🖥️ Development Server

Start the local development server with hot reload:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

### 📦 Production Build

Create an optimized production build:

```bash
npm run build
```

### 🧪 Testing

Run the test suite:

```bash
# Run tests in watch mode
npm run test

# Run tests with UI
npm run test:ui

# Generate coverage report
npm run test:coverage
```

---

## 🔒 Security

### 🔍 System Health Check

Maintain code quality and security standards with the built-in audit system:

```bash
npx tsx scripts/security-audit.ts
```

This script performs comprehensive checks:
- ✅ Validates security configurations
- ✅ Scans for potential IDOR vulnerabilities  
- ✅ Verifies HMAC signature validation
- ✅ Ensures input sanitization compliance

### 📜 Available Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | 🖥️ Start development server |
| `npm run build` | 📦 Create production build |
| `npm run lint` | 🔍 Run ESLint code analysis |
| `npm run test` | 🧪 Execute test suite |
| `npm run maintenance:on` | 🔧 Enable maintenance mode |
| `npm run maintenance:off` | ✅ Disable maintenance mode |

---

## 📄 License

This project is licensed under the **ISC License**. See [LICENSE](LICENSE) for details.

---

<div align="center">

**[⬆ Back to Top](#-sonamoney)**

Built with 💚 for modern financial management.

</div>
