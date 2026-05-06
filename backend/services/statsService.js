const repo = require('../repositories/statsRepository');

function getDashboardStats(req) {
  return repo.getDashboardStats(req.supabase);
}

function getRevenueSummary(req) {
  return repo.getRevenueSummary(req.supabase);
}

module.exports = { getDashboardStats, getRevenueSummary };
