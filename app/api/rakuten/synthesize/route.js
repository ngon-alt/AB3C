// 楽天版: 統合分析エンドポイント（パイプライン第二段）
// POST { categories, own, competitors[] } → 三段の物語レポート（JSON）
// 仕様: docs/楽天版-仕様書-v1.md 第4〜5章
import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

export const maxDuration = 300;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function extractJson(text) {
  let clean = text.replace(/```json|```/g, "").trim();
  const start = clean.indexOf("{");
  if (start > 0) clean = clean.substring(start);
  const end = clean.lastIndexOf("}");
  if (end > 0) clean = clean.substring(0, end + 1);
  return JSON.parse(clean);
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "リクエストの形式が不正です" }, { status: 400 });
  }

  const { categories, own, competitors } = body || {};
  if (!own?.summary || !Array.isArray(competitors)) {
    return NextResponse.json({ error: "分析データが不足しています" }, { status: 400 });
  }

  const catLine = [categories?.large, categories?.mid, categories?.small].filter(Boolean).join(" > ");

  const compBlock = competitors
    .map(
      (c, i) =>
        `## 競合${i + 1}: ${c.label}（レビュー${c.reviewTotal ?? "?"}件 / 平均★${c.ratingAverage ?? "?"}）\n${JSON.stringify(c.summary, null, 1)}`
    )
    .join("\n\n");

  const prompt = `あなたは権成俊が開発したAB3Cフレームワークに基づくEC戦略コンサルタントです。楽天市場で商品を販売する店長に向けて、以下の分析データから「三段の物語」レポートを作成してください。

# 前提（重要）
- 楽天の商品ページは構造的に「競合と比較されながら読まれるページ」です。モール出店は、他店の同種商品とおのずと比較され、相対的なウォンツが形成される装置だからです。
- 分析は「ニーズ型の説得設計」で統一します。ただし型番・ブランド指名買いが支配的と推定される商品の場合のみ、wantsNote に「この商品はウォンツ型（指名買い）のため、商品本体は価格・納期で判断されます。差別化はサービスで作り、その価値をコンテンツで伝えて選んでもらいましょう」という趣旨の一言を入れてください（該当しなければ null）。
- 仕入れ品の売り手でも、サービス（購入前・購入中・購入後）や外側のパッケージ（同梱おまけ・配送箱の工夫など）は自分たちの提供物であり、差別化できます。

# カテゴリー
${catLine || "（未指定）"}

# 自社商品: ${own.label}（レビュー${own.reviewTotal ?? "?"}件 / 平均★${own.ratingAverage ?? "?"}）
## レビュー・LP分析結果
${JSON.stringify(own.summary, null, 1)}

# 競合商品の分析結果
${compBlock || "（競合データなし）"}

# 出力（JSONのみ・すべて店長に直接見せる日本語で書く）
{
  "wantsNote": "ウォンツ型の場合の一言（通常は null）",
  "story1": {
    "lead": "第一段の導入文（売れている店に共通して見える構図を2〜3文で）",
    "commonReasons": ["競合に共通する選ばれる理由＝このカテゴリーの土俵（最大4つ）"],
    "perCompetitor": [
      { "label": "競合名", "reasons": ["この店に固有の選ばれる理由＝この店の山（最大3つ）"] }
    ]
  },
  "story2": {
    "lead": "第二段の導入文（自社が選ばれない構図の要約を2〜3文で）",
    "zure": {
      "lpClaims": ["自社LPが訴求していること（最大5つ）"],
      "customerPraise": ["顧客がレビューで実際に評価していること（最大5つ）"],
      "gaps": ["訴求と評価のズレの指摘（『〜と訴えているが、お客様は〜を評価している』の形で。最大3つ。本物の強みかどうか競合との相対でも確認する）"]
    },
    "sixAxes": [
      { "axis": "機能", "own": "自社の状況（強み弱みを率直に・40字以内）", "competitorBest": "競合で最も強い状況（40字以内）", "verdict": "勝っている | 並んでいる | 負けている | 比較材料なし" }
      // デザイン・パッケージング・購入前サービス・購入中サービス・購入後サービス・価格・納期/配送 も同様に
    ],
    "sevenElements": [ /* 自社LPの7要素診断を own.summary.lpSevenElements からそのまま引き継ぎ、競合比較を踏まえて comment を磨く */ ]
  },
  "story3": {
    "lead": "第三段の導入文（処方の全体像を2〜3文で）",
    "stage1": {
      "title": "今すぐやるべきこと（伝え方の改善）",
      "topPriorities": [
        { "rank": 1, "axis": "お客様が比較している価値軸（例: 味）", "why": "なぜこれを重視すべきか（レビューの根拠つきで60字程度）" }
        // 上位3つまで
      ],
      "appealReset": ["訴求ポイントの再設定案（LPの語り方をどう変えるか。具体的に最大4つ）"],
      "contentPriorities": ["コンテンツ増強の優先順位（最大3つ）"],
      "strategyMessage": { "message": "ベネフィットとアドバンテージを統合した戦略メッセージ", "benefit_part": "ベネフィット部分", "advantage_part": "アドバンテージ部分" }
    },
    "stage2": {
      "title": "さらに本質的には（価値そのものを高める）",
      "valueDevelopment": [
        { "axis": "価値サークルの軸名", "proposal": "提供価値の開発提案（例: 購入前サービスで〜があるとよい。80字程度）" }
        // 最大3つ
      ],
      "scenarios": [
        { "name": "シナリオ名（例: 味の専門性で戦う）", "target": "この軸を重視する顧客像", "actions": ["必要なコンテンツ・強化策（最大3つ）"] }
        // 主要2案
      ],
      "newAxis": { "name": "誰も載せていない新しい軸の提案（なければ null）", "rationale": "なぜ空白なのか・どう立てるか" }
    }
  }
}

# 厳守事項
- ユーザーに見せる文章なので、英語の状態ラベル（ok/warn/ng等）・馴染みの薄い英略語（KPI・CVR等）は使わない。広く使われているカタカナ語（ベネフィット・アドバンテージ・コンテンツ・ターゲット等）は使ってよい
- 強みも弱みも率直に。ただしコーチング型の語り口で（断定的に突き放さない）
- レビューの実際の言葉・特徴語を引用して生々しさを保つ（引用は「」で）
- 文字列の値の中でASCIIのダブルクオートを使わない（引用は「」を使う）
- JSONのみ返す`;

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 8000,
      temperature: 0.5,
      messages: [{ role: "user", content: prompt }],
    });
    const text = message.content.filter((b) => b.type === "text").map((b) => b.text).join("");
    const result = extractJson(text);
    return NextResponse.json({ report: result });
  } catch (e) {
    console.error(`[rakuten/synthesize] error=${e?.message}`);
    return NextResponse.json({ error: "統合分析に失敗しました。もう一度お試しください。" }, { status: 500 });
  }
}
