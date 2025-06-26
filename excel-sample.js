const ExcelJS = require('exceljs');

async function writeToExcel() {
  // 新しいワークブックを作成
  const workbook = new ExcelJS.Workbook();
  
  // ワークシートを追加
  const worksheet = workbook.addWorksheet('サンプルシート');
  
  // 列の定義（幅やスタイル）
  worksheet.columns = [
    { header: '名前', key: 'name', width: 15 },
    { header: '年齢', key: 'age', width: 10 },
    { header: '部署', key: 'department', width: 20 }
  ];
  
  // データを追加（単一行）
  worksheet.addRow({ name: '田中太郎', age: 30, department: '営業部' });
  
  // 複数行のデータを追加
  const rows = [
    { name: '佐藤花子', age: 25, department: '開発部' },
    { name: '鈴木一郎', age: 35, department: '人事部' },
    { name: '高橋美咲', age: 28, department: 'マーケティング部' }
  ];
  worksheet.addRows(rows);
  
  // セルに直接値を設定
  worksheet.getCell('A6').value = '山田次郎';
  worksheet.getCell('B6').value = 40;
  worksheet.getCell('C6').value = '経理部';
  
  // セルのスタイルを設定
  worksheet.getCell('A1').font = { bold: true, size: 14 };
  worksheet.getCell('B1').font = { bold: true, size: 14 };
  worksheet.getCell('C1').font = { bold: true, size: 14 };
  
  // 背景色を設定
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFD3D3D3' }
  };
  
  // 枠線を設定
  for (let i = 1; i <= 6; i++) {
    for (let j = 1; j <= 3; j++) {
      const cell = worksheet.getCell(i, j);
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    }
  }
  
  // ファイルを保存
  await workbook.xlsx.writeFile('sample.xlsx');
  console.log('Excelファイルが作成されました: sample.xlsx');
}

// 関数を実行
writeToExcel().catch(console.error);