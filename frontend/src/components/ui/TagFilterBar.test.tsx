import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TagFilterBar } from './TagFilterBar'

describe('TagFilterBar', () => {
  it('renders nothing when there are no tags', () => {
    const { container } = render(
      <TagFilterBar tags={[]} selected={[]} onToggle={vi.fn()} onClear={vi.fn()} label="Tags" clearLabel="Clear" />,
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('calls onToggle with the clicked tag', async () => {
    const onToggle = vi.fn()
    render(
      <TagFilterBar
        tags={['qa', 'automation']}
        selected={[]}
        onToggle={onToggle}
        onClear={vi.fn()}
        label="Tags"
        clearLabel="Clear"
      />,
    )
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'qa' }))
    expect(onToggle).toHaveBeenCalledWith('qa')
  })

  it('shows the clear button only once a tag is selected, and it calls onClear', async () => {
    const onClear = vi.fn()
    const { rerender } = render(
      <TagFilterBar tags={['qa']} selected={[]} onToggle={vi.fn()} onClear={onClear} label="Tags" clearLabel="Clear" />,
    )
    expect(screen.queryByText(/Clear/)).not.toBeInTheDocument()

    rerender(
      <TagFilterBar tags={['qa']} selected={['qa']} onToggle={vi.fn()} onClear={onClear} label="Tags" clearLabel="Clear" />,
    )
    const clearButton = screen.getByText(/Clear/)
    const user = userEvent.setup()
    await user.click(clearButton)
    expect(onClear).toHaveBeenCalledTimes(1)
  })
})
