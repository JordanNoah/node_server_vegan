module.exports = (db,DataTypes) => {
    const ingredient = db.define('ingredient',{
        idIngredient: { type: DataTypes.INTEGER, primaryKey:true, allowNull:false, autoIncrement:true },
        name:{ type:DataTypes.STRING(100), allowNull:false },
        routeImage:{ type:DataTypes.TEXT('LONG'),allowNull:false }
    });
    return ingredient;
}