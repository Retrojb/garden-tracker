/**
 * Garden Detail screen
 *
 * Renders the interactive GardenGrid with the DrawingToolbar for editing
 * the garden layout. Loads persisted cell state from the garden record and
 * saves changes back via useGardens.updateGarden.
 *
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.8, 3.9
 */

import { useLocalSearchParams } from 'expo-router'
import React, { useCallback, useEffect, useRef } from 'react'
import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native'
import { tv } from 'tailwind-variants'

import { DrawingToolbar } from '@/src/components/DrawingToolbar'
import { GardenGrid } from '@/src/components/GardenGrid'
import { useGardenGrid } from '@/src/hooks/useGardenGrid'
import { useGardens } from '@/src/hooks/useGardens'
import { usePlants } from '@/src/hooks/usePlants'
import type { ICellState } from '@/src/types/TGardenGrid'

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = tv({
  slots: {
    container: 'flex-1 bg-white',
    header: 'px-4 pt-4 pb-2',
    title: 'text-xl font-bold text-gray-900 font-[ManropeBold]',
    subtitle: 'text-sm text-gray-500 mt-0.5 capitalize',
    gridContainer: 'flex-1 px-2',
    actionsRow: 'flex-row items-center justify-end gap-3 px-4 py-2',
    actionButton: 'rounded-lg px-4 py-2 bg-gray-100 border border-gray-200',
    actionButtonDanger: 'rounded-lg px-4 py-2 bg-red-50 border border-red-200',
    actionText: 'text-sm font-medium text-gray-700 font-[ManropeMedium]',
    actionTextDanger: 'text-sm font-medium text-red-600 font-[ManropeMedium]',
    loadingWrap: 'flex-1 items-center justify-center',
    notFoundWrap: 'flex-1 items-center justify-center px-6',
    notFoundText: 'text-gray-500 text-base text-center',
  },
})

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

const GardenDetailScreen = () => {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { gardens, isLoading, updateGarden } = useGardens()
  const { plants } = usePlants()
  const s = styles()

  const garden = gardens.find((g) => g.id === id)

  // Initialize the grid hook with persisted cell state from the garden
  const {
    cells,
    activeTool,
    setActiveTool,
    handleCellChange,
    clearGrid,
    exportGridSnapshot,
  } = useGardenGrid({
    initialCells: garden?.cells ?? {},
    getPlants: () => plants,
  })

  // Track whether we should save (avoid saving on initial mount)
  const hasMountedRef = useRef(false)
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Debounced save: persist grid state after changes settle
  const saveGridState = useCallback(
    (updatedCells: Record<string, ICellState>) => {
      if (!id || !garden) return

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }

      saveTimeoutRef.current = setTimeout(() => {
        void updateGarden(id, { cells: updatedCells })
      }, 500)
    },
    [id, garden, updateGarden]
  )

  // Save grid state whenever cells change (after initial mount)
  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true
      return
    }

    saveGridState(cells)

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [cells, saveGridState])

  // Handle clear grid with confirmation
  const handleClearGrid = useCallback(() => {
    Alert.alert(
      'Clear Grid',
      'Are you sure you want to clear the entire grid? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            clearGrid()
          },
        },
      ]
    )
  }, [clearGrid])

  // Handle export snapshot
  const handleExportSnapshot = useCallback(() => {
    const snapshot = exportGridSnapshot()
    if (snapshot) {
      Alert.alert('Snapshot Exported', 'Grid snapshot has been exported as a base64 PNG.')
    } else {
      Alert.alert('Export', 'Grid snapshot export is not yet available.')
    }
  }, [exportGridSnapshot])

  // Loading state
  if (isLoading && !garden) {
    return (
      <View className={s.loadingWrap()}>
        <ActivityIndicator size="large" color="#4b7c59" />
      </View>
    )
  }

  // Garden not found
  if (!garden) {
    return (
      <View className={s.notFoundWrap()}>
        <Text className={s.notFoundText()}>Garden not found</Text>
      </View>
    )
  }

  return (
    <View className={s.container()}>
      {/* Header */}
      <View className={s.header()}>
        <Text className={s.title()}>{garden.name}</Text>
        <Text className={s.subtitle()}>
          {garden.type.replace(/_/g, ' ')} — {garden.dimensions.widthInches}" ×{' '}
          {garden.dimensions.heightInches}"
        </Text>
      </View>

      {/* Action buttons */}
      <View className={s.actionsRow()}>
        <Pressable
          className={s.actionButton()}
          onPress={handleExportSnapshot}
          accessibilityRole="button"
          accessibilityLabel="Export grid snapshot"
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
        >
          <Text className={s.actionText()}>Export Snapshot</Text>
        </Pressable>
        <Pressable
          className={s.actionButtonDanger()}
          onPress={handleClearGrid}
          accessibilityRole="button"
          accessibilityLabel="Clear grid"
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
        >
          <Text className={s.actionTextDanger()}>Clear Grid</Text>
        </Pressable>
      </View>

      {/* Garden Grid */}
      <View className={s.gridContainer()}>
        <GardenGrid
          widthInches={garden.dimensions.widthInches}
          heightInches={garden.dimensions.heightInches}
          cells={cells}
          activeTool={activeTool}
          onCellChange={handleCellChange}
        />
      </View>

      {/* Drawing Toolbar */}
      <DrawingToolbar activeTool={activeTool} onToolChange={setActiveTool} />
    </View>
  )
}

export default GardenDetailScreen
