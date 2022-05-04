import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { AvgBlockSizeComponent } from './avg-block-size.component';

describe('AvgBlockSizeComponent', () => {
  let component: AvgBlockSizeComponent;
  let fixture: ComponentFixture<AvgBlockSizeComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ AvgBlockSizeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AvgBlockSizeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
