import { Component, Input, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { ProjectService } from "../services/project.service";
import { ipcRenderer } from "electron";

@Component({
  selector: "app-header",
  templateUrl: "./header.component.html",
  styleUrls: ["./header.component.scss"],
})
export class HeaderComponent implements OnInit {
  ishome = true;
  version: any;

  constructor(private router: Router, private _projectService: ProjectService) {
    ipcRenderer.on("app_version", async (event, version) => {
      try {
        this.version = version;
      } catch (e) {
        console.log(e);
      }
    });

    this._projectService.ishomeComponent.subscribe((value) => {
      this.ishome = value.data;
    });
  }
  btnClick = function () {
    console.log("clicked", this.router);
    this.router.navigateByUrl("/logout");
  };
  ngOnInit() { }
  btnAction(value) {
    if (value == 'home') {
      this._projectService.updateDashboard({ data: false });
    } else {
      this._projectService.updateDashboard({ data: true });
    }
  }
}
