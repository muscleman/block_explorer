import { Injectable } from '@angular/core'
import { Socket } from 'ngx-socket-io'
import { Store } from '@ngxs/store'
import { DaemonInfos } from 'app/actions/get-info.actions'
import { VisibilityInfos } from 'app/actions/get-visibility-info.actions'

@Injectable({
    providedIn: 'root'
})
export class WebSocketService {
    constructor(private socket: Socket, private store: Store) {}

    init(): void {
        this.socket.on('get_info', (data) => {
            this.store.dispatch(new DaemonInfos.Add(JSON.parse(data)))
        })
        this.socket.on('get_visibility_info', (data) => {
            this.store.dispatch(new VisibilityInfos.Add(JSON.parse(data)))
        })
    }
}
