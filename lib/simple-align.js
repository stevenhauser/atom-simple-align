'use babel';
'use strict';

import { CompositeDisposable } from 'atom';

export function activate(state) {
  this.subscriptions = new CompositeDisposable();
  this.subscriptions.add(atom.commands.add('atom-workspace', {
    'simple-align:align': this.align
  }));
};

export function deactivate() {
  this.subscriptions.dispose();
};

export function align() {
  let editor  = atom.workspace.getActiveTextEditor();
  let buffer  = editor.getBuffer();
  let cursors = editor.getCursors();
  let cols    = cursors.map((c) => c.getBufferColumn());
  let rows    = cursors.map((c) => c.getBufferRow());
  let texts   = rows.map((r) => editor.lineTextForBufferRow(r));
  let maxCol  = Math.max(...cols);

  // Add the necessary number of chars before the
  // cursor in order to align them.
  let aligned = texts.map((text, i) => {
    let col   = cols[i];
    let delta = maxCol - col;
    let start = text.slice(0, col);
    let mid   = ' '.repeat(delta);
    let end   = text.slice(col);
    return `${start}${mid}${end}`;
  });

  // Perform in a single transaction to ensure that
  // undoing will undo the whole thing. Maybe it
  // helps perf, too?
  // TODO: Is there a way to improve perf on this?
  // Can take >70ms depending on cursor count.
  buffer.transact(() => {
    // Replace every line with the aligned text
    aligned.forEach((text, i) => {
      let row   = rows[i];
      let range = [ [row, 0], [row, Infinity] ];
      buffer.setTextInRange(range, text);
    });

    // Move every cursor to where the alignment occurred
    cursors.forEach((cursor) => {
      cursor.moveToBeginningOfLine();
      cursor.moveRight(maxCol);
    });
  });
};
