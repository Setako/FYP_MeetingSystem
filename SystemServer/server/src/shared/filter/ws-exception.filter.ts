import { Catch, ArgumentsHost, Optional } from '@nestjs/common';
import { BaseWsExceptionFilter, WsException } from '@nestjs/websockets';
import { MESSAGES } from '@nestjs/core/constants';
import { isObject } from '@nestjs/common/utils/shared.utils';
import { Socket } from 'socket.io';

@Catch()
export class WsExceptionFilter extends BaseWsExceptionFilter {
    constructor(
        @Optional() private readonly action = 'unknown',
        @Optional() private readonly event = 'exception',
        @Optional() private readonly isDisconnectWhenException = false,
    ) {
        super();
    }

    catch(exception: any, host: ArgumentsHost) {
        const client: Socket = host.switchToWs().getClient();

        if (!(exception instanceof WsException)) {
            console.error('WsException: Unknown', exception);
            client.emit(this.event, {
                action: this.action,
                message: MESSAGES.UNKNOWN_EXCEPTION_MESSAGE,
            });
            this.disconnect(client);
            return;
        }

        const result = exception.getError();
        const message = isObject(result) ? result : { message: result };
        client.emit(this.event, { action: this.action, ...message });
        this.disconnect(client);
    }

    private disconnect(client: Socket) {
        return this.isDisconnectWhenException && client.disconnect();
    }
}
