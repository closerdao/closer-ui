/* Exercises the installed SDK, not a mocked copy of its chain-change handler.
 * The SignClient/storage boundary is fake so this makes no network requests.
 * Optional argument: an older provider module path for before/after comparison.
 */
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const path = require('node:path');

const appkit = require.resolve('@reown/appkit', {
  paths: [path.join(__dirname, '..')],
});
const providerPath =
  process.argv[2] ||
  require.resolve('@walletconnect/universal-provider', {
    paths: [path.dirname(appkit)],
  });
const UniversalProvider = require(providerPath).default;
const nextTurn = () => new Promise((resolve) => setImmediate(resolve));

async function check() {
  const failures = [];
  const onUnhandled = (error) => failures.push(error);
  process.on('unhandledRejection', onUnhandled);
  let releaseStorage;
  let enteredStorage;
  const firstWrite = new Promise((resolve) => {
    enteredStorage = resolve;
  });
  const storageGate = new Promise((resolve) => {
    releaseStorage = resolve;
  });
  let writes = 0;
  const namespaces = {
    eip155: {
      chains: ['eip155:42220'],
      methods: ['personal_sign'],
      events: ['chainChanged', 'accountsChanged'],
      accounts: ['eip155:42220:0x1111111111111111111111111111111111111111'],
      rpcMap: { 42220: 'https://example.invalid' },
    },
  };
  const session = { topic: 'local-regression-session', namespaces };
  const client = new EventEmitter();
  client.connect = async () => ({ approval: async () => session });
  client.core = {
    projectId: 'offline-regression',
    storage: {
      setItem: async () => {
        if (++writes === 1) {
          enteredStorage();
          await storageGate;
        }
      },
    },
  };
  const provider = new UniversalProvider({
    logger: 'silent',
    disableProviderPing: true,
  });
  provider.client = client;
  provider.namespaces = namespaces;
  provider.registerEventListeners();
  const pairing = provider.pair();
  await firstWrite;
  assert.equal(
    provider.rpcProviders.eip155,
    undefined,
    'event must arrive before provider setup',
  );
  const event = {
    topic: session.topic,
    params: {
      chainId: 'eip155:42220',
      event: { name: 'chainChanged', data: 42220 },
    },
  };
  client.emit('session_event', event);
  await nextTurn();
  releaseStorage();
  await pairing;
  assert.ok(
    provider.rpcProviders.eip155,
    'pairing should complete provider setup',
  );
  client.emit('session_event', event);
  await nextTurn();
  process.removeListener('unhandledRejection', onUnhandled);
  assert.equal(
    failures.length,
    0,
    failures.map((error) => error.message).join('; '),
  );
  console.log(
    'PASS: chainChanged during pairing persistence and after provider setup',
  );
}
check().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
