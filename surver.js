const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

// publicフォルダ内のHTMLを公開する
app.use(express.static('public'));

// プレイヤーの接続管理とゲーム状態の同期
let gameState = null; // ゲームの進行データ(Gオブジェクトなど)を保持

io.on('connection', (socket) => {
    console.log('プレイヤーが接続しました:', socket.id);

    // 新しく接続した人に現在の状態を送信
    if (gameState) {
        socket.emit('update_state', gameState);
    }

    // プレイヤーからのアクション（攻撃や建設など）を受信
    socket.on('player_action', (newData) => {
        gameState = newData; // 状態を更新
        io.emit('update_state', gameState); // 全員に最新状態を同期
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log(`Server running on port ${PORT}`));
