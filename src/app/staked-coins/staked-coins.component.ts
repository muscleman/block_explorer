import { Component, OnDestroy, OnInit } from '@angular/core'
import { HttpService } from 'app/http.service'
import { SubscriptionTracker } from 'app/subscription-tracker/subscription-tracker'

@Component({
    selector: 'app-staked-coins',
    templateUrl: './staked-coins.component.html',
    styleUrls: ['./staked-coins.component.scss']
})
export class StakedCoinsComponent
    extends SubscriptionTracker
    implements OnInit, OnDestroy
{
    title: string = 'Staked Coins (est)'
    amount: number = 0
    percentage: number = 0
    constructor(private httpService: HttpService) {
        super()
    }

    ngOnInit(): void {
        this._track(
            this.httpService.subscribeVisibilityInfo().subscribe((data) => {
                this.amount = data.amount
                this.percentage = data.percentage
            })
        )
    }

    ngOnDestroy(): void {
        super.ngOnDestroy()
    }
}
