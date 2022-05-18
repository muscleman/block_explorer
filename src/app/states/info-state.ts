import { Injectable } from '@angular/core'
import { State, Selector, Action, StateContext } from '@ngxs/store'
import { DaemonInfos } from '../actions/get-info.actions'
import { VisibilityInfos } from '../actions/get-visibility-info.actions'
import { HttpService } from '../services/http.service'
import { tap } from 'rxjs'
import { VisibilityInfo } from '../models/visibility-info'
import { GetInfo } from 'app/models/get-info'

export class InfoModel {
    GetInfos: GetInfo[]
    VisibilityInfos: VisibilityInfo[]
}

@State<InfoModel>({
    name: 'appstate',
    defaults: {
        GetInfos: [],
        VisibilityInfos: []
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
}
