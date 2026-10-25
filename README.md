# Goodkind Cafe

A multi-page, fully responsive café website built with an editorial, warm minimalist aesthetic. The project also includes a completely separate, data-dense Admin Dashboard inspired by Cloudflare's Kumo design system.

## Overview

This repository contains two distinct user interfaces sharing a single Next.js codebase:

1. **The Public Website**: A high-end, editorial café experience featuring large typography, generous whitespace, and a warm, minimalist color palette. It includes the Home page, a full Menu, an About page, and a Find Us page.
2. **The Admin Dashboard**: A dark-mode, developer-tool aesthetic based on Cloudflare's Kumo design system. It features data-dense layouts, a sidebar navigation, and a usage metrics panel. 

The design systems are strictly separated. The public site uses the Geltek font and a cream/sage palette. The admin site uses system UI fonts and a high-contrast dark palette.

## Tech Stack

- **Framework**: Next.js (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Components**: shadcn/ui
- **Icons**: Lucide React (Public), Phosphor Icons (Admin)

## Project Structure

```text
├── app/
│   ├── (public)/
│   │   ├── page.tsx          # Home page
│   │   ├── menu/page.tsx     # Full menu page
│   │   ├── about/page.tsx    # About page
│   │   └── find-us/page.tsx  # Visit/Location page
│   ├── admin/
│   │   ├── layout.tsx        # Admin shell (Sidebar, TopNav)
│   │   └── page.tsx          # Admin dashboard main view
│   ├── globals.css           # Tailwind directives and Geltek font-face
│   └── layout.tsx            # Root layout
├── components/
│   ├── public/               # Navbar, Footer, ProductCard
│   └── admin/                # Sidebar, TopNav, DataTable
├── public/
│   └── fonts/                # Place Geltek font files here
├── tailwind.config.ts
├── package.json
└── README.md
