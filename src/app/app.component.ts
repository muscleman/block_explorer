import { Component, OnInit, OnDestroy } from '@angular/core'
import { Router, Event, NavigationEnd } from '@angular/router'
import { MobileNavState } from './services/http.service'
import { WebSocketService } from './services/web-socket.service'
import { SubscriptionTracker } from './subscription-tracker/subscription-tracker'
import { Store } from '@ngxs/store'
import { DaemonInfos } from './actions/get-info.actions'

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    providers: []
})
export class AppComponent
    extends SubscriptionTracker
    implements OnInit, OnDestroy
{
    navIsOpen: boolean

    constructor(
        private router: Router,
        private mobileNavState: MobileNavState,
        private webSocketService: WebSocketService,
        private store: Store
    ) {
        super()
        this.store.dispatch(new DaemonInfos.Get())
        this.webSocketService.init()
        this.navIsOpen = true
        this.router.events.subscribe((event: Event) => {
            if (event instanceof NavigationEnd) {
                if (this.navIsOpen === true) {
                    this.mobileNavState.toggleMenu()
                }
            }
        })
    }

    ngOnInit() {
        this.mobileNavState.change.subscribe((navIsOpen) => {
            this.navIsOpen = navIsOpen
        })
    }
    btnToggleMenu() {
        this.mobileNavState.toggleMenu()
    }

    ngOnDestroy() {
        super.ngOnDestroy()
    }
}
