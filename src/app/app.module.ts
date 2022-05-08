// Modules
import { BrowserModule } from '@angular/platform-browser'
import { NgModule } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { HttpClientModule } from '@angular/common/http'
import { AppRoutingModule } from './app.router'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { NgxJsonViewerModule } from 'ngx-json-viewer'
import { ChartModule } from 'angular-highcharts'
import * as highstock from 'highcharts/modules/stock.src'

import * as Highcharts from 'highcharts'
import StockModule from 'highcharts/modules/stock'

StockModule(Highcharts)

// Services
import { HttpService } from './http.service'
import { ServiceResolver, ResolveAltBlock } from './http.service'
import { MobileNavState } from './http.service'

// Components
import { AppComponent } from './app.component'
import { MainInfoComponent } from './main-info/main-info.component'
import { BlockchainComponent } from './blockchain/blockchain.component'
import { BlockDetailsComponent } from './block-details/block-details.component'
import { AltBlocksComponent } from './alt-blocks/alt-blocks.component'
import { AltBlocksDetailsComponent } from './alt-blocks-details/alt-blocks-details.component'
import { AliasesComponent } from './aliases/aliases.component'
import { TransactionComponent } from './transaction/transaction.component'
import { DialogComponent } from './dialog/dialog.component'
import { ServerErrorComponent } from './server-error/server-error.component'
import { SearchComponent } from './search/search.component'
import { ChartsComponent } from './charts/charts.component'
import { AvgBlockSizeComponent } from './charts/avg-block-size/avg-block-size.component'
import { AvgTransPerBlockComponent } from './charts/avg-trans-per-block/avg-trans-per-block.component'
import { HashrateComponent } from './charts/hashrate/hashrate.component'
import { DifficultyComponent } from './charts/difficulty/difficulty.component'
import { ConfirmTransPerDayComponent } from './charts/confirm-trans-per-day/confirm-trans-per-day.component'
import { DifficultyPowComponent } from './charts/difficulty-pow/difficulty-pow.component'
import { ApiComponent } from './api/api.component'
import { CookieService } from 'ngx-cookie-service'
import { PipesModule } from './pipes/pipes.module'

@NgModule({
    declarations: [
        AppComponent,
        MainInfoComponent,
        BlockchainComponent,
        BlockDetailsComponent,
        AltBlocksComponent,
        AltBlocksDetailsComponent,
        AliasesComponent,
        TransactionComponent,
        DialogComponent,
        ServerErrorComponent,
        SearchComponent,
        ChartsComponent,
        AvgBlockSizeComponent,
        AvgTransPerBlockComponent,
        HashrateComponent,
        DifficultyComponent,
        DifficultyPowComponent,
        ConfirmTransPerDayComponent,
        ApiComponent
    ],
    imports: [
        BrowserModule,
        FormsModule,
        HttpClientModule,
        BrowserAnimationsModule,
        MatProgressSpinnerModule,
        NgxJsonViewerModule,
        ChartModule,
        AppRoutingModule,
        PipesModule
    ],
    providers: [
        HttpService,
        ServiceResolver,
        ResolveAltBlock,
        CookieService,
        MobileNavState,
        { provide: ChartModule, useFactory: () => [highstock] }
    ],
    bootstrap: [AppComponent]
})
export class AppModule {}
