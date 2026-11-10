import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Igual que JwtAuthGuard, pero si no hay token (o es inválido) no lanza 401:
 * deja pasar con `user = null`. Útil para endpoints públicos que además
 * devuelven datos personalizados cuando hay sesión (ej. canReview).
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handleRequest(err: any, user: any): any {
    if (err || !user) return null;
    return user;
  }
}
