import { expect, afterEach, beforeEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'
import '@testing-library/jest-dom/vitest'
import { applyTenant } from '../config/tenant'

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers)

/**
 * Tenant branding is hydrated from the database at runtime, which does not
 * happen under test. Establish a known one instead of letting assertions
 * depend on the unbranded fallback, and deliberately not "RCK" -- a test that
 * passes only for the founding tenant would not catch the labels being
 * hardcoded again.
 */
export const TEST_TENANT = {
  slug: 'testco',
  name: 'Testco',
  legalName: 'Testco Genetics',
  logoUrl: '/test-logo.png',
  reportFooter: 'Testco Genetics - Internal Use Only',
  loginHint: 'Testco staff: use your company email',
}

beforeEach(() => {
  applyTenant(TEST_TENANT)
})

// Cleanup after each test
afterEach(() => {
  cleanup()
})
