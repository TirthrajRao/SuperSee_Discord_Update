import {EventEmitter , Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
 ishomeComponent:EventEmitter<any> = new EventEmitter();

  constructor() { }

  updateDashboard(data){
    this.ishomeComponent.emit(data)
  }
  getTimeInSeconds(str: any) {
    let curr_time = [];
    curr_time = str.split(':');
    for (let i = 0; i < curr_time.length; i++) {
      curr_time[i] = parseInt(curr_time[i]);
    }
    let t = curr_time[0] * 60 * 60 + curr_time[1] * 60 + curr_time[2];
    // console.log("WHAT IS IN THE STR TTTTTTT", t);
    return t;
  }
}
