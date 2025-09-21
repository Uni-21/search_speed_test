# 設計概要
- フロントエンドのみで完結（コスト削減）。
- フレームワークは Svelte + Vite を前提に記述（他フレームワークでも概念は同様）。
- デプロイ先は Netlify（静的サイト）。
- 回答秘匿はハッシュ照合方式で抑止レベルを確保し、必要に応じてコード分割や遅延ロードを導入。

## ディレクトリ構成（提案）
```
/ (repo root)
├─ documents/                 # 仕様書・図面
│  └─ spec.md
├─ public/                    # 静的アセット（アイコン、OGP 画像など）
├─ src/
│  ├─ app.d.ts                # 型補助
│  ├─ main.ts                 # エントリポイント
│  ├─ app.css                 # グローバルスタイル（必要最小限）
│  ├─ routes/                 # 画面（Svelte + SPA）
│  │  ├─ +layout.svelte       # 共通レイアウト（ヘッダ/フッタ不要なら空）
│  │  ├─ +page.svelte         # Top（Start）
│  │  ├─ quiz/+page.svelte    # 問題画面（1..10）
│  │  └─ result/+page.svelte  # 結果画面
│  ├─ components/             # 再利用 UI
│  │  ├─ Timer.svelte
│  │  ├─ AnswerForm.svelte
│  │  └─ GradeBadge.svelte
│  ├─ features/quiz/          # ドメインロジック
│  │  ├─ quiz.store.ts        # セッション状態（writable store）
│  │  ├─ scorer.ts            # 採点（正答率・速度スコア・総合点・グレード）
│  │  ├─ normalizer.ts        # 入力正規化（NFKC 等）
│  │  ├─ hasher.ts            # WebCrypto による SHA-256 ハッシュ
│  │  ├─ loader.ts            # 問題プールのロード・ランダム抽出
│  │  └─ types.ts             # Question/Result 等の型
│  ├─ data/                   # 問題データ
│  │  ├─ pool-1.source.json   # 開発用（平文・Git管理対象）
│  │  └─ pool-1.json          # 本番用（ハッシュ化・ビルド時生成）
│  ├─ i18n/
│  │  ├─ ja.json              # 初期言語
│  │  └─ en.json              # 将来対応
│  ├─ lib/
│  │  ├─ i18n.ts              # 文言取得ヘルパ
│  │  ├─ storage.ts           # localStorage 安全ラッパ
│  │  └─ time.ts              # 時間計測ユーティリティ
│  ├─ styles/                 # コンポーネント以外の CSS（必要に応じて）
│  └─ tests/                  # テスト（Vitest/Playwright）
├─ scripts/                   # ビルドスクリプト
│  └─ hash-questions.js       # 問題データハッシュ化スクリプト
├─ netlify.toml               # デプロイ設定
├─ package.json
└─ tsconfig.json
```

## 主要モジュール仕様
### 1) 状態管理（`features/quiz/quiz.store.ts`）
- Svelte の `writable` を使用。
- 状態（抜粋）：
  ```ts
  type QuizSession = {
    status: 'idle' | 'running' | 'finished';
    startedAt: number | null;         // ms epoch
    finishedAt: number | null;        // ms epoch
    currentIndex: number;             // 0..9
    questions: Question[];            // 10問（重複なし）
    answers: Array<{ value: string; correct: boolean; skipped: boolean; timeMs: number }>; 
  };
  ```
- イベント：`start() / answer(value) / skip() / next() / finish()`。
- リロード時は仕様上「最初から」だが、誤操作対策で **明示的に復元しない** 実装とする。

### 2) 正規化（`features/quiz/normalizer.ts`）
- 手順：NFKC → trim → multiple spaces collapse → 句読点/全角空白除去 → 小文字化 → カナ統一。
- 依存：ネイティブ API + 小規模ユーティリティのみ（外部ライブラリ極力不使用）。

### 3) ハッシュ照合（`features/quiz/hasher.ts`）
- WebCrypto API を使用：
  ```ts
  export async function sha256Hex(input: string): Promise<string> {
    const enc = new TextEncoder().encode(input);
    const buf = await crypto.subtle.digest('SHA-256', enc);
    return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
  }
  ```
- 採点時：`sha256Hex(normalize(userInput))` を `acceptedHash[]` と比較。

### 4) 問題ローダ（`features/quiz/loader.ts`）
- セッション開始時に `pool-1.json` を読み込み、10 問を **重複なしランダム抽出**。
- **難易度構成**：標準セッション構成（難易度5：1問、難易度4：1問、難易度3：3問、難易度2：3問、難易度1：2問）に基づいて選出。
- 各難易度内でランダム選択、ジャンルはバランス調整なし（純粋ランダム）。
- シンプルな一括ロード方式を採用。

### 5) 採点（`features/quiz/scorer.ts`）
- 正答率：`correctCount / 10`。
- 速度スコア：基準 300 秒、`clamp(0, 100 * (base / elapsedSec), 100)`。
- 総合点：`0.7 * 正答率(%) + 0.3 * 速度スコア(%)`。
- グレード：総合点→ 20 段階マッピング（閾値テーブルで実装）。

### 6) 型定義（`features/quiz/types.ts`）
```ts
export type Question = {
  id: string;
  prompt: string;
  type: 'text';
  acceptedHash: string[]; // 正解候補（正規化後の SHA-256）
  tags?: string[];
  genre: '知識' | '思考力' | '知識＋思考力';
  difficulty: 1 | 2 | 3 | 4 | 5; // 1=瞬発系, 2=基礎, 3=標準, 4=応用, 5=難問
};

export type Result = {
  totalTimeMs: number;
  correctCount: number;
  skippedCount: number;
  accuracyPct: number;
  speedScorePct: number;
  totalScorePct: number;
  grade: string; // 20段階
};
```

### 7) ビルド時ハッシュ化システム（`scripts/hash-questions.js`）
- **開発時**：`src/data/pool-1.source.json` で平文の回答を管理
- **ビルド時**：自動でハッシュ化し `src/data/pool-1.json` を生成
- **正規化処理**：normalizer.tsと同じロジックを使用してハッシュ値を生成
- **npm script統合**：`prebuild` フックでビルド前に自動実行

## 画面コンポーネント設計
- **Top**：説明＋Start（`/`）
- **Quiz**：
  - `Timer` … `startedAt` からの通算を表示
  - `AnswerForm` … 入力＋Enter送信、スキップボタン統合
  - **トースト通知** … 正解・不正解時の上部固定メッセージ
  - **完了画面** … 全問題完了時の「結果を見る」ボタン
- **Result**：総経過、正答率、未回答、総合点、グレード（`GradeBadge`）

## i18n 設計
- `i18n/ja.json` 例：
```json
{
  "title": "検索解決スピードテスト",
  "start": "START",
  "question": "問題",
  "answer_placeholder": "ここに回答を入力",
  "skip": "スキップ",
  "result": {
    "title": "結果",
    "time": "経過時間",
    "accuracy": "正答率",
    "skipped": "未回答",
    "score": "総合点",
    "grade": "グレード"
  }
}
```
- `lib/i18n.ts` でキー取得関数を提供。将来は言語切替 UI を追加可能。

## ビルド/デプロイ
- `package.json`（抜粋）
```json
{
  "scripts": {
    "dev": "vite dev",
    "prebuild": "npm run hash-questions",
    "build": "vite build",
    "preview": "vite preview",
    "hash-questions": "node scripts/hash-questions.js src/data/pool-1.source.json src/data/pool-1.json"
  }
}
```
- `netlify.toml`
```toml
[build]
  command = "npm run build"
  publish = "dist"
```
- 環境変数：現時点は不要（将来 Telemetry を送るなら `VITE_API_BASE` などを想定）。

## テスト方針
- **ユニット**：`normalizer`, `hasher`, `scorer`, `loader` を Vitest で網羅。
- **E2E**：Start→10問→Result のハッピーパス、スキップ動作、入力正規化ケースを Playwright で自動化。
- **アクセシビリティ**：`@axe-core/playwright` で主要画面の自動チェック。

## アクセシビリティ
- キーボード操作で完結（Tab 移動、Enter 送信、Esc でダイアログ閉）。
- フォームの `aria-label`、ライブリージョンでタイマー更新を過剰に通知しない。
- コントラスト比 WCAG AA 以上。

## パフォーマンス/サイズ目標
- 初回ロード ≤ 100KB（gzip）。`pool-2.json` は遅延ロードで分割。
- 画像・フォントは極小／不要なら持たない。
- 依存ライブラリ最小化（ユーティリティ自前実装）。

## セキュリティ/チート抑止
- 正解は平文で同梱しない（ハッシュのみ）。
- ハッシュ表は Base64 で分割格納（任意）。
- 後半問題は動的 import。DevTools での辞書攻撃は原理上可能である旨を仕様として明記。

### 8) ジャンルと難易度システム
- **ジャンル分類**：知識（歴史、地理、科学基礎等）、思考力（算数、数学、論理パズル等）、知識＋思考力（応用問題等）
- **難易度レベル**：
  1. 瞬発系（5秒以内、例：日本の首都は？）
  2. 基礎レベル（5〜15秒、例：72÷8は？）
  3. 標準レベル（15〜60秒、例：n=10のときn(n+1)/2の値は？）
  4. 応用レベル（1〜3分、例：サイコロ2つの和が7になる確率は？）
  5. 難問レベル（3分以上、例：3人の神パズル等）
- **セッション構成**：難易度5（1問）、難易度4（1問）、難易度3（3問）、難易度2（3問）、難易度1（2問）の計10問
- **データ形式**：
```json
{
  "id": "q001",
  "prompt": "日本の首都は？",
  "genre": "知識",
  "difficulty": 1,
  "acceptedAnswers": ["とうきょう", "tokyo", "東京"]
}
```

## 将来拡張
- ジャンル別フィルタ機能
- ランキング（サーバレス採点が必要）
- 共有用 OGP 生成
- カスタム難易度構成

## 作業タスクリスト（初回スプリント）
1. プロジェクト雛形作成（Vite + Svelte + TS）
2. 型・ユーティリティ（types/normalizer/hasher/scorer）実装
3. 画面実装（Top/Quiz/Result）
4. ローダ & ランダム抽出実装（pool-1 のみで開始）
5. 採点・グレード実装
6. 単体テスト整備（Vitest）
7. E2E シナリオ 1 本（Playwright）
8. Netlify デプロイ（プレビュー URL 確認）
9. pool-2 の遅延ロード導入
