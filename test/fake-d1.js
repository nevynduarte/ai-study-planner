// Minimal fake D1 binding for offline tests.
// Usage: const db = new FakeD1({ "SELECT ... daily_plan ...": { first: {...} }, ... })
// Matching is by substring of the SQL (case-sensitive, first match wins) so tests
// can key off a distinctive table/view name without repeating the whole query.
export class FakeD1 {
  constructor(handlers = {}) {
    this.handlers = handlers;
    this.calls = [];
  }

  _find(sql) {
    for (const key of Object.keys(this.handlers)) {
      if (sql.includes(key)) return this.handlers[key];
    }
    return null;
  }

  prepare(sql) {
    const record = { sql, params: [] };
    this.calls.push(record);
    const handler = this._find(sql);
    const self = this;
    return {
      bind(...params) {
        record.params = params;
        return this;
      },
      async first() {
        const h = handler ?? self._find(sql);
        if (h && "first" in h) return typeof h.first === "function" ? h.first(record) : h.first;
        return null;
      },
      async all() {
        const h = handler ?? self._find(sql);
        if (h && "all" in h) return typeof h.all === "function" ? h.all(record) : h.all;
        return { results: [] };
      },
      async run() {
        const h = handler ?? self._find(sql);
        if (h && "run" in h) return typeof h.run === "function" ? h.run(record) : h.run;
        return { meta: { last_row_id: 1, changes: 1 } };
      },
    };
  }
}
