const {Router} = require("express");

const ipcChannels = require("../../../utils/ipc-channels");
const windowUtils = require("../../../utils/window-utils");
const promiseExec = require("../../../utils/exec-utils").promiseExec;
const app = require("../../../../app");

let router = new Router();

let originalWindowSize;
let lastResizeSessionIdentifier = null;
router.post("/resize", async function (req, res) {
  let rootWindowInfo = await windowUtils.getWindowInformation(null, ["-root"]);
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
  app.rendererWindow.webContents.send(ipcChannels.IPC_CHANNEL_DEVICE_CONTROL, {test: "testmsg"});
  console.log("sended")

  res.sendStatus(200)
});


let originalWindowLocation;
let lastDragSessionIdentifier = null;
router.post("/drag", async function (req, res) {
  let rootWindowInfo = await windowUtils.getWindowInformation(null, ["-root"]);
  let currentWindowInfo = await windowUtils.getWindowInformation();
  if (req.body.dragSessionIdentifier !== lastDragSessionIdentifier) {
    lastDragSessionIdentifier = req.body.dragSessionIdentifier;
    originalWindowLocation = [parseInt(currentWindowInfo["Absolute upper-left X"]), parseInt(currentWindowInfo["Absolute upper-left Y"])];
  }
  let xAddition = rootWindowInfo["Width"] * req.body.xScale;
  let yAddition = rootWindowInfo["Height"] * req.body.yScale;
  console.log(xAddition + "," + yAddition);
  console.log(originalWindowLocation)
  console.log(currentWindowInfo)

  let newX = Math.max(10, originalWindowLocation[0] + xAddition);
  let newY = Math.max(10, originalWindowLocation[1] + yAddition);
  promiseExec(`xdotool windowmove ${currentWindowInfo["Window id"]} ${newX} ${newY}`).catch(e => console.log(e));


  res.sendStatus(200)
});

module.exports = router;
