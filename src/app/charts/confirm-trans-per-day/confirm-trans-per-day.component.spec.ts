import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ConfirmTransPerDayComponent } from './confirm-trans-per-day.component';

describe('ConfirmTransPerDayComponent', () => {
  let component: ConfirmTransPerDayComponent;
  let fixture: ComponentFixture<ConfirmTransPerDayComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ConfirmTransPerDayComponent ]
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
