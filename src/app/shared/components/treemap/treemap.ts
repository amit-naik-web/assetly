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

interface TreemapHierarchyDatum {
    name: string;
    value?: number;
    sector?: string;
    children?: TreemapHierarchyDatum[];
    id?: string;
    symbol?: string;
    companyName?: string;
    totalValue?: number;
    dayChangePct?: number;
    currentPrice?: number;
}

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

    isNeutralPct(pct: number): boolean {
        return Math.abs(pct) < 0.1;
    }

    leafIntensity(pct: number): 'low' | 'mid' | 'high' {
        const abs = Math.abs(pct);
        if (abs >= 2) return 'high';
        if (abs >= 0.5) return 'mid';
        return 'low';
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

        const hierarchyData: TreemapHierarchyDatum = {
            name: 'root',
            children: Array.from(grouped, ([sector, items]) => ({
                name: sector,
                children: items.map(item => ({
                    ...item,
                    value: item.totalValue,
                })),
            })),
        };

        const root = d3.hierarchy<TreemapHierarchyDatum>(hierarchyData)
            .sum(d => d.value ?? 0)
            .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

        const treemapLayout = d3.treemap<TreemapHierarchyDatum>()
            .size([W, H])
            .padding(0)
            .paddingTop(d => (d.depth === 1 ? SECTOR_HEADER_HEIGHT : 0))
            .paddingInner(2)
            .paddingOuter(0)
            .round(true);

        treemapLayout(root);

        const totalValue = root.value ?? 0;
        const maxPortfolioPct = totalValue > 0
            ? Math.max(...data.map(d => (d.totalValue / totalValue) * 100))
            : 0;

        // Extract sector rectangles
        const sectorNodes: TreemapSector[] = ((root.children ?? []) as HierarchyRectangularNode<TreemapHierarchyDatum>[]).map(c => ({
            name: c.data.name,
            x0: c.x0!, y0: c.y0!,
            x1: c.x1!, y1: c.y1!,
            headerHeight: SECTOR_HEADER_HEIGHT,
            contentY0: c.y0! + SECTOR_HEADER_HEIGHT,
        }));

        const sectorByName = new Map(
            sectorNodes.map(s => [s.name, s]),
        );

        // Extract leaf rectangles — clamp below sector header band
        const leafNodes: TreemapLeaf[] = (
            root.leaves() as HierarchyRectangularNode<TreemapHierarchyDatum>[]
        ).flatMap(leaf => {
            const sector = sectorByName.get(leaf.data.sector);
            let y0 = leaf.y0!;
            const y1 = leaf.y1!;
            const x0 = leaf.x0!;

            if (sector && y0 < sector.contentY0) {
                y0 = sector.contentY0;
            }

            const w = leaf.x1! - x0;
            const h = Math.max(0, y1 - y0);
            if (w < 1 || h < 1) {
                return [];
            }

            const pct = leaf.data.dayChangePct ?? 0;
            const portfolioPct = totalValue > 0
                ? (leaf.data.totalValue / totalValue) * 100
                : 0;
            const pctLabel = `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`;
            const labelLayout = this.resolveLabelLayout(
                w, h, leaf.data.symbol, pctLabel,
            );
            const typography = this.calcTypography(
                w, h, leaf.data.symbol, portfolioPct, maxPortfolioPct, labelLayout, pctLabel,
            );

            return [{
                id: leaf.data.id,
                symbol: leaf.data.symbol,
                companyName: leaf.data.companyName,
                sector: leaf.data.sector,
                totalValue: leaf.data.totalValue,
                dayChangePct: pct,
                currentPrice: leaf.data.currentPrice,
                x0,
                y0,
                x1: x0 + w,
                y1: y0 + h,
                width: w,
                height: h,
                portfolioPct,
                labelLayout,
                pctLabel,
                ...typography,
            }];
        });

        this.sectors.set(sectorNodes);
        this.leaves.set(leafNodes);
    }

    private resolveLabelLayout(
        w: number,
        h: number,
        symbol: string,
        pctLabel: string,
    ): TreemapLeaf['labelLayout'] {
        const compactMinW = symbol.length * 5.2 + pctLabel.length * 4.2 + 8;
        const canCompact = h >= 14 && w >= Math.max(26, compactMinW);
        const area = w * h;
        const aspect = w / Math.max(h, 1);

        // Horizontal only on physically small or wide-strip tiles (e.g. CAT)
        const needsCompact =
            h < 28 ||
            area < 900 ||
            (h < 38 && aspect >= 1.2);

        if (needsCompact && canCompact) {
            return 'compact';
        }
        // Vertical when there is room for two readable lines
        if (w >= 28 && h >= 28) {
            return 'stacked';
        }
        if (canCompact) {
            return 'compact';
        }
        if (w >= 18 && h >= 12) {
            return 'symbol-only';
        }
        return 'none';
    }

    private calcTypography(
        w: number,
        h: number,
        symbol: string,
        portfolioPct: number,
        maxPortfolioPct: number,
        labelLayout: TreemapLeaf['labelLayout'],
        pctLabel: string,
    ): Pick<TreemapLeaf, 'fontSize' | 'fontWeight' | 'pctFontSize' | 'pctFontWeight'> {
        const ratio = maxPortfolioPct > 0 ? portfolioPct / maxPortfolioPct : 0;
        const t = Math.pow(ratio, 0.6);

        let fontSize = 11 + t * 23;
        const fontWeight = Math.round(500 + t * 300);

        if (labelLayout === 'compact') {
            const labelChars = symbol.length + pctLabel.length + 1;
            const maxByWidth = (w - 8) / Math.max(labelChars * 0.55, 2);
            fontSize = Math.min(fontSize, maxByWidth, h * 0.68);
            fontSize = Math.max(8, Math.round(fontSize));
            return {
                fontSize,
                fontWeight,
                pctFontSize: Math.max(8, Math.round(fontSize * 0.92)),
                pctFontWeight: Math.max(500, fontWeight - 50),
            };
        }

        const maxByWidth = w / Math.max(symbol.length * 0.52, 2);
        const maxByHeight = h * 0.36;
        fontSize = Math.min(fontSize, maxByWidth, maxByHeight);
        fontSize = Math.max(9, Math.round(fontSize));

        const pctFontSize = Math.max(8, Math.round(fontSize * 0.82));
        const pctFontWeight = Math.max(450, fontWeight - 120);

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
        this.nodeClicked.emit({
            id: leaf.id,
            symbol: leaf.symbol,
            companyName: leaf.companyName,
            sector: leaf.sector,
            totalValue: leaf.totalValue,
            dayChangePct: leaf.dayChangePct,
            currentPrice: leaf.currentPrice,
        });
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