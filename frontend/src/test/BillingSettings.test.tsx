import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import BillingSettings from '../pages/Settings/components/BillingSettings'
import { fetchBilling, type Billing } from '../api/billing'

vi.mock('../api/billing', () => ({
  fetchBilling: vi.fn(),
  openBillingPortal: vi.fn(),
}))

// Midday UTC, so the formatted day is the same in any test machine's zone.
const PERIOD_END = '2026-12-16T12:00:00Z'

function billing(overrides: Partial<Billing>): Billing {
  return {
    status: 'active',
    trialEndsAt: null,
    currentPeriodEnd: PERIOD_END,
    cancelAt: null,
    exempt: false,
    hasSubscription: true,
    ...overrides,
  }
}

async function renderWith(value: Billing) {
  vi.mocked(fetchBilling).mockResolvedValue(value)
  render(<BillingSettings role="owner" />)
  await screen.findByText('Plan')
}

describe('BillingSettings renewal and cancellation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows the renewal date for an active subscription', async () => {
    await renderWith(billing({}))
    expect(screen.getByText('Renews')).toBeInTheDocument()
    expect(screen.queryByText('Ends')).not.toBeInTheDocument()
  })

  it('says a cancelled subscription ends rather than renews', async () => {
    await renderWith(billing({ cancelAt: PERIOD_END }))
    expect(screen.getByText('Ends')).toBeInTheDocument()
    expect(screen.getByText(/December 16, 2026 — cancelled, so it will not renew/)).toBeInTheDocument()
    expect(screen.queryByText('Renews')).not.toBeInTheDocument()
  })

  it('says a cancelled trial will not be charged', async () => {
    await renderWith(
      billing({ status: 'trialing', trialEndsAt: PERIOD_END, cancelAt: PERIOD_END })
    )
    expect(screen.getByText(/cancelled, so your card will not be charged/)).toBeInTheDocument()
    expect(screen.queryByText('Trial ends')).not.toBeInTheDocument()
  })

  it('shows nothing about ending once the subscription has ended', async () => {
    await renderWith(billing({ status: 'canceled', cancelAt: null }))
    expect(screen.getByText('Cancelled')).toBeInTheDocument()
    expect(screen.queryByText('Ends')).not.toBeInTheDocument()
    expect(screen.queryByText('Renews')).not.toBeInTheDocument()
  })
})
