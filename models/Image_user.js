module.exports = (db,DataTypes) => {
    const image_user = db.define('image_user',{
        idImage: { type: DataTypes.INTEGER, primaryKey:true, allowNull:false, autoIncrement:true },
        principal:{ type:DataTypes.INTEGER, allowNull:false},
        route:{ type:DataTypes.TEXT('long'), allowNull:false}
    });
    return image_user;
}