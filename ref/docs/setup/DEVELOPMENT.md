# Development Guide

## 🛠️ Development Tools

### **Code Formatting (Prettier)**
```bash
# Format all files
npm run format

# Check formatting without changing files
npm run format:check
```

### **Testing (Vitest + React Testing Library)**
```bash
# Run tests in watch mode
npm test

# Run tests once
npm run test:run

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

### **Writing Tests**
Create test files next to components:
```
src/components/
├── JobCard.jsx
└── __tests__/
    └── JobCard.test.jsx
```

Example test:
```javascript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import JobCard from '../JobCard'

describe('JobCard', () => {
  it('renders job title', () => {
    const job = { title: 'Developer', company: 'Tech Corp' }
    render(<JobCard job={job} />)
    expect(screen.getByText('Developer')).toBeInTheDocument()
  })
})
```

### **Error Tracking (Sentry)**

**Setup:**
1. Go to https://sentry.io (free tier available)
2. Create a new project (React)
3. Copy your DSN
4. Add to `.env`:
   ```
   VITE_SENTRY_DSN=https://your-dsn@sentry.io/project-id
   ```

**Features:**
- Automatic error reporting in production
- Session replay for debugging
- Performance monitoring
- Only active when `VITE_SENTRY_DSN` is set

---

## 📦 Scripts

```bash
npm run dev              # Start dev server
npm run build            # Build for production
npm run preview          # Preview production build
npm run lint             # Run ESLint
npm test                 # Run tests (watch mode)
npm run test:run         # Run tests once
npm run format           # Format code with Prettier
```

---

## 🏗️ Project Structure

```
src/
├── components/          # React components
│   └── __tests__/      # Component tests
├── hooks/              # Custom React hooks
├── contexts/           # React contexts
├── lib/                # Utilities and configs
├── features/           # Feature modules
└── test/               # Test setup
```

---

## ✅ Best Practices

1. **Always format before committing:** `npm run format`
2. **Write tests for new components**
3. **Check tests pass:** `npm run test:run`
4. **Use TypeScript types in JSDoc** (future: migrate to TS)
5. **Keep components small and focused**
6. **Use custom hooks for logic**
7. **Test user interactions, not implementation**

---

## 🐛 Debugging

**Local Development:**
- React DevTools (browser extension)
- Console logs
- Vitest UI: `npm run test:ui`

**Production:**
- Sentry dashboard for errors
- Session replays
- Performance metrics

---

## 🚀 Deployment

```bash
# Deploy to Vercel
npm run deploy:vercel

# Deploy Supabase functions
npm run deploy:functions
```
