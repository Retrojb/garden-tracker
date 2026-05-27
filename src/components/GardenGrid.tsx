/**
 * GardenGrid component
 *
 * Renders an interactive 1/4" grid canvas where users draw and edit their
 * garden layout. Supports touch-based drawing, erasing, and plant placement
 * via pan gestures.
 *
 * Uses @shopify/react-native-skia for performant canvas rendering and
 * react-native-gesture-handler for pan gesture detection.
 *
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.7
 */

import { Canvas, Group, Rect } from '@shopify/react-native-skia'
import React, { useCallback, useMemo, useRef } from 'react'
import { ScrollView, View } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'

import type { ICellState, TDrawingTool } from '@/src/types/TGardenGrid'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Number of cells per inch (1/4" resolution) */
const CELLS_PER_INCH = 4

/** Size of each cell in device-independent pixels */
const CELL_SIZE_PX = 12

/** Grid line width in pixels */
const GRID_LINE_WIDTH = 0.5

/** Colors */
const COLORS = {
  gridLine: '#E0E0E0',
  filledCell: '#4CAF50',
  plantCell: '#FF9800',
  background: '#FFFFFF',
  readOnlyOverlay: 'rgba(0, 0, 0, 0.02)',
} as const

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface GardenGridProps {
  /** Width of the grid in inches */
  readonly widthInches: number
  /** Height of the grid in inches */
  readonly heightInches: number
  /** Current cell state map: key = "row:col", value = CellState */
  readonly cells: Record<string, ICellState>
  /** Active drawing tool */
  readonly activeTool: TDrawingTool
  /** Called when a cell is toggled by user interaction */
  readonly onCellChange: (row: number, col: number, state: ICellState) => void
  /** Optional: read-only mode (disables gestures) */
  readonly readOnly?: boolean
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Converts pixel coordinates to grid cell coordinates.
 * Returns null if the coordinates are outside the grid bounds.
 */
const pixelToCellCoords = (
  x: number,
  y: number,
  totalCols: number,
  totalRows: number
): { row: number; col: number } | null => {
  const col = Math.floor(x / CELL_SIZE_PX)
  const row = Math.floor(y / CELL_SIZE_PX)

  if (row < 0 || row >= totalRows || col < 0 || col >= totalCols) {
    return null
  }

  return { row, col }
}

/**
 * Determines the cell color based on its state.
 */
const getCellColor = (cellState: ICellState): string => {
  if (cellState.color) {
    return cellState.color
  }
  if (cellState.plantId) {
    return COLORS.plantCell
  }
  return COLORS.filledCell
}

/**
 * Builds the CellState to emit based on the active tool.
 */
const buildCellStateForTool = (tool: TDrawingTool): ICellState => {
  switch (tool) {
    case 'draw':
      return { filled: true }
    case 'erase':
      return { filled: false }
    case 'place_plant':
      return { filled: true }
    case 'select':
      return { filled: false }
    default:
      return { filled: false }
  }
}

// ---------------------------------------------------------------------------
// Grid Lines Sub-component
// ---------------------------------------------------------------------------

interface GridLinesProps {
  readonly totalCols: number
  readonly totalRows: number
  readonly canvasWidth: number
  readonly canvasHeight: number
}

const GridLines = React.memo(
  ({ totalCols, totalRows, canvasWidth, canvasHeight }: GridLinesProps) => (
    <Group>
      {/* Vertical grid lines */}
      {Array.from({ length: totalCols + 1 }, (_, i) => (
        <Rect
          key={`v-${i}`}
          x={i * CELL_SIZE_PX}
          y={0}
          width={GRID_LINE_WIDTH}
          height={canvasHeight}
          color={COLORS.gridLine}
        />
      ))}
      {/* Horizontal grid lines */}
      {Array.from({ length: totalRows + 1 }, (_, i) => (
        <Rect
          key={`h-${i}`}
          x={0}
          y={i * CELL_SIZE_PX}
          width={canvasWidth}
          height={GRID_LINE_WIDTH}
          color={COLORS.gridLine}
        />
      ))}
    </Group>
  )
)

GridLines.displayName = 'GridLines'

// ---------------------------------------------------------------------------
// Filled Cells Sub-component
// ---------------------------------------------------------------------------

interface FilledCellsProps {
  readonly cells: Record<string, ICellState>
}

const FilledCells = React.memo(({ cells }: FilledCellsProps) => (
  <Group>
    {Object.entries(cells).map(([key, cellState]) => {
      if (!cellState.filled) return null

      const [rowStr, colStr] = key.split(':')
      const row = parseInt(rowStr, 10)
      const col = parseInt(colStr, 10)

      if (isNaN(row) || isNaN(col)) return null

      return (
        <Rect
          key={key}
          x={col * CELL_SIZE_PX + GRID_LINE_WIDTH}
          y={row * CELL_SIZE_PX + GRID_LINE_WIDTH}
          width={CELL_SIZE_PX - GRID_LINE_WIDTH}
          height={CELL_SIZE_PX - GRID_LINE_WIDTH}
          color={getCellColor(cellState)}
        />
      )
    })}
  </Group>
))

FilledCells.displayName = 'FilledCells'

// ---------------------------------------------------------------------------
// GardenGrid Component
// ---------------------------------------------------------------------------

const GardenGrid = ({
  widthInches,
  heightInches,
  cells,
  activeTool,
  onCellChange,
  readOnly = false,
}: GardenGridProps) => {
  // Track the last cell processed during a pan to avoid duplicate emissions
  const lastCellRef = useRef<string | null>(null)

  // Calculate grid dimensions
  const totalCols = useMemo(() => widthInches * CELLS_PER_INCH, [widthInches])
  const totalRows = useMemo(() => heightInches * CELLS_PER_INCH, [heightInches])
  const canvasWidth = useMemo(() => totalCols * CELL_SIZE_PX, [totalCols])
  const canvasHeight = useMemo(() => totalRows * CELL_SIZE_PX, [totalRows])

  // Handle cell interaction at a given pixel position
  const handleInteraction = useCallback(
    (x: number, y: number) => {
      if (readOnly) return

      const coords = pixelToCellCoords(x, y, totalCols, totalRows)

      // Req 3.5: touches outside grid bounds leave cell map unchanged
      if (!coords) return

      const { row, col } = coords
      const cellKey = `${row}:${col}`

      // Skip if we already processed this cell in the current gesture
      if (lastCellRef.current === cellKey) return
      lastCellRef.current = cellKey

      const state = buildCellStateForTool(activeTool)
      onCellChange(row, col, state)
    },
    [readOnly, totalCols, totalRows, activeTool, onCellChange]
  )

  // Pan gesture for multi-cell drawing
  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .onBegin((event) => {
          lastCellRef.current = null
          handleInteraction(event.x, event.y)
        })
        .onUpdate((event) => {
          handleInteraction(event.x, event.y)
        })
        .onEnd(() => {
          lastCellRef.current = null
        })
        .minDistance(0)
        .enabled(!readOnly),
    [handleInteraction, readOnly]
  )

  // Tap gesture for single-cell interaction
  const tapGesture = useMemo(
    () =>
      Gesture.Tap()
        .onEnd((event) => {
          lastCellRef.current = null
          handleInteraction(event.x, event.y)
        })
        .enabled(!readOnly),
    [handleInteraction, readOnly]
  )

  // Compose gestures: tap takes priority, pan for dragging
  const composedGesture = useMemo(
    () => Gesture.Race(panGesture, tapGesture),
    [panGesture, tapGesture]
  )

  return (
    <ScrollView
      horizontal
      contentContainerStyle={{ flexGrow: 1 }}
      nestedScrollEnabled
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        nestedScrollEnabled
      >
        <GestureDetector gesture={composedGesture}>
          <View
            style={{ width: canvasWidth, height: canvasHeight }}
            collapsable={false}
          >
            <Canvas style={{ width: canvasWidth, height: canvasHeight }}>
              {/* Background */}
              <Rect
                x={0}
                y={0}
                width={canvasWidth}
                height={canvasHeight}
                color={COLORS.background}
              />

              {/* Filled cells (rendered before grid lines so lines overlay) */}
              <FilledCells cells={cells} />

              {/* Grid lines */}
              <GridLines
                totalCols={totalCols}
                totalRows={totalRows}
                canvasWidth={canvasWidth}
                canvasHeight={canvasHeight}
              />

              {/* Read-only overlay */}
              {readOnly && (
                <Rect
                  x={0}
                  y={0}
                  width={canvasWidth}
                  height={canvasHeight}
                  color={COLORS.readOnlyOverlay}
                />
              )}
            </Canvas>
          </View>
        </GestureDetector>
      </ScrollView>
    </ScrollView>
  )
}

export { CELL_SIZE_PX, CELLS_PER_INCH, GardenGrid, pixelToCellCoords }
export type { GardenGridProps }

