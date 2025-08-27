import { TestBed } from '@angular/core/testing';

import { Navires } from './navires';

describe('Navires', () => {
  let service: Navires;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Navires);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
