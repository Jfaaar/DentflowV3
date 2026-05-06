const service = require('../services/statsService');

async function dashboard(req, res) {
  res.json({ data: await service.getDashboardStats(req) });
}

async function revenue(req, res) {
  res.json({ data: await service.getRevenueSummary(req) });
}

module.exports = { dashboard, revenue };
