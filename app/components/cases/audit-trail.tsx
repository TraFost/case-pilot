interface AuditLog {
  timestamp: string
  action: string
  actor: string
  justification: string
}

interface AuditTrailProps {
  logs: AuditLog[]
}

export default function AuditTrail({ logs }: AuditTrailProps) {
  return (
    <div className="bg-card rounded border border-border p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-foreground mb-4">
        Audit Trail
      </h2>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {logs.map((log, idx) => (
          <div
            key={idx}
            className="border-l-2 border-primary pl-3 py-2 text-xs"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <p className="font-mono text-primary">{log.timestamp}</p>
                <p className="font-semibold text-foreground mt-1">
                  {log.action}
                </p>
                <p className="text-muted-foreground mt-1 leading-relaxed">
                  {log.justification}
                </p>
              </div>
              <span className="text-muted-foreground whitespace-nowrap">
                {log.actor}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 p-2 bg-muted/30 rounded text-xs text-muted-foreground">
        <p>
          Total actions logged: <strong>{logs.length}</strong>
        </p>
      </div>
    </div>
  )
}
