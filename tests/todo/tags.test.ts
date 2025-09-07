/**
 * Phase 1++ TODO System - tags.test.ts
 * Validates tagging extension invariants:
 *  - Normalization on create (trim, lower-case, remove empties, de-duplicate preserving first occurrence order)
 *  - Normalization on update (including clearing tags)
 *  - No updatedAt change when patch introduces no effective tag modification
 *  - Immutability: service method return values are defensive clones (previous references not mutated)
 */

import { createInMemoryService } from './testUtils';
import { DuplicateContentError, TodoStatus } from '../../src/todo';

describe('tagging extension', () => {
  test('addTodo normalizes tags (trim, lower-case, dedupe, remove empties)', async () => {
    const svc = await createInMemoryService();
    const t = svc.addTodo('Tag Normalization', [
      ' Feature ',
      'feature',
      'Docs',
      'DOCS ',
      '  ',
      'Infra',
      'infra',
    ]);
    expect(t.tags).toEqual(['feature', 'docs', 'infra']);
  });

  test('addTodo with undefined / empty tags yields empty array', async () => {
    const svc = await createInMemoryService();
    const a = svc.addTodo('No Tags 1');
    const b = svc.addTodo('No Tags 2', []);
    expect(a.tags).toEqual([]);
    expect(b.tags).toEqual([]);
  });

  test('updateTodo can add initial tags to previously tagless todo', async () => {
    const svc = await createInMemoryService();
    const t = svc.addTodo('Add Tags Later');
    expect(t.tags).toEqual([]);

    const updated = svc.updateTodo(t.id, { tags: ['One', 'one', 'Two'] });
    expect(updated.tags).toEqual(['one', 'two']);
    // Ensure updatedAt changed
    expect(updated.updatedAt).not.toBe(t.updatedAt);
  });

  test('updateTodo can replace existing tags and normalizes input', async () => {
    const svc = await createInMemoryService();
    const t = svc.addTodo('Initial Tags', ['Alpha', 'beta']);
    expect(t.tags).toEqual(['alpha', 'beta']);

    const updated = svc.updateTodo(t.id, { tags: [' BETA ', 'Gamma', 'gamma', 'ALPHA'] });
    // Order preserves first normalized occurrence in incoming list sequence:
    // incoming normalized sequence: ['beta','gamma','alpha'] (alpha appears last => kept there)
    expect(updated.tags).toEqual(['beta', 'gamma', 'alpha']);
  });

  test('updateTodo clearing tags with empty array', async () => {
    const svc = await createInMemoryService();
    const t = svc.addTodo('Clear Tags', ['keep', 'Me']);
    expect(t.tags).toEqual(['keep', 'me']);

    const cleared = svc.updateTodo(t.id, { tags: [] });
    expect(cleared.tags).toEqual([]);
  });

  test('updateTodo identical tag set does not change updatedAt', async () => {
    const svc = await createInMemoryService();
    const t = svc.addTodo('Stable Tags', ['A', 'B']);
    const originalUpdatedAt = t.updatedAt;

    // Provide same (but differently cased / spaced) inputs that normalize to identical list
    const patched = svc.updateTodo(t.id, { tags: ['a', '  b  '] });
    expect(patched.tags).toEqual(['a', 'b']);
    // Because there is no effective change, updatedAt should remain identical
    expect(patched.updatedAt).toBe(originalUpdatedAt);
  });

  test('immutability: previous returned object not mutated after tag update', async () => {
    const svc = await createInMemoryService();
    const t = svc.addTodo('Immutable Ref', ['One']);
    expect(t.tags).toEqual(['one']);

    const updated = svc.updateTodo(t.id, { tags: ['one', 'two'] });
    expect(updated.tags).toEqual(['one', 'two']);

    // Original reference (t) should remain with prior tag state
    expect(t.tags).toEqual(['one']);
  });

  test('duplicate content rule unaffected by tags (content-only uniqueness)', async () => {
    const svc = await createInMemoryService();
    svc.addTodo('Same Content', ['a']);
    expect(() => svc.addTodo('same content', ['different', 'tags'])).toThrow(DuplicateContentError);
  });

  test('tags do not interfere with lifecycle transitions', async () => {
    const svc = await createInMemoryService();
    const t = svc.addTodo('Lifecycle With Tags', ['x']);
    const started = svc.start(t.id);
    expect(started.status).toBe(TodoStatus.InProgress);
    const done = svc.done(t.id);
    expect(done.status).toBe(TodoStatus.Completed);
    const reopened = svc.reopen(t.id);
    expect(reopened.status).toBe(TodoStatus.Pending);
    expect(reopened.tags).toEqual(['x']); // tags remain stable across transitions
  });

  test('updateTodo content + tags simultaneously enforces duplicate prevention on content only', async () => {
    const svc = await createInMemoryService();
    const a = svc.addTodo('Original', ['alpha']);
    svc.addTodo('Another', ['beta']);

    // Attempt to change 'Another' content to 'original' (case-insensitive conflict)
    expect(() =>
      svc.updateTodo(
        svc
          .listTodos()
          .find(t => t.id !== a.id)!.id,
        { content: '  original  ', tags: ['new'] },
      ),
    ).toThrow(DuplicateContentError);
  });
});