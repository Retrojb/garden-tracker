import { PlantCard } from '@/src/components/PlantCard'
import type { IPhoto } from '@/src/types/TPhoto'
import type { IPlant } from '@/src/types/TPlant'
import { fireEvent, render, screen } from '@testing-library/react-native'
import React from 'react'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const mockPlant: IPlant = {
  id: 'plant-001',
  name: 'Tomato',
  species: 'Solanum lycopersicum',
  variety: 'Roma',
  gardenId: 'garden-001',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
}

const mockPhoto: IPhoto = {
  id: 'photo-001',
  plantId: 'plant-001',
  localUri: 'file:///photos/tomato.jpg',
  s3Key: 'photos/tomato.jpg',
  takenAt: '2024-06-15T10:00:00.000Z',
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('PlantCard', () => {
  const onEdit = jest.fn()
  const onDelete = jest.fn()
  const onViewPhotos = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('plant information display', () => {
    it('renders plant name', () => {
      render(
        <PlantCard
          plant={mockPlant}
          onEdit={onEdit}
          onDelete={onDelete}
          onViewPhotos={onViewPhotos}
        />
      )
      expect(screen.getByText('Tomato')).toBeTruthy()
    })

    it('renders plant species', () => {
      render(
        <PlantCard
          plant={mockPlant}
          onEdit={onEdit}
          onDelete={onDelete}
          onViewPhotos={onViewPhotos}
        />
      )
      expect(screen.getByText('Solanum lycopersicum')).toBeTruthy()
    })

    it('renders plant variety', () => {
      render(
        <PlantCard
          plant={mockPlant}
          onEdit={onEdit}
          onDelete={onDelete}
          onViewPhotos={onViewPhotos}
        />
      )
      expect(screen.getByText('Roma')).toBeTruthy()
    })

    it('does not render variety when not provided', () => {
      const plantWithoutVariety: IPlant = {
        ...mockPlant,
        variety: undefined,
      }
      render(
        <PlantCard
          plant={plantWithoutVariety}
          onEdit={onEdit}
          onDelete={onDelete}
          onViewPhotos={onViewPhotos}
        />
      )
      expect(screen.getByText('Tomato')).toBeTruthy()
      expect(screen.getByText('Solanum lycopersicum')).toBeTruthy()
      expect(screen.queryByText('Roma')).toBeNull()
    })
  })

  describe('photo thumbnail', () => {
    it('shows thumbnail when recentPhoto is provided', () => {
      render(
        <PlantCard
          plant={mockPlant}
          recentPhoto={mockPhoto}
          onEdit={onEdit}
          onDelete={onDelete}
          onViewPhotos={onViewPhotos}
        />
      )
      expect(screen.getByLabelText('Photo of Tomato')).toBeTruthy()
    })

    it('shows placeholder when no recentPhoto is provided', () => {
      render(
        <PlantCard
          plant={mockPlant}
          recentPhoto={null}
          onEdit={onEdit}
          onDelete={onDelete}
          onViewPhotos={onViewPhotos}
        />
      )
      expect(screen.getByText('🌱')).toBeTruthy()
      expect(screen.queryByLabelText('Photo of Tomato')).toBeNull()
    })

    it('shows placeholder when recentPhoto is undefined', () => {
      render(
        <PlantCard
          plant={mockPlant}
          onEdit={onEdit}
          onDelete={onDelete}
          onViewPhotos={onViewPhotos}
        />
      )
      expect(screen.getByText('🌱')).toBeTruthy()
    })
  })

  describe('action buttons', () => {
    it('calls onEdit with the plant when edit is pressed', () => {
      render(
        <PlantCard
          plant={mockPlant}
          onEdit={onEdit}
          onDelete={onDelete}
          onViewPhotos={onViewPhotos}
        />
      )
      fireEvent.press(screen.getByLabelText('Edit plant'))
      expect(onEdit).toHaveBeenCalledTimes(1)
      expect(onEdit).toHaveBeenCalledWith(mockPlant)
    })

    it('calls onDelete with the plant id when delete is pressed', () => {
      render(
        <PlantCard
          plant={mockPlant}
          onEdit={onEdit}
          onDelete={onDelete}
          onViewPhotos={onViewPhotos}
        />
      )
      fireEvent.press(screen.getByLabelText('Delete plant'))
      expect(onDelete).toHaveBeenCalledTimes(1)
      expect(onDelete).toHaveBeenCalledWith('plant-001')
    })

    it('calls onViewPhotos with the plant id when thumbnail is pressed', () => {
      render(
        <PlantCard
          plant={mockPlant}
          recentPhoto={mockPhoto}
          onEdit={onEdit}
          onDelete={onDelete}
          onViewPhotos={onViewPhotos}
        />
      )
      fireEvent.press(screen.getByLabelText('View photos'))
      expect(onViewPhotos).toHaveBeenCalledTimes(1)
      expect(onViewPhotos).toHaveBeenCalledWith('plant-001')
    })
  })
})
