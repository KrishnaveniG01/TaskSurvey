import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: 'yourSecretKey', //  Must match JwtModule
   
    });
  }

  async validate(payload: any) {
     console.log(' JWT validate payload:', payload);
    //  This gets called automatically → attaches to req.user
    return { userId: payload.userId, role: payload.role };
  }
}
