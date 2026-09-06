/**
 * Fake D1 binding for offline testing.
 * Returns a DB-like object with prepare() that returns statements with bind(), first(), all(), run()
 * and records all calls in calls[] array.
 */

export function createFakeD1({ first = {}, all = {}, run = { meta: { last_row_id: 1, changes: 1 } } } = {}) {
  const calls = [];
  
  function resolveFor(map, sql) {
    if (typeof map === 'function') return map(sql);
    
    // Check for exact match first
    if (map[sql] !== undefined) return map[sql];
    
    // Find the longest matching key (most specific)
    let bestMatch = null;
    let bestMatchLength = 0;
    
    for (const key of Object.keys(map)) {
      // Check if key is contained in the SQL
      if (sql.includes(key)) {
        if (key.length > bestMatchLength) {
          bestMatch = key;
          bestMatchLength = key.length;
        }
      }
    }
    
    if (bestMatch !== null) return map[bestMatch];
    
    return map.default || null;
  }
  
  function prepare(sql) {
    const stmt = {
      sql,
      params: [],
      bind(...args) {
        stmt.params = args;
        return stmt;
      },
      async first() {
        calls.push({ sql, params: stmt.params, op: 'first' });
        return resolveFor(first, sql);
      },
      async all() {
        calls.push({ sql, params: stmt.params, op: 'all' });
        return resolveFor(all, sql);
      },
      async run() {
        calls.push({ sql, params: stmt.params, op: 'run' });
        return resolveFor(run, sql);
      }
    };
    return stmt;
  }
  
  return { prepare, calls };
}
