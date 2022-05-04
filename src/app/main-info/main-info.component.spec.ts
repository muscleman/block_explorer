import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { MainInfoComponent } from './main-info.component';
import { BitNumberPipe, HashPowerConverterPipe, MoneyParsePipe } from '.././pipes.pipe';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpService } from './../http.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('MainInfoComponent', () => {
  let component: MainInfoComponent;
  let fixture: ComponentFixture<MainInfoComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        MainInfoComponent,
        BitNumberPipe,
        MoneyParsePipe,
        HashPowerConverterPipe
      ],
      providers: [
        HttpService
      ],
      imports: [
        HttpClientTestingModule,
        RouterTestingModule
      ],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MainInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
