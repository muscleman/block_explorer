import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpService, MobileNavState } from 'app/http.service';

import { DifficultyPowComponent } from './difficulty-pow.component';

describe('DifficultyPowComponent', () => {
  let component: DifficultyPowComponent;
  let fixture: ComponentFixture<DifficultyPowComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ 
        DifficultyPowComponent
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
    fixture = TestBed.createComponent(DifficultyPowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
