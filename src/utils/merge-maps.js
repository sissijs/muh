/**
 * Combine two maps
 * @param {Map} map1 
 * @param {Map} map2 
 * @returns {Map}
 */
export function mergeMaps(map1, map2) {
  return new Map([...map1, ...map2]);
}
