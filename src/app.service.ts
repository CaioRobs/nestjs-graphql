import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  constructor() {}
  checkHealth(): string {
    return `HEALTH CHECK OK`;
  }
}
