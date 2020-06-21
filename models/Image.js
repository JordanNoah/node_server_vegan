module.exports = (db,DataTypes) => {
    const image = db.define('image',{
        idImage: { type: DataTypes.INTEGER, primaryKey:true, allowNull:false, autoIncrement:true },
        type:{ type:DataTypes.STRING(100), allowNull:false },
        idOfType:{ type:DataTypes.INTEGER, allowNull:false },
        principal:{ type:DataTypes.BOOLEAN, allowNull:false },
        route:{ type:DataTypes.TEXT('long'),allowNull:false }
    });
    return image;
}