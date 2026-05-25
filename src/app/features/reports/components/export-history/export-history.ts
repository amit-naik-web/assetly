import {
    Component,
    ChangeDetectionStrategy,
    input,
  } from '@angular/core';
  import { DatePipe } from '@angular/common';
  import { ExportRecord } from '../../models/report.model';
  
  @Component({
    selector: 'app-export-history',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [DatePipe],
    templateUrl: './export-history.html',
    styleUrl: './export-history.scss',
  })
  export class ExportHistory {
    records = input.required<ExportRecord[]>();
  
    download(record: ExportRecord) {
      console.log('Re-download:', record.name);
    }
  }