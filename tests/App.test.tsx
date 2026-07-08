import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { App } from '../src/app/App'

describe('App', () => {
  it('renders the V1 workbench empty state', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: 'Torrent Player' })).toBeInTheDocument()
    expect(screen.getAllByText('等待可播放文件').length).toBeGreaterThan(0)
    expect(screen.getByText(/仅用于播放用户自有或合法授权内容/)).toBeInTheDocument()
  })

  it('shows a recoverable validation error for invalid magnet input', async () => {
    render(<App />)

    fireEvent.change(screen.getByLabelText('Magnet URI'), {
      target: { value: 'not a magnet' },
    })
    fireEvent.click(screen.getByRole('button', { name: /开始解析/ }))

    expect(await screen.findByText('这不是 magnet URI。')).toBeInTheDocument()
  })
})
