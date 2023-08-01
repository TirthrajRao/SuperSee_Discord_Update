import { Injectable } from '@angular/core';
import { AngularFireList, AngularFireDatabase } from '@angular/fire/database';
class User {
  id: string;
  email: string;
  ssRequest: boolean;
  scRequestStart: boolean;
  scRequestStop: boolean;
}
@Injectable({
  providedIn: 'root'
})
export class FirebaseDatabaseService {

  private dbPath = '/users';

  usersRef: AngularFireList<User> = null;

  constructor(private db: AngularFireDatabase) {
    this.usersRef = db.list(this.dbPath);
  }

  getAll(): AngularFireList<User> {
    return this.usersRef;
  }

  create(user: User): any {
    return this.db.database.ref(this.dbPath).child(user.id).set(user)
    // return this.usersRef.push(user);
  }

  update(key: string, value: any): Promise<void> {
    return this.usersRef.update(key, value);
  }

  delete(key: string): Promise<void> {
    return this.usersRef.remove(key);
  }

  deleteAll(): Promise<void> {
    return this.usersRef.remove();
  }
}
