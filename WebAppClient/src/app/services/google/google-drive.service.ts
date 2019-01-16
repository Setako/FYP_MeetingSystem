import {Injectable} from '@angular/core';
import {oauth2_v2, google} from 'googleapis';
import Oauth2 = oauth2_v2.Oauth2;

@Injectable({
  providedIn: 'root'
})
export class GoogleDriveService {

  constructor() {

  }

  public getOauth2Object(accessToken: string) {
    const client = new google.auth.OAuth2();
    client.setCredentials({access_token: accessToken});
    return client;
  }
}
