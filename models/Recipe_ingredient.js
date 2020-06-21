module.exports = (db,DataTypes) => {
    const Recipe_ingredient = db.define('recipe_ingredient',{
        idRecipeIngredient : { type: DataTypes.INTEGER, primaryKey:true, allowNull:false, autoIncrement:true },
        quantity : {type:DataTypes.STRING(100),allowNull:false},
        optional : {type:DataTypes.BOOLEAN,allowNull:false},
        moreOptions : {type:DataTypes.TEXT,allowNull:false},
        idIngredient:{
            type:DataTypes.INTEGER,
            references:{
                model:'ingredients',
                key:'idIngredient'
            }
        }
    });
    return Recipe_ingredient;
}