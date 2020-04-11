module.exports = (db,DataTypes) => {
    const step_recipe = db.define('step_recipe',{
        idStep: { type: DataTypes.INTEGER, primaryKey:true, allowNull:false, autoIncrement:true },
        description : { type:DataTypes.TEXT('medium'),allowNull:false },
        idRecipe : {
            type: DataTypes.INTEGER,
            references:{
                model:'recipes',
                key:'idRecipe'
            }
        }
    });
    return step_recipe;
}