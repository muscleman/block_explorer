import {
    Component,
    ViewEncapsulation,
    OnInit,
    Output,
    EventEmitter,
    OnDestroy
} from '@angular/core'
import { HttpService } from '../http.service'
import { ActivatedRoute } from '@angular/router'
import { SubscriptionTracker } from 'app/subscription-tracker/subscription-tracker'
import { take } from 'rxjs/operators'

@Component({
    selector: 'app-main-info',
    templateUrl: './main-info.component.html',
    styleUrls: ['./main-info.component.scss'],
    encapsulation: ViewEncapsulation.None,
    providers: []
})
export class MainInfoComponent
    extends SubscriptionTracker
    implements OnInit, OnDestroy
{
    info: any
    @Output() letGetInfo = new EventEmitter()
    height: number
    posDifficulty: number
    powDifficulty: number
    totalCoins: number
    NetworkHashrate: number
    txCount: number

    constructor(
        private httpService: HttpService,
        private route: ActivatedRoute
    ) {
        super()
    }

    getInfoPrepare(data) {
        this.info = data
        if (this.info) {
            this.height = this.info.height
            this.posDifficulty = this.info.pos_difficulty
            this.powDifficulty = this.info.pow_difficulty
            this.totalCoins = this.info.total_coins
            this.txCount = this.info.tx_count
            this.NetworkHashrate = this.info.current_network_hashrate_350
        }
    }

    ngOnInit() {
        this.getInfoPrepare(this.route.snapshot.data['MainInfo'])
        this.httpService
            .subscribeInfo()
            .pipe(take(1))
            .subscribe(
                (data) => {
                    this.getInfoPrepare(data)
                },
                (err) => {
                    console.log(err)
                },
                () => {
                    this.letGetInfo.emit(this.info)
                }
            )
    }

    ngOnDestroy() {
        super.ngOnDestroy()
    }
}
