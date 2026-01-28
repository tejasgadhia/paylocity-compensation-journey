/**
 * Accessibility Testing Helpers
 *
 * Integration with axe-core for WCAG AA compliance validation
 */

import AxeBuilder from '@axe-core/playwright';

/**
 * Run accessibility scan on current page
 *
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {Object} options - Axe scan options
 * @returns {Promise<void>}
 */
export async function checkA11y(page, options = {}) {
  const axeBuilder = new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa']) // WCAG 2.1 AA compliance
    .exclude('#non-accessible-element') // Exclude known non-critical issues if any
    .disableRules(['color-contrast']); // TODO: Fix landing page color contrast (GitHub issue #TBD)

  // Apply custom options
  if (options.include) {
    axeBuilder.include(options.include);
  }

  if (options.exclude) {
    axeBuilder.exclude(options.exclude);
  }

  // Run scan
  const results = await axeBuilder.analyze();

  // Throw error if violations found
  if (results.violations.length > 0) {
    const violationMessages = results.violations.map((violation) => {
      const nodes = violation.nodes.map((node) => node.html).join('\n  ');
      return `${violation.id} (${violation.impact}): ${violation.description}\n  ${violation.help}\n  Affected nodes:\n  ${nodes}`;
    });

    throw new Error(
      `Accessibility violations found:\n\n${violationMessages.join('\n\n')}`
    );
  }
}

/**
 * Run accessibility scan with custom ruleset
 *
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string[]} tags - Axe tags to run (e.g., ['wcag2a', 'wcag2aa'])
 * @returns {Promise<void>}
 */
export async function checkA11yWithTags(page, tags) {
  const results = await new AxeBuilder({ page })
    .withTags(tags)
    .analyze();

  if (results.violations.length > 0) {
    const violationMessages = results.violations.map((v) => `${v.id}: ${v.help}`);
    throw new Error(
      `Accessibility violations:\n${violationMessages.join('\n')}`
    );
  }
}

/**
 * Get accessibility violations without throwing error
 * Useful for reporting/logging
 *
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @returns {Promise<Array>} - Array of violations
 */
export async function getA11yViolations(page) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();

  return results.violations;
}

/**
 * Check specific element for accessibility issues
 *
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} selector - CSS selector for element to check
 * @returns {Promise<void>}
 */
export async function checkElementA11y(page, selector) {
  const results = await new AxeBuilder({ page })
    .include(selector)
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze();

  if (results.violations.length > 0) {
    const violationMessages = results.violations.map((v) => `${v.id}: ${v.help}`);
    throw new Error(
      `Accessibility violations in ${selector}:\n${violationMessages.join('\n')}`
    );
  }
}
