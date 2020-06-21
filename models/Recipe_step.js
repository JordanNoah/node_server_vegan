module.exports = (db,DataTypes) => {
    const recipe_step = db.define('recipe_step',{
        idStep: { type: DataTypes.INTEGER, primaryKey:true, allowNull:false, autoIncrement:true },
        description : { type:DataTypes.TEXT('medium'),allowNull:false },
        stepNumber: {type: DataTypes.INTEGER,allowNull:false}
    },{
        charset:'utf8',
        collate:'utf8_general_ci'
    });
    return recipe_step;
}