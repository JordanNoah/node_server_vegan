module.exports = (db, DataTypes) => {
    const user_chat = db.define('user_chat', {
        
        // idUser: { type: DataTypes.INTEGER, allowNull: false },
        // idChat: { type: DataTypes.INTEGER, allowNull: false }

        idUser:{
            type: DataTypes.INTEGER,
            references:{
                model:'users',
                key:'idUser'
            },
        },
        idChat:{
            type:DataTypes.INTEGER,
            references:{
                model:'chats',
                key:'idChat'
            },
        }
    });
    return user_chat;
};