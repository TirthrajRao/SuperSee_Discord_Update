import {
  app,
  BrowserWindow,
  screen,
  Menu,
  Tray,
  ipcMain,
  powerMonitor,
} from "electron";

import * as path from "path";
import * as url from "url";
import * as electronLocalshortcut from "electron-localshortcut";
const localShortcut = require("electron-localshortcut");

const activeWindow = require("active-win");
const serverURL = "https://raodoctor.raoinfo.tech:4444/apps/";
const fetch = require("node-fetch");
const AutoLaunch = require("auto-launch");
const appPath = app.getPath("exe");
const appName = "Supersee";
const https = require("https");
const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});
const { autoUpdater } = require('electron-updater');

const { localStorage, sessionStorage } = require("electron-browser-storage");

// const assetsDirectory = path.join(__dirname, 'assets/favicon.png')

const autoLauncher = new AutoLaunch({
  name: appName,
  path: appPath,
});

// console.log("appPath", appPath);
// console.log(" appName ", appName);
autoLauncher
  .enable()
  .then(() => {
    console.log("Auto-launch enabled");
  })
  .catch((err) => {
    console.log("Error enabling auto-launch:", err);
  });

let win: BrowserWindow = null;
let tray: any;
const args = process.argv.slice(1),
  serve = args.some((val) => val === "--serve");
ipcMain.on("asynchronous-message", (event, arg) => {
  if (arg === "tray") win.hide();
  if (arg === "quit") {
    app.quit();
    app.exit();
    process.exit();
  }
});

let lastMouseActivityTimestamp = Date.now();
let lastKeyBoardActivityTimestamp = Date.now();
let lastIdleTime = 0;

function apiCall(data, status) {
  console.log(data);
  fetch(serverURL, {
    method: status == "Add" ? "POST" : "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    agent: httpsAgent,
    body: JSON.stringify(data),
  })
    .then((response) => response.json())
    .then((data) => {
      console.log(data);
    })
    .catch((error) => {
      // Handle any errors that occurred during the API call
      console.error("Error:", error);
    });
}

function createWindow(): BrowserWindow {
  const electronScreen = screen;
  const size = electronScreen.getPrimaryDisplay().workAreaSize;
  // Create the browser window.
  win = new BrowserWindow({
    // autoHideMenuBar: true,
    // skipTaskbar: true,
    x: 0,
    y: 0,
    width: 550,
    height: 650,
    // maxHeight: 650,
    // maxWidth: 500,
    icon: path.join(__dirname, "dist/assets/logo.png"),
    webPreferences: {
      nodeIntegration: true,
      allowRunningInsecureContent: serve ? true : false,
      enableRemoteModule: true,
      // webSecurity: false
    },
  });

  powerMonitor.addListener("lock-screen", () => {
    win.webContents.send("stop", "lock-screen successfully!");
  });

  powerMonitor.on("suspend", () => {
    win.webContents.send("stop", "shutdown successfully!");
  });

  powerMonitor.on("resume", () => {
    win.webContents.send("start", "Unlock successfully!");
  });

  powerMonitor.addListener("shutdown", () => {
    win.webContents.send("stop", "shutdown successfully!");
  });

  powerMonitor.addListener("unlock-screen", () => {
    win.webContents.send("start", "Unlock successfully!");
  });

  // Disable refresh
  win.on("focus", (event) => {
    electronLocalshortcut.register(
      win,
      ["CommandOrControl+R", "CommandOrControl+Shift+R", "F5"],
      () => { }
    );
  });

  win.on("blur", (event) => {
    electronLocalshortcut.unregisterAll(win);
  });
  if (serve) {
    require("electron-reload")(__dirname, {
      electron: require(`${__dirname}/node_modules/electron`),
    });
    win.loadURL("http://localhost:4200");
  } else {
    // win.loadURL(
    //   url.format({
    //     pathname: path.join(__dirname, "dist/index.html"),
    //     protocol: "file:",
    //     slashes: true,
    //   })
    // );
    // win.loadFile(path.join(__dirname, './dist/index.html'));
    // win.loadURL(`file://${__dirname}/dist/index.html`);
    var indexPath = path.resolve(__dirname, 'angular_build/index.html');
    win.loadURL(indexPath);
    // debug
    // win.webContents.openDevTools()
  }

  if (serve) {
    win.webContents.openDevTools();
  }

  win.on("close", (e) => {
    // Do your control here
    console.log("close");
    e.preventDefault();
  });
  // Emitted when the window is closed.
  win.on("closed", () => {
    console.log("closed");
    // win.removeAllListeners("close");
    // win = null;
  });

  win.setVisibleOnAllWorkspaces(true);

  win.once('ready-to-show', () => {
    autoUpdater.checkForUpdatesAndNotify();
  });

  return win;
}

function createTray(app) {
  tray = new Tray(path.join(__dirname, "angular_build/assets/logo.png"));
  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Show-App",
      click: function () {
        win.show();
      },
    },
    {
      label: "Hide",
      click: function () {
        win.hide();
      },
    },
    {
      label: "Quit",
      click: async () => {
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);
  // tray.setContextMenu(contextMenu);
}

try {
  // Custom menu.
  const isMac = process.platform === "darwin";
  const template: any = [
    // { role: 'fileMenu' }
    {
      label: "File",
      submenu: [isMac ? { role: "close" } : { role: "quit" }],
    },
    // { role: 'editMenu' }
    {
      label: "Window",
      submenu: [{ role: "minimize" }],
    },
    {
      label: app.getVersion(),
      // submenu: [{ role: app.getVersion() }],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  //set auto restart
  app.setLoginItemSettings({
    openAtLogin: true,
  });

  const gotTheLock = app.requestSingleInstanceLock();

  if (!gotTheLock) {
    app.quit();
  } else {
    app.on("before-quit", () => {
      // Add your code here to stop the timer
      // For example, assuming you have a function to stop the timer in yourTimerModule
      win.webContents.send("stop", "shutdown successfully!");
    });

    app.on("second-instance", (event, commandLine, workingDirectory) => {
      // Someone tried to run a second instance, we should focus our window.
      if (win) {
        if (win.isMinimized()) win.restore();
        win.focus();
      }
    });

    app.on("ready", async () => {
      createWindow();

      let app_version = app.getVersion();
      setInterval(() => {
        win.webContents.send("app_version", app_version);
      }, 5000)
      // inter(() => {
      //   win.webContents.send("app_version", app_version);
      // }, 2000)

      createTray(app);

      // No Need for this

      // let applicationsTrack = [];

      // setInterval(async () => {
      //   // console.log(" localStorage", await localStorage.getItem("isRunning"));

      //   win.webContents
      //     .executeJavaScript(`localStorage.getItem('currentUser');`)
      //     .then((currentUser) => {
      //       if (
      //         currentUser &&
      //         JSON.parse(currentUser) &&
      //         JSON.parse(currentUser)._id
      //       ) {
      //         currentUser = JSON.parse(currentUser);
      //         // console.log(" current user id ", currentUser._id);
      //         win.webContents
      //           .executeJavaScript(`localStorage.getItem('isRunning');`)
      //           .then((value) => {
      //             // The value returned from the local storage
      //             console.log(" IS RUNNING ", value, typeof value);
      //             if (value == true || value == "true") {
      //               const systemIdleTime = powerMonitor.getSystemIdleTime();
      //               if (systemIdleTime) {
      //                 lastIdleTime = lastIdleTime + 1;
      //               }
      //               activeWindow()
      //                 .then((result) => {
      //                   let currentAppInfo: any;
      //                   result["owner"]["name"] =
      //                     result["owner"].name && result["owner"].name
      //                       ? result["owner"].name
      //                       : "";
      //                   if (
      //                     applicationsTrack.length &&
      //                     (applicationsTrack[applicationsTrack.length - 1]
      //                       .appName != result["owner"].name ||
      //                       applicationsTrack[applicationsTrack.length - 1]
      //                         .appScreen != result.title)
      //                   ) {
      //                     currentAppInfo = {
      //                       user: currentUser._id,
      //                       appName:
      //                         result["owner"] && result["owner"].name
      //                           ? result["owner"].name
      //                           : "",
      //                       appScreen: result.title,
      //                       date: new Date(),
      //                       idealTime: 0,
      //                       usageTime: 0,
      //                     };

      //                     applicationsTrack[applicationsTrack.length - 1][
      //                       "idealTime"
      //                     ] = lastIdleTime > 180 ? lastIdleTime : 0;

      //                     applicationsTrack[applicationsTrack.length - 1][
      //                       "usageTime"
      //                     ] =
      //                       (currentAppInfo.date.getTime() -
      //                         applicationsTrack[applicationsTrack.length - 1][
      //                           "date"
      //                         ].getTime()) /
      //                       1000;

      //                     apiCall(
      //                       applicationsTrack[applicationsTrack.length - 1],
      //                       "Update"
      //                     );

      //                     lastIdleTime = 0;
      //                     applicationsTrack.push(currentAppInfo);
      //                     apiCall(currentAppInfo, "Add");
      //                     // console.log(applicationsTrack);
      //                   } else if (applicationsTrack.length === 0) {
      //                     currentAppInfo = {
      //                       user: currentUser._id,
      //                       appName:
      //                         result["owner"] && result["owner"].name
      //                           ? result["owner"].name
      //                           : "",
      //                       appScreen: result.title,
      //                       date: new Date(),
      //                       idealTime: 0,
      //                       usageTime: 0,
      //                     };
      //                     applicationsTrack.push(currentAppInfo);
      //                     apiCall(currentAppInfo, "Add");
      //                   }
      //                 })
      //                 .catch((error) => {
      //                   console.error(error);
      //                 });
      //             } else {
      //             }
      //           })
      //           .catch((error) => {
      //             console.error(error);
      //           });
      //       } else {
      //         console.log(" User is not loged in ");
      //       }
      //     })
      //     .catch((error) => {
      //       console.log(" User is not loged in ");
      //     });
      // }, 1000 * 60);
    });
  }

  app.disableHardwareAcceleration();

  // Quit when all windows are closed.
  app.on("window-all-closed", () => {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== "darwin") {
      app.quit();
      // ["mousemove", "mousedown", "mouseup", "mousewheel", "mouseout"].forEach(
      //   (event) => {
      //     window.removeEventListener(event, handleMouseEvent);
      //   }
      // );
    }
  });

  app.on("activate", () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (win === null) {
      createWindow();
      createTray(app);
    }
  });


  autoUpdater.on('checking-for-update', () => {
    win.webContents.send('checking_for_update');
  });

  autoUpdater.on('update-available', (info) => {
    // win.webContents.send('update_available');
  });

  autoUpdater.on('update-not-available', (info) => {
    win.webContents.send('update_not_available');
  });

  autoUpdater.on('download-progress', (progressTrack) => {
    win.webContents.send('download_progress');
  });

  autoUpdater.on('update-downloaded', (info) => {
    win.webContents.send('update_downloaded');
    autoUpdater.quitAndInstall();
  });

  autoUpdater.on('error', (error) => {
    win.webContents.send('error_in_update', error);
  });

} catch (e) {
  // Catch Error
  // throw e;
}
