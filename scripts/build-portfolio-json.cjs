#!/usr/bin/env node
// Generate the active milestone plan without parsing presentation Markdown.
const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.resolve(__dirname, '..');

function validatePlan(plan) {
  if (plan.mode !== 'milestones' || !plan.version || !plan.title) throw new Error('Missing milestone plan identity');
  if (!Array.isArray(plan.projects) || !plan.projects.length) throw new Error('Plan must contain projects');
  const ids = new Set();
  for (const project of plan.projects) {
    if (!project.id || ids.has(project.id)) throw new Error('Project IDs must be present and unique');
    ids.add(project.id);
    if (!project.title || !project.goal || !Array.isArray(project.milestones) || !project.milestones.length) throw new Error('Project must contain a goal and milestones');
    const milestones = new Set();
    for (const m of project.milestones) {
      if (!m.id || !m.text || milestones.has(m.id)) throw new Error('Milestone IDs must be present and unique within a project');
      milestones.add(m.id);
    }
  }
  if (!Array.isArray(plan.budgets) || !plan.budgets.length || !Array.isArray(plan.weeks) || !plan.weeks.length) throw new Error('Missing capacity or calendar');
  for (const b of plan.budgets) {
    const values = [b.hours, b.build, b.coding, b.fundamentals, b.career];
    if (!values.every(v => Number.isFinite(v) && v >= 0) || b.hours <= 0 || b.build + b.coding + b.fundamentals + b.career !== b.hours) throw new Error('Weekly budget must balance');
  }
  return plan;
}

function build(root = ROOT) {
  const plan = validatePlan(JSON.parse(fs.readFileSync(path.join(root, 'crash-course/november-plan.json'), 'utf8')));
  const guide = fs.readFileSync(path.join(root, 'crash-course/NOVEMBER_READINESS.md'), 'utf8');
  // Read and validate everything before replacing either generated artifact.
  fs.writeFileSync(path.join(root, 'public/portfolio.json'), JSON.stringify(plan, null, 2) + '\n');
  fs.writeFileSync(path.join(root, 'public/readiness-plan.md'), guide);
  console.log(`portfolio.json: ${plan.projects.length} projects, ${plan.projects.reduce((n,p) => n + p.milestones.length, 0)} milestones; no legacy day-progress migration`);
  return plan;
}

if (require.main === module) build();
module.exports = { validatePlan, build };
