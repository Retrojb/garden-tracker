// ---------------------------------------------------------------------------
// Mock data — replace with usePlants() hook when available

import { IGarden } from '../types/TGarden'

// ---------------------------------------------------------------------------
const MOCK_GARDENS: IGarden[] = [
  {
    id: '1',
    name: 'Tomato',
    type: 'raised_bed',
    size: '24',
    dimensions: {
      widthInches: 48,
      heightInches: 96,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Basil',
    type: 'container',
    size: '24',
    dimensions: {
      widthInches: 48,
      heightInches: 96,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '3',
    name: 'Pepper',
    type: 'raised_bed',
    size: '24',
    dimensions: {
      widthInches: 48,
      heightInches: 96,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '4',
    name: 'Gordies',
    type: 'in_ground',
    size: '24',
    dimensions: {
      widthInches: 48,
      heightInches: 96,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

export { MOCK_GARDENS }
