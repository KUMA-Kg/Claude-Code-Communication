const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

// 静的ファイルの提供
app.use(express.static(path.join(__dirname, 'dist')));

// SPAのためのフォールバック
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});