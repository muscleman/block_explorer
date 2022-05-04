import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { DifficultyPowComponent } from './difficulty-pow.component';

describe('DifficultyPowComponent', () => {
  let component: DifficultyPowComponent;
  let fixture: ComponentFixture<DifficultyPowComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ DifficultyPowComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DifficultyPowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
