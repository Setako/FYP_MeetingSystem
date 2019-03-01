import {app, BrowserWindow, protocol, remote} from 'electron';
import * as commander from 'commander';
import * as url from 'url';
import * as path from 'path';


const commandInput = commander.version('0.0.1')
  .option('-u, --url [url]', 'Load from url')
  .option('-d, --dev', 'Development mode')
  // .option('-i, --id [deviceId]', 'Set device id')
  // .option('-s, --secret [secret]', 'Set device secret')
  .parse(process.argv);


const loadURL = commandInput.url ? commandInput.url : url.format({
  pathname: path.join(__dirname, 'dist/MeetingDeviceUI/index.html'),
  protocol: 'file:',
  slashes: true
});

// @ts-ignore
global.device = {
  id: process.env.MEETING_DEVICE_ID,
  secret: process.env.MEETING_DEVICE_SECRET
};

// @ts-ignore
if (global.device.id == null || global.device.secret == null) {
  throw new Error('Missing device id or secret!');
}

let rendererWindow = null;
app.disableHardwareAcceleration();
app.on('ready', () => {
  console.log(loadURL);
  console.log('OK');
  protocol.unregisterProtocol('', () => {
    const screen = require('electron').screen;
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
    } else {
      rendererWindow.setVisibleOnAllWorkspaces(true);
      rendererWindow.setAlwaysOnTop(true);
      rendererWindow.setIgnoreMouseEvents(true, {forward: true});

    }


    rendererWindow.setSkipTaskbar(true);

    // Prevent automatic maximize and resize
    rendererWindow.setResizable(false);
    rendererWindow.setMaximizable(false);
    module.exports.rendererWindow = rendererWindow;
    // server.listen(8555);
  });
});
