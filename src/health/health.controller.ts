import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  HttpHealthIndicator,
  PrismaHealthIndicator,
  MemoryHealthIndicator,
  DiskHealthIndicator,
} from '@nestjs/terminus';
import { PrismaService } from 'prisma/prisma.service';
import * as os from 'os';
import * as disk from 'check-disk-space';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private http: HttpHealthIndicator,
    private prisma: PrismaHealthIndicator,
    private prismaService: PrismaService,
    private memory: MemoryHealthIndicator,
    private disk: DiskHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.http.pingCheck('nestjs-docs', 'https://docs.nestjs.com'),
      () => this.prisma.pingCheck('prisma', this.prismaService),
      () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024),
      // () =>
      //   this.disk.checkStorage('storage', {
      //     path: os.platform() === 'win32' ? 'C:' : '/',
      //     thresholdPercent: 0.5,
      //   }),
    ]);
  }

  @Get('info')
  async getSystemInfo() {
    const diskSpace = await disk.default(
      os.platform() === 'win32' ? 'c:' : '/',
    );
    let dbVersion = 'disconnected';
    let dbStatus = 'down';
    try {
      const dbVersionResult = await this.prismaService.$queryRaw`SELECT version()`;
      dbVersion = dbVersionResult[0].version;
      dbStatus = 'up';
    } catch (e) {
      // ignore
    }

    return {
      cpu: {
        model: os.cpus()[0].model,
        cores: os.cpus().length,
        load: os.loadavg(),
      },
      memory: {
        total: `${(os.totalmem() / 1024 / 1024 / 1024).toFixed(2)} GB`,
        free: `${(os.freemem() / 1024 / 1024 / 1024).toFixed(2)} GB`,
      },
      disk: {
        total: `${(diskSpace.size / 1024 / 1024 / 1024).toFixed(2)} GB`,
        free: `${(diskSpace.free / 1024 / 1024 / 1024).toFixed(2)} GB`,
      },
      os: {
        platform: os.platform(),
        release: os.release(),
      },
      database: {
        version: dbVersion,
        status: dbStatus,
      },
    };
  }
}
