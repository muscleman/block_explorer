import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';


import { HttpService, MobileNavState } from './../http.service';
import { DialogComponent } from './../dialog/dialog.component';
import { RouterTestingModule } from '@angular/router/testing';

import { BitNumberPipe, HashPowerConverterPipe, MoneyParsePipe } from '.././pipes.pipe';

import { TransactionComponent } from './transaction.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

describe('TransactionComponent', () => {
  let component: TransactionComponent;
  let fixture: ComponentFixture<TransactionComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        TransactionComponent,
        DialogComponent,
        BitNumberPipe,
        MoneyParsePipe,
        HashPowerConverterPipe
      ],
      providers: [
        HttpService,
        MobileNavState
      ],
      imports: [
        HttpClientTestingModule,
        RouterTestingModule
      ],
      schemas: [
        CUSTOM_ELEMENTS_SCHEMA
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TransactionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
