# Contributing to Paylocity Compensation Journey

Thank you for your interest in contributing! This document provides guidelines for contributing to the project.

## Getting Started

### Prerequisites

- A modern web browser (Chrome, Firefox, Safari, or Edge)
- Git
- Optional: Python 3 (for local server) or Node.js (for tests)

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/tejasgadhia/paylocity-compensation-journey.git
   cd paylocity-compensation-journey
   ```

2. **Open in browser**
   ```bash
   # Option 1: Direct file
   open index.html

   # Option 2: Local server (recommended for module loading)
   python -m http.server 8000
   # Then visit http://localhost:8000
   ```

No build process is required. The app runs entirely in the browser.

## Development Workflow

### Branch Naming

Use descriptive branch names that reference the issue number:

```bash
# For new features
feature/issue-123

# For bug fixes
fix/issue-123

# For documentation
docs/issue-123
```

### Working on Issues

1. **Find an issue** - Check [open issues](https://github.com/tejasgadhia/paylocity-compensation-journey/issues)
2. **Create a branch** from `main`:
   ```bash
   git checkout main
   git pull origin main
   git checkout -b feature/issue-123
   ```
3. **Make your changes** following the code standards below
4. **Test your changes** (see Testing section)
5. **Commit with conventional format** (see Commit Messages)
6. **Open a pull request**

### Commit Messages

Use [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>: <description>

[optional body]

Fixes #123
```

**Types:**
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - CSS/formatting changes (no logic changes)
- `refactor:` - Code restructuring (no behavior changes)
- `test:` - Adding/updating tests
- `chore:` - Build, dependencies, tooling

**Examples:**
```bash
feat: add export to CSV functionality

Adds a new button to export compensation history to CSV format.
Supports both dollar and indexed views.

Fixes #45
```

```bash
fix: correct CAGR calculation for partial years

The previous calculation assumed full years only.
Now properly handles fractional tenure periods.

Fixes #78
```

## Code Standards

### JavaScript

- **ES6+ syntax** - Use modern JavaScript features (const/let, arrow functions, template literals)
- **camelCase** for functions and variables: `calculateCAGR()`, `employeeData`
- **PascalCase** for constants: `CPI_DATA`, `BENCHMARKS`
- **No external dependencies** without discussion - keep the app self-contained

```javascript
// Good
const calculateGrowth = (start, end) => ((end - start) / start) * 100;

// Avoid
function calculateGrowth(start, end) {
  return ((end - start) / start) * 100;
}
```

### CSS

- Use existing CSS custom properties for colors and spacing
- Follow the existing theme structure (tactical/artistic)
- Mobile is intentionally blocked - focus on desktop experience

```css
/* Good - uses existing variables */
.new-component {
  background: var(--secondary-bg);
  color: var(--text-primary);
}

/* Avoid - hardcoded colors */
.new-component {
  background: #1a1a1b;
  color: #ffffff;
}
```

### Module Structure

The app uses ES6 modules with dependency injection. If adding new functionality:

1. Create a new file in `js/` if it's a distinct concern
2. Export an `init` function that receives dependencies
3. Import and initialize in `app.js`

```javascript
// js/new-feature.js
let _deps = {};

export function initNewFeature(deps) {
  _deps = deps;
}

export function doSomething() {
  const data = _deps.getEmployeeData();
  // ...
}
```

## Testing

### Before Committing

1. **Syntax check**
   ```bash
   node --check app.js
   node --check js/*.js
   ```

2. **Run tests** (if applicable)
   ```bash
   npm test
   ```

3. **Manual testing**
   - Test with demo data (click "Try Demo")
   - Test both themes (tactical/artistic)
   - Test privacy mode toggle
   - Check browser console for errors

### E2E Tests

The project uses Playwright for end-to-end tests:

```bash
# Run all tests
npm test

# Run specific test file
npx playwright test tests/e2e/demo-data.spec.js

# Run with UI
npx playwright test --ui
```

See `tests/README.md` for detailed testing documentation.

## Pull Request Process

### Before Opening

- [ ] Code follows the style guidelines
- [ ] Self-review completed
- [ ] Tests pass locally
- [ ] Commits use conventional format
- [ ] PR references the related issue

### PR Template

When opening a PR, include:

```markdown
## Summary
Brief description of changes

## Related Issue
Fixes #123

## Changes Made
- Change 1
- Change 2

## Testing Done
- [ ] Demo data works
- [ ] Both themes work
- [ ] Privacy mode works
- [ ] No console errors
```

### Review Process

1. Maintainer will review within a few days
2. Address any feedback
3. Once approved, maintainer will merge

## Issue Reporting

### Bug Reports

When reporting bugs, include:

1. **Expected behavior** - What should happen
2. **Actual behavior** - What actually happens
3. **Steps to reproduce** - How to trigger the bug
4. **Browser/OS** - Your environment
5. **Screenshots** - If it's a visual issue

### Feature Requests

For new features:

1. **Use case** - Why is this needed?
2. **Proposed solution** - How should it work?
3. **Alternatives considered** - Other approaches?

## Architecture Overview

See `CLAUDE.md` for detailed architecture documentation, including:

- Module dependency graph
- Data flow diagrams
- State management patterns
- Chart lifecycle

## Questions?

- Check existing [issues](https://github.com/tejasgadhia/paylocity-compensation-journey/issues) and discussions
- Review `CLAUDE.md` for technical details
- Open a new issue for questions not covered here

## License

By contributing, you agree that your contributions will be licensed under the [O'Saasy License Agreement](LICENSE.md).
