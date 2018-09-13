const {app, BrowserWindow, protocol, remote} = require("electron");
const commander = require("commander");

let loadURL = "http://localhost:4200";
let commandInput = commander.version("0.0.1")
  .option("-u, --url [url]", "Load from url")
  .parse(process.argv);

if (commandInput.url) loadURL = commandInput.url;


let browserWindow = null;
app.disableHardwareAcceleration();
app.on("ready", () => {
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
    browserWindow.setAlwaysOnTop(true);

    browserWindow.setVisibleOnAllWorkspaces(true);
    browserWindow.setFullScreenable(false);
    browserWindow.setSkipTaskbar(true);

    //Prevent automatic maximize and resize
    browserWindow.setResizable(false);
    browserWindow.setMaximizable(false);

    browserWindow.loadURL(loadURL);
    browserWindow.setIgnoreMouseEvents(true, {forward: true});
  })
});
