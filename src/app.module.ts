import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { GraphQLModule } from '@nestjs/graphql';
import { LoggerModule } from 'nestjs-pino';
import { AppConfigModule } from './config/config.module';
import { MakeModule } from './modules/make/make.module';
import { VehicleModule } from './modules/vehicle/vehicle.module';
import { PrismaModule } from './prisma/prisma.module';
import { DataIngestionProvider } from './data-ingestion.provider';
import { AppService } from './app.service';
import { AppController } from './app.controller';

@Module({
  imports: [
    AppConfigModule,
    LoggerModule.forRootAsync({
      imports: [AppConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        pinoHttp: {
          level: config.get('NODE_ENV') === 'production' ? 'info' : 'debug',
          transport:
            config.get('NODE_ENV') === 'production'
              ? undefined
              : {
                  target: 'pino-pretty',
                  options: {
                    colorize: true,
                    singleLine: false,
                    translateTime: 'SYS:standard',
                  },
                },
        },
      }),
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      typePaths: ['./**/*.graphql'],
      installSubscriptionHandlers: true,
      graphiql: true,
    }),
    PrismaModule,
    MakeModule,
    VehicleModule,
  ],

  controllers: [AppController],
  providers: [AppService, DataIngestionProvider],
})
export class AppModule {}
