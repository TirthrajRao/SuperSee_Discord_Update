import { Component, OnInit } from '@angular/core';
import { ProjectService } from '../../services/project.service';

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
  }

  ngOnInit() {
  }

}
