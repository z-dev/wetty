import { Terminal } from 'xterm';
import { isUndefined, isNull } from 'lodash';
import * as io from 'socket.io-client';
import { fit } from 'xterm/lib/addons/fit/fit';
import './wetty.scss';
import './favicon.ico';

const userRegex = new RegExp('ssh/[^/]+$');
const trim = (str: string): string => str.replace(/\/*$/, '');
const socketBase = trim(window.location.pathname).replace(userRegex, '');
const socket = io(window.location.origin, {
  path: `${trim(socketBase)}/socket.io`,
});

const overlay = document.getElementById('overlay');
const terminal = document.getElementById('terminal');

socket.on('connect', () => {
  const term = new Terminal();
  if (isNull(terminal)) return;
  term.open(terminal);
  term.setOption('fontSize', 14);
  if (!isNull(overlay)) overlay.style.display = 'none';
  window.addEventListener('beforeunload', handler, false);

  term.attachCustomKeyEventHandler(copy);

  window.onresize = resize(term);
  resize(term)();
  term.focus();
  mobileKeyboard();

  term.on('data', data => {
    socket.emit('input', data);
  });
  term.on('resize', size => {
    socket.emit('resize', size);
  });
  socket
    .on('data', (data: string) => {
      term.write(data);
    })
    .on('login', () => {
      term.writeln('');
      resize(term)();
    })
    .on('logout', disconnect)
    .on('disconnect', disconnect)
    .on('error', (err: string | null) => {
      if (err) disconnect(err);
    });
});

function disconnect(reason: string): void {
  if (isNull(overlay)) return;
  overlay.style.display = 'block';
  const msg = document.getElementById('msg');
  if (!isUndefined(reason) && !isNull(msg)) msg.innerHTML = reason;
  window.removeEventListener('beforeunload', handler, false);
}

function handler(e: { returnValue: string }): string {
  e.returnValue = 'Are you sure?';
  return e.returnValue;
}

function mobileKeyboard(): void {
  const [screen] = document.getElementsByClassName('xterm-screen');
  if (isNull(screen)) return;
  screen.setAttribute('contenteditable', 'true');
  screen.setAttribute('spellcheck', 'false');
  screen.setAttribute('autocorrect', 'false');
  screen.setAttribute('autocomplete', 'false');
  screen.setAttribute('autocapitalize', 'false');
  /*
    term.scrollPort_.screen_.setAttribute('contenteditable', 'false');
  */
}

function copy(e: KeyboardEvent): boolean {
  // Ctrl + Shift + C
  if (e.ctrlKey && e.shiftKey && e.keyCode === 67) {
    e.preventDefault();
    document.execCommand('copy');
    return false;
  }
  return true;
}

function resize(term: Terminal): Function {
  return () => {
    fit(term);
    socket.emit('resize', { cols: term.cols, rows: term.rows });
  };
}
