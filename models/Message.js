module.exports = (db, DataTypes) => {
    const message = db.define('message', {
        idMessage: { type: DataTypes.BIGINT(20), primaryKey: true, allowNull: false, autoIncrement: true },
        idChat: { type: DataTypes.BIGINT(20), allowNull: false },
        idSender: { type: DataTypes.BIGINT(20), allowNull: false },
        message: { type: DataTypes.TEXT },
        f_active: { type: DataTypes.BOOLEAN, allowNull: false }
    })
    return message;
};
