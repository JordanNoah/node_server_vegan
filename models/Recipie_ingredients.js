module.exports = (db,DataTypes) => {
    const Recipe_ingredient = db.define('recipe_ingredient',{
        idRecipeIngredient : { type: DataTypes.INTEGER, primaryKey:true, allowNull:false, autoIncrement:true },
        quantity : {type:DataTypes.STRING(100),allowNull:false},
        idRecipe : {
            type: DataTypes.INTEGER,
            references:{
                model:'recipes',
                key:'idRecipe'
            }
        }
    });
    return Recipe_ingredient;
}