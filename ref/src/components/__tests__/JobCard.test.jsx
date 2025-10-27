import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import JobCard from '../JobCard'

describe('JobCard', () => {
  const mockJob = {
    id: '1',
    title: 'Senior React Developer',
    company: 'Tech Corp',
    location: 'Stockholm',
    description: 'We are looking for a React developer',
    match_score: 0.85,
  }

  it('renders job title', () => {
    render(<JobCard job={mockJob} />)
    expect(screen.getByText('Senior React Developer')).toBeInTheDocument()
  })

  it('renders company name', () => {
    render(<JobCard job={mockJob} />)
    expect(screen.getByText('Tech Corp')).toBeInTheDocument()
  })

  it('displays match score', () => {
    render(<JobCard job={mockJob} />)
    // Match score is shown as percentage (85%)
    // Using getAllByText because score appears multiple times
    const scoreElements = screen.getAllByText(/85/)
    expect(scoreElements.length).toBeGreaterThan(0)
  })
})
