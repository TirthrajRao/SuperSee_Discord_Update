import { Component, OnInit } from '@angular/core';
import { UserService } from './services/user.service';
import { Router } from '@angular/router';
import { app, ipcRenderer } from "electron";
// import { version } from './../../';
declare var M: any;

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"],
})
export class AppComponent implements OnInit {
  title = "Supersee";
  intervalId: any;
  userInfo = JSON.parse(localStorage.getItem("currentUser"));
  version: any
  constructor(public _userService: UserService, public router: Router) {
    console.log("called");

    ipcRenderer.on("app_version", async (event, version) => {
      try {
        this.version = version;
      } catch (e) {
        console.log(e);
      }
    });


    ipcRenderer.on("checking_for_update", async (event, sourceId) => {
      try {
        console.log("checking_for_update")
        M.toast({ html: 'Checking for update!', classes: 'rounded' });
      } catch (e) {
        console.log(e);
      }
    });

    ipcRenderer.on("update-available", async (event, sourceId) => {
      try {
        console.log("update-available")
        M.toast({ html: 'Update Available!', classes: 'rounded' });
      } catch (e) {
        console.log(e);
      }
    });

    ipcRenderer.on("update_not_available", async (event, sourceId) => {
      try {
        console.log("update_not_available")
        M.toast({ html: 'Update Not Available!', classes: 'rounded' });
      } catch (e) {
        console.log(e);
      }
    });

    ipcRenderer.on("download_progress", async (event, sourceId) => {
      try {
        M.toast({ html: 'Download Progress!', classes: 'rounded' });
        console.log("download_progress", sourceId)
      } catch (e) {
        console.log(e);
      }
    });

    ipcRenderer.on("update_downloaded", async (event, sourceId) => {
      try {
        M.toast({ html: 'Update Downloaded Application will restart!', classes: 'rounded' });
        console.log("update_downloaded")
      } catch (e) {
        console.log(e);
      }
    });

    ipcRenderer.on("error_in_update", async (event, sourceId) => {
      try {
        M.toast({ html: 'Error in update!', classes: 'rounded' });
        console.log("error_in_update", sourceId)
      } catch (e) {
        console.log(e);
      }
    });



    // this.version = app.getVersion;
    if (this.userInfo) {
      this.router.navigate(["/dashboard"]);
    } else {
      this.router.navigate(["/login"]);
    }
  }

  ngOnInit() { }

  closeWindow() {
    alert("close");
  }
}
