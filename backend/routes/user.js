const{Router}=require("express");
const userRouter=Router();
const { userModel } = require("../db");
const jwt = require('jsonwebtoken');
const JWT_SECRET_USER = process.env.JWT_SECRET_USER;
const bcrypt = require('bcrypt');
const { z } = require("zod");

userRouter.post("/signup", async  (req, res)=> {
    const requirebody = z.object({
        email: z.string().email(),
        name: z.string(),
        password: z.string()
    })
    const parseddatawithsuccess = requirebody.safeParse(req.body);
    if (!parseddatawithsuccess.success) {
        res.json({
            message: "incorrect format",
            error: parseddatawithsuccess.error
        })
        return
    }

    const email = req.body.email;
    const password = req.body.password;
    const name = req.body.name;

    let error = false;
    try {
        const hashedpassword = await bcrypt.hash(password, 5);

        await userModel.create({
            email: email,
            password: hashedpassword,
            name: name,
            points:0
        })
    } catch (e) {
        res.json({
            message: "user already exists"
        })
        error = true;
    }
    if (!error) {
        res.json({
            message: "you are logged in"
        })
    }

});

userRouter.post("/signin", async function (req, res) {
    const email = req.body.email;
    const password = req.body.password;

    const user = await userModel.findOne({
        email: email,
    })

    if (!user) {
        res.status(403).json({
            message: "user does not exist in db"
        })
    }

    const passwordmatch = await bcrypt.compare(password, user.password);

    if (passwordmatch) {
        const token = jwt.sign({
            id: user._id
        }, JWT_SECRET_USER)
        res.json({
            token
        })
    } else {
        res.status(403).json({
            message: "incorrect credentials"
        })
    }
});
module.exports={
    userRouter:userRouter
}



