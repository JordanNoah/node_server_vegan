module.exports = (db,DataTypes) => {
    const recipe = db.define('recipe',{
        idRecipe : { type:DataTypes.INTEGER, primaryKey:true, allowNull:false, autoIncrement:true },
        title : { type:DataTypes.STRING(100), allowNull:false },
        description : { type:DataTypes.TEXT('LONG'), allowNull:false },
        approximateTime: { type:DataTypes.STRING(100), allowNull:false },
        difficulty : { type:DataTypes.STRING(100),allowNull:false }
    });
    return recipe;
}