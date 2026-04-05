import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const DbUserId = createParamDecorator((_data: unknown, ctx: ExecutionContext): string => {
  const request = ctx.switchToHttp().getRequest<{ dbUserId?: string }>();
  const id = request.dbUserId;
  if (!id) {
    throw new Error('DbUserId decorator used without authenticated request');
  }
  return id;
});
