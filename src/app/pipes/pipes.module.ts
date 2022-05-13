import { NgModule } from '@angular/core'
import {
    BitNumberPipe,
    DateFormatPipe,
    HashPowerConverterPipe,
    MoneyParsePipe,
    OrderByPipe,
    OrderPipe,
    SortByAlphabetPipe,
    SortGridPipe,
    TimeAgoPipe,
    TimeAgoPipe2,
    TruncatePipe,
    UtcPipe
} from 'app/pipes/pipes.pipe'

@NgModule({
    declarations: [
        OrderPipe,
        OrderByPipe,
        SortGridPipe,
        BitNumberPipe,
        MoneyParsePipe,
        TruncatePipe,
        TimeAgoPipe,
        SortByAlphabetPipe,
        HashPowerConverterPipe,
        DateFormatPipe,
        UtcPipe,
        TimeAgoPipe2
    ],
    exports: [
        OrderPipe,
        OrderByPipe,
        SortGridPipe,
        BitNumberPipe,
        MoneyParsePipe,
        TruncatePipe,
        TimeAgoPipe,
        SortByAlphabetPipe,
        HashPowerConverterPipe,
        DateFormatPipe,
        UtcPipe,
        TimeAgoPipe2
    ]
})
export class PipesModule {}
