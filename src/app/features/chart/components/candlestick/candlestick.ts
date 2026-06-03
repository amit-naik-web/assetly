import {
    Component,
    ChangeDetectionStrategy,
    input,
    signal,
    computed,
    effect,
    ViewChild,
    ElementRef,
    HostListener,
    OnDestroy,
    AfterViewInit,
  } from '@angular/core';
  import { NgClass } from '@angular/common';
  import * as d3 from 'd3';
  import { ChartViewMode, OhlcvCandle } from '../../models/chart.model';
  
  @Component({
    selector: 'app-candlestick',
    standalone: true,
    imports: [NgClass],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './candlestick.html',
    styleUrl: './candlestick.scss',
  })
  export class Candlestick implements AfterViewInit, OnDestroy {
    candles  = input.required<OhlcvCandle[]>();
    symbol   = input.required<string>();
    viewMode = input<ChartViewMode>('candlestick');
  
    @ViewChild('svgEl') svgEl!: ElementRef<SVGSVGElement>;
  
    // Crosshair state
    readonly crosshairIndex = signal<number | null>(null);
    readonly tooltipPinned  = signal(false);
  
    // Announcement for ARIA live region
    readonly announcement = signal('');
  
    // Current candle at crosshair
    readonly activCandle = computed(() => {
      const idx = this.crosshairIndex();
      if (idx === null) return null;
      return this.candles()[idx] ?? null;
    });
  
    readonly Math = Math;
  
    private resizeObserver!: ResizeObserver;
  
  // Keep chart in sync with candle/symbol updates.
  private readonly chartSyncEffect = effect(() => {
    const data = this.candles();
    this.symbol();
    this.viewMode();
    queueMicrotask(() => {
      if (data.length && this.svgEl) {
        this.drawChart(data);
      }
    });
  });
  
    ngAfterViewInit() {
      // Draw immediately with current data
      if (this.candles().length) {
        this.drawChart(this.candles());
      }
    }

    ngOnDestroy() {
      this.resizeObserver?.disconnect();
    }
  
    // ── Keyboard navigation ─────────────────────────────
    @HostListener('keydown', ['$event'])
    handleKey(e: KeyboardEvent) {
      const len = this.candles().length;
      if (!len) return;
  
      switch (e.key) {
        case 'ArrowRight': {
          e.preventDefault();
          const cur = this.crosshairIndex() ?? -1;
          const next = Math.min(cur + 1, len - 1);
          this.crosshairIndex.set(next);
          this.announce(next);
          break;
        }
        case 'ArrowLeft': {
          e.preventDefault();
          const cur = this.crosshairIndex() ?? len;
          const prev = Math.max(cur - 1, 0);
          this.crosshairIndex.set(prev);
          this.announce(prev);
          break;
        }
        case ' ':
          e.preventDefault();
          this.tooltipPinned.update(v => !v);
          break;
        case 'Escape':
          this.crosshairIndex.set(null);
          this.tooltipPinned.set(false);
          this.announcement.set('Tooltip dismissed');
          break;
        case 'Home': {
          e.preventDefault();
          this.crosshairIndex.set(0);
          this.announce(0);
          break;
        }
        case 'End': {
          e.preventDefault();
          const last = len - 1;
          this.crosshairIndex.set(last);
          this.announce(last);
          break;
        }
      }
    }
  
    private announce(idx: number) {
      const c = this.candles()[idx];
      if (!c) return;
      const dir = c.close >= c.open ? 'up' : 'down';
      this.announcement.set(
        `${this.symbol()} ${c.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}: ` +
        `Open $${c.open.toFixed(2)}, Close $${c.close.toFixed(2)}, ` +
        `High $${c.high.toFixed(2)}, Low $${c.low.toFixed(2)}, ${dir}`
      );
    }
  
    // ── D3 chart drawing ────────────────────────────────
    private drawChart(data: OhlcvCandle[]) {
      const el = this.svgEl?.nativeElement;
      if (!el) return;
  
      const container = el.parentElement!;
      const W = container.clientWidth > 0 ? container.clientWidth : 600;
      const H = Math.max(container.clientHeight > 0 ? container.clientHeight : 220, 220);
      const margin = { top: 10, right: 20, bottom: 30, left: 50 };
      const innerW  = W - margin.left - margin.right;
      const innerH  = H - margin.top - margin.bottom;
  
      // Clear previous render
      d3.select(el).selectAll('*').remove();
  
      const svg = d3.select(el)
        .attr('width', W)
        .attr('height', H)
        .attr('viewBox', `0 0 ${W} ${H}`);
  
      const g = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
  
      // Scales
      const xScale = d3.scaleBand()
        .domain(data.map((_, i) => i.toString()))
        .range([0, innerW])
        .padding(0.2);
  
      const yExtent = [
        d3.min(data, d => d.low)!  * 0.998,
        d3.max(data, d => d.high)! * 1.002,
      ];
  
      const yScale = d3.scaleLinear()
        .domain(yExtent as [number, number])
        .range([innerH, 0]);
  
      // Grid lines
      g.append('g')
        .attr('class', 'grid')
        .call(d3.axisLeft(yScale)
          .tickSize(-innerW)
          .tickFormat(() => '')
          .ticks(5)
        )
        .call(gg => gg.selectAll('line')
          .style('stroke', '#D3D1C7')
          .style('stroke-width', '0.5')
        )
        .call(gg => gg.select('.domain').remove());
  
      // X axis — show every 5th date
      const xAxis = d3.axisBottom(xScale)
        .tickValues(data
          .map((_, i) => i.toString())
          .filter((_, i) => i % Math.ceil(data.length / 8) === 0)
        )
        .tickFormat((d) => {
          const candle = data[parseInt(d)];
          return candle
            ? candle.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            : '';
        });
  
      g.append('g')
        .attr('transform', `translate(0,${innerH})`)
        .call(xAxis)
        .call(gg => gg.selectAll('text')
          .style('fill', '#5F5E5A')
          .style('font-size', '10px')
        )
        .call(gg => gg.select('.domain').style('stroke', '#D3D1C7'));
  
      // Y axis
      g.append('g')
        .call(d3.axisLeft(yScale)
          .ticks(5)
          .tickFormat(d => `$${(+d).toFixed(0)}`)
        )
        .call(gg => gg.selectAll('text')
          .style('fill', '#5F5E5A')
          .style('font-size', '10px')
        )
        .call(gg => gg.select('.domain').remove());
  
      if (this.viewMode() === 'candlestick') {
        // Wicks (high-low lines)
        g.selectAll('.wick')
          .data(data)
          .enter()
          .append('line')
          .attr('class', 'wick')
          .attr('x1', (_, i) => xScale(i.toString())! + xScale.bandwidth() / 2)
          .attr('x2', (_, i) => xScale(i.toString())! + xScale.bandwidth() / 2)
          .attr('y1', d => yScale(d.high))
          .attr('y2', d => yScale(d.low))
          .style('stroke', d => d.close >= d.open ? '#1D9E75' : '#E24B4A')
          .style('stroke-width', 1);
    
        // Candle bodies
        g.selectAll('.candle')
          .data(data)
          .enter()
          .append('rect')
          .attr('class', 'candle')
          .attr('x', (_, i) => xScale(i.toString())!)
          .attr('y', d => yScale(Math.max(d.open, d.close)))
          .attr('width', xScale.bandwidth())
          .attr('height', d => {
            const h = Math.abs(yScale(d.open) - yScale(d.close));
            return Math.max(h, 1);
          })
          .attr('rx', 1)
          .style('fill', d => d.close >= d.open ? '#1D9E75' : '#E24B4A');
      } else {
        const line = d3.line<OhlcvCandle>()
          .x((_, i) => xScale(i.toString())! + xScale.bandwidth() / 2)
          .y(d => yScale(d.close))
          .curve(d3.curveMonotoneX);

        g.append('path')
          .datum(data)
          .attr('fill', 'none')
          .attr('stroke', '#185FA5')
          .attr('stroke-width', 2)
          .attr('d', line);

        g.selectAll('.line-dot')
          .data(data)
          .enter()
          .append('circle')
          .attr('class', 'line-dot')
          .attr('cx', (_, i) => xScale(i.toString())! + xScale.bandwidth() / 2)
          .attr('cy', d => yScale(d.close))
          .attr('r', 2)
          .style('fill', '#185FA5');
      }
  
      // Crosshair line (updated by keyboard)
      const crosshairLine = g.append('line')
        .attr('class', 'crosshair')
        .attr('y1', 0)
        .attr('y2', innerH)
        .style('stroke', '#185FA5')
        .style('stroke-width', 1)
        .style('stroke-dasharray', '3,3')
        .style('opacity', 0);
  
      // Interactive overlay for mouse hover
      g.append('rect')
        .attr('width', innerW)
        .attr('height', innerH)
        .style('fill', 'none')
        .style('pointer-events', 'all')
        .on('mousemove', (event) => {
          const [mouseX] = d3.pointer(event);
          const idx = Math.round(mouseX / (innerW / data.length));
          const clampedIdx = Math.max(0, Math.min(idx, data.length - 1));
          const xPos = xScale(clampedIdx.toString())! + xScale.bandwidth() / 2;
  
          crosshairLine
            .attr('x1', xPos)
            .attr('x2', xPos)
            .style('opacity', 1);
  
          this.crosshairIndex.set(clampedIdx);
        })
        .on('mouseleave', () => {
          if (!this.tooltipPinned()) {
            crosshairLine.style('opacity', 0);
            this.crosshairIndex.set(null);
          }
        });
    }
  }