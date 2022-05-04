import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { AltBlocksDetailsComponent } from './alt-blocks-details.component';

import { MainInfoComponent } from './../main-info/main-info.component';
import { BitNumberPipe, HashPowerConverterPipe, MoneyParsePipe } from '.././pipes.pipe';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpService, MobileNavState } from './../http.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

describe('AltBlocksDetailsComponent', () => {
  let component: AltBlocksDetailsComponent;
  let fixture: ComponentFixture<AltBlocksDetailsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        AltBlocksDetailsComponent,
        MainInfoComponent,
        BitNumberPipe,
        MoneyParsePipe,
        HashPowerConverterPipe
      ],
      providers: [
        MobileNavState,
        HttpService
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
    fixture = TestBed.createComponent(AltBlocksDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
