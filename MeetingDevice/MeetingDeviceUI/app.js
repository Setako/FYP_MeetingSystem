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
  .parse(process.argv);

if (commandInput.url) loadURL = commandInput.url;


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
      transparent: true,
      alwaysOnTop: true
    });


    rendererWindow.loadURL(loadURL);

    rendererWindow.setAlwaysOnTop(true);


    rendererWindow.setVisibleOnAllWorkspaces(true);
    rendererWindow.setSkipTaskbar(true);
    rendererWindow.toggleDevTools();

    //Prevent automatic maximize and resize
    rendererWindow.setResizable(false);
    rendererWindow.setMaximizable(false);
    rendererWindow.setIgnoreMouseEvents(true, {forward: true});
    module.exports.rendererWindow = rendererWindow;
    server.listen(8555);
  })
});
