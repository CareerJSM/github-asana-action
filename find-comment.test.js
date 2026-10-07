const { findComment } = require('./action');

// Asana returns every story on a task, not just comments. System activity
// ("added to project", "changed the due date", attachments) can arrive without
// a text field, so findComment must not assume one is present.
const clientReturning = (stories) => ({
  tasks: {
    stories: async () => ({ fetch: async () => stories })
  }
});

describe('findComment', () => {
  const commentId = '#links_11871';

  test('finds the comment carrying the comment id', async () => {
    const client = clientReturning([
      { gid: '1', text: 'some unrelated comment' },
      { gid: '2', text: `deploy is ready\n${commentId}\n` }
    ]);

    await expect(findComment(client, '1218937068487433', commentId))
      .resolves.toMatchObject({ gid: '2' });
  });

  test('ignores stories that have no text', async () => {
    const client = clientReturning([
      { gid: '1', resource_subtype: 'added_to_project' },
      { gid: '2', resource_subtype: 'due_date_changed' },
      { gid: '3', text: `deploy is ready\n${commentId}\n` }
    ]);

    await expect(findComment(client, '1218937068487433', commentId))
      .resolves.toMatchObject({ gid: '3' });
  });

  test('returns undefined when no story carries the comment id', async () => {
    const client = clientReturning([
      { gid: '1', resource_subtype: 'added_to_project' },
      { gid: '2', text: 'some unrelated comment' }
    ]);

    await expect(findComment(client, '1218937068487433', commentId))
      .resolves.toBeUndefined();
  });
});
