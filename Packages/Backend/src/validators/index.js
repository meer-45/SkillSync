import { body } from "express-validator";

// -------------------------------Auth validators---------------------------------------
const userRegisterValidator = () => {
  return [
    body("email")
      .trim()
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Please enter a valid email address"),
    body("username")
      .trim()
      .notEmpty()
      .withMessage("Username is required")
      .isLowercase()
      .withMessage("Username must be lowercase")
      .isLength({ min: 3 })
      .withMessage("Username must be atleast 3 characters long"),
    body("password")
      .trim()
      .notEmpty()
      .withMessage("Password is required")
      .isLength({ min: 8 })
      .withMessage("Password must be atleast 3 characters long"),
  ];
};

const userLoginValidator = () => {
  return [
    body("identifier")
      .trim()
      .notEmpty()
      .withMessage("Email or username is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ];
};

const userChangePasswordValidator = () => {
  return [
    body("oldPass").notEmpty().withMessage("Old password is required"),
    body("newPass").notEmpty().withMessage("New password is required"),
  ];
};

const userForgotPasswordValidator = () => {
  return [
    body("email")
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Please enter a valid email address"),
  ];
};

const userResetForgotPassword = () => {
  return [
    body("newPassword")
      .notEmpty()
      .withMessage("New Password is a required field")
      .isLength({ min: 8 })
      .withMessage("New password must be at least 8 characters long"),
    body("confirmNewPassword")
      .notEmpty()
      .withMessage("This is a required field")
      .isLength({ min: 8 })
      .withMessage("New password must be at least 8 characters long"),
  ];
};

// ------------------------------Skills validators--------------------------------------
const addSkillValidator = () => {
  return [body("skills").notEmpty().withMessage("Skill is required")];
};
const deleteSkillsValidator = () => {
  return [
    body("type")
      .notEmpty()
      .withMessage("Type is required")
      .trim()
      .toLowerCase(),
    body("skills").notEmpty().withMessage("Skill is required"),
  ];
};

export {
  userRegisterValidator,
  userLoginValidator,
  userChangePasswordValidator,
  userForgotPasswordValidator,
  userResetForgotPassword,
  addSkillValidator,
  deleteSkillsValidator,
};
