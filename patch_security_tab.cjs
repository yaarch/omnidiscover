const fs = require('fs');
let code = fs.readFileSync('src/components/views/AdminView.tsx', 'utf8');

const startStr = "{activeTab === 'security' && (";
const startIdx = code.indexOf(startStr);

if (startIdx !== -1) {
    let bracketCount = 0;
    let endIdx = -1;
    let inBlock = false;
    for (let i = startIdx; i < code.length; i++) {
        if (code[i] === '{') {
            bracketCount++;
            inBlock = true;
        } else if (code[i] === '}') {
            bracketCount--;
        }
        if (inBlock && bracketCount === 0) {
            endIdx = i + 1;
            break;
        }
    }

    if (endIdx !== -1) {
        const replacement = `{activeTab === 'security' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200/80 shadow-xs space-y-6 max-w-4xl mx-auto">
          <div className="flex items-center gap-3 pb-4 border-b border-neutral-100">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-neutral-900">
                Security Overview
              </h3>
              <p className="text-xs text-neutral-500">
                Monitor authentication status, active sessions, and system audit logs.
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-neutral-50 p-5 rounded-2xl border border-neutral-200/80">
              <h4 className="text-sm font-bold text-neutral-900 mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Authentication Status
              </h4>
              <p className="text-xs text-neutral-600 mb-2">
                <strong>Status:</strong> Active & Authenticated
              </p>
              <p className="text-xs text-neutral-600 mb-2">
                <strong>Admin Email:</strong> {adminEmail || 'Unknown'}
              </p>
              <p className="text-xs text-neutral-600">
                <strong>MFA Status:</strong> Pending Configuration (Cloudflare Access Recommended)
              </p>
              <div className="mt-4">
                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 bg-rose-100 text-rose-700 hover:bg-rose-200 rounded-lg text-xs font-semibold transition-colors"
                >
                  Revoke Current Session
                </button>
              </div>
            </div>
            
            <div className="bg-neutral-50 p-5 rounded-2xl border border-neutral-200/80">
              <h4 className="text-sm font-bold text-neutral-900 mb-3 flex items-center gap-2">
                <Settings className="w-4 h-4 text-blue-500" />
                Cloudflare Settings
              </h4>
              <p className="text-xs text-neutral-600 mb-2">
                Password changes and secrets are managed securely via <strong>Cloudflare Secrets</strong>.
              </p>
              <p className="text-[11px] text-neutral-500 font-mono bg-white p-2 border border-neutral-200 rounded-xl">
                ADMIN_EMAIL<br/>
                ADMIN_PASSWORD_HASH<br/>
                SESSION_SECRET
              </p>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-bold text-neutral-900 mb-3 flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-500" />
              Recent Audit Log
            </h4>
            <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden">
              {auditLogs && auditLogs.length > 0 ? (
                <div className="divide-y divide-neutral-100 max-h-96 overflow-y-auto">
                  {auditLogs.map((log: any, i: number) => (
                    <div key={i} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-neutral-50 transition-colors">
                      <div>
                        <p className="text-xs font-bold text-neutral-900">{log.action}</p>
                        <p className="text-[11px] text-neutral-500">{log.details}</p>
                      </div>
                      <span className="text-[10px] font-mono text-neutral-400 bg-neutral-100 px-2 py-1 rounded-lg shrink-0">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-neutral-500">
                  No recent audit logs available.
                </div>
              )}
            </div>
          </div>

        </div>
      )}`;
        code = code.substring(0, startIdx) + replacement + code.substring(endIdx);
        fs.writeFileSync('src/components/views/AdminView.tsx', code);
        console.log('Replaced security tab successfully.');
    }
} else {
    console.log('Could not find start string.');
}
