import { Deck } from '@deck.gl/core';
import { ScatterplotLayer, ColumnLayer } from '@deck.gl/layers';
import { HexagonLayer } from '@deck.gl/aggregation-layers';
import { TileLayer } from '@deck.gl/geo-layers';
import { DataFilterExtension } from '@deck.gl/extensions';

export interface GPULayer {
  id: string;
  type: 'scatterplot' | 'hexagon' | 'column' | 'tile';
  visible: boolean;
  pickable: boolean;
  updateTriggers?: any;
  props: any;
}

export interface GPURenderConfig {
  canvas: HTMLCanvasElement;
  viewState: any;
  controller: any;
  effects?: any[];
  parameters?: any;
  layers: GPULayer[];
}

export interface WebGLParameters {
  depthTest: boolean;
  depthFunc: number;
  cullFace: boolean;
  blend: boolean;
  blendFunc: [number, number];
  clearColor: [number, number, number, number];
}

export interface GPUEffect {
  type: 'lighting' | 'postprocessing' | 'shadows' | 'bloom';
  id: string;
  props: any;
}

export interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  renderTime: number;
  cpuTime: number;
  gpuTime: number;
  memoryUsage: number;
  layerCount: number;
  featureCount: number;
  setup?: () => void;
  preRender?: (opts: any) => void;
  cleanup?: () => void;
}

/**
 * High-performance GPU WebGL rendering service using deck.gl
 * Capable of rendering millions of data points smoothly
 */
export class GPUWebGLRenderingService {
  private deck: Deck | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private layers: Map<string, GPULayer> = new Map();
  private performanceMonitor: PerformanceObserver | null = null;
  private animationFrameId: number | null = null;
  private lastFrameTime: number = 0;
  private metrics: PerformanceMetrics = this.getDefaultMetrics();

  private getDefaultMetrics(): PerformanceMetrics {
    return {
      fps: 0,
      frameTime: 0,
      renderTime: 0,
      cpuTime: 0,
      gpuTime: 0,
      memoryUsage: 0,
      layerCount: 0,
      featureCount: 0,
    };
  }

  private setupPerformanceMonitoring(): void {
    if (typeof PerformanceObserver !== 'undefined') {
      this.performanceMonitor = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.entryType === 'measure') {
            this.metrics.renderTime = entry.duration;
          }
        });
      });
      this.performanceMonitor.observe({ entryTypes: ['measure'] });
    }
  }

  private createDeckLayer(config: GPULayer): any {
    const baseProps = {
      id: config.id,
      visible: config.visible,
      pickable: config.pickable,
      updateTriggers: config.updateTriggers || {},
    };

    const glParameters: WebGLParameters = {
      depthTest: true,
      depthFunc: WebGL2RenderingContext.LEQUAL,
      cullFace: false,
      blend: true,
      blendFunc: [WebGL2RenderingContext.SRC_ALPHA, WebGL2RenderingContext.ONE_MINUS_SRC_ALPHA],
      clearColor: [0.0, 0.0, 0.0, 0.0],
    };

    switch (config.type) {
      case 'scatterplot':
        return new ScatterplotLayer({
          ...baseProps,
          data: config.props.data || [],
          getPosition: (d: any) => [d.longitude, d.latitude],
          getRadius: config.props.getRadius || ((d: any) => d.radius || 30),
          getFillColor: config.props.getFillColor || [255, 140, 0],
          radiusScale: config.props.radiusScale || 1,
          radiusMinPixels: config.props.radiusMinPixels || 1,
          radiusMaxPixels: config.props.radiusMaxPixels || 100,
          stroked: config.props.stroked || false,
          getLineColor: config.props.getLineColor || [0, 0, 0],
          getLineWidth: config.props.getLineWidth || 1,
          parameters: glParameters,
          extensions: [new DataFilterExtension({ filterSize: 1 })],
        });

      case 'hexagon':
        return new HexagonLayer({
          ...baseProps,
          data: config.props.data || [],
          getPosition: (d: any) => [d.longitude, d.latitude],
          radius: config.props.radius || 1000,
          colorRange: config.props.colorRange || [
            [254, 217, 118, 85],
            [254, 178, 76, 127],
            [253, 141, 60, 170],
            [252, 78, 42, 212],
            [227, 26, 28, 255],
            [189, 0, 38, 255],
          ],
          coverage: config.props.coverage || 1,
          upperPercentile: config.props.upperPercentile || 100,
          gpuAggregation: true,
          parameters: glParameters,
        });

      case 'column':
        return new ColumnLayer({
          ...baseProps,
          data: config.props.data || [],
          getPosition: (d: any) => [d.longitude, d.latitude],
          getElevation: config.props.getElevation || ((d: any) => d.elevation || 1000),
          getFillColor: config.props.getFillColor || [255, 140, 0, 255],
          getLineColor: config.props.getLineColor || [0, 0, 0],
          radius: config.props.radius || 100,
          elevationScale: config.props.elevationScale || 1,
          extruded: true,
          wireframe: config.props.wireframe || false,
          material: {
            ambient: 0.4,
            diffuse: 0.6,
            shininess: 32,
            specularColor: [51, 51, 51],
          },
          parameters: glParameters,
        });

      case 'tile':
        return new TileLayer({
          ...baseProps,
          data: config.props.tileData || [],
          getTileData: config.props.getTileData,
          maxRequests: config.props.maxRequests || 6,
          maxCacheSize: config.props.maxCacheSize || 128,
          refinementStrategy: 'best-available',
          renderSubLayers: config.props.renderSubLayers,
          parameters: glParameters,
        });

      default:
        console.warn(`Unknown layer type: ${config.type}`);
        return null;
    }
  }

  initialize(config: GPURenderConfig): void {
    this.canvas = config.canvas;
    this.setupPerformanceMonitoring();

    this.deck = new Deck({
      canvas: this.canvas,
      width: this.canvas.width,
      height: this.canvas.height,
      initialViewState: config.viewState,
      controller: config.controller,
      layers: [],
      effects: config.effects || [],
      parameters: {
        depthTest: true,
        depthMask: false,
        ...config.parameters,
      },
      onViewStateChange: this.handleViewStateChange.bind(this),
      onLoad: this.handleDeckLoad.bind(this),
      onAfterRender: this.handleAfterRender.bind(this),
    });

    // Add initial layers
    config.layers.forEach(layer => this.addLayer(layer));
    this.startRenderLoop();
  }

  private handleViewStateChange(viewState: any): void {
    // Handle view state changes for LOD and performance optimization
    if (this.deck) {
      this.deck.setProps({ initialViewState: viewState });
    }
  }

  private handleDeckLoad(): void {
    console.log('Deck.gl initialized successfully');
  }

  private handleAfterRender(): void {
    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastFrameTime;

    if (deltaTime > 0) {
      this.metrics.fps = 1000 / deltaTime;
      this.metrics.frameTime = deltaTime;
    }

    this.lastFrameTime = currentTime;
    this.metrics.layerCount = this.layers.size;
  }

  private startRenderLoop(): void {
    const render = () => {
      if (this.deck) {
        const startTime = performance.now();
        this.deck.redraw();
        const endTime = performance.now();
        this.metrics.cpuTime = endTime - startTime;
      }
      this.animationFrameId = requestAnimationFrame(render);
    };

    this.animationFrameId = requestAnimationFrame(render);
  }

  addLayer(layerConfig: GPULayer): void {
    this.layers.set(layerConfig.id, layerConfig);
    const deckLayer = this.createDeckLayer(layerConfig);

    if (deckLayer && this.deck) {
      const currentLayers = this.deck.props.layers || [];
      this.deck.setProps({
        layers: [...currentLayers, deckLayer],
      });
    }
  }

  removeLayer(layerId: string): void {
    this.layers.delete(layerId);

    if (this.deck) {
      const currentLayers = this.deck.props.layers || [];
      const filteredLayers = currentLayers.filter((layer: any) => layer.id !== layerId);
      this.deck.setProps({ layers: filteredLayers });
    }
  }

  updateLayer(layerId: string, updates: Partial<GPULayer>): void {
    const existingLayer = this.layers.get(layerId);
    if (existingLayer) {
      const updatedLayer = { ...existingLayer, ...updates };
      this.layers.set(layerId, updatedLayer);
      this.removeLayer(layerId);
      this.addLayer(updatedLayer);
    }
  }

  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  captureScreenshot(format: 'png' | 'jpeg' = 'png', quality: number = 1.0): string | null {
    if (!this.canvas) return null;
    return this.canvas.toDataURL(`image/${format}`, quality);
  }

  dispose(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    if (this.performanceMonitor) {
      this.performanceMonitor.disconnect();
      this.performanceMonitor = null;
    }

    if (this.deck) {
      this.deck.finalize();
      this.deck = null;
    }

    this.layers.clear();
    this.canvas = null;
  }
}

export const gpuWebGLRenderingService = new GPUWebGLRenderingService();
