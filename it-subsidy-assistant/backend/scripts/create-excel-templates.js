const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs').promises;

async function createTemplates() {
  const templatesPath = path.join(__dirname, '..', 'data', 'excel-templates');
  
  // ディレクトリが存在することを確認
  try {
    await fs.mkdir(templatesPath, { recursive: true });
  } catch (error) {
    console.log('Templates directory already exists');
  }

  // IT導入補助金テンプレート作成
  console.log('Creating IT導入補助金 templates...');
  
  // 1. 賃金報告書
  const chinginWorkbook = new ExcelJS.Workbook();
  const chinginSheet = chinginWorkbook.addWorksheet('賃金報告書');
  
  chinginSheet.getCell('A4').value = '申請者名（法人名/屋号）';
  chinginSheet.getCell('C4').value = '';
  chinginSheet.getCell('A5').value = '法人番号';
  chinginSheet.getCell('C5').value = '';
  chinginSheet.getCell('A6').value = '代表者役職';
  chinginSheet.getCell('C6').value = '';
  chinginSheet.getCell('A7').value = '代表者氏名';
  chinginSheet.getCell('C7').value = '';
  chinginSheet.getCell('A10').value = '従業員数';
  chinginSheet.getCell('C10').value = 0;
  chinginSheet.getCell('A11').value = '現在の平均給与額';
  chinginSheet.getCell('C11').value = 0;
  chinginSheet.getCell('A12').value = '計画平均給与額';
  chinginSheet.getCell('C12').value = 0;
  chinginSheet.getCell('A13').value = '給与引上げ率';
  chinginSheet.getCell('C13').formula = '=IF(C11>0,(C12-C11)/C11,0)';
  chinginSheet.getCell('C13').numFmt = '0.00%';
  
  await chinginWorkbook.xlsx.writeFile(path.join(templatesPath, 'it2025_chingin_houkoku.xlsx'));
  
  // 2. 実施内容説明書
  const jisshiWorkbook = new ExcelJS.Workbook();
  const jisshiSheet = jisshiWorkbook.addWorksheet('実施内容説明書');
  
  jisshiSheet.getCell('A3').value = 'ITツール名';
  jisshiSheet.getCell('B3').value = '';
  jisshiSheet.getCell('A4').value = 'ITツール提供事業者名';
  jisshiSheet.getCell('B4').value = '';
  jisshiSheet.getCell('A7').value = '導入前の課題・問題点';
  jisshiSheet.getCell('B7').value = '';
  jisshiSheet.getCell('A10').value = '導入により期待される効果';
  jisshiSheet.getCell('B10').value = '';
  jisshiSheet.getCell('A13').value = 'ITツールの使用方法';
  jisshiSheet.getCell('B13').value = '';
  jisshiSheet.getCell('A16').value = '労働生産性向上目標';
  jisshiSheet.getCell('B16').value = '';
  jisshiSheet.getCell('A19').value = '導入スケジュール';
  jisshiSheet.getCell('B19').value = '';
  
  await jisshiWorkbook.xlsx.writeFile(path.join(templatesPath, 'it2025_jisshinaiyosetsumei_cate5.xlsx'));
  
  // 3. 価格説明書
  const kakakuWorkbook = new ExcelJS.Workbook();
  const kakakuSheet = kakakuWorkbook.addWorksheet('価格説明書');
  
  kakakuSheet.getCell('A5').value = 'ソフトウェア導入費';
  kakakuSheet.getCell('C5').value = 0;
  kakakuSheet.getCell('C5').numFmt = '¥#,##0';
  kakakuSheet.getCell('A6').value = '導入・設定費';
  kakakuSheet.getCell('C6').value = 0;
  kakakuSheet.getCell('C6').numFmt = '¥#,##0';
  kakakuSheet.getCell('A7').value = '役務費';
  kakakuSheet.getCell('C7').value = 0;
  kakakuSheet.getCell('C7').numFmt = '¥#,##0';
  kakakuSheet.getCell('A8').value = '保守費用';
  kakakuSheet.getCell('C8').value = 0;
  kakakuSheet.getCell('C8').numFmt = '¥#,##0';
  kakakuSheet.getCell('A10').value = '合計額';
  kakakuSheet.getCell('C10').formula = '=SUM(C5:C8)';
  kakakuSheet.getCell('C10').numFmt = '¥#,##0';
  kakakuSheet.getCell('A12').value = '補助対象経費';
  kakakuSheet.getCell('C12').formula = '=C10';
  kakakuSheet.getCell('C12').numFmt = '¥#,##0';
  kakakuSheet.getCell('A13').value = '補助金申請額';
  kakakuSheet.getCell('C13').formula = '=C12*0.75';
  kakakuSheet.getCell('C13').numFmt = '¥#,##0';
  
  await kakakuWorkbook.xlsx.writeFile(path.join(templatesPath, 'it2025_kakakusetsumei_cate5.xlsx'));
  
  // ものづくり補助金テンプレート
  console.log('Creating ものづくり補助金 templates...');
  
  const cagrWorkbook = new ExcelJS.Workbook();
  const cagrSheet = cagrWorkbook.addWorksheet('CAGR算出');
  
  cagrSheet.getCell('A5').value = '基準年度売上高';
  cagrSheet.getCell('C5').value = 0;
  cagrSheet.getCell('C5').numFmt = '¥#,##0';
  cagrSheet.getCell('A6').value = '1年後売上高目標';
  cagrSheet.getCell('C6').value = 0;
  cagrSheet.getCell('C6').numFmt = '¥#,##0';
  cagrSheet.getCell('A7').value = '2年後売上高目標';
  cagrSheet.getCell('C7').value = 0;
  cagrSheet.getCell('C7').numFmt = '¥#,##0';
  cagrSheet.getCell('A8').value = '3年後売上高目標';
  cagrSheet.getCell('C8').value = 0;
  cagrSheet.getCell('C8').numFmt = '¥#,##0';
  cagrSheet.getCell('A9').value = '5年後売上高目標';
  cagrSheet.getCell('C9').value = 0;
  cagrSheet.getCell('C9').numFmt = '¥#,##0';
  cagrSheet.getCell('A10').value = '3年間CAGR';
  cagrSheet.getCell('E10').formula = '=IF(C5>0,((C8/C5)^(1/3))-1,0)';
  cagrSheet.getCell('E10').numFmt = '0.00%';
  cagrSheet.getCell('A11').value = '5年間CAGR';
  cagrSheet.getCell('E11').formula = '=IF(C5>0,((C9/C5)^(1/5))-1,0)';
  cagrSheet.getCell('E11').numFmt = '0.00%';
  
  await cagrWorkbook.xlsx.writeFile(path.join(templatesPath, 'CAGR算出ツール_20250314.xlsx'));
  
  // 持続化補助金テンプレート
  console.log('Creating 持続化補助金 templates...');
  
  const jizokukaWorkbook = new ExcelJS.Workbook();
  const jizokukaSheet = jizokukaWorkbook.addWorksheet('様式3');
  
  jizokukaSheet.getCell('A3').value = '補助事業名';
  jizokukaSheet.getCell('B3').value = '';
  jizokukaSheet.getCell('A5').value = '販路開拓等の取組内容';
  jizokukaSheet.getCell('B5').value = '';
  jizokukaSheet.getCell('A22').value = '補助事業の効果';
  jizokukaSheet.getCell('B22').value = '';
  
  // 経費明細表のヘッダー
  jizokukaSheet.getCell('C24').value = '経費区分';
  jizokukaSheet.getCell('D24').value = '内容・経費内訳';
  jizokukaSheet.getCell('E24').value = '数量';
  jizokukaSheet.getCell('F24').value = '単価（円）';
  jizokukaSheet.getCell('G24').value = '金額（円）';
  
  // 経費明細行（16行分）
  for (let i = 0; i < 16; i++) {
    const row = 25 + i;
    jizokukaSheet.getCell(`G${row}`).formula = `=E${row}*F${row}`;
    jizokukaSheet.getCell(`G${row}`).numFmt = '¥#,##0';
  }
  
  jizokukaSheet.getCell('F42').value = '補助対象経費合計';
  jizokukaSheet.getCell('G42').formula = '=SUM(G25:G40)';
  jizokukaSheet.getCell('G42').numFmt = '¥#,##0';
  jizokukaSheet.getCell('F43').value = '補助金交付申請額';
  jizokukaSheet.getCell('G43').formula = '=ROUND(G42*2/3,0)';
  jizokukaSheet.getCell('G43').numFmt = '¥#,##0';
  
  await jizokukaWorkbook.xlsx.writeFile(path.join(templatesPath, 'r3i_y3e.xlsx'));
  
  console.log('All templates created successfully!');
  
  // テンプレート一覧を表示
  const files = await fs.readdir(templatesPath);
  console.log('\nCreated templates:');
  files.forEach(file => {
    console.log(`- ${file}`);
  });
}

createTemplates().catch(console.error);