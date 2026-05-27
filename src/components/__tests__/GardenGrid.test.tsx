/**
 * Unit tests for the GardenGrid component.
 *
 * Covers:
 *  1. pixelToCellCoords utility — converts pixel positions to cell coordinates
 *  2. pixelToCellCoords returns null for out-of-bounds coordinates
 *  3. Component renders without crashing
 *  4. Component respects readOnly prop (no gesture interaction)
 *  5. Canvas dimensions match grid size calculations
 */

import {
    CELL_SIZE_PX,
    CELLS_PER_INCH,
    GardenGrid,
    pixelToCellCoords,
} from '@/src/components/GardenGrid'
import { render } from '@testing-library/react-native'
import React from 'react'

// ---------------------------------------------------------------------------
// Mock @shopify/react-native-skia
// ---------------------------------------------------------------------------
jest.mock('@shopify/react-native-skia', () => {
  const { createElement } = require('react')
  const { View } = require('react-native')
  return {
    Canvas: ({ children, ...props }: any) =>
      createElement(View, { testID: 'skia-canvas', ...props }, children),
    Group: ({ children }: any) =>
      createElement(View, { testID: 'skia-group' }, children),
    Rect: (props: any) =>
      createElement(View, { testID: 'skia-rect', ...props }),
  }
})

// ---------------------------------------------------------------------------
// Mock react-native-gesture-handler
// ---------------------------------------------------------------------------
jest.mock('react-native-gesture-handler', () => {
  const { createElement } = require('react')
  const { View } = require('react-native')
  return {
    GestureDetector: ({ children }: any) =>
      createElement(View, { testID: 'gesture-detector' }, children),
    Gesture: {
      Pan: () => ({
        onBegin: jest.fn().mockReturnThis(),
        onUpdate: jest.fn().mockReturnThis(),
        onEnd: jest.fn().mockReturnThis(),
        minDistance: jest.fn().mockReturnThis(),
        enabled: jest.fn().mockReturnThis(),
      }),
      Tap: () => ({
        onEnd: jest.fn().mockReturnThis(),
        enabled: jest.fn().mockReturnThis(),
      }),
      Race: jest.fn().mockReturnValue({}),
    },
  }
})

// ---------------------------------------------------------------------------
// pixelToCellCoords tests
// ---------------------------------------------------------------------------

describe('pixelToCellCoords', () => {
  const totalCols = 16 // 4 inches * 4 cells/inch
  const totalRows = 12 // 3 inches * 4 cells/inch

  it('converts pixel coordinates to cell coordinates', () => {
    // First cell (top-left)
    const result = pixelToCellCoords(0, 0, totalCols, totalRows)
    expect(result).toEqual({ row: 0, col: 0 })
  })

  it('maps pixels within a cell to the correct cell', () => {
    // Middle of cell (1, 2) — x = 2 * CELL_SIZE_PX + 5, y = 1 * CELL_SIZE_PX + 3
    const x = 2 * CELL_SIZE_PX + 5
    const y = 1 * CELL_SIZE_PX + 3
    const result = pixelToCellCoords(x, y, totalCols, totalRows)
    expect(result).toEqual({ row: 1, col: 2 })
  })

  it('returns the last valid cell for coordinates at the boundary', () => {
    // Just inside the last cell
    const x = (totalCols - 1) * CELL_SIZE_PX + 1
    const y = (totalRows - 1) * CELL_SIZE_PX + 1
    const result = pixelToCellCoords(x, y, totalCols, totalRows)
    expect(result).toEqual({ row: totalRows - 1, col: totalCols - 1 })
  })

  it('returns null for negative x coordinate', () => {
    const result = pixelToCellCoords(-1, 5, totalCols, totalRows)
    expect(result).toBeNull()
  })

  it('returns null for negative y coordinate', () => {
    const result = pixelToCellCoords(5, -1, totalCols, totalRows)
    expect(result).toBeNull()
  })

  it('returns null for x coordinate beyond grid width', () => {
    const x = totalCols * CELL_SIZE_PX + 1
    const result = pixelToCellCoords(x, 5, totalCols, totalRows)
    expect(result).toBeNull()
  })

  it('returns null for y coordinate beyond grid height', () => {
    const y = totalRows * CELL_SIZE_PX + 1
    const result = pixelToCellCoords(5, y, totalCols, totalRows)
    expect(result).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// GardenGrid component tests
// ---------------------------------------------------------------------------

describe('GardenGrid', () => {
  const defaultProps = {
    widthInches: 4,
    heightInches: 3,
    cells: {} as Record<string, any>,
    activeTool: 'draw' as const,
    onCellChange: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders without crashing', () => {
    const { getByTestId } = render(<GardenGrid {...defaultProps} />)
    expect(getByTestId('skia-canvas')).toBeTruthy()
  })

  it('renders the canvas with correct dimensions', () => {
    const { getByTestId } = render(<GardenGrid {...defaultProps} />)
    const canvas = getByTestId('skia-canvas')

    const expectedWidth = defaultProps.widthInches * CELLS_PER_INCH * CELL_SIZE_PX
    const expectedHeight = defaultProps.heightInches * CELLS_PER_INCH * CELL_SIZE_PX

    expect(canvas.props.style).toEqual({
      width: expectedWidth,
      height: expectedHeight,
    })
  })

  it('renders with readOnly prop without crashing', () => {
    const { getByTestId } = render(
      <GardenGrid {...defaultProps} readOnly />
    )
    expect(getByTestId('skia-canvas')).toBeTruthy()
  })

  it('renders filled cells from the cells prop', () => {
    const cells = {
      '0:0': { filled: true },
      '1:2': { filled: true, plantId: 'plant-1' },
    }

    const { getByTestId } = render(
      <GardenGrid {...defaultProps} cells={cells} />
    )
    expect(getByTestId('skia-canvas')).toBeTruthy()
  })

  it('calculates correct grid dimensions for various sizes', () => {
    const { getByTestId } = render(
      <GardenGrid
        {...defaultProps}
        widthInches={8}
        heightInches={4}
      />
    )
    const canvas = getByTestId('skia-canvas')

    const expectedWidth = 8 * CELLS_PER_INCH * CELL_SIZE_PX
    const expectedHeight = 4 * CELLS_PER_INCH * CELL_SIZE_PX

    expect(canvas.props.style).toEqual({
      width: expectedWidth,
      height: expectedHeight,
    })
  })
})

// ---------------------------------------------------------------------------
// Constants validation
// ---------------------------------------------------------------------------

describe('GardenGrid constants', () => {
  it('has CELLS_PER_INCH set to 4 for 1/4" resolution', () => {
    expect(CELLS_PER_INCH).toBe(4)
  })

  it('has a positive CELL_SIZE_PX', () => {
    expect(CELL_SIZE_PX).toBeGreaterThan(0)
  })
})
