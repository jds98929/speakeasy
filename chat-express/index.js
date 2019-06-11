const express = require('express');
const socket = require('socket.io')(server, { origins: '*:*'});

// const cors = require('cors');

let usernames = new Map();
let connectCount = 0;
let speaker;

const app = express();
app.set('port', 3001);

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

// app.use(cors());
// app.options('*', cors());

app.get('/test', (req, res) => {
    res.json({msg: 'This is CORS-enabled for all origins!'})
});

app.use(express.static('public'));

const server = app.listen(3001, () => {
    console.log("Listening to requests on port 3001");
}) 

const io = socket(server);
io.on('connection', function(socket){
    connectCount++;
    console.log('made socket connection', socket.id);
    console.log('connection count: ' + connectCount);
    socket.on('chat', function(data){
        io.sockets.emit('chat', data);
        console.log('received listener message:', data.message);
        usernames.forEach(val => {
            console.log(val);
        })
    });

    socket.on('speaker chat', function(data){
        io.sockets.emit('speaker chat', data);
        console.log('received speaker message:', data.message);
    });

    socket.on('check speaker', function(){
        speaker ? socket.emit('speaker status', true) : socket.emit('speaker status', false);
    });

    socket.on('check count', function(){
        console.log('count', connectCount);
        socket.emit('count', connectCount);
    })

    socket.on('connect', function(){
        socket.emit('count', connectCount);
    })

    socket.on('disconnect', function(){
        connectCount--;
        speaker = null;
        usernames.delete(socket.id);
        console.log('disconnected');
    })

    socket.on('handle', function(data){
        console.log('Handle: ' + data.username);
        console.log('Role: ' + data.role);
        let alreadyInUse = false;
        for (const v of usernames.values()) {
            if (v === data.username.trim()){
                alreadyInUse = true;
            } 
        }
        usernames && !alreadyInUse && usernames.set(socket.id, data.username.trim());
        console.log(alreadyInUse + ' ' + usernames.values());
        if (alreadyInUse) {
            socket.emit('handle', {reply: 'taken'});
        } else {
            if (connectCount === 2) {                
                if (data.role === 'speak'){
                    speaker = socket.id;
                } 
                socket.emit('handle', {reply: 'success'});
            } else{
                socket.emit('handle', {reply: 'wait'});
            }
        }
    });
});