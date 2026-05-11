const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

// publicフォルダのファイルをブラウザに返す
app.use(express.static('public'));

const rooms = {}; // 部屋ごとのデータを保存する箱

io.on('connection', (socket) => {
    // 部屋に入る処理
    socket.on('join_room', (data) => {
        const { roomId, playerName } = data;
        socket.join(roomId);       // ソケットを部屋に所属させる
        socket.roomId = roomId;    // ソケット自身に部屋IDを覚えさせる

        // 部屋がなければ新しく作る
        if (!rooms[roomId]) {
            rooms[roomId] = { state: null, players: [] };
        }
        
        const room = rooms[roomId];
        // 入室した順番を「プレイヤー番号(0, 1, 2...)」とする
        const playerIndex = room.players.length;
        room.players.push({ id: socket.id, name: playerName, index: playerIndex });

        // 自分にプレイヤー番号を教える
        socket.emit('joined', { playerIndex: playerIndex, playerName: playerName });

        // 部屋の全員に最新のプレイヤー一覧を送る
        io.to(roomId).emit('update_players', room.players);

        // すでにゲームが始まっていれば、最新のマップを送る
        if (room.state) {
            socket.emit('update_state', room.state);
        }
    });

    // 状態同期（変更：「broadcast.emit」から「to(roomId).emit」に変更）
    socket.on('sync_state', (newState) => {
        const roomId = socket.roomId;
        if (roomId && rooms[roomId]) {
            rooms[roomId].state = newState;
            socket.to(roomId).emit('update_state', newState); 
        }
    });

    // 戦闘イベントの中継（変更：「broadcast.emit」から「to(roomId).emit」に変更）
    socket.on('battle_event', (battleData) => {
        if (socket.roomId) {
            socket.to(socket.roomId).emit('show_battle_modal', battleData);
            console.log(`${battleData}`);
        }
    });
});
const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log(`Server running on port ${PORT}`));
