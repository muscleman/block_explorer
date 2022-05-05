import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'

import { BlockchainComponent } from './blockchain.component'
import { RouterTestingModule } from '@angular/router/testing'
import { HttpService, MobileNavState } from './../http.service'
import { CookieService } from 'ngx-cookie-service'
import {
    OrderPipe,
    BitNumberPipe,
    TruncatePipe,
    TimeAgoPipe,
    MoneyParsePipe,
    HashPowerConverterPipe
} from '.././pipes.pipe'
import { HttpClientTestingModule } from '@angular/common/http/testing'
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'

describe('BlockchainComponent', () => {
    let component: BlockchainComponent
    let fixture: ComponentFixture<BlockchainComponent>

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [
                BlockchainComponent,
                OrderPipe,
                BitNumberPipe,
                TruncatePipe,
                TimeAgoPipe,
                MoneyParsePipe,
                HashPowerConverterPipe
            ],
            providers: [MobileNavState, HttpService, CookieService],
            imports: [HttpClientTestingModule, RouterTestingModule],
            schemas: [CUSTOM_ELEMENTS_SCHEMA]
        }).compileComponents()
    }))

    beforeEach(() => {
        fixture = TestBed.createComponent(BlockchainComponent)
        component = fixture.componentInstance
        fixture.detectChanges()
    })

    it('should be created', () => {
        expect(component).toBeTruthy()
    })
})
