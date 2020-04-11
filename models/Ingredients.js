module.exports = (db,DataTypes) => {
    const ingredient = db.define('ingredient',{
        idIngredient: { type: DataTypes.INTEGER, primaryKey:true, allowNull:false, autoIncrement:true },
        name:{ type:DataTypes.STRING(100), allowNull:false },
        idImage:{
            type: DataTypes.INTEGER,
            references:{
                model:'images',
                key:'idImage'
            }
        }
    });
    return ingredient;
}