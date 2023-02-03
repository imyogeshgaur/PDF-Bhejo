import { Request, Response } from "express";
import * as path from "path"
import dotenv from "dotenv";
dotenv.config({ path: path.resolve("./.env") })
import UserService from "../services/user.service";
import decodeUsers from "../helpers/decodeUser.helper";
import { mailToSendPdfLink } from "../helpers/mail.helper";

class UserController {
    private req: Request;
    private res: Response;
    private service: UserService
    constructor(request: Request, response: Response) {
        this.req = request;
        this.res = response;
        this.service = new UserService();
    }

    async getASingleUser() {
        try {
            const id = this.req.params.id;
            const user = await this.service.getASingleUser(id);
            if (user === 0) {
                return this.res.status(200).send({ message: "No User Found !!!" });
            }
            return this.res.status(200).send(user);
        } catch (error) {
            console.log("User's Controller : Internal Server Error !!!", error)
        }
    }

    async updateUser() {
        try {
            const id = this.req.params.id;
            const data = this.req.body;
            const updateData = await this.service.updateUser(id, data);
            if (updateData !== 0) {
                return this.res.status(200).send({ message: "User Details Updated !!!" })
            } else {
                return this.res.status(200).send({ message: "User Details Not Updated !!!" })
            }
        } catch (error) {
            console.log("User's Controller : Internal Server Error !!!", error)
        }
    }

    async deleteUser() {
        try {
            const id = this.req.params.id;
            const deleteData = await this.service.deleteUser(id);
            if (deleteData !== 0) {
                return this.res.status(200).send({ message: "User Deleted !!!" });
            } else {
                return this.res.status(200).send({ message: "User Not Deleted !!!" });
            }
        } catch (error) {
            console.log("User's Controller : Internal Server Error !!!", error)
        }
    }

    //! Authentication Controller

    async signUpUser() {
        try {
            const data = this.req.body;
            const user = await this.service.signUpUser(data);
            if (user === 0) {
                return this.res.status(200).send({ message: "User Already Exist !!!" });
            } else {
                return this.res.status(200).send(user);
            }
        } catch (error) {
            console.log("Auth's Controller : Internal Server Error !!!", error)
        }
    }

    async loginUser() {
        try {
            const data = this.req.body;
            const message = await this.service.loginUser(data);
            if (message === 0) {
                return this.res.status(200).send({ message: "Invalid Credentials !!!" });
            } else {
                return this.res.status(200).send({ message });
            }
        } catch (error) {
            console.log("Auth's Controller : Internal Server Error !!!", error)
        }
    }

    async verifyUser() {
        try {
            const token = this.req.query.token;
            const decodeUser: any = await decodeUsers(token);
            const user = await this.service.verifyUser(decodeUser.userId);
            return this.res.status(200).send(user);
        } catch (error) {
            console.log("Auth's Controller : Internal Server Error !!!", error)
        }
    }
    //? File Controller

    async uploadFile() {
        try {
            const token = this.req.headers.authorization;
            const decodeUser: any = await decodeUsers(token);
            const file = process.env.POST_PDF_URL as string + this.req.file?.filename;
            const filePassword = this.req.body.filePassword;
            const data = { file, filePassword }
            const fileData = await this.service.uploadFile(data, decodeUser.userId);
            if (fileData) {
                if (fileData.filePassword === null) {
                    const message = await mailToSendPdfLink(fileData.file, fileData.name, fileData.email);
                    return this.res.status(201).send({ message });
                } else {
                    const link = `http://${process.env.BASE_URL}/user/pdf/?passReq=true`
                    const message = await mailToSendPdfLink(link, fileData.name, fileData.email);
                    return this.res.status(201).send({ message });
                }
            } else {
                return this.res.status(201).send({ message: "File Not Uploaded !!!" })
            }
        } catch (error) {
            console.log("File's Controller : Internal Server Error !!!", error)
        }
    }
}


export default UserController