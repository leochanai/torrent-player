import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { App } from '../src/app/App'

describe('App', () => {
  it('renders the V1 workbench empty state', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: 'Torrent Player' })).toBeInTheDocument()
    expect(screen.getAllByText('等待可播放文件').length).toBeGreaterThan(0)
    expect(screen.getAllByText('空闲').length).toBeGreaterThan(0)
    expect(screen.getByText(/仅播放自有或合法授权内容/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '停止任务' })).not.toBeInTheDocument()
    expect(screen.getByRole('progressbar', { name: '下载进度 0%' })).toBeInTheDocument()
    expect(screen.getByLabelText('选择 .torrent 文件')).toBeInTheDocument()
  })

  it('shows a recoverable validation error for invalid magnet input', async () => {
    render(<App />)

    const input = screen.getByLabelText('Magnet URI')

    fireEvent.change(input, {
      target: { value: 'not a magnet' },
    })
    fireEvent.click(screen.getByRole('button', { name: /开始解析/ }))

    const error = await screen.findByRole('alert')
    expect(error).toHaveTextContent('这不是 magnet URI。')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveAttribute('aria-describedby', error.id)

    fireEvent.click(screen.getByRole('button', { name: '清空' }))

    expect(input).toHaveValue('')
    expect(input).toHaveAttribute('aria-invalid', 'false')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('expands diagnostics with a linked disclosure control', () => {
    render(<App />)

    const disclosure = screen.getByRole('button', { name: '展开诊断' })
    expect(disclosure).toHaveAttribute('aria-expanded', 'false')
    expect(disclosure).toHaveAttribute('aria-controls', 'diagnostics-panel')

    fireEvent.click(disclosure)

    expect(screen.getByRole('button', { name: '收起诊断' })).toHaveAttribute(
      'aria-expanded',
      'true',
    )
    expect(screen.getByRole('heading', { name: '诊断' })).toBeInTheDocument()
  })
})
