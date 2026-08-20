/**
 * Copy for the /token/onboarding quest flow.
 *
 * Long-form quest copy lives here rather than in the locale files, the same way
 * `cohousingTdfQuiz.ts` holds its questions: the bodies are structured prose
 * with lists, steps and callouts, which does not survive flattening into
 * translation keys. Only the page chrome (headings, buttons, tallies) is
 * translated.
 *
 * Brand specifics — token symbol, network, platform name, domain — come in
 * through `getTokenOnboardingQuests` so the page reads correctly for every app
 * that mounts it, not just TDF.
 */

/** Inline markup understood by the renderer: `**bold**` and `` `code` ``. */
export type OnboardingBlock =
  | { type: 'p'; text: string }
  | { type: 'subheading'; text: string }
  | { type: 'list'; items: string[] }
  | { type: 'steps'; items: string[] }
  | { type: 'note'; tone?: 'info' | 'warn'; text: string }
  | { type: 'facts'; items: { label: string; value: string }[] };

export type OnboardingGate =
  | {
      type: 'quiz';
      ask: string;
      options: string[];
      correctIndex: number;
      ok: string;
    }
  | { type: 'check'; ask: string; items: string[]; ok: string }
  /**
   * Ticked by the wallet itself, not by the member. Saying "yes I connected"
   * is worth nothing when the app can simply look.
   */
  | {
      type: 'wallet';
      ask: string;
      checks: { connected: string; network: string; linked: string };
      ok: string;
      waiting: string;
    };

export interface OnboardingQuest {
  /** Stable id — progress is stored against it, so never renumber these. */
  id: string;
  title: string;
  subtitle: string;
  /** Fractional carrot reward. All quests together add up to 5. */
  carrots: number;
  body: OnboardingBlock[];
  gate: OnboardingGate;
}

export interface TokenOnboardingContext {
  /** DAO token symbol, e.g. `TDF`. */
  tokenSymbol: string;
  /** Human platform name, e.g. `Traditional Dream Factory`. */
  platformName: string;
  /** Network the tokens live on, e.g. `Celo`. */
  networkName: string;
  /** Native token used for network fees, e.g. `CELO`. */
  gasToken: string;
  /** Bare domain members should bookmark, e.g. `traditionaldreamfactory.com`. */
  semanticUrl: string;
  /**
   * Whether this app can actually connect a wallet. When it cannot, the final
   * quest falls back to a checklist — otherwise the flow would dead-end on a
   * gate nobody could ever pass.
   */
  canConnectWallet: boolean;
}

/** The whole flow is worth exactly this many carrots. */
export const TOKEN_ONBOARDING_TOTAL_CARROTS = 5;

export const getTokenOnboardingQuests = ({
  tokenSymbol,
  platformName,
  networkName,
  gasToken,
  semanticUrl,
  canConnectWallet,
}: TokenOnboardingContext): OnboardingQuest[] => {
  const token = `$${tokenSymbol}`;

  return [
    {
      id: 'why-web3',
      title: 'Why we bother with web3',
      subtitle: 'Five minutes on what the tokens actually do',
      carrots: 0.25,
      body: [
        {
          type: 'p',
          text: `The land is not for sale and never will be. What can be shared is **access** to it, and the decisions about it.`,
        },
        {
          type: 'p',
          text: `Three tokens carry that, all of them on **${networkName}**, a low cost public network:`,
        },
        {
          type: 'list',
          items: [
            `**${token}** is access. One token gives you one night per year on the land, forever. It is transferable, so you can sell it or pass it on.`,
            `**$Presence** records the time you actually spend here. It cannot be bought or sold, and it fades if you stop coming.`,
            `**$Sweat** records the work you contribute. Same rules: not for sale, fades over time.`,
          ],
        },
        {
          type: 'p',
          text: `Money alone should not buy you influence, and neither should showing up once years ago. The three together are the closest we have found to a fair answer.`,
        },
        {
          type: 'note',
          text: `Why not a normal membership database? Because a database is only as trustworthy as whoever runs it. This way, your right to a bed is held by a public record that outlives the current team, including the founder.`,
        },
      ],
      gate: {
        type: 'quiz',
        ask: 'Which of the three tokens can you sell to someone else?',
        options: [
          '$Presence, because it proves you were here',
          `${token}, the access token`,
          'All three, they are all tradable',
          'None, everything is locked to your name',
        ],
        correctIndex: 1,
        ok: `Right. ${token} moves. Presence and Sweat stay with the person who earned them.`,
      },
    },
    {
      id: 'what-is-a-wallet',
      title: 'What a wallet actually is',
      subtitle: 'It is not an app that holds your money',
      carrots: 0.5,
      body: [
        { type: 'p', text: 'A wallet is a pair of keys. That is the whole idea.' },
        {
          type: 'list',
          items: [
            'Your **public address** looks like `0x7f3a…c21b`. Share it freely. It is where people send you things.',
            'Your **private key**, and the twelve word phrase that generates it, is the proof that you own the address. Never share it.',
          ],
        },
        {
          type: 'p',
          text: `Your tokens do not live inside the app on your laptop. They live in the public record on ${networkName}. The wallet is just the key that lets you move them. Lose the phone, buy a new one, restore the same wallet from your twelve words, and everything is still there.`,
        },
        {
          type: 'note',
          tone: 'warn',
          text: '**The flip side:** there is no support line and no password reset. If someone gets your twelve words, they get everything, instantly and permanently. That is why the next two quests exist.',
        },
        {
          type: 'p',
          text: `We will use **MetaMask** because it works in a browser, it works with ${networkName}, and it is what most of the village already has. Any ${networkName} compatible wallet works if you prefer another one.`,
        },
      ],
      gate: {
        type: 'quiz',
        ask: 'Where are your tokens stored?',
        options: [
          'Inside the MetaMask app on your device',
          `On a ${platformName} server`,
          `On the ${networkName} network, with your wallet holding the key`,
          'In your email account',
        ],
        correctIndex: 2,
        ok: 'Exactly. The wallet holds the key, not the coins.',
      },
    },
    {
      id: 'create-wallet',
      title: 'Create your MetaMask wallet',
      subtitle: 'About seven minutes, on a laptop',
      carrots: 1,
      body: [
        {
          type: 'p',
          text: 'Do this on a computer you own and trust. Not a shared machine, not the one at the coworking space.',
        },
        {
          type: 'steps',
          items: [
            'Open **metamask.io** by typing it yourself. Do not use a search ad or a link someone sent you. Fake MetaMask sites are the single most common way people lose everything.',
            'Download the extension for your browser and pin it to the toolbar.',
            'Choose **Create a new wallet**.',
            'Set a password. This only unlocks MetaMask on this one device. It is not your backup and it cannot recover anything.',
            'MetaMask reveals your **Secret Recovery Phrase**, twelve words in a fixed order. Go to the next quest before you write anything down.',
            'Confirm the words when asked. MetaMask checks that you really wrote them down.',
            'Click the account name at the top to copy your address. It starts with `0x`. That is the part you send us.',
          ],
        },
        {
          type: 'note',
          text: 'Already have a wallet from something else? You can use it. Just make sure you still hold its recovery phrase, and that it is not the wallet you use for random airdrops and experiments.',
        },
      ],
      gate: {
        type: 'check',
        ask: 'Tick what is true for you:',
        items: [
          'I installed MetaMask from metamask.io that I typed myself',
          'I created a new wallet and set a device password',
          'I can see my address starting with 0x',
        ],
        ok: 'Wallet exists. Now let us make it survivable.',
      },
    },
    {
      id: 'protect-the-phrase',
      title: 'Protect the twelve words',
      subtitle: 'The one quest you cannot skim',
      carrots: 1.25,
      body: [
        {
          type: 'p',
          text: 'Your recovery phrase is your bed, your vote and your money in twelve words. Treat it like the deed to a house that fits on a napkin.',
        },
        { type: 'subheading', text: 'Do' },
        {
          type: 'list',
          items: [
            'Write it on paper by hand. Two copies, two different physical places, at least one somewhere you do not live.',
            'Check every word against the screen, twice. One wrong word means no recovery.',
            'If you will hold more than you can comfortably lose, buy a hardware wallet and consider stamping the phrase into steel. Fire and damp beat paper.',
          ],
        },
        { type: 'subheading', text: 'Never' },
        {
          type: 'list',
          items: [
            'Photograph it, screenshot it, or put it in Notes, Photos, Drive, Telegram or a password manager sync.',
            'Type it into any website. There is no legitimate reason to ever do that, including "wallet validation" or "token migration".',
            'Read it aloud on a call, even to us.',
          ],
        },
        {
          type: 'note',
          tone: 'warn',
          text: `**Nobody at ${platformName} will ever ask for your recovery phrase.** Not the space host, not a moderator in the chat, not an email from the founder. Anyone who asks is stealing from you, whatever their profile picture says.`,
        },
        {
          type: 'p',
          text: `One more habit worth building: bookmark **${semanticUrl}** and only ever sign transactions from that bookmark. Attackers rely on lookalike domains with a swapped letter.`,
        },
      ],
      gate: {
        type: 'quiz',
        ask: 'Someone with the founder’s photo messages you: "There is a bug in your token balance, send me your 12 words so I can restore it." What do you do?',
        options: [
          'Send them, the balance matters',
          'Send only the first six words to be safe',
          'Send nothing and report the account',
          'Ask them to verify by video call first, then send',
        ],
        correctIndex: 2,
        ok: 'Correct. No half measures, no verification ritual. Nobody ever needs those words but you.',
      },
    },
    {
      id: 'smart-contracts',
      title: 'How smart contracts hold the deal',
      subtitle: 'Why the price goes up, and who decides',
      carrots: 0.5,
      body: [
        {
          type: 'p',
          text: `A smart contract is a small program living on ${networkName}. It runs the same way for everybody, anyone can read it, and it cannot be quietly edited later. That is the entire appeal: the rules of membership stop depending on trust in whoever is currently in charge.`,
        },
        { type: 'p', text: 'Three of them matter to you:' },
        {
          type: 'list',
          items: [
            `The **token contract** keeps the ledger of who holds how much ${token}.`,
            'The **bonding curve** sets the price. There is no order book and no counterparty. You buy from the curve itself, and every token minted nudges the price up for the next buyer. Early members took more risk and paid less. That is deliberate.',
            'The **booking contract** is what turns a token into a night. It checks your balance and the calendar when you reserve.',
          ],
        },
        {
          type: 'facts',
          items: [
            { label: '1 token', value: '1 night / year' },
            { label: 'Network', value: networkName },
            { label: 'Priced by', value: 'A public formula' },
          ],
        },
        {
          type: 'p',
          text: 'A token is not a share. It pays no dividend and gives no claim on the land. It is a right of use, priced by a public formula.',
        },
      ],
      gate: {
        type: 'quiz',
        ask: `What makes the price of ${token} move?`,
        options: [
          'The team sets it each quarter',
          'A bonding curve, so each token minted raises the price of the next',
          'Traders bidding against each other on an exchange',
          'It is pegged to the euro',
        ],
        correctIndex: 1,
        ok: 'Yes. The formula is public and the same for everyone, founder included.',
      },
    },
    {
      id: 'multisig',
      title: 'Multisig, or why no one holds the keys alone',
      subtitle: 'How the treasury is guarded',
      carrots: 0.5,
      body: [
        {
          type: 'p',
          text: 'Everything above protects you from losing your own keys. This quest is about protecting the village from any one person losing theirs, or going rogue.',
        },
        {
          type: 'p',
          text: `A **multisig** is a wallet that needs several signatures before anything moves. The ${platformName} treasury sits in one on ${networkName}. Signers are named in a DAO proposal, and the threshold means a single compromised laptop cannot drain the community fund. The founder cannot move money alone either, which is the point.`,
        },
        {
          type: 'list',
          items: [
            'Someone proposes a payment, with the reason attached.',
            'The other signers see it and sign, or refuse.',
            'Only when the threshold is met does the transaction execute, in public, forever visible.',
          ],
        },
        {
          type: 'note',
          text: 'You do not need a multisig for your personal wallet. It is worth knowing about for two reasons: it is how you can verify where community money goes, and it is the pattern to use if you ever hold funds with other people.',
        },
      ],
      gate: {
        type: 'quiz',
        ask: 'What does a multisig prevent?',
        options: [
          `The price of ${token} from falling`,
          'Any single person from moving community funds alone',
          'Your personal wallet from being hacked',
          'Transactions from being public',
        ],
        correctIndex: 1,
        ok: 'That is it. Shared custody, visible in the open.',
      },
    },
    {
      id: 'connect-wallet',
      title: `Connect to ${platformName}`,
      subtitle: 'Two minutes, then you are a wallet we recognise',
      carrots: 1,
      body: [
        {
          type: 'steps',
          items: [
            'Click **Connect wallet** in the panel at the bottom of this quest, or the same button on your profile. MetaMask opens and asks which account to share. Pick yours.',
            `Approve the switch to the **${networkName}** network when prompted. If you would rather add it by hand, the details are in the wallet guide below.`,
            'Sign the message that appears. This is a signature, not a payment. It costs nothing and proves the address is yours.',
            `Keep a small amount of **${gasToken}** in the wallet for network fees. A euro lasts a long time. You can top up during checkout.`,
          ],
        },
        {
          type: 'note',
          text: '**Reading a transaction before you sign it:** MetaMask always shows what you are agreeing to. If a popup asks for something you did not start, or asks for unlimited spending permission you did not expect, reject it. Rejecting costs nothing.',
        },
        {
          type: 'p',
          text: 'Once connected, your profile shows your balance, your nights, and your Presence and Sweat as they accumulate.',
        },
      ],
      gate: canConnectWallet
        ? {
            type: 'wallet',
            ask: 'No boxes to tick here — we read this straight from your wallet:',
            checks: {
              connected: 'Wallet connected to this browser',
              network: `Wallet on the ${networkName} network`,
              linked: `Address saved to your ${platformName} profile`,
            },
            ok: 'Onboarded. You can read a wallet, a contract and a scam. That is genuinely most of it.',
            waiting:
              'Connect below and this unlocks on its own — nothing else to do.',
          }
        : {
            type: 'check',
            ask: 'Tick what is true for you:',
            items: [
              'My wallet is connected to my profile',
              `I am on the ${networkName} network`,
              'I know a signature is free and a transaction costs a fee',
            ],
            ok: 'Onboarded. You can read a wallet, a contract and a scam. That is genuinely most of it.',
          },
    },
  ];
};
