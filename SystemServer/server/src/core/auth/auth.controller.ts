import { Controller, Post, Body, UseGuards, HttpCode } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { AuthGuard } from '@nestjs/passport';
import { Auth } from '../../decorator/auth.decorator';
import { User as UserModel } from '../user/user.model';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('login')
    @HttpCode(200)
    async login(@Body() loginDto: LoginDto) {
        return {
            token: await this.authService.login(loginDto),
        };
    }

    @Post('register')
    async register(@Body() createUserDto: CreateUserDto) {
        await this.authService.register(createUserDto);
    }

    @Post('refresh')
    @HttpCode(200)
    @UseGuards(AuthGuard('jwt'))
    async refresh(@Auth() user: UserModel) {
        return {
            token: await this.authService.refresh(user),
        };
    }

    @Post('logout')
    @HttpCode(200)
    @UseGuards(AuthGuard('jwt'))
    async logout(@Auth() user: UserModel) {
        this.authService.logout(user);
    }
}
