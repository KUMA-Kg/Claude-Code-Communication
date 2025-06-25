export class PerformanceMonitor {
  private fps: number = 0;
  private frameCount: number = 0;
  private lastTime: number = performance.now();
  private fpsHistory: number[] = [];
  private maxHistorySize: number = 60;
  
  // FPS計測開始
  startFPSMonitoring(callback?: (fps: number) => void) {
    const measureFPS = () => {
      const currentTime = performance.now();
      const deltaTime = currentTime - this.lastTime;
      
      if (deltaTime >= 1000) {
        this.fps = Math.round((this.frameCount * 1000) / deltaTime);
        this.fpsHistory.push(this.fps);
        
        if (this.fpsHistory.length > this.maxHistorySize) {
          this.fpsHistory.shift();
        }
        
        if (callback) {
          callback(this.fps);
        }
        
        // グローバル変数に設定（テスト用）
        (window as any).currentFPS = this.fps;
        (window as any).averageFPS = this.getAverageFPS();
        
        this.frameCount = 0;
        this.lastTime = currentTime;
      }
      
      this.frameCount++;
      requestAnimationFrame(measureFPS);
    };
    
    requestAnimationFrame(measureFPS);
  }
  
  // 平均FPS取得
  getAverageFPS(): number {
    if (this.fpsHistory.length === 0) return 0;
    const sum = this.fpsHistory.reduce((a, b) => a + b, 0);
    return Math.round(sum / this.fpsHistory.length);
  }
  
  // パフォーマンスメトリクス取得
  getPerformanceMetrics() {
    const memory = (performance as any).memory;
    
    return {
      fps: this.fps,
      averageFPS: this.getAverageFPS(),
      minFPS: Math.min(...this.fpsHistory),
      maxFPS: Math.max(...this.fpsHistory),
      memoryUsed: memory ? Math.round(memory.usedJSHeapSize / 1048576) : 0, // MB
      memoryTotal: memory ? Math.round(memory.totalJSHeapSize / 1048576) : 0, // MB
    };
  }
  
  // レンダリング最適化チェック
  checkOptimizations(): string[] {
    const issues: string[] = [];
    const metrics = this.getPerformanceMetrics();
    
    if (metrics.averageFPS < 30) {
      issues.push('Average FPS below 30 - Consider reducing polygon count or effects');
    }
    
    if (metrics.minFPS < 20) {
      issues.push('Minimum FPS below 20 - Performance spikes detected');
    }
    
    if (metrics.memoryUsed > 500) {
      issues.push('High memory usage detected - Consider optimizing textures and geometries');
    }
    
    return issues;
  }
}

// シングルトンインスタンス
export const performanceMonitor = new PerformanceMonitor();