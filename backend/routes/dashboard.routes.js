const { authJwt } = require("../middleware");
const controller = require("../controllers/dashboard.controller.js");

module.exports = function(app) {
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  app.get("/api/dashboard/metrics", [authJwt.verifyToken, authJwt.isAdmin], controller.getMetrics);
  app.get("/api/dashboard/charts", [authJwt.verifyToken, authJwt.isAdmin], controller.getChartData);
};