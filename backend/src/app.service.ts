import { Injectable } from '@nestjs/common';

export interface HealthStatus {
  status: 'ok';
  service: 'applyflow-api';
}

@Injectable()
export class AppService {
  getHello(): string {
    return 'ApplyFlow API';
  }

  getHealth(): HealthStatus {
    return {
      status: 'ok',
      service: 'applyflow-api',
    };
  }
}
