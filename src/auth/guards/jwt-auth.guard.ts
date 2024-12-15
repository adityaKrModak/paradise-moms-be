import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GqlExecutionContext } from '@nestjs/graphql';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  // Override for GraphQL context
  getRequest(context: ExecutionContext) {
    const ctx = GqlExecutionContext.create(context);
    // For REST requests
    if (context.getType() === 'http') {
      return context.switchToHttp().getRequest();
    }
    // For GraphQL requests
    return ctx.getContext().req;
  }
}
