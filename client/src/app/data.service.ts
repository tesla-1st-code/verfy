import { Injectable } from '@angular/core';
import { ProgressHttp } from 'angular-progress-http';
import { Headers, RequestOptions, URLSearchParams, Http } from '@angular/http';
import { SharedService } from './shared.service';
import { map, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DataService {
    private _serverUrl: string;

    constructor(private _http: ProgressHttp, private _sharedService: SharedService) { 
        this._sharedService.getConfig(false).subscribe(config => {
            this._serverUrl = config.serverUrl;
        });
    }

    get(id: number, controller: string, service: string, downloadListener?, uploadListener?) {
        let req: Http = this._http;
      
        if (downloadListener)
          req = this._http.withDownloadProgressListener(downloadListener);
        if (uploadListener)
          req = this._http.withUploadProgressListener(uploadListener);

        let requestOptions = this.createRequestOptions();
        let url = this._serverUrl + '/' + controller + '/' + service + '/get?id=' + id;
        let request = req.request(url, requestOptions);

        return request.pipe(
            map(res => res.json()),
            catchError(this.handleError)
        );
    }

    getAll(query: any, controller: string, service: string, downloadListener?, uploadListener?) {
        let req: Http = this._http;
      
        if (downloadListener)
          req = this._http.withDownloadProgressListener(downloadListener);
        if (uploadListener)
          req = this._http.withUploadProgressListener(uploadListener);

        let requestOptions = this.createRequestOptions();
        let url = this._serverUrl + '/' + controller + '/' + service + '?query=' + JSON.stringify(query);
        let request = req.request(url, requestOptions);

        return request.pipe(
            map(res => res.json()),
            catchError(this.handleError)
        );
    }

    save(data: any, controller: string, service: string) {
        let req: Http = this._http;
        let requestOptions = this.createRequestOptions();
        let url = this._serverUrl + '/' + controller + '/' + service;
        
        requestOptions.method = 'POST';
        requestOptions.body = JSON.stringify(data);

        let request = req.request(url, requestOptions);

        return request.pipe(
            map(res => res.json()),
            catchError(this.handleError)
        );
    }

    private createRequestOptions(): RequestOptions {
        let result = new RequestOptions();
        let headers = new Headers({ 'Content-Type': 'application/json; charset=utf-8' });

        result.headers = headers;

        return result;
    }

    private handleError(error: Response) {
        return throwError(error);
    }
}