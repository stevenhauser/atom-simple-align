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

function pad_col_with_tabs(col, string, tab_width) {
    var tcol = 0;
    for (var i = 0; i < col; i++) {
        tcol++;
        if (string[i] === "\t" && tcol % tab_width != 0) {
            tcol += tab_width - tcol % tab_width;
        }
    }
    return tcol;
}

export function align() {
  let editor  = atom.workspace.getActiveTextEditor();
  let tab     = (editor.getSoftTabs()) ? 0 : editor.getTabLength();
  let buffer  = editor.getBuffer();
  let cursors = editor.getCursors();
  let cols    = cursors.map((c) => c.getBufferColumn());
  let rows    = cursors.map((c) => c.getBufferRow());
  let texts   = rows.map((r) => editor.lineTextForBufferRow(r));
  let tcols   = (tab!=0) ? cols.map((col, i) => pad_col_with_tabs(texts[i], col, tab)) : cols;
  let maxCol  = Math.max(...tcols);

  // Add the necessary number of chars before the
  // cursor in order to align them.
  let aligned = texts.map((text, i) => {
    let col   = cols[i];
    let delta = maxCol - tcols[i];
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
