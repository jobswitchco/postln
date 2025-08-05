import jwt from "jsonwebtoken";
const JWT_SECRET = "NidkPwke9485hfKDLAndu9*#&$&$jcbPOqkPkshEYfk3848Asj"


const generateJWTtoken = async (user_id, email) => {
  return jwt.sign(
    { user_id: user_id, user_email: email },
    JWT_SECRET,
    { expiresIn: "24h" }
  );
};

export default generateJWTtoken
