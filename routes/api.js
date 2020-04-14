const express = require("express");
const app = express();
const router = express.Router();
const db = require('../models');
const CryptoJS = require("crypto-js");
const fs = require('fs');
const util = require("util");
const multer = require("multer");
// const mkdirSync = util.promisify(fs.mkdirSync);

app.model = (model) => db[model];

const storage = multer.diskStorage({
    destination: function(req,file,cb){
        var directory;       
        
        if(req.body.type=="user"){
            directory = "./api/resource/images/users/"+req.body.idOfType;
        }
        if(req.body.type=="ingredient"){
            directory = "./api/resource/images/ingredient/";
        }
        if (fs.existsSync(directory)) {
            console.log("Directory exists.");
        } else {
            fs.mkdirSync(directory,{ recursive:true });
        }
        cb(null,directory);
    },
    filename:function(req,file,cb){
        var extension = file.originalname.split(".");
        cb(null,CryptoJS.SHA1(extension[0])+"-"+Math.round((new Date()).getTime() / 1000)+'.'+extension[1]);
    }
});

const fileFilter = async (req,file,cb) => {
    const body = req.body;
    typeSelct = body.type;        
    console.log(typeSelct);
        
    try {
    finder = await app.model(typeSelct).findByPk(body.idOfType);
        if(finder){
            if(file.mimetype == "image/jpeg" || file.mimetype == "image/jpg" || file.mimetype == "image/png" || file.mimetype == "image/gif"){
                cb(null,true);
            }else{
                req.fileValidationError = 'Suba solo imagenes/gifs';
                return cb('Suba solo imagenes/gifs');
            }
        }else{
            return cb(typeSelct+' don´t exist');
        }
    } catch (error) {
        return cb(error.message);
    }
}

const upload = multer({storage:storage,fileFilter:fileFilter}).single('imageSend');

router.post("/login", (req, res) => {
    const response = new Object();
    var passwordEncripted = CryptoJS.SHA1(req.body.password).toString();
    console.log(passwordEncripted);
    response.status = 'fail';

    db.user.findOne({
        where: {
            email: req.body.email,
        }
    }).then((user) => {
        if (user != null) {
            if (user.password == passwordEncripted) {
                response.status = 'success';
                response.api_token = 'alsjablksjbalkjsbas';
                response.user = user;
            } else {
                response.status = 'fail';
                response.error = 'contraseña incorrecta';
            }
        } else {
            response.status = 'fail';
            response.error = 'usuario inexistente';
            res.send(response);
        }
        res.send(response);
    });

});

router.post('/checkUser', (req, res) => {
    const response = new Object();
    db.user.findOne({ where: { email: req.body.email } })
        .then((user) => {
            if (user != null) {
                response.status = "success";
                response.user = user;
                res.send(response);
            } else {
                response.status = "fail";
                // response.user = user;
                res.send(response);
            }
        });
});

router.get('/getAllUsers', (req, res) => {
    const response = new Object();
    db.user.findAll()
        .then((users) => {
            if (users != null) {
                response.status = "success";
                response.users = users;
                res.send(response);
            } else {
                response.status = "fail";
                // response.user = user;
                res.send(response);
            }
        });
});

router.get('/getChats', async (req, res) => {
    const response = new Object();
    // Se obtienen los user_chat donde se encuentra el usuario
    var base_chats = await db.user_chat.findAll({ include: [db.chat], attributes: ['idChat'], where: { idUser: req.query.idUser }, });
    if (base_chats != null) {
        var chats = [];
        // Se recorren todos los idChat a los que pertenece y se buscan y listan los usuarios de cada uno
        // Se guarda en un array la informacion del chat y los usuarios que pertenecen a cada uno
        for (const chat of base_chats) {
            var new_chat = Object();
            new_chat.id = chat.idChat;
            new_chat.name = chat.chat.nameChat;
            new_chat.users = [];
            var usersByChat = await db.user_chat.findAll({ include: [db.user], attributes: ['idUser'], where: { idChat: chat.idChat } });
            for (const user of usersByChat) {
                var user_in_chat = Object();
                user_in_chat.idUser = user.idUser;
                user_in_chat.names = user.user.names;
                user_in_chat.surnames = user.user.surnames;
                user_in_chat.email = user.user.email;
                new_chat.users.push(user_in_chat);
            }

            // console.log(new_chat);
            chats.push(new_chat);
        }

        // console.log(chats);
        response.status = "success";
        response.chats = chats;
    } else {
        response.status = "fail";
    }
    res.send(response);
    // res.send(base_chats);
});

router.get('/getMessages', async (req, res) => {
    const response = new Object();
    // Se obtienen los user_chat donde se encuentra el usuario

    var whereCondition = {}

    // Si el idChat recibido por el request no es nulo ni vacio se agrega condicion
    if (req.query.idChat != undefined && req.query.idChat != '' && req.query.idChat > 0) {
        whereCondition.idChat = req.query.idChat;
    }
    else {
        response.status = "fail";
        errors = response.errors != undefined ? response.errors : [];
        errors.push("Incorrect idChat");
        response.errors = errors;
    }

    // Si el idChat recibido por el request no es nulo ni vacio se agrega condicion
    if (req.query.idMessage != undefined && req.query.idMessage != '') {
        if (req.query.idMessage > 0) {
            try {
                whereCondition.idMessage = {
                    [db.op.lt]: parseInt(req.query.idMessage)
                };
            } catch (error) {
                console.log(error);

            }
        } else {
            response.status = "fail";
            errors = response.errors != undefined ? response.errors : [];
            errors.push("Incorrect idMessage");
            response.errors = errors;
        }
    }

    if (response.errors == undefined) {

        var user_chat = await db.user_chat.findAll({ where: { idChat: req.query.idChat, idUser: req.query.idUser } });
        if (user_chat != null) {
            var last10Messages = await db.message.findAll({
                where: whereCondition,
                order: [['idMessage', 'DESC']],
                limit: req.query.limit != undefined ? parseInt(req.query.limit) : 10
            });
            if (last10Messages != null) {
                var messages = [];
                // // Se recorren todos los idChat a los que pertenece y se buscan y listan los usuarios de cada uno
                // // Se guarda en un array la informacion del chat y los usuarios que pertenecen a cada uno
                for (const message of last10Messages) {
                    var new_message = Object();
                    new_message.idMessage = message.idMessage;
                    new_message.idChat = message.idChat;
                    new_message.idSender = message.idSender;
                    new_message.message = message.message;
                    new_message.createdAt = message.createdAt;
                    messages.push(new_message);
                }

                response.status = "success";
                response.messages = messages;
            }
        }
    }

    res.send(response);
});

router.post("/checkMail",(req,res) => {
    const response = new Object();
    var body = req.body;
    console.log(body.email);
    
    db.user.findAll({
        where:{email:body.email}
    }).then((err)=>{
        if(err.length!=0){
            response.status="fail";
            response.description="Usuario existente";
            res.send(response);
        }
        if(err.length==0){
            response.status="success";
            response.description="Usuario inexistente";
            res.send(response);
        }
    });
});

router.post("/signup", async (req, res) => {
    const response = new Object();
    var body = req.body;

    const [user,created] = await db.user.findOrCreate({
        where:{email:body.email},
        defaults:{
            names:body.names,
            surnames:body.surnames,
            bornDate:body.bornDate,
            gender:body.gender,
            interestedIn:body.interestedIn,
            email:body.email,
            lookingFor:body.lookingFor,
            lifeStyle:body.lifeStyle,
            password:CryptoJS.SHA1(body.password).toString(),
            f_active:1,
            nickName:body.email.split("@")[0]
        }
    });

    if(created){
        response.status = 'success';
        response.message="user created";
        response.api_token = 'alsjablksjbalkjsbas';
        response.user = user;
    }else{
        response.status="fail";
        response.message="existing user";
    }
    res.send(response);
});

router.post('/uploadImage',async(req,res) => {
    const response = new Object();
    await upload(req,res,async(err)=>{        
        if(err){
            response.status = 'fail';
            response.message = err;
        }else{
            try {
                const image = await db.image.create({
                    type:req.body.type,
                    idOfType:req.body.idOfType,
                    principal:req.body.principal,
                    route:req.file.path
                });
                if(image){
                    response.status = 'success';
                    response.message="Image Uploaded";
                    response.image = image;
                }else{
                    response.status = 'fail';
                    response.message="Something happend";
                }
            } catch (error) {
                response.status = 'fail';
                response.message=error.message;
            }      
        }
        res.send(response);
    });
});

const ingredientFilter = async (req,file,cb)=>{
    // console.log(file);
    if(file.mimetype == "image/jpeg" || file.mimetype == "image/jpg" || file.mimetype == "image/png"){
        cb(null,true);
    }else{
        req.fileValidationError = 'Suba solo imagenes/gifs';
        return cb('Suba solo imagenes/gifs');
    }
}

const uploadIngredient = multer({storage:storage,fileFilter:ingredientFilter}).single('imageSend');

router.post('/saveIngredient',async(req,res)=>{
    const response = new Object();
    var dirImg;
        await uploadIngredient(req,res,async(err)=>{
            if(typeof req.file !== "undefined"){
                response.message="immage send";
                dirImg = "./api/resource/images/ingredient/"+req.file.path;
            }else{
                response.status = 'fail';
                response.message=err;
                dirImg = "./api/resource/images/ingredient/default.jpg";
            }            
            const [ingredient,created] = await db.ingredient.findOrCreate({
                where:{name:req.body.name},
                defaults:{
                    name:req.body.name
                }
            });

            if(created){
                response.status = 'success';
                response.message="ingredient created";
                response.ingredient = ingredient;
                const image = await db.image.create({
                    type:req.body.type,
                    idOfType:ingredient.idIngredient,
                    principal:1,
                    route:dirImg
                });
                if(image){
                    response.messageImage="Image Uploaded";
                    response.image = image;
                }else{
                    response.status = 'fail';
                    response.message="Something happend";
                }
            }else{
                response.status="fail";
                response.message="existing ingredient";
            }
            res.send(response);
        });
});

module.exports = router;
// var dirImage;
        // if (fs.existsSync("./api/resource/images/users/"+user.nickName)) {
        //     console.log("Directory exists.")
        // } else {
        //     fs.mkdirSync("./api/resource/images/users/"+user.nickName,{ recursive:true },(error)=>{
        //         if(error){
        //             console.log(error);
        //         }else{
        //             console.log("Dir creado");
        //         }              
        //     });
        // }
        
        // if(user.profile_picture.length>0){
        //     try {
        //         await writeFile("./api/resource/images/users/" + user.nickName + "/perfilImage.jpg", body.profile_picture, 'base64');
        //         dirImage = "./api/resource/images/users/" + user.nickName + "/perfilImage.jpg";
        //     } catch (error) {
        //         console.error(error);
        //     }
        // }else{
        //     dirImage = "./api/resource/images/users/default/profile.jpg";
        // }

        // const [images,created] = await db.image.findOrCreate({
        //     where:{
        //         kind:"user",
        //         idOfKind:user.idUser,
        //         important:1
        //     },
        //     defaults:{
        //         kind:"user",
        //         idOfKind:user.idUser,
        //         important:1,
        //         route:dirImage
        //     }
        // });
