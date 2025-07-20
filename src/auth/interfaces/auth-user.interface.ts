import { UserRole } from '@/users/entities/user.entity';

export interface AuthUser {
  userId: number;
  email: string;
  role: UserRole;
  firstName?: string;
  lastName?: string;
}

export interface GraphQLContext {
  req: {
    user: AuthUser;
    body?: any;
  };
}

export interface RestRequest {
  user: AuthUser;
}
