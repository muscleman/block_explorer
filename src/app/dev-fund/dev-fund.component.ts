import { Component, OnDestroy, OnInit } from '@angular/core'
import { HttpService } from 'app/http.service'
import { SubscriptionTracker } from 'app/subscription-tracker/subscription-tracker'

@Component({
    selector: 'app-dev-fund',
    templateUrl: './dev-fund.component.html',
    styleUrls: ['./dev-fund.component.scss']
})
export class DevFundComponent
    extends SubscriptionTracker
    implements OnInit, OnDestroy
{
    title: string = 'Dev Fund'
    amount: number = 0
    constructor(private httpService: HttpService) {
        super()
    }

    ngOnInit(): void {
        this._track(
            this.httpService.subscribeVisibilityInfo().subscribe((data) => {
                this.amount = data.balance
            })
        )
    }

    ngOnDestroy(): void {
        super.ngOnDestroy()
    }
}
