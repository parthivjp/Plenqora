import assert from 'node:assert/strict'
import { test } from 'node:test'
import { publishWorkspaceUpdate, subscribeToWorkspaceUpdates } from '../src/services/workspaceEvents.js'

test('workspace updates reach only subscribers in that workspace and stop after unsubscribe', () => {
  let firstWorkspaceUpdates = 0
  let secondWorkspaceUpdates = 0
  const unsubscribe = subscribeToWorkspaceUpdates('workspace-one', () => { firstWorkspaceUpdates += 1 })
  const unsubscribeSecond = subscribeToWorkspaceUpdates('workspace-two', () => { secondWorkspaceUpdates += 1 })

  publishWorkspaceUpdate('workspace-two')
  assert.equal(firstWorkspaceUpdates, 0)
  assert.equal(secondWorkspaceUpdates, 1)

  publishWorkspaceUpdate('workspace-one')
  assert.equal(firstWorkspaceUpdates, 1)

  unsubscribe()
  unsubscribeSecond()
  publishWorkspaceUpdate('workspace-one')
  assert.equal(firstWorkspaceUpdates, 1)
})
