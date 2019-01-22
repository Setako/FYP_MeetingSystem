import { Auth } from '@commander/shared/decorator/auth.decorator';
import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { User } from '../user/user.model';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { from } from 'rxjs';
import { map } from 'rxjs/operators';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('login')
    @HttpCode(200)
    async login(@Body() loginDto: LoginDto) {
        return from(this.authService.login(loginDto)).pipe(
            map(token => ({ token })),
        );
    }

    @Post('register')
    async register(@Body() createUserDto: CreateUserDto) {
        await this.authService.register(createUserDto);
    }

    @Post('refresh')
    @HttpCode(200)
    @UseGuards(AuthGuard('jwt'))
    async refresh(@Auth() user: User) {
        return from(this.authService.refresh(user)).pipe(
            map(token => ({ token })),
        );
    }

    @Post('logout')
    @HttpCode(200)
    @UseGuards(AuthGuard('jwt'))
    async logout(@Auth() user: User) {
        await this.authService.logout(user);
    }
}
