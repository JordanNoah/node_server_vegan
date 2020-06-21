module.exports = (db, DataTypes) => {
    const like = db.define('like', {
        idLike: { type: DataTypes.INTEGER, primaryKey: true, allowNull: false, autoIncrement: true },
        idUser: { type: DataTypes.INTEGER, allowNull: false },
        idUserLiked: { type: DataTypes.INTEGER, allowNull: false },
        f_liked: { type: DataTypes.BOOLEAN, allowNull: false }
    });
    return like;
}