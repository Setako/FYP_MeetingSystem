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


let browserWindow = null;
app.disableHardwareAcceleration();
app.on("ready", () => {
  console.log(loadURL)
  // server.listen(8555);
  protocol.unregisterProtocol("", () => {
    const screen = require("electron").screen;
    const display = screen.getPrimaryDisplay();
    const area = display.workArea;

    browserWindow = new BrowserWindow({
      width: 99999,
      height: 99999,
      frame: false,
      transparent: true
    });
    // browserWindow.setFullScreen(true);


    browserWindow.loadURL(loadURL);

    browserWindow.setAlwaysOnTop(true);

    browserWindow.setVisibleOnAllWorkspaces(true);
    browserWindow.setFullScreenable(false);
    browserWindow.setSkipTaskbar(true);

    //Prevent automatic maximize and resize
    browserWindow.setResizable(false);
    browserWindow.setMaximizable(false);
    browserWindow.setIgnoreMouseEvents(true, {forward: true});
  })
});
