import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { Location } from "@angular/common";
import { UserService } from "../services/user.service";

@Component({
  selector: "app-logout",
  templateUrl: "./logout.component.html",
  styleUrls: ["./logout.component.scss"],
})
export class LogoutComponent implements OnInit {
  userInfo = JSON.parse(localStorage.getItem("currentUser"));

  constructor(
    private location: Location,
    private router: Router,
    public _userService: UserService
  ) {}
  goBack() {
    console.log("click cancel");
    this.location.back();
  }
  gologin() {
    console.log("clicked logout");
    localStorage.clear();
    this.checkStatus("stopLogout");
    this.router.navigateByUrl("/login");
  }

  ngOnInit() {}

  checkStatus(status) {
    const object = {
      status,
      user: this.userInfo._id,
      userName: this.userInfo.name,
    };
    this._userService.changeStatus(object);
  }
}
