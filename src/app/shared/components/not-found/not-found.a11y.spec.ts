import { TestBed } from '@angular/core/testing';
import { describe, it, beforeEach } from 'vitest';
import { provideZonelessChangeDetection } from '@angular/core';
import '../../../../testing/vitest-axe-setup';
import { runAxe, assertNoSeriousViolations } from '../../../../testing/run-axe';
import { NotFound } from './not-found';

describe('NotFound — accessibility', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotFound],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();
  });

  it('has no serious or critical axe violations', async () => {
    const fixture = TestBed.createComponent(NotFound);
    fixture.detectChanges();
    const results = await runAxe(fixture.nativeElement);
    assertNoSeriousViolations(results);
  });
});
