import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpService, MobileNavState } from 'app/http.service';

import { ConfirmTransPerDayComponent } from './confirm-trans-per-day.component';

describe('ConfirmTransPerDayComponent', () => {
  let component: ConfirmTransPerDayComponent;
  let fixture: ComponentFixture<ConfirmTransPerDayComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ 
        ConfirmTransPerDayComponent
      ],
      providers: [
        HttpService,
        MobileNavState
      ],
      imports: [
        HttpClientTestingModule,
        RouterTestingModule
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfirmTransPerDayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
