import FontAwesome from '@expo/vector-icons/FontAwesome'
import { Pressable, Text, View } from 'react-native'
import { tv } from 'tailwind-variants'

import type { TDrawingTool } from '@/src/types/TGardenGrid'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface IDrawingToolbarProps {
  /** Currently active drawing tool */
  activeTool: TDrawingTool
  /** Callback invoked when the user selects a different tool */
  onToolChange: (tool: TDrawingTool) => void
}

// ---------------------------------------------------------------------------
// Tool metadata
// ---------------------------------------------------------------------------

interface IToolConfig {
  readonly tool: TDrawingTool
  readonly label: string
  readonly icon: React.ComponentProps<typeof FontAwesome>['name']
}

const TOOLS: readonly IToolConfig[] = [
  { tool: 'draw', label: 'Draw', icon: 'pencil' },
  { tool: 'erase', label: 'Erase', icon: 'eraser' },
  { tool: 'place_plant', label: 'Plant', icon: 'leaf' },
  { tool: 'select', label: 'Select', icon: 'hand-pointer-o' },
] as const

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const toolbarStyles = tv({
  slots: {
    container: 'flex-row items-center justify-around bg-white border-t border-gray-200 px-2 py-3',
    button: 'items-center justify-center px-3 py-2 rounded-lg',
    buttonActive: 'items-center justify-center px-3 py-2 rounded-lg bg-green-100',
    icon: 'text-gray-600',
    iconActive: 'text-green-700',
    label: 'text-xs mt-1 text-gray-600',
    labelActive: 'text-xs mt-1 text-green-700 font-semibold',
  },
})

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const DrawingToolbar = ({ activeTool, onToolChange }: IDrawingToolbarProps) => {
  const styles = toolbarStyles()

  return (
    <View
      className={styles.container()}
      accessibilityRole="toolbar"
      accessibilityLabel="Drawing tools"
    >
      {TOOLS.map(({ tool, label, icon }) => {
        const isActive = activeTool === tool

        return (
          <Pressable
            key={tool}
            className={isActive ? styles.buttonActive() : styles.button()}
            onPress={() => onToolChange(tool)}
            accessibilityRole="button"
            accessibilityLabel={`${label} tool`}
            accessibilityState={{ selected: isActive }}
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          >
            <Text className={isActive ? styles.iconActive() : styles.icon()}>
              <FontAwesome name={icon} size={20} />
            </Text>
            <Text className={isActive ? styles.labelActive() : styles.label()}>
              {label}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}

export { DrawingToolbar }
export type { IDrawingToolbarProps }

