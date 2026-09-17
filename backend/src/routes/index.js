'use strict';
const router = require('express').Router();

router.use('/auth', require('./authRoutes'));
router.use('/members', require('./memberRoutes'));
router.use('/circulation', require('./circulationRoutes'));
router.use('/documents', require('./documentRoutes'));
router.use('/reports', require('./reportRoutes'));

// Health check
router.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

module.exports = router;
