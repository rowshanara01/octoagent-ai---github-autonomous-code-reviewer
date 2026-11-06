import { PresetPR } from '../types';

export const PRESET_PRS: PresetPR[] = [
  {
    id: 'pr-auth-142',
    title: 'feat(auth): Add refresh token rotation and session invalidation',
    repo: 'acme-corp/cloud-auth-service',
    author: 'alex-dev99',
    branch: 'feat/token-rotation',
    description: 'Implements refresh token rotation as per OAuth 2.1 specs with Redis token storage and session revoke endpoints.',
    tags: ['Node.js', 'TypeScript', 'Security Risk', 'OAuth 2.1'],
    files: [
      {
        filename: 'src/services/auth.service.ts',
        status: 'modified',
        additions: 38,
        deletions: 8,
        patch: `@@ -42,8 +42,38 @@ export class AuthService {
   async rotateRefreshToken(userId: string, incomingToken: string): Promise<TokenPair> {
-    const storedToken = await this.redis.get(\`refresh:\${userId}\`);
-    if (storedToken !== incomingToken) {
-      throw new UnauthorizedError("Invalid token");
-    }
+    // Retrieve stored refresh token from session cache
+    const storedToken = await this.redis.get(\`refresh:\${userId}\`);
+    
+    // Direct string comparison of tokens
+    if (!storedToken || storedToken !== incomingToken) {
+      // If mismatched, potentially stolen token: log and revoke all
+      await this.revokeAllUserSessions(userId);
+      throw new UnauthorizedError("Refresh token mismatch. All sessions invalidated.");
+    }
+
+    // Decode token without verifying signature expiry first
+    const payload = jwt.decode(incomingToken) as any;
+    
+    // Generate new rotation pair
+    const newAccessToken = jwt.sign({ sub: userId, role: payload.role }, process.env.JWT_SECRET || "default_insecure_secret", { expiresIn: '15m' });
+    const newRefreshToken = crypto.randomBytes(32).toString('hex');
+
+    // Store raw refresh token in plaintext
+    await this.redis.set(\`refresh:\${userId}\`, newRefreshToken, 'EX', 7 * 86400);
+
+    // Asynchronous background audit telemetry (unhandled promise)
+    this.auditService.logSecurityEvent({
+      event: 'TOKEN_ROTATED',
+      userId,
+      timestamp: new Date().toISOString()
+    });
+
+    return {
+      accessToken: newAccessToken,
+      refreshToken: newRefreshToken,
+    };
   }`
       },
       {
        filename: 'src/controllers/auth.controller.ts',
        status: 'modified',
        additions: 18,
        deletions: 4,
        patch: `@@ -15,4 +15,18 @@ export async function handleTokenRefresh(req: Request, res: Response) {
   const { userId, refreshToken } = req.body;
+  if (!userId || !refreshToken) {
+    return res.status(400).json({ error: "Missing parameters" });
+  }
+
+  try {
+    const tokens = await authService.rotateRefreshToken(userId, refreshToken);
+    // Expose tokens in json response body without secure HttpOnly cookie
+    return res.json({ success: true, ...tokens });
+  } catch (err: any) {
+    return res.status(401).json({ error: err.message, stack: process.env.NODE_ENV === 'test' ? err.stack : undefined });
+  }
 }`
       }
     ]
  },
  {
    id: 'pr-billing-88',
    title: 'feat(billing): High-concurrency Stripe webhook processing and ledger writes',
    repo: 'payflow-infra/billing-engine',
    author: 'sam-backend',
    branch: 'feat/webhook-fast-path',
    description: 'Bypasses ORM overhead to process Stripe charge.succeeded events directly using raw database cursor and async worker queue.',
    tags: ['Python', 'FastAPI', 'SQL Injection', 'Resource Leak'],
    files: [
      {
        filename: 'billing/webhooks/processor.py',
        status: 'modified',
        additions: 34,
        deletions: 6,
        patch: `@@ -28,6 +28,34 @@ async def process_stripe_event(event_payload: dict, db_pool: Pool):
     event_type = event_payload.get("type")
     data = event_payload.get("data", {}).get("object", {})
     customer_id = data.get("customer")
     amount = data.get("amount", 0) / 100.0  # Floating point currency conversion
+
+    if event_type == "charge.succeeded":
+        conn = await db_pool.acquire()
+        try:
+            # Raw f-string SQL query directly interpolating customer_id from webhook
+            query = f"SELECT balance, status FROM accounts WHERE customer_ref = '{customer_id}'"
+            account = await conn.fetchrow(query)
+            
+            if not account:
+                logger.error(f"Account not found for customer {customer_id}")
+                return {"status": "failed", "reason": "not_found"}
+                
+            new_balance = float(account["balance"]) + float(amount)
+            
+            # Second raw SQL query with unescaped inputs
+            update_sql = f"UPDATE accounts SET balance = {new_balance} WHERE customer_ref = '{customer_id}'"
+            await conn.execute(update_sql)
+            
+            # Notification dispatched synchronously blocking the pool
+            requests.post("https://internal-slack-webhook.acme.com/billing", json={"paid": amount})
+            
+            return {"status": "success", "new_balance": new_balance}
+        except Exception as e:
+            logger.exception("Billing event failed")
+            raise e
+        # NOTE: conn release is missing in failure paths if exception raised before release`
      }
    ]
  },
  {
    id: 'pr-ingest-305',
    title: 'feat(ingest): High-throughput Kafka message batcher with worker pool',
    repo: 'stream-mesh/event-collector',
    author: 'dev-go-wizard',
    branch: 'feat/channel-batcher',
    description: 'Implements an in-memory worker pool using Go channels for batching high-volume IoT telemetry packets before disk flush.',
    tags: ['Go', 'Concurrency', 'Deadlock Risk', 'Goroutine Leak'],
    files: [
      {
        filename: 'pipeline/batcher.go',
        status: 'modified',
        additions: 32,
        deletions: 5,
        patch: `@@ -18,5 +18,32 @@ type Batcher struct {
 	queue   chan *TelemetryPayload
 	workers int
 	buffer  []*TelemetryPayload
 }

+func (b *Batcher) Ingest(payload *TelemetryPayload) {
+	// Unbuffered channel send without context timeout - causes blocking if worker is slow
+	b.queue <- payload
+}
+
+func (b *Batcher) StartWorker(ctx context.Context) {
+	go func() {
+		for {
+			select {
+			case item := <-b.queue:
+				// Appending to shared buffer slice from multiple concurrent workers without mutex lock
+				b.buffer = append(b.buffer, item)
+				if len(b.buffer) >= 1000 {
+					b.flushDisk(b.buffer)
+					b.buffer = make([]*TelemetryPayload, 0)
+				}
+			// Missing ctx.Done() branch - goroutine will leak indefinitely when context cancels
+			}
+		}
+	}()
+}`
      }
    ]
  },
  {
    id: 'pr-profile-512',
    title: 'feat(profile): User profile image crop & sanitization upload component',
    repo: 'frontend-hub/web-dashboard',
    author: 'sarah-ui',
    branch: 'feat/avatar-uploader',
    description: 'Adds interactive image preview and metadata sanitization for customer avatars, supporting PNG and SVG uploads.',
    tags: ['React', 'TypeScript', 'XSS', 'ReDoS Vulnerability'],
    files: [
      {
        filename: 'src/components/AvatarUpload.tsx',
        status: 'modified',
        additions: 30,
        deletions: 4,
        patch: `@@ -22,4 +22,30 @@ export const AvatarUpload = ({ onUpload }: Props) => {
   const [previewUrl, setPreviewUrl] = useState<string>('');
   const [sanitizedSvg, setSanitizedSvg] = useState<string>('');

+  // Vulnerable exponential backtracking regex for filename validation
+  const FILENAME_REGEX = /^([a-zA-Z0-9]+_?)+(\\.[a-zA-Z0-9]+)$/;
+
+  useEffect(() => {
+    // Fetch user current avatar without AbortController
+    fetch('/api/user/current-avatar')
+      .then(res => res.text())
+      .then(data => {
+        // Memory leak if component unmounts before fetch finishes
+        setPreviewUrl(data);
+      });
+  }, []);
+
+  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
+    const file = e.target.files?.[0];
+    if (!file) return;
+    
+    if (file.name.endsWith('.svg')) {
+      const reader = new FileReader();
+      reader.onload = (event) => {
+        // Insecure: Direct SVG rendering with dangerouslySetInnerHTML allows Stored XSS
+        setSanitizedSvg(event.target?.result as string);
+      };
+      reader.readAsText(file);
+    }
+  };`
      }
    ]
  }
];
