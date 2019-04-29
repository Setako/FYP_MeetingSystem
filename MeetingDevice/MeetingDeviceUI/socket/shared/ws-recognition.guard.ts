import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { ConfigService } from '../core/config.service';

@Injectable()
export class WsRecognitionGuard implements CanActivate {
    constructor(private readonly configService: ConfigService) {}

    canActivate(context: ExecutionContext) {
        const client = context.switchToWs().getClient();

        const recognitionToken =
            context.switchToWs().getData().recognitionToken ||
            client.request.recognitionToken;

        const correctRecognitionToken = this.configService.fromEnvironment(
            'RECOGNITION_TOKEN',
        );

        if (!recognitionToken) {
            throw new WsException(
                'please first emit <recognition-online> to server',
            );
        }

        if (recognitionToken !== correctRecognitionToken) {
            throw new WsException('Recognition token is fake or expired');
        }

        client.request.recognitionToken = correctRecognitionToken;

        return true;
    }
}
