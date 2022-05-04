import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { AliasesComponent } from './aliases.component';
import { HttpService, MobileNavState } from './../http.service';
import { DialogComponent } from './../dialog/dialog.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';

describe('AliasesComponent', () => {
  let component: AliasesComponent;
  let fixture: ComponentFixture<AliasesComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        AliasesComponent,
        DialogComponent
      ],
      providers: [
        HttpService,
        MobileNavState
      ],
      imports: [
        HttpClientTestingModule,
        RouterTestingModule
      ],
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AliasesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
