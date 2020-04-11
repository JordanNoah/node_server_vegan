module.exports = (db, DataTypes) => {
    const chat = db.define('chat', {
        idChat: { type: DataTypes.INTEGER, primaryKey: true, allowNull: false, autoIncrement: true },
        nombreChat: { type: DataTypes.STRING(200), allowNull: false }
    });
    return chat;
}