import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAsyncOperation } from '../hooks/useAsyncOperation'

describe('useAsyncOperation', () => {
  describe('error message formatting', () => {
    it('formats duplicate key errors', async () => {
      const { result } = renderHook(() => useAsyncOperation())

      await act(async () => {
        await result.current.execute(async () => ({
          error: { message: 'duplicate key value violates unique constraint' }
        }))
      })

      expect(result.current.error).toBe('This record already exists')
    })

    it('formats unique constraint errors', async () => {
      const { result } = renderHook(() => useAsyncOperation())

      await act(async () => {
        await result.current.execute(async () => ({
          error: { message: 'unique constraint violation on table' }
        }))
      })

      expect(result.current.error).toBe('This record already exists')
    })

    it('formats foreign key constraint errors', async () => {
      const { result } = renderHook(() => useAsyncOperation())

      await act(async () => {
        await result.current.execute(async () => ({
          error: { message: 'foreign key constraint violation' }
        }))
      })

      expect(result.current.error).toBe('Cannot complete this action - related records exist')
    })

    it('formats permission denied errors', async () => {
      const { result } = renderHook(() => useAsyncOperation())

      await act(async () => {
        await result.current.execute(async () => ({
          error: { message: 'permission denied for table users' }
        }))
      })

      expect(result.current.error).toBe('You do not have permission to perform this action')
    })

    it('formats JWT expired errors', async () => {
      const { result } = renderHook(() => useAsyncOperation())

      await act(async () => {
        await result.current.execute(async () => ({
          error: { message: 'JWT expired' }
        }))
      })

      expect(result.current.error).toBe('Your session has expired. Please log in again')
    })

    it('formats network errors', async () => {
      const { result } = renderHook(() => useAsyncOperation())

      await act(async () => {
        await result.current.execute(async () => ({
          error: { message: 'Failed to fetch' }
        }))
      })

      expect(result.current.error).toBe('Unable to connect. Please check your internet connection')
    })

    it('formats technical messages with underscores as generic error', async () => {
      const { result } = renderHook(() => useAsyncOperation())

      await act(async () => {
        await result.current.execute(async () => ({
          error: { message: 'some_technical_error_message' }
        }))
      })

      expect(result.current.error).toBe('Unable to complete this action. Please try again')
    })

    it('passes through non-technical error messages', async () => {
      const { result } = renderHook(() => useAsyncOperation())

      await act(async () => {
        await result.current.execute(async () => ({
          error: { message: 'Something went wrong' }
        }))
      })

      expect(result.current.error).toBe('Something went wrong')
    })

    it('handles thrown errors', async () => {
      const { result } = renderHook(() => useAsyncOperation())

      await act(async () => {
        await result.current.execute(async () => {
          throw new Error('Network request failed')
        })
      })

      expect(result.current.error).toBe('Unable to connect. Please check your internet connection')
    })
  })

  describe('loading states', () => {
    it('returns to loading false after execution completes', async () => {
      const { result } = renderHook(() => useAsyncOperation())

      await act(async () => {
        await result.current.execute(async () => {
          return { data: 'success' }
        })
      })

      expect(result.current.loading).toBe(false)
    })

    it('returns to deleting false after delete execution completes', async () => {
      const { result } = renderHook(() => useAsyncOperation())

      await act(async () => {
        await result.current.execute(async () => {
          return { data: 'deleted' }
        }, { isDelete: true })
      })

      expect(result.current.deleting).toBe(false)
    })
  })

  describe('successful operations', () => {
    it('returns data on success', async () => {
      const { result } = renderHook(() => useAsyncOperation())

      let response: { data: unknown; error: unknown } | undefined
      await act(async () => {
        response = await result.current.execute(async () => ({
          data: { id: '123', name: 'Test' }
        }))
      })

      expect(response!.data).toEqual({ id: '123', name: 'Test' })
      expect(response!.error).toBeNull()
      expect(result.current.error).toBe('')
    })

    it('clears previous errors on new execution', async () => {
      const { result } = renderHook(() => useAsyncOperation())

      // First, create an error
      await act(async () => {
        await result.current.execute(async () => ({
          error: { message: 'First error' }
        }))
      })

      expect(result.current.error).toBeTruthy()

      // Then execute successfully
      await act(async () => {
        await result.current.execute(async () => ({
          data: { success: true }
        }))
      })

      expect(result.current.error).toBe('')
    })
  })
})
