/**
 * Jest mock for react-native-mmkv.
 *
 * react-native-mmkv requires native modules (JSI) that are not available in
 * the Node.js test environment. This mock provides an in-memory Map-backed
 * implementation so tests can exercise code that depends on MMKV without
 * native binaries.
 */

export class MMKV {
  private store = new Map<string, string | number | boolean | Uint8Array>()

  getString(key: string): string | undefined {
    const value = this.store.get(key)
    return typeof value === 'string' ? value : undefined
  }

  set(key: string, value: string | number | boolean | Uint8Array): void {
    this.store.set(key, value)
  }

  delete(key: string): void {
    this.store.delete(key)
  }

  clearAll(): void {
    this.store.clear()
  }

  contains(key: string): boolean {
    return this.store.has(key)
  }

  getAllKeys(): string[] {
    return Array.from(this.store.keys())
  }

  getNumber(key: string): number | undefined {
    const value = this.store.get(key)
    return typeof value === 'number' ? value : undefined
  }

  getBoolean(key: string): boolean | undefined {
    const value = this.store.get(key)
    return typeof value === 'boolean' ? value : undefined
  }
}
