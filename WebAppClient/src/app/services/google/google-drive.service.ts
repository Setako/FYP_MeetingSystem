import {Injectable} from '@angular/core';
import {oauth2_v2, google, drive_v3 as drive, drive_v3} from 'googleapis';
import Oauth2 = oauth2_v2.Oauth2;
import {GoogleOauthService} from './google-oauth.service';
import {query} from '@angular/animations';
import {Observable} from 'rxjs';
import Params$Resource$Files$List = drive_v3.Params$Resource$Files$List;
import Schema$FileList = drive_v3.Schema$FileList;
import {tap} from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class GoogleDriveService {

  constructor(private googleOauthService: GoogleOauthService) {
  }

  private static readonly DRIVE_VERSION = 'v3';

  public static getDrive(auth): drive.Drive {
    return google.drive({version: GoogleDriveService.DRIVE_VERSION, auth: auth});
  }

}

export enum DriveMimeType {
  Audio = 'application/vnd.google-apps.audio',
  Document = 'application/vnd.google-apps.document',
  Drawing = 'application/vnd.google-apps.drawing',
  File = 'application/vnd.google-apps.file',
  Folder = 'application/vnd.google-apps.folder',
  Form = 'application/vnd.google-apps.form',
  Fusiontable = 'application/vnd.google-apps.fusiontable',
  Map = 'application/vnd.google-apps.map',
  Photo = 'application/vnd.google-apps.photo',
  Presentation = 'application/vnd.google-apps.presentation',
  Script = 'application/vnd.google-apps.script',
  Site = 'application/vnd.google-apps.site',
  Spreadsheet = 'application/vnd.google-apps.spreadsheet',
  Unknown = 'application/vnd.google-apps.unknown',
  Video = 'application/vnd.google-apps.video',
  Sdk = 'application/vnd.google-apps.drive-sdk'
}

export class DriveFileListQueryBuilder {
  private _allowedMimeTypes = [];
  private _allowedParentFolders = [];

  public addMimeTypes(...mimeTypes: DriveMimeType[]) {
    this._allowedMimeTypes = this._allowedMimeTypes.concat(mimeTypes);
  }

  get allowedMimeTypes(): any[] {
    return this._allowedMimeTypes;
  }

  public addAllowedParentFolders(...folders: string[]) {
    this._allowedParentFolders = this._allowedParentFolders.concat(folders);
  }

  get allowedParentFolders(): any[] {
    return this._allowedParentFolders;
  }
}

export class DriveFileList {
  private driveEntity: drive.Drive;
  private queryStr: string;

  private pageToken: string;
  private googleOauth: GoogleOauthService;

  constructor(googleOauth: GoogleOauthService, builder: DriveFileListQueryBuilder) {
    // builder.allowedMimeTypes;
    this.googleOauth = googleOauth;


    const queries: string[] = [];
    if (builder.allowedMimeTypes.length !== 0) {
      queries.push(builder.allowedMimeTypes.map(mimeType => `mimeType = '${mimeType}'`).join(' or '));
    }

    if (builder.allowedParentFolders.length !== 0) {
      queries.push(builder.allowedParentFolders.map(folder => `${folder} in parents`).join(' or '));
    }

    this.queryStr = queries.map(q => ` (${q}) `).join('and');
  }

  public next(pageSize = 1000): Observable<Schema$FileList> {
    return this.googleOauth.doRequest<Schema$FileList>(
      client => {
        return Observable.create(observer => {
          GoogleDriveService.getDrive(client).files.list(
            this.getParams(), (err, res) => {
              if (err) {
                observer.error(err);
              } else {
                observer.next(res);
              }
              observer.complete();
            }
          );
        });
      })
      .pipe(
        tap(res => this.pageToken = res.nextPageToken)
      );
  }

  private getParams(): Params$Resource$Files$List {
    const params: Params$Resource$Files$List = {
      pageSize: 1000,
      q: this.queryStr
    };
    if (this.pageToken != null) {
      params.pageToken = this.pageToken;
    }
    return params;
  }

  public resetPageToken() {
    this.pageToken = null;
  }

}
