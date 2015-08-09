'use babel';
'use strict';

import AtomSimpleAlign from '../lib/simple-align';

// Use the command `window:run-package-specs` (cmd-alt-ctrl-p) to run specs.
//
// To run a specific `it` or `describe` block add an `f` to the front (e.g. `fit`
// or `fdescribe`). Remove the `f` to unfocus the block.

describe('AtomSimpleAlign', () => {

  let workspaceElement;
  let activationPromise;

  beforeEach(() => {
    workspaceElement = atom.views.getView(atom.workspace);
    activationPromise = atom.packages.activatePackage('simple-align');
  });

  describe('aligning', () => {

    let activeEditor;
    let aligned;
    let unaligned;

    function setup(test) {
      waitsForPromise(() => {
        // Store a ref to the active editor for easy usage elsewhere
        let setActiveEditor = (editor) => activeEditor = editor;
        let setSampleText = () => activeEditor.setText(unaligned.join('\n'));
        let activate = () => atom.commands.dispatch(workspaceElement, 'simple-align:align');
        let setCursors = () => {
          // Need to kill off the initial cursor
          activeEditor.getCursors()[0].destroy();
          // Set a cursor before the `=` on each line
          unaligned.forEach((text, row) => {
            let col = text.indexOf('=');
            activeEditor.addCursorAtBufferPosition([row, col]);
          });
        };
        return atom.workspace.open('some-file')
          .then(setActiveEditor)
          .then(setSampleText)
          .then(setCursors)
          .then(activate)
          .then(activationPromise);
      });
      runs(test);
    }

    beforeEach(() => {
      unaligned = [
        'a = 1;',
        'bb = 2;',
        'ccc = 3;',
        'd = 4;'
      ];
      aligned = [
        'a   = 1;',
        'bb  = 2;',
        'ccc = 3;',
        'd   = 4;'
      ];
    });

    it('aligns all of the cursors by adding spaces before them', () => {
      setup(() => {
        expect(activeEditor.getText()).toEqual(aligned.join('\n'));
      });
    });

    it('sets all the cursors to the alignment location', () => {
      setup(() => {
        let alignmentLocation = Math.max(...unaligned.map((t) => t.indexOf('=')));
        activeEditor.getCursors().forEach((cursor, i) => {
          expect(cursor.getBufferRow()).toEqual(i);
          expect(cursor.getBufferColumn()).toEqual(alignmentLocation);
        });
      });
    });

  });

});
