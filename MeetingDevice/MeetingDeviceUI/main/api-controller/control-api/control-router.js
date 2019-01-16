const {Router} = require("express");
const windowController = require("./window/window-controller");

let router = new Router();

router.use("/window",windowController);

module.exports = router;
