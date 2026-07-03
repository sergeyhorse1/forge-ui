import '@testing-library/jest-dom/vitest'

import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from './Card'

describe('Card', () => {
  it('renders all sub-components', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Title</CardTitle>
          <CardDescription>Desc</CardDescription>
        </CardHeader>
        <CardContent>Content</CardContent>
        <CardFooter>Footer</CardFooter>
      </Card>,
    )
    expect(screen.getByText('Title')).toBeInTheDocument()
    expect(screen.getByText('Desc')).toBeInTheDocument()
    expect(screen.getByText('Content')).toBeInTheDocument()
    expect(screen.getByText('Footer')).toBeInTheDocument()
  })

  it('Card applies border and background classes', () => {
    const { container } = render(<Card>Hi</Card>)
    expect(container.firstChild).toHaveClass('border', 'bg-card')
  })

  it('CardTitle renders as h3', () => {
    render(<CardTitle>Heading</CardTitle>)
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Heading')
  })

  it('merges custom className on Card', () => {
    const { container } = render(<Card className="my-custom">X</Card>)
    expect(container.firstChild).toHaveClass('my-custom')
  })
})
