const express = require("express");
const router = express.Router();
const db = require('../models');
const CryptoJS = require("crypto-js");
const fs = require('fs');
const util = require("util");
const multer = require("multer");
// const mkdirSync = util.promisify(fs.mkdirSync);

const storage = multer.diskStorage({
    destination:async function(req,file,cb){
        var directory;
        if(req.body.type=="user"){
            if (fs.existsSync("./api/resource/images/users/"+req.body.idOfType)) {
                console.log("Directory exists.");
                directory = "./api/resource/images/users/"+req.body.idOfType;
            } else {
                fs.mkdirSync("./api/resource/images/users/"+req.body.idOfType,{ recursive:true });
                directory = "./api/resource/images/users/"+req.body.idOfType;
            }
        }
        cb(null,directory);
    },
    filename:function(req,file,cb){
        var extension = file.originalname.split(".");
        cb(null,CryptoJS.SHA1(extension[0])+"-"+Math.round((new Date()).getTime() / 1000)+'.'+extension[1]);
    }
});

const fileFilter = (req,file,cb) => {
    if(file.mimetype == "image/jpeg" || file.mimetype == "image/jpg" || file.mimetype == "image/png" || file.mimetype == "image/gif"){
        cb(null,true);
    }else{
        req.fileValidationError = 'Suba solo imagenes/gifs';
        return cb('Suba solo imagenes/gifs');
    }
}

const upload = multer({storage:storage,fileFilter:fileFilter}).single('imageSend');


router.post('/uploadImage',(req,res) => {
    const response = new Object(); 
    
    upload(req,res, async (err) =>{
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
            new_chat.name = chat.chat.nombreChat;
            new_chat.users = [];
            var usersByChat = await db.user_chat.findAll({ include: [db.user], attributes: ['idUser'], where: { idChat: chat.idChat } });
            for (const user of usersByChat) {
                var user_in_chat = Object();
                user_in_chat.idUser = user.idUser;
                user_in_chat.names = user.user.names;
                user_in_chat.lasts_names = user.user.lasts_names;
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
    response.status = "fail";
    // Se obtienen los user_chat donde se encuentra el usuario
    var user_chat = await db.user_chat.findAll({ where: { idChat: req.query.idChat, idUser: req.query.idUser } });
    if (user_chat != null) {
        var last10Messages = await db.message.findAll({
            where: {
                idChat: req.query.idChat,
                createdAt: {
                    [db.op.lt]: new Date(req.query.sinceDate)
                },
            },
            order: [['createdAt', 'ASC']],
            limit: req.query.limit!=undefined?parseInt(req.query.limit):10
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

            // // console.log(chats);
            response.status = "success";
            // response.chats = chats;
            response.messages = messages;
        }
    }

    res.send(response);
    // res.send(base_chats);
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
            lasts_names:body.lasts_names,
            bornDate:body.bornDate,
            gender:body.gender,
            interested_in:body.interested_in,
            email:body.email,
            looking_for:body.looking_for,
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
    res.send(response)
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
