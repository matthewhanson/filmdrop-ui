import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TextField from './TextField'

describe('TextField', () => {
  let user

  beforeEach(() => {
    user = userEvent.setup()
  })

  describe('Basic Rendering', () => {
    it('should render with label', () => {
      const onChange = vi.fn()
      render(<TextField label="Test Label" value="" onChange={onChange} />)

      expect(screen.getByText('Test Label')).toBeInTheDocument()
    })

    it('should render with initial value', () => {
      const onChange = vi.fn()
      render(<TextField label="Test" value="initial" onChange={onChange} />)

      const input = screen.getByRole('textbox')
      expect(input.value).toBe('initial')
    })

    it('should apply custom className', () => {
      const onChange = vi.fn()
      const { container } = render(
        <TextField
          label="Test"
          value=""
          onChange={onChange}
          className="custom-class"
        />
      )

      const textField = container.querySelector('.TextField.custom-class')
      expect(textField).toBeInTheDocument()
    })

    it('should render with number type', () => {
      const onChange = vi.fn()
      render(
        <TextField label="Number" value={42} onChange={onChange} type="number" />
      )

      const input = screen.getByRole('spinbutton')
      expect(input).toHaveAttribute('type', 'number')
      expect(input.value).toBe('42')
    })
  })

  describe('Immediate Local State Updates', () => {
    it('should update input value immediately on keystroke', async () => {
      const onChange = vi.fn()
      render(<TextField label="Test" value="" onChange={onChange} />)

      const input = screen.getByRole('textbox')
      await user.type(input, 'abc')

      // Input should show 'abc' immediately (local state)
      expect(input.value).toBe('abc')
    })

    it('should show each character as user types', async () => {
      const onChange = vi.fn()
      render(<TextField label="Test" value="" onChange={onChange} />)

      const input = screen.getByRole('textbox')

      await user.type(input, 't')
      expect(input.value).toBe('t')

      await user.type(input, 'e')
      expect(input.value).toBe('te')

      await user.type(input, 's')
      expect(input.value).toBe('tes')

      await user.type(input, 't')
      expect(input.value).toBe('test')
    })
  })

  describe('Debounced onChange Calls', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should not call onChange immediately on keystroke', async () => {
      const onChange = vi.fn()
      render(
        <TextField
          label="Test"
          value=""
          onChange={onChange}
          debounceDelay={300}
        />
      )

      const input = screen.getByRole('textbox')
      await user.type(input, 'a')

      expect(onChange).not.toHaveBeenCalled()
    })

    it('should call onChange after debounce delay', async () => {
      const onChange = vi.fn()
      render(
        <TextField
          label="Test"
          value=""
          onChange={onChange}
          debounceDelay={300}
        />
      )

      const input = screen.getByRole('textbox')
      await user.type(input, 'a')

      expect(onChange).not.toHaveBeenCalled()

      vi.advanceTimersByTime(300)

      expect(onChange).toHaveBeenCalledTimes(1)
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          target: { value: 'a' }
        })
      )
    })

    it('should only call onChange once after rapid typing stops', async () => {
      const onChange = vi.fn()
      render(
        <TextField
          label="Test"
          value=""
          onChange={onChange}
          debounceDelay={300}
        />
      )

      const input = screen.getByRole('textbox')

      // Type quickly
      await user.type(input, 'test')

      // Should not have called onChange yet
      expect(onChange).not.toHaveBeenCalled()

      // Advance time by debounce delay
      vi.advanceTimersByTime(300)

      // Should have called onChange exactly once with final value
      expect(onChange).toHaveBeenCalledTimes(1)
      expect(onChange.mock.calls[0][0].target.value).toBe('test')
    })

    it('should reset debounce timer on each keystroke', async () => {
      const onChange = vi.fn()
      render(
        <TextField
          label="Test"
          value=""
          onChange={onChange}
          debounceDelay={300}
        />
      )

      const input = screen.getByRole('textbox')

      await user.type(input, 'a')
      vi.advanceTimersByTime(100)

      await user.type(input, 'b')
      vi.advanceTimersByTime(100)

      await user.type(input, 'c')
      vi.advanceTimersByTime(100)

      // Total time: 300ms, but timer reset on each keystroke
      expect(onChange).not.toHaveBeenCalled()

      // Now wait the full delay from last keystroke
      vi.advanceTimersByTime(200)

      expect(onChange).toHaveBeenCalledTimes(1)
      expect(onChange.mock.calls[0][0].target.value).toBe('abc')
    })

    it('should respect custom debounce delay', async () => {
      const onChange = vi.fn()
      render(
        <TextField
          label="Test"
          value=""
          onChange={onChange}
          debounceDelay={500}
        />
      )

      const input = screen.getByRole('textbox')
      await user.type(input, 'test')

      vi.advanceTimersByTime(300)
      expect(onChange).not.toHaveBeenCalled()

      vi.advanceTimersByTime(200)
      expect(onChange).toHaveBeenCalledTimes(1)
    })
  })

  describe('External Value Synchronization', () => {
    it('should sync local state when value prop changes', () => {
      const onChange = vi.fn()
      const { rerender } = render(
        <TextField label="Test" value="initial" onChange={onChange} />
      )

      const input = screen.getByRole('textbox')
      expect(input.value).toBe('initial')

      // External value change (e.g., from Redux or parent)
      rerender(<TextField label="Test" value="updated" onChange={onChange} />)

      expect(input.value).toBe('updated')
    })

    it('should handle empty string value changes', () => {
      const onChange = vi.fn()
      const { rerender } = render(
        <TextField label="Test" value="some text" onChange={onChange} />
      )

      const input = screen.getByRole('textbox')
      expect(input.value).toBe('some text')

      rerender(<TextField label="Test" value="" onChange={onChange} />)

      expect(input.value).toBe('')
    })

    it('should handle numeric value changes', () => {
      const onChange = vi.fn()
      const { rerender } = render(
        <TextField
          label="Test"
          value={42}
          onChange={onChange}
          type="number"
        />
      )

      const input = screen.getByRole('spinbutton')
      expect(input.value).toBe('42')

      rerender(
        <TextField
          label="Test"
          value={100}
          onChange={onChange}
          type="number"
        />
      )

      expect(input.value).toBe('100')
    })
  })

  describe('Cleanup and Memory Management', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should cancel pending debounced calls on unmount', async () => {
      const onChange = vi.fn()
      const { unmount } = render(
        <TextField
          label="Test"
          value=""
          onChange={onChange}
          debounceDelay={300}
        />
      )

      const input = screen.getByRole('textbox')
      await user.type(input, 'test')

      // Unmount before debounce fires
      unmount()

      vi.advanceTimersByTime(300)

      // onChange should not have been called
      expect(onChange).not.toHaveBeenCalled()
    })

    it('should handle rapid mount/unmount cycles', async () => {
      const onChange = vi.fn()

      const { unmount: unmount1 } = render(
        <TextField
          label="Test"
          value=""
          onChange={onChange}
          debounceDelay={300}
        />
      )
      unmount1()

      const { unmount: unmount2 } = render(
        <TextField
          label="Test"
          value=""
          onChange={onChange}
          debounceDelay={300}
        />
      )
      unmount2()

      // Should not throw errors or cause memory leaks
      vi.advanceTimersByTime(300)
      expect(onChange).not.toHaveBeenCalled()
    })
  })

  describe('Edge Cases', () => {
    it('should handle deletion of characters', async () => {
      const onChange = vi.fn()
      render(<TextField label="Test" value="test" onChange={onChange} />)

      const input = screen.getByRole('textbox')
      expect(input.value).toBe('test')

      await user.clear(input)
      expect(input.value).toBe('')
    })

    it('should handle paste events', async () => {
      const onChange = vi.fn()
      render(<TextField label="Test" value="" onChange={onChange} />)

      const input = screen.getByRole('textbox')
      await user.click(input)
      await user.paste('pasted text')

      expect(input.value).toBe('pasted text')
    })

    it('should work with zero debounce delay', async () => {
      vi.useFakeTimers()
      const onChange = vi.fn()
      render(
        <TextField
          label="Test"
          value=""
          onChange={onChange}
          debounceDelay={0}
        />
      )

      const input = screen.getByRole('textbox')
      await user.type(input, 'a')

      vi.advanceTimersByTime(0)

      expect(onChange).toHaveBeenCalledTimes(1)
      vi.useRealTimers()
    })
  })
})
