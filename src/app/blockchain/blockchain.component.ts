import { Component, OnInit, OnDestroy } from '@angular/core'
import { MobileNavState } from '../services/http.service'
import { ActivatedRoute } from '@angular/router'
import { SubscriptionTracker } from '../subscription-tracker/subscription-tracker'
import { CookieService } from 'ngx-cookie-service'
import { Select, Store } from '@ngxs/store'
import { InfoState } from '../states/info-state'
import { Observable } from 'rxjs'
import { environment } from 'environments/environment'
import { GetInfo } from 'app/models/get-info'
import { Transaction_Pool } from 'app/models/transaction_pool'
import { TransactionPoolState } from 'app/states/transaction-pool-state'
import { TransactionPoolInfos } from 'app/actions/get-transaction-pool-info.actions'
import { BlockDetailsState } from 'app/states/block-details-state'
import { BlockDetail } from 'app/models/block_detail'
import { BlockDetails } from 'app/actions/get-block-details.actions'

@Component({
    selector: 'app-blockchain',
    templateUrl: './blockchain.component.html',
    styleUrls: ['./blockchain.component.scss'],
    providers: []
})
export class BlockchainComponent
    extends SubscriptionTracker
    implements OnInit, OnDestroy
{
    info: GetInfo
    daemon_network_state: any
    setLimit: any
    limit: any
    currentPage: number
    goToBlock: number
    setBlock: number
    // maxViewedBlockHeight: number
    // maxViewedPoolTimestamp: number
    poolsOn: boolean
    poolLimit: number
    setBlockValid: boolean
    listBlockStart: number
    maxCountBlock: number
    txCount: number
    setPoolLimit: number = environment.transactionPoolLimit
    lastSendBlockDetail = {
        start: 0,
        limit: 0
    }
    loader: boolean
    navIsOpen: boolean
    searchIsOpen: boolean = false
    transactionCount: number = 0
    blockCount: number = 0

    @Select(InfoState.selectDaemonInfo) getInfo$: Observable<GetInfo[]>
    @Select(TransactionPoolState.selectLimitedTransactionPoolInfo) getLimitedTransactionPoolInfo$: Observable<Transaction_Pool[]>
    @Select(BlockDetailsState.selectRangeOfBlockDetails) selectRangeOfBlockDetails$: Observable<BlockDetail[]>

    onIsVisible($event): void {
        this.searchIsOpen = $event
    }

    constructor(
        private route: ActivatedRoute,
        private cookieService: CookieService,
        private mobileNavState: MobileNavState,
        private store: Store
    ) {
        super()
        this.daemon_network_state = {
            0: 'Offline',
            1: 'Synchronizing',
            2: 'Online',
            3: 'Loading core',
            4: 'System error',
            5: 'Completing work'
        }
        this.maxCountBlock = 1000
        this.poolsOn = true
        this.setBlockValid = true
        this.setLimit = 10
        this.loader = false
        this.navIsOpen = false
    }

    getInfoPrepare(data) {
        this.info = data
    }

    ngOnInit() {
        if (this.cookieService.get('OnOffButtonCookie')) {
            if (this.cookieService.get('OnOffButtonCookie') === 'true') {
                this.poolsOn = true
            } else if (
                this.cookieService.get('OnOffButtonCookie') === 'false'
            ) {
                this.poolsOn = false
            }
        } else {
            this.poolsOn = true
        }
        if (this.cookieService.get('setLimitCookie')) {
            this.setLimit = parseInt(
                this.cookieService.get('setLimitCookie'),
                10
            )
        }
        this.currentPage = 1
        this.setBlock = null

        this.getInfoPrepare(this.route.snapshot.data['MainInfo'])

        this._track(
            this.getInfo$.subscribe((data) => {
                this.getInfoPrepare(data[0])
            }),
            this.getLimitedTransactionPoolInfo$.subscribe(transactions => this.transactionCount = transactions.length),
            this.selectRangeOfBlockDetails$.subscribe(blocks => {
                this.blockCount = blocks.length
                // this.maxViewedBlockHeight = blocks.length > 0 ? blocks[0].height : 0
                this.loader = false
            }),
            this.mobileNavState.change.subscribe((navIsOpen) => {
                this.navIsOpen = navIsOpen
            })
        )
        this.onChange()
    }

    ngOnDestroy() {
        super.ngOnDestroy()
    }

    onChangePoolLimit() {
        this.store.dispatch(new TransactionPoolInfos.SetLimit(this.setPoolLimit))
    }

    toggleBtn() {
        this.poolsOn = !this.poolsOn
        const exp = new Date()
        exp.setMonth(exp.getMonth() + 3)
        this.cookieService.set('OnOffButtonCookie', String(this.poolsOn), {
            expires: exp
        })
    }

    // refreshPool() {
    //     this.httpService
    //         .getTxPoolDetails(environment.transactionPoolLimit)
    //         .pipe(take(1))
    //         .subscribe({
    //             next: (data) => {
    //                 this.TxPoolDetails = data
    //                 if (this.TxPoolDetails.length) {
    //                     const self = this
    //                     if (this.maxViewedPoolTimestamp) {
    //                         for (const item of this.TxPoolDetails) {
    //                             item.isNew =
    //                                 +item.timestamp >
    //                                 +this.maxViewedPoolTimestamp
    //                         }
    //                         this.ngZone.runOutsideAngular(() => {
    //                             setTimeout(() => {
    //                                 this.ngZone.run(() => {
    //                                     for (const item of self.TxPoolDetails) {
    //                                         item.isNew = false
    //                                     }
    //                                 })
    //                             }, 2000)
    //                         })
    //                         if (
    //                             +this.maxViewedPoolTimestamp <
    //                             +this.TxPoolDetails[0].timestamp
    //                         ) {
    //                             this.maxViewedPoolTimestamp =
    //                                 this.TxPoolDetails[0].timestamp
    //                         }
    //                     } else {
    //                         this.maxViewedPoolTimestamp =
    //                             this.TxPoolDetails[0].timestamp
    //                     }
    //                 }
    //             },
    //             error: (err) => console.error(err)
    //         })
    // }

    prevPage() {
        if (this.currentPage - 1 > 0) {
            this.currentPage--
            this.onChange()
        }
    }

    nextPage() {
        if (this.currentPage !== Math.ceil(this.info.lastBlock / this.limit)) {
            this.currentPage++
            this.onChange()
        } else {
            return false
        }
    }

    onChangeLimit() {
        if (
            isNaN(+this.goToBlock) === false &&
            this.goToBlock !== undefined &&
            +this.goToBlock >= 0 &&
            +this.goToBlock < this.info.lastBlock
        ) {
            this.listBlockStart =
                +this.goToBlock -
                +this.setLimit +
                1 +
                ((this.info.lastBlock - 1 - +this.goToBlock) % +this.setLimit)
            this.currentPage =
                Math.floor(
                    (this.info.lastBlock - +this.setLimit - (this.listBlockStart + 1)) /
                        +this.setLimit
                ) + 2
        }
        this.onChange()
    }

    searchBlock() {
        this.goToBlock = this.setBlock
        if (
            isNaN(+this.goToBlock) ||
            +this.goToBlock < 0 ||
            +this.goToBlock >= this.info.lastBlock
        ) {
            this.setBlockValid = false
            return
        }
        this.setBlockValid = true
        this.listBlockStart =
            +this.goToBlock -
            +this.setLimit +
            1 +
            ((this.info.lastBlock - 1 - +this.goToBlock) % +this.setLimit)
        this.currentPage =
            Math.floor(
                (this.info.lastBlock - +this.setLimit - (this.listBlockStart + 1)) /
                    +this.setLimit
            ) + 2
        this.onChange()
    }

    onChange() {
        if (this.setLimit > this.maxCountBlock) {
            this.setLimit = this.maxCountBlock
        }
        if (!this.setLimit || this.setLimit < 0) {
            this.setLimit = 10
        }
        this.listBlockStart =
        this.info.lastBlock +
            1 -
            +this.setLimit -
            (this.currentPage - 1) * +this.setLimit
        this.limit = +this.setLimit

        this.cookieService.set('setLimitCookie', this.limit)

        if (this.info) {
            if (this.listBlockStart < 0 || this.listBlockStart === null) {
                this.limit = this.limit + this.listBlockStart
                if (this.limit < 0) {
                    return
                }
                this.listBlockStart = 0
            }
            if (
                this.lastSendBlockDetail.start !== this.listBlockStart ||
                this.lastSendBlockDetail.limit !== this.limit
            ) {
                this.lastSendBlockDetail.start = this.listBlockStart
                this.lastSendBlockDetail.limit = this.limit
                this.loader = true
                this.store.dispatch(new BlockDetails.SetRange(this.listBlockStart, this.limit))

                    // this.httpService
                    //     .getBlockDetails(this.listBlockStart, this.limit)
                    //     .subscribe({
                    //         next: (data) => {
                    //             this.BlockDetails = data
                    //             if (this.BlockDetails.length) {
                    //                 const self = this
                    //                 if (this.maxViewedBlockHeight) {
                    //                     for (const item of this.BlockDetails) {
                    //                         item.isNew =
                    //                             item.height >
                    //                             this.maxViewedBlockHeight
                    //                     }
                    //                     this.ngZone.runOutsideAngular(() => {
                    //                         setTimeout(() => {
                    //                             this.ngZone.run(() => {
                    //                                 for (const item of self.BlockDetails) {
                    //                                     item.isNew = false
                    //                                 }
                    //                             })
                    //                         }, 2000)
                    //                     })
                    //                     if (
                    //                         this.maxViewedBlockHeight <
                    //                         this.BlockDetails[
                    //                             this.BlockDetails.length - 1
                    //                         ].height
                    //                     ) {
                    //                         this.maxViewedBlockHeight =
                    //                             this.BlockDetails[
                    //                                 this.BlockDetails.length - 1
                    //                             ].height
                    //                     }
                    //                 } else {
                    //                     this.maxViewedBlockHeight =
                    //                         this.BlockDetails[
                    //                             this.BlockDetails.length - 1
                    //                         ].height
                    //                 }
                    //                 if (
                    //                     this.goToBlock &&
                    //                     this.setBlockValid === true
                    //                 ) {
                    //                     for (const row of this.BlockDetails) {
                    //                         row.select =
                    //                             row.height === +this.goToBlock
                    //                     }
                    //                     this.ngZone.runOutsideAngular(() => {
                    //                         setTimeout(() => {
                    //                             this.ngZone.run(() => {
                    //                                 for (const row of self.BlockDetails) {
                    //                                     row.select = false
                    //                                 }
                    //                             })
                    //                         }, 2000)
                    //                     })
                    //                 }
                    //             }
                    //         },
                    //         error: (err) => (this.BlockDetails = []),
                    //         complete: () => (this.loader = false)
                    //     })
                // )
            }
        }
    }
}
