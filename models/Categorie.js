module.exports = (db,DataTypes) => {
    const categorie = db.define('categorie',{
        idCategorie:{ type: DataTypes.INTEGER, primaryKey:true, allowNull:false, autoIncrement:true },
        name:{ type:DataTypes.STRING(100), allowNull:false },
        routeImage:{ type:DataTypes.TEXT('LONG'),allowNull:false },
        icon:{ type:DataTypes.TEXT('LONG'),allowNull:false }
    });
    return categorie;
}