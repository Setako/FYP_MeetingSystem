import { Type } from '@angular/core';

export interface WindowData<T> {
    type: Type<T>;
    data: any;
}
