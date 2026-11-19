import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { BigNumber, providers, utils } from 'ethers';

import { allNetworkConfigs } from '../../config_blockchain';
import styles from './GovernanceWeight.module.css';

/* ================================================================================
 * TDF Governance Weight — reads TDF/Presence/Sweat holder registers plus staked
 * TDF and the TDF Membersheep membership NFT, live from Celo mainnet, and shows
 * how governance weight is actually distributed today (not just how it's supposed
 * to be, per the OASA whitepaper).
 * ================================================================================ */

const NET = allNetworkConfigs.celo;
const BS = 'https://celo.blockscout.com';
const EXP = `${BS}/address/`;
const RPC_URL = NET.BLOCKCHAIN_RPC_URL;
const STAKING_ADDRESS = NET.BLOCKCHAIN_DAO_DIAMOND_ADDRESS;
// TDF Membersheep — the ERC-721 "accepted Member" registry (Unlock Protocol PublicLock).
const MEMBERSHIP_ADDRESS = '0x6b4121DE536c7B31352D1044963c28f6f543e10a';

const TOKENS = [
  { key: 'tdf', label: 'TDF', cls: styles.srcTdf, address: NET.BLOCKCHAIN_DAO_TOKEN.address },
  {
    key: 'presence',
    label: 'Presence',
    cls: styles.srcPresence,
    address: NET.BLOCKCHAIN_PRESENCE_TOKEN.address,
  },
  { key: 'sweat', label: 'Sweat', cls: styles.srcSweat, address: NET.BLOCKCHAIN_SWEAT_TOKEN.address },
] as const;
type TokenKey = (typeof TOKENS)[number]['key'];

const BURN = new Set([
  '0x0000000000000000000000000000000000000000',
  '0x000000000000000000000000000000000000dead',
]);

const ERC20_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address) view returns (uint256)',
];
const STAKED_ABI = ['function stakedBalanceOf(address) view returns (uint256)'];
const erc20Iface = new utils.Interface(ERC20_ABI);
const stakedIface = new utils.Interface(STAKED_ABI);

const WAD = 10n ** 18n;

/* ---- pure helpers, ported from the original standalone page ---- */
const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const big = (v: BigNumber | null | undefined): bigint => (v ? v.toBigInt() : 0n);
const norm = (raw: bigint, dec: number): bigint =>
  dec === 18 ? raw : dec < 18 ? raw * 10n ** BigInt(18 - dec) : raw / 10n ** BigInt(dec - 18);
function fmt(v: bigint, p = 2): string {
  const n = v < 0n;
  if (n) v = -v;
  const i = v / WAD,
    f = v % WAD;
  const fs = f
    .toString()
    .padStart(18, '0')
    .slice(0, p)
    .replace(/0+$/, '');
  return (n ? '-' : '') + i.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + (fs ? '.' + fs : '');
}
const pct = (a: bigint, b: bigint): number => (b === 0n ? 0 : Number((a * 10000n) / b) / 100);
const shortA = (a: string) => a.slice(0, 6) + '…' + a.slice(-4);
const parseAddrs = (s: string): string[] =>
  Array.from(new Set((s.match(/0x[0-9a-fA-F]{40}/g) || []).map((a) => a.toLowerCase())));

function gini(vals: number[]): number {
  const v = vals.filter((x) => x > 0).sort((a, b) => a - b);
  const n = v.length;
  const sum = v.reduce((s, x) => s + x, 0);
  if (!n || !sum) return 0;
  let cum = 0;
  for (let i = 0; i < n; i++) cum += (i + 1) * v[i];
  return (2 * cum) / (n * sum) - (n + 1) / n;
}

// Apokedro (Papangelou, Christodoulou & Inglezakis, "Apokedro: A Decentralization Index for
// DAOs and Beyond", Blockchains 2025, 3(1), 4 — https://doi.org/10.3390/blockchains3010004).
// Averages a Nash-equilibrium-style agreement probability (1/2^(k-1) for a coalition of size k)
// over every *minimal* winning coalition. Exact enumeration is combinatorial (the paper itself
// caps it around n=28); larger holder sets are reduced to <=18 representative values first by
// keeping the largest holders exact and quantile-binning (equal population) the long tail, which
// avoids a naive equal-width-bin reduction misreporting a multi-holder distribution as fully
// centralized (verified against the paper's own worked example: {5,3,2,2,1,0} -> 0.4375, exact).
function apokedroReduce(vals: number[], maxN: number): number[] {
  if (vals.length <= maxN) return vals.slice();
  const sorted = [...vals].sort((a, b) => b - a);
  const keepTop = Math.min(Math.ceil(maxN / 2), sorted.length);
  const top = sorted.slice(0, keepTop);
  const tail = sorted.slice(keepTop).sort((a, b) => a - b);
  const remaining = maxN - keepTop;
  if (!tail.length || remaining <= 0) return top;
  const n = tail.length,
    out: number[] = [];
  for (let b = 0; b < remaining; b++) {
    const lo = Math.floor((b * n) / remaining),
      hi = Math.max(Math.floor(((b + 1) * n) / remaining), lo + 1);
    const seg = tail.slice(lo, hi);
    out.push(seg[Math.floor(seg.length / 2)]);
  }
  return top.concat(out);
}
function apokedro(vals: number[]): { value: number; approximated: boolean; n: number } | null {
  const v = vals.filter((x) => x > 0);
  if (v.length < 2) return null;
  const MAXN = 18,
    reduced = apokedroReduce(v, MAXN);
  const n = reduced.length,
    total = reduced.reduce((s, x) => s + x, 0);
  if (total <= 0) return null;
  const threshold = total / 2;
  const sorted = [...reduced].sort((a, b) => b - a);
  let sumP = 0,
    count = 0;
  const dfs = (idx: number, sum: number, k: number) => {
    for (let i = idx; i < n; i++) {
      const s2 = sum + sorted[i],
        k2 = k + 1;
      if (s2 >= threshold) {
        sumP += 1 / 2 ** (k2 - 1);
        count++;
      } else dfs(i + 1, s2, k2);
    }
  };
  dfs(0, 0, 0);
  return { value: count ? sumP / count : 0, approximated: v.length > MAXN, n: reduced.length };
}

/* ---- row / meta types ---- */
interface Row {
  addr: string;
  contract: boolean;
  name: string | null;
  tag: string | null;
  tdf: bigint;
  presence: bigint;
  sweat: bigint;
  staked: bigint;
  member: boolean;
  // derived at render time
  swWeighted: bigint;
  preWeighted: bigint;
  tdfEff: bigint;
  weight: bigint;
  out: boolean;
}
interface TokenMeta {
  err?: string;
  name?: string | null;
  symbol?: string | null;
  decimals?: number;
  supply?: bigint | null;
  zeroSupply?: boolean;
  indexed?: boolean;
  holders?: number;
  voting?: number;
}

const SLICE = [
  '#1C324A', '#294A6C', '#35618E', '#4278B1', '#5F90C3', '#81A7D0',
  '#AF491D', '#D35823', '#DF7142', '#E68D67', '#ECA88C', '#F2C4B0',
];
const REST_COLOR = '#DCD5C8';

/* ---- donut (holder concentration) + full pie (weight by source), built as raw SVG strings ---- */
function buildDonut(cnt: Row[], total: bigint) {
  if (!cnt.length || total === 0n) return null;
  const sorted = [...cnt].sort((a, b) => (a.weight < b.weight ? 1 : -1));
  const TOPN = 12;
  const segs: { nm: string; v: bigint; c: string; frac?: number }[] = [];
  if (sorted.length <= TOPN + 1) {
    sorted.forEach((r, i) =>
      segs.push({ nm: r.tag || r.name || shortA(r.addr), v: r.weight, c: SLICE[i % SLICE.length] }),
    );
  } else {
    sorted.slice(0, TOPN).forEach((r, i) => segs.push({ nm: r.tag || r.name || shortA(r.addr), v: r.weight, c: SLICE[i] }));
    segs.push({
      nm: `${sorted.length - TOPN} smaller holders`,
      v: sorted.slice(TOPN).reduce((s, r) => s + r.weight, 0n),
      c: REST_COLOR,
    });
  }

  let cum = 0n,
    thr: number | null = null,
    nak = 0;
  for (const r of sorted) {
    cum += r.weight;
    nak++;
    if (cum * 2n > total) {
      thr = Number((cum * 1000000n) / total) / 1000000;
      break;
    }
  }

  const CX = 160, CY = 160, RO = 132, RI = 80, TAU = Math.PI * 2, A0 = -Math.PI / 2;
  const pt = (r: number, a: number): [string, string] => [
    (CX + r * Math.cos(a)).toFixed(2),
    (CY + r * Math.sin(a)).toFixed(2),
  ];
  const arc = (a: number, b: number) => {
    if (b - a >= TAU - 1e-9)
      return (
        `M${CX - RO} ${CY}a${RO} ${RO} 0 1 1 ${RO * 2} 0a${RO} ${RO} 0 1 1 ${-RO * 2} 0` +
        `M${CX - RI} ${CY}a${RI} ${RI} 0 1 0 ${RI * 2} 0a${RI} ${RI} 0 1 0 ${-RI * 2} 0`
      );
    const lg = b - a > Math.PI ? 1 : 0;
    const [x0, y0] = pt(RO, a),
      [x1, y1] = pt(RO, b),
      [x2, y2] = pt(RI, b),
      [x3, y3] = pt(RI, a);
    return `M${x0} ${y0}A${RO} ${RO} 0 ${lg} 1 ${x1} ${y1}L${x2} ${y2}A${RI} ${RI} 0 ${lg} 0 ${x3} ${y3}Z`;
  };

  let a = A0,
    paths = '';
  for (const s of segs) {
    const frac = Number((s.v * 1000000n) / total) / 1000000;
    const b = a + frac * TAU;
    paths += `<path d="${arc(a, b)}" fill="${s.c}"><title>${esc(s.nm)} · ${(frac * 100).toFixed(2)}%</title></path>`;
    s.frac = frac;
    a = b;
  }

  let marker = '';
  if (thr != null) {
    const ang = A0 + thr * TAU;
    const [ix, iy] = pt(RI - 6, ang),
      [ox, oy] = pt(RO + 13, ang);
    const [tx, ty] = pt(RO + 22, ang);
    const anchor = Math.cos(ang) < -0.25 ? 'end' : Math.cos(ang) > 0.25 ? 'start' : 'middle';
    marker = `<line class="${styles.thrLine}" stroke="var(--alarm)" stroke-width="1.5" stroke-dasharray="3 3" x1="${ix}" y1="${iy}" x2="${ox}" y2="${oy}"></line>
      <text font-family="'IBM Plex Mono',monospace" font-size="9.5" fill="var(--alarm)" letter-spacing="1" x="${tx}" y="${ty}" text-anchor="${anchor}" dominant-baseline="middle">50%</text>`;
  }

  const svg = `<svg viewBox="-30 -14 380 348" role="img" aria-label="Governance weight distribution, ${segs.length} segments">
    ${paths}${marker}
    <g class="${styles.pieMid}">
      <text font-size="30" font-weight="600" x="${CX}" y="${CY - 2}">${nak}</text>
      <text font-size="9.5" fill="var(--muted)" letter-spacing="1" text-transform="uppercase" x="${CX}" y="${CY + 16}">hold a majority</text>
    </g></svg>`;
  const keysHtml = segs
    .map(
      (s) =>
        `<div class="${styles.key}"><i style="background:${s.c}"></i><span class="${styles.nm}">${esc(
          s.nm,
        )}</span><span class="${styles.vv}">${((s.frac || 0) * 100).toFixed(1)}%</span></div>`,
    )
    .join('');
  return { svg, keysHtml };
}

function buildCompPie(tTdf: bigint, tPre: bigint, tSwt: bigint, total: bigint, inclStaked: boolean) {
  if (total === 0n) return null;
  const segs: { nm: string; v: bigint; c: string; frac?: number }[] = [
    { nm: inclStaked ? 'TDF + staked' : 'TDF', v: tTdf, c: '#366290' },
    { nm: 'Presence', v: tPre, c: '#4E7F6E' },
    { nm: 'Sweat', v: tSwt, c: '#E27D52' },
  ];
  const CX = 160, CY = 160, RO = 132, TAU = Math.PI * 2, A0 = -Math.PI / 2;
  const pt = (r: number, a: number): [string, string] => [
    (CX + r * Math.cos(a)).toFixed(2),
    (CY + r * Math.sin(a)).toFixed(2),
  ];
  const slice = (a: number, b: number) => {
    if (b - a >= TAU - 1e-9)
      return `M${CX - RO} ${CY}a${RO} ${RO} 0 1 1 ${RO * 2} 0a${RO} ${RO} 0 1 1 ${-RO * 2} 0Z`;
    const lg = b - a > Math.PI ? 1 : 0;
    const [x0, y0] = pt(RO, a),
      [x1, y1] = pt(RO, b);
    return `M${CX} ${CY}L${x0} ${y0}A${RO} ${RO} 0 ${lg} 1 ${x1} ${y1}Z`;
  };
  let a = A0,
    paths = '';
  for (const s of segs) {
    const frac = Number((s.v * 1000000n) / total) / 1000000;
    const b = a + frac * TAU;
    paths += `<path d="${slice(a, b)}" fill="${s.c}"><title>${esc(s.nm)} · ${(frac * 100).toFixed(2)}%</title></path>`;
    s.frac = frac;
    a = b;
  }
  const svg = `<svg viewBox="-30 -14 380 348" role="img" aria-label="Governance weight by source, ${segs.length} segments">${paths}</svg>`;
  const keysHtml = segs
    .map(
      (s) =>
        `<div class="${styles.key}"><i style="background:${s.c}"></i><span class="${styles.nm}">${esc(
          s.nm,
        )}</span><span class="${styles.vv}">${((s.frac || 0) * 100).toFixed(1)}%</span></div>`,
    )
    .join('');
  return { svg, keysHtml };
}

/* ---- tiny "?" tooltip ---- */
const Qm = ({ children }: { children: ReactNode }) => (
  <span className={styles.qm} tabIndex={0}>
    ?<span className={styles.tip}>{children}</span>
  </span>
);

/* ---- chain reading helpers ---- */
async function timedFetch(u: string, o: Record<string, unknown> | undefined, ms: number) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), ms);
  try {
    return await fetch(u, { ...o, signal: ac.signal });
  } finally {
    clearTimeout(t);
  }
}
type RpcCall = { m: string; p: unknown[] };
let ridCounter = 0;
async function rpcCall(list: RpcCall[], ms: number): Promise<any[]> {
  const body = list.map((c) => ({ jsonrpc: '2.0', id: ++ridCounter, method: c.m, params: c.p }));
  const r = await timedFetch(
    RPC_URL,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body.length === 1 ? body[0] : body),
    },
    ms,
  );
  if (!r.ok) throw new Error('RPC HTTP ' + r.status);
  const j = await r.json();
  const arr = Array.isArray(j) ? j : [j];
  const by = new Map(arr.map((x) => [x.id, x]));
  return body.map((b) => by.get(b.id));
}
async function one(m: string, p: unknown[], ms: number) {
  const [r] = await rpcCall([{ m, p }], ms);
  if (r?.error) throw new Error(r.error.message);
  return r?.result as string | undefined;
}
const call4 = (iface: utils.Interface, fn: string, args: unknown[] = []) => iface.encodeFunctionData(fn, args);

interface HolderIndexEntry {
  value: bigint;
  contract: boolean;
  name: string | null;
  tag: string | null;
}
async function indexHolders(
  address: string,
  onProg: (n: number) => void,
): Promise<Map<string, HolderIndexEntry> | null> {
  const map = new Map<string, HolderIndexEntry>();
  let url: string | null = `${BS}/api/v2/tokens/${address}/holders`;
  let page = 0;
  while (url && page < 60) {
    const r = await timedFetch(url, { headers: { accept: 'application/json' } }, 20000);
    if (!r.ok) return null;
    const j = await r.json();
    for (const it of j.items || []) {
      const a: string | undefined = it.address?.hash || (typeof it.address_hash === 'string' ? it.address_hash : it.address_hash?.hash);
      if (!a) continue;
      map.set(a.toLowerCase(), {
        value: BigInt(it.value || '0'),
        contract: !!it.address?.is_contract,
        name: it.address?.name || null,
        tag: it.address?.metadata?.tags?.[0]?.name || null,
      });
    }
    onProg(map.size);
    url = j.next_page_params
      ? `${BS}/api/v2/tokens/${address}/holders?` + new URLSearchParams(j.next_page_params).toString()
      : null;
    page++;
  }
  return map;
}

/* ================================================================================ */

const GovernanceWeight = () => {
  // ---- form state ----
  const [mult, setMult] = useState('5');
  const [pmult, setPmult] = useState('1');
  const [inclStaked, setInclStaked] = useState(true);
  const [q, setQ] = useState('');
  const [showOut, setShowOut] = useState(false);
  const [hideZero, setHideZero] = useState(true);
  const [exclText, setExclText] = useState(
    '0x5e810b93c51981ecca16e030ea1ce8d8b1deb83b\n0x475398eee0e22cb6fe5403ffa294fb10ad989e17',
  );
  const [exContracts, setExContracts] = useState(false);
  const [exBurn, setExBurn] = useState(true);
  const [addrsText, setAddrsText] = useState('');
  const [reverify, setReverify] = useState(false);
  const [exPanelOpen, setExPanelOpen] = useState(false);
  const [sort, setSort] = useState<{ k: keyof Row; d: 1 | -1 }>({ k: 'weight', d: -1 });

  // ---- read state ----
  const [reading, setReading] = useState(false);
  const [readState, setReadState] = useState<{ h: string; p: string } | null>(null);
  const [meta, setMeta] = useState<Record<TokenKey, TokenMeta>>({ tdf: {}, presence: {}, sweat: {} });
  const [allRows, setAllRows] = useState<
    Omit<Row, 'swWeighted' | 'preWeighted' | 'tdfEff' | 'weight' | 'out'>[]
  >([]);
  const [head, setHead] = useState<number | null>(null);
  const [membershipTotal, setMembershipTotal] = useState<number | null>(null);
  const [notice, setNotice] = useState<string[]>([]);
  const [diag, setDiag] = useState<string[]>([]);
  const [readError, setReadError] = useState<string | null>(null);
  const log = useCallback((m: string) => setDiag((d) => [...d, m]), []);
  const diagRef = useRef<HTMLPreElement>(null);

  const read = useCallback(async () => {
    setReading(true);
    setDiag([]);
    setNotice([]);
    setReadError(null);
    setReadState({ h: 'Reading current state', p: 'Probing contracts.' });
    try {
      const provider = new providers.JsonRpcProvider(RPC_URL);
      const headBlock = await provider.getBlockNumber();
      setHead(headBlock);
      log('head ' + headBlock);

      const nextMeta: Record<TokenKey, TokenMeta> = { tdf: {}, presence: {}, sweat: {} };
      for (const t of TOKENS) {
        const calls: RpcCall[] = [
          { m: 'eth_call', p: [{ to: t.address, data: call4(erc20Iface, 'name') }, 'latest'] },
          { m: 'eth_call', p: [{ to: t.address, data: call4(erc20Iface, 'symbol') }, 'latest'] },
          { m: 'eth_call', p: [{ to: t.address, data: call4(erc20Iface, 'decimals') }, 'latest'] },
          { m: 'eth_call', p: [{ to: t.address, data: call4(erc20Iface, 'totalSupply') }, 'latest'] },
          { m: 'eth_getCode', p: [t.address, 'latest'] },
        ];
        const r = await rpcCall(calls, 20000);
        if (!r[4]?.result || r[4].result === '0x') {
          nextMeta[t.key] = { err: 'no code' };
          log(`${t.label}: no contract`);
          continue;
        }
        const decodeStr = (idx: number) => {
          try {
            return r[idx]?.result && r[idx].result !== '0x'
              ? (erc20Iface.decodeFunctionResult(idx === 0 ? 'name' : 'symbol', r[idx].result)[0] as string)
              : null;
          } catch {
            return null;
          }
        };
        let dec = 18;
        try {
          dec = r[2]?.result && r[2].result !== '0x' ? erc20Iface.decodeFunctionResult('decimals', r[2].result)[0] : 18;
        } catch {
          dec = 18;
        }
        let sup: bigint | null = null;
        try {
          sup =
            r[3]?.result && r[3].result !== '0x'
              ? norm(big(erc20Iface.decodeFunctionResult('totalSupply', r[3].result)[0]), dec)
              : null;
        } catch {
          sup = null;
        }
        nextMeta[t.key] = { name: decodeStr(0), symbol: decodeStr(1), decimals: dec, supply: sup, zeroSupply: sup === 0n };
        log(`${t.label}: ${nextMeta[t.key].symbol} decimals ${dec} supply ${sup != null ? fmt(sup, 4) : '?'}`);
      }
      setMeta(nextMeta);

      const bal: Record<TokenKey, Map<string, HolderIndexEntry>> = { tdf: new Map(), presence: new Map(), sweat: new Map() };
      for (const t of TOKENS) {
        if (nextMeta[t.key]?.err) continue;
        setReadState({ h: 'Reading holder registers', p: `${t.label}…` });
        let m: Map<string, HolderIndexEntry> | null = null;
        try {
          m = await indexHolders(t.address, (n) => setReadState({ h: 'Reading holder registers', p: `${t.label} — ${n} holders` }));
        } catch (e: any) {
          log(`${t.label} index error: ${e?.name === 'AbortError' ? 'timeout' : e?.message}`);
        }
        nextMeta[t.key].indexed = !!m;
        nextMeta[t.key].holders = m ? m.size : 0;
        bal[t.key] = m || new Map();
        log(`${t.label}: ${m ? m.size + ' holders indexed' : 'no index, will read on chain'}`);
      }
      setMeta({ ...nextMeta });

      const info = new Map<string, { contract: boolean; name: string | null; tag: string | null }>();
      const union = new Set(parseAddrs(addrsText));
      for (const k of Object.keys(bal) as TokenKey[]) {
        for (const [a, v] of bal[k]) {
          union.add(a);
          if (!info.has(a) || (!info.get(a)!.name && v.name)) info.set(a, { contract: v.contract, name: v.name, tag: v.tag });
        }
      }
      for (const a of parseAddrs(exclText)) union.add(a);
      log(`union: ${union.size} addresses`);

      if (!union.size) {
        setReadError('No addresses found — neither the index nor the paste box gave anything. Open Diagnostics for status codes.');
        return;
      }

      const cands = [...union];
      const needChain = TOKENS.filter((t) => !nextMeta[t.key]?.err && (!nextMeta[t.key].indexed || reverify));
      if (needChain.length) {
        const calls: RpcCall[] = [];
        for (const a of cands) for (const t of needChain) calls.push({ m: 'eth_call', p: [{ to: t.address, data: call4(erc20Iface, 'balanceOf', [a]) }, 'latest'] });
        log(`balanceOf calls: ${calls.length}`);
        const out: any[] = [];
        for (let i = 0; i < calls.length; i += 90) {
          setReadState({ h: 'Reading balances from chain', p: `${Math.min(i + 90, calls.length)} of ${calls.length}` });
          out.push(...(await rpcCall(calls.slice(i, i + 90), 30000)));
        }
        let k = 0;
        for (const a of cands) {
          for (const t of needChain) {
            const res = out[k++];
            let v = 0n;
            try {
              v = res?.error ? 0n : norm(big(erc20Iface.decodeFunctionResult('balanceOf', res.result)[0]), nextMeta[t.key].decimals || 18);
            } catch {
              v = 0n;
            }
            const prev = bal[t.key].get(a);
            bal[t.key].set(a, { value: v, contract: prev?.contract || false, name: prev?.name || null, tag: prev?.tag || null });
          }
        }
      }

      // staked TDF — not an ERC-20 balance, tracked per-depositor by the DAO contract
      const stakedBal = new Map<string, bigint>();
      {
        const calls: RpcCall[] = cands.map((a) => ({ m: 'eth_call', p: [{ to: STAKING_ADDRESS, data: call4(stakedIface, 'stakedBalanceOf', [a]) }, 'latest'] }));
        log(`stakedBalanceOf calls: ${calls.length}`);
        const out: any[] = [];
        for (let i = 0; i < calls.length; i += 90) {
          setReadState({ h: 'Reading staked TDF from the DAO contract', p: `${Math.min(i + 90, calls.length)} of ${calls.length}` });
          try {
            out.push(...(await rpcCall(calls.slice(i, i + 90), 30000)));
          } catch (e: any) {
            log(`stakedBalanceOf batch error: ${e?.name === 'AbortError' ? 'timeout' : e?.message}`);
            out.push(...calls.slice(i, i + 90).map(() => undefined));
          }
        }
        cands.forEach((a, i) => {
          const res = out[i];
          let v = 0n;
          try {
            v = res && !res.error ? big(stakedIface.decodeFunctionResult('stakedBalanceOf', res.result)[0]) : 0n;
          } catch {
            v = 0n;
          }
          stakedBal.set(a, v);
        });
      }

      // Membership NFT — read for transparency only, this page does not gate anything on it
      const memberOf = new Map<string, boolean>();
      let memberTotal: number | null = null;
      try {
        const r = await one('eth_call', [{ to: MEMBERSHIP_ADDRESS, data: call4(erc20Iface, 'totalSupply') }, 'latest'], 15000);
        memberTotal = r && r !== '0x' ? Number(erc20Iface.decodeFunctionResult('totalSupply', r)[0]) : null;
      } catch (e: any) {
        log(`membership totalSupply error: ${e?.name === 'AbortError' ? 'timeout' : e?.message}`);
      }
      setMembershipTotal(memberTotal);
      {
        const calls: RpcCall[] = cands.map((a) => ({ m: 'eth_call', p: [{ to: MEMBERSHIP_ADDRESS, data: call4(erc20Iface, 'balanceOf', [a]) }, 'latest'] }));
        log(`membership balanceOf calls: ${calls.length}`);
        const out: any[] = [];
        for (let i = 0; i < calls.length; i += 90) {
          setReadState({ h: 'Checking membership NFT holders', p: `${Math.min(i + 90, calls.length)} of ${calls.length}` });
          try {
            out.push(...(await rpcCall(calls.slice(i, i + 90), 30000)));
          } catch (e: any) {
            log(`membership balanceOf batch error: ${e?.name === 'AbortError' ? 'timeout' : e?.message}`);
            out.push(...calls.slice(i, i + 90).map(() => undefined));
          }
        }
        cands.forEach((a, i) => {
          const res = out[i];
          let has = false;
          try {
            has = !!(res && !res.error && big(erc20Iface.decodeFunctionResult('balanceOf', res.result)[0]) > 0n);
          } catch {
            has = false;
          }
          memberOf.set(a, has);
        });
      }

      const nextAll = cands.map((a) => {
        const i = info.get(a) || { contract: false, name: null, tag: null };
        return {
          addr: a,
          contract: !!i.contract,
          name: i.name,
          tag: i.tag,
          tdf: bal.tdf.get(a)?.value || 0n,
          presence: bal.presence.get(a)?.value || 0n,
          sweat: bal.sweat.get(a)?.value || 0n,
          staked: stakedBal.get(a) || 0n,
          member: memberOf.get(a) || false,
        };
      });
      setAllRows(nextAll);

      const warn: string[] = [];
      for (const t of TOKENS) {
        const m = nextMeta[t.key] || {};
        if (m.err) warn.push(`${t.label} has no contract code at that address.`);
        else if (m.zeroSupply)
          warn.push(
            `${m.symbol || t.label} has a total supply of zero — nothing has been minted, so its term contributes nothing to any weight regardless of the multiplier.`,
          );
        else if (m.indexed === false) warn.push(`${m.symbol || t.label} isn't in the explorer index; its balances were read directly from the chain.`);
      }
      setNotice(warn);
      setMeta({ ...nextMeta });
    } catch (e: any) {
      const msg = e?.name === 'AbortError' ? 'A request timed out.' : e?.message || String(e);
      log('FAILED: ' + msg);
      setReadError(msg);
    } finally {
      setReading(false);
      setReadState(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addrsText, exclText, reverify, log]);

  // ---- derived state (mirrors the original render()) ----
  const excludedSet = useMemo(() => new Set(parseAddrs(exclText)), [exclText]);
  const isOut = useCallback(
    (r: { addr: string; contract: boolean }) => excludedSet.has(r.addr) || (exContracts && r.contract) || (exBurn && BURN.has(r.addr)),
    [excludedSet, exContracts, exBurn],
  );

  const all: Row[] = useMemo(() => {
    const bps = BigInt(Math.round((isFinite(parseFloat(mult)) && parseFloat(mult) >= 0 ? parseFloat(mult) : 0) * 10000));
    const pbps = BigInt(Math.round((isFinite(parseFloat(pmult)) && parseFloat(pmult) >= 0 ? parseFloat(pmult) : 0) * 10000));
    return allRows.map((h) => {
      const sw = (h.sweat * bps) / 10000n;
      const pr = (h.presence * pbps) / 10000n;
      const tdfEff = inclStaked ? h.tdf + h.staked : h.tdf;
      const out = isOut(h);
      return { ...h, swWeighted: sw, preWeighted: pr, tdfEff, weight: tdfEff + pr + sw, out };
    });
  }, [allRows, mult, pmult, inclStaked, isOut]);

  const voting = useMemo(() => all.filter((r) => !r.out), [all]);
  const cnt = useMemo(() => voting.filter((r) => r.weight > 0n), [voting]);
  const total = useMemo(() => cnt.reduce((s, r) => s + r.weight, 0n), [cnt]);
  const tT = useMemo(() => cnt.reduce((s, r) => s + r.tdf, 0n), [cnt]);
  const tK = useMemo(() => cnt.reduce((s, r) => s + r.staked, 0n), [cnt]);
  const tP = useMemo(() => cnt.reduce((s, r) => s + r.preWeighted, 0n), [cnt]);
  const tS = useMemo(() => cnt.reduce((s, r) => s + r.swWeighted, 0n), [cnt]);
  const { top5, nak } = useMemo(() => {
    const byW = [...cnt].sort((a, b) => (a.weight < b.weight ? 1 : -1));
    const top5v = byW.slice(0, 5).reduce((s, r) => s + r.weight, 0n);
    let acc = 0n,
      n = 0;
    for (const r of byW) {
      acc += r.weight;
      n++;
      if (acc * 2n > total) break;
    }
    return { top5: top5v, nak: n };
  }, [cnt, total]);
  const setAside = useMemo(() => all.filter((r) => r.out && r.weight > 0n).length, [all]);

  const giniVal = useMemo(() => gini(cnt.map((r) => Number(r.weight))), [cnt]);
  const apo = useMemo(() => apokedro(cnt.map((r) => Number(r.weight))), [cnt]);

  const scenario = useCallback(
    (useStaked: boolean) => {
      const list = voting.map((r) => (useStaked ? r.tdf + r.staked : r.tdf) + r.preWeighted + r.swWeighted).filter((w) => w > 0n);
      const t = list.reduce((s, w) => s + w, 0n);
      const sorted = [...list].sort((x, y) => (x < y ? 1 : -1));
      const top5s = sorted.slice(0, 5).reduce((s, w) => s + w, 0n);
      let a2 = 0n,
        n2 = 0;
      for (const w of sorted) {
        a2 += w;
        n2++;
        if (a2 * 2n > t) break;
      }
      return { total: t, top5: top5s, nak: n2 };
    },
    [voting],
  );
  const scNo = useMemo(() => scenario(false), [scenario]);
  const scYes = useMemo(() => scenario(true), [scenario]);
  const stakedHolders = useMemo(() => voting.filter((r) => r.staked > 0n).length, [voting]);
  const stakedSum = useMemo(() => voting.reduce((s, r) => s + r.staked, 0n), [voting]);

  const memberHolders = useMemo(() => voting.filter((r) => r.member).length, [voting]);
  const nonMemberVoting = voting.length - memberHolders;
  const presenceNoTdf = useMemo(() => all.filter((r) => r.presence > 0n && r.tdf === 0n && r.staked === 0n).length, [all]);
  const stakedNoPresence = useMemo(() => all.filter((r) => r.staked > 0n && r.presence === 0n).length, [all]);

  const rows = useMemo(() => {
    let rs = showOut ? all : voting;
    if (hideZero) rs = rs.filter((r) => r.weight > 0n);
    const qq = q.trim().toLowerCase();
    if (qq) rs = rs.filter((r) => r.addr.includes(qq) || (r.name || '').toLowerCase().includes(qq) || (r.tag || '').toLowerCase().includes(qq));
    const { k, d } = sort;
    return [...rs].sort((a, b) => (a[k] === b[k] ? 0 : (a[k]! < b[k]! ? -1 : 1) * d));
  }, [all, voting, showOut, hideZero, q, sort]);

  const donut = useMemo(() => buildDonut(cnt, total), [cnt, total]);
  const compPie = useMemo(() => buildCompPie(tT + (inclStaked ? tK : 0n), tP, tS, total, inclStaked), [tT, tK, tP, tS, total, inclStaked]);

  const bannerGood = inclStaked;
  const bannerHeadline = inclStaked ? (
    <>
      <strong>Showing Total TDF</strong> — balance + staked. This is the corrected governance weight.
    </>
  ) : allRows.length ? (
    <>
      <strong>Showing balanceOf only</strong> — matches production today, ignoring {fmt(stakedSum, 2)} staked TDF across {stakedHolders} addresses.
    </>
  ) : (
    <>
      <strong>Showing balanceOf only</strong> — this matches what TDF&apos;s production governance actually reads on-chain today.
    </>
  );

  const csv = useCallback(() => {
    const head_ = [
      'rank', 'address', 'label', 'is_contract', 'excluded', 'tdf_liquid', 'tdf_staked', 'staked_counted',
      'presence', 'sweat', 'presence_multiplier', 'sweat_multiplier', 'governance_weight', 'holds_membership_nft', 'block',
    ];
    let rank = 0;
    const lines = [head_.join(',')].concat(
      rows.map((r) => {
        if (!r.out) rank++;
        return [
          r.out ? '' : rank, r.addr, JSON.stringify(r.tag || r.name || ''), r.contract, r.out,
          fmt(r.tdf, 18), fmt(r.staked, 18), inclStaked, fmt(r.presence, 18), fmt(r.sweat, 18),
          pmult, mult, fmt(r.weight, 18), r.member, head ?? '',
        ].join(',');
      }),
    );
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tdf-governance-weight-block-${head ?? 'latest'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [rows, inclStaked, pmult, mult, head]);

  const toggleSort = (k: keyof Row) => setSort((s) => ({ k, d: s.k === k ? ((-s.d) as 1 | -1) : -1 }));
  const setAsideAddr = (addr: string) => {
    const cur = parseAddrs(exclText);
    setExclText(cur.includes(addr) ? cur.filter((x) => x !== addr).join('\n') : cur.concat(addr).join('\n'));
    setExPanelOpen(true);
  };

  useEffect(() => {
    if (diagRef.current) diagRef.current.scrollTop = diagRef.current.scrollHeight;
  }, [diag]);

  const th = (key: keyof Row, label: string, alignLeft = false) => (
    <th
      className={`${alignLeft ? styles.thL : ''} ${sort.k === key ? styles.thOn : ''} ${!alignLeft ? styles.thSortable : ''}`.trim()}
      onClick={() => toggleSort(key)}
      style={{ cursor: 'pointer' }}
    >
      {label}
      <span className={styles.car}>{sort.k === key ? (sort.d < 0 ? '▼' : '▲') : '▽'}</span>
    </th>
  );

  return (
    <div className={styles.page}>
      <div className={styles.wrap}>
        <div className={styles.claudeBar}>
          <span className={styles.ico}>✦</span>
          <span>
            <b>Viewing this in Chrome with Claude?</b> You can ask it directly about this data — try{' '}
            <code>&quot;which addresses would lose majority control if staking were counted?&quot;</code> or{' '}
            <code>&quot;how would governance weight shift if TDF&apos;s share dropped 10%?&quot;</code> — no need to
            read every row yourself. You can also upload the pinkpaper and/or whitepaper alongside this page and ask
            it whether this actual distribution reflects — or drifts from — the community&apos;s covenant and stated
            values.
          </span>
        </div>

        <header className={styles.mast}>
          <div className={styles.mastMain}>
            <div className={styles.brand}>
              <img className={styles.logo} src="/images/admin/icon-sheep.png" alt="Traditional Dream Factory" />
              <p className={styles.eyebrow}>Celo mainnet · live · Traditional Dream Factory</p>
            </div>
            <h1 className={styles.h1}>Who holds weight, and where that weight came from</h1>
            <p className={styles.standfirst}>
              Holder registers for TDF, Presence and Sweat, pulled automatically and merged by address. Contracts
              that hold tokens but don&apos;t vote are set aside rather than deleted, so anyone can check the
              exclusion rather than take it on trust.
            </p>
          </div>
          <span className={styles.credit}>Made with ❤️ by Gustavito</span>
        </header>

        <div className={`${styles.warnband} ${bannerGood ? styles.warnbandGood : styles.warnbandAlarm}`} role="note">
          <span className={styles.ico}>{bannerGood ? '✓' : '⚠'}</span>
          <div>
            <p>{bannerHeadline}</p>
            <p>
              <b>Total TDF</b> is a holder&apos;s full stake: liquid wallet balance <em>plus</em> anything deposited
              via <code>depositStake()</code> into the DAO&apos;s staking contract. <b>balanceOf only</b> is the
              wallet balance alone — which is all that TDF&apos;s production governance actually reads on-chain
              today, because staking moves tokens out of the holder&apos;s balance and production never adds it
              back. Switch views below; the <b>Impact of excluding staked TDF</b> panel further down quantifies
              exactly what the gap changes.
            </p>
          </div>
        </div>

        <div className={styles.viewSwitch} role="group" aria-label="TDF calculation basis">
          <span className={styles.vsLbl}>TDF counted as</span>
          <div className={styles.vsGroup}>
            <button
              type="button"
              className={`${styles.vsB} ${inclStaked ? `${styles.vsActive} ${styles.vsTotalActive}` : ''}`}
              onClick={() => setInclStaked(true)}
            >
              <b>Total TDF</b>
              <small>balance + staked · default</small>
            </button>
            <button
              type="button"
              className={`${styles.vsB} ${!inclStaked ? `${styles.vsActive} ${styles.vsBalanceActive}` : ''}`}
              onClick={() => setInclStaked(false)}
            >
              <b>balanceOf only</b>
              <small>how production reads it today</small>
            </button>
          </div>
          <Qm>
            Governance weight is meant to reflect everything a holder has committed to TDF. Because staking moves
            tokens out of <code>balanceOf</code>, a governance system that only reads <code>balanceOf</code> quietly
            drops every staked token from voting power. &quot;Total TDF&quot; adds it back; &quot;balanceOf
            only&quot; reproduces the bug so you can see its effect.
          </Qm>
        </div>

        <div className={styles.formula}>
          <span className={styles.lbl}>Governance weight</span>
          <span className={`${styles.term} ${styles.termW}`}>Weight</span>
          <span className={styles.op}>=</span>
          <span className={styles.term}>TDF</span>
          {inclStaked && <span className={`${styles.op} ${styles.opStk}`}>+ Staked</span>}
          <span className={styles.op}>+</span>
          <span className={styles.op}>(</span>
          <span className={`${styles.term} ${styles.termP}`}>Presence</span>
          <span className={styles.op}>×</span>
          <input
            type="number"
            className={`mult ${styles.multP}`}
            value={pmult}
            min={0}
            max={1000}
            step={0.5}
            aria-label="Presence multiplier"
            onChange={(e) => setPmult(e.target.value)}
          />
          <span className={styles.op}>)</span>
          <span className={styles.op}>+</span>
          <span className={styles.op}>(</span>
          <span className={`${styles.term} ${styles.termS}`}>Sweat</span>
          <span className={styles.op}>×</span>
          <input
            type="number"
            className="mult"
            value={mult}
            min={0}
            max={1000}
            step={0.5}
            aria-label="Sweat multiplier"
            onChange={(e) => setMult(e.target.value)}
          />
          <span className={styles.op}>)</span>
        </div>
        <p className={styles.hint}>
          Try changing the Presence and Sweat multipliers above — it&apos;s a quick way to explore how shifting the
          formula&apos;s weights could pull governance into closer alignment with what the community actually
          values, rather than treating today&apos;s numbers as fixed.
        </p>

        {allRows.length > 0 && (
          <div className={styles.impact}>
            <h4>
              Impact of excluding staked TDF{' '}
              {inclStaked ? (
                <span className={`${styles.tag} ${styles.tagStaked}`}>showing Total TDF</span>
              ) : (
                <span className={`${styles.tag} ${styles.tagCtr}`}>showing balanceOf only</span>
              )}
            </h4>
            <p>
              {stakedHolders} of {voting.length} voting addresses have TDF staked in the DAO contract, totalling{' '}
              {fmt(stakedSum, 2)} TDF that today&apos;s on-chain governance weight ignores.
            </p>
            <div className={styles.row}>
              <div className={styles.cell}>
                <div className={styles.k}>Voting weight</div>
                <div className={styles.v}>
                  {fmt(scNo.total, 0)}
                  <span className={styles.arrow}>→</span>
                  <span className={styles.after}>{fmt(scYes.total, 0)}</span>
                </div>
              </div>
              <div className={styles.cell}>
                <div className={styles.k}>Majority needs</div>
                <div className={styles.v}>
                  {scNo.nak}
                  <span className={styles.arrow}>→</span>
                  <span className={styles.after}>{scYes.nak}</span>
                  <small> wallets</small>
                </div>
              </div>
              <div className={styles.cell}>
                <div className={styles.k}>Top 5 share</div>
                <div className={styles.v}>
                  {pct(scNo.top5, scNo.total).toFixed(1)}%<span className={styles.arrow}>→</span>
                  <span className={styles.after}>{pct(scYes.top5, scYes.total).toFixed(1)}%</span>
                </div>
              </div>
              <div className={styles.cell}>
                <div className={styles.k}>
                  Total weight grows by
                  <Qm>
                    How much bigger the total voting weight becomes once staked TDF is counted, compared to
                    today&apos;s balanceOf-only total — here, {fmt(scNo.total, 0)} growing to {fmt(scYes.total, 0)}{' '}
                    is a +{pct(stakedSum, scNo.total).toFixed(1)}% increase. This is a growth rate, not a share of
                    the pie — it is not supposed to add up to 100% with anything else on this page.
                  </Qm>
                </div>
                <div className={`${styles.v} ${styles.after}`}>+{pct(stakedSum, scNo.total).toFixed(1)}%</div>
              </div>
            </div>
          </div>
        )}

        <div className={styles.assump}>
          <h4>⚑ Open question: who should actually be voting?</h4>
          <p>
            Every figure on this page counts <b>any address holding TDF, Presence or Sweat</b> as a voter. That is
            not what OASA&apos;s own Articles describe for a Project like TDF:{' '}
            <em>
              &quot;Token Holders that are also Project DAO Members must be allowed to participate in the
              project&apos;s governance&quot;
            </em>{' '}
            (OASA Whitepaper v1.2) — Membership is a separate, accepted status, not just a balance. The closest
            on-chain source of truth for that status is the{' '}
            <a
              href={`https://celo.blockscout.com/token/${MEMBERSHIP_ADDRESS}?tab=holders`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <b>TDF Membersheep</b>
            </a>{' '}
            NFT registry (<code>{shortA(MEMBERSHIP_ADDRESS)}</code>), read live below. TDF&apos;s actual production
            governance configuration is not something the developer of this page has full visibility into, so this
            stays flagged openly rather than assumed away.
          </p>
          {allRows.length > 0 && (
            <>
              <div className={styles.assumpRow}>
                <div className={styles.cell}>
                  <div className={styles.k}>
                    Membersheep NFTs
                    <Qm>
                      Total supply of the TDF Membersheep ERC-721, read live from the contract — the closest
                      on-chain signal of who has actually been accepted as a Member, independent of any token
                      balance.
                    </Qm>
                  </div>
                  <div className={styles.v}>{membershipTotal ?? '—'}</div>
                </div>
                <div className={styles.cell}>
                  <div className={styles.k}>
                    Voting addrs. holding one
                    <Qm>
                      Of the addresses this page currently counts as voting by token balance alone, this many also
                      hold the Membersheep NFT.
                    </Qm>
                  </div>
                  <div className={styles.v}>
                    {memberHolders}
                    <small> of {voting.length}</small>
                  </div>
                </div>
                <div className={styles.cell}>
                  <div className={styles.k}>Counted without one</div>
                  <div className={styles.v} style={{ color: 'var(--sulphur)' }}>
                    {nonMemberVoting}
                  </div>
                </div>
                <div className={styles.cell}>
                  <div className={styles.k}>Presence, zero TDF</div>
                  <div className={styles.v}>{presenceNoTdf}</div>
                </div>
                <div className={styles.cell}>
                  <div className={styles.k}>Staked, zero Presence</div>
                  <div className={styles.v}>{stakedNoPresence}</div>
                </div>
              </div>
              <ul>
                {membershipTotal != null && (
                  <li>
                    The community&apos;s own figure is 60+ voting members today; the Membersheep registry currently
                    shows <b>{membershipTotal}</b> holders on chain. That gap is real, and this page can&apos;t
                    explain it (stale roster? membership granted some other way? indexing lag?) — flagged for
                    reconciliation rather than smoothed over.
                  </li>
                )}
                <li>
                  <b>{nonMemberVoting}</b> of the {voting.length} addresses counted as voting above do <em>not</em>{' '}
                  hold the Membersheep NFT — by the whitepaper&apos;s own Member requirement, their governance
                  weight here may not reflect actual voting rights.
                </li>
                {presenceNoTdf > 0 && (
                  <li>
                    <b>{presenceNoTdf}</b> address{presenceNoTdf === 1 ? '' : 'es'} hold Presence with zero TDF right
                    now (liquid or staked). Plausible if they staked to book a stay, checked in and earned Presence,
                    then later withdrew the stake — a live balance snapshot can&apos;t see TDF that was staked and
                    released in the past.
                  </li>
                )}
                {stakedNoPresence > 0 && (
                  <li>
                    <b>{stakedNoPresence}</b> address{stakedNoPresence === 1 ? '' : 'es'} have staked TDF but zero
                    Presence yet. Per the whitepaper, staking $TDF is how a Member books a stay (&quot;Members with
                    $TDF can use the same Tokens every year to book their stays&quot;), while Proof of Presence is
                    minted once that stay is actually checked into (&quot;PoP is produced through an on-chain
                    booking mechanism... that tracks the number of nights a Member stays&quot;). Reads as a booking
                    made but not yet checked into — the same flow, one step behind — not two unrelated systems.
                  </li>
                )}
                <li>
                  The whitepaper&apos;s own suggested formula weighs Presence the same as Sweat (both ×5); this page
                  defaults Presence to ×1. Try setting the Presence multiplier to 5 above to see governance closer to
                  how the whitepaper itself sketches it.
                </li>
              </ul>
            </>
          )}
        </div>

        <div className={styles.bar}>
          <button className="pageBtn primary" disabled={reading} onClick={read}>
            {reading ? 'Reading…' : 'Read current state'}
          </button>
          <button className="pageBtn" disabled={!allRows.length} onClick={csv}>
            Download CSV
          </button>
          <input className={styles.search} placeholder="filter by address or label" aria-label="Filter" value={q} onChange={(e) => setQ(e.target.value)} />
          <label className={styles.toggle}>
            <input type="checkbox" checked={showOut} onChange={(e) => setShowOut(e.target.checked)} /> Show excluded
          </label>
          <label className={styles.toggle}>
            <input type="checkbox" checked={hideZero} onChange={(e) => setHideZero(e.target.checked)} /> Hide zero weight
          </label>
        </div>

        {notice.length > 0 && (
          <div className={styles.notice}>
            {notice.map((n, i) => (
              <div key={i}>
                <b>{n.split(' ')[0]}</b> {n.slice(n.indexOf(' ') + 1)}
              </div>
            ))}
          </div>
        )}
        {readError && (
          <div className={styles.notice} style={{ borderLeftColor: 'var(--alarm)' }}>
            {readError}
          </div>
        )}

        <details className={styles.panel} open={exPanelOpen} onToggle={(e) => setExPanelOpen((e.target as HTMLDetailsElement).open)}>
          <summary>Exclusion register</summary>
          <div className={styles.panelInner}>
            <p>
              Addresses here are read and shown, but kept out of the totals and concentration figures. Treasuries,
              Safes and pool contracts hold tokens without voting. Click ✕ on any row to add it here.
            </p>
            <textarea value={exclText} onChange={(e) => setExclText(e.target.value)} />
            <div className={styles.bar} style={{ marginTop: 9 }}>
              <label className={styles.toggle}>
                <input type="checkbox" checked={exContracts} onChange={(e) => setExContracts(e.target.checked)} /> Exclude every contract address
              </label>
              <label className={styles.toggle}>
                <input type="checkbox" checked={exBurn} onChange={(e) => setExBurn(e.target.checked)} /> Exclude burn &amp; null
              </label>
            </div>
          </div>
        </details>

        <details className={styles.panel}>
          <summary>Extra addresses &amp; endpoint</summary>
          <div className={styles.panelInner}>
            <p>Anything pasted here is added to the register even if the indexer misses it. Balances are read straight from the chain, so this always works.</p>
            <textarea placeholder="0x… one per line" value={addrsText} onChange={(e) => setAddrsText(e.target.value)} />
            <div className={styles.bar} style={{ marginTop: 9 }}>
              <input className={styles.rpcin} value={RPC_URL} aria-label="RPC endpoint" readOnly />
              <label className={styles.toggle}>
                <input type="checkbox" checked={reverify} onChange={(e) => setReverify(e.target.checked)} /> Re-read every balance on chain (slower)
              </label>
            </div>
          </div>
        </details>

        <div className={styles.sources}>
          {TOKENS.map((t) => {
            const m = meta[t.key] || {};
            const pill = m.err ? (
              <span className={`${styles.pill} ${styles.pillErr}`}>{m.err}</span>
            ) : m.zeroSupply ? (
              <span className={`${styles.pill} ${styles.pillWarn}`}>supply 0</span>
            ) : m.indexed === false ? (
              <span className={`${styles.pill} ${styles.pillWarn}`}>not indexed</span>
            ) : m.symbol ? (
              <span className={`${styles.pill} ${styles.pillOk}`}>ERC-20</span>
            ) : null;
            return (
              <div key={t.key} className={`${styles.src} ${t.cls}`}>
                <h3>
                  {m.symbol ? m.symbol + ' · ' : ''}
                  {m.name || t.label}
                  {pill}
                </h3>
                <div className={styles.addr}>
                  <a href={`${EXP}${t.address}`} target="_blank" rel="noopener noreferrer">
                    {t.address}
                  </a>
                </div>
                <div className={styles.stat}>
                  <span>total supply</span>
                  <b>{m.supply != null ? fmt(m.supply, 2) : '—'}</b>
                </div>
                <div className={styles.stat}>
                  <span>holders on chain</span>
                  <b>{m.holders ?? '—'}</b>
                </div>
                <div className={styles.stat}>
                  <span>counted as voting</span>
                  <b>{m.voting ?? '—'}</b>
                </div>
              </div>
            );
          })}
        </div>

        {allRows.length > 0 && (
          <div className={styles.metrics}>
            <div className={styles.metric}>
              <div className={styles.k}>Voting weight</div>
              <div className={styles.v}>{fmt(total, 0)}</div>
            </div>
            <div className={styles.metric}>
              <div className={styles.k}>Voting addresses</div>
              <div className={styles.v}>{cnt.length}</div>
            </div>
            <div className={styles.metric}>
              <div className={styles.k}>Set aside</div>
              <div className={styles.v}>{setAside}</div>
            </div>
            <div className={styles.metric}>
              <div className={styles.k}>Top 5 share</div>
              <div className={styles.v}>
                {pct(top5, total).toFixed(1)}
                <small>%</small>
              </div>
            </div>
            <div className={styles.metric}>
              <div className={styles.k}>
                Majority needs
                <Qm>
                  How many wallets, added up from largest to smallest, it takes to cross 50% of all voting weight.
                  This assumes 100% quorum — every voting address casting its full weight. In practice most votes
                  see partial turnout, and the fewer addresses that actually vote, the fewer wallets are needed to
                  hold a working majority of the votes actually cast.
                </Qm>
              </div>
              <div className={styles.v}>
                {nak}
                <small> wallets</small>
              </div>
            </div>
            <div className={styles.metric}>
              <div className={styles.k}>
                Gini
                <Qm>
                  Inequality of governance weight across every voting address, 0 (everyone equal) to 1 (one address
                  holds it all). Standard in decentralization research, but — as Papangelou et al. (Blockchains
                  2025, 3(1), 4) note — it ignores how many addresses there are: a 2-wallet split can score as
                  &quot;equal&quot; as a 1,000-wallet one. With {cnt.length} voting addresses here, that small-sample
                  distortion is not a concern.
                </Qm>
              </div>
              <div className={styles.v}>{giniVal.toFixed(3)}</div>
            </div>
            {apo && (
              <div className={styles.metric}>
                <div className={styles.k}>
                  Apokedro
                  <Qm>
                    ELI5: imagine every possible little gang of wallets that could team up and, together, out-vote
                    everyone else. Not just the smallest gang — every gang that would work. A gang of 1 barely has
                    to &quot;agree&quot; with itself, so it is scary if that is enough. A gang of 15 has to get 15
                    different wallets to secretly agree, which is much harder to pull off. This number averages how
                    easy that agreeing would be, across every gang that could do it. Close to 0 = no realistic gang
                    could take over, power is spread out. Close to 1 = one or two wallets already have enough, no
                    teamwork needed. It is a stricter cousin of &quot;Majority needs&quot; above: that metric only
                    looks at the single smallest gang; this one looks at all of them. From Papangelou, Christodoulou
                    &amp; Inglezakis, &quot;Apokedro: A Decentralization Index for DAOs and Beyond&quot; (Blockchains
                    2025, 3(1), 4).{' '}
                    {apo.approximated
                      ? `Exact counting of every gang gets combinatorially huge fast, so — same as the paper itself — past 28ish wallets this is estimated by keeping the biggest holders exact and compressing the long tail of ${cnt.length} addresses down to ${apo.n} representative stand-ins first.`
                      : `Computed exactly across all ${apo.n} voting addresses.`}
                  </Qm>
                </div>
                <div className={styles.v}>
                  {apo.value.toFixed(3)}
                  {apo.approximated && <small> · approx.</small>}
                </div>
              </div>
            )}
          </div>
        )}

        {cnt.length > 0 && total > 0n && (
          <div className={styles.chartsRow}>
            <div className={styles.chartwrap}>
              <div className={styles.chartTitle}>Holder concentration</div>
              {donut && (
                <>
                  <div dangerouslySetInnerHTML={{ __html: donut.svg }} />
                  <div className={styles.keys} dangerouslySetInnerHTML={{ __html: donut.keysHtml }} />
                </>
              )}
            </div>
            <div className={styles.chartwrap}>
              <div className={styles.chartTitle}>Weight by source</div>
              {compPie && (
                <>
                  <div dangerouslySetInnerHTML={{ __html: compPie.svg }} />
                  <div className={styles.keys} dangerouslySetInnerHTML={{ __html: compPie.keysHtml }} />
                </>
              )}
              <p className={styles.chartNote}>
                Values include the multipliers set above — presence ×{pmult}, sweat ×{mult}.
              </p>
            </div>
          </div>
        )}

        <div className={styles.tablewrap}>
          {!allRows.length ? (
            <div className={styles.state}>
              <h4>Nothing read yet</h4>
              <p>
                Press <b>Read current state</b>. It pages through every holder of each contract, then reads anything
                the indexer doesn&apos;t cover directly from the chain.
              </p>
            </div>
          ) : reading && readState ? (
            <div className={styles.state}>
              <h4>
                <span className={styles.spin} />
                {readState.h}
              </h4>
              <p>{readState.p}</p>
            </div>
          ) : !rows.length ? (
            <div className={styles.state}>
              <h4>No rows to show</h4>
              <p>Every address was filtered or set aside.</p>
            </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.thL}>#</th>
                  <th className={styles.thL}>Address</th>
                  {th('tdf', 'TDF')}
                  {th('staked', 'Staked')}
                  {th('presence', 'Presence')}
                  {th('sweat', 'Sweat')}
                  {th('weight', 'Governance weight')}
                  <th>Share</th>
                  <th>Composition</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  let rank = 0;
                  return rows.map((r) => {
                    const w = r.weight === 0n ? 1n : r.weight;
                    const a = Number((r.tdf * 10000n) / w) / 100;
                    const k2 = Number(((inclStaked ? r.staked : 0n) * 10000n) / w) / 100;
                    const b = Number((r.preWeighted * 10000n) / w) / 100;
                    const c = Math.max(0, 100 - a - k2 - b);
                    if (!r.out) rank++;
                    return (
                      <tr key={r.addr} className={r.out ? styles.rowOut : ''}>
                        <td className={`${styles.tdL} ${styles.rank}`}>{r.out ? '—' : rank}</td>
                        <td className={`${styles.tdL} ${styles.addrCell}`}>
                          <a href={`${EXP}${r.addr}`} target="_blank" rel="noopener noreferrer">
                            {shortA(r.addr)}
                          </a>
                          {r.tag && <span className={`${styles.tag} ${styles.tagLbl}`}>{r.tag}</span>}
                          {r.contract && <span className={`${styles.tag} ${styles.tagCtr}`}>contract</span>}
                          {BURN.has(r.addr) && <span className={`${styles.tag} ${styles.tagBurn}`}>burn</span>}
                          <button className={styles.xbtn} title={r.out ? 'Restore to the count' : 'Set aside'} onClick={() => setAsideAddr(r.addr)}>
                            {r.out ? '↺' : '✕'}
                          </button>
                        </td>
                        <td className={r.tdf === 0n ? styles.tdZero : ''}>{fmt(r.tdf, 2)}</td>
                        <td className={`${styles.tdStaked} ${r.staked === 0n ? styles.tdZero : ''}`} style={r.staked > 0n && !inclStaked ? { opacity: 0.55 } : undefined}>
                          {fmt(r.staked, 2)}
                        </td>
                        <td className={r.presence === 0n ? styles.tdZero : ''}>{fmt(r.presence, 2)}</td>
                        <td className={r.sweat === 0n ? styles.tdZero : ''}>{fmt(r.sweat, 2)}</td>
                        <td className={styles.tdWeight}>{fmt(r.weight, 2)}</td>
                        <td>{r.out ? '—' : pct(r.weight, total).toFixed(2) + '%'}</td>
                        <td>
                          <div className={styles.comp} title={`TDF ${a.toFixed(0)}% · Staked ${k2.toFixed(0)}% · Presence ${b.toFixed(0)}% · Sweat ${c.toFixed(0)}%`}>
                            <span className={styles.cTdf} style={{ width: `${a}%` }} />
                            <span className={styles.cStk} style={{ width: `${k2}%` }} />
                            <span className={styles.cPre} style={{ width: `${b}%` }} />
                            <span className={styles.cSwt} style={{ width: `${c}%` }} />
                          </div>
                        </td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          )}
        </div>

        {rows.length > 0 && (
          <div className={styles.legend}>
            <span>
              <i style={{ background: 'var(--ink)' }} />
              TDF
            </span>
            <span>
              <i style={{ background: 'var(--staked)' }} />
              Staked TDF (only shown when counted)
            </span>
            <span>
              <i style={{ background: 'var(--presence)' }} />
              Presence
            </span>
            <span>
              <i style={{ background: 'var(--sulphur)' }} />
              Sweat, multiplied
            </span>
            <span>Bar shows composition of each holder&apos;s weight</span>
          </div>
        )}

        <details className={styles.panel}>
          <summary>Diagnostics</summary>
          <pre ref={diagRef} className={styles.diag}>
            {diag.length ? diag.join('\n') : 'Idle.'}
          </pre>
        </details>

        <footer className={styles.pageFooter}>
          <span>{head != null ? `Block ${head.toLocaleString()}` : 'Block —'}</span>
          <span>
            {allRows.length ? `${cnt.length} voting · presence ×${pmult} · sweat ×${mult}${inclStaked ? ' · staked counted' : ''}` : '— voting addresses'}
          </span>
          <span>Blockscout index + balanceOf + stakedBalanceOf @ latest</span>
          <span>Made with ❤️ by Gustavito</span>
        </footer>
      </div>
    </div>
  );
};

export default GovernanceWeight;
