# IT補助金アシストツール デプロイメントガイド

## 目次
- [概要](#概要)
- [環境要件](#環境要件)
- [事前準備](#事前準備)
- [デプロイメント手順](#デプロイメント手順)
- [モニタリング・監視](#モニタリング監視)
- [トラブルシューティング](#トラブルシューティング)
- [セキュリティ運用](#セキュリティ運用)

## 概要

本ガイドでは、IT補助金アシストツールを本番環境にデプロイし、運用するための手順を説明します。

### アーキテクチャ概要
- **フロントエンド**: React 18 + TypeScript
- **バックエンド**: Node.js + Express
- **データベース**: PostgreSQL (Supabase)
- **コンテナ**: Docker + Kubernetes
- **CI/CD**: GitHub Actions
- **監視**: Prometheus + Grafana

## 環境要件

### 必要リソース

**本番環境**:
- CPU: 4 vCPU以上
- メモリ: 8GB以上
- ストレージ: 100GB以上 (SSD推奨)
- ネットワーク: 1Gbps以上

**ステージング環境**:
- CPU: 2 vCPU以上
- メモリ: 4GB以上
- ストレージ: 50GB以上

### 必要なサービス・ツール
- Kubernetes Cluster (v1.25以上)
- Docker Registry (GitHub Container Registry推奨)
- SSL証明書 (Let's Encrypt or 商用証明書)
- ドメイン名
- メール送信サービス (SendGrid等)

## 事前準備

### 1. 環境変数設定

本番環境用の環境変数ファイルを作成：

```bash
# .env.production
NODE_ENV=production
PORT=3000

# データベース
DATABASE_URL=postgresql://user:password@host:5432/dbname
REDIS_URL=redis://redis-host:6379

# 認証
JWT_SECRET=your-super-secure-jwt-secret-key
JWT_EXPIRES_IN=24h
REFRESH_TOKEN_EXPIRES_IN=7d

# 外部API
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-key
OPENAI_API_KEY=your-openai-key

# セキュリティ
ENCRYPTION_KEY=32-byte-hex-encryption-key
CSRF_SECRET=your-csrf-secret
SESSION_SECRET=your-session-secret

# メール
SENDGRID_API_KEY=your-sendgrid-key
FROM_EMAIL=noreply@your-domain.com

# 監視
SENTRY_DSN=https://your-sentry-dsn
PROMETHEUS_ENDPOINT=http://prometheus:9090

# SSL/TLS
SSL_CERT_PATH=/certs/fullchain.pem
SSL_KEY_PATH=/certs/privkey.pem
```

### 2. Kubernetes設定

**Namespace作成**:
```yaml
# k8s/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: it-subsidy-assistant
  labels:
    name: it-subsidy-assistant
```

**ConfigMap作成**:
```yaml
# k8s/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
  namespace: it-subsidy-assistant
data:
  NODE_ENV: "production"
  PORT: "3000"
  LOG_LEVEL: "info"
```

**Secret作成**:
```yaml
# k8s/secret.yaml
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
  namespace: it-subsidy-assistant
type: Opaque
data:
  DATABASE_URL: <base64-encoded-url>
  JWT_SECRET: <base64-encoded-secret>
  OPENAI_API_KEY: <base64-encoded-key>
```

### 3. SSL証明書設定

**Let's Encrypt with cert-manager**:
```yaml
# k8s/certificate.yaml
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: it-subsidy-tls
  namespace: it-subsidy-assistant
spec:
  secretName: it-subsidy-tls
  issuerRef:
    name: letsencrypt-prod
    kind: ClusterIssuer
  dnsNames:
  - it-subsidy-assistant.com
  - api.it-subsidy-assistant.com
```

## デプロイメント手順

### 1. コンテナイメージビルド

```bash
# ローカルでのビルド・テスト
docker build -t it-subsidy-assistant:latest .
docker run --rm -p 3000:3000 it-subsidy-assistant:latest

# GitHub Container Registryにプッシュ
docker tag it-subsidy-assistant:latest ghcr.io/your-org/it-subsidy-assistant:latest
docker push ghcr.io/your-org/it-subsidy-assistant:latest
```

### 2. Kubernetesデプロイメント

**Deployment設定**:
```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: it-subsidy-assistant
  namespace: it-subsidy-assistant
spec:
  replicas: 3
  selector:
    matchLabels:
      app: it-subsidy-assistant
  template:
    metadata:
      labels:
        app: it-subsidy-assistant
    spec:
      containers:
      - name: app
        image: ghcr.io/your-org/it-subsidy-assistant:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        envFrom:
        - configMapRef:
            name: app-config
        - secretRef:
            name: app-secrets
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
```

**Service設定**:
```yaml
# k8s/service.yaml
apiVersion: v1
kind: Service
metadata:
  name: it-subsidy-assistant-service
  namespace: it-subsidy-assistant
spec:
  selector:
    app: it-subsidy-assistant
  ports:
    - protocol: TCP
      port: 80
      targetPort: 3000
  type: ClusterIP
```

**Ingress設定**:
```yaml
# k8s/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: it-subsidy-assistant-ingress
  namespace: it-subsidy-assistant
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/force-ssl-redirect: "true"
spec:
  tls:
  - hosts:
    - it-subsidy-assistant.com
    secretName: it-subsidy-tls
  rules:
  - host: it-subsidy-assistant.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: it-subsidy-assistant-service
            port:
              number: 80
```

### 3. デプロイスクリプト実行

```bash
#!/bin/bash
# scripts/deploy.sh

set -e

echo "🚀 Starting deployment..."

# 1. Kubernetesリソース適用
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secret.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/ingress.yaml

# 2. デプロイメント完了待機
kubectl rollout status deployment/it-subsidy-assistant -n it-subsidy-assistant

# 3. ヘルスチェック
echo "⏳ Waiting for health check..."
sleep 30
curl -f https://it-subsidy-assistant.com/health || exit 1

# 4. 監視設定
kubectl apply -f monitoring/prometheus-config.yaml
kubectl apply -f monitoring/grafana-dashboard.yaml

echo "✅ Deployment completed successfully!"
echo "🌐 Application URL: https://it-subsidy-assistant.com"
```

## モニタリング・監視

### 1. Prometheus設定

```yaml
# monitoring/prometheus-config.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-config
data:
  prometheus.yml: |
    global:
      scrape_interval: 15s
    scrape_configs:
    - job_name: 'it-subsidy-assistant'
      static_configs:
      - targets: ['it-subsidy-assistant-service:80']
      metrics_path: '/metrics'
```

### 2. アラート設定

```yaml
# monitoring/alerts.yaml
groups:
- name: it-subsidy-assistant-alerts
  rules:
  - alert: HighErrorRate
    expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
    for: 5m
    labels:
      severity: critical
    annotations:
      summary: "High error rate detected"
      
  - alert: HighMemoryUsage
    expr: container_memory_usage_bytes / container_spec_memory_limit_bytes > 0.8
    for: 10m
    labels:
      severity: warning
    annotations:
      summary: "High memory usage detected"
```

### 3. ログ管理

```bash
# logs/logging-config.yaml
apiVersion: logging.coreos.com/v1
kind: ClusterLogForwarder
metadata:
  name: it-subsidy-assistant-logs
spec:
  outputs:
  - name: elasticsearch
    type: elasticsearch
    url: https://elasticsearch.example.com:9200
  pipelines:
  - name: app-logs
    inputRefs:
    - application
    filterRefs:
    - json-filter
    outputRefs:
    - elasticsearch
```

## トラブルシューティング

### よくある問題と対処法

**1. デプロイメントが失敗する**
```bash
# Pod状態確認
kubectl get pods -n it-subsidy-assistant
kubectl describe pod <pod-name> -n it-subsidy-assistant
kubectl logs <pod-name> -n it-subsidy-assistant

# イベント確認
kubectl get events -n it-subsidy-assistant --sort-by='.lastTimestamp'
```

**2. データベース接続エラー**
```bash
# データベース接続テスト
kubectl exec -it <pod-name> -n it-subsidy-assistant -- psql $DATABASE_URL -c "SELECT 1;"

# 接続プール確認
kubectl exec -it <pod-name> -n it-subsidy-assistant -- npm run db:status
```

**3. メモリ不足**
```bash
# リソース使用状況確認
kubectl top pods -n it-subsidy-assistant
kubectl describe node <node-name>

# リソース制限調整
kubectl patch deployment it-subsidy-assistant -n it-subsidy-assistant -p '{"spec":{"template":{"spec":{"containers":[{"name":"app","resources":{"limits":{"memory":"2Gi"}}}]}}}}'
```

**4. SSL証明書の問題**
```bash
# 証明書状態確認
kubectl describe certificate it-subsidy-tls -n it-subsidy-assistant
kubectl describe certificaterequest -n it-subsidy-assistant

# 手動更新
kubectl delete certificate it-subsidy-tls -n it-subsidy-assistant
kubectl apply -f k8s/certificate.yaml
```

## セキュリティ運用

### 1. 定期的なセキュリティチェック

```bash
#!/bin/bash
# scripts/security-check.sh

echo "🔒 Running security checks..."

# 脆弱性スキャン
npm audit --audit-level high
docker scan ghcr.io/your-org/it-subsidy-assistant:latest

# OWASP ZAP スキャン
docker run -t owasp/zap2docker-stable zap-baseline.py \
  -t https://it-subsidy-assistant.com

# SSL設定チェック
testssl.sh --full https://it-subsidy-assistant.com

echo "✅ Security checks completed"
```

### 2. バックアップ・復旧

```bash
#!/bin/bash
# scripts/backup.sh

# データベースバックアップ
pg_dump $DATABASE_URL > backup/db_$(date +%Y%m%d_%H%M%S).sql

# 設定ファイルバックアップ
kubectl get configmap app-config -n it-subsidy-assistant -o yaml > backup/configmap.yaml
kubectl get secret app-secrets -n it-subsidy-assistant -o yaml > backup/secrets.yaml

# S3にアップロード
aws s3 cp backup/ s3://your-backup-bucket/$(date +%Y%m%d)/ --recursive
```

### 3. ログローテーション・監査

```bash
# 監査ログの確認
kubectl logs -l app=it-subsidy-assistant -n it-subsidy-assistant | grep "AUDIT"

# セキュリティイベントの監視
kubectl logs -l app=it-subsidy-assistant -n it-subsidy-assistant | grep -E "(UNAUTHORIZED|FORBIDDEN|SECURITY_VIOLATION)"
```

## 運用チェックリスト

### デプロイ前
- [ ] 環境変数設定完了
- [ ] SSL証明書準備完了
- [ ] データベース移行完了
- [ ] セキュリティスキャン実行
- [ ] 負荷テスト実行
- [ ] バックアップ設定完了

### デプロイ後
- [ ] ヘルスチェック通過
- [ ] 全機能動作確認
- [ ] パフォーマンス確認
- [ ] アラート設定確認
- [ ] ログ出力確認
- [ ] セキュリティ監視確認

### 定期運用
- [ ] 週次セキュリティスキャン
- [ ] 月次バックアップ検証
- [ ] 四半期災害復旧テスト
- [ ] 半年次セキュリティ監査
- [ ] 年次ペネトレーションテスト

---

**作成日**: 2025-01-15  
**作成者**: Worker3 - DevOps/Security Specialist  
**バージョン**: 1.0.0