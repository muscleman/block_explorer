import { Injectable, Output, EventEmitter, Directive } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import {
    Resolve,
    ActivatedRouteSnapshot,
    RouterStateSnapshot
} from '@angular/router'
import { Observable, Subject } from 'rxjs'
import { environment } from '../environments/environment'
import { map } from 'rxjs/operators'
import { VisibilityInfo } from './models/visibility-info'
import { Socket } from 'ngx-socket-io'

@Injectable()
export class HttpService {
    public serverApi = ''
    private Info = new Subject<any>()
    private infoObj: any
    private visibilityInfo = new Subject<VisibilityInfo>()

    constructor(protected httpClient: HttpClient, private socket: Socket) {
        this.serverApi = environment.backend
        this.socket.on('get_info', (data) => {
            this.infoObj = JSON.parse(data)
            this.Info.next(this.infoObj)
        })

        this.socket.on('get_visibility_info', (data) => {
            this.visibilityInfo.next(JSON.parse(data))
        })
    }

    subscribeVisibilityInfo() {
        return this.visibilityInfo.asObservable()
    }

    subscribeInfo() {
        return this.Info.asObservable()
    }

    getInfo(): Observable<Response> {
        if (this.infoObj === undefined) {
            const URL = `${this.serverApi}/get_info`
            return this.httpClient.get<Response>(URL).pipe(
                map((response) => {
                    this.infoObj = response
                    return this.infoObj
                })
            )
        } else {
            return this.infoObj
        }
    }

    // BlockChain Page
    public getBlockDetails(start: number, limit: number): Observable<any> {
        const URL = `${this.serverApi}/get_blocks_details/${start}/${limit}`
        return this.httpClient.get(URL)
    }

    public getMainBlockDetails(id: any): Observable<any> {
        const URL = `${this.serverApi}/get_main_block_details/${id}`
        return this.httpClient.get(URL)
    }

    public getTxPoolDetails(limit: number): Observable<any> {
        const URL = `${this.serverApi}/get_tx_pool_details/${limit}`
        return this.httpClient.get(URL)
    }

    // Alt-blocks Page
    public getAltBlocks(offset: number, count: number): Observable<any> {
        const URL = `${this.serverApi}/get_alt_blocks_details/${offset}/${count}`
        return this.httpClient.get(URL)
    }

    public getAltDetailBlock(id: any): Observable<any> {
        const URL = `${this.serverApi}/get_alt_block_details/${id}`
        return this.httpClient.get(URL)
    }

    // Transaction Page
    public getTransaction(tx_hash: any): Observable<any> {
        const URL = `${this.serverApi}/get_tx_details/${tx_hash}`
        return this.httpClient.get(URL)
    }

    public getConnectTransaction(amount, i): Observable<any> {
        const URL = `${this.serverApi}/get_out_info/${amount}/${i}`
        return this.httpClient.get(URL)
    }

    // Aliases Page
    public getAliases(
        offset: number,
        count: number,
        search: any
    ): Observable<any> {
        if (!search) {
            search = 'all'
        }
        const URL = `${this.serverApi}/get_aliases/${offset}/${count}/${search}`
        return this.httpClient.get(URL)
    }

    public searchById(search: any): Observable<any> {
        const URL = `${this.serverApi}/search_by_id/${search}`
        return this.httpClient.get(URL)
    }

    public getChart(chart: any, period: string): Observable<any> {
        const URL = `${this.serverApi}/get_chart/${chart}/${period}`
        console.log(URL)
        return this.httpClient.get<any>(URL)
    }
}

// MainInfo resolve
@Injectable()
export class ServiceResolver implements Resolve<any> {
    constructor(private service: HttpService) {}

    resolve(
        route: ActivatedRouteSnapshot,
        state: RouterStateSnapshot
    ): Observable<any> | Promise<any> | any {
        return this.service.getInfo()
    }
}

// AltBlock resolve
@Injectable()
export class ResolveAltBlock implements Resolve<any> {
    constructor(private service: HttpService) {}

    resolve(
        route: ActivatedRouteSnapshot,
        state: RouterStateSnapshot
    ): Observable<any> | Promise<any> | any {
        const id: any = route.params['id']
        return this.service.getAltDetailBlock(id)
    }
}

@Directive({ selector: '[foo]' })
@Injectable()
export class MobileNavState {
    navIsOpen = true
    @Output() change: EventEmitter<boolean> = new EventEmitter()

    toggleMenu() {
        this.navIsOpen = this.navIsOpen !== true
        this.change.emit(this.navIsOpen)
    }
}
