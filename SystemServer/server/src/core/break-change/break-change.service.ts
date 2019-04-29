import { UserService } from '../user/user.service';
import { OnModuleInit, Injectable } from '@nestjs/common';
import { toArray, flatMap, filter } from 'rxjs/operators';

@Injectable()
export class BreakChangeService implements OnModuleInit {
    constructor(private readonly userService: UserService) {}

    onModuleInit() {
        // handle user missing privacy setting
        this.userService
            .findAll({
                'setting.privacy': {
                    $exists: false,
                },
            })
            .pipe(
                flatMap(item =>
                    this.userService.edit(item.username, {
                        setting: {
                            privacy: {
                                allowOtherToSendFirendRequest: true,
                            },
                        },
                    }),
                ),
                toArray(),
                filter(items => items.length !== 0),
            )
            .subscribe(items =>
                console.log(
                    `[Break Change] added privacy setting for ${
                        items.length
                    } users`,
                ),
            );
    }
}
