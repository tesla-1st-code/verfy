import { Injectable } from '@angular/core';
import { ReplaySubject, Observable } from 'rxjs';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SharedService {

  private _config$: ReplaySubject<any>

    constructor() { }

    getConfig(refresh: boolean): Observable<any> {        
        if (!this._config$ || refresh) {
            if (!this._config$)
                this._config$ = new ReplaySubject(1);      
            this._config$.next(environment);
        }
        return this._config$;
    }
}