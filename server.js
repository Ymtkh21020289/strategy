const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

// publicフォルダのファイルをブラウザに返す
app.use(express.static('public'));

let gameState = null; // ゲームの全体状態を保存

io.on('connection', (socket) => {
    console.log('プレイヤーが接続しました:', socket.id);

    // あとから接続してきた人（2人目以降）に現在のマップ状態を送る
    if (gameState) {
        socket.emit('update_state', gameState);
    }

    // 誰かが操作した最新のゲーム状態を受け取る
    socket.on('sync_state', (newState) => {
        gameState = newState;
        // 「操作した本人以外」の全員の画面に変更を反映（ブロードキャスト）
        socket.broadcast.emit('update_state', gameState);
    });
    
    // ▼追加：誰かが攻撃したときのダイス情報を他の全員に中継する
    socket.on('battle_event', (battleData) => {
        socket.broadcast.emit('show_battle_modal', battleData);
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log(`Server running on port ${PORT}`));
