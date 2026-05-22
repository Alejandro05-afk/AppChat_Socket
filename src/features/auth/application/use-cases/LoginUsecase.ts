import { AuthError } from "@shared/domain/errors/AppError";
import { User } from "../domain/entities/User";
import { IAuthRepository } from "../domain/repositories/IAuthRepository";

export class LoginUseCase {
    constructor(private readonly authRepo: IAuthRepository){}

    async execute(email: string, password: string): Promise<User> {
        if(!email || !password)
            throw new AuthError('Email and contraseña son requeridos');
        try {
            return await this.authRepo.login(email, password);
        }catch(error){
            throw new AuthError('Credenciales invalidas', error);
        }
    }

}