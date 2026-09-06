import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { handleRequest } from '../worker/index.js';
import { createFakeD1 } from './fake-d1.js';

// Helper to build a Request
function makeRequest(url, { method = 'GET', headers = {}, body } = {}) {
  return new Request(url, { method, headers, body });
}

// Helper to build env
function makeEnv({ db = {}, appPassword, assets = {} } = {}) {
  const fakeDB = createFakeD1(db);
  return {
    DB: fakeDB,
    APP_PASSWORD: appPassword,
    ASSETS: {
      fetch: async (req) => new Response('ok'),
      ...assets
    },
    fakeDB
  };
}

describe('OPTIONS preflight', () => {
  test('returns 204 with CORS headers', async () => {
    const env = makeEnv();
    const req = makeRequest('https://example.com/api/data', { method: 'OPTIONS' });
    const res = await handleRequest(req, env);
    
    assert.strictEqual(res.status, 204);
    assert.strictEqual(res.headers.get('Access-Control-Allow-Origin'), '*');
    assert.strictEqual(res.headers.get('Access-Control-Allow-Methods'), 'GET, POST, PATCH, OPTIONS');
    assert.strictEqual(res.headers.get('Access-Control-Allow-Headers'), 'Content-Type, Authorization');
  });
});

describe('Authentication', () => {
  test('unauthenticated /api request returns 401', async () => {
    const env = makeEnv({ appPassword: 'secret' });
    const req = makeRequest('https://example.com/api/data');
    const res = await handleRequest(req, env);
    
    assert.strictEqual(res.status, 401);
    assert.ok(res.headers.get('WWW-Authenticate'));
  });
  
  test('authenticated request with correct password succeeds', async () => {
    const env = makeEnv({ appPassword: 'secret' });
    const auth = 'Basic ' + btoa('user:secret');
    const req = makeRequest('https://example.com/api/data', { headers: { Authorization: auth } });
    const res = await handleRequest(req, env);
    
    // Will fail with 500 because fake DB doesn't have data, but auth succeeded
    assert.ok(res.status !== 401);
  });
  
  test('authenticated request with wrong password returns 401', async () => {
    const env = makeEnv({ appPassword: 'secret' });
    const auth = 'Basic ' + btoa('user:wrong');
    const req = makeRequest('https://example.com/api/data', { headers: { Authorization: auth } });
    const res = await handleRequest(req, env);
    
    assert.strictEqual(res.status, 401);
  });
  
  test('no password configured allows all requests (fail-open)', async () => {
    const env = makeEnv({ appPassword: undefined });
    const req = makeRequest('https://example.com/api/data');
    const res = await handleRequest(req, env);
    
    // Will fail with 500 because fake DB doesn't have data, but auth succeeded
    assert.ok(res.status !== 401);
  });
});

describe('GET /api/data', () => {
  test('returns expected shape', async () => {
    const env = makeEnv({
      db: {
        all: {
          'study_log': { results: [] },
          'status': { results: [] },
          'tutor_qa': { results: [] },
          'skill_coverage': { results: [] },
          'applications': { results: [] },
          'artifacts': { results: [] },
          'gate_check': { results: [] },
          'v_funnel_by_tier': { results: [] },
          'job_postings': { results: [] },
        },
        first: {
          'daily_plan': null,
          'frontier': null,
          'advisory': null,
          'v_funnel': null,
        }
      }
    });
    const req = makeRequest('https://example.com/api/data');
    const res = await handleRequest(req, env);
    
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.ok(body.plan !== undefined);
    assert.ok(body.frontier !== undefined);
    assert.ok(body.advisory !== undefined);
    assert.ok(body.log !== undefined);
    assert.ok(body.status !== undefined);
    assert.ok(body.questions !== undefined);
    assert.ok(body.coverage !== undefined);
    assert.ok(body.applications !== undefined);
    assert.ok(body.artifacts !== undefined);
    assert.ok(body.gate !== undefined);
    assert.ok(body.funnel !== undefined);
    assert.ok(body.funnel_by_tier !== undefined);
    assert.ok(body.postings !== undefined);
  });
  
  test('tolerates malformed JSON in postings.skills', async () => {
    const env = makeEnv({
      db: {
        all: {
          'study_log': { results: [] },
          'status': { results: [] },
          'tutor_qa': { results: [] },
          'skill_coverage': { results: [] },
          'applications': { results: [] },
          'artifacts': { results: [] },
          'gate_check': { results: [] },
          'v_funnel_by_tier': { results: [] },
          'job_postings': { 
            results: [{ id: 1, status: 'saved', skills: '{not json' }]
          },
        },
        first: {
          'daily_plan': null,
          'frontier': null,
          'advisory': null,
          'v_funnel': null,
        }
      }
    });
    const req = makeRequest('https://example.com/api/data');
    const res = await handleRequest(req, env);
    
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.deepStrictEqual(body.postings[0].skills, []);
  });
});

describe('POST /api/log', () => {
  test('with valid body inserts and returns ok', async () => {
    const today = new Date().toISOString().slice(0, 10);
    const now = new Date().toISOString();
    const env = makeEnv({
      db: {
        run: {
          'INSERT INTO study_log': { meta: { last_row_id: 42, changes: 1 } }
        }
      }
    });
    
    const body = JSON.stringify({ hours: 1.5, topic: 'DSA', track: 'dsa', notes: 'test' });
    const req = makeRequest('https://example.com/api/log', { method: 'POST', body });
    const res = await handleRequest(req, env);
    
    assert.strictEqual(res.status, 200);
    const bodyRes = await res.json();
    assert.deepStrictEqual(bodyRes, { ok: true, id: 42 });
    
    // Verify the DB call
    const runCall = env.fakeDB.calls.find(c => c.op === 'run');
    assert.ok(runCall);
    assert.ok(runCall.sql.includes('INSERT INTO study_log'));
    assert.strictEqual(runCall.params[1], 1.5);
    assert.strictEqual(runCall.params[2], 'DSA');
    assert.strictEqual(runCall.params[3], 'dsa');
  });
  
  test('rejects non-JSON body', async () => {
    const env = makeEnv();
    const req = makeRequest('https://example.com/api/log', { method: 'POST', body: 'not json' });
    const res = await handleRequest(req, env);
    
    assert.strictEqual(res.status, 500);
    const bodyRes = await res.json();
    assert.ok(bodyRes.error);
    // No insert should have been made
    assert.strictEqual(env.fakeDB.calls.filter(c => c.op === 'run').length, 0);
  });
  
  test('rejects missing topic', async () => {
    const env = makeEnv();
    const body = JSON.stringify({ hours: 1 });
    const req = makeRequest('https://example.com/api/log', { method: 'POST', body });
    const res = await handleRequest(req, env);
    
    assert.strictEqual(res.status, 400);
    const bodyRes = await res.json();
    assert.ok(bodyRes.error);
    assert.strictEqual(env.fakeDB.calls.filter(c => c.op === 'run').length, 0);
  });
  
  test('rejects string hours (regression)', async () => {
    const env = makeEnv();
    const body = JSON.stringify({ hours: 'abc', topic: 'x' });
    const req = makeRequest('https://example.com/api/log', { method: 'POST', body });
    const res = await handleRequest(req, env);
    
    assert.strictEqual(res.status, 400);
    const bodyRes = await res.json();
    assert.ok(bodyRes.error);
    assert.strictEqual(env.fakeDB.calls.filter(c => c.op === 'run').length, 0);
  });
  
  test('rejects negative hours', async () => {
    const env = makeEnv();
    const body = JSON.stringify({ hours: -1, topic: 'x' });
    const req = makeRequest('https://example.com/api/log', { method: 'POST', body });
    const res = await handleRequest(req, env);
    
    assert.strictEqual(res.status, 400);
    const bodyRes = await res.json();
    assert.ok(bodyRes.error);
    assert.strictEqual(env.fakeDB.calls.filter(c => c.op === 'run').length, 0);
  });
  
  test('rejects zero hours', async () => {
    const env = makeEnv();
    const body = JSON.stringify({ hours: 0, topic: 'x' });
    const req = makeRequest('https://example.com/api/log', { method: 'POST', body });
    const res = await handleRequest(req, env);
    
    assert.strictEqual(res.status, 400);
    const bodyRes = await res.json();
    assert.ok(bodyRes.error);
    assert.strictEqual(env.fakeDB.calls.filter(c => c.op === 'run').length, 0);
  });
  
  test('accepts valid hours as number', async () => {
    const env = makeEnv({
      db: {
        run: {
          'INSERT INTO study_log': { meta: { last_row_id: 1, changes: 1 } }
        }
      }
    });
    const body = JSON.stringify({ hours: 2, topic: 'x', track: 'dsa' });
    const req = makeRequest('https://example.com/api/log', { method: 'POST', body });
    const res = await handleRequest(req, env);
    
    assert.strictEqual(res.status, 200);
    assert.strictEqual(env.fakeDB.calls.filter(c => c.op === 'run').length, 1);
  });
});

describe('POST /api/ask', () => {
  test('with valid body inserts and returns ok', async () => {
    const today = new Date().toISOString().slice(0, 10);
    const now = new Date().toISOString();
    const env = makeEnv({
      db: {
        run: {
          'INSERT INTO tutor_qa': { meta: { last_row_id: 99, changes: 1 } }
        }
      }
    });
    
    const body = JSON.stringify({ question: '  Why is this important?  ' });
    const req = makeRequest('https://example.com/api/ask', { method: 'POST', body });
    const res = await handleRequest(req, env);
    
    assert.strictEqual(res.status, 200);
    const bodyRes = await res.json();
    assert.deepStrictEqual(bodyRes, { ok: true, id: 99 });
    
    // Verify the DB call - question should be trimmed
    const runCall = env.fakeDB.calls.find(c => c.op === 'run');
    assert.ok(runCall);
    assert.ok(runCall.sql.includes('INSERT INTO tutor_qa'));
    assert.strictEqual(runCall.params[1], 'Why is this important?');
  });
  
  test('rejects missing question', async () => {
    const env = makeEnv();
    const body = JSON.stringify({});
    const req = makeRequest('https://example.com/api/ask', { method: 'POST', body });
    const res = await handleRequest(req, env);
    
    assert.strictEqual(res.status, 400);
    const bodyRes = await res.json();
    assert.ok(bodyRes.error);
    assert.strictEqual(env.fakeDB.calls.filter(c => c.op === 'run').length, 0);
  });
  
  test('rejects empty string question', async () => {
    const env = makeEnv();
    const body = JSON.stringify({ question: '' });
    const req = makeRequest('https://example.com/api/ask', { method: 'POST', body });
    const res = await handleRequest(req, env);
    
    assert.strictEqual(res.status, 400);
    const bodyRes = await res.json();
    assert.ok(bodyRes.error);
    assert.strictEqual(env.fakeDB.calls.filter(c => c.op === 'run').length, 0);
  });
  
  test('rejects whitespace-only question', async () => {
    const env = makeEnv();
    const body = JSON.stringify({ question: '   ' });
    const req = makeRequest('https://example.com/api/ask', { method: 'POST', body });
    const res = await handleRequest(req, env);
    
    assert.strictEqual(res.status, 400);
    const bodyRes = await res.json();
    assert.ok(bodyRes.error);
    assert.strictEqual(env.fakeDB.calls.filter(c => c.op === 'run').length, 0);
  });
  
  test('rejects non-string question (regression)', async () => {
    const env = makeEnv();
    const body = JSON.stringify({ question: 42 });
    const req = makeRequest('https://example.com/api/ask', { method: 'POST', body });
    const res = await handleRequest(req, env);
    
    assert.strictEqual(res.status, 400);
    const bodyRes = await res.json();
    assert.ok(bodyRes.error);
    assert.strictEqual(env.fakeDB.calls.filter(c => c.op === 'run').length, 0);
  });
});

describe('404 for unknown paths', () => {
  test('unknown /api path returns 404', async () => {
    const env = makeEnv();
    const req = makeRequest('https://example.com/api/nope');
    const res = await handleRequest(req, env);
    
    assert.strictEqual(res.status, 404);
    const bodyRes = await res.json();
    assert.deepStrictEqual(bodyRes, { error: 'Not found' });
  });
  
  test('unknown path returns static assets', async () => {
    const env = makeEnv();
    const req = makeRequest('https://example.com/some-page');
    const res = await handleRequest(req, env);
    
    assert.strictEqual(res.status, 200);
    const body = await res.text();
    assert.strictEqual(body, 'ok');
  });
});
