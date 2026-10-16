/** BM25 retrieval over the build-time chat index, plus the topic gate. */
import index from '../../data/chat-index.json';

export interface Chunk {
  id: string;
  title: string;
  url: string;
  text: string;
}

const STOP = new Set(
  'a an the and or but of to in on for with at by from is are was were be been it this that these those as do does did what who how why when where which can could would should about tell me you your his he him piyush mehta'.split(
    ' ',
  ),
);

export const tokenize = (s: string): string[] =>
  (s.toLowerCase().match(/[a-z0-9][a-z0-9.+#-]*/g) ?? []).filter(
    (t) => !STOP.has(t) && t.length > 1,
  );

const K1 = 1.4;
const B = 0.75;

export class Bm25 {
  private tf: Map<string, number>[];
  private len: number[];
  private df = new Map<string, number>();
  private avg: number;

  constructor(readonly docs: Chunk[]) {
    this.tf = docs.map((d) => {
      const m = new Map<string, number>();
      for (const t of tokenize(`${d.title} ${d.text}`)) m.set(t, (m.get(t) ?? 0) + 1);
      return m;
    });
    this.len = this.tf.map((m) => [...m.values()].reduce((a, b) => a + b, 0));
    this.avg = this.len.reduce((a, b) => a + b, 0) / Math.max(1, docs.length);
    for (const m of this.tf) for (const t of m.keys()) this.df.set(t, (this.df.get(t) ?? 0) + 1);
  }

  search(query: string, k = 5): { chunk: Chunk; score: number }[] {
    const terms = [...new Set(tokenize(query))];
    const n = this.docs.length;
    const scored = this.docs.map((chunk, i) => {
      let score = 0;
      for (const t of terms) {
        const f = this.tf[i].get(t);
        if (!f) continue;
        const df = this.df.get(t) ?? 0;
        const idf = Math.log(1 + (n - df + 0.5) / (df + 0.5));
        score += (idf * f * (K1 + 1)) / (f + K1 * (1 - B + (B * this.len[i]) / this.avg));
      }
      return { chunk, score };
    });
    return scored
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, k);
  }
}

let cached: Bm25 | undefined;
export const getIndex = (): Bm25 => (cached ??= new Bm25((index as { docs: Chunk[] }).docs));

/** Meta intents that are on-topic without needing retrieval support. */
const META =
  /^(hi|hello|hey|yo|thanks|thank you|help|who are you|what can you do|what are you|what is this)\b[\s!.?]*$/i;

export type Gate =
  | { kind: 'allow'; chunks: Chunk[]; reason: 'meta' }
  /** Everything else needs the fail-closed scope classifier; keywords are never proof of scope. */
  | { kind: 'classify'; chunks: Chunk[] };

export function topicGate(question: string, idx: Bm25 = getIndex()): Gate {
  const q = question.trim();
  if (META.test(q)) return { kind: 'allow', chunks: [], reason: 'meta' };
  // Short profile questions can contain only stop words; always ground the site's subject.
  const profile = idx.docs.filter((d) => d.id.startsWith('facts:'));
  const hits = idx.search(q, 5).map((h) => h.chunk);
  return {
    kind: 'classify',
    chunks: [...profile, ...hits.filter((d) => !d.id.startsWith('facts:'))].slice(0, 5),
  };
}
