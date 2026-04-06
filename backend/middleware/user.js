const JWT_SECRET_USER=process.env.JWT_SECRET_USER
const jwt=require("jsonwebtoken");
function userauthmiddleware(req, res, next) {
    const token = req.headers.token;
    const decodedData = jwt.verify(token, JWT_SECRET_USER);
    if (decodedData) {
        req.userId = decodedData.id;
        next();
    }
    else {
        res.status(403).json({
            message: "incorrect "
        })
    }
}
module.exports={
    userauthmiddleware:userauthmiddleware
}
