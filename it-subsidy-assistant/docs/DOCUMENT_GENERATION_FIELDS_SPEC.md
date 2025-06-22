# 補助金申請書類生成フィールド仕様書

## 概要
本仕様書は、IT導入補助金2025、ものづくり補助金、小規模事業者持続化補助金の3つの補助金について、各種申請書類を生成するために必要な入力フィールドを網羅的に定義したものです。

## 1. IT導入補助金2025

### 1.1 基本申請書類

#### 1.1.1 事業計画書
**セクション1: 企業基本情報**
| フィールドID | フィールド名 | 入力タイプ | 必須 | 文字数/制限 | 説明 |
|-------------|------------|----------|------|-----------|------|
| company_name | 申請者名（法人名/屋号） | text | ○ | 最大100文字 | 正式名称を入力 |
| company_name_kana | 申請者名（カナ） | text | ○ | 最大200文字 | 全角カナで入力 |
| corporate_number | 法人番号 | text | △ | 13桁 | 法人のみ必須 |
| incorporation_type | 法人格 | select | ○ | - | 株式会社/合同会社/有限会社/個人事業主/NPO法人/その他 |
| establishment_date | 設立年月日 | date | ○ | - | yyyy-mm-dd形式 |
| capital_amount | 資本金 | number | △ | 最大15桁 | 単位：円、法人のみ |
| representative_title | 代表者役職 | text | ○ | 最大20文字 | 代表取締役等 |
| representative_name | 代表者氏名 | text | ○ | 最大50文字 | 姓名を空白で区切る |
| representative_name_kana | 代表者氏名（カナ） | text | ○ | 最大100文字 | 全角カナ |
| postal_code | 郵便番号 | text | ○ | 7桁 | ハイフンなし |
| prefecture | 都道府県 | select | ○ | - | 47都道府県から選択 |
| city | 市区町村 | text | ○ | 最大50文字 | - |
| address | 番地・建物名 | text | ○ | 最大100文字 | - |
| phone_number | 電話番号 | text | ○ | 最大15桁 | ハイフンなし |
| fax_number | FAX番号 | text | - | 最大15桁 | ハイフンなし |
| email | メールアドレス | email | ○ | 最大100文字 | 連絡用メールアドレス |
| website_url | ホームページURL | url | - | 最大200文字 | http://またはhttps://で始まる |

**セクション2: 事業内容**
| フィールドID | フィールド名 | 入力タイプ | 必須 | 文字数/制限 | 説明 |
|-------------|------------|----------|------|-----------|------|
| main_industry | 主たる業種 | select | ○ | - | 日本標準産業分類から選択 |
| sub_industry | 従たる業種 | select | - | - | 複数事業がある場合 |
| business_description | 事業内容詳細 | textarea | ○ | 最大500文字 | 具体的な事業内容を記載 |
| main_products | 主要製品・サービス | textarea | ○ | 最大300文字 | 主力商品・サービスを列挙 |
| target_customers | 主要顧客層 | multiselect | ○ | - | BtoB/BtoC/BtoG等 |
| business_area | 事業展開地域 | multiselect | ○ | - | 地域/全国/海外等 |

**セクション3: 従業員情報**
| フィールドID | フィールド名 | 入力タイプ | 必須 | 文字数/制限 | 説明 |
|-------------|------------|----------|------|-----------|------|
| total_employees | 総従業員数 | number | ○ | 1-9999 | 役員含む |
| regular_employees | 正社員数 | number | ○ | 0-9999 | - |
| part_time_employees | パート・アルバイト数 | number | ○ | 0-9999 | - |
| avg_age | 従業員平均年齢 | number | - | 18-80 | 歳 |
| it_staff_count | IT担当者数 | number | ○ | 0-999 | 専任・兼任含む |

**セクション4: 財務情報**
| フィールドID | フィールド名 | 入力タイプ | 必須 | 文字数/制限 | 説明 |
|-------------|------------|----------|------|-----------|------|
| last_fiscal_year_end | 直近決算期 | date | ○ | - | yyyy-mm-dd |
| fiscal_year_months | 決算期間 | number | ○ | 1-12 | ヶ月 |
| last_year_revenue | 直近期売上高 | number | ○ | 0-999999999 | 千円単位 |
| year_before_revenue | 前期売上高 | number | ○ | 0-999999999 | 千円単位 |
| last_year_operating_profit | 直近期営業利益 | number | ○ | -999999999-999999999 | 千円単位 |
| last_year_ordinary_profit | 直近期経常利益 | number | ○ | -999999999-999999999 | 千円単位 |
| last_year_net_profit | 直近期当期純利益 | number | ○ | -999999999-999999999 | 千円単位 |

#### 1.1.2 IT導入計画書
**セクション1: 現状分析**
| フィールドID | フィールド名 | 入力タイプ | 必須 | 文字数/制限 | 説明 |
|-------------|------------|----------|------|-----------|------|
| current_it_systems | 現在利用中のITシステム | multiselect | ○ | - | 会計/販売管理/在庫管理/CRM等から複数選択 |
| it_investment_history | 過去3年間のIT投資額 | number | ○ | 0-99999 | 万円単位 |
| current_challenges | 現在の課題（業務面） | textarea | ○ | 最大800文字 | 具体的な業務課題を記載 |
| it_challenges | 現在の課題（IT面） | textarea | ○ | 最大800文字 | IT活用における課題 |
| manual_work_hours | 手作業による月間作業時間 | number | ○ | 0-9999 | 時間 |
| data_duplication_issues | データ重複入力の有無 | radio | ○ | - | あり/なし |
| realtime_info_availability | リアルタイム情報把握 | radio | ○ | - | 可能/不可能 |

**セクション2: 導入計画**
| フィールドID | フィールド名 | 入力タイプ | 必須 | 文字数/制限 | 説明 |
|-------------|------------|----------|------|-----------|------|
| it_tool_name | 導入予定ITツール名 | text | ○ | 最大100文字 | 正式名称 |
| it_tool_category | ITツールカテゴリー | select | ○ | - | カテゴリー1-7から選択 |
| it_vendor_name | IT導入支援事業者名 | text | ○ | 最大100文字 | 登録事業者名 |
| implementation_purpose | 導入目的 | multiselect | ○ | - | 業務効率化/コスト削減/売上拡大等 |
| target_processes | 対象業務プロセス | multiselect | ○ | - | 営業/経理/在庫管理等 |
| expected_benefits | 期待される効果 | textarea | ○ | 最大1000文字 | 定量的・定性的効果 |
| implementation_schedule | 導入スケジュール | textarea | ○ | 最大500文字 | 月別の実施計画 |
| implementation_period | 導入期間 | number | ○ | 1-12 | ヶ月 |

**セクション3: 生産性向上計画**
| フィールドID | フィールド名 | 入力タイプ | 必須 | 文字数/制限 | 説明 |
|-------------|------------|----------|------|-----------|------|
| current_productivity | 現在の労働生産性 | number | ○ | 0-999999 | 千円/人 |
| target_productivity_1year | 1年後目標労働生産性 | number | ○ | 0-999999 | 千円/人 |
| target_productivity_3year | 3年後目標労働生産性 | number | ○ | 0-999999 | 千円/人 |
| productivity_improvement_rate | 生産性向上率（3年） | number | ○ | 0-999 | ％ |
| time_reduction_hours | 削減予定作業時間 | number | ○ | 0-9999 | 月間時間数 |
| automation_tasks | 自動化対象業務 | textarea | ○ | 最大500文字 | 具体的な業務を列挙 |
| efficiency_measures | 効率化施策 | multiselect | ○ | - | 自動化/ペーパーレス/データ連携等 |

#### 1.1.3 賃金向上計画書（通常枠で賃上げ加点を受ける場合）
| フィールドID | フィールド名 | 入力タイプ | 必須 | 文字数/制限 | 説明 |
|-------------|------------|----------|------|-----------|------|
| current_avg_salary | 現在の平均給与額 | number | ○ | 0-99999 | 千円/月 |
| current_total_salary | 現在の給与支給総額 | number | ○ | 0-9999999 | 千円/年 |
| target_avg_salary_1year | 1年後平均給与額目標 | number | ○ | 0-99999 | 千円/月 |
| target_avg_salary_3year | 3年後平均給与額目標 | number | ○ | 0-99999 | 千円/月 |
| salary_increase_rate | 給与増加率 | number | ○ | 0-99 | ％ |
| salary_increase_plan | 賃上げ実施計画 | textarea | ○ | 最大500文字 | 具体的な施策 |
| performance_evaluation | 人事評価制度の有無 | radio | ○ | - | あり/なし |

#### 1.1.4 資金計画書
| フィールドID | フィールド名 | 入力タイプ | 必須 | 文字数/制限 | 説明 |
|-------------|------------|----------|------|-----------|------|
| total_investment | 総投資額 | number | ○ | 300-4500 | 千円 |
| software_cost | ソフトウェア費 | number | ○ | 0-4500 | 千円 |
| installation_cost | 導入関連費 | number | - | 0-4500 | 千円 |
| service_cost | 役務費 | number | - | 0-4500 | 千円 |
| hardware_cost | ハードウェア費 | number | - | 0-4500 | 千円 |
| subsidy_amount | 補助金申請額 | number | ○ | 150-3375 | 千円 |
| self_funding | 自己負担額 | number | ○ | 75-2250 | 千円 |
| funding_source | 資金調達方法 | select | ○ | - | 自己資金/借入/リース等 |

### 1.2 申請枠別追加書類

#### 1.2.1 電子化枠専用書類
| フィールドID | フィールド名 | 入力タイプ | 必須 | 文字数/制限 | 説明 |
|-------------|------------|----------|------|-----------|------|
| paper_documents | 紙で管理している書類 | multiselect | ○ | - | 請求書/契約書/納品書等 |
| monthly_paper_volume | 月間紙書類枚数 | number | ○ | 0-999999 | 枚 |
| paper_storage_issues | 紙保管の課題 | textarea | ○ | 最大500文字 | スペース/検索性等 |
| digitalization_scope | 電子化対象範囲 | textarea | ○ | 最大500文字 | 対象書類と部門 |
| electronic_approval | 電子承認フロー導入 | radio | ○ | - | あり/なし |
| expected_paper_reduction | 紙削減率目標 | number | ○ | 0-100 | ％ |

#### 1.2.2 セキュリティ枠専用書類
| フィールドID | フィールド名 | 入力タイプ | 必須 | 文字数/制限 | 説明 |
|-------------|------------|----------|------|-----------|------|
| security_incidents | 過去のセキュリティ事故 | radio | ○ | - | あり/なし |
| incident_details | 事故詳細 | textarea | △ | 最大500文字 | ありの場合必須 |
| current_security_measures | 現在のセキュリティ対策 | multiselect | ○ | - | ウイルス対策/FW/暗号化等 |
| security_investment | 年間セキュリティ投資額 | number | ○ | 0-9999 | 万円 |
| security_policy | セキュリティポリシー | radio | ○ | - | 策定済/未策定 |
| security_training | セキュリティ教育実施 | radio | ○ | - | 定期的/不定期/なし |
| target_security_level | 目標セキュリティレベル | textarea | ○ | 最大500文字 | 具体的な達成目標 |

## 2. ものづくり補助金

### 2.1 事業計画書

#### 2.1.1 事業概要
| フィールドID | フィールド名 | 入力タイプ | 必須 | 文字数/制限 | 説明 |
|-------------|------------|----------|------|-----------|------|
| project_title | 事業計画名 | text | ○ | 最大50文字 | 簡潔で分かりやすいタイトル |
| project_summary | 事業概要 | textarea | ○ | 100-150文字 | 事業内容を端的に説明 |
| innovation_type | 革新的取組の種類 | select | ○ | - | 新商品開発/新生産方式/新サービス等 |
| target_market | ターゲット市場 | multiselect | ○ | - | 自動車/医療/航空宇宙等 |
| competitive_advantage | 競争優位性 | multiselect | ○ | - | 品質/コスト/納期/技術等 |

#### 2.1.2 現状分析（SWOT分析）
| フィールドID | フィールド名 | 入力タイプ | 必須 | 文字数/制限 | 説明 |
|-------------|------------|----------|------|-----------|------|
| company_strengths | 自社の強み | textarea | ○ | 最大800文字 | 技術力、人材、設備等 |
| company_weaknesses | 自社の弱み | textarea | ○ | 最大800文字 | 改善が必要な点 |
| market_opportunities | 市場の機会 | textarea | ○ | 最大800文字 | 成長市場、規制緩和等 |
| market_threats | 市場の脅威 | textarea | ○ | 最大800文字 | 競合激化、原材料高騰等 |
| core_technology | コア技術・ノウハウ | textarea | ○ | 最大500文字 | 自社の技術的強み |
| certifications | 保有認証・資格 | multiselect | ○ | - | ISO9001/14001等 |

#### 2.1.3 事業実施内容
| フィールドID | フィールド名 | 入力タイプ | 必須 | 文字数/制限 | 説明 |
|-------------|------------|----------|------|-----------|------|
| technical_challenges | 技術的課題 | textarea | ○ | 最大500文字 | 解決すべき技術課題 |
| solution_approach | 解決アプローチ | textarea | ○ | 最大1000文字 | 具体的な解決方法 |
| equipment_introduction | 導入設備・システム | textarea | ○ | 最大800文字 | 設備名、スペック等 |
| process_improvement | 工程改善内容 | textarea | ○ | 最大800文字 | 現状→改善後の変化 |
| quality_improvement | 品質向上策 | textarea | ○ | 最大500文字 | 具体的な品質指標 |
| productivity_measures | 生産性向上策 | textarea | ○ | 最大500文字 | 時間短縮、コスト削減等 |

#### 2.1.4 実施スケジュール
| フィールドID | フィールド名 | 入力タイプ | 必須 | 文字数/制限 | 説明 |
|-------------|------------|----------|------|-----------|------|
| project_start_date | 事業開始予定日 | date | ○ | - | 交付決定後 |
| equipment_order_date | 設備発注予定 | date | ○ | - | - |
| equipment_delivery_date | 設備納入予定 | date | ○ | - | - |
| installation_period | 設置・調整期間 | text | ○ | 最大50文字 | ○ヶ月等 |
| trial_period | 試運転期間 | text | ○ | 最大50文字 | ○ヶ月等 |
| full_operation_date | 本格稼働予定 | date | ○ | - | - |
| project_end_date | 事業完了予定日 | date | ○ | - | 最長14ヶ月 |

#### 2.1.5 収益計画（5年間）
| フィールドID | フィールド名 | 入力タイプ | 必須 | 文字数/制限 | 説明 |
|-------------|------------|----------|------|-----------|------|
| base_year_sales | 基準年売上高 | number | ○ | 0-9999999 | 千円 |
| year1_sales | 1年後売上高 | number | ○ | 0-9999999 | 千円 |
| year2_sales | 2年後売上高 | number | ○ | 0-9999999 | 千円 |
| year3_sales | 3年後売上高 | number | ○ | 0-9999999 | 千円 |
| year5_sales | 5年後売上高 | number | ○ | 0-9999999 | 千円 |
| new_product_sales_ratio | 新製品売上比率 | number | ○ | 0-100 | ％ |
| operating_profit_ratio | 営業利益率目標 | number | ○ | 0-100 | ％ |

#### 2.1.6 付加価値向上計画
| フィールドID | フィールド名 | 入力タイプ | 必須 | 文字数/制限 | 説明 |
|-------------|------------|----------|------|-----------|------|
| current_value_added | 現在の付加価値額 | number | ○ | 0-9999999 | 千円 |
| target_value_added_3year | 3年後付加価値額 | number | ○ | 0-9999999 | 千円 |
| value_added_growth_rate | 付加価値増加率 | number | ○ | 9-999 | ％（年率3%以上） |
| employment_plan | 雇用計画 | select | ○ | - | 維持/1-2名/3-5名/6名以上 |
| wage_increase_plan | 賃金引上げ計画 | radio | ○ | - | あり/なし |
| wage_increase_rate | 賃上げ率 | number | △ | 0-99 | ％（ありの場合必須） |

### 2.2 資金計画書

| フィールドID | フィールド名 | 入力タイプ | 必須 | 文字数/制限 | 説明 |
|-------------|------------|----------|------|-----------|------|
| total_project_cost | 事業総額 | number | ○ | 1000-100000 | 千円 |
| machinery_cost | 機械装置・システム構築費 | number | ○ | 0-100000 | 千円 |
| technology_introduction_cost | 技術導入費 | number | - | 0-30000 | 千円 |
| expert_cost | 専門家経費 | number | - | 0-5000 | 千円 |
| transportation_cost | 運搬費 | number | - | 0-5000 | 千円 |
| cloud_usage_cost | クラウドサービス利用費 | number | - | 0-10000 | 千円 |
| outsourcing_cost | 外注費 | number | - | 0-50000 | 千円 |
| intellectual_property_cost | 知的財産権等関連経費 | number | - | 0-5000 | 千円 |
| subsidy_request | 補助金要望額 | number | ○ | 1000-50000 | 千円 |
| roi_period | 投資回収期間 | select | ○ | - | 2年/3年/5年/5年超 |

### 2.3 技術情報補足資料

| フィールドID | フィールド名 | 入力タイプ | 必須 | 文字数/制限 | 説明 |
|-------------|------------|----------|------|-----------|------|
| patent_info | 関連特許情報 | textarea | - | 最大500文字 | 出願・取得済特許 |
| technical_alliances | 技術提携先 | textarea | - | 最大300文字 | 大学・研究機関等 |
| rd_investment | 研究開発投資額 | number | - | 0-99999 | 年間、千円 |
| technical_staff | 技術者数 | number | ○ | 0-999 | 人 |
| qc_activities | QC活動実施状況 | radio | ○ | - | 実施中/未実施 |
| innovation_history | 過去の革新的取組 | textarea | - | 最大500文字 | 実績がある場合 |

## 3. 小規模事業者持続化補助金

### 3.1 経営計画書（様式2）

#### 3.1.1 企業概要
| フィールドID | フィールド名 | 入力タイプ | 必須 | 文字数/制限 | 説明 |
|-------------|------------|----------|------|-----------|------|
| business_overview | 事業概要 | textarea | ○ | 最大300文字 | 主な事業内容 |
| founding_year | 創業年 | number | ○ | 1800-2025 | 西暦 |
| business_history | 事業の沿革 | textarea | ○ | 最大500文字 | 創業から現在まで |
| main_products_services | 主要商品・サービス | textarea | ○ | 最大500文字 | 売上構成比含む |
| business_area_detail | 商圏・営業エリア | textarea | ○ | 最大300文字 | 具体的な地域名 |
| customer_structure | 顧客構成 | textarea | ○ | 最大300文字 | 年齢層、属性等 |

#### 3.1.2 経営状況分析
| フィールドID | フィールド名 | 入力タイプ | 必須 | 文字数/制限 | 説明 |
|-------------|------------|----------|------|-----------|------|
| sales_trend_3years | 過去3年の売上推移 | select | ○ | - | 増加/横ばい/微減/減少/大幅減少 |
| profit_trend_3years | 過去3年の利益推移 | select | ○ | - | 増加/横ばい/微減/減少/大幅減少 |
| customer_count_trend | 顧客数の推移 | select | ○ | - | 増加/横ばい/減少 |
| repeat_rate | リピート率 | number | ○ | 0-100 | ％ |
| average_purchase | 平均客単価 | number | ○ | 0-9999999 | 円 |
| monthly_customers | 月間客数 | number | ○ | 0-999999 | 人 |

#### 3.1.3 市場動向・競合分析
| フィールドID | フィールド名 | 入力タイプ | 必須 | 文字数/制限 | 説明 |
|-------------|------------|----------|------|-----------|------|
| market_trend | 市場動向 | textarea | ○ | 最大500文字 | 業界の現状と将来性 |
| target_market_size | ターゲット市場規模 | textarea | ○ | 最大300文字 | 想定顧客数、市場規模 |
| competitor_analysis | 競合分析 | textarea | ○ | 最大500文字 | 主要競合と比較 |
| competitive_position | 競争上の地位 | select | ○ | - | 優位/同等/劣位 |
| differentiation | 差別化要因 | textarea | ○ | 最大500文字 | 自社の強み・特徴 |

#### 3.1.4 経営課題
| フィールドID | フィールド名 | 入力タイプ | 必須 | 文字数/制限 | 説明 |
|-------------|------------|----------|------|-----------|------|
| management_issues | 経営上の課題 | multiselect | ○ | - | 売上減少/顧客減少/コスト増等 |
| issue_details | 課題の詳細 | textarea | ○ | 最大800文字 | 具体的な問題点 |
| past_efforts | これまでの取組 | textarea | ○ | 最大500文字 | 課題解決の試み |
| effort_results | 取組の成果 | textarea | ○ | 最大300文字 | 効果と限界 |

### 3.2 補助事業計画書（様式3）

#### 3.2.1 補助事業の内容
| フィールドID | フィールド名 | 入力タイプ | 必須 | 文字数/制限 | 説明 |
|-------------|------------|----------|------|-----------|------|
| project_name | 補助事業名 | text | ○ | 最大30文字 | 端的な事業名 |
| project_objective | 事業目的 | textarea | ○ | 最大300文字 | 何を達成したいか |
| target_customers_new | 新規ターゲット顧客 | multiselect | ○ | - | 若年層/シニア/女性/法人等 |
| sales_channel_plan | 販路開拓手法 | multiselect | ○ | - | HP/SNS/展示会/チラシ等 |
| implementation_details | 実施内容詳細 | textarea | ○ | 最大2000文字 | 具体的な取組内容 |
| uniqueness | 独自性・新規性 | textarea | ○ | 最大500文字 | 他社との差別化点 |
| feasibility | 実現可能性 | textarea | ○ | 最大500文字 | 実施体制、スケジュール |

#### 3.2.2 販路開拓の効果
| フィールドID | フィールド名 | 入力タイプ | 必須 | 文字数/制限 | 説明 |
|-------------|------------|----------|------|-----------|------|
| expected_new_customers | 新規顧客獲得目標 | number | ○ | 0-99999 | 年間、人 |
| expected_sales_increase | 売上増加見込額 | number | ○ | 0-9999999 | 年間、千円 |
| expected_sales_increase_rate | 売上増加率 | number | ○ | 0-999 | ％ |
| customer_satisfaction | 顧客満足度向上策 | textarea | ○ | 最大300文字 | 具体的施策 |
| ripple_effects | 波及効果 | textarea | ○ | 最大300文字 | 地域・業界への影響 |
| sustainability | 持続可能性 | textarea | ○ | 最大300文字 | 継続的な効果 |

#### 3.2.3 経費明細
| フィールドID | フィールド名 | 入力タイプ | 必須 | 文字数/制限 | 説明 |
|-------------|------------|----------|------|-----------|------|
| expense_items | 経費項目 | table | ○ | 最大20行 | 品名/数量/単価/金額 |
| advertising_cost | 広報費 | number | - | 0-9999999 | 円 |
| website_cost | ウェブサイト関連費 | number | - | 0-9999999 | 円 |
| exhibition_cost | 展示会等出展費 | number | - | 0-9999999 | 円 |
| travel_cost | 旅費 | number | - | 0-9999999 | 円 |
| development_cost | 開発費 | number | - | 0-9999999 | 円 |
| document_cost | 資料購入費 | number | - | 0-9999999 | 円 |
| machinery_cost | 機械装置等費 | number | - | 0-9999999 | 円 |
| commission_cost | 委託・外注費 | number | - | 0-9999999 | 円 |
| total_expense | 経費合計 | number | ○ | 0-9999999 | 円（自動計算） |
| subsidy_amount | 補助金申請額 | number | ○ | 0-3333333 | 円（2/3補助） |

### 3.3 申請枠別追加項目

#### 3.3.1 賃金引上げ枠
| フィールドID | フィールド名 | 入力タイプ | 必須 | 文字数/制限 | 説明 |
|-------------|------------|----------|------|-----------|------|
| current_minimum_wage | 現在の最低賃金 | number | ○ | 0-9999 | 円/時間 |
| planned_minimum_wage | 引上げ後最低賃金 | number | ○ | 0-9999 | 円/時間 |
| affected_employees | 対象従業員数 | number | ○ | 1-999 | 人 |
| wage_increase_date | 賃上げ実施予定日 | date | ○ | - | - |
| total_wage_increase | 給与総額増加額 | number | ○ | 0-9999999 | 年間、千円 |

#### 3.3.2 創業枠
| フィールドID | フィールド名 | 入力タイプ | 必須 | 文字数/制限 | 説明 |
|-------------|------------|----------|------|-----------|------|
| business_start_date | 開業日 | date | ○ | - | 開業届記載日 |
| startup_motivation | 創業動機 | textarea | ○ | 最大500文字 | なぜ創業したか |
| business_experience | 関連業務経験 | textarea | ○ | 最大300文字 | 経験年数、内容 |
| startup_preparation | 創業準備内容 | textarea | ○ | 最大500文字 | 市場調査、資金調達等 |
| first_year_plan | 初年度事業計画 | textarea | ○ | 最大800文字 | 具体的な計画 |

## 4. 共通仕様

### 4.1 入力バリデーション

#### 4.1.1 文字数制限
- **短文（text）**: 最大100文字
- **中文（textarea）**: 最大500文字
- **長文（textarea）**: 最大2000文字
- **数値**: 指定範囲内の整数または小数

#### 4.1.2 必須項目チェック
- 必須フィールドは赤色アスタリスク（*）表示
- 未入力時はエラーメッセージ表示
- セクション単位での入力完了状態を表示

#### 4.1.3 関連項目の整合性チェック
- 売上高と利益の妥当性
- 投資額と補助金申請額の比率
- 従業員数と給与総額の整合性
- 日付の前後関係

### 4.2 ユーザーインターフェース

#### 4.2.1 フォーム構成
1. **プログレスバー**: 全体の入力進捗を表示
2. **セクション分割**: 論理的なグループに分けて表示
3. **一時保存機能**: 30秒ごとの自動保存
4. **入力支援**: プレースホルダー、ツールチップ
5. **プレビュー機能**: 入力内容の確認画面

#### 4.2.2 レスポンシブデザイン
- PC: 2カラムレイアウト（ラベル + 入力欄）
- タブレット: 1カラムレイアウト
- スマートフォン: 縦スクロール最適化

### 4.3 データ保存形式

#### 4.3.1 データベース設計
```sql
-- 申請書基本情報
CREATE TABLE applications (
  id UUID PRIMARY KEY,
  subsidy_type VARCHAR(50) NOT NULL,
  application_frame VARCHAR(50),
  company_id UUID NOT NULL,
  status VARCHAR(20) DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- フォームデータ（JSON形式で保存）
CREATE TABLE form_data (
  id UUID PRIMARY KEY,
  application_id UUID REFERENCES applications(id),
  section_id VARCHAR(50) NOT NULL,
  form_data JSONB NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 4.3.2 エクスポート形式
- **PDF**: 申請書類プレビュー用
- **Excel**: 公式フォーマットへの自動入力
- **JSON**: データバックアップ用
- **CSV**: 一覧データのエクスポート

### 4.4 セキュリティ考慮事項

1. **個人情報保護**
   - SSL/TLS通信の必須化
   - データベース暗号化
   - アクセスログの記録

2. **入力値検証**
   - SQLインジェクション対策
   - XSS対策
   - CSRFトークンの実装

3. **権限管理**
   - ロールベースアクセス制御
   - 申請者本人のみ編集可能
   - 管理者の閲覧権限

## 5. 実装優先順位

### Phase 1（必須機能）
1. 基本的な企業情報入力フォーム
2. 各補助金の主要申請書類
3. 入力バリデーション
4. 一時保存機能

### Phase 2（重要機能）
1. 申請枠別の条件分岐
2. Excel出力機能
3. プレビュー機能
4. 進捗管理

### Phase 3（付加機能）
1. AI入力支援
2. 過去データからの自動入力
3. 複数申請の一括管理
4. 分析レポート機能

---

**改訂履歴**
- 2025-06-21: 初版作成
- 各補助金の必要書類に基づく入力フィールドを網羅的に定義
- 実装時の技術仕様を追加