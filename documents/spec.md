# 仕様コンセプト
- 名称：検索解決スピードテスト
- 概要：超シンプルな Web アプリ（ゲーム）
- 目的：出題される問題に対し、**いかに素早く正答できるか** を競う
- 解答手段は自由。生成 AI、Google 検索、SNS（X など）、自身の知識や推論など、現実世界の課題解決と同様に多様なアプローチが想定される。
- もちろん、自身の知識で即答できる場合が最速となる。

---
# 詳細仕様
## 1. タイマー
- **全問通算タイマー**を採用。
  - START 押下時に開始し、10 問を通じてリセットせずに計測を継続する。
  - 一時停止機能はなし。
- **途中離脱・再開**：ブラウザを閉じたりリロードした場合は、最初からやり直しとなり、通算タイマーもリセットされる。

## 2. 画面フロー
- **トップページ**：サイトタイトル、説明文、START ボタンのみを表示。
- **問題画面**：質問文、回答フォーム（自由入力）、通算経過時間、スキップボタンを表示。
- **問題数**：1 セッションにつき 10 問。
- **結果画面**：総経過時間、正答率、未回答件数、総合点、20 段階のグレードを表示。

## 3. スキップ
- スキップは **誤答扱い** とし、正答率の分母に含めるが分子には含めない。
- 結果画面では **未回答（スキップ）件数** を明示する。
- スキップによる速度ペナルティはなし（通算タイマーはそのまま進行）。

## 4. 回答フォーム
- **自由入力**方式を採用。
- 問題文中に、必要に応じて表記の指定（例：かな／漢字、半角／全角など）を記載する。
- 採点時は以下の正規化を行う：
  - Unicode 正規化（NFKC）
  - 前後の空白除去、連続空白の正規化
  - 句読点・全角空白の除去
  - アルファベット小文字化
  - カナ表記のゆれ統一（カタカナ／ひらがな）
- 同義語や別表記は複数の受理候補として登録可能。

## 5. 問題データ
- 約 1,000 問を目標に、事前に大量の問題集を準備（別タスクで対応）。
- 1 セッションでは問題プールから **ランダム抽出（重複なし）** で 10 問を選出。
- 出題順はシャッフルする。

## 6. 採点ロジック
- 総合点（0–100）：`総合点 = 0.7 × 正答率(%) + 0.3 × 速度スコア(%)`
- 速度スコア（0–100）：
  - 基準時間 = 300 秒（10 問 × 30 秒を想定）
  - 計算式：`速度スコア(%) = clamp(0, 100 × (基準時間 / 実経過秒), 100)`
  - 解答が早いほど高得点。基準時間は調整可能。

## 7. チート対策
- **ハッシュ照合方式**を採用：
  - 正規化後の解答文字列を SHA-256 でハッシュ化し、問題データに格納された受理ハッシュ群と照合。
  - プレーンテキストの正答は含めない。
  - 同義語は複数のハッシュ値で登録可能。
- 必要に応じて軽度の難読化（Base64 等）や後半問題の遅延ロードを実施。
- 完全な秘匿は困難であるため、抑止レベルの対策に留める。

## 8. アクセシビリティ／多言語対応
- 初期版は日本語のみを提供。
- 文言リソースは i18n 対応を前提として管理し、将来的な多言語化を可能にする。

## 9. グレード（20 段階）
1. God
2. Genius
3. SSS  
4. SS  
5. S  
6. A+  
7. A  
8. A-  
9. B+  
10. B  
11. B-  
12. C+  
13. C  
14. C-  
15. D+  
16. D  
17. D-  
18. E+  
19. E  
20. E-

---
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
│  │  ├─ SkipButton.svelte
│  │  └─ GradeBadge.svelte
│  ├─ features/quiz/          # ドメインロジック
│  │  ├─ quiz.store.ts        # セッション状態（writable store）
│  │  ├─ quiz.state.ts        # 状態遷移（型・イベント）
│  │  ├─ scorer.ts            # 採点（正答率・速度スコア・総合点・グレード）
│  │  ├─ normalizer.ts        # 入力正規化（NFKC 等）
│  │  ├─ hasher.ts            # WebCrypto による SHA-256 ハッシュ
│  │  ├─ loader.ts            # 問題プールのロード（前半/後半の遅延ロード）
│  │  └─ types.ts             # Question/Result 等の型
│  ├─ data/                   # 問題データ（静的 JSON を想定）
│  │  ├─ pool-1.json          # 前半 500 問（ビルド時に同梱）
│  │  └─ pool-2.json          # 後半 500 問（到達時に動的 import）
│  ├─ i18n/
│  │  ├─ ja.json              # 初期言語
│  │  └─ en.json              # 将来対応
│  ├─ lib/
│  │  ├─ i18n.ts              # 文言取得ヘルパ
│  │  ├─ storage.ts           # localStorage 安全ラッパ
│  │  └─ time.ts              # 時間計測ユーティリティ
│  ├─ styles/                 # コンポーネント以外の CSS（必要に応じて）
│  └─ tests/                  # テスト（Vitest/Playwright）
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

### 2) 状態遷移（`features/quiz/quiz.state.ts`）
- `idle → running → finished` の単純なステートマシン。
- `running` 中のみ `answer/skip/next` を受理。

### 3) 正規化（`features/quiz/normalizer.ts`）
- 手順：NFKC → trim → multiple spaces collapse → 句読点/全角空白除去 → 小文字化 → カナ統一。
- 依存：ネイティブ API + 小規模ユーティリティのみ（外部ライブラリ極力不使用）。

### 4) ハッシュ照合（`features/quiz/hasher.ts`）
- WebCrypto API を使用：
  ```ts
  export async function sha256Hex(input: string): Promise<string> {
    const enc = new TextEncoder().encode(input);
    const buf = await crypto.subtle.digest('SHA-256', enc);
    return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
  }
  ```
- 採点時：`sha256Hex(normalize(userInput))` を `acceptedHash[]` と比較。
- 任意の軽難読化：`acceptedHash` を Base64 チャンク化して格納→実行時復元。

### 5) 問題ローダ（`features/quiz/loader.ts`）
- 初回ロードで `pool-1.json` を読み込み、セッション開始時に 10 問を **重複なしランダム抽出**。
- 問題の難読化目的で、セッションの後半（例：6問目以降）に到達したタイミングで `pool-2.json` を **動的 import**。

### 6) 採点（`features/quiz/scorer.ts`）
- 正答率：`correctCount / 10`。
- 速度スコア：基準 300 秒、`clamp(0, 100 * (base / elapsedSec), 100)`。
- 総合点：`0.7 * 正答率(%) + 0.3 * 速度スコア(%)`。
- グレード：総合点→ 20 段階マッピング（閾値テーブルで実装）。

### 7) 型定義（`features/quiz/types.ts`）
```ts
export type Question = {
  id: string;
  prompt: string;
  type: 'text';
  acceptedHash: string[]; // 正解候補（正規化後の SHA-256）
  tags?: string[];
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

## 画面コンポーネント設計
- **Top**：説明＋Start（`/`）
- **Quiz**：
  - `Timer` … `startedAt` からの通算を表示
  - `AnswerForm` … 入力＋Enter送信、IMEMode配慮
  - `SkipButton` … 誤クリック防止の確認ダイアログ（任意）
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
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:e2e": "playwright test",
    "lint": "eslint .",
    "format": "prettier -w ."
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

## 将来拡張
- 問題カテゴリ／難易度フィルタ
- ランキング（サーバレス採点が必要）
- 共有用 OGP 生成

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
