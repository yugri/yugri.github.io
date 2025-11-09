# AGENTS.md — Guidelines for AI Coding Agents

This document defines how AI coding agents must work in this repository.

The project is an **Astro + TypeScript blog**.  
All changes must align with the standards below: coding style, typing practices, commits, and project structure.

---

## 1. Core Principles

1. **Safety first**
   - Do not introduce breaking changes to build, deployment, or content pipeline unless explicitly asked.
   - Do not remove configuration files or dependencies without a clear reason.

2. **Minimal, focused changes**
   - Each PR or commit should have a single clear purpose.
   - Avoid large refactors unless explicitly requested.
   - Prefer small, readable diffs over “clever” but hard-to-understand code.

3. **Consistency over novelty**
   - Follow existing patterns and conventions.
   - Introduce new ones only when justified and consistent with the codebase.

4. **Type-safe, modern code**
   - Use modern, idiomatic TypeScript and Astro.
   - Avoid deprecated or legacy APIs.

5. **Content is critical**
   - Do not alter blog content (`.md`, `.mdx`, `.astro`) unless the task explicitly requires it.
   - Do not rewrite posts for style or tone without explicit instruction.

---

## 2. Tech Stack Assumptions

| Category | Technology |
|-----------|-------------|
| **Framework** | [Astro](https://astro.build/) |
| **Language** | TypeScript (strict mode) |
| **UI** | Astro components and islands (React/Svelte/Vue if already used) |
| **Styling** | Tailwind CSS / CSS Modules / Global CSS (follow existing setup) |
| **Tooling** | ESLint · Prettier · npm/pnpm/bun (match `packageManager` in `package.json`) |

---

## 3. Project Structure & Naming

Maintain the existing file structure; do not invent new hierarchies.

```
src/
├─ pages/         → *.astro (routes, kebab-case)
├─ components/    → PascalCase.astro / .tsx
├─ lib/ or utils/ → helper logic (kebab-case.ts)
├─ types/         → global types
```

When adding new files:
- Use the same naming convention as neighboring files.
- Place them in the most relevant existing folder.

---

## 4. TypeScript Practices

### 4.1 General Rules

- **Strict typing is required.**
- Avoid `any` or `unknown` unless absolutely necessary and documented.
- Let TypeScript infer types when clear.
- Assume compiler options such as `noImplicitAny` and `strictNullChecks` are enabled.

### 4.2 `type` vs `interface`

Use `type` for most object shapes; use `interface` when extending multiple sources or for class-like patterns.

```ts
export type Post = {
  slug: string;
  title: string;
  date: string;
  excerpt?: string;
};
```

### 4.3 Avoid `any`

**Bad:**
```ts
function parse(data: any) {
  // ...
}
```

**Good:**
```ts
type RawPost = {
  slug: string;
  title: string;
  date: string;
  [key: string]: unknown;
};

function parsePost(data: RawPost) {
  // ...
}
```

If `any` is unavoidable, add a justification comment:
```ts
// NOTE: External API returns any; validated before use.
const rawData: any = externalSource.get();
```

### 4.4 Type Guards

```ts
function isPost(value: unknown): value is Post {
  return (
    typeof value === "object" &&
    value !== null &&
    "slug" in value &&
    typeof (value as any).slug === "string"
  );
}
```

### 4.5 Enums / Unions

Prefer union types over enums unless required for interoperability.

```ts
export type Theme = "light" | "dark";
```

---

## 5. Astro & Component Guidelines

### 5.1 Astro Components

```astro
---
import type { Post } from "../types/post";

interface Props {
  post: Post;
}

const { post } = Astro.props;
---

<article>
  <h1>{post.title}</h1>
  <p>{post.excerpt}</p>
</article>
```

- Keep frontmatter minimal and typed.
- Extract heavy logic into `lib/` or `utils/`.

### 5.2 TSX / JSX Islands

```tsx
type PostCardProps = {
  title: string;
  url: string;
};

export function PostCard({ title, url }: PostCardProps) {
  return (
    <a href={url}>
      <h2>{title}</h2>
    </a>
  );
}
```

- Use function components.
- Type props explicitly.
- Avoid `React.FC` unless already standard.

### 5.3 Accessibility

- Use semantic HTML (`<main>`, `<header>`, `<section>`, `<article>`, `<footer>`).
- Ensure keyboard accessibility.
- All images must include descriptive `alt` attributes.

---

## 6. Styling Conventions

**Tailwind CSS:**
- Use utility classes directly.
- Keep class lists concise.
- Use `class` in `.astro` templates, not `className`.

**CSS Modules / Global CSS:**
- Follow BEM or existing conventions.
- Avoid inline styles except for rare one-off cases.

Do not introduce a new styling system without explicit approval.

---

## 7. Imports & Modules

```ts
import fs from "node:fs/promises";
import { getCollection } from "astro:content";
import { formatDate } from "@/lib/date";
import type { Post } from "@/types/post";
```

- Use ES Modules (`import`/`export`) only.
- Prefer absolute imports if configured (`@/components/...`).
- Order imports:
  1. Node / core
  2. Third-party
  3. Internal
- Avoid circular dependencies.

---

## 8. Error Handling & Logging

```ts
export async function loadPosts() {
  try {
    return await getCollection("blog");
  } catch (error) {
    console.error("Failed to load blog posts", error);
    throw new Error("Unable to load posts");
  }
}
```

- Handle I/O and network errors explicitly.
- Never leave stray `console.log` statements.

---

## 9. Testing Practices (If Applicable)

- Add tests for new features and bug fixes.
- Keep tests deterministic and fast.
- Mock external services.
- Do not introduce new testing frameworks unless requested.

---

## 10. Conventional Commits

### 10.1 Format

```
<type>[optional scope]: <short summary>

[optional body]

[optional footer]
```

### 10.2 Common Types

| Type | Purpose |
|------|----------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Code style changes (no logic) |
| `refactor` | Code restructuring |
| `perf` | Performance improvement |
| `test` | Tests only |
| `build` | Build system or dependencies |
| `ci` | CI configuration |
| `chore` | Maintenance tasks |
| `revert` | Reverting commits |

### 10.3 Examples

```
feat(blog): add pagination to posts list
fix(build): correct Astro config path
docs: add frontmatter field documentation
refactor(posts): extract date formatting helper
chore(deps): update Astro and TypeScript versions
```

Breaking changes:

```
feat(blog)!: change URL structure for posts

BREAKING CHANGE: Blog posts now use /blog/yyyy/mm/slug URLs
```

---

## 11. Content & Frontmatter Rules

Example:

```yaml
---
title: "My Post Title"
description: "Short SEO-friendly description"
pubDate: "2025-01-01"
updatedDate: "2025-01-02"
tags:
  - astro
  - typescript
draft: false
---
```

- Do not change post slugs unless explicitly required.
- Keep all standard fields even if not currently used.

---

## 12. AI Agent Instructions

### 12.1 Do Not
- Edit lockfiles (`package-lock.json`, `pnpm-lock.yaml`, etc.) unless instructed.
- Upgrade major dependencies without approval.
- Introduce new libraries without discussion.

### 12.2 Do
- Respect ESLint / Prettier rules.
- Run or simulate `lint`, `build`, `test` when feasible.
- Keep changes minimal and scoped.
- Add clear, minimal `TODO` comments when necessary.

```ts
// TODO: add tag filtering once implemented
```

### 12.3 If Unsure
- Default to the simplest, safest, and most maintainable solution.
- Prefer non-disruptive edits.

---

## 13. Summary

By following **AGENTS.md**, AI coding agents will ensure this Astro + TypeScript blog remains:

- **Consistent**  
- **Type-safe**  
- **Accessible**  
- **Maintainable**

---
