const {Router} = require("express");
const windowUtils = require("../../../utils/window-utils");
const promiseExec = require("../../../utils/exec-utils").promiseExec;

let router = new Router();

let originalWindowSize;
let lastResizeSessionIdentifier = null;
router.post("/resize", async function (req, res) {
  let rootWindowInfo = await windowUtils.getWindowInformation(null,["-root"]);
  let currentWindowInfo = await windowUtils.getWindowInformation();
  if (req.body.resizeSessionIdentifier !== lastResizeSessionIdentifier) {
    lastResizeSessionIdentifier = req.body.resizeSessionIdentifier;
    originalWindowSize = [parseInt(currentWindowInfo["Width"]), parseInt(currentWindowInfo["Height"])];
  }
  let widthAddition = rootWindowInfo["Width"] * req.body.widthScale;
  let heightAddition = rootWindowInfo["Height"] * req.body.heightScale;
  console.log(widthAddition + "," + heightAddition);

  let newWidth = Math.max(10, originalWindowSize[0] + widthAddition);
  let newHeight = Math.max(10, originalWindowSize[1] + heightAddition);
  promiseExec(`xdotool windowsize ${currentWindowInfo["Window id"]} ${newWidth} ${newHeight}`).catch(e => console.log(e));

  res.sendStatus(200)
});

module.exports = router;
