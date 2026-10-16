/** @jest-environment node */
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

test('the installed WalletConnect handles chainChanged before its RPC provider exists', () => {
  // A separate Node process bypasses the AppKit mocks used by React tests.
  const output = execFileSync(
    process.execPath,
    [join(__dirname, 'checkWalletConnectRace.cjs')],
    {
      encoding: 'utf8',
      timeout: 10000,
    },
  );
  expect(output).toContain(
    'PASS: chainChanged during pairing persistence and after provider setup',
  );
});
