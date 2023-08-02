import { Component, OnInit } from '@angular/core';
import { ProjectService } from '../../services/project.service';
import { ipcRenderer } from 'electron';
declare var M: any;

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  ishome = true;
  constructor(private _projectService: ProjectService) {
    //  this.ishome = _projectService.ishomeComponent;
    this._projectService.ishomeComponent.subscribe((value) => {
      this.ishome = value.data;
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



  }

  ngOnInit() {
  }

}
