// ---------------------------------------------------------------------------
// Mock data — replace with usePlants() hook when available

import { IPlant } from '../types/TPlant'

// ---------------------------------------------------------------------------
const MOCK_PLANTS: IPlant[] = [
  {
    id: '1',
    name: 'Tomato',
    species: 'Solanum lycopersicum',
    variety: 'Cherry',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Basil',
    species: 'Ocimum basilicum',
    variety: 'Sweet',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '3',
    name: 'Pepper',
    species: 'Capsicum annuum',
    variety: 'Bell',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '4',
    name: 'Zucchini',
    species: 'Cucurbita pepo',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

export { MOCK_PLANTS }
