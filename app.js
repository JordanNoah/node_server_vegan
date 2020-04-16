const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const db = require("./models");
const PORT = process.env.PORT || 3002
const PORTCHAT = process.env.PORT || 3003
const server = require('http').createServer(app);
const io = require('socket.io').listen(server);

app.use(bodyParser.urlencoded({ extended:false }));
app.use(bodyParser.json());

const apiRoutes = require('./routes/api');

app.use('/api', apiRoutes);
app.use('/api', express.static(__dirname + '/api'));

db.sequelize.sync().then(() => {
  app.listen(PORT, () => {
    console.log(`Escuchando el puerto *:${PORT}`);
  });
  server.listen(PORTCHAT, () => {
    console.log(`Escuchando el puerto de chat *:${PORTCHAT}`);
  });
});

const nsp = io.of('/room');

const connections = {};

nsp.on('connection', (socket) => {
  var idUser = socket.handshake.query.userId;
  connections[idUser] = socket.id;
  console.log("Rooms:");
  console.log(connections);

  socket.on('send message', async (message) => {
    // console.log('Message is received :', message);

    // se busca el nombre del usuario
    var nameUser = 'user';
    try {
      var user = await db.user.findOne({ where: { idUser: idUser } });
      nameUser = user.names;

    } catch (error) {
      console.log("Error al buscar el usuario con idUser" + error);
    }

    // se guarda en base el mensaje enviado
    var saved_message;

    try {
      saved_message = await db.message.create({
        idChat: message.idChat,
        idSender: idUser,
        message: message.message,
        f_active: 1
      });
    } catch (error) {
      console.log("Error al guardar el mensaje en bd" + error);
    }


    //se buscan los usuarios que pertenecen al chat y se envia un mensaje a cada uno de ellos 
    if (saved_message != null) {
      var users_chat;
      try {
        users_chat = await db.user_chat.findAll({ include: [db.user], where: { idChat: message.idChat } });
        var dt = new Date();
        for (const user_chat of users_chat) {
          var room = connections[user_chat.idUser];

          var messageToSend = new Object();
          messageToSend.idMessage = Number(saved_message.idMessage);
          messageToSend.idChat = Number(saved_message.idChat);
          messageToSend.idSender = Number(saved_message.idSender);
          messageToSend.message = saved_message.message;
          messageToSend.createdAt = saved_message.createdAt;

          nsp.to(room).emit('new_message', messageToSend);
          console.log("Se envia mensaje a usuario: " + user_chat.user.names + " con id: " + user_chat.user.idUser);
        }

      } catch (error) {
        console.log("Error al buscar usuarios con el idChat recibido");

      }

    }

  });

  socket.on('disconnect', (reason) => {
    delete connections[idUser];
    console.log(reason);
    console.log(connections);

  });

});




