import { Test } from '@nestjs/testing';
import type { TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('returns the API name', () => {
      expect(appController.getHello()).toBe('ApplyFlow API');
    });
  });

  describe('health', () => {
    it('returns the API health status', () => {
      expect(appController.getHealth()).toEqual({
        status: 'ok',
        service: 'applyflow-api',
      });
    });
  });
});
