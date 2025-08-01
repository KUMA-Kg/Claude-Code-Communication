# 補助金別アンケートフローと必要書類判定ロジック

このドキュメントは、IT補助金アシストツールにおける3つの補助金（IT導入補助金2025、ものづくり補助金、小規模事業者持続化補助金）のアンケートフローと、回答に基づく必要書類の判定ロジックを詳細に記載したものです。

## 目次
1. [IT導入補助金2025](#it導入補助金2025)
2. [ものづくり補助金](#ものづくり補助金)
3. [小規模事業者持続化補助金](#小規模事業者持続化補助金)

---

## IT導入補助金2025

### アンケートフロー

#### 質問1: 創業からの年数を教えてください
- **タイプ**: ラジオボタン
- **選択肢**:
  - `under_1year`: 1年未満
  - `1_2years`: 1年以上2年未満
  - `2_3years`: 2年以上3年未満
  - `over_3years`: 3年以上

#### 質問2: 導入予定のITツールの種類を選択してください
- **タイプ**: セレクトボックス
- **選択肢**:
  - `software`: ソフトウェア（クラウドサービス含む）
  - `hardware`: ハードウェア
  - `both`: ソフトウェア＋ハードウェア
  - `consulting`: ITコンサルティング

#### 質問3: IT導入支援事業者は決定していますか？
- **タイプ**: ラジオボタン
- **選択肢**:
  - `yes`: はい（決定済み）
  - `considering`: 検討中
  - `no`: いいえ（未定）

#### 質問4: 労働生産性向上の具体的な計画はありますか？
- **タイプ**: ラジオボタン
- **選択肢**:
  - `detailed`: 詳細な計画あり
  - `rough`: 概要レベルの計画あり
  - `none`: これから策定

### 基本必要書類（全申請者共通）

#### A. 申請基本書類
- A1: 交付申請書（必須）
- A2: 事業計画書（必須）
- A3: 宣誓書（必須）
- A4: 法人/個人確認書類（必須）

#### B. 財務関係書類
- B1: 直近2期分の決算書（必須）
- B2: 納税証明書（必須）

#### C. ITツール関連
- C1: IT導入支援事業者との共同事業体契約書（必須）
- C2: ITツール見積書（必須）
- C3: ITツール機能要件適合証明書（必須）
- C4: 導入計画書（必須）

### 条件付き追加書類

#### 創業年数による追加書類
- **条件**: `business_duration` が `under_1year` または `1_2years`
- **追加書類**: F1: 創業2年未満の場合の追加書類（必須）

#### 労働保険関連
- **条件**: `business_duration` が `over_3years`
- **追加書類**: B3: 労働保険料納付証明書（任意）

#### 加点要素（全申請者対象・任意）
- D1: 事業継続力強化計画認定書（任意）
- D3: 賃上げ計画表明書（任意）

---

## ものづくり補助金

### アンケートフロー

#### 質問1: 申請予定の枠を選択してください
- **タイプ**: セレクトボックス
- **選択肢**:
  - `normal`: 通常枠
  - `digital`: デジタル枠
  - `green`: グリーン枠
  - `joint`: 共同申請枠

#### 質問2: 創業からの年数を教えてください
- **タイプ**: ラジオボタン
- **選択肢**:
  - `under_3years`: 3年未満
  - `3_5years`: 3年以上5年未満
  - `5_10years`: 5年以上10年未満
  - `over_10years`: 10年以上

#### 質問3: 実施予定の革新的取組を選択してください
- **タイプ**: セレクトボックス
- **選択肢**:
  - `new_product`: 新商品（試作品）開発
  - `new_service`: 新サービス開発
  - `new_process`: 生産プロセス改善
  - `new_delivery`: 新たな提供方式の導入

#### 質問4: 認定経営革新等支援機関との連携状況は？
- **タイプ**: ラジオボタン
- **選択肢**:
  - `contracted`: 既に契約済み
  - `negotiating`: 交渉中
  - `searching`: 探している
  - `unknown`: 支援機関について知らない

#### 質問5: 賃金引上げ計画はありますか？
- **タイプ**: ラジオボタン
- **選択肢**:
  - `yes_documented`: あり（文書化済み）
  - `yes_planning`: あり（計画中）
  - `considering`: 検討中
  - `no`: なし

#### 質問6: 事業資金の調達方法は？
- **タイプ**: セレクトボックス
- **選択肢**:
  - `self_funded`: 自己資金のみ
  - `bank_loan`: 金融機関からの借入予定
  - `combined`: 自己資金＋借入
  - `other`: その他

### 基本必要書類（全申請者共通）

#### A. 事業計画関連
- A1: 事業計画書（システム入力＋別紙Word）（必須）

#### B. 誓約・加点様式
- B1: 補助対象経費誓約書【様式1】（必須）
- B2: 賃金引上げ計画の誓約書【様式2】（必須）

#### C. 現況確認資料
- C1: 履歴事項全部証明書（法人）（必須）
- C2: 直近期の決算書一式（必須）
- C3: 従業員数確認資料（必須）
- C4: 労働者名簿（必須）

#### D. 見積・仕様関係
- D1: 見積書（原則2社以上）（必須）
- D2: カタログ・仕様書（必須）

#### E. 税・反社・資金調達
- E1: 納税証明書（法人税／消費税）（必須）
- E2: 暴力団排除等に関する誓約書（必須）

### 条件付き追加書類

#### 申請枠による追加書類
- **デジタル枠**（`application_type` = `digital`）
  - F3: DX推進自己診断結果（必須）
- **グリーン枠**（`application_type` = `green`）
  - B4: 炭素生産性向上計画書（必須）
- **共同申請枠**（`application_type` = `joint`）
  - G1: 共同事業契約書＋共同事業者全員分の登記・決算書（必須）

#### 資金調達方法による追加書類
- **条件**: `funding_method` が `bank_loan` または `combined`
- **追加書類**: E3: 資金調達確認書【様式5】（必須）

#### 支援機関連携による追加書類
- **条件**: `support_organization` が `contracted`
- **追加書類**: F1: 認定経営革新等支援機関確認書（任意）

#### 賃金引上げ計画による追加書類
- **条件**: `wage_increase_plan` が `yes_documented`
- **追加書類**: B3: 大幅賃上げ計画書【様式4】（任意）

#### その他任意書類
- A2: 会社全体の事業計画書（任意様式）（任意）
- D3: 図面・レイアウト図（任意）

---

## 小規模事業者持続化補助金

### アンケートフロー

#### 質問1: 事業形態を選択してください
- **タイプ**: ラジオボタン
- **選択肢**:
  - `corporation`: 法人
  - `individual`: 個人事業主

#### 質問2: 従業員数を選択してください（小規模事業者の定義確認）
- **タイプ**: ラジオボタン
- **選択肢**:
  - `0`: 0人（事業主のみ）
  - `1_5`: 1〜5人
  - `6_20`: 6〜20人
  - `over_20`: 21人以上

#### 質問3: 創業からの年数を教えてください
- **タイプ**: ラジオボタン
- **選択肢**:
  - `under_1year`: 1年未満（創業枠対象）
  - `1_3years`: 1年以上3年未満
  - `3_10years`: 3年以上10年未満
  - `over_10years`: 10年以上

#### 質問4: 商工会・商工会議所の会員ですか？
- **タイプ**: ラジオボタン
- **選択肢**:
  - `member`: 会員である
  - `applying`: 入会申請中
  - `non_member`: 非会員

#### 質問5: 申請予定の枠を選択してください
- **タイプ**: セレクトボックス
- **選択肢**:
  - `general`: 一般型
  - `startup`: 創業枠
  - `succession`: 事業承継枠
  - `disaster`: 災害枠

#### 質問6: 事業支援計画書（様式6）の作成状況は？
- **タイプ**: ラジオボタン
- **選択肢**:
  - `completed`: 商工会・商工会議所で作成済み
  - `in_progress`: 商工会・商工会議所で作成中
  - `scheduled`: 商工会・商工会議所に相談予約済み
  - `not_started`: 未着手

#### 質問7: 販路開拓の主な取組内容は？
- **タイプ**: セレクトボックス
- **選択肢**:
  - `website`: ウェブサイト制作・改修
  - `advertising`: 広告・宣伝（チラシ・看板等）
  - `exhibition`: 展示会・商談会出展
  - `new_product`: 新商品・新サービス開発
  - `equipment`: 機械装置等の導入
  - `renovation`: 店舗改装・レイアウト変更
  - `multiple`: 複数の方法を組み合わせ

#### 質問8: 総事業費（補助対象経費）の予定額は？
- **タイプ**: セレクトボックス
- **選択肢**:
  - `under_50`: 50万円未満
  - `50_100`: 50万円以上100万円未満
  - `100_150`: 100万円以上150万円未満
  - `over_150`: 150万円以上

### 基本必要書類（全申請者共通）

#### A. 申請様式（必須）
- A1: 様式1 小規模事業者持続化補助金事業に係る申請書（必須）
- A2: 様式2 経営計画書（必須）
- A3: 様式3 補助事業計画書（必須）
- A4: 様式4 補助金交付申請書（必須）

#### B. 現況確認資料
- B1: 直近の確定申告書（写し）（必須）
- B2: 履歴事項全部証明書（法人のみ）（条件付き）
- B3: 開業届（個人事業主で創業1年未満）（条件付き）

#### C. 見積・価格関係（条件付き）
- C1: 見積書（税抜50万円以上の経費）（条件付き）
- C2: カタログ・仕様書（条件付き）
- C3: 図面・レイアウト図（条件付き）

#### D. 商工会議所・商工会関係
- D1: 事業支援計画書（様式6）（必須）
- D2: 商工会議所・商工会の会員証明（条件付き）

#### E. 加点要素書類（任意）
- E1: 事業継続力強化計画認定書（任意）
- E4: 賃金引上げ表明書（様式7）（任意）

#### F. 申請枠別の追加書類
- F1: 創業計画書（創業枠申請者）（条件付き）
- F2: 事業承継診断書（事業承継枠）（条件付き）
- F3: 災害証明書（災害枠）（条件付き）

### 条件付き追加書類

#### 従業員数による追加書類
- **条件**: `employee_count` が `over_20`
- **追加書類**: 小規模事業者要件確認書（必須）

#### 事業形態による書類要否変更
- **条件**: `business_type` が `corporation`
- **変更**: B2: 履歴事項全部証明書（法人）を必須に変更

#### 創業年数と事業形態による追加書類
- **条件**: `business_duration` が `under_1year` かつ `business_type` が `individual`
- **変更**: B3: 開業届を必須に変更
- **追加条件**: `application_frame` が `startup` の場合
  - **追加書類**: F1: 創業計画書（必須）

#### 申請枠による追加書類
- **事業承継枠**（`application_frame` = `succession`）
  - F2: 事業承継診断書（必須）
- **災害枠**（`application_frame` = `disaster`）
  - F3: 災害証明書（必須）

#### 会員状況による追加書類
- **条件**: `chamber_membership` が `member`
- **追加書類**: D2: 商工会議所・商工会の会員証明（任意）

#### 経費額による書類要否変更
- **条件**: `expense_amount` が `50_100`、`100_150`、または `over_150`
- **変更**: C1: 見積書を必須に変更

#### 取組内容による書類要否変更
- **機械装置導入**（`sales_channel_type` = `equipment`）
  - **変更**: C2: カタログ・仕様書を必須に変更
- **店舗改装**（`sales_channel_type` = `renovation`）
  - **変更**: C3: 図面・レイアウト図を必須に変更

---

## 実装における注意点

1. **書類の重複排除**: 同じ書類IDが複数回追加されないようにチェックが必要
2. **必須/任意の動的変更**: 基本書類でも条件によって必須/任意が変わる場合がある
3. **カテゴリー分類**: 書類は以下のカテゴリーに分類される
   - `application`: 申請書類
   - `project`: 事業計画関連
   - `financial`: 財務・税務関連
   - `company`: 会社・組織関連
   - `quotation`: 見積・仕様関連
   - `support`: 支援機関関連
   - `other`: その他

## 検証ポイント

1. **質問の流れ**: 各補助金で必要な情報を過不足なく収集できているか
2. **分岐ロジック**: 回答に基づく書類判定が正確に行われているか
3. **書類の網羅性**: 各補助金で必要とされる書類が漏れなく含まれているか
4. **ユーザビリティ**: 質問が分かりやすく、回答しやすいか