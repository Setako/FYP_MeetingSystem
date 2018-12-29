import { LoginFailedException } from '@commander/shared/exception/auth/login-failed.exception';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SignOptions } from 'jsonwebtoken';
import uuidv4 from 'uuid/v4';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { User } from '../user/user.model';
import { UserService } from '../user/user.service';
import { JwtPayload } from './dto/jwt-payload.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
    constructor(
        private readonly userService: UserService,
        private readonly jwtService: JwtService,
    ) {}

    async validateUser(payload: JwtPayload) {
        return this.userService.getByUsername(payload.username);
    }

    async login(
        loginDto: LoginDto,
        options: SignOptions = { expiresIn: '7d' },
    ) {
        const user = await this.userService.getByUsername(loginDto.username);
        if (!user) {
            throw new LoginFailedException();
        }

        if (!user.checkPassword(loginDto.password)) {
            throw new LoginFailedException();
        }

        const playload: JwtPayload = {
            username: user.username,
            tokenVerificationCode: user.tokenVerificationCode,
        };

        return this.jwtService.sign(playload, options);
    }

    async register(createUserDto: CreateUserDto) {
        return this.userService.create(createUserDto);
    }

    async refresh(user: User, options: SignOptions = { expiresIn: '7d' }) {
        const playload: JwtPayload = {
            username: user.username,
            tokenVerificationCode: user.tokenVerificationCode,
        };

        return this.jwtService.sign(playload, options);
    }

    async logout(user: User) {
        const updated = await this.userService.getByUsername(user.username);
        updated.tokenVerificationCode = uuidv4();
        return updated.save();
    }
}
