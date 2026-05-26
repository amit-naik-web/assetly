import {
    Component,
    ChangeDetectionStrategy,
    input,
    output,
    signal,
    computed,
    effect,
    ViewChild,
    ElementRef,
    AfterViewInit,
    OnDestroy,
    HostListener,
    inject,
} from '@angular/core';
import { NgClass } from '@angular/common';
import { Router } from '@angular/router';
import * as d3 from 'd3';
import type { HierarchyRectangularNode } from 'd3';
import { TreemapNode, TreemapLeaf, TreemapSector } from './treemap.model';

const SECTOR_HEADER_HEIGHT = 18;

@Component({
    selector: 'app-treemap',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [NgClass],
    templateUrl: './treemap.html',
    styleUrl: './treemap.scss',
})
export class Treemap implements AfterViewInit, OnDestroy {
    nodes = input.required<TreemapNode[]>();
    height = input<number>(380);
    navigable = input<boolean>(true);
    theme = input<'light' | 'dark'>('dark');

    nodeClicked = output<TreemapNode>();

    @ViewChild('host') hostEl!: ElementRef<HTMLDivElement>;

    private router = inject(Router);
    private resizeOb!: ResizeObserver;

    readonly leaves = signal<TreemapLeaf[]>([]);
    readonly sectors = signal<TreemapSector[]>([]);
    readonly focusIdx = signal<number>(-1);
    readonly hoverNode = signal<TreemapLeaf | null>(null);
    readonly announcement = signal('');

    private fillColor(pct: number): string {
        const light = this.theme() === 'light';
        return d3.scaleLinear<string>()
            .domain([-4, -1, -0.1, 0.1, 1, 4])
            .range(light
                ? ['#B71C1C', '#E53935', '#E0E0E0', '#43A047', '#2E7D32', '#1B5E20']
                : ['#7A0000', '#C62828', '#1A1A1A', '#1B5E20', '#2E7D32', '#00600F'])
            .clamp(true)(pct);
    }

    private labelColor(pct: number): string {
        const light = this.theme() === 'light';
        return d3.scaleLinear<string>()
            .domain([-4, -1, 0, 1, 4])
            .range(light
                ? ['#FFCDD2', '#EF9A9A', '#616161', '#A5D6A7', '#C8E6C9']
                : ['#FF8A80', '#FF5252', '#BDBDBD', '#69F0AE', '#B9F6CA'])
            .clamp(true)(pct);
    }

    // Active (focused) leaf
    readonly activeLeaf = computed(() => {
        const idx = this.focusIdx();
        if (idx < 0) return null;
        return this.leaves()[idx] ?? null;
    });

    constructor() {
        effect(() => {
            const data = this.nodes();
            this.theme();
            this.height();
            if (data.length) {
                setTimeout(() => this.compute(), 0);
            }
        });
    }

    ngAfterViewInit() {
        if (this.nodes().length) {
            this.compute();
        }

        // Re-compute on container resize
        this.resizeOb = new ResizeObserver(() => {
            if (this.nodes().length) this.compute();
        });
        if (this.hostEl?.nativeElement) {
            this.resizeOb.observe(this.hostEl.nativeElement);
        }
    }

    ngOnDestroy() {
        this.resizeOb?.disconnect();
    }

    private compute() {
        const el = this.hostEl?.nativeElement;
        if (!el) return;

        const W = el.clientWidth || 600;
        const H = this.height() || el.clientHeight || 380;
        const data = this.nodes();
        if (!data.length) return;

        // Group by sector
        const grouped = d3.group(data, d => d.sector);

        const hierarchyData = {
            name: 'root',
            children: Array.from(grouped, ([sector, items]) => ({
                name: sector,
                children: items.map(item => ({
                    ...item,
                    value: item.totalValue,
                })),
            })),
        };

        const root = d3.hierarchy<any>(hierarchyData)
            .sum(d => d.value ?? 0)
            .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

        const treemapLayout = d3.treemap<any>()
            .size([W, H])
            .padding(0)
            .paddingTop(SECTOR_HEADER_HEIGHT)
            .paddingInner(1)
            .paddingOuter(0)
            .round(true);

        treemapLayout(root);

        const totalValue = root.value ?? 0;
        const maxPortfolioPct = totalValue > 0
            ? Math.max(...data.map(d => (d.totalValue / totalValue) * 100))
            : 0;

        // Extract sector rectangles
        const sectorNodes: TreemapSector[] = ((root.children ?? []) as HierarchyRectangularNode<any>[]).map(c => ({
            name: c.data.name,
            x0: c.x0, y0: c.y0,
            x1: c.x1, y1: c.y1,
            headerHeight: SECTOR_HEADER_HEIGHT,
            contentY0: c.y0 + SECTOR_HEADER_HEIGHT,
        }));

        // Extract leaf rectangles
        const leafNodes: TreemapLeaf[] = (
            root.leaves() as HierarchyRectangularNode<any>[]
        ).map(leaf => {
            const pct = leaf.data.dayChangePct ?? 0;
            const w = leaf.x1 - leaf.x0;
            const h = leaf.y1 - leaf.y0;
            const portfolioPct = totalValue > 0
                ? (leaf.data.totalValue / totalValue) * 100
                : 0;
            const typography = this.calcTypography(
                w, h, leaf.data.symbol, portfolioPct, maxPortfolioPct,
            );
            return {
                id: leaf.data.id,
                symbol: leaf.data.symbol,
                companyName: leaf.data.companyName,
                sector: leaf.data.sector,
                totalValue: leaf.data.totalValue,
                dayChangePct: pct,
                currentPrice: leaf.data.currentPrice,
                x0: leaf.x0, y0: leaf.y0,
                x1: leaf.x1, y1: leaf.y1,
                width: w,
                height: h,
                color: this.fillColor(pct),
                textColor: this.labelColor(pct),
                portfolioPct,
                ...typography,
            };
        });

        this.sectors.set(sectorNodes);
        this.leaves.set(leafNodes);
    }

    private calcTypography(
        w: number,
        h: number,
        symbol: string,
        portfolioPct: number,
        maxPortfolioPct: number,
    ): Pick<TreemapLeaf, 'fontSize' | 'fontWeight' | 'pctFontSize' | 'pctFontWeight'> {
        const ratio = maxPortfolioPct > 0 ? portfolioPct / maxPortfolioPct : 0;
        const t = Math.pow(ratio, 0.6);

        let fontSize = 11 + t * 23;
        const fontWeight = Math.round(500 + t * 300);

        const maxByWidth = w / Math.max(symbol.length * 0.52, 2);
        const maxByHeight = h * 0.42;
        fontSize = Math.min(fontSize, maxByWidth, maxByHeight);
        fontSize = Math.max(8, Math.round(fontSize));

        const pctFontSize = Math.max(8, Math.round(fontSize * 0.78));
        const pctFontWeight = Math.max(450, fontWeight - 150);

        return { fontSize, fontWeight, pctFontSize, pctFontWeight };
    }

    // ── Keyboard navigation ──────────────────────────────
    @HostListener('keydown', ['$event'])
    handleKey(e: KeyboardEvent) {
        const len = this.leaves().length;
        if (!len) return;

        switch (e.key) {
            case 'ArrowRight':
            case 'ArrowDown': {
                e.preventDefault();
                const next = Math.min((this.focusIdx() + 1), len - 1);
                this.focusIdx.set(next < 0 ? 0 : next);
                this.announceLeaf(next < 0 ? 0 : next);
                break;
            }
            case 'ArrowLeft':
            case 'ArrowUp': {
                e.preventDefault();
                const prev = Math.max(this.focusIdx() - 1, 0);
                this.focusIdx.set(prev);
                this.announceLeaf(prev);
                break;
            }
            case 'Enter':
            case ' ': {
                e.preventDefault();
                const leaf = this.activeLeaf();
                if (leaf && this.navigable()) {
                    this.navigate(leaf);
                }
                break;
            }
            case 'Escape':
                this.focusIdx.set(-1);
                this.announcement.set('Treemap focus cleared');
                break;
            case 'Home': {
                e.preventDefault();
                this.focusIdx.set(0);
                this.announceLeaf(0);
                break;
            }
            case 'End': {
                e.preventDefault();
                const last = len - 1;
                this.focusIdx.set(last);
                this.announceLeaf(last);
                break;
            }
        }
    }

    announceLeaf(idx: number) {
        const leaf = this.leaves()[idx];
        if (!leaf) return;
        const dir = leaf.dayChangePct >= 0 ? 'up' : 'down';
        this.announcement.set(
            `${leaf.symbol}, ${leaf.companyName}, ` +
            `${dir} ${Math.abs(leaf.dayChangePct).toFixed(2)} percent today, ` +
            `value $${leaf.totalValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
        );
    }

    onLeafClick(leaf: TreemapLeaf) {
        const idx = this.leaves().findIndex(l => l.id === leaf.id);
        if (idx >= 0) {
            this.focusIdx.set(idx);
            this.announceLeaf(idx);
        }
        this.nodeClicked.emit(leaf as any);
    }

    onLeafDblClick(leaf: TreemapLeaf, event: Event) {
        event.preventDefault();
        event.stopPropagation();
        this.onLeafClick(leaf);
        if (this.navigable()) {
            this.navigate(leaf);
        }
    }

    onLeafHover(leaf: TreemapLeaf | null) {
        this.hoverNode.set(leaf);
    }

    private navigate(leaf: TreemapLeaf) {
        this.router.navigate(['/chart', leaf.symbol]);
    }

    getAriaLabel(leaf: TreemapLeaf): string {
        const dir = leaf.dayChangePct >= 0 ? 'up' : 'down';
        return `${leaf.symbol}, ${leaf.companyName}, ` +
            `${dir} ${Math.abs(leaf.dayChangePct).toFixed(2)}% today. ` +
            `Value $${leaf.totalValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}. ` +
            (this.navigable() ? 'Double-click or press Enter to view chart.' : '');
    }
}