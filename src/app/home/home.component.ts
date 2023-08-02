import { Component, OnInit, ChangeDetectorRef, ViewChild } from "@angular/core";
import { UserService } from "../services/user.service";
import { Router } from "@angular/router";
import * as moment from "moment";
import * as _ from "lodash";
import { Observable, Observer, Subscription, interval } from "rxjs";
import { remote, ipcRenderer, ipcMain } from "electron";
declare var require: any;
declare var externalFunction: any;
declare var $: any;
import { Socket, SocketIoConfig } from "ngx-socket-io";
import { UpdateService } from "../services/update.service";
import { config } from "../config";
import { FirebaseDatabaseService } from "../services/firebase-database.service";
import { ProjectService } from "../services/project.service";
const fsystem = require("fs");
declare var M: any;

@Component({
  selector: "app-home",
  templateUrl: "./home.component.html",
  styleUrls: ["./home.component.css"],
})
export class HomeComponent implements OnInit {
  intervalId: any;
  timeOutId: any;
  userInfo = JSON.parse(localStorage.getItem("currentUser"));
  base64data: any;
  baseArray: any = [];
  callback: any;
  handleStream: any;
  handleError: any;
  timeString: any;
  isStart = true;
  base64: any;
  diff: any;
  clockIn = "00:00:00";
  clockOut = "00:00:00";
  time: any;
  timeout: any;
  seconds = 0;
  minutes = 0;
  hours = 0;
  running = false;
  isFirst = true;
  loading = false;
  userLogDetails: any;
  fs: any;
  inActivityTime: any;
  inActivityStatus: any = "active";
  inActivityTimeInterval: any;

  currentDate: any = new Date().toISOString().split("T")[0] + "T18:30:00.000Z";

  currentTime: any = moment().utcOffset("+05:30").format("h:mm:ss a");
  currentDay: any = moment().format("dddd, MMM D, YYYY");
  jsonFilePath: any;
  imageFilesPath: any;

  timeOutFlag: boolean = false;
  socket: any;

  /*Socket variables*/
  screenShotRequest: Observable<string[]>;
  screenCastRequest: Observable<string[]>;
  isScreenSharing: string;
  config: SocketIoConfig = {
    url: config.baseApiUrl,
    options: {
      reconnectionAttempts: 100, // Number of reconnect attempts
      reconnectionDelay: 3000,
    },
  };

  private _docSub: Subscription;
  screenCastRequestInterval: NodeJS.Timeout;

  constructor(
    public _userService: UserService,
    public router: Router,
    private _socket: Socket,
    private _change: ChangeDetectorRef,
    public sw: UpdateService,
    private dbService: FirebaseDatabaseService,
    private _projectService: ProjectService,
  ) {


    ipcRenderer.on("start", async (event, sourceId) => {
      try {
        this.start();
        this.checkStatus("online");
      } catch (e) {
        console.log(e);
      }
    });

    ipcRenderer.on("stop", async (event, sourceId) => {
      try {
        this.stop();
        this.checkStatus("offline");
      } catch (e) {
        console.log(e);
      }
    });

    console.log("userInfo", this.userInfo);
    this.fs = (window as any).fs;
    localStorage.setItem("isHomeComponent", "true");
    this.running = false;
    localStorage.setItem("isRunning", JSON.stringify(this.running));
    this.loading = true;
    setTimeout(async () => {
      this.jsonFilePath =
        remote.app.getPath("userData") + "/" + this.userInfo._id + ".json";
      console.log(this.jsonFilePath, "jsonFilePath");
      await this.fs.readFile(this.jsonFilePath, async (err, data) => {
        console.log(data, "data");
        if (err) {
          return false;
        } else {
          console.log(JSON.parse(data));
          const userLogDetails = JSON.parse(data);
          console.log(userLogDetails.attendance, "dataa");
          if (
            userLogDetails.attendance.length > 0 &&
            userLogDetails.attendance[userLogDetails.attendance.length - 1]
              .date == this.currentDate
          ) {
            this.diff =
              userLogDetails.attendance[
                userLogDetails.attendance.length - 1
              ].difference;
            this.clockIn = this.getClockTime(
              userLogDetails.attendance[userLogDetails.attendance.length - 1]
                .timeLog,
              "in"
            );
            this.clockOut = this.getClockTime(
              userLogDetails.attendance[userLogDetails.attendance.length - 1]
                .timeLog,
              "out"
            );
            if (this.clockIn == undefined) {
              this.isStart = true;
            }
            console.log(this.clockIn, "clockin");
            if (
              userLogDetails &&
              userLogDetails.attendance &&
              userLogDetails.attendance[userLogDetails.attendance.length - 1] &&
              userLogDetails.attendance[userLogDetails.attendance.length - 1]
                .timeLog.length &&
              userLogDetails.attendance[userLogDetails.attendance.length - 1]
                .timeLog[
                userLogDetails.attendance[userLogDetails.attendance.length - 1]
                  .timeLog.length - 1
              ].out &&
              userLogDetails.attendance[userLogDetails.attendance.length - 1]
                .timeLog[
                userLogDetails.attendance[userLogDetails.attendance.length - 1]
                  .timeLog.length - 1
              ].out == "-"
            ) {
              await this.syncData(
                "stop",
                localStorage.getItem("lastTime")
                  ? localStorage.getItem("lastTime")
                  : moment().utcOffset("+05:30").format("h:mm:ss a")
              );
              await setTimeout(async () => {
                await this.fs.readFile(this.jsonFilePath, async (err, data) => {
                  if (err) {
                    return false;
                    console.log("error", err);
                  } else {
                    this.diff =
                      JSON.parse(data).attendance[
                        JSON.parse(data).attendance.length - 1
                      ].difference;
                    this.clockIn = this.getClockTime(
                      JSON.parse(data).attendance[
                        JSON.parse(data).attendance.length - 1
                      ].timeLog,
                      "in"
                    );
                    this.clockOut = this.getClockTime(
                      JSON.parse(data).attendance[
                        JSON.parse(data).attendance.length - 1
                      ].timeLog,
                      "out"
                    );
                    this.hours =
                      this.diff.split(":")[0] == "-"
                        ? 0
                        : this.diff.split(":")[0];
                    console.log(
                      "minutes",
                      this.diff.split(":")[0] == "-"
                        ? 0
                        : this.diff.split(":")[1]
                    );
                    this.minutes =
                      this.diff.split(":")[0] == "-"
                        ? 0
                        : this.diff.split(":")[1];
                    console.log(
                      "seconds",
                      this.diff.split(":")[0] == "-"
                        ? 0
                        : this.diff.split(":")[2]
                    );
                    this.seconds =
                      this.diff.split(":")[0] == "-"
                        ? 0
                        : this.diff.split(":")[2];
                  }
                });
                this.loading = false;
              }, 2000);
            }
          } else {
            console.log("another day");
            this.diff = "00:00:00";
            this.clockIn = "00:00:00";
            this.clockOut = "00:00:00";
          }

          localStorage.setItem("diff", this.diff);
          this.hours =
            this.diff.split(":")[0] == "-" ? 0 : this.diff.split(":")[0];
          this.minutes =
            this.diff.split(":")[0] == "-" ? 0 : this.diff.split(":")[1];
          this.seconds =
            this.diff.split(":")[0] == "-" ? 0 : this.diff.split(":")[2];
          setTimeout(() => {
            this.loading = false;
          }, 2000);
        }

        setTimeout(async () => {
          this.start();
          this.checkStatus("online");
        }, 200);
      });
    }, 1);
    /**
     * In an every 10 second of interval, this function checks system is connected to internet or not
     * if user is connected with internet, it checks the temp folder named with userId,
     * any images found inside folder it will upload to server and delete it from local
     */

    interval(1000).subscribe((x) => {
      if (this.running) {
        if (
          this.currentDate !=
          new Date().toISOString().split("T")[0] + "T18:30:00.000Z"
        ) {
          this.currentDate =
            new Date().toISOString().split("T")[0] + "T18:30:00.000Z";
          this.jsonFilePath =
            remote.app.getPath("userData") + "/" + this.userInfo._id + ".json";
          this.fs.readFile(this.jsonFilePath, async (err, data) => {
            if (err) {
              return false;
              console.log("error", err);
            } else {
              const userLogDetails = JSON.parse(data);
              await this.syncData("stop", "11:59:59 pm");
              await setTimeout(() => {
                this.syncData("start", "12:00:01 am");
              }, 3000);
            }
          });
        }
      }
    });
    interval(10000).subscribe((x) => {
      const files = fsystem.readdirSync(this.imageFilesPath);
      if (navigator.onLine && files.length) {
        // getting image file from local system folder
        for (const file of files) {
          (async () => {
            var imagePath = this.imageFilesPath + "/" + file;
            // console.log("image path", imagePath);
            const contents = this.fs.readFileSync(imagePath, {
              encoding: "base64",
            });
            // console.log("contents+++++++", contents);

            const imageBlob: Blob = await this.b64toBlob(contents, "image/png");
            console.log(imageBlob);

            let imageName = file;
            // imageName = imageName[imageName.length - 1];
            console.log(imageName);
            const imageFile: File = new File([imageBlob], imageName, {
              type: "image/png",
            });
            // console.log("tempbase64", this.base64);
            // console.log("base64", this.base64);
            // console.log("file name", file, this.imageFilesPath);

            this._userService.sendImage({
              imageFile: imageFile,
              imageName: file.split(".").slice(0, -1).join("."),
              id: this.userInfo._id,
            });
            // deleting image from local folder named with userId
            this.fs.unlinkSync(this.imageFilesPath + "/" + file);
            // this.base64 =  await this.getBase64Image(this.imageFilesPath + "/" + file);
          })();
        }
      }
    });

    // dbService
    //   .getAll()
    //   .snapshotChanges()
    //   .pipe(
    //     map((changes) =>
    //       changes.map((c) => ({ key: c.payload.key, ...c.payload.val() }))
    //     )
    //   )
    //   .subscribe((users) => {
    //     users.forEach((o) => {
    //       console.log("ooooooooooo", o);
    //       if (o.id == this.userInfo._id) {
    //         console.log("metched", o);
    //         if (o.ssRequest === true) {
    //           this.external(true);
    //           dbService.update(o.key, {
    //             id: o.id,
    //             email: o.email,
    //             ssRequest: false,
    //             scRequestStart: false,
    //             scRequestStop: false,
    //           });
    //         }

    //         if (o.scRequestStart === true) {
    //           this.shareScreenCast();
    //           dbService.update(o.key, {
    //             id: o.id,
    //             email: o.email,
    //             ssRequest: false,
    //             scRequestStart: false,
    //             scRequestStop: false,
    //           });
    //         }
    //         if (o.scRequestStop === true) {
    //           clearInterval(this.screenCastRequestInterval);
    //           setTimeout(() => {
    //             this.isScreenSharing = null;
    //           }, 1000);
    //           dbService.update(o.key, {
    //             id: o.id,
    //             email: o.email,
    //             ssRequest: false,
    //             scRequestStart: false,
    //             scRequestStop: false,
    //           });
    //         }
    //       }
    //     });
    //   });

    console.log(this.clockIn + "clock");
  }

  send(arg) {
    ipcRenderer.send("asynchronous-message", arg);
  }

  ngOnInit() {
    this.isStart = true;
    $("#stop").addClass("disable");
    $("#start").removeClass("disable");
    $(document).ready(function () {
      $(".sidenav").sidenav();
    });
    // checks that screenshot requested by admin?
    this._socket.on("screenShotRequest", (data) => {
      console.log("screenShotRequest Recive", data);
      this.external(true);
    });

    this._socket.on("screenCastRequest", (event, arg) => {
      console.log("screenCastRequest Recive", event, arg);
      this.shareScreenCast();
    });

    this._socket.on("empRequestScreenCastOff", (event, arg) => {
      clearInterval(this.screenCastRequestInterval);
      setTimeout(() => {
        this.isScreenSharing = null;
      }, 2000);
    });

    ipcMain.on("stopWorking", (event, data) => {
      console.log(event);
    });

    // ipcMain.on("stopWorking", (event, data) => {
    //   // Handle the data received from the Electron main process
    //   alert("Hey");
    //   console.log("Data received from Electron:", data);
    // });

    // if user info not found redirect to login
    if (!this.userInfo) {
      this.router.navigate(["/login"]);
    }

    // image file path
    this.imageFilesPath =
      remote.app.getPath("userData") + "/" + this.userInfo._id + "/";
    // json file path

    this.jsonFilePath =
      remote.app.getPath("userData") + "/" + this.userInfo._id + ".json";

    // event handler, to prevent from closing window
    remote.getCurrentWindow().on("close", (event) => {
      event.preventDefault();
    });

    /**
     * event handler, to prevent from closing window
     * ask question, confirmation to close window
     *  */
    remote.getCurrentWindow().on("close", (e) => {
      if (JSON.parse(localStorage.getItem("isRunning"))) {
        const choice = remote.dialog
          .showMessageBox(remote.getCurrentWindow(), {
            type: "question",
            buttons: ["Cancel", "Hide", "Quit"],
            title: "Confirm",
            message:
              "Your timer is running. Do you really want to close the application?",
            detail: "Quiting app will stop your timer.",
          })
          .then(async (res) => {
            if (res.response == 2) {
              const logs = {
                date: moment().format("DD-MM-yyyy"),
                time: {
                  hours: this.hours,
                  minutes: this.minutes,
                  seconds: this.seconds,
                },
              };
              await this.checkStatus("offline");
              await this;
              await setTimeout(() => {
                this.fs.readFile(this.jsonFilePath, async (err, data) => {
                  if (err) {
                    return false;
                  } else {
                    const userLogDetails = JSON.parse(data);

                    // Check for lastest version
                    if (!userLogDetails.isLatestVersion) {
                      let details = await this.appendFilesToJson(
                        userLogDetails
                      );
                      details.append(
                        "jsonData",
                        JSON.stringify(userLogDetails)
                      );
                      details.append("userId", this.userInfo._id);
                      const time =
                        userLogDetails.attendance[
                          userLogDetails.attendance.length - 1
                        ].difference;
                      const logs = {
                        date: moment().format("DD-MM-yyyy"),
                        time: {
                          hours: time.split(/[ :]+/)[0],
                          minutes: time.split(/[ :]+/)[1],
                          seconds: time.split(/[ :]+/)[2],
                        },
                      };
                      await this._userService
                        .uploadbase64Img(details)
                        .subscribe(
                          (res) => {
                            this.isFirst = false;
                            return true;
                          },
                          (err) => {
                            return false;
                          }
                        );
                      // adding last log into localStorage it will helps to calculate difference, next stopped time
                      await localStorage.setItem("logs", JSON.stringify(logs));
                      console.log("at the time of stop", logs);
                      await this._userService.storeLogs(logs).subscribe(
                        (res) => console.log(res),
                        (err) => console.log(err)
                      );
                      this.loading = false;
                      this.isStart = true;
                      $("#start").removeClass("disable");
                      this.send("quit");
                    }
                  }
                });
              }, 5000);

              localStorage.setItem("logs", JSON.stringify(logs));
              this._userService.storeLogs(logs).subscribe(
                (res) => { },
                (err) => {
                  // console.log(err);
                }
              );
            }
            if (res.response == 1) {
              this.send("tray");
            }
          });
      } else {
        this.send("quit");
      }
    });
    console.log(this.currentDay);
  }

  shareScreenCast() {
    let uuid = JSON.parse(localStorage.getItem("currentUser"))._id;
    this._socket.emit("join-message", uuid);
    this.screenCastRequestInterval = setInterval(async () => {
      await externalFunction();

      if (localStorage.getItem("imgUrl")) {
        this.base64data = JSON.parse(localStorage.getItem("imgUrl"))
          .split(",")
          .reverse()[0];

        if (this.isScreenSharing !== this.base64data) {
          this.isScreenSharing = this.base64data;
          await this.sendImageForScreenCast(uuid, this.base64data);
        }
      }
    }, 100);
  }

  async sendImageForScreenCast(uuid, base64data) {
    var obj: any = {};
    obj.room = uuid;
    obj.image = base64data;
    this._socket.emit("screen-data", JSON.stringify(obj));
  }

  onQuit() {
    if (JSON.parse(localStorage.getItem("isRunning"))) {
      const choice = remote.dialog
        .showMessageBox(remote.getCurrentWindow(), {
          type: "question",
          buttons: ["No", "Yes"],
          title: "Confirm",
          message:
            "Your timer is running. Do you really want to close the application?",
          detail: "Closing app will stop your timer.",
        })
        .then(async (res) => {
          if (res.response) {
            const logs = {
              date: moment().format("DD-MM-yyyy"),
              time: {
                hours: this.hours,
                minutes: this.minutes,
                seconds: this.seconds,
              },
            };
            await this.checkStatus("offline");
            await this.stop();
            await setTimeout(() => {
              this.fs.readFile(this.jsonFilePath, async (err, data) => {
                if (err) {
                  return false;
                } else {
                  const userLogDetails = JSON.parse(data);

                  // Check for lastest version
                  if (!userLogDetails.isLatestVersion) {
                    let details = await this.appendFilesToJson(userLogDetails);
                    details.append("jsonData", JSON.stringify(userLogDetails));
                    details.append("userId", this.userInfo._id);
                    const time =
                      userLogDetails.attendance[
                        userLogDetails.attendance.length - 1
                      ].difference;
                    const logs = {
                      date: moment().format("DD-MM-yyyy"),
                      time: {
                        hours: time.split(/[ :]+/)[0],
                        minutes: time.split(/[ :]+/)[1],
                        seconds: time.split(/[ :]+/)[2],
                      },
                    };
                    // sends user time logs of the day
                    await this._userService.uploadbase64Img(details).subscribe(
                      (res) => {
                        this.isFirst = false;
                        return true;
                      },
                      (err) => {
                        return false;
                      }
                    );
                    // adding last log into localStorage it will helps to calculate difference, next stopped time
                    await localStorage.setItem("logs", JSON.stringify(logs));
                    await this._userService.storeLogs(logs).subscribe(
                      (res) => console.log(res),
                      (err) => console.log(err)
                    );
                    this.loading = false;
                    this.isStart = false;
                    $("#start").removeClass("disable");
                    this.send("quit");
                  }
                }
              });
            }, 5000);

            localStorage.setItem("logs", JSON.stringify(logs));
            this._userService.storeLogs(logs).subscribe(
              (res) => { },
              (err) => {
                // console.log(err);
              }
            );
          }

          if (res.response == 1) {
            this.send("tray");
          }
        });
    } else {
      this.send("tray");
    }
  }

  // it gets today's time log from server
  getLogs() {
    this._userService.getLogs().subscribe(
      async (res: any) => {
        if (res.logs) {
          const logs = {
            date: res.logs.date,
            time: res.logs.time,
          };
          await this.fs.readFile(this.jsonFilePath, async (err, data) => {
            console.log(JSON.parse(data).attendance, "data data")
            let time =
              JSON.parse(data).attendance[
                JSON.parse(data).attendance.length - 1
              ].difference;
            this.diff = time;
            this.clockIn = this.getClockTime(
              JSON.parse(data).attendance[
                JSON.parse(data).attendance.length - 1
              ].timeLog,
              "in"
            );
            console.log(this.clockIn + "clock in timeeee")
            this.clockOut = this.getClockTime(
              JSON.parse(data).attendance[
                JSON.parse(data).attendance.length - 1
              ].timeLog,
              "out"
            );
            localStorage.setItem("diff", time);
            this.hours = time.split(":")[0] == "-" ? 0 : time.split(":")[0];
            this.minutes = time.split(":")[0] == "-" ? 0 : time.split(":")[1];
            this.seconds = time.split(":")[0] == "-" ? 0 : time.split(":")[2];
          });
          await localStorage.setItem("logs", JSON.stringify(logs));
          await localStorage.setItem("startLogs", JSON.stringify(logs));
          this.hours = JSON.parse(localStorage.getItem("logs")).time.hours;
          this.minutes = JSON.parse(localStorage.getItem("logs")).time.minutes;
          this.seconds = JSON.parse(localStorage.getItem("logs")).time.seconds;
          return;
        }
      },
      (err) => {
        console.log(err);
      }
    );
  }

  startCapturing() {
    console.group("startCapturing");
    console.log("isFirst", this.isFirst);
    if (this.isFirst) {
      const randomTime = _.random(0, 1000 * 60 * 15);
      console.log("randomTime", randomTime);
      this.timeout = setTimeout(() => {
        if (this.running) {
          this.external();
        }
      }, randomTime);
    }

    this.intervalId = setInterval(() => {
      const randomTime = _.random(0, 1000 * 60 * 15);
      console.log("randomTime 2", randomTime);
      this.timeout = setTimeout(() => {
        if (this.running) {
          this.external();
        }
      }, randomTime);
    }, 1000 * 60 * 15);
    console.groupEnd();
  }

  dataURItoBlob(dataURI: string): Observable<Blob> {
    return Observable.create((observer: Observer<Blob>) => {
      const byteString: string = atob(dataURI);
      const arrayBuffer: ArrayBuffer = new ArrayBuffer(byteString.length);
      const int8Array: Uint8Array = new Uint8Array(arrayBuffer);
      const byteStringLength = byteString.length || 0;
      for (let i = 0; i < byteString.length; i++) {
        int8Array[i] = byteString.charCodeAt(i);
      }
      const blob = new Blob([int8Array], { type: "image/png" });
      observer.next(blob);
      observer.complete();
    });
  }

  // converting base64 string to blob object
  b64toBlob(b64Data, contentType?, sliceSize?) {
    contentType = contentType || "";
    sliceSize = sliceSize || 512;

    const byteCharacters = atob(b64Data);
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
      const slice = byteCharacters.slice(offset, offset + sliceSize);

      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }

      const byteArray = new Uint8Array(byteNumbers);

      byteArrays.push(byteArray);
    }

    const blob = new Blob(byteArrays, { type: contentType });
    return blob;
  }

  getPaddedVal(val) {
    return "0" + val;
  }

  // save screenshot into local system folder
  async external(screenShotRequested?) {
    await externalFunction();
    setTimeout(() => {
      this.base64data = JSON.parse(localStorage.getItem("imgUrl"))
        .split(",")
        .reverse()[0];

      const imageBlob: Blob = this.b64toBlob(this.base64data, "image/png");
      const imageName: string = `${JSON.parse(localStorage.getItem("currentUser")).name
        }-${moment().format("DD-MM-yyyy-HH-mm-ss")}`;
      const imageFile: File = new File([imageBlob], imageName, {
        type: "image/png",
      });

      const formData = new FormData();
      formData.append(
        "userId",
        JSON.parse(localStorage.getItem("currentUser"))._id
      );
      formData.append(
        "time",
        `${String(this.hours).length === 1
          ? this.getPaddedVal(this.hours)
          : this.hours
        }-${String(this.minutes).length === 1
          ? this.getPaddedVal(this.minutes)
          : this.minutes
        }-${String(this.seconds).length === 1
          ? this.getPaddedVal(this.seconds)
          : this.seconds
        }`
      );
      formData.append("uploadFile", imageFile);
      console.log("external Image file ======>", imageFile);
      console.log("formdata before uploading:", formData);

      /*Check if screen is requested of not*/
      console.log("screenShotRequested ===>", screenShotRequested);
      if (screenShotRequested || navigator.onLine) {
        this._userService.sendScreenShot({
          imageFile: this.base64data,
          imageName,
          id: this.userInfo._id,
        });
      } else {
        /**
         * if not it will store screenshots into local system folder
         */
        this.fs.writeFile(
          this.imageFilesPath + imageName + ".png",
          this.base64data,
          "base64",
          (err) => {
            if (err) {
              return console.error(err);
            } else {
              console.log("file saved to ", this.imageFilesPath + imageName);
              this.syncData("image", this.imageFilesPath + imageName + ".png");
            }
            clearTimeout(this.timeout);
          }
        );
      }
    }, 2000);
  }

  // async logout() {
  //   this._userService.disconnetSocket();
  //   Swal.fire({
  //     title: "Are you sure?",
  //     text: "This will stop your timmer!",
  //     icon: "warning",
  //     showCancelButton: true,
  //     confirmButtonColor: "#3085d6",
  //     cancelButtonColor: "#d33",
  //     confirmButtonText: "Yes, logout!",
  //   }).then(async (result) => {
  //     if (result.isConfirmed) {
  //       if (
  //         navigator.onLine &&
  //         localStorage.getItem("isLatestVersion") == "false"
  //       ) {
  //         await this.checkStatus("stopLogout");
  //         await this.stop();

  //         setTimeout(() => {
  //           this.updateData();
  //         }, 1000);
  //         let mydiff = localStorage.getItem("diff");
  //         await localStorage.clear();
  //         localStorage.setItem("diff", mydiff);
  //         this.router.navigate(["login"]);
  //       } else if (
  //         navigator.onLine &&
  //         localStorage.getItem("isLatestVersion") == "true"
  //       ) {
  //         await this.checkStatus("logout");
  //         // await localStorage.removeItem('currentUser');
  //         let mydiff = localStorage.getItem("diff");
  //         await localStorage.clear();
  //         localStorage.setItem("diff", mydiff);
  //         this.router.navigate(["login"]);
  //       } else {
  //         Swal.fire(
  //           "The Internet?",
  //           "Please check your internet connection?",
  //           "question"
  //         );
  //       }
  //     }
  //   });
  // }

  // timer each second it will update time
  timer() {
    this.timeOutId = setTimeout(() => {
      if (!this.timeOutFlag) {
        this.syncData(
          "start",
          moment().utcOffset("+05:30").format("h:mm:ss a")
        );
        this.timeOutFlag = true;
      }
      this.updateTime();
      this.timer();
    }, 1000);
  }

  // read file and convert image file to base64 format
  getBase64Image(img) {
    console.log("image in base64Image:", img);
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader();
      fileReader.readAsDataURL(img);
      fileReader.onload = () => {
        console.log("fileReader:", fileReader);
        this.base64 = fileReader.result;
        resolve(fileReader.result);
      };
      fileReader.onerror = (error) => {
        reject(error);
      };
    });
  }

  // update time
  updateTime() {
    this.seconds++;
    if (this.seconds === 60) {
      this.seconds = 0;
      this.minutes++;
    }
    if (this.minutes === 60) {
      this.minutes = 0;
      this.hours++;
    }
    this._change.detectChanges();
  }

  // stop
  async stop() {
    this.loading = true;
    this.isStart = false;
    $("#start").addClass("disable");
    await clearTimeout(this.timeOutId);
    this.running = false;
    await localStorage.setItem("isRunning", JSON.stringify(this.running));
    await this.fs.readFile(this.jsonFilePath, async (err, data) => {
      if (this.timeOutFlag) {
        await this.syncData(
          "stop",
          moment().utcOffset("+05:30").format("h:mm:ss a")
        );
        this.isStart = true;
        $("#stop").addClass("disable");
      }
      this.timeOutFlag = false;
    });

    // on stop it read json file from system path and get difference time and update it to timelog in users collection and logs collection
    await setTimeout(() => {
      this.fs.readFile(this.jsonFilePath, async (err, data) => {
        console.log(JSON.parse(data));
        if (err) {
          return false;
        } else {
          const userLogDetails = JSON.parse(data);

          /*Check for lastest version*/
          if (!userLogDetails.isLatestVersion) {
            let details = await this.appendFilesToJson(userLogDetails);
            details.append("jsonData", JSON.stringify(userLogDetails));
            details.append("userId", this.userInfo._id);

            this.loading = false;
            this.diff =
              userLogDetails.attendance[
                userLogDetails.attendance.length - 1
              ].difference;
            this.clockIn = this.getClockTime(
              userLogDetails.attendance[userLogDetails.attendance.length - 1]
                .timeLog,
              "in"
            );
            this.clockOut = this.getClockTime(
              userLogDetails.attendance[userLogDetails.attendance.length - 1]
                .timeLog,
              "out"
            );
            localStorage.setItem("diff", this.diff);

            this.hours =
              this.diff.split(":")[0] == "-" ? 0 : this.diff.split(":")[0];

            this.minutes =
              this.diff.split(":")[0] == "-" ? 0 : this.diff.split(":")[1];
            this.seconds =
              this.diff.split(":")[0] == "-" ? 0 : this.diff.split(":")[2];

            const logs = {
              date: moment().format("DD-MM-yyyy"),
              time: {
                hours: this.hours,
                minutes: this.minutes,
                seconds: this.seconds,
              },
            };
            await this._userService.uploadbase64Img(details).subscribe(
              (res) => {
                this.isFirst = false;
                return true;
              },
              (err) => {
                return false;
              }
            );
            // adding last log into localStorage it will helps to calculate difference, next stopped time
            await localStorage.setItem("logs", JSON.stringify(logs));
            console.log("at the time of stop", logs);
            await this._userService.storeLogs(logs).subscribe(
              (res) => console.log(res),
              (err) => console.log(err)
            );
            // await this.getLogs();
            this.loading = false;
            console.log("loading false");
            this.isStart = true;
            $("#start").removeClass("disable");
            console.log("loading", this.loading);
          }
        }
      });
    }, 2000);

    await clearInterval(this.intervalId);
  }

  async start() {
    console.log("start, !this.running ==>", !this.running);
    // on click to start enable button and start timer and screenshots capturing
    if (!this.running) {
      this.timer();
      this.isStart = false;
      $("#start").addClass("disable");
      $("#stop").removeClass("disable");
      this.running = true;
      localStorage.setItem("isRunning", JSON.stringify(this.running));

      // No need to remove this
      this.startCapturing();
    }

    // on start, after 2 second, read json file
    await setTimeout(() => {
      this.fs.readFile(this.jsonFilePath, async (err, data) => {
        // console.log("file Read Data", data);
        // console.log(JSON.parse(data));
        if (err) {
          console.log("error in finding file form device", err);
          return false;
        } else {
          console.log("Data From Local File", JSON.parse(data));
          const userLogDetails = JSON.parse(data);

          /*Check for lastest version*/
          if (!userLogDetails.isLatestVersion) {
            let details = await this.appendFilesToJson(userLogDetails);
            details.append("jsonData", JSON.stringify(userLogDetails));
            details.append("userId", this.userInfo._id);
            console.log(userLogDetails, details);
            await this._userService.uploadbase64Img(details).subscribe(
              (res) => {
                console.log("the res is the ==========>", res);
                // this.syncData('image', res.files[0]);
                this.isFirst = false;
                this.getLogs();
                return true;
              },
              (err) => {
                return false;
                console.log("the err is the ==========>", err);
              }
            );
          }
        }
      });
    }, 2000);
    if (this.clockIn === "00:00:00") {
      const clocktime = moment().utcOffset("+05:30");
      this.clockIn = this.getClockin(clocktime.add(1, 'second').format("h:mm:ss A"));
    }
  }

  // on logout clear global variable default to 0
  clear() {
    this.seconds = 0;
    this.minutes = 0;
    this.hours = 0;
    this.running = false;
    localStorage.setItem("isRunning", JSON.stringify(this.running));
    clearInterval(this.intervalId);
  }

  /**
   * on start and stop syncData calls
   */
  async syncData(flag, logTime?) {
    if (this.fs.existsSync(this.jsonFilePath)) {
      await this.fs.readFile(this.jsonFilePath, async (err, data) => {
        // console.log("data====>", data);
        if (err) console.log("error", err);
        else {
          this.userLogDetails = JSON.parse(data);
          let lastAttendanceLog =
            JSON.parse(data).attendance[JSON.parse(data).attendance.length - 1];

          // if user timelog doesn't match with current log or not time log of current day, set default values
          if (
            !lastAttendanceLog ||
            lastAttendanceLog.date != this.currentDate
          ) {
            this.userLogDetails.attendance.push({
              date: this.currentDate,
              timeLog: [],
              difference: "-",
              inActivityTime: 0,
              images: [],
            });
          }
          await this.updateRecordFile(flag, this.userLogDetails, logTime);
          return;
        }
      });
    } else {
      return;
    }
  }

  async updateRecordFile(flag, userLogDetails, logTime?) {
    let lastAttendanceLog =
      userLogDetails.attendance[userLogDetails.attendance.length - 1];
    const previousInActivityTime = lastAttendanceLog.inActivityTime;
    switch (flag) {
      case "start":
        console.log("start switch");
        let timeLogObject: any = {};
        timeLogObject = {
          in: logTime,
          out: "-",
        };
        lastAttendanceLog.timeLog.push(timeLogObject);
        await this.fs.writeFileSync(
          this.jsonFilePath,
          JSON.stringify(userLogDetails)
        );
        break;

      case "stop":
        let lastTimeLogObject =
          lastAttendanceLog.timeLog[lastAttendanceLog.timeLog.length - 1];
        lastTimeLogObject.out = logTime;
        lastAttendanceLog = await this.calculateDifference(lastAttendanceLog);
        await this.fs.writeFileSync(
          this.jsonFilePath,
          JSON.stringify(userLogDetails)
        );
        break;

      case "image":
        lastAttendanceLog.images.push({ path: logTime });
        await this.fs.writeFileSync(
          this.jsonFilePath,
          JSON.stringify(userLogDetails)
        );
        break;
      case "resumeTime":
        await this.fs.writeFileSync(
          this.jsonFilePath,
          JSON.stringify(userLogDetails)
        );
        break;
      default:
        await this.fs.writeFileSync(
          this.jsonFilePath,
          JSON.stringify(userLogDetails)
        );
        break;
    }
    userLogDetails.isLatestVersion = false;
    localStorage.setItem("isLatestVersion", "false");
    return;
  }

  calculateDifference(currentAttendanceLog) {
    let seconds = 0;
    let diffSecondTotal = 0;
    currentAttendanceLog.timeLog.forEach((log) => {
      if (log.out == "-") {
        return;
      } else {
        let startTime = moment(log.in, "hh:mm:ss a");
        let endTime = moment(log.out, "hh:mm:ss a");
        let diffSeconds = endTime.diff(startTime, "seconds");
        diffSecondTotal = diffSecondTotal + diffSeconds;
      }
    });

    seconds = Number(diffSecondTotal);
    let h = Math.floor(seconds / 3600);
    let m = Math.floor((seconds % 3600) / 60);
    let s = Math.floor((seconds % 3600) % 60);

    let time =
      ("0" + h).slice(-2) +
      ":" +
      ("0" + m).slice(-2) +
      ":" +
      ("0" + s).slice(-2);

    currentAttendanceLog.difference = time;
    currentAttendanceLog.status = "Absent";
    return currentAttendanceLog;
  }

  /*API call*/
  /*Update data to database*/
  updateData() {
    /*Fetch json file*/
    this.fs.readFile(this.jsonFilePath, async (err, data) => {
      if (err) {
        return false;
      } else {
        const userLogDetails = JSON.parse(data);
        if (!userLogDetails.isLatestVersion) {
          let formData = new FormData();
          let details = await this.appendFilesToJson(userLogDetails);
          details.append("jsonData", JSON.stringify(userLogDetails));
          details.append("userId", this.userInfo._id);
          await this._userService.uploadbase64Img(details).subscribe(
            (res) => {
              this.removeDataFromJsonFile(res);
              this.isFirst = false;
              return true;
            },
            (err) => {
              return false;
            }
          );
        }
      }
    });
  }

  appendFilesToJson(userLogDetails) {
    const formData = new FormData();
    this.userLogDetails = JSON.parse(localStorage.getItem("currentUser"));
    _.forEach(
      userLogDetails.attendance[userLogDetails.attendance.length - 1],
      (singleAttendance, logIndex) => {
        _.forEach(singleAttendance.images, async (singleImage, imageIndex) => {
          const contents = this.fs.readFileSync(singleImage.path, {
            encoding: "base64",
          });

          const imageBlob: Blob = await this.b64toBlob(contents, "image/png");
          let imageName = singleImage.path.split("/");
          imageName = imageName[imageName.length - 1];
          const imageFile: File = new File([imageBlob], imageName, {
            type: "image/png",
          });
          formData.append("uploads", imageFile, imageName);
          singleImage.path = userLogDetails._id + "/" + imageName;
        });
      }
    );
    formData.append("userLogDetails", JSON.stringify(userLogDetails));
    return formData;
  }

  /*Check online offline status of user*/
  checkStatus(status) {
    const object = {
      status,
      user: this.userInfo._id,
      userName: this.userInfo.name,
    };
    this._userService.changeStatus(object);
  }

  removeDataFromJsonFile(res) {
    this.fs.readFile(this.jsonFilePath, async (err, data) => {
      const userLogDetails = JSON.parse(data);
      userLogDetails.attendance = [];
      userLogDetails.versionId = res.versionId;
      userLogDetails["isLatestVersion"] = true;
      localStorage.setItem("isLatestVersion", "true");
      this.fs.writeFileSync(this.jsonFilePath, JSON.stringify(userLogDetails));
    });

    const files = this.fs.readdirSync(this.imageFilesPath);

    if (files.length > 0) {
      files.forEach((filename) => {
        this.fs.unlinkSync(this.imageFilesPath + "/" + filename);
      });
    }
  }

  ch(e) { }

  getClockTime(clockinData, status): any {
    const timeFormat = /^(\d{1,2}):(\d{2}):(\d{2})\s?(am|pm)$/i;
    if (status == "in") {
      if (clockinData.length > 0) {
        if (clockinData[0].in != "-") {
          const [, hour1, minute1, second1, meridiem1] =
            clockinData[0].in.match(timeFormat) as string[];
          const hourValue =
            meridiem1.toLowerCase() === "pm"
              ? hour1 === "12"
                ? 12
                : parseInt(hour1, 10) + 12
              : parseInt(hour1, 10);
          const formattedTime = `${this.padZero(hourValue)}:${this.padZero(
            parseInt(minute1)
          )}:${this.padZero(parseInt(second1))}`;
          return formattedTime;
          //return clockinData[0].in.slice(0, clockinData[0].in.indexOf(' '));
        } else {
          return clockinData[0].in;
        }
      }
    } else {
      if (clockinData.length > 0) {
        if (clockinData[clockinData.length - 1].out != "-") {
          const [, hour1, minute1, second1, meridiem1] = clockinData[
            clockinData.length - 1
          ].out.match(timeFormat) as string[];
          const hourValue =
            meridiem1.toLowerCase() === "pm"
              ? hour1 === "12"
                ? 12
                : parseInt(hour1, 10) + 12
              : parseInt(hour1, 10);
          const formattedTime = `${this.padZero(hourValue)}:${this.padZero(
            parseInt(minute1)
          )}:${this.padZero(parseInt(second1))}`;
          return formattedTime;
          // return clockinData[clockinData.length-1].out.slice(0, clockinData[clockinData.length-1].out.indexOf(' '));
        } else {
          return clockinData[clockinData.length - 1].out;
        }
      }
    }
  }

  getClockin(clockdata) {
    const timeFormat = /^(\d{1,2}):(\d{2}):(\d{2})\s?(am|pm)$/i;
    const [, hour1, minute1, second1, meridiem1] =
      clockdata.match(timeFormat) as string[];
    const hourValue =
      meridiem1.toLowerCase() === "pm"
        ? hour1 === "12"
          ? 12
          : parseInt(hour1, 10) + 12
        : parseInt(hour1, 10);
    const formattedTime = `${this.padZero(hourValue)}:${this.padZero(
      parseInt(minute1)
    )}:${this.padZero(parseInt(second1))}`;
    return formattedTime;
  }
  padZero(num: number): string {
    return num < 10 ? `0${num}` : `${num}`;
  }
}
