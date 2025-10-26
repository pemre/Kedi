const { app } = require('electron');
const { spawn } = require('node:child_process');
const os = require('node:os');
const path = require('node:path');
const fs = require('node:fs');
const net = require('node:net');

// Pick a likely mpv binary path
function guessMpvPath() {
  const candidates = process.platform === 'darwin'
    ? ['/opt/homebrew/bin/mpv', '/usr/local/bin/mpv', '/usr/bin/mpv']
    : process.platform === 'win32'
    ? [
        'mpv.exe',
        path.join(process.env['ProgramFiles'] || 'C:\\Program Files', 'mpv', 'mpv.exe'),
        path.join(process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)', 'mpv', 'mpv.exe'),
      ]
    : ['/usr/bin/mpv', '/usr/local/bin/mpv'];

  for (const p of candidates) {
    try {
      fs.accessSync(p, fs.constants.X_OK);
      return p;
    } catch {}
  }
  // Fallback – rely on PATH
  return process.platform === 'win32' ? 'mpv.exe' : 'mpv';
}

function makeIpcPath() {
  if (process.platform === 'win32') {
    return `\\\\.\\pipe\\mpv-${process.pid}-${Date.now()}`;
  }
  return path.join(os.tmpdir(), `mpv-${process.pid}-${Date.now()}.sock`);
}

function jsonCmd(command) {
  return JSON.stringify({ command }) + '\n';
}

function createMpv(onExit) {
  return new Promise((resolve, reject) => {
    const mpvPath = guessMpvPath();
    const ipcPath = makeIpcPath();

    const args = [
      '--no-terminal',
      '--force-window=immediate',
      `--input-ipc-server=${ipcPath}`,
      // Keep mpv running to accept commands
      '--idle=yes',
      '--keep-open=yes',
      '--pause=no',
      // Caching helps for IPTV/HLS
      '--cache=yes',
      '--cache-secs=30',
      // Better streaming support
      '--demuxer-max-bytes=150M',
      '--demuxer-max-back-bytes=75M',
      // Start fullscreen
      '--fullscreen',
    ];

    const child = spawn(mpvPath, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let killed = false;

    child.on('error', (err) => reject(err));
    child.on('exit', (code) => {
      console.log('[mpv] process exited with code:', code);
      if (onExit && typeof onExit === 'function') {
        onExit();
      }
    });
    child.stderr.on('data', (d) => {
      // optional: log d.toString()
      console.log('[mpv]', d.toString());
    });

    // Connect to IPC after the socket appears
    const start = Date.now();
    const timeoutMs = 7000;

    function connect() {
      if (killed) return;
      if (Date.now() - start > timeoutMs) return reject(new Error('mpv IPC timeout'));

      const client = net.createConnection(ipcPath, () => {
        const send = (cmd) =>
          new Promise((res, rej) => {
            client.write(cmd, (err) => (err ? rej(err) : res()));
          });

        const run = (cmd) => send(jsonCmd(cmd));

        const controller = {
          load: async (url) => run(['loadfile', url, 'replace']),
          pause: async (v) => run(['set_property', 'pause', !!v]),
          seek: async (seconds, mode = 'relative') =>
            run(['seek', seconds, mode === 'absolute' ? 'absolute' : 'relative']),
          volume: async (v) => run(['set_property', 'volume', Math.max(0, Math.min(100, v))]),
          stop: async () => run(['stop']),
          setProperty: async (prop, value) => run(['set_property', prop, value]),
          kill: () => {
            killed = true;
            try { client.end(); } catch {}
            try { child.kill(); } catch {}
            if (process.platform !== 'win32') {
              try { fs.rmSync(ipcPath, { force: true }); } catch {}
            }
          },
        };

        // Clean up on app exit
        app.on('before-quit', () => controller.kill());

        resolve(controller);
      });

      client.on('error', () => {
        // retry shortly – socket may not be ready yet
        setTimeout(connect, 120);
      });
    }

    connect();
  });
}

module.exports = { createMpv };

