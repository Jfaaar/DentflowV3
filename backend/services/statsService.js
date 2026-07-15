const repo = require('../repositories/statsRepository');

function getDashboardStats(req) {
  return repo.getDashboardStats(req.db);
}

function getRevenueSummary(req) {
  return repo.getRevenueSummary(req.db);
}

module.exports = { getDashboardStats, getRevenueSummary };
