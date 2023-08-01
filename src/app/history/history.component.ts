import {
  Component,
  OnInit,
} from "@angular/core";
import * as moment from "moment";
import { remote } from "electron";
import { DatePipe } from "@angular/common";
import { ProjectService } from "../services/project.service";
const fsystem = require("fs");
declare var M: any;

declare var $: any;
@Component({
  selector: "app-history",
  templateUrl: "./history.component.html",
  styleUrls: ["./history.component.scss"],
  providers: [DatePipe],
})
export class HistoryComponent implements OnInit {
  userInfo = JSON.parse(localStorage.getItem("currentUser"));
  currentDate: any = new Date().toISOString().split("T")[0] + "T18:30:00.000Z";
  modalDate;
  modelinstance;
  modalWorkingHours;
  modalTimelog;
  currentTime: any = moment().utcOffset("+05:30").format("h:mm:ss a");
  currentDay: any = moment().format("dddd, MMM D, YYYY");
  jsonFilePath: any;
  fs: any;
  logsArr = [];
  filteredArr = [];
  loading = false;
  startDate;
  endDate;
  constructor(private datePipe: DatePipe, private _projectService: ProjectService) {

    this.fs = (window as any).fs;

    this.jsonFilePath =
      remote.app.getPath("userData") + "/" + this.userInfo._id + ".json";
    console.log(this.jsonFilePath, "jsonFilePath");
    this.loading = true;
    this.fs.readFile(this.jsonFilePath, async (err, data) => {
      if (err) {
        this.loading = false;
        return false;
      } else {
        console.log(JSON.parse(data));
        const userLogDetails = JSON.parse(data);
        console.log(userLogDetails.attendance, "dataa");
        this.logsArr = userLogDetails.attendance;
        this.filteredArr = userLogDetails.attendance;
        for (let i = 0; i < userLogDetails.attendance.length; i++) {
          console.log(userLogDetails.attendance[i]);
          let originaldate = userLogDetails.attendance[i].date;
          let convetedDate = this.convertDate(originaldate);
          let clockintime = this.getClockTime(
            userLogDetails.attendance[i].timeLog,
            "in"
          );
          let clockout = this.getClockTime(
            userLogDetails.attendance[i].timeLog,
            "out"
          );
          let timeDiff = this.getBrekTime(userLogDetails.attendance[i].timeLog);
          console.log(userLogDetails.attendance[i].status, "dateeeee");
        }
        this.loading = false;
      }
    });
  }

  ngOnInit(): void {
    // $(document).ready(function () {
    //   $(".sidenav").sidenav();
    // });

  }

  ngAfterViewInit() {

    // format: 'dd/mm/yyyy',
    // min: this.startDate,
    // // max: true,
    // closeOnSelect: true,
    // closeOnClear: true,
    // }


    $(document).ready(() => {
      this.modelinstance = $("#dateInputFrom").datepicker({
        minDate: new Date(2023, 7, 1)
      }
      );
    });
    $(document).ready(() => {
      this.modelinstance = $("#dateInputTo").datepicker({
        minDate: new Date(this.currentDate)
      });
    });
  }

  convertDate(dateString: string): string {
    try {
      const dateObject = new Date(dateString);
      const utcDate = new Date(
        dateObject.getTime() + dateObject.getTimezoneOffset() * 60000
      );
      const formattedDate = this.datePipe.transform(utcDate, "MMMM dd, yyyy");

      return formattedDate;
    } catch (error) {
      console.error(error);
      return "Invalid date format";
    }
  }

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
          return "--:--:--";
        }
      } else {
        return "00:00:00";
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
          return "23:59:59";
        }
      } else {
        return "00:00:00";
      }
    }
  }

  getBrekTime(timelogArr): any {
    let totalTime = 0;
    var time_start: any = new Date();
    var time_end: any = new Date();
    const timeFormat = /^(\d{1,2}):(\d{2}):(\d{2})\s?(am|pm)$/i;

    if (timelogArr.length > 1) {
      for (let i = 0; i < timelogArr.length - 1; i++) {
        if (timelogArr[i].out != "-") {
          const [, hour1, minute1, second1, meridiem1] = timelogArr[
            i
          ].out.match(timeFormat) as string[];
          const [, hour2, minute2, second2, meridiem2] = timelogArr[
            i + 1
          ].in.match(timeFormat) as string[];

          const hourValue1 =
            meridiem1.toLowerCase() === "pm"
              ? hour1 === "12"
                ? 12
                : parseInt(hour1, 10) + 12
              : parseInt(hour1, 10);
          const hourValue2 =
            meridiem2.toLowerCase() === "pm"
              ? hour2 === "12"
                ? 12
                : parseInt(hour2, 10) + 12
              : parseInt(hour2, 10);

          const diff =
            new Date(
              0,
              0,
              0,
              hourValue2,
              parseInt(minute2, 10),
              parseInt(second2, 10)
            ).getTime() -
            new Date(
              0,
              0,
              0,
              hourValue1,
              parseInt(minute1, 10),
              parseInt(second1, 10)
            ).getTime();
          totalTime = totalTime + diff;
        }
      }
      const hoursDiff = Math.floor(totalTime / 3600000);
      const minutesDiff = Math.floor((totalTime % 3600000) / 60000);
      const secondsDiff = Math.floor((totalTime % 60000) / 1000);
      const formattedDiff = `${this.padZero(hoursDiff)}:${this.padZero(
        minutesDiff
      )}:${this.padZero(secondsDiff)}`;

      return formattedDiff;
    } else {
      return "00:00:00";
    }
  }

  findStatus(item) {
    const autoclockOut = this.getClockTime(item.timeLog, "out");
    if (item.date === this.currentDate) {
      return "Working";
    } else if (autoclockOut === "23:59:59") {
      return "Auto Out";
    } else {
      return "Present";
    }
  }
  // Helper function to add leading zero if the number is less than 10
  padZero(num: number): string {
    return num < 10 ? `0${num}` : `${num}`;
  }

  openDetailModel(item) {
    this.modalDate = this.convertDate(item.date);
    if (item.difference == "-" || item.difference == "aN:aN:aN") {
      this.modalWorkingHours = "--:--:--";
    } else {
      this.modalWorkingHours = item.difference;
    }
    this.modalTimelog = item.timeLog;
    console.log(item, "item");
    $(document).ready(function () {
      $("#history-detail").modal();
    });
  }

  onDateSelected(data: any, str) {

    if (str === 'from') {
      console.log("start")
      this.startDate = data.value;
      this.modelinstance = $("#dateInputTo").datepicker({
        minDate: new Date(this.startDate)
      });
      if (this.endDate) {
        this.filterArray();
      }
    } else {
      this.endDate = data.value;
      this.filterArray();
      console.log("end")
    }
  }
  filterArray() {
    this.logsArr = this.filteredArr;
    const SelectedStartDate = new Date(this.startDate);
    const SelectedEndDate = new Date(this.endDate);
    console.log(SelectedEndDate, SelectedStartDate, new Date(this.logsArr[0].date))
    this.logsArr = this.logsArr.filter((item) =>
      new Date(this.convertDate(item.date)).getTime() >= SelectedStartDate.getTime() && new Date(this.convertDate(item.date)).getTime() <= SelectedEndDate.getTime());
  }
}
