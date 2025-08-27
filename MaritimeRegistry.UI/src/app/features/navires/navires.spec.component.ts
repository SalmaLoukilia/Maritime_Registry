import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NaviresComponent } from './navires.component';

describe('Navires', () => {
  let component: NaviresComponent;
  let fixture: ComponentFixture<NaviresComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NaviresComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NaviresComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
