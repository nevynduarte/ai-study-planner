const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { validatePlan, build } = require('./build-portfolio-json.cjs');
const root = path.resolve(__dirname, '..');
const plan = JSON.parse(fs.readFileSync(path.join(root, 'crash-course/november-plan.json'), 'utf8'));
test('active plan has balanced capacity and unique independent milestone identities', () => {
  assert.equal(validatePlan(plan), plan);
  assert.equal(plan.mode, 'milestones');
  assert.equal(plan.crash_course, undefined);
});
test('empty source cannot overwrite a valid generated plan', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'readiness-test-'));
  try {
    fs.mkdirSync(path.join(tmp, 'crash-course')); fs.mkdirSync(path.join(tmp, 'public'));
    fs.writeFileSync(path.join(tmp, 'crash-course/november-plan.json'), JSON.stringify({...plan, projects:[]}));
    fs.writeFileSync(path.join(tmp, 'public/portfolio.json'), 'prior artifact');
    assert.throws(() => build(tmp), /must contain projects/);
    assert.equal(fs.readFileSync(path.join(tmp, 'public/portfolio.json'), 'utf8'), 'prior artifact');
  } finally {
    const expectedParent = fs.realpathSync(os.tmpdir());
    const resolved = fs.realpathSync(tmp);
    assert.equal(path.dirname(resolved).toLowerCase(), expectedParent.toLowerCase());
    assert.ok(path.basename(resolved).startsWith('readiness-test-'));
    fs.rmSync(resolved, {recursive:true});
  }
});
test('duplicate identities and impossible time budgets are rejected', () => {
  assert.throws(() => validatePlan({...plan,projects:[plan.projects[0],plan.projects[0]]}), /unique/);
  assert.throws(() => validatePlan({...plan,budgets:[{...plan.budgets[0],hours:11}]}), /balance/);
});
