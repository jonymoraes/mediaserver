import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';

import * as path from 'path';

//  Exceptions
import { APP_FILTER } from '@nestjs/core';
import { ConfigureException } from 'src/platform/shared/exceptions/configure.exception';

//  Interceptors
import { APP_INTERCEPTOR } from '@nestjs/core';

//  I18n
import {
  QueryResolver,
  HeaderResolver,
  CookieResolver,
  AcceptLanguageResolver,
  I18nModule,
  I18nJsonLoader,
  I18nLanguageInterceptor,
} from 'nestjs-i18n';

//  Database
import { TypeOrmModule } from '@nestjs/typeorm';
import { dataSourceOptions } from 'src/platform/config/settings/typeorm.config';

//  Config
import { ConfigModule } from '@nestjs/config';

//  BullMQ
import { BullModule } from '@nestjs/bullmq';
import { createBullMQRedisConfig } from 'src/platform/config/settings/bullmq.config';

//  Seeders
import { SeedersModule } from './seeder.module';

//  CronJobs
import { ScheduleModule } from '@nestjs/schedule';

//  Modules
import { StorageModule } from './storage.module';
import { AccountModule } from '../modules/account.module';
import { QuotaModule } from './quota.module';
import { ImageModule } from './image.module';
import { VideoModule } from './video.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV}`,
    }),

    I18nModule.forRoot({
      fallbackLanguage: 'en',
      loader: I18nJsonLoader,
      loaderOptions: {
        path: path.join(process.cwd(), 'i18n'),
        watch: true,
      },
      logging: true,
      resolvers: [
        new QueryResolver(['lang']),
        new HeaderResolver(['lang', 'Accept-Language']),
        new CookieResolver(['lang']),
        new AcceptLanguageResolver(),
      ],
    }),

    TypeOrmModule.forRoot(dataSourceOptions),
    EventEmitterModule.forRoot(),
    ScheduleModule.forRoot(),

    BullModule.forRootAsync({
      useFactory: () => ({
        connection: createBullMQRedisConfig(),
      }),
    }),

    StorageModule,
    AccountModule,
    QuotaModule,
    ImageModule,
    VideoModule,

    SeedersModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: ConfigureException,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: I18nLanguageInterceptor,
    },
  ],
})
export class AppModule {}
