import { BrowserModule } from "@angular/platform-browser";
import { NgModule } from "@angular/core";
import { HttpClientModule } from "@angular/common/http";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { AppRoutingModule } from "./app-routing.module";
import { AppComponent } from "./app.component";
import { LoginComponent } from "./login/login.component";
import { HomeComponent } from "./home/home.component";
import { NumpadPipe } from "./utils/numpad.pipe";
import { SocketIoModule, SocketIoConfig } from "ngx-socket-io";
import { ServiceWorkerModule } from "@angular/service-worker";
import { AppConfig } from "../environments/environment";
import { UpdateService } from "./services/update.service";
import { config } from "./config";
import { AngularFireModule } from "@angular/fire";
import { AngularFireDatabaseModule } from "@angular/fire/database";
import { HeaderComponent } from './header/header.component';
import { HistoryComponent } from './history/history.component';
import { LogoutComponent } from './logout/logout.component';
import { ForgotPassComponent } from './forgot-pass/forgot-pass.component';
import { DashboardComponent } from './dashboard/dashboard/dashboard.component';

const configSocket: SocketIoConfig = {
  url: config["socketUrl"], //Rajkot Home
  options: {
    reconnectionAttempts: 100, // Number of reconnect attempts
    reconnectionDelay: 3000,
  },
};

@NgModule({
  declarations: [AppComponent, LoginComponent, HomeComponent, NumpadPipe, HeaderComponent, HistoryComponent, LogoutComponent, ForgotPassComponent, DashboardComponent],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    AngularFireModule.initializeApp(AppConfig.firebase),
    AngularFireDatabaseModule,
    SocketIoModule.forRoot(configSocket),
    ServiceWorkerModule.register("ngsw-worker.js", { enabled: true }),
  ],
  providers: [UpdateService],
  bootstrap: [AppComponent],
})
export class AppModule { }
