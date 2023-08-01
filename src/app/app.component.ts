import { Component, OnInit } from '@angular/core';
import { UserService } from './services/user.service';
import { Router } from '@angular/router';
import { app, ipcRenderer } from "electron";
// import { version } from './../../';

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
