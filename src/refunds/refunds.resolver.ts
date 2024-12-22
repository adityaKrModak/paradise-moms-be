import { Resolver } from '@nestjs/graphql';
import { RefundsService } from './refunds.service';

@Resolver()
export class RefundsResolver {
  constructor(private readonly refundsService: RefundsService) {}
}
