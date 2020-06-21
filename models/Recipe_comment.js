module.exports = (db,DataTypes) => {
    const recipe_comment = db.define('recipe_comment',{
        idRecipeComment : { type: DataTypes.INTEGER, primaryKey:true, allowNull:false, autoIncrement:true },
        assessment : { type: DataTypes.DOUBLE,allowNull:false },
        commentary : { type: DataTypes.STRING(500),allowNull:true },

        idUser:{
            type: DataTypes.INTEGER,
            references:{
                model:'users',
                key:'idUser'
            },
        },
        idRecipe:{
            type : DataTypes.INTEGER,
            references:{
                model:'recipes',
                key:'idRecipe'
            }
        }
    });
    return recipe_comment;
}