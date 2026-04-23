import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// Extends NestJS's built-in passport guard for the 'jwt' strategy.
// Apply this with @UseGuards(JwtAuthGuard) on any controller or route.
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
