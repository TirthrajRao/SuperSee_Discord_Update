import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";

// components //
import { AppComponent } from "./app.component";
import { LoginComponent } from "./login/login.component";
import { HomeComponent } from "./home/home.component";
import { LogoutComponent } from "./logout/logout.component";
import { ForgotPassComponent } from "./forgot-pass/forgot-pass.component";
import { HistoryComponent } from "./history/history.component";
import { HeaderComponent } from "./header/header.component";
import { DashboardComponent } from "./dashboard/dashboard/dashboard.component";

const routes: Routes = [
  {
    path: "app",
    component: AppComponent,
  },
  {
    path: "login",
    component: LoginComponent,
  },
  {
    path: "home",
    component: HomeComponent,
  },
  {
    path: "logout",
    component: LogoutComponent,
  },
  {
    path: "forgotpassword",
    component: ForgotPassComponent,
  },
  {
    path: "history",
    component: HistoryComponent,
  },
  {
    path: "dashboard",
    component: DashboardComponent,
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
