const express = require('express');
const socket = require('socket.io')

let usernames = new Map();
let roles = new Map();
let speaker;

const app = express();
app.set('port', 3001);

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.get('/test', (req, res) => {
    res.json({msg: 'This is CORS-enabled for all origins!'})
});

app.use(express.static('public'));

const server = app.listen(3001, () => {
    console.log("Listening to requests on port 3001");
}) 

const io = socket(server);
io.on('connection', function(socket){
    console.log('made socket connection', socket.id);
    socket.on('chat', function(data){
        let handle = usernames.get(socket.id);
        let role = roles.get(socket.id);
        io.sockets.emit('chat', {handle: handle, message: data.message, role: role, timestamp: data.timestamp});
        console.log('received listener message:', data.message);
    });

    socket.on('check speaker', function(){
        speaker ? socket.emit('speaker status', true) : socket.emit('speaker status', false);
    });

    socket.on('check count', function(){
        socket.emit('count', usernames.size);
    })

    socket.on('connect', function(){
        socket.emit('count', connectCount);
    })

    socket.on('disconnect', function(){
        if (roles.get(socket.id) === 'speak') {
            speaker = null;
        }
        usernames.delete(socket.id);
        console.log('disconnected');
    });

    socket.on('verify user', function(){
        usernames.get(socket.id) ? socket.emit('user verification', true) : socket.emit('user verification', false);
    });

    socket.on('handle', function(data){
        console.log('Handle: ' + data.username);
        console.log('Role: ' + data.role);
        let alreadyInUse = false;
        if (!speaker && data.role === 'speak'){
            speaker = socket.id;
        } 
        for (const v of usernames.values()) {
            if (v === data.username.trim()){
                alreadyInUse = true;
            } 
        }
        usernames && !alreadyInUse 
            && usernames.set(socket.id, data.username.trim()) && roles.set(socket.id, data.role);
        if (alreadyInUse) {
            socket.emit('handle', {reply: 'taken'});
        } else {
            if (usernames.size >= 2) {                
                socket.emit('handle', {reply: 'success'});
            } else{
                socket.emit('handle', {reply: 'wait'});
            }
        }
    });
});