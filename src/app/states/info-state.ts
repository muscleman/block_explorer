import { Injectable } from '@angular/core'
import { State, Selector, Action, StateContext } from '@ngxs/store'
import { DaemonInfos } from '../actions/get-info.actions'
import { VisibilityInfos } from '../actions/get-visibility-info.actions'
import { HttpService } from '../services/http.service'
import { tap } from 'rxjs'
import { VisibilityInfo } from '../models/visibility-info'
import { GetInfo } from 'app/models/get-info'
import { Transaction_Pool } from 'app/models/transaction_pool'
import { TransactionPoolInfos } from 'app/actions/get-transaction-pool-info.actions copy'

export class InfoModel {
    GetInfos: GetInfo[]
    VisibilityInfos: VisibilityInfo[]
    TransactionPoolInfos: Transaction_Pool[]
}

@State<InfoModel>({
    name: 'appstate',
    defaults: {
        GetInfos: [],
        VisibilityInfos: [],
        TransactionPoolInfos: []
    }
})
@Injectable()
export class InfoState {
    constructor(private httpService: HttpService) {}

    @Selector()
    static selectDaemonInfo(state: InfoModel) {
        return state.GetInfos
    }

    @Selector()
    static selectVisibilityInfo(state: InfoModel) {
        return state.VisibilityInfos
    }

    @Selector()
    static selectTransactionPoolInfo(state: InfoModel) {
        return state.TransactionPoolInfos
    }

    @Action(DaemonInfos.Get)
    getDataFromState(ctx: StateContext<InfoModel>) {
        return this.httpService.getInfo().pipe(
            tap((returnData) => {
                const state = ctx.getState()

                ctx.setState({
                    ...state,
                    GetInfos: [returnData]
                })
            })
        )
    }

    @Action(DaemonInfos.Add)
    addDataToState(ctx: StateContext<InfoModel>, { payload }: DaemonInfos.Add) {
        const state = ctx.getState()

        ctx.setState({ ...state, GetInfos: [payload] })
    }

    @Action(VisibilityInfos.Get)
    getVisibilityDataFromState(ctx: StateContext<InfoModel>) {
        return this.httpService.getVisibilityInfo().pipe(
            tap((returnData) => {
                const state = ctx.getState()
                ctx.setState({
                    ...state,
                    VisibilityInfos: [returnData]
                })
            })
        )
    }

    @Action(VisibilityInfos.Add)
    addVisibilityDataToState(
        ctx: StateContext<InfoModel>,
        { payload }: VisibilityInfos.Add
    ) {
        const state = ctx.getState()

        ctx.setState({ ...state, VisibilityInfos: [payload] })
    }

    @Action(TransactionPoolInfos.Get)
    getTransactionPoolDataFromState(ctx: StateContext<InfoModel>, { limit }: TransactionPoolInfos.Get) {
        return this.httpService.getTxPoolDetails(limit).pipe(
            tap((returnData) => {
                const state = ctx.getState()
                ctx.setState({
                    ...state,
                    TransactionPoolInfos: returnData
                })
            })
        )
    }

    @Action(TransactionPoolInfos.Add)
    addTransactionPoolDataToState(
        ctx: StateContext<InfoModel>,
        { payload }: TransactionPoolInfos.Add
    ) {
        const state = ctx.getState()

        console.log(payload)

        ctx.setState({ ...state, TransactionPoolInfos: payload })
    }
}
