import type { UserInfo } from '@vben/types';

import { requestClient } from '#/api/request';

/**
 * 获取用户信息
 * 从后端实时查询当前登录用户的信息
 */
export async function getUserInfoApi() {
  return requestClient.get<UserInfo>('/auth/userinfo');
}
