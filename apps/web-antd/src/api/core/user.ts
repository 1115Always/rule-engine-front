import type { UserInfo } from '@vben/types';

/**
 * 获取用户信息
 */
export async function getUserInfoApi() {
  // 返回固定数据，避免在关闭mock时调用API报错
  return {
    id: '1',
    username: 'admin',
    nickname: 'Administrator',
    avatar: 'https://avatars.githubusercontent.com/u/12345678?v=4',
    email: 'admin@example.com',
    roles: ['admin'],
    permissions: ['*'],
    createTime: '2023-01-01T00:00:00Z',
    lastLoginTime: '2023-12-01T10:00:00Z',
    desc: 'Administrator',
    homePath: '/rule/manage',
    token: 'mock-token',
    realName: 'Administrator',
    userId: '1',
  } as UserInfo;
}
