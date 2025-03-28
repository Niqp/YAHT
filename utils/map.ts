/**
 * Inserts a key-value pair into a Map while maintaining sort order of keys
 * @param sortedMap - Map with keys sorted in ascending order
 * @param newKey - Key to insert
 * @param value - Value associated with the key
 * @returns The updated Map with maintained sort order
 */
export function insertSortedIntoMap<K, V>(sortedMap: Map<K, V>, newKey: K, value: V): Map<K, V> {
  // If the key already exists, just update the value
  if (sortedMap.has(newKey)) {
    sortedMap.set(newKey, value);
    return sortedMap;
  }

  // Convert the map keys to an array for binary search
  const keys = Array.from(sortedMap.keys());

  // Binary search to find insertion position
  let left = 0;
  let right = keys.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (keys[mid] < newKey) {
      left = mid + 1;
    } else if (keys[mid] > newKey) {
      right = mid - 1;
    } else {
      // Should not reach here since we already checked if key exists
      left = mid;
      break;
    }
  }

  // Create a new Map to maintain the sorted order
  const newMap = new Map<K, V>();

  // Add all elements before the insertion point
  for (let i = 0; i < left; i++) {
    newMap.set(keys[i], sortedMap.get(keys[i])!);
  }

  // Add the new key-value pair
  newMap.set(newKey, value);

  // Add all elements after the insertion point
  for (let i = left; i < keys.length; i++) {
    newMap.set(keys[i], sortedMap.get(keys[i])!);
  }

  return newMap;
}
