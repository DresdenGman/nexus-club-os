import express from 'express';
import * as db from '../db.js';

const router = express.Router();

// GROUPS
router.get('/clubs', async (_req, res) => {
  try { const data = await db.getClubs(); res.json(data); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/clubs', async (req, res) => {
  try { const data = await db.createClub(req.body); res.status(201).json(data); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

router.patch('/clubs/:id', async (req, res) => {
  try { const data = await db.updateClub(req.params.id, req.body); res.json(data); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/clubs/:id', async (req, res) => {
  try { await db.deleteClub(req.params.id); res.json({ success: true }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

// APPROVALS
router.get('/approvals', async (req, res) => {
  try { const data = await db.getApprovals(req.query.uid || null); res.json(data); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/approvals', async (req, res) => {
  try { const data = await db.createApproval(req.body); res.status(201).json(data); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

router.patch('/approvals/:id', async (req, res) => {
  try { const data = await db.updateApproval(req.params.id, req.body); res.json(data); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/approvals/:id', async (req, res) => {
  try { await db.deleteApproval(req.params.id); res.json({ success: true }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

// USERS
router.get('/users', async (_req, res) => {
  try { const data = await db.getUsers(); res.json(data); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/users', async (req, res) => {
  try { const data = await db.createUser(req.body); res.status(201).json(data); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/users/:id', async (req, res) => {
  try { await db.deleteUser(req.params.id); res.json({ success: true }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

export default router;
