const {app, BrowserWindow, protocol, remote} = require("electron");
const commander = require("commander");
const server = require("./main/server")();
const path = require('path');

const url = require('url');

let loadURL = url.format({
  pathname: path.join(__dirname, 'dist/MeetingDeviceUI/index.html'),
  protocol: 'file:',
  slashes: true
});
// let loadURL = "http://google.com";
let commandInput = commander.version("0.0.1")
  .option("-u, --url [url]", "Load from url")
  .option("-d, --dev", "Development mode")
  .option("-i, --id [deviceId]", "Set device id")
  .option("-s, --secret [secret]", "Set device secret")
  .parse(process.argv);

if (commandInput.url) loadURL = commandInput.url;


if (commandInput.id == null || commandInput.secret == null) {
  throw "Missing device id or secret!";
}
global.device = {
  id: commandInput.id,
  secret: commandInput.secret
};

let rendererWindow = null;
app.disableHardwareAcceleration();
app.on("ready", () => {
  console.log(loadURL)
  console.log("OK")
  protocol.unregisterProtocol("", () => {
    const screen = require("electron").screen;
    const display = screen.getPrimaryDisplay();
    const area = display.workArea;

    rendererWindow = new BrowserWindow({
      width: 99999,
      height: 99999,
      frame: false,
      transparent: true
    });


    rendererWindow.loadURL(loadURL);


    if (commandInput.dev) {
      rendererWindow.toggleDevTools();
    }else{
      rendererWindow.setVisibleOnAllWorkspaces(true);
      rendererWindow.setAlwaysOnTop(true);
      rendererWindow.setIgnoreMouseEvents(true, {forward: true});

    }


    rendererWindow.setSkipTaskbar(true);

    //Prevent automatic maximize and resize
    rendererWindow.setResizable(false);
    rendererWindow.setMaximizable(false);
    module.exports.rendererWindow = rendererWindow;
    server.listen(8555);
  })
});
