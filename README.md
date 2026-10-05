# Welcome to React Router!

A modern, production-ready template for building full-stack React applications using React Router.

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/remix-run/react-router-templates/tree/main/default)

## Features

- 🚀 Server-side rendering
- ⚡️ Hot Module Replacement (HMR)
- 📦 Asset bundling and optimization
- 🔄 Data loading and mutations
- 🔒 TypeScript by default
- 🎉 TailwindCSS for styling
- 📖 [React Router docs](https://reactrouter.com/)

## Getting Started

### Installation

Install the dependencies:

```bash
npm install
```

### Development

Start the development server with HMR:

```bash
npm run dev
```

Your application will be available at `http://localhost:5173`.

### User management demo

After signing in, open **Quản lý người dùng** in the sidebar or visit `/users`.
The table contains 100 deterministic fake users. Submit the search form to filter
by name (with or without Vietnamese accents), phone, email, or user ID.

- `/users?search_key=nguyen`
- `/users?page=2&limit=10`
- `/users?page=1&limit=5&search_key=123`

Page sizes are 5, 10, 20, and 50. Search and page-size changes reset to page 1;
reload and browser Back/Forward restore the URL state. Invalid page/limit values
are normalized. **Xuất Excel** downloads all matching users across every page
as `.xlsx`, preserving phone numbers as text. The export library loads on demand.

Fixtures and query/export helpers live in `app/features/users/`.
Run `pnpm test` for unit tests and `pnpm build && pnpm test:e2e` for browser tests.

## Building for Production

Create a production build:

```bash
npm run build
```

## Deployment

### Docker Deployment

To build and run using Docker:

```bash
docker build -t my-app .

# Run the container
docker run -p 3000:3000 my-app
```

The containerized application can be deployed to any platform that supports Docker, including:

- AWS ECS
- Google Cloud Run
- Azure Container Apps
- Digital Ocean App Platform
- Fly.io
- Railway

### DIY Deployment

If you're familiar with deploying Node applications, the built-in app server is production-ready.

Make sure to deploy the output of `npm run build`

```
├── package.json
├── package-lock.json (or pnpm-lock.yaml, or bun.lockb)
├── build/
│   ├── client/    # Static assets
│   └── server/    # Server-side code
```

## Styling

This template comes with [Tailwind CSS](https://tailwindcss.com/) already configured for a simple default starting experience. You can use whatever CSS framework you prefer.

---

Built with ❤️ using React Router.

Login UI adapts the official [shadcn login-04 block](https://ui.shadcn.com/blocks/login), with Button, Input, Label and Card from the [new-york registry](https://ui.shadcn.com/r/styles/new-york/button.json). Imports use the existing `~/` alias and Tailwind 4 theme.
# react-template
