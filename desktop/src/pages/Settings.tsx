import { useState, useEffect } from 'react'

interface AppSettings {
  xhs_username: string
  xhs_password: string
  wechat_app_id: string
  wechat_app_secret: string
  wechat_mpid: string
  xiaohongshu_advanced_mode: string
  xiaohongshu_cdp_port: string
  xiaohongshu_profile_dir: string
}

type TestState = 'idle' | 'testing' | 'ok' | 'fail'
type CdpState = 'unknown' | 'checking' | 'connected' | 'disconnected'
interface ChromeProfile { folder: string; fullPath: string; name: string; email: string }

export default function Settings() {
  const [form, setForm] = useState<AppSettings>({
    xhs_username: '', xhs_password: '',
    wechat_app_id: '', wechat_app_secret: '', wechat_mpid: '',
    xiaohongshu_advanced_mode: '',
    xiaohongshu_cdp_port: '9222',
    xiaohongshu_profile_dir: '',
  })
  const [saved, setSaved] = useState(false)
  const [testState, setTestState] = useState<TestState>('idle')
  const [testMsg, setTestMsg] = useState('')
  const [xhsLoggedIn, setXhsLoggedIn] = useState(false)
  const [xhsLogging, setXhsLogging] = useState(false)
  const [chromeProfiles, setChromeProfiles] = useState<ChromeProfile[]>([])
  const [cdpState, setCdpState] = useState<CdpState>('unknown')
  const [launching, setLaunching] = useState(false)

  useEffect(() => {
    (window as any).xhs.settingsLoad().then((s: AppSettings) => setForm(s))
    ;(window as any).xhs.xiaohongshuLoginStatus().then((r: { loggedIn: boolean }) => setXhsLoggedIn(r.loggedIn))
    ;(window as any).xhs.listChromeProfiles().then((p: ChromeProfile[]) => setChromeProfiles(p))
  }, [])

  function update(key: keyof AppSettings, val: string) {
    setForm(f => ({ ...f, [key]: val }))
    setSaved(false)
    if (key === 'xhs_username' || key === 'xhs_password') setTestState('idle')
  }

  async function save() {
    await (window as any).xhs.settingsSave(form)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function checkCdp() {
    const port = parseInt(form.xiaohongshu_cdp_port || '9222', 10)
    setCdpState('checking')
    try {
      const r = await (window as any).xhs.xiaohongshuCdpStatus(port)
      setCdpState(r.connected ? 'connected' : 'disconnected')
    } catch {
      setCdpState('disconnected')
    }
  }

  async function launchChrome() {
    if (!form.xiaohongshu_profile_dir) {
      alert('Please select a Chrome profile directory first.')
      return
    }
    const port = parseInt(form.xiaohongshu_cdp_port || '9222', 10)
    setLaunching(true)
    setCdpState('checking')
    try {
      await (window as any).xhs.xiaohongshuLaunchChrome(form.xiaohongshu_profile_dir, port)
      // Poll for CDP to become ready (up to 15s)
      const deadline = Date.now() + 15000
      while (Date.now() < deadline) {
        await new Promise(r => setTimeout(r, 1000))
        const r = await (window as any).xhs.xiaohongshuCdpStatus(port)
        if (r.connected) { setCdpState('connected'); return }
      }
      setCdpState('disconnected')
    } catch (e: any) {
      setCdpState('disconnected')
      alert('Launch failed: ' + (e.message || e))
    } finally {
      setLaunching(false)
    }
  }

  async function xhsLogin() {
    setXhsLogging(true)
    try {
      await (window as any).xhs.xiaohongshuLogin()
      setXhsLoggedIn(true)
    } catch (e: any) {
      alert('Login failed: ' + (e.message || e))
    } finally {
      setXhsLogging(false)
    }
  }

  async function testXhsConnection() {
    setTestState('testing')
    setTestMsg('')
    try {
      await (window as any).xhs.testXhsConnection(form.xhs_username, form.xhs_password)
      setTestState('ok')
      setTestMsg('Login successful')
    } catch (e: any) {
      setTestState('fail')
      // Strip Electron IPC prefix from message
      const msg = (e.message || 'Connection failed').replace(/^Error invoking remote method '[^']+': /, '')
      setTestMsg(msg)
    }
  }

  return (
    <>
      <div className="topbar">
        <span className="topbar-title">Settings</span>
        <button className="btn btn-primary" onClick={save}>
          {saved ? '✓ Saved' : 'Save'}
        </button>
      </div>
      <div className="content" style={{ maxWidth: 580 }}>

        {/* 小黑书 */}
        <Section title="小黑书 · xiaoheishu.xyz" badge="Publishing target">
          <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 14 }}>
            Posts will be published to <code>{form.xhs_username || 'username'}.xiaoheishu.xyz</code>
          </p>
          <Field label="Username">
            <input className="editor-input" value={form.xhs_username}
              onChange={e => update('xhs_username', e.target.value)}
              placeholder="sunshine" />
          </Field>
          <Field label="Password">
            <input className="editor-input" type="password" value={form.xhs_password}
              onChange={e => update('xhs_password', e.target.value)}
              placeholder="••••••••" />
          </Field>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
            <button
              className="btn"
              style={{ fontSize: 12, padding: '4px 12px' }}
              disabled={testState === 'testing' || !form.xhs_username || !form.xhs_password}
              onClick={testXhsConnection}
            >
              {testState === 'testing' ? 'Testing…' : 'Test Connection'}
            </button>
            {testMsg && (
              <span style={{ fontSize: 12, color: testState === 'ok' ? '#4ade80' : 'var(--error, #f87171)' }}>
                {testState === 'ok' ? '✓ ' : '✗ '}{testMsg}
              </span>
            )}
          </div>
        </Section>

        {/* 微信公众号 */}
        <Section title="微信公众号" badge="WeChat Official Account">
          <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 14 }}>
            Get credentials from <a href="https://mp.weixin.qq.com" target="_blank" style={{ color: 'var(--accent)' }}>mp.weixin.qq.com</a> → 开发 → 基本配置
          </p>
          <Field label="AppID">
            <input className="editor-input" value={form.wechat_app_id}
              onChange={e => update('wechat_app_id', e.target.value)}
              placeholder="wx1234567890abcdef" />
          </Field>
          <Field label="AppSecret">
            <input className="editor-input" type="password" value={form.wechat_app_secret}
              onChange={e => update('wechat_app_secret', e.target.value)}
              placeholder="••••••••••••••••••••••••••••••••" />
          </Field>
          <Field label="Media Platform ID (MPID)">
            <input className="editor-input" value={form.wechat_mpid}
              onChange={e => update('wechat_mpid', e.target.value)}
              placeholder="Your official account ID" />
          </Field>
          <StatusRow
            label="Credentials"
            status={form.wechat_app_id && form.wechat_app_secret ? 'configured' : 'not_set'}
          />
        </Section>

        {/* 小红书 */}
        <Section title="小红书" badge="QR Login">
          <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 14 }}>
            No password stored. Logs in via QR code scan — session cookies are saved locally and reused for publishing.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <StatusRow label="Session" status={xhsLoggedIn ? 'configured' : 'not_set'} />
            <button
              className="btn"
              style={{ fontSize: 12, padding: '4px 14px', marginLeft: 'auto' }}
              disabled={xhsLogging}
              onClick={xhsLogin}
            >
              {xhsLogging ? 'Opening browser…' : xhsLoggedIn ? 'Re-login' : 'Login via QR Code'}
            </button>
          </div>
          {xhsLogging && (
            <p style={{ fontSize: 12, color: 'var(--muted)' }}>
              A browser window has opened. Scan the QR code with your 小红书 app to log in. This window will close automatically.
            </p>
          )}

          {/* Advanced mode divider */}
          <div style={{ borderTop: '1px solid var(--border)', margin: '8px 0' }} />

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <input
              type="checkbox"
              id="xhs-advanced"
              checked={form.xiaohongshu_advanced_mode === 'true'}
              onChange={e => update('xiaohongshu_advanced_mode', e.target.checked ? 'true' : '')}
              style={{ accentColor: 'var(--accent)', marginTop: 3, flexShrink: 0 }}
            />
            <div>
              <label htmlFor="xhs-advanced" style={{ fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                Advanced mode — use your Chrome session (recommended)
              </label>
              <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4, lineHeight: 1.6 }}>
                Connects to your real Chrome via CDP debug port. Your existing 小红书 login in Chrome is reused directly —
                no QR code needed. <strong style={{ color: 'var(--text)' }}>Chrome must be launched with the debug port first</strong> (use the button below).
              </p>
            </div>
          </div>

          {form.xiaohongshu_advanced_mode === 'true' && (
            <>
              <Field label="Chrome Profile Directory">
                {chromeProfiles.length > 0 ? (
                  <>
                    <select
                      className="editor-input"
                      value={form.xiaohongshu_profile_dir}
                      onChange={e => update('xiaohongshu_profile_dir', e.target.value)}
                      style={{ cursor: 'pointer' }}
                    >
                      <option value="">— select a profile —</option>
                      {chromeProfiles.map(p => (
                        <option key={p.folder} value={p.fullPath}>
                          {p.folder} — {p.name}{p.email ? ` (${p.email})` : ''}
                        </option>
                      ))}
                    </select>
                    <input className="editor-input" value={form.xiaohongshu_profile_dir}
                      onChange={e => update('xiaohongshu_profile_dir', e.target.value)}
                      placeholder="~/Library/Application Support/Google/Chrome/Profile 4"
                      style={{ marginTop: 6 }} />
                  </>
                ) : (
                  <input className="editor-input" value={form.xiaohongshu_profile_dir}
                    onChange={e => update('xiaohongshu_profile_dir', e.target.value)}
                    placeholder="~/Library/Application Support/Google/Chrome/Profile 4" />
                )}
              </Field>
              <Field label="CDP Port">
                <input className="editor-input" value={form.xiaohongshu_cdp_port}
                  onChange={e => update('xiaohongshu_cdp_port', e.target.value)}
                  placeholder="9222" style={{ width: 100 }} />
              </Field>

              {/* CDP status + launch button */}
              <div style={{
                background: 'var(--surface2)', borderRadius: 8, padding: '12px 14px', fontSize: 12, lineHeight: 1.7,
              }}>
                <p style={{ color: 'var(--text)', marginBottom: 6, fontWeight: 500 }}>Step 1 — Launch Chrome with debug port</p>
                <p style={{ color: 'var(--muted)', marginBottom: 10 }}>
                  This will close your existing Chrome and reopen it with the selected profile + debug port {form.xiaohongshu_cdp_port || '9222'}.
                  Your 小红书 login session in that profile will be reused for publishing.
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <button
                    className="btn"
                    style={{ fontSize: 12, padding: '4px 14px' }}
                    disabled={launching || !form.xiaohongshu_profile_dir}
                    onClick={launchChrome}
                  >
                    {launching ? 'Launching…' : 'Launch Chrome with Debug Port'}
                  </button>
                  <button
                    className="btn"
                    style={{ fontSize: 12, padding: '4px 10px' }}
                    onClick={checkCdp}
                    disabled={cdpState === 'checking'}
                  >
                    {cdpState === 'checking' ? 'Checking…' : 'Check Connection'}
                  </button>
                  {cdpState === 'connected' && (
                    <span style={{ fontSize: 12, color: '#4ade80' }}>● Connected</span>
                  )}
                  {cdpState === 'disconnected' && (
                    <span style={{ fontSize: 12, color: '#f87171' }}>● Not connected — launch Chrome first</span>
                  )}
                </div>
                <p style={{ color: '#f87171', marginTop: 8, marginBottom: 0 }}>
                  ⚠ Security: any local process can connect to this debug port. Personal machine only.
                </p>
              </div>
              <StatusRow label="Profile" status={form.xiaohongshu_profile_dir ? 'configured' : 'not_set'} />
            </>
          )}
        </Section>

      </div>
    </>
  )
}

function Section({ title, badge, children }: {
  title: string; badge?: string; children: React.ReactNode
}) {
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 10, padding: 20, marginBottom: 20,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <span style={{ fontWeight: 600, fontSize: 15 }}>{title}</span>
        {badge && (
          <span style={{
            fontSize: 10, background: 'var(--surface2)', color: 'var(--muted)',
            padding: '2px 8px', borderRadius: 100,
          }}>{badge}</span>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {children}
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
        {label}
      </div>
      {children}
    </div>
  )
}

function StatusRow({ label, status }: { label: string; status: 'configured' | 'not_set' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, marginTop: 4 }}>
      <span style={{
        width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
        background: status === 'configured' ? '#4ade80' : 'var(--border)',
      }} />
      <span style={{ color: 'var(--muted)' }}>
        {label}: {status === 'configured' ? 'Configured' : 'Not set'}
      </span>
    </div>
  )
}
