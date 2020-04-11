import Conexion from './connection.js';

export default class sendMessage {
    async processMessage(nsp,message) {
        var con = new Conexion();
        var sequelize = con.getConnection();
        var dt = new Date();
        var resp = null;
        await sequelize.authenticate()
            .then(() => {
                resp = true;
            })
            .catch(err => {
                resp = false;
            })
        console.log(resp);
        console.log('Message is received :', message);
        if (resp) {
            const RoomMessage = sequelize
        } else {
            nsp.emit('new_message', {
                date: dt.getHours() + ':' + dt.getMinutes() + ':' + dt.getSeconds(),
                msg: "no se pudo conectar a la base",
                id: message.id
            });
        }
    }
}