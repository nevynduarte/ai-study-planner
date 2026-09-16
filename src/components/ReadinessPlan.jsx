import { usePersisted } from '../hooks/usePersisted.js';

export default function ReadinessPlan({ plan, view, card, textColor, mutedColor, borderColor }) {
  // Versioned milestone identities deliberately do not reuse legacy day numbers.
  const [completed, setCompleted] = usePersisted(`asp.readiness.${plan.version}`, []);
  const toggle = key => setCompleted(previous => previous.includes(key) ? previous.filter(x => x !== key) : [...previous, key]);
  const total = plan.projects.reduce((n, p) => n + p.milestones.length, 0);
  const validKeys = new Set(plan.projects.flatMap(p => p.milestones.map(m => `${p.id}:${m.id}`)));
  const count = completed.filter(k => validKeys.has(k)).length;
  return <div style={{ color: textColor, lineHeight: 1.65 }}>
    <section style={card}>
      <h2 style={{ fontSize: 20, marginTop: 0 }}>{plan.title}</h2>
      <p>{plan.summary}</p>
      <p style={{ color: mutedColor }}>{plan.capacity_note}</p>
      <p><strong>{count} of {total} milestones self-checked.</strong> Mark one only after producing and explaining its evidence.</p>
      <a href={plan.guide} target="_blank" rel="noreferrer" style={{ color: textColor }}>Read the full plan, interview checks and job-tracker review ↗</a>
    </section>
    {view === 'plan' && <>
      <section style={card}>
        <h3>Choose scope to fit your week</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead><tr>{['Hours/week', 'Build + design', 'Coding + SQL', 'Foundations', 'Mocks + career'].map(t => <th key={t} scope="col" style={{ padding: 8, borderBottom: `1px solid ${borderColor}` }}>{t}</th>)}</tr></thead>
            <tbody>{plan.budgets.map(b => <tr key={b.hours}>{[b.hours,b.build,b.coding,b.fundamentals,b.career].map((v,i) => <td key={i} style={{ padding: 8 }}>{v}</td>)}</tr>)}</tbody>
          </table>
        </div>
        {plan.budgets.map(b => <p key={b.hours}><strong>{b.hours} hours:</strong> {b.outcome}</p>)}
      </section>
      <section style={card}>
        <h3>Roadmap to November</h3>
        {plan.weeks.map(w => <p key={w.window}><strong>{w.window}:</strong> {w.outcome}</p>)}
        <p style={{ color: mutedColor }}>{plan.readiness}</p>
      </section>
    </>}
    {plan.projects.map(p => <section style={card} key={p.id}>
      <h3 style={{ marginBottom: 4 }}>{p.title}</h3>
      <p style={{ color: mutedColor }}>{p.priority} · {p.estimate}</p>
      <p>{p.goal}</p>
      <p><strong>Starting stack:</strong> {p.stack}</p>
      {p.milestones.map(m => {
        const key = `${p.id}:${m.id}`;
        return <label key={m.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '9px 0', cursor: 'pointer' }}>
          <input type="checkbox" checked={completed.includes(key)} onChange={() => toggle(key)} style={{ marginTop: 6 }} />
          <span>{m.text}</span>
        </label>;
      })}
      <p style={{ color: mutedColor }}><strong>Defer:</strong> {p.defer}</p>
    </section>)}
    <section style={card}><h3>First session</h3><p>{plan.first_session}</p><p style={{ color: mutedColor }}>{plan.optional}</p></section>
  </div>;
}
