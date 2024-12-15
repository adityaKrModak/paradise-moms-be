import { Resolver } from '@nestjs/graphql';
import { AuthAccountsService } from './auth-accounts.service';

@Resolver()
export class AuthAccountsResolver {
  constructor(private readonly authAccountsService: AuthAccountsService) {}
}
