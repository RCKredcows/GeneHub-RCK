import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Landing from '../pages/Landing'
import { isSlugAvailable } from '../api/tenants'

vi.mock('../api/tenants', () => ({
  isSlugAvailable: vi.fn(() => Promise.resolve(true)),
  startCheckout: vi.fn(),
}))

// One change event per key, the way a browser reports typing, so the field's
// cleanup runs on every intermediate value rather than once on the whole word.
function typeInto(input: HTMLInputElement, text: string) {
  for (const char of text) {
    fireEvent.change(input, { target: { value: input.value + char } })
  }
}

function addressInput() {
  render(
    <MemoryRouter>
      <Landing />
    </MemoryRouter>
  )
  return screen.getByLabelText('Workspace address') as HTMLInputElement
}

describe('Landing workspace address', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // jsdom has no matchMedia; the page reads it for prefers-reduced-motion.
    window.matchMedia = vi.fn().mockReturnValue({ matches: true }) as unknown as typeof window.matchMedia
  })

  it('keeps a hyphen typed between words', () => {
    const input = addressInput()
    typeInto(input, 'rehearsal-ranch')
    expect(input.value).toBe('rehearsal-ranch')
  })

  it('turns spaces and other characters into single hyphens as they are typed', () => {
    const input = addressInput()
    typeInto(input, 'Bar 7  Cattle')
    expect(input.value).toBe('bar-7-cattle')
  })

  it('trims a trailing hyphen when the field is left', () => {
    const input = addressInput()
    typeInto(input, 'ranch-')
    expect(input.value).toBe('ranch-')
    fireEvent.blur(input)
    expect(input.value).toBe('ranch')
  })

  it('checks availability of the trimmed address', async () => {
    const input = addressInput()
    typeInto(input, 'rehearsal-ranch-')
    await waitFor(() => expect(isSlugAvailable).toHaveBeenCalledWith('rehearsal-ranch'))
    expect(isSlugAvailable).not.toHaveBeenCalledWith('rehearsal-ranch-')
  })
})
