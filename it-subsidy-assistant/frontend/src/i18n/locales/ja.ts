/**
 * 日本語翻訳リソース
 */

const jaTranslations = {
  common: {
    // 基本UI要素
    'app.title': 'IT補助金申請支援システム',
    'nav.home': 'ホーム',
    'nav.subsidies': '補助金一覧',
    'nav.apply': '申請する',
    'nav.guide': 'ガイド',
    'nav.contact': 'お問い合わせ',
    
    // ボタン
    'button.next': '次へ',
    'button.back': '戻る',
    'button.submit': '送信',
    'button.save': '保存',
    'button.cancel': 'キャンセル',
    'button.download': 'ダウンロード',
    'button.print': '印刷',
    'button.edit': '編集',
    'button.delete': '削除',
    'button.close': '閉じる',
    
    // 共通メッセージ
    'message.loading': '読み込み中...',
    'message.saving': '保存中...',
    'message.success': '正常に完了しました',
    'message.error': 'エラーが発生しました',
    'message.required': '必須項目です',
    
    // 言語切り替え
    'language.switch': '言語切替',
    'language.japanese': '日本語',
    'language.english': 'English'
  },
  
  subsidies: {
    // 補助金タイプ
    'type.it': 'IT導入補助金',
    'type.jizokuka': '持続化補助金',
    'type.monozukuri': 'ものづくり補助金',
    
    // 補助金詳細
    'detail.maxAmount': '最大補助額',
    'detail.subsidyRate': '補助率',
    'detail.applicationPeriod': '申請期間',
    'detail.eligibility': '対象事業者',
    'detail.requirements': '申請要件',
    'detail.documents': '必要書類',
    
    // ステータス
    'status.accepting': '受付中',
    'status.closed': '受付終了',
    'status.preparing': '準備中',
    
    // フロー
    'flow.step1': '基礎質問',
    'flow.step2': '補助金選択',
    'flow.step3': '必要書類確認',
    'flow.step4': '申請書作成',
    'flow.step5': '確認・提出'
  },
  
  forms: {
    // フォームフィールド
    'field.companyName': '法人名',
    'field.companyNameKana': '法人名（カナ）',
    'field.corporateNumber': '法人番号',
    'field.postalCode': '郵便番号',
    'field.address': '住所',
    'field.phoneNumber': '電話番号',
    'field.email': 'メールアドレス',
    'field.representative': '代表者名',
    'field.establishmentDate': '設立年月日',
    'field.capital': '資本金',
    'field.employees': '従業員数',
    'field.industry': '業種',
    
    // バリデーション
    'validation.required': '{{field}}は必須項目です',
    'validation.email': '有効なメールアドレスを入力してください',
    'validation.phone': '有効な電話番号を入力してください',
    'validation.corporateNumber': '13桁の法人番号を入力してください',
    'validation.postalCode': '有効な郵便番号を入力してください',
    'validation.minLength': '{{field}}は{{min}}文字以上で入力してください',
    'validation.maxLength': '{{field}}は{{max}}文字以内で入力してください',
    'validation.number': '数値を入力してください',
    'validation.date': '有効な日付を入力してください',
    
    // ヘルプテキスト
    'help.corporateNumber': '国税庁から付与された13桁の番号',
    'help.capital': '万円単位で入力してください',
    'help.employees': '正社員の人数を入力してください'
  },
  
  errors: {
    // エラーメッセージ
    'error.general': '予期しないエラーが発生しました',
    'error.network': 'ネットワークエラーが発生しました',
    'error.timeout': 'タイムアウトしました',
    'error.notFound': 'ページが見つかりません',
    'error.unauthorized': '認証が必要です',
    'error.forbidden': 'アクセス権限がありません',
    'error.validation': '入力内容に誤りがあります',
    'error.fileSize': 'ファイルサイズが大きすぎます',
    'error.fileType': '対応していないファイル形式です',
    
    // エラー対処法
    'error.tryAgain': '再度お試しください',
    'error.contactSupport': 'サポートにお問い合わせください'
  },
  
  accessibility: {
    // スクリーンリーダー用
    'a11y.skipToMain': 'メインコンテンツへスキップ',
    'a11y.navigation': 'ナビゲーション',
    'a11y.breadcrumb': 'パンくずリスト',
    'a11y.progressIndicator': '進捗インジケーター',
    'a11y.currentStep': '現在のステップ: {{step}}',
    'a11y.totalSteps': '全{{total}}ステップ中',
    'a11y.required': '必須',
    'a11y.optional': '任意',
    'a11y.expandMenu': 'メニューを開く',
    'a11y.collapseMenu': 'メニューを閉じる',
    'a11y.loading': '読み込み中',
    'a11y.sortAscending': '昇順で並べ替え',
    'a11y.sortDescending': '降順で並べ替え',
    
    // エラーアナウンス
    'a11y.errorSummary': '{{count}}個のエラーがあります',
    'a11y.fieldError': '{{field}}にエラーがあります: {{error}}',
    
    // 成功アナウンス
    'a11y.saveSuccess': '保存が完了しました',
    'a11y.submitSuccess': '送信が完了しました'
  }
};

export default jaTranslations;